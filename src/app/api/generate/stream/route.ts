import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { streamPageBrief, streamPagePlaybook } from '@/lib/ai/page-generation';
import { getProjectContext } from '@/lib/generate/context';
import { loadSessionHistory } from '@/lib/chat/memory';
import { deleteLastAssistantMessage, getOrCreateSession, saveChatMessage } from '@/lib/chat/sessions';
import { checkChatQuota, getBillingContextForUser } from '@/lib/billing/limits';
import { guardAiRequest } from '@/lib/security/guard';
import { encodeSse } from '@/lib/sse';
import type { ModelEngine, ModelPreference } from '@/types/database';

type PageGenerationType = 'brief' | 'playbook';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { project_id, message, session_id, type, regenerate, honeypot, model_preference } =
    await request.json();
  if (!project_id || !message?.trim() || (type !== 'brief' && type !== 'playbook')) {
    return new Response(JSON.stringify({ error: 'Project ID, message, and type (brief|playbook) required' }), {
      status: 400,
    });
  }

  const pageType = type as PageGenerationType;

  const billing = await getBillingContextForUser(user.id);
  const guardResponse = await guardAiRequest({
    request,
    userId: user.id,
    isPro: billing.isPro,
    cost: 'generate',
    message,
    honeypot,
  });
  if (guardResponse) return guardResponse;

  const { project, context } = await getProjectContext(project_id, supabase);
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
          sessionType: pageType,
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

        let content = '';
        let citations: unknown[] = [];
        let title = '';
        let actions_taken: string[] = [];
        let usedModel: ModelEngine = 'claude';
        const preference = model_preference as ModelPreference | undefined;

        if (pageType === 'brief') {
          send({ event: 'status', data: { message: 'Generating executive brief...' } });
          const result = await streamPageBrief(
            context,
            message,
            history.slice(0, -1),
            (token) => {
              send({ event: 'token', data: { text: token } });
            },
            preference
          );
          content = result.content;
          citations = result.citations;
          usedModel = result.model;
          title = `Sunny Brief for ${project.project_name}`;
          actions_taken = ['Generated executive brief', 'Saved to project documents'];

          await supabase.from('generated_documents').insert({
            project_id,
            type: 'brief',
            title,
            content,
            citations,
            metadata: { source: 'page_chat', instructions: message, model: usedModel },
          });
        } else {
          send({ event: 'status', data: { message: 'Building operating playbook...' } });
          const result = await streamPagePlaybook(
            project.project_name,
            project.client_name,
            context,
            message,
            history.slice(0, -1),
            (token) => {
              send({ event: 'token', data: { text: token } });
            },
            preference
          );
          content = result.content;
          usedModel = result.model;
          title = `Operating Playbook for ${project.client_name}`;
          actions_taken = ['Generated operating playbook', 'Saved to project documents'];

          await supabase.from('generated_documents').insert({
            project_id,
            type: 'playbook',
            title,
            content,
            metadata: { source: 'page_chat', instructions: message, model: usedModel },
          });

          await supabase.from('timeline_events').insert({
            project_id,
            event_type: 'playbook',
            title: `Playbook generated: ${project.client_name}`,
            description: 'Sunny generated an operating playbook via chat',
          });
        }

        const artifact = { type: pageType, title, content };

        send({ event: 'artifact', data: artifact });
        send({
          event: 'meta',
          data: {
            citations,
            confidence: 'high',
            actions_taken,
            model: usedModel,
          },
        });

        await saveChatMessage(supabase, {
          session_id: session.id,
          project_id,
          role: 'assistant',
          content: formatNaturalProse(content),
          citations,
          metadata: {
            confidence: 'high',
            artifact,
            actions_taken,
            model: usedModel,
          },
        });

        send({ event: 'done', data: { session_id: session.id } });
      } catch (error) {
        send({
          event: 'error',
          data: { message: error instanceof Error ? error.message : 'Generation failed' },
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
