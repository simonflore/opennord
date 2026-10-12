import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { inline, parseBlocks } from './markdown';

describe('parseBlocks', () => {
  it('reads headings, rules and paragraphs, joining a paragraph\'s lines', () => {
    expect(parseBlocks('# Title\n\nFirst line\nsecond line.\n\n---\n\n## Part\n\nMore.')).toEqual([
      { kind: 'h1', text: 'Title' },
      { kind: 'p', text: 'First line second line.' },
      { kind: 'rule' },
      { kind: 'h2', text: 'Part' },
      { kind: 'p', text: 'More.' },
    ]);
  });
});

describe('inline', () => {
  const html = (text: string) => renderToStaticMarkup(<p>{inline(text, 's')}</p>);
  it('marks bold, italic and code', () => {
    expect(html('a **b** *c* `d`')).toBe('<p>a <strong class="s">b</strong> <em>c</em> <code class="font-mono text-[0.92em]">d</code></p>');
  });
  it('keeps italics inside bold', () => {
    expect(html('**your *own* data**')).toBe('<p><strong class="s">your <em>own</em> data</strong></p>');
  });
});

describe('MANIFESTO.md', () => {
  const blocks = parseBlocks(readFileSync('MANIFESTO.md', 'utf8'));
  it('uses only the Markdown this reader shows', () => {
    // A list, link, quote, table or deeper heading would come out as raw text.
    const shown = blocks.flatMap((b) => (b.kind === 'rule' ? [] : [b.text]));
    for (const text of shown) expect(text).not.toMatch(/^(#{1,6} |[-*+] |\d+\. |> |\|)|\]\(/);
    expect(blocks[0]).toEqual({ kind: 'h1', text: 'The OpenNord Manifesto' });
  });
  it('leaves no stray emphasis marks once rendered', () => {
    const text = renderToStaticMarkup(<div>{blocks.map((b, i) => (b.kind === 'rule' ? null : <p key={i}>{inline(b.text, 's')}</p>))}</div>)
      .replace(/<[^>]+>/g, '');
    expect(text).not.toMatch(/\*|`/);
  });
});
