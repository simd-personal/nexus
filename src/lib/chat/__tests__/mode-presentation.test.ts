import { describe, expect, it } from 'vitest';
import { getChatModePresentation, chatSuggestions, chatTitle } from '../mode-presentation';

describe('playbook mode presentation', () => {
  it('uses coach branding instead of Sunny defaults', () => {
    const presentation = getChatModePresentation('playbook');
    expect(presentation.useCoachBranding).toBe(true);
    expect(presentation.headerTitle).toBe('Gameplan Coach');
    expect(presentation.assistantLabel).toBe('Gameplan Coach');
    expect(presentation.workspaceClass).toBe('playbook-workspace');
  });

  it('uses gameplan copy in the empty state', () => {
    expect(chatTitle('playbook', 'Sunny')).toBe('Build your client gameplan');
    expect(chatSuggestions('playbook')).toHaveLength(4);
  });
});
