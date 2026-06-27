import type { ScannedPiano } from '../folder/scan';
import type { ProgramEntry } from '../device/transfer';
import { resolveFactory, type FactoryMatch } from '../device/factory';
import type { LibrarySource } from './types';
import type { PianoSort } from './prefs';
import { formatSlot } from '../clavia/slot';
import { PARTITION_PIANO } from '../device/opcodes';
import { matchesQuery, sortWithFavorites } from './browse';
import type { BackupRef } from '../clavia/backup/backup-index';

/** One row in the Pianos browser — a folder piano-library file or a device-listed one. */
export interface PianoEntry {
  id: string;            // "folder:<path>" | "nord-piano:<slot>" | "backup:<bundlePath>!<entryPath>"
  name: string;
  source: LibrarySource;
  size?: number;         // folder/backup — byte length
  slot?: string;         // device — "A:26"
  device?: ProgramEntry; // device — for pullPiano
  partition?: number;    // device — PARTITION_PIANO
  bytes?: Uint8Array;    // folder — raw file, for download
  /** Precomputed factory deep-link (resolveFactory), or null for user-created. */
  factory: FactoryMatch | null;
  /** Whether this is a factory (Nord-installed) entry. Set for backup entries. */
  isFactory?: boolean;
  /** Backup entries only: the zip reference for on-demand extraction. */
  backupRef?: BackupRef;
}

/** Map folder-scanned pianos into local entries (factory match precomputed). */
export function pianoEntriesFromScanned(pianos: ScannedPiano[]): PianoEntry[] {
  return pianos.map((p) => ({
    id: p.id, name: p.name, source: 'local' as const, size: p.bytes.length, bytes: p.bytes,
    factory: resolveFactory(p.name, 'npno'),
  }));
}

/** Build byte-free backup Piano entries — no bytes loaded, factory/user tagged via `native`. */
export function pianoEntriesFromBackupRefs(refs: BackupRef[]): PianoEntry[] {
  return refs.map((ref) => {
    const basename = ref.entry.path.replace(/^.*\//, '');
    const name = basename.replace(/\.[^.]+$/, '') || basename;
    return {
      id: `backup:${ref.bundlePath}!${ref.entry.path}`,
      name,
      source: 'backup' as const,
      size: ref.entry.size,
      factory: resolveFactory(name, 'npno'),
      isFactory: ref.native,
      backupRef: ref,
    };
  });
}

/** Map the device's enumerated Piano Library files into nord entries. */
export function pianoEntriesFromDevice(entries: ProgramEntry[]): PianoEntry[] {
  return entries.map((e) => {
    const slot = formatSlot(e.bank, e.slot);
    return { id: `nord-piano:${slot}`, name: e.name, source: 'nord' as const, slot, device: e, partition: PARTITION_PIANO, factory: resolveFactory(e.name, 'npno') };
  });
}

/** Filter by source + case-insensitive name query. */
export function filterPianos(entries: PianoEntry[], source: LibrarySource | 'all', query: string): PianoEntry[] {
  return entries.filter((e) => (source === 'all' || e.source === source) && matchesQuery(e.name, query));
}

/** Order pianos: favorites first, then the chosen sort. Pure, non-mutating. */
export function sortPianos(entries: PianoEntry[], sort: PianoSort, favorites: ReadonlySet<string>): PianoEntry[] {
  const byKey = (a: PianoEntry, b: PianoEntry): number => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'size') return (b.size ?? -1) - (a.size ?? -1);
    return 0; // default → input order (nord, then folder)
  };
  return sortWithFavorites(entries, favorites, byKey);
}
