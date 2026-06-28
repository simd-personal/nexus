import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEmbedding } from '@/lib/ai/openai';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { runSunnyAgentStream } from '@/lib/ai/stream-agent';
import { retrieveForQuery, toSearchContext } from '@/lib/search/retrieve';
import { PROJECT_RETRIEVAL_LIMIT } from '@/lib/search/context-limits';
import { loadSessionHistory } from '@/lib/chat/memory';
import { getOrCreateSession, saveChatMessage, deleteLastAssistantMessage } from '@/lib/chat/sessions';
import { encodeSse } from '@/lib/sse';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { project_id, message, session_id, model_preference, regenerate } = await request.json();
  if (!project_id || !message?.trim()) {
    return new Response(JSON.stringify({ error: 'Project ID and message required' }), { status: 400 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, client_name, project_name')
    .eq('id', project_id)
    .single();

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
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

        const embedding = await createEmbedding(message);
        const [retrieved, { data: projectMeta }, { data: criticalItems }, { data: timelineEvents }] =
          await Promise.all([
            retrieveForQuery(supabase, message, embedding, { projectId: project_id, limit: PROJECT_RETRIEVAL_LIMIT }),
            supabase.from('projects').select('last_summary').eq('id', project_id).single(),
            supabase.from('critical_items').select('title, summary, severity').eq('project_id', project_id).eq('status', 'open').limit(5),
            supabase.from('timeline_events').select('title, description, created_at').eq('project_id', project_id).order('created_at', { ascending: false }).limit(10),
          ]);

        const context = {
          chunks: toSearchContext(retrieved),
          criticalItems: criticalItems ?? [],
          timelineEvents: timelineEvents ?? [],
          projectSummary: projectMeta?.last_summary ?? null,
        };

        let fullText = '';
        const response = await runSunnyAgentStream({
          message,
          context,
          project,
          chatHistory: history.slice(0, -1),
          supabase,
          modelPreference: model_preference,
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
          data: { message: error instanceof Error ? error.message : 'Chat failed' },
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
