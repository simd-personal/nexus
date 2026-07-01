import { describe, expect, it } from 'vitest';
import {
  getActiveMarketingModels,
  LATEST_MODELS_FEATURE,
  LATEST_MODELS_PRO_FEATURE,
  latestModelsPricingLine,
  resolvePricingFeature,
} from '../model-lineup';

describe('model-lineup', () => {
  it('derives display names from configured AI models', () => {
    const models = getActiveMarketingModels();
    expect(models.openai).toBe('GPT-5.5');
    expect(models.anthropic).toBe('Claude Opus 4.8');
  });

  it('builds every-plan pricing copy with model examples', () => {
    expect(latestModelsPricingLine('every-plan')).toBe(
      'Latest AI models on every plan such as GPT-5.5 and Claude Opus 4.8'
    );
  });

  it('builds included pricing copy for Pro', () => {
    expect(latestModelsPricingLine('included')).toBe(
      'Latest AI models included such as GPT-5.5 and Claude Opus 4.8'
    );
  });

  it('marks model features for emphasis styling', () => {
    expect(resolvePricingFeature(LATEST_MODELS_FEATURE)).toEqual({
      text: latestModelsPricingLine('every-plan'),
      emphasis: 'models',
    });
    expect(resolvePricingFeature(LATEST_MODELS_PRO_FEATURE)).toEqual({
      text: latestModelsPricingLine('included'),
      emphasis: 'models',
    });
    expect(resolvePricingFeature('Unlimited client projects')).toEqual({
      text: 'Unlimited client projects',
      emphasis: 'default',
    });
  });
});
