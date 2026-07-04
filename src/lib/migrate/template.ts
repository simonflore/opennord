/**
 * The donor .ns4p for migration output. Strategy (spec §template): start
 * from the checked-in regression fixture, force MIGRATION_DEFAULTS so the
 * donor's sound can't leak through mapped-but-unset params. The ~16% of
 * body bytes with no known param remain the fixture's — the conversion
 * report discloses this once, globally.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { editNs4Program } from '../ns4/writer';
import { MIGRATION_DEFAULTS } from './defaults';

let cached: Uint8Array | null = null;

/** Browser builds import the fixture via Vite ?url — see Task 8 for the UI
 *  loader; this Node path serves tests and scripts. */
export function buildMigrationTemplate(fixtureBytes?: Uint8Array): Uint8Array {
  // Injected-bytes path is uncached by design: the browser caller fetches the
  // fixture once and holds the result; only the Node/test path benefits from
  // memoization. editNs4Program returns a fresh copy, so no .slice() needed here.
  if (fixtureBytes) return editNs4Program(fixtureBytes, MIGRATION_DEFAULTS);
  if (!cached) {
    const raw = new Uint8Array(
      readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
    );
    cached = editNs4Program(raw, MIGRATION_DEFAULTS);
  }
  return cached.slice();
}
