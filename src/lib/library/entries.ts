import type { LibraryEntry, LibrarySource, LibrarySort } from './types';
import type { ProgramEntry } from '../device/transfer';
import type { ScannedProgram } from '../folder/scan';
import { formatSlot } from '../clavia/slot';
import { parseClaviaFile, type NordProgram } from '../formats';
import { programNameFromFilename } from '../clavia/name';
import { activeLayers } from '../ns4/view';
import type { NS4Program } from '../ns4/types';
import { matchesQuery, sortWithFavorites } from './browse';

/** One-line engine summary for a parsed NS4 program, e.g. "organ + synth". */
export function summarize(program: NS4Program): string {
  const kinds = activeLayers(program).map((l) => l.kind);
  const order = ['organ', 'piano', 'synth'] as const;
  const present = order.filter((k) => kinds.includes(k));
  return present.length ? present.join(' + ') : 'program';
}

/** True when `program` is a fully-structured NS4 program (has `kind`). */
export function isNs4Program(program: NordProgram): program is NS4Program {
  return 'kind' in program;
}

/** Map the device's enumerated programs into Library entries. */
export function nordEntriesFromDevice(entries: ProgramEntry[]): LibraryEntry[] {
  return entries.map((e) => {
    const slot = formatSlot(e.bank, e.slot);
    return { id: `nord:${slot}`, name: e.name, source: 'nord', slot };
  });
}

/**
 * Build a local Library entry from a persisted import (id + filename + bytes).
 * Pure: parsing the same bytes always yields the same entry, so it works equally
 * for a freshly-imported file and one restored from IndexedDB on reload.
 */
export function entryFromImport(rec: { id: string; name: string; bytes: Uint8Array }): LibraryEntry {
  const program = parseClaviaFile(rec.bytes).program;
  program.name = programNameFromFilename(rec.name);
  return {
    id: rec.id,
    name: program.name ?? rec.name,
    source: 'local',
    summary: program.parsed && isNs4Program(program) ? summarize(program) : undefined,
    program,
    bytes: rec.bytes,
  };
}

/** Filter by source tab + case-insensitive name query. */
export function filterEntries(
  entries: LibraryEntry[], source: LibrarySource | 'all', query: string,
): LibraryEntry[] {
  return entries.filter((e) =>
    (source === 'all' || e.source === source) && matchesQuery(e.name, query));
}

/**
 * Order entries for display: favorites float to the top, then the chosen sort
 * within each group. Stable — `default` preserves natural source order. Pure.
 */
export function sortEntries(
  entries: LibraryEntry[], sort: LibrarySort, favorites: ReadonlySet<string>,
): LibraryEntry[] {
  const byKey = (a: LibraryEntry, b: LibraryEntry): number => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'source') return a.source.localeCompare(b.source) || a.name.localeCompare(b.name);
    return 0; // default → fall through to input order
  };
  return sortWithFavorites(entries, favorites, byKey);
}

/** Map folder-scanned programs into Library entries.
 * Bundle-sourced programs (id contains `!`) are tagged `source:'backup'`;
 * loose-file programs are tagged `source:'local'`. */
export function entriesFromScannedPrograms(programs: ScannedProgram[]): LibraryEntry[] {
  return programs.map((p) => ({
    id: p.id,
    name: p.name,
    source: (p.id.includes('!') ? 'backup' : 'local') as LibrarySource,
    summary: p.summary,
    program: p.program,
    bytes: p.bytes,
  }));
}
