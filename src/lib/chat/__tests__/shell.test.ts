import { describe, expect, it } from 'vitest';
import { chatShellClassName, EMBEDDED_CHAT_MAX_HEIGHT } from '@/lib/chat/shell';

describe('chatShellClassName', () => {
  it('caps embedded project chat height so headers stay pinned', () => {
    const classes = chatShellClassName(true);
    expect(classes).toContain('min-h-0');
    expect(classes).toContain('flex-1');
    expect(classes).toContain(EMBEDDED_CHAT_MAX_HEIGHT);
  });

  it('uses full viewport height for global chat', () => {
    const classes = chatShellClassName(false);
    expect(classes).toContain('h-[calc(100dvh-3.5rem)]');
    expect(classes).not.toContain(EMBEDDED_CHAT_MAX_HEIGHT);
  });
});
