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
  it('writes each palette value once: @theme inline only points at :root tokens', () => {
    // `bg-surface` must render exactly like `var(--surface)`. Rather than copy
    // the hex into @theme (and test the copies stay in step), every colour,
    // radius and font family there references the :root custom property.
    const inline = tokens.match(/@theme inline\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    const decls = [...inline.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]);
    expect(decls.length).toBeGreaterThan(20);
    for (const [name, value] of decls) {
      expect([name, value]).toEqual([name, expect.stringMatching(/^var\(--[\w-]+\)$/)]);
      expect(tokens).toContain(`  ${value.slice(4, -1)}:`); // the referenced :root token exists
    }
  });
  it('keeps the original CSS custom properties (single source of truth intact)', () => {
    expect(tokens).toContain('--surface:');
    expect(tokens).toContain('--accent:');
    expect(tokens).toContain('--grad-surface:');
    expect(tokens).toContain('--shadow-2:');
  });
});
