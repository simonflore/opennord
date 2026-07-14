/**
 * The donor .ns4p for migration output. Strategy (spec §template): start
 * from the checked-in regression fixture, force MIGRATION_DEFAULTS so the
 * donor's sound can't leak through mapped-but-unset params. The ~16% of
 * body bytes with no known param remain the fixture's — the conversion
 * report discloses this once, globally.
 *
 * Pure, browser-safe: takes the fixture bytes as input and never touches
 * `node:fs`/`node:url`. The browser caller (Task 9's UI) fetches the fixture
 * via Vite's `?url` asset pipeline and passes the bytes in; the Node/test
 * path that reads the fixture off disk lives in `template-node.ts` so this
 * module never pulls Node builtins into the browser bundle (see
 * `docs/MIGRATION.md`).
 */
import { editNs4Program } from '../ns4/writer';
import { MIGRATION_DEFAULTS } from './defaults';

/** Applies MIGRATION_DEFAULTS to the given donor fixture bytes. Always fresh — no caching here (the Node caller in template-node.ts owns memoization). */
export function buildMigrationTemplate(fixtureBytes: Uint8Array): Uint8Array {
  return editNs4Program(fixtureBytes, MIGRATION_DEFAULTS);
}
