import type { ReactNode } from 'react';

/**
 * A reader for the small part of Markdown the manifesto uses: `#` and `##`
 * headings, paragraphs, `---` rules, and **bold**, *italic* and `code` inside a
 * line. Enough to show MANIFESTO.md as written, so the page and the file in the
 * repository are one text. Anything else comes out as plain paragraph text.
 */
export type Block =
  | { kind: 'h1' | 'h2' | 'p'; text: string }
  | { kind: 'rule' };

/** Split a document into blocks; a paragraph's lines are joined into one. */
export function parseBlocks(markdown: string): Block[] {
  return markdown.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean).map((chunk): Block => {
    if (/^-{3,}$/.test(chunk)) return { kind: 'rule' };
    const text = chunk.replace(/\s*\n\s*/g, ' ');
    if (text.startsWith('## ')) return { kind: 'h2', text: text.slice(3) };
    if (text.startsWith('# ')) return { kind: 'h1', text: text.slice(2) };
    return { kind: 'p', text };
  });
}

/** **bold**, *italic* and `code` within a line; bold may hold italics. */
export function inline(text: string, strongClass: string): ReactNode[] {
  return text.split(/(\*\*.+?\*\*|\*[^*]+\*|`[^`]+`)/).filter(Boolean).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i} className={strongClass}>{inline(part.slice(2, -2), strongClass)}</strong>;
    if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`')) return <code key={i} className="font-mono text-[0.92em]">{part.slice(1, -1)}</code>;
    return part;
  });
}
