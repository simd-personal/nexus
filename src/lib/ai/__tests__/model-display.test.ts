import { describe, expect, it } from 'vitest';
import {
  claudeDocumentModelLabel,
  engineBadgeLabel,
  modelSelectorOptions,
  modelSelectorPillLabel,
  openAIChatModelLabel,
} from '../model-display';

describe('model-display', () => {
  it('derives selector labels from configured model IDs', () => {
    expect(openAIChatModelLabel()).toBe('GPT-5.5');
    expect(claudeDocumentModelLabel()).toBe('Claude Opus 4.8');

    const options = modelSelectorOptions();
    expect(options).toHaveLength(3);
    expect(options[0]).toMatchObject({
      value: 'auto',
      label: 'Auto (GPT-5.5 and Claude Opus 4.8)',
    });
    expect(options[1]?.label).toBe('ChatGPT · GPT-5.5');
    expect(options[2]?.label).toBe('Claude · Claude Opus 4.8');
  });

  it('formats engine badges with version labels', () => {
    expect(engineBadgeLabel('gpt')).toBe('ChatGPT · GPT-5.5');
    expect(engineBadgeLabel('claude')).toBe('Claude · Claude Opus 4.8');
  });

  it('uses compact pill labels in the chat header', () => {
    expect(modelSelectorPillLabel('auto')).toBe('Auto');
    expect(modelSelectorPillLabel('gpt')).toBe('ChatGPT · GPT-5.5');
    expect(modelSelectorPillLabel('claude')).toBe('Claude · Claude Opus 4.8');
  });
});
