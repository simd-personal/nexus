import { NextRequest } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { createEmbeddingOrNull } from '@/lib/ai/openai';
import { formatStreamError } from '@/lib/ai/errors';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { runSunnyAgentStream } from '@/lib/ai/stream-agent';
import { retrieveForQuery } from '@/lib/search/retrieve';
import { PROJECT_RETRIEVAL_LIMIT } from '@/lib/search/context-limits';
import { chunksForAnswer } from '@/lib/search/scope';
import { loadSessionHistory } from '@/lib/chat/memory';
import { getOrCreateSession, saveChatMessage, deleteLastAssistantMessage } from '@/lib/chat/sessions';
import { checkChatQuota, getBillingContextForUser } from '@/lib/billing/limits';
import { guardAiRequest } from '@/lib/security/guard';
import { evaluatePreQueryGuard } from '@/lib/security/query-guard';
import { encodeSse } from '@/lib/sse';

export async function POST(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { user } = auth;
  const supabase = auth.supabase;

  const { project_id, message, session_id, model_preference, regenerate, honeypot } = await request.json();
  if (!project_id || !message?.trim()) {
    return new Response(JSON.stringify({ error: 'Project ID and message required' }), { status: 400 });
  }

  const billing = await getBillingContextForUser(user.id);
  const guardResponse = await guardAiRequest({
    request,
    userId: user.id,
    isPro: billing.isPro,
    cost: 'chat',
    message,
    honeypot,
  });
  if (guardResponse) return guardResponse;

  const { data: project } = await supabase
    .from('projects')
    .select('id, client_name, project_name')
    .eq('id', project_id)
    .single();

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
  }

  const quota = await checkChatQuota(user.id, billing);
  if (quota.exceeded) {
    return new Response(JSON.stringify({ error: quota.message, upgradeRequired: true }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Parameters<typeof encodeSse>[0]) => {
        controller.enqueue(new TextEncoder().encode(encodeSse(event)));
      };

      try {
        const session = await getOrCreateSession(supabase, user.id, {
          sessionId: session_id,
          sessionType: 'project',
          projectId: project_id,
          title: message.slice(0, 80),
        });

        send({ event: 'session', data: { session_id: session.id, title: session.title ?? undefined } });

        const preGuard = await evaluatePreQueryGuard({
          message,
          supabase,
          userId: user.id,
          projectId: project_id,
        });
        if (!preGuard.allowed) {
          if (!regenerate) {
            await saveChatMessage(supabase, {
              session_id: session.id,
              project_id,
              role: 'user',
              content: message,
            });
          }
          for (const ch of preGuard.message) send({ event: 'token', data: { text: ch } });
          send({ event: 'meta', data: { confidence: 'low', guardrail: preGuard.reason } });
          await saveChatMessage(supabase, {
            session_id: session.id,
            project_id,
            role: 'assistant',
            content: preGuard.message,
            metadata: { confidence: 'low', guardrail: preGuard.reason },
          });
          send({ event: 'done', data: { session_id: session.id } });
          return;
        }

        if (regenerate) {
          await deleteLastAssistantMessage(supabase, session.id);
        } else {
          await saveChatMessage(supabase, {
            session_id: session.id,
            project_id,
            role: 'user',
            content: message,
          });
        }

        const history = await loadSessionHistory(supabase, session.id);

        send({ event: 'status', data: { message: 'Reading project materials...' } });

        const embedding = await createEmbeddingOrNull(message);
        const [retrieved, { data: projectMeta }, { data: criticalItems }, { data: timelineEvents }] =
          await Promise.all([
            retrieveForQuery(supabase, message, embedding, { projectId: project_id, limit: PROJECT_RETRIEVAL_LIMIT }),
            supabase.from('projects').select('last_summary').eq('id', project_id).single(),
            supabase.from('critical_items').select('title, summary, severity').eq('project_id', project_id).eq('status', 'open').limit(5),
            supabase.from('timeline_events').select('title, description, created_at').eq('project_id', project_id).order('created_at', { ascending: false }).limit(10),
          ]);

        const context = {
          chunks: chunksForAnswer(retrieved, [project_id]),
          criticalItems: criticalItems ?? [],
          timelineEvents: timelineEvents ?? [],
          projectSummary: projectMeta?.last_summary ?? null,
        };

        send({
          event: 'results',
          data: {
            results: retrieved.slice(0, PROJECT_RETRIEVAL_LIMIT).map((r) => ({
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
            })),
          },
        });

        let fullText = '';
        const response = await runSunnyAgentStream({
          message,
          context,
          project,
          chatHistory: history.slice(0, -1),
          supabase,
          modelPreference: model_preference,
          userId: user.id,
          retrieved,
          onStatus: (msg) => send({ event: 'status', data: { message: msg } }),
          onToken: (token) => {
            fullText += token;
            send({ event: 'token', data: { text: token } });
          },
        });

        const rawAnswer = fullText || response.answer;
        const answer =
          response.artifact?.type === 'deck'
            ? rawAnswer
            : formatNaturalProse(rawAnswer);

        if (response.artifact) {
          send({ event: 'artifact', data: response.artifact });
        }

        send({
          event: 'meta',
          data: {
            citations: response.citations,
            confidence: response.confidence,
            suggested_next_step: response.suggested_next_step,
            actions_taken: response.actions_taken,
            model: response.model,
          },
        });

        await saveChatMessage(supabase, {
          session_id: session.id,
          project_id,
          role: 'assistant',
          content: answer,
          citations: response.citations,
          metadata: {
            confidence: response.confidence,
            suggested_next_step: response.suggested_next_step,
            artifact: response.artifact,
            actions_taken: response.actions_taken,
            model: response.model,
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
