/**
 * Node-only helper around `buildMigrationTemplate` (template.ts): reads the
 * checked-in regression fixture off disk via `node:fs`/`node:url`. Used by
 * tests and scripts only — never imported by browser code. The browser path
 * (Task 9's UI) fetches the same fixture via Vite's `?url` asset pipeline and
 * calls `buildMigrationTemplate` directly with the bytes; see
 * `docs/MIGRATION.md`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildMigrationTemplate } from './template';

let cached: Uint8Array | null = null;

/** Loads the on-disk fixture, applies MIGRATION_DEFAULTS, and memoizes the result (callers get a copy). */
export function buildMigrationTemplateFromDisk(): Uint8Array {
  if (!cached) {
    const raw = new Uint8Array(
      readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
    );
    cached = buildMigrationTemplate(raw);
  }
  return cached.slice();
}
