import { describe, expect, it } from 'vitest';
import { formatChatText } from '../chat-format';

describe('formatChatText', () => {
  it('strips markdown headings and collapses extra blank lines', () => {
    expect(formatChatText('# Biggest risk\n\nAcross all projects')).toBe(
      'Biggest risk\n\nAcross all projects'
    );
  });

  it('removes bold markers', () => {
    expect(formatChatText('**Critical** item')).toBe('Critical item');
  });
});
