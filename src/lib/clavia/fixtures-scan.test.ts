import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runFixtureScan } from '../contribute/fixture-files';
import { formatSummary } from '../contribute/fixture-validate';

/**
 * `npm run fixtures:scan` — checks real Nord files against OpenNord's readers and
 * writers (contribute/fixture-validate.ts): files in fixtures/<model-id>/, and with
 * `NORD_FILES=/some/folder` every Nord file and backup under that folder. Prints a
 * per-model summary and writes the full per-file report to fixtures/.report.json
 * (gitignored). Input files are only read. With no files it does nothing.
 * Runs only from that npm script, so a plain `vitest run` never scans a library.
 */
const ROOT = fileURLToPath(new URL('../../../fixtures', import.meta.url)); // packages/core/fixtures
const NORD_FILES = process.env.NORD_FILES?.trim() || undefined;

describe.runIf(process.env.npm_lifecycle_event === 'fixtures:scan')('fixtures corpus scan', () => {
  it('checks any present fixtures or NORD_FILES folder, or notes there are none', async () => {
    const { rows, notes } = await runFixtureScan({ fixturesRoot: ROOT, nordFiles: NORD_FILES });
    for (const n of notes) console.warn(`[fixtures] ${n}`);
    if (rows.length === 0) {
      console.log('[fixtures] no files — drop files in fixtures/<model>/ or run with NORD_FILES=/path/to/your/Nord/files');
      return;
    }
    mkdirSync(ROOT, { recursive: true });
    writeFileSync(`${ROOT}/.report.json`, JSON.stringify(rows, null, 2));
    console.log(formatSummary(rows, 'fixtures/.report.json'));
    expect(Array.isArray(rows)).toBe(true); // the scanner ran; findings are informational
  }, 60 * 60_000); // a whole library of backups can take a while
});
