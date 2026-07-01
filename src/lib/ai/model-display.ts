import { CLAUDE_MODELS } from '@/lib/ai/claude';
import { OPENAI_MODELS } from '@/lib/ai/openai';
import type { ModelEngine, ModelPreference } from '@/types/database';

/** User-facing names for model IDs configured in the AI layer. */
const MODEL_DISPLAY_LABELS: Record<string, string> = {
  'gpt-5.5': 'GPT-5.5',
  'claude-opus-4-8': 'Claude Opus 4.8',
};

export function displayLabelForModelId(modelId: string): string {
  return MODEL_DISPLAY_LABELS[modelId] ?? modelId;
}

export function openAIChatModelLabel(): string {
  return displayLabelForModelId(OPENAI_MODELS.chat);
}

export function openAIGenerationModelLabel(): string {
  return displayLabelForModelId(OPENAI_MODELS.generationHigh);
}

export function claudeDocumentModelLabel(): string {
  return displayLabelForModelId(CLAUDE_MODELS.brief);
}

export type ModelSelectorOption = {
  value: ModelPreference;
  label: string;
  hint: string;
};

/** Labels for the chat model preference dropdown. Versions come from OPENAI_MODELS / CLAUDE_MODELS. */
export function modelSelectorOptions(): ModelSelectorOption[] {
  const openai = openAIChatModelLabel();
  const claude = claudeDocumentModelLabel();

  return [
    {
      value: 'auto',
      label: `Auto (${openai} and ${claude})`,
      hint: `Auto routes Q&A to ChatGPT (${openai}) and document creation to Claude (${claude}).`,
    },
    {
      value: 'gpt',
      label: `ChatGPT · ${openai}`,
      hint: `Use ChatGPT (${openai}) for every response.`,
    },
    {
      value: 'claude',
      label: `Claude · ${claude}`,
      hint: `Use Claude (${claude}) for every response.`,
    },
  ];
}

export function modelSelectorHint(preference: ModelPreference): string {
  return modelSelectorOptions().find((option) => option.value === preference)?.hint ?? '';
}

/** Compact label shown in the chat header model pill. */
export function modelSelectorPillLabel(preference: ModelPreference): string {
  if (preference === 'auto') return 'Auto';
  return modelSelectorOptions().find((option) => option.value === preference)?.label ?? 'Auto';
}

export function engineBadgeLabel(engine: ModelEngine): string {
  return engine === 'claude'
    ? `Claude · ${claudeDocumentModelLabel()}`
    : `ChatGPT · ${openAIChatModelLabel()}`;
}

export function isModelEngine(value: unknown): value is ModelEngine {
  return value === 'gpt' || value === 'claude';
}
