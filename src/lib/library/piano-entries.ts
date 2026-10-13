import type { ScannedPiano } from '../folder/scan';
import type { ProgramEntry } from '../device/transfer';
import { readNspIdentity, readNspZones } from '../ns4/nsp';
import { resolveFactory, type FactoryMatch } from '../device/factory';
import type { LibrarySource } from './types';
import type { PianoSort } from './prefs';
import { formatSlot } from '../clavia/slot';
import { PARTITION_PIANO } from '../device/opcodes';
import { matchesQuery, sortWithFavorites } from './browse';
import type { BackupRef } from '../clavia/backup/backup-index';
import { backupPianoId, backupPianoName } from './backup-piano';
import { foundOn, type FoundOn } from './found-on';

/** One piano in the Pianos browser — a folder piano-library file, a backup's or a device-listed one.
 *  A row of the list is one of these carrying what it was merged from (`FoundOn`). */
export interface PianoEntry extends FoundOn {
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
  /** Device pianos only: not referenced by any program (safe to remove). Set after a usage scan. */
  unused?: boolean;
  /** Whether this is a factory (Nord-installed) entry. Set for backup entries. */
  isFactory?: boolean;
  /** Backup entries only: the zip reference for on-demand extraction. */
  backupRef?: BackupRef;
  /** Library version from the `.npno` header (e.g. "6.10"). Folder entries with bytes. */
  version?: string;
  /** Number of sampled notes (multisample zones), from the key map. */
  sampleCount?: number;
  /** Overall covered key range (lowest/highest MIDI note the multisample maps). */
  keyLow?: number;
  keyHigh?: number;
}

/** Map folder-scanned pianos into local entries (factory match + header metadata). */
export function pianoEntriesFromScanned(pianos: ScannedPiano[]): PianoEntry[] {
  return pianos.map((p) => {
    const base: PianoEntry = {
      id: p.id, name: p.name, source: 'local' as const, size: p.bytes.length, bytes: p.bytes,
      factory: resolveFactory(p.name, 'npno'),
    };
    // Enrich with the .npno header (version/key-map). The listing shows no checksum, so it
    // skips that pass over every (multi-MB) file. Never throws on a bad file.
    try {
      const id = readNspIdentity(p.bytes);
      if (id) {
        base.version = id.version;
        const zones = readNspZones(p.bytes);
        if (zones.length) {
          base.sampleCount = zones.length;
          base.keyLow = Math.min(...zones.map((z) => z.lowNote));
          base.keyHigh = Math.max(...zones.map((z) => z.highNote));
        }
      }
    } catch { /* header unreadable — leave metadata unset */ }
    return base;
  });
}

/** Build byte-free backup Piano entries — no bytes loaded, factory/user tagged via `native`. */
export function pianoEntriesFromBackupRefs(refs: BackupRef[]): PianoEntry[] {
  return refs.map((ref) => {
    const name = backupPianoName(ref);
    return {
      id: backupPianoId(ref),
      name,
      source: 'backup' as const,
      size: ref.entry.size,
      factory: resolveFactory(name, 'npno'),
      isFactory: undefined,
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
  return entries.filter((e) => (source === 'all' || foundOn(e).includes(source)) && matchesQuery(e.name, query));
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
