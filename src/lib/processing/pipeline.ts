import { createServiceClient } from '@/lib/supabase/admin';
import { createEmbeddings, transcribeAudio } from '@/lib/ai/openai';
import {
  detectCriticalItems,
  extractActionItems,
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
import type { Citation, SourceType } from '@/types/database';

interface ProcessFileOptions {
  fileId: string;
  projectId: string;
  fileName: string;
  sourceType: SourceType;
  buffer?: Buffer;
  pastedText?: string;
}

export async function processFile(options: ProcessFileOptions): Promise<void> {
  const supabase = createServiceClient();
  const { fileId, projectId, fileName, sourceType } = options;

  await supabase
    .from('files')
    .update({ status: 'processing' })
    .eq('id', fileId);

  try {
    let text = options.pastedText ?? '';
    let metadata: Record<string, unknown> = {};
    let pages: Array<{ pageNumber: number; text: string }> | undefined;
    let sheets: Array<{ name: string; rows: string[][] }> | undefined;
    const ext = getFileExtension(fileName);
    const resolvedSourceType =
      ext === '.xlsx' || ext === '.xls' ? 'csv' : sourceType;

    await supabase.from('chunks').delete().eq('file_id', fileId);

    if (options.buffer) {
      if (AUDIO_EXTENSIONS.includes(ext)) {
        text = await transcribeAudio(options.buffer, fileName);
        metadata = { transcribed: true, source_type: 'transcript' };
      } else if (isProcessable(fileName)) {
        if (ext === '.xlsx' || ext === '.xls') {
          const parsed = await parseSpreadsheetBuffer(options.buffer);
          text = parsed.text;
          sheets = parsed.sheets;
          metadata = { ...metadata, sheet_count: parsed.sheets.length, source_type: 'csv' };
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
          .update({ status: 'uploaded_unprocessed' })
          .eq('id', fileId);

        await supabase.from('timeline_events').insert({
          project_id: projectId,
          event_type: 'file_upload',
          title: `Uploaded: ${fileName}`,
          description: 'File stored but not processed (unsupported format)',
          source_file_id: fileId,
        });
        return;
      }
    }

    if (!text.trim()) {
      await supabase
        .from('files')
        .update({ status: 'failed', metadata: { error: 'No text extracted' } })
        .eq('id', fileId);
      return;
    }

    // Keep extracted text while indexing continues
    await supabase
      .from('files')
      .update({
        extracted_text: text,
        source_type: resolvedSourceType,
        metadata: { ...metadata, source_type: resolvedSourceType },
      })
      .eq('id', fileId);

    const chunkBase = { source_type: resolvedSourceType, file_name: fileName, ...metadata };
    const textChunks = sheets
      ? chunkBySheets(sheets, chunkBase)
      : pages
        ? chunkByPages(pages, chunkBase)
        : chunkText(text, chunkBase);

    // Generate embeddings in batches
    const batchSize = 20;
    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize);
      const embeddings = await createEmbeddings(batch.map((c) => c.text));

      const chunkRows = batch.map((chunk, j) => ({
        project_id: projectId,
        file_id: fileId,
        chunk_index: chunk.index,
        text: chunk.text,
        embedding: JSON.stringify(embeddings[j]),
        metadata: chunk.metadata,
      }));

      // Insert chunks — embedding stored as vector via raw SQL
      for (const row of chunkRows) {
        const embedding = embeddings[chunkRows.indexOf(row)];
        await supabase.from('chunks').insert({
          project_id: row.project_id,
          file_id: row.file_id,
          chunk_index: row.chunk_index,
          text: row.text,
          embedding: embedding,
          metadata: row.metadata,
        });
      }
    }

    // Extract entities
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

    // Extract action items
    const actionItems = await extractActionItems(text, fileName);
    for (const item of actionItems) {
      if (!item.title?.trim()) continue;
      await supabase.from('action_items').insert({
        project_id: projectId,
        title: item.title,
        description: item.description,
        owner: item.owner,
        due_date: item.due_date,
        source_citations: [{ file_name: fileName, snippet: item.title }] as Citation[],
      });
    }

    // Summarize
    const summary = await summarizeContent(text, fileName);

    // Get existing content for contradiction detection
    const { data: existingChunks } = await supabase
      .from('chunks')
      .select('text')
      .eq('project_id', projectId)
      .neq('file_id', fileId)
      .limit(10);

    const existingContent = (existingChunks ?? []).map((c) => c.text).join('\n\n');

    // Detect critical items
    const criticalItems = await detectCriticalItems(text, existingContent, fileName);
    for (const item of criticalItems) {
      const citation: Citation = {
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

    // Create Sunny update if critical items found
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
        source_citations: [{ file_name: fileName, snippet: summary }] as Citation[],
      });
    } else {
      await supabase.from('sunny_updates').insert({
        project_id: projectId,
        title: `New ${sourceType} processed: ${fileName}`,
        summary,
        why_it_matters: formatNaturalSummary('New project material has been added and indexed.'),
        suggested_action: formatNaturalSummary('Review the uploaded content for any follow-up needed.'),
        source_citations: [{ file_name: fileName, snippet: summary }] as Citation[],
      });
    }

    // Timeline events
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

    // Update project
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

    await supabase
      .from('files')
      .update({ status: 'processed', metadata: { ...metadata, source_type: resolvedSourceType, chunk_count: textChunks.length } })
      .eq('id', fileId);
  } catch (error) {
    console.error('File processing error:', error instanceof Error ? error.message : 'Unknown');
    await supabase
      .from('files')
      .update({ status: 'failed', metadata: { error: 'Processing failed' } })
      .eq('id', fileId);
  }
}
