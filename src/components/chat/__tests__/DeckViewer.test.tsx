import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeckViewer } from '@/components/chat/DeckViewer';
import { SAMPLE_VALID_DECK } from '@/lib/ai/deck-format';
import type { SunnyChatArtifact } from '@/types/database';

const deckArtifact: SunnyChatArtifact = {
  type: 'deck',
  title: 'Presentation Deck for Acme Corp',
  content: SAMPLE_VALID_DECK,
};

function render(artifact: SunnyChatArtifact) {
  return renderToStaticMarkup(<DeckViewer artifact={artifact} />);
}

describe('DeckViewer rendering', () => {
  it('renders the deck as visual slides, not raw markdown', () => {
    const html = render(deckArtifact);

    // Real slide content is rendered
    expect(html).toContain('Executive Summary');
    expect(html).toContain('Q3 revenue up 12%');

    // Deck chrome present (title, slide count, controls)
    expect(html).toContain('Acme Corp · Q3 Business Review');
    expect(html).toContain('7 slides');
    expect(html).toContain('Present');
    expect(html).toContain('Grid');

    // No leftover markdown slide syntax leaking into the UI
    expect(html).not.toContain('## Slide');
    expect(html).not.toContain('**');
  });

  it('shows slide position on the first slide', () => {
    const html = render(deckArtifact);
    expect(html).toContain('1 / 7');
  });

  it('renders nothing when there are no slides', () => {
    const html = render({
      type: 'deck',
      title: 'Empty',
      content: 'No slides here, just prose.',
    });
    expect(html).toBe('');
  });
});
