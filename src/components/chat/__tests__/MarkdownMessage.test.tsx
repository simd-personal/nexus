import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';

const render = (content: string) => renderToStaticMarkup(<MarkdownMessage content={content} />);

describe('MarkdownMessage rendering', () => {
  it('renders headings and lists as real HTML, not raw markdown', () => {
    const html = render('## Overview\n\n- First point\n- Second point');
    expect(html).toContain('<h2');
    expect(html).toContain('Overview');
    expect(html).toContain('<ul');
    expect(html).toContain('First point');
    expect(html).not.toContain('## Overview');
  });

  it('renders GFM tables', () => {
    const md = ['| Name | Role |', '| --- | --- |', '| Maria | Ops |'].join('\n');
    const html = render(md);
    expect(html).toContain('<table');
    expect(html).toContain('Maria');
    expect(html).toContain('Ops');
  });

  it('renders fenced code blocks with a copy affordance', () => {
    const html = render('```ts\nconst x = 1;\n```');
    expect(html).toContain('<pre');
    expect(html).toContain('const x = 1;');
    expect(html).toContain('Copy');
  });

  it('renders inline code and links', () => {
    const html = render('Use `npm test` and see [docs](https://example.com)');
    expect(html).toContain('<code');
    expect(html).toContain('npm test');
    expect(html).toContain('href="https://example.com"');
  });
});
