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
  it('maps the core surface + accent colors into @theme verbatim', () => {
    // values MUST equal tokens.css so utilities render identically
    expect(tokens).toContain('--color-surface: #1d2027');
    expect(tokens).toContain('--color-red: #e0202e');
    expect(tokens).toContain('--color-ink: #e9ebf0');
  });
  it('keeps the original CSS custom properties (single source of truth intact)', () => {
    expect(tokens).toContain('--surface: #1d2027');
    expect(tokens).toContain('--grad-surface:');
    expect(tokens).toContain('--shadow-2:');
  });
});
