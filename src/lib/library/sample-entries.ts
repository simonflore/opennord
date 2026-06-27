import { readNsmp, type NsmpFile } from '../ns4/nsmp';
import type { ScannedSample } from '../folder/scan';
import type { ProgramEntry } from '../device/transfer';
import type { LibrarySource } from './types';
import type { SampleSort } from './prefs';
import { formatSlot } from '../clavia/slot';
import { matchesQuery, sortWithFavorites } from './browse';
import type { BackupRef } from '../clavia/backup/backup-index';

/** Sample codec generation, in musician-facing buckets. `npno` = piano library. */
export type SampleGeneration = 'og' | '3' | '4' | 'npno' | 'unknown';

/** One row in the Samples browser — a folder sample or a device-listed sample. */
export interface SampleEntry {
  id: string;                 // "folder:<path>" | "nord-sample:<slot>" | "backup:<bundlePath>!<entryPath>"
  name: string;
  source: LibrarySource;
  generation: SampleGeneration;
  strokeCount?: number;       // folder samples
  size?: number;              // folder samples — byte length; backup entries — entry.size
  slot?: string;              // device samples — "A:26"
  file?: NsmpFile;            // folder samples — parsed file
  bytes?: Uint8Array;         // folder samples — raw bytes for the inspector
  device?: ProgramEntry;      // device samples — the enumerated entry, for pullSample
  /** Device samples only: not referenced by any program (safe to remove). Set after a usage scan. */
  unused?: boolean;
  /** Whether this is a factory (Nord-installed) entry. Set for backup entries. */
  factory?: boolean;
  /** Backup entries only: the zip reference for on-demand extraction. */
  backupRef?: BackupRef;
}

/** Classify a parsed sample file into a generation bucket. */
export function sampleGeneration(file: NsmpFile): SampleGeneration {
  if (!file.recognized) return 'unknown';
  if (file.pianoLibrary) return 'npno';
  if (file.legacy) return 'og';
  if (file.codec === 3) return '3';
  if (file.codec === 4) return '4';
  return 'unknown';
}

/** Map folder-scanned samples into local Sample entries. */
export function sampleEntriesFromScanned(samples: ScannedSample[]): SampleEntry[] {
  return samples.map((s) => ({
    id: s.id,
    name: s.name,
    source: 'local' as const,
    generation: sampleGeneration(s.file),
    strokeCount: s.file.recognized ? s.file.strokeCount : undefined,
    size: s.bytes.length,
    file: s.file,
    bytes: s.bytes,
  }));
}

/**
 * Build a local Sample entry from a persisted import (id + filename + bytes).
 * Pure: re-parsing the same bytes always yields the same entry, so it serves a
 * fresh import and one restored from IndexedDB identically. Mirrors
 * {@link ../entries.entryFromImport} for programs.
 */
export function sampleEntryFromImport(rec: { id: string; name: string; bytes: Uint8Array }): SampleEntry {
  const file = readNsmp(rec.bytes);
  const stem = rec.name.replace(/\.[^./]+$/, '');
  return {
    id: rec.id,
    name: file.name?.trim() || stem || rec.name,
    source: 'local',
    generation: sampleGeneration(file),
    strokeCount: file.recognized ? file.strokeCount : undefined,
    size: rec.bytes.length,
    file,
    bytes: rec.bytes,
  };
}

/** Derive a generation bucket from a file extension alone (backup entries, no parsed body). */
function generationFromExtension(path: string): SampleGeneration {
  const ext = path.replace(/^.*\./, '').toLowerCase();
  if (ext === 'npno') return 'npno';
  if (ext === 'nsmp4') return '4';
  if (ext === 'nsmp3') return '3';
  if (ext === 'nsmp') return 'og';   // bare .nsmp = legacy OG format
  return 'unknown';
}

/** Build byte-free backup Sample entries — no bytes loaded, factory/user tagged via `native`. */
export function sampleEntriesFromBackupRefs(refs: BackupRef[]): SampleEntry[] {
  return refs.map((ref) => {
    const basename = ref.entry.path.replace(/^.*\//, '');
    const name = basename.replace(/\.[^.]+$/, '') || basename;
    return {
      id: `backup:${ref.bundlePath}!${ref.entry.path}`,
      name,
      source: 'backup' as const,
      generation: generationFromExtension(ref.entry.path),
      size: ref.entry.size,
      factory: ref.native,
      backupRef: ref,
    };
  });
}

/** Map the device's enumerated sample-partition files into nord Sample entries. */
export function nordSampleEntriesFromDevice(entries: ProgramEntry[]): SampleEntry[] {
  return entries.map((e) => {
    const slot = formatSlot(e.bank, e.slot);
    return { id: `nord-sample:${slot}`, name: e.name, source: 'nord' as const, generation: 'unknown' as const, slot, device: e };
  });
}

/** Filter by source tab + generation tab + case-insensitive name query + optional unused-only. */
export function filterSamples(
  entries: SampleEntry[],
  source: LibrarySource | 'all',
  generation: SampleGeneration | 'all',
  query: string,
  unusedOnly = false,
): SampleEntry[] {
  return entries.filter((e) =>
    (source === 'all' || e.source === source) &&
    (generation === 'all' || e.generation === generation) &&
    (!unusedOnly || e.unused === true) &&
    matchesQuery(e.name, query));
}

/** Order samples: favorites first, then the chosen sort. Pure, non-mutating. */
export function sortSamples(
  entries: SampleEntry[], sort: SampleSort, favorites: ReadonlySet<string>,
): SampleEntry[] {
  const byKey = (a: SampleEntry, b: SampleEntry): number => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'size') return (b.size ?? -1) - (a.size ?? -1);       // largest first, missing last
    if (sort === 'strokes') return (b.strokeCount ?? -1) - (a.strokeCount ?? -1);
    return 0; // default → input order (nord, then folder)
  };
  return sortWithFavorites(entries, favorites, byKey);
}
