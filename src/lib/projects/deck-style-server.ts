import type { RequestSupabaseClient } from '@/lib/supabase/request-auth';
import { sampleTextForAnalysis } from '@/lib/processing/text-sampling';
import {
  buildDeckStylePromptSection,
  parseProjectDeckStyle,
  type ProjectDeckStyle,
} from '@/lib/projects/deck-style';

export async function loadProjectDeckStyle(
  supabase: RequestSupabaseClient,
  projectId: string
): Promise<ProjectDeckStyle> {
  const { data } = await supabase.from('projects').select('deck_style').eq('id', projectId).single();
  return parseProjectDeckStyle(data?.deck_style);
}

export async function buildDeckStyleGenerationSection(
  supabase: RequestSupabaseClient,
  deckStyle: ProjectDeckStyle
): Promise<string | null> {
  let templateExcerpt: string | null = null;

  if (deckStyle.template_file_id) {
    const { data: file } = await supabase
      .from('files')
      .select('file_name, extracted_text, status')
      .eq('id', deckStyle.template_file_id)
      .single();

    const extracted = file?.extracted_text?.trim();
    if (extracted) {
      templateExcerpt = sampleTextForAnalysis(
        extracted,
        file?.file_name ?? deckStyle.template_file_name ?? 'template',
        10_000
      );
    }
  }

  return buildDeckStylePromptSection({
    guidance: deckStyle.guidance,
    templateFileName: deckStyle.template_file_name,
    templateExcerpt,
  });
}
