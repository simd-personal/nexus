import { CLAUDE_MODELS } from '@/lib/ai/claude';
import { OPENAI_MODELS } from '@/lib/ai/openai';

/** User-facing names for model IDs configured in the AI layer. */
const MARKETING_MODEL_LABELS: Record<string, string> = {
  'gpt-5.5': 'GPT-5.5',
  'claude-opus-4-8': 'Claude Opus 4.8',
};

function labelForModelId(modelId: string): string {
  return MARKETING_MODEL_LABELS[modelId] ?? modelId;
}

/** Primary chat/generation models Sunny uses today — update CLAUDE_MODELS / OPENAI_MODELS to refresh marketing copy. */
export function getActiveMarketingModels(): { openai: string; anthropic: string } {
  return {
    openai: labelForModelId(OPENAI_MODELS.chat),
    anthropic: labelForModelId(CLAUDE_MODELS.brief),
  };
}

function joinModelNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

export function latestModelsPricingLine(variant: 'every-plan' | 'included' = 'every-plan'): string {
  const { openai, anthropic } = getActiveMarketingModels();
  const examples = joinModelNames([openai, anthropic]);

  if (variant === 'included') {
    return `Latest AI models included such as ${examples}`;
  }

  return `Latest AI models on every plan such as ${examples}`;
}

export const LATEST_MODELS_PRICING_DISCLAIMER =
  'We upgrade Sunny to newer OpenAI and Anthropic models as they become available. Specific models may change if cost, capacity, or reliability requires it. Your plan always includes current-generation models, not a fixed list.';

/** Sentinel stored in pricing tier feature lists — resolved at render time. */
export const LATEST_MODELS_FEATURE = '__latest_models__' as const;
export const LATEST_MODELS_PRO_FEATURE = '__latest_models_pro__' as const;

export type PricingFeature = string | typeof LATEST_MODELS_FEATURE | typeof LATEST_MODELS_PRO_FEATURE;

export function resolvePricingFeature(feature: PricingFeature): {
  text: string;
  emphasis: 'models' | 'default';
} {
  if (feature === LATEST_MODELS_FEATURE) {
    return { text: latestModelsPricingLine('every-plan'), emphasis: 'models' };
  }
  if (feature === LATEST_MODELS_PRO_FEATURE) {
    return { text: latestModelsPricingLine('included'), emphasis: 'models' };
  }
  return { text: feature, emphasis: 'default' };
}
