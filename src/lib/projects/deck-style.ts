export type ProjectDeckStyle = {
  guidance?: string;
  template_file_id?: string | null;
  template_file_name?: string | null;
  updated_at?: string;
};

export function parseProjectDeckStyle(raw: unknown): ProjectDeckStyle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const value = raw as Record<string, unknown>;
  return {
    guidance: typeof value.guidance === 'string' ? value.guidance : undefined,
    template_file_id:
      typeof value.template_file_id === 'string' ? value.template_file_id : null,
    template_file_name:
      typeof value.template_file_name === 'string' ? value.template_file_name : null,
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : undefined,
  };
}

export function buildDeckStylePromptSection(options: {
  guidance?: string;
  templateFileName?: string | null;
  templateExcerpt?: string | null;
}): string | null {
  const parts: string[] = [];
  const guidance = options.guidance?.trim();
  if (guidance) {
    parts.push(`Company deck voice and operating rules:\n${guidance}`);
  }
  if (options.templateExcerpt?.trim()) {
    const label = options.templateFileName?.trim() || 'Company template';
    parts.push(`Reference structure and tone from ${label}:\n${options.templateExcerpt.trim()}`);
  }
  if (parts.length === 0) return null;
  return parts.join('\n\n');
}
