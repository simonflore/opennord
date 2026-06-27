import type { PresetKind } from '../clavia/preset-kind';
import type { ScannedPreset } from '../folder/scan';
import type { ProgramEntry } from '../device/transfer';
import type { LibrarySource } from './types';
import type { PresetSort } from './prefs';
import { formatSlot } from '../clavia/slot';
import { matchesQuery, sortWithFavorites } from './browse';

/** One row in the Presets browser — a folder preset or a device-listed preset. */
export interface PresetEntry {
  id: string;            // "folder:<path>" | "nord-preset:<partition>:<slot>"
  name: string;
  source: LibrarySource;
  kind: PresetKind;
  slot?: string;         // device — "A:26"
  size?: number;         // folder — byte length
  device?: ProgramEntry; // device — the enumerated entry, for pullPreset
  partition?: number;    // device — the preset partition index, for pullPreset
  bytes?: Uint8Array;     // folder — raw file, for download
}

const KIND_ORDER: PresetKind[] = ['organ-preset', 'piano-preset', 'synth-preset'];

/** Map folder-scanned presets into local or backup entries.
 * Bundle-sourced presets (id contains `!`) are tagged `source:'backup'`;
 * loose-file presets are tagged `source:'local'`. */
export function presetEntriesFromScanned(presets: ScannedPreset[]): PresetEntry[] {
  return presets.map((p) => ({
    id: p.id, name: p.name, source: (p.id.includes('!') ? 'backup' : 'local') as LibrarySource, kind: p.kind, size: p.bytes.length, bytes: p.bytes,
  }));
}

/** Map the device's enumerated preset partitions into nord entries. */
export function presetEntriesFromDevice(
  groups: { kind: PresetKind; partition: number; entries: ProgramEntry[] }[],
): PresetEntry[] {
  return groups.flatMap((g) =>
    g.entries.map((e) => {
      const slot = formatSlot(e.bank, e.slot);
      return { id: `nord-preset:${g.partition}:${slot}`, name: e.name, source: 'nord' as const, kind: g.kind, slot, device: e, partition: g.partition };
    }));
}

/** Filter by source + kind + case-insensitive name query. */
export function filterPresets(
  entries: PresetEntry[], source: LibrarySource | 'all', kind: PresetKind | 'all', query: string,
): PresetEntry[] {
  return entries.filter((e) =>
    (source === 'all' || e.source === source) &&
    (kind === 'all' || e.kind === kind) &&
    matchesQuery(e.name, query));
}

/** Order presets: favorites first, then the chosen sort. Pure, non-mutating. */
export function sortPresets(entries: PresetEntry[], sort: PresetSort, favorites: ReadonlySet<string>): PresetEntry[] {
  const byKey = (a: PresetEntry, b: PresetEntry): number => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'size') return (b.size ?? -1) - (a.size ?? -1);
    return 0; // default → input order (nord, then folder)
  };
  return sortWithFavorites(entries, favorites, byKey);
}

/** Distinct kinds present in the entries, in canonical order — for the data-driven facet. */
export function presentKinds(entries: PresetEntry[]): PresetKind[] {
  const have = new Set(entries.map((e) => e.kind));
  return KIND_ORDER.filter((k) => have.has(k));
}
