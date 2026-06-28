import { createServiceClient } from '@/lib/supabase/admin';
import { createEmbeddings, transcribeAudio } from '@/lib/ai/openai';
import {
  detectCriticalItems,
  extractEntities,
  generateSunnyUpdate,
  summarizeContent,
} from '@/lib/ai/sunny';
import { chunkText, chunkByPages, chunkBySheets } from '@/lib/processing/chunk';
import {
  extractTextFromBuffer,
  parseEmailMetadata,
  parseEmailBody,
} from '@/lib/processing/extract';
import { isProcessable, AUDIO_EXTENSIONS, getFileExtension } from '@/lib/constants';
import { parseSpreadsheetBuffer } from '@/lib/processing/spreadsheet';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { normalizeEntityName } from '@/lib/utils';
import { redactPhi, redactPhiPages } from '@/lib/compliance/phi-redact';
import {
  embeddingPercent,
  updateFileProgress,
  type FileProcessingProgress,
} from '@/lib/processing/progress';
import {
  getChunkConfig,
  isLargeDocument,
  shouldPauseForTimeBudget,
  type ProcessFileResult,
} from '@/lib/processing/large-file';
import { extractRelevantActionItems } from '@/lib/relevance/extract-relevant-actions';
import type { Citation, SourceType } from '@/types/database';

interface ProcessFileOptions {
  fileId: string;
  projectId: string;
  fileName: string;
  sourceType: SourceType;
  buffer?: Buffer;
  pastedText?: string;
  resume?: boolean;
}

async function countExistingChunks(
  supabase: ReturnType<typeof createServiceClient>,
  fileId: string
): Promise<number> {
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('file_id', fileId);
  return count ?? 0;
}

async function shouldRedactPhi(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string
): Promise<boolean> {
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single();

  if (!project?.organization_id) return false;

  const { data: organization } = await supabase
    .from('organizations')
    .select('phi_protection_enabled')
    .eq('id', project.organization_id)
    .single();

  return organization?.phi_protection_enabled ?? false;
}

function applyPhiRedaction(
  text: string,
  pages: Array<{ pageNumber: number; text: string }> | undefined,
  metadata: Record<string, unknown>
): {
  text: string;
  pages?: Array<{ pageNumber: number; text: string }>;
  metadata: Record<string, unknown>;
} {
  if (pages?.length) {
    const redacted = redactPhiPages(pages);
    return {
      text: redacted.pages.map((page) => page.text).join('\n\n'),
      pages: redacted.pages,
      metadata: {
        ...metadata,
        phi_redacted: true,
        phi_redaction_count: redacted.redactionCount,
        phi_categories: redacted.categories,
      },
    };
  }

  const redacted = redactPhi(text);
  return {
    text: redacted.text,
    pages,
    metadata: {
      ...metadata,
      phi_redacted: redacted.redactionCount > 0,
      phi_redaction_count: redacted.redactionCount,
      phi_categories: redacted.categories,
    },
  };
}

export async function processFile(options: ProcessFileOptions): Promise<ProcessFileResult> {
  const supabase = createServiceClient();
  const { fileId, projectId, fileName, sourceType, resume = false } = options;
  const startedAt = Date.now();

  const { data: existingFile } = await supabase
    .from('files')
    .select('metadata, extracted_text')
    .eq('id', fileId)
    .single();

  let metadata: Record<string, unknown> = {
    ...((existingFile?.metadata as Record<string, unknown> | undefined) ?? {}),
  };
  const processingPhase = (metadata.processing_phase as string | undefined) ?? 'extract';

  const report = async (progress: Omit<FileProcessingProgress, 'updated_at'>) => {
    await updateFileProgress(supabase, fileId, progress, metadata);
    metadata = {
      ...metadata,
      processing_progress: {
        ...progress,
        updated_at: new Date().toISOString(),
      },
    };
  };

  const setPhase = async (phase: string) => {
    metadata = { ...metadata, processing_phase: phase };
    await supabase.from('files').update({ metadata }).eq('id', fileId);
  };

  await supabase
    .from('files')
    .update({ status: 'processing' })
    .eq('id', fileId);

  await report({
    stage: resume ? 'embedding' : 'queued',
    percent: resume ? 20 : 5,
    label: resume ? 'Resuming indexing…' : 'Starting processing…',
  });

  try {
    let text = options.pastedText ?? existingFile?.extracted_text ?? '';
    let pages: Array<{ pageNumber: number; text: string }> | undefined;
    let sheets: Array<{ name: string; rows: string[][] }> | undefined;
    const ext = getFileExtension(fileName);
    const resolvedSourceType =
      ext === '.xlsx' || ext === '.xls' ? 'csv' : sourceType;

    const existingChunkCount = resume ? await countExistingChunks(supabase, fileId) : 0;
    const skipExtract =
      resume &&
      Boolean(text.trim()) &&
      existingChunkCount > 0 &&
      (processingPhase === 'embedding' || processingPhase === 'analyzing');

    if (!skipExtract) {
      if (!resume) {
        await supabase.from('chunks').delete().eq('file_id', fileId);
        await supabase.from('entities').delete().eq('source_file_id', fileId);
        await setPhase('extract');
      }

      await report({ stage: 'extracting', percent: 8, label: 'Extracting text…' });

      if (options.buffer) {
        if (AUDIO_EXTENSIONS.includes(ext)) {
          text = await transcribeAudio(options.buffer, fileName);
          metadata = { ...metadata, transcribed: true, source_type: 'transcript' };
        } else if (isProcessable(fileName)) {
          if (ext === '.xlsx' || ext === '.xls') {
            const parsed = await parseSpreadsheetBuffer(options.buffer);
            text = parsed.text;
            sheets = parsed.sheets;
            metadata = {
              ...metadata,
              ...parsed.stats,
              sheet_count: parsed.stats.sheets,
              source_type: 'csv',
            };
          } else {
            const extracted = await extractTextFromBuffer(options.buffer, fileName);
            text = extracted.text;
            pages = extracted.pages;
          }

          if (ext === '.eml') {
            const emailMeta = parseEmailMetadata(text);
            metadata = { ...metadata, ...emailMeta, source_type: 'email' };
            text = parseEmailBody(text);
          }
        } else {
          await supabase
            .from('files')
            .update({ status: 'uploaded_unprocessed', metadata })
            .eq('id', fileId);

          await supabase.from('timeline_events').insert({
            project_id: projectId,
            event_type: 'file_upload',
            title: `Uploaded: ${fileName}`,
            description: 'File stored but not processed (unsupported format)',
            source_file_id: fileId,
          });
          return { completed: false, stage: 'unsupported' };
        }
      }

      if (!text.trim()) {
        await supabase
          .from('files')
          .update({ status: 'failed', metadata: { ...metadata, error: 'No text extracted' } })
          .eq('id', fileId);
        await report({
          stage: 'failed',
          percent: 0,
          label: 'Processing failed',
          detail: 'No text could be extracted from this file',
        });
        return { completed: false, stage: 'failed' };
      }

      if (await shouldRedactPhi(supabase, projectId)) {
        const redacted = applyPhiRedaction(text, pages, metadata);
        text = redacted.text;
        pages = redacted.pages;
        metadata = redacted.metadata;
        await report({
          stage: 'extracting',
          percent: 12,
          label: 'Redacting protected health information…',
        });
      }

      await report({
        stage: 'extracting',
        percent: 15,
        label: pages?.length
          ? `Extracted ${pages.length} pages`
          : sheets?.length
            ? `Extracted ${sheets.length} sheet(s)`
            : 'Text extracted',
      });

      await supabase
        .from('files')
        .update({
          extracted_text: text,
          source_type: resolvedSourceType,
          metadata: { ...metadata, source_type: resolvedSourceType },
        })
        .eq('id', fileId);
    } else if (options.buffer && (ext === '.xlsx' || ext === '.xls')) {
      const parsed = await parseSpreadsheetBuffer(options.buffer);
      sheets = parsed.sheets;
      text = parsed.text;
    }

    await report({ stage: 'chunking', percent: 18, label: 'Preparing searchable sections…' });

    const chunkConfig = getChunkConfig(text.length);
    const chunkBase = { source_type: resolvedSourceType, file_name: fileName, ...metadata };
    const textChunks = sheets
      ? chunkBySheets(sheets, chunkBase, chunkConfig.rowsPerSheetChunk)
      : pages
        ? chunkByPages(pages, chunkBase, chunkConfig)
        : chunkText(text, chunkBase, chunkConfig);

    const largeFile = isLargeDocument(text.length, textChunks.length);
    metadata = {
      ...metadata,
      char_count: text.length,
      chunk_count: textChunks.length,
      page_count: pages?.length,
      is_large_file: largeFile,
    };
    await supabase.from('files').update({ metadata }).eq('id', fileId);

    const startIndex = resume ? existingChunkCount : 0;
    const batchSize = textChunks.length > 300 ? 30 : 20;
    const insertBatchSize = 50;
    const indexingLabel = largeFile ? 'Indexing large file…' : 'Building search index…';

    await report({
      stage: 'embedding',
      percent: embeddingPercent(startIndex, textChunks.length),
      label: startIndex > 0 ? 'Resuming search indexing…' : indexingLabel,
      chunks_done: startIndex,
      chunks_total: textChunks.length,
      detail: `${startIndex} of ${textChunks.length} sections indexed`,
    });
    await setPhase('embedding');

    if (startIndex >= textChunks.length) {
      // Embedding already complete — jump to analysis
    } else for (let i = startIndex; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize);
      const embeddings = await createEmbeddings(batch.map((c) => c.text));

      const chunkRows = batch.map((chunk, j) => ({
        project_id: projectId,
        file_id: fileId,
        chunk_index: chunk.index,
        text: chunk.text,
        embedding: embeddings[j],
        metadata: chunk.metadata,
      }));

      for (let j = 0; j < chunkRows.length; j += insertBatchSize) {
        const insertBatch = chunkRows.slice(j, j + insertBatchSize);
        const { error: insertError } = await supabase.from('chunks').insert(insertBatch);
        if (insertError) {
          throw new Error(`Chunk insert failed: ${insertError.message}`);
        }
      }

      const done = Math.min(i + batch.length, textChunks.length);
      await report({
        stage: 'embedding',
        percent: embeddingPercent(done, textChunks.length),
        label: indexingLabel,
        chunks_done: done,
        chunks_total: textChunks.length,
        detail: `${done} of ${textChunks.length} sections indexed`,
      });

      if (shouldPauseForTimeBudget(startedAt) && done < textChunks.length) {
        await setPhase('embedding');
        await report({
          stage: 'embedding',
          percent: embeddingPercent(done, textChunks.length),
          label: 'Large file. Continuing indexing…',
          chunks_done: done,
          chunks_total: textChunks.length,
          detail: `${done} of ${textChunks.length} sections indexed (resumes automatically)`,
        });
        return { completed: false, stage: 'embedding', chunkCount: textChunks.length };
      }
    }

    await setPhase('analyzing');

    if (resume && processingPhase === 'analyzing') {
      await supabase.from('entities').delete().eq('source_file_id', fileId);
    }

    await report({
      stage: 'analyzing',
      percent: 78,
      label: 'Analyzing content with Sunny…',
      chunks_done: textChunks.length,
      chunks_total: textChunks.length,
    });

    const entities = await extractEntities(text, fileName);
    for (const entity of entities) {
      await supabase.from('entities').insert({
        project_id: projectId,
        type: entity.type,
        name: entity.name,
        normalized_name: normalizeEntityName(entity.name),
        source_file_id: fileId,
      });
    }

    await report({ stage: 'analyzing', percent: 82, label: 'Extracting action items…' });

    const { data: fileMeta } = await supabase
      .from('files')
      .select('uploaded_by')
      .eq('id', fileId)
      .single();
    const { data: projectMeta } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    const relevanceUserId = fileMeta?.uploaded_by ?? projectMeta?.owner_id;
    let actionItems: Awaited<ReturnType<typeof extractRelevantActionItems>> = [];

    if (relevanceUserId) {
      actionItems = await extractRelevantActionItems(
        projectId,
        relevanceUserId,
        text,
        fileName,
        sourceType
      );
    }

    for (const item of actionItems) {
      if (!item.title?.trim()) continue;
      await supabase.from('action_items').insert({
        project_id: projectId,
        title: item.title,
        description: item.description,
        owner: item.owner,
        due_date: item.due_date,
        applies_to_me: item.applies_to_me ?? true,
        item_kind: item.item_kind ?? null,
        matched_terms: item.matched_terms ?? [],
        source_citations: [{ file_name: fileName, snippet: item.title }] as Citation[],
      });
    }

    await report({ stage: 'analyzing', percent: 88, label: 'Summarizing…' });

    const summary = await summarizeContent(text, fileName);

    const { data: existingChunks } = await supabase
      .from('chunks')
      .select('text')
      .eq('project_id', projectId)
      .neq('file_id', fileId)
      .limit(10);

    const existingContent = (existingChunks ?? []).map((c) => c.text).join('\n\n');

    await report({ stage: 'analyzing', percent: 92, label: 'Checking for critical items…' });

    const criticalItems = await detectCriticalItems(text, existingContent, fileName);
    for (const item of criticalItems) {
      const citation: Citation = {
        file_id: fileId,
        file_name: fileName,
        source_type: sourceType,
        snippet: text.slice(0, 200),
      };

      await supabase.from('critical_items').insert({
        project_id: projectId,
        title: item.title,
        summary: item.summary,
        severity: item.severity,
        category: item.category,
        sunny_reasoning: item.sunny_reasoning,
        suggested_owner: item.suggested_owner,
        suggested_next_action: item.suggested_next_action,
        source_citations: [citation],
      });

      if (item.category === 'conflict') {
        await supabase.from('timeline_events').insert({
          project_id: projectId,
          event_type: 'contradiction',
          title: item.title,
          description: item.summary,
          source_file_id: fileId,
        });
      }
    }

    await report({ stage: 'finishing', percent: 96, label: 'Saving Sunny update…' });

    if (criticalItems.length > 0) {
      const update = await generateSunnyUpdate(
        fileName,
        criticalItems.map((c) => c.summary).join('\n')
      );

      await supabase.from('sunny_updates').insert({
        project_id: projectId,
        title: update.title,
        summary: update.summary,
        why_it_matters: update.why_it_matters,
        suggested_action: update.suggested_action,
        source_citations: [{ file_id: fileId, file_name: fileName, snippet: summary }] as Citation[],
      });
    } else {
      await supabase.from('sunny_updates').insert({
        project_id: projectId,
        title: `New ${sourceType} processed: ${fileName}`,
        summary,
        why_it_matters: formatNaturalSummary('New project material has been added and indexed.'),
        suggested_action: formatNaturalSummary('Review the uploaded content for any follow-up needed.'),
        source_citations: [{ file_id: fileId, file_name: fileName, snippet: summary }] as Citation[],
      });
    }

    await supabase.from('timeline_events').insert([
      {
        project_id: projectId,
        event_type: sourceType === 'email' ? 'email' : sourceType === 'meeting' ? 'meeting' : 'file_upload',
        title: `Uploaded: ${fileName}`,
        description: summary,
        source_file_id: fileId,
      },
      {
        project_id: projectId,
        event_type: 'sunny_summary',
        title: `Sunny summarized: ${fileName}`,
        description: summary,
        source_file_id: fileId,
      },
    ]);

    if (actionItems.length > 0) {
      await supabase.from('timeline_events').insert({
        project_id: projectId,
        event_type: 'action_item',
        title: `${actionItems.length} action item(s) extracted`,
        description: actionItems.map((a) => a.title).join('; '),
        source_file_id: fileId,
      });
    }

    const updateFields: Record<string, unknown> = {
      last_summary: summary,
      last_activity_at: new Date().toISOString(),
    };

    if (criticalItems.some((c) => c.severity === 'critical' || c.severity === 'high')) {
      updateFields.status = 'critical';
    } else if (criticalItems.length > 0) {
      updateFields.status = 'watch';
    }

    await supabase.from('projects').update(updateFields).eq('id', projectId);

    const finalMetadata = {
      ...metadata,
      source_type: resolvedSourceType,
      chunk_count: textChunks.length,
      processing_phase: 'done',
      processing_lock: null,
      processing_progress: {
        stage: 'complete',
        percent: 100,
        label: 'Ready for search',
        chunks_done: textChunks.length,
        chunks_total: textChunks.length,
        updated_at: new Date().toISOString(),
      } satisfies FileProcessingProgress,
    };

    await supabase
      .from('files')
      .update({ status: 'processed', metadata: finalMetadata })
      .eq('id', fileId);

    return { completed: true, stage: 'complete', chunkCount: textChunks.length };
  } catch (error) {
    console.error('File processing error:', error instanceof Error ? error.message : 'Unknown');
    const message = error instanceof Error ? error.message : 'Processing failed';
    await supabase
      .from('files')
      .update({
        status: 'failed',
        metadata: {
          ...metadata,
          processing_lock: null,
          error: message,
          processing_progress: {
            stage: 'failed',
            percent: metadata.processing_progress
              ? (metadata.processing_progress as FileProcessingProgress).percent
              : 0,
            label: 'Processing failed',
            detail: message,
            updated_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', fileId);
    return { completed: false, stage: 'failed' };
  }
}
