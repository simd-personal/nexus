import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEmbeddingOrNull } from '@/lib/ai/openai';
import { formatStreamError } from '@/lib/ai/errors';
import {
  streamSearchAnswer,
  classifyChatIntent,
  isCreateAction,
  executeCreateStream,
  resolveEngine,
} from '@/lib/ai/stream-agent';
import { retrieveForQuery } from '@/lib/search/retrieve';
import { toSearchContext } from '@/lib/search/retrieve';
import { filterSubstantiveChunks, formatNaturalProse } from '@/lib/ai/generation-prompts';
import {
  normalizeProjectId,
  filterResultsToProject,
  buildProjectSummary,
  buildScopeInstruction,
  chunksForAnswer,
} from '@/lib/search/scope';
import { SEARCH_RETRIEVAL_LIMIT, PROJECT_RETRIEVAL_LIMIT } from '@/lib/search/context-limits';
import { getOrCreateSession, saveChatMessage, deleteLastAssistantMessage } from '@/lib/chat/sessions';
import { buildHistoryNote, loadSessionHistory } from '@/lib/chat/memory';
import { encodeSse } from '@/lib/sse';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { query, project_id, source_type, session_id, model_preference, regenerate, limit = SEARCH_RETRIEVAL_LIMIT } = await request.json();
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });
  }

  const scopedProjectId = normalizeProjectId(project_id);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Parameters<typeof encodeSse>[0]) => {
        controller.enqueue(new TextEncoder().encode(encodeSse(event)));
      };

      try {
        const session = await getOrCreateSession(supabase, user.id, {
          sessionId: session_id,
          sessionType: 'search',
          projectId: scopedProjectId,
          title: query.slice(0, 80),
        });

        send({ event: 'session', data: { session_id: session.id, title: session.title ?? undefined } });

        if (regenerate) {
          await deleteLastAssistantMessage(supabase, session.id);
        } else {
          await saveChatMessage(supabase, {
            session_id: session.id,
            project_id: scopedProjectId,
            role: 'user',
            content: query,
          });
        }

        send({
          event: 'status',
          data: {
            message: scopedProjectId
              ? 'Searching this project...'
              : 'Searching across your projects...',
          },
        });

        const embedding = await createEmbeddingOrNull(query);
        const retrieved = filterResultsToProject(
          await retrieveForQuery(supabase, query, embedding, {
            projectId: scopedProjectId,
            limit,
          }),
          scopedProjectId
        );

        let results = retrieved.map((r) => ({
          id: r.id,
          project_id: r.project_id,
          file_id: r.file_id,
          chunk_index: r.chunk_index ?? 0,
          text: r.text,
          metadata: r.metadata,
          similarity: r.similarity,
          rank: r.rank,
          match_reason: r.match_reason,
          file_name: r.file_name,
          source_type: r.source_type,
          client_name: r.client_name,
          project_name: r.project_name,
        }));

        if (source_type) {
          results = results.filter((r) => r.source_type === source_type);
        }

        send({ event: 'results', data: { results: results.slice(0, limit) } });

        const projectIds = [...new Set(results.map((r) => r.project_id))];
        const { summary: projectSummary, label: projectLabel } = await buildProjectSummary(
          supabase,
          scopedProjectId,
          projectIds
        );
        const scopeInstruction = buildScopeInstruction(scopedProjectId, projectLabel);

        const history = await loadSessionHistory(supabase, session.id);
        const historyNote = buildHistoryNote(history.slice(0, -1));

        send({ event: 'status', data: { message: 'Understanding your request...' } });
        const intent = await classifyChatIntent(
          query,
          history.slice(0, -1) as Array<{ role: 'user' | 'assistant'; content: string }>
        );

        // If the user asked Sunny to CREATE something (deck, email, brief, etc.),
        // resolve a project and actually build it — even from the global search chat.
        if (isCreateAction(intent.action)) {
          const createEngine = resolveEngine(model_preference, 'create');
          const targetProjectId = scopedProjectId ?? results[0]?.project_id ?? null;

          if (!targetProjectId) {
            const msg = "Tell me which project this is for (or open a project) and I'll create it. I couldn't find matching materials to build from.";
            for (const ch of msg) send({ event: 'token', data: { text: ch } });
            send({ event: 'meta', data: { confidence: 'low', model: createEngine, results_count: results.length } });
            await saveChatMessage(supabase, {
              session_id: session.id, project_id: null, role: 'assistant', content: msg,
              metadata: { model: createEngine },
            });
            send({ event: 'done', data: { session_id: session.id } });
            return;
          }

          send({ event: 'status', data: { message: 'Gathering project materials...' } });
          const createEmbeddingVec = await createEmbeddingOrNull(query);
          const [{ data: targetProject }, createRetrieved, { data: projCritical }, { data: projTimeline }] =
            await Promise.all([
              supabase.from('projects').select('id, client_name, project_name, last_summary').eq('id', targetProjectId).single(),
              retrieveForQuery(supabase, query, createEmbeddingVec, {
                projectId: targetProjectId,
                limit: PROJECT_RETRIEVAL_LIMIT,
              }),
              supabase.from('critical_items').select('title, summary, severity').eq('project_id', targetProjectId).eq('status', 'open').limit(8),
              supabase.from('timeline_events').select('title, description, created_at').eq('project_id', targetProjectId).order('created_at', { ascending: false }).limit(12),
            ]);

          const createContext = {
            chunks: filterSubstantiveChunks(toSearchContext(createRetrieved)),
            criticalItems: projCritical ?? [],
            timelineEvents: projTimeline ?? [],
            projectSummary: targetProject?.last_summary ?? null,
          };

          let createText = '';
          const createResponse = await executeCreateStream({
            action: intent.action,
            message: query,
            instructions: intent.instructions,
            email_version: intent.email_version,
            context: createContext,
            project: {
              id: targetProjectId,
              client_name: targetProject?.client_name ?? 'Client',
              project_name: targetProject?.project_name ?? 'Project',
            },
            supabase,
            userId: user.id,
            engine: createEngine,
            onStatus: (m) => send({ event: 'status', data: { message: m } }),
            onToken: (token) => {
              createText += token;
              send({ event: 'token', data: { text: token } });
            },
          });

          if (createResponse.artifact) {
            send({ event: 'artifact', data: createResponse.artifact });
          }
          send({
            event: 'meta',
            data: {
              citations: createResponse.citations,
              confidence: createResponse.confidence,
              actions_taken: createResponse.actions_taken,
              model: createResponse.model,
            },
          });

          const createContent = createText || createResponse.answer;
          await saveChatMessage(supabase, {
            session_id: session.id,
            project_id: targetProjectId,
            role: 'assistant',
            content:
              createResponse.artifact?.type === 'deck'
                ? createContent
                : formatNaturalProse(createContent),
            citations: createResponse.citations,
            metadata: {
              confidence: createResponse.confidence,
              artifact: createResponse.artifact,
              actions_taken: createResponse.actions_taken,
              model: createResponse.model,
            },
          });

          send({ event: 'done', data: { session_id: session.id } });
          return;
        }

        send({ event: 'status', data: { message: 'Composing answer...' } });

        const answerEngine = resolveEngine(model_preference, 'answer');
        let fullText = '';
        const meta = await streamSearchAnswer(
          `${query}${historyNote}`,
          {
            chunks: chunksForAnswer(results, scopedProjectId),
            criticalItems: [],
            timelineEvents: [],
            projectSummary,
          },
          (token) => {
            fullText += token;
            send({ event: 'token', data: { text: token } });
          },
          { scopeInstruction, engine: answerEngine }
        );

        send({
          event: 'meta',
          data: {
            citations: meta.citations,
            confidence: meta.confidence,
            model: meta.model,
            results_count: results.length,
          },
        });

        await saveChatMessage(supabase, {
          session_id: session.id,
          project_id: scopedProjectId,
          role: 'assistant',
          content: formatNaturalProse(fullText),
          citations: meta.citations,
          metadata: {
            confidence: meta.confidence,
            model: meta.model,
            results_count: results.length,
          },
        });

        send({ event: 'done', data: { session_id: session.id } });
      } catch (error) {
        send({
          event: 'error',
          data: { message: formatStreamError(error) },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
