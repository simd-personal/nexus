import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generatePageBrief,
  generatePageDeck,
  generatePageFollowUpEmail,
  generatePagePlaybook,
  formatBriefAsProse,
} from '@/lib/ai/page-generation';
import { getProjectContext } from '@/lib/generate/context';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, type, version, instructions } = await request.json();
    if (!project_id || !type) {
      return NextResponse.json({ error: 'Project ID and type required' }, { status: 400 });
    }

    const { project, context } = await getProjectContext(project_id, supabase);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const userInstructions = typeof instructions === 'string' ? instructions : undefined;
    let content: string;
    let title: string;
    let docType: string;

    switch (type) {
      case 'brief': {
        const brief = await generatePageBrief(context, userInstructions);
        content = formatBriefAsProse(brief);
        title = `Sunny Brief — ${project.project_name}`;
        docType = 'brief';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'brief',
          title,
          content,
          citations: brief.citations,
          metadata: userInstructions ? { instructions: userInstructions } : {},
        });
        break;
      }
      case 'playbook': {
        content = await generatePagePlaybook(project.project_name, project.client_name, context, userInstructions);
        title = `Operating Playbook — ${project.client_name}`;
        docType = 'playbook';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'playbook',
          title,
          content,
          metadata: userInstructions ? { instructions: userInstructions } : {},
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'playbook',
          title: `Playbook generated: ${project.client_name}`,
          description: 'Sunny generated an operating playbook',
        });
        break;
      }
      case 'follow_up_email': {
        content = await generatePageFollowUpEmail(
          project.project_name,
          project.client_name,
          context,
          version ?? 'detailed',
          userInstructions
        );
        title = `Follow-Up Email — ${project.client_name}`;
        docType = 'follow_up_email';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'follow_up_email',
          title,
          content,
          metadata: { version: version ?? 'detailed', ...(userInstructions ? { instructions: userInstructions } : {}) },
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'follow_up_email',
          title: `Follow-up email drafted: ${project.client_name}`,
          description: `${version ?? 'detailed'} version`,
        });
        break;
      }
      case 'deck': {
        content = await generatePageDeck(
          project.project_name,
          project.client_name,
          context,
          userInstructions
        );
        title = `Presentation Deck — ${project.client_name}`;
        docType = 'deck';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'memo',
          title,
          content,
          metadata: { doc_kind: 'deck', ...(userInstructions ? { instructions: userInstructions } : {}) },
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'note',
          title: `Deck generated: ${project.client_name}`,
          description: userInstructions ?? 'Presentation deck created from project materials',
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ data: { title, content, type: docType } });
  } catch (error) {
    console.error('Generate error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
