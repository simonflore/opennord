import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(resolve(here, '../tokens.css'), 'utf8');

describe('tailwind setup', () => {
  it('imports tailwind and declares an @theme block', () => {
    expect(tokens).toContain('@import "tailwindcss"');
    expect(tokens).toMatch(/@theme\s*\{/);
  });
  it('maps every @theme colour to the same value as its :root custom property', () => {
    // values MUST equal the :root tokens so `bg-surface` renders exactly like
    // `var(--surface)`. Checked generically, so a palette change can't leave the
    // two copies out of step (a :root alias like `--red: var(--accent)` resolves).
    const block = (re: RegExp) => tokens.match(re)?.[1] ?? '';
    const decls = (css: string) =>
      new Map([...css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim().toLowerCase()]));
    const theme = decls(block(/@theme\s*\{([\s\S]*?)\n\}/));
    const root = decls(block(/:root,\s*:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/));
    const resolve = (v: string | undefined) => {
      const alias = v?.match(/^var\((--[\w-]+)\)$/);
      return alias ? root.get(alias[1]) : v;
    };
    const rootName = (k: string) => '--' + k.slice('--color-'.length);
    const pairs = [...theme].filter(([k]) => k.startsWith('--color-') && root.has(rootName(k)));
    expect(pairs.length).toBeGreaterThan(20);
    for (const [k, v] of pairs) expect([k, resolve(root.get(rootName(k)))]).toEqual([k, v]);
  });
  it('keeps the original CSS custom properties (single source of truth intact)', () => {
    expect(tokens).toContain('--surface:');
    expect(tokens).toContain('--accent:');
    expect(tokens).toContain('--grad-surface:');
    expect(tokens).toContain('--shadow-2:');
  });
});
