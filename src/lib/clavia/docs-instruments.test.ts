import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALL_MODELS } from './partitions';
import { statusFor, type ValidationStatus } from './validation';

// The docs' list of supported instruments must say exactly what validation.ts
// says, so the docs and the app's Compatibility page can't disagree.
const PAGE = 'docs-site/src/content/docs/reference/the maintainers’ notes';
const MARK: Record<ValidationStatus, string> = { validated: '✓', re: '●', inferred: '●', unsupported: '–', unknown: '●' };
const COLUMNS = ['file-read', 'samples', 'pull', 'push', 'delete', 'backup'] as const;

describe('docs: Supported instruments', () => {
  const rows = new Map(
    readFileSync(PAGE, 'utf8').split('\n')
      .filter((l) => l.startsWith('| Nord '))
      .map((l) => { const cells = l.split('|').slice(1, -1).map((c) => c.trim()); return [cells[0], cells.slice(1)] as const; }),
  );

  it('lists every model, with the marks validation.ts gives it', () => {
    for (const m of ALL_MODELS) {
      expect(rows.get(m.name), m.name).toEqual(COLUMNS.map((c) => MARK[statusFor(m.id, c).status]));
    }
    expect(rows.size).toBe(ALL_MODELS.length);
  });
});
