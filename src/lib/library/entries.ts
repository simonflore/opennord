import type { LibraryEntry, LibrarySource } from './types';
import type { ProgramEntry } from '../device/transfer';
import type { ScannedProgram } from '../folder/scan';
import { formatSlot } from '../ns4/slot';
import { parseNs4Program } from '../ns4/parse';
import { programNameFromFilename } from '../ns4/name';
import { activeLayers } from '../ns4/view';
import type { NS4Program } from '../ns4/types';

/** One-line engine summary for a parsed program, e.g. "organ + synth". */
export function summarize(program: NS4Program): string {
  const kinds = activeLayers(program).map((l) => l.kind);
  const order = ['organ', 'piano', 'synth'] as const;
  const present = order.filter((k) => kinds.includes(k));
  return present.length ? present.join(' + ') : 'program';
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
  const program = parseNs4Program(rec.bytes);
  program.name = programNameFromFilename(rec.name);
  return {
    id: rec.id,
    name: program.name ?? rec.name,
    source: 'local',
    summary: program.parsed ? summarize(program) : undefined,
    program,
    bytes: rec.bytes,
  };
}

/** Filter by source tab + case-insensitive name query. */
export function filterEntries(
  entries: LibraryEntry[], source: LibrarySource | 'all', query: string,
): LibraryEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((e) =>
    (source === 'all' || e.source === source) &&
    (q === '' || e.name.toLowerCase().includes(q)));
}

/** Map folder-scanned programs into Library entries under the local source. */
export function entriesFromScannedPrograms(programs: ScannedProgram[]): LibraryEntry[] {
  return programs.map((p) => ({
    id: p.id,
    name: p.name,
    source: 'local' as const,
    summary: p.summary,
    program: p.program,
    bytes: p.bytes,
  }));
}
