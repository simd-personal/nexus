import { describe, expect, it } from 'vitest';
import { buildDeckStylePromptSection, parseProjectDeckStyle } from '../deck-style';

describe('deck-style', () => {
  it('parses stored deck style json', () => {
    expect(
      parseProjectDeckStyle({
        guidance: 'Use HackerOne dark UI references.',
        template_file_id: 'file-1',
        template_file_name: 'Brand Deck.pptx',
      })
    ).toEqual({
      guidance: 'Use HackerOne dark UI references.',
      template_file_id: 'file-1',
      template_file_name: 'Brand Deck.pptx',
    });
  });

  it('builds a generation prompt section from guidance and template excerpt', () => {
    const section = buildDeckStylePromptSection({
      guidance: '8 slides max. Executive tone.',
      templateFileName: 'QBR Template.pdf',
      templateExcerpt: 'Slide 1: Executive summary...',
    });
    expect(section).toContain('Company deck voice and operating rules');
    expect(section).toContain('QBR Template.pdf');
    expect(section).toContain('Slide 1: Executive summary');
  });
});
