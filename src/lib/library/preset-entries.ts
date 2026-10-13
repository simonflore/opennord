import { presetKindForTag, type PresetKind } from '../clavia/preset-kind';
import type { ScannedPreset } from '../folder/scan';
import type { ProgramEntry } from '../device/transfer';
import type { LibrarySource } from './types';
import type { PresetSort } from './prefs';
import { formatSlot } from '../clavia/slot';
import { identifyNordFile } from '../clavia/nord-file';
import { programNameFromFilename } from '../clavia/name';
import { matchesQuery, sortWithFavorites } from './browse';
import { foundOn, type FoundOn } from './found-on';
import { cloudEntryBase, cloudItemsOf, extensionOf } from './cloud-entries';
import type { CloudItem } from '../capabilities/types';

/** One preset in the Presets browser — a folder, device-listed or cloud preset.
 *  A row of the list is one of these carrying what it was merged from (`FoundOn`). */
export interface PresetEntry extends FoundOn {
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

/** The file extension a preset of each kind is saved and kept under. Device presets are Stage-4-only (ns4o/n/y); a folder-sourced ns3y/ns2s synth preset saves as .ns4y — its bytes are unchanged, only the filename ext. */
export const PRESET_EXT: Record<PresetKind, string> = {
  'organ-preset': 'ns4o', 'piano-preset': 'ns4n', 'synth-preset': 'ns4y',
};

/** Map folder-scanned presets into local or backup entries.
 * Bundle-sourced presets (id contains `!`) are tagged `source:'backup'`;
 * loose-file presets are tagged `source:'local'`. */
export function presetEntriesFromScanned(presets: ScannedPreset[]): PresetEntry[] {
  return presets.map((p) => ({
    id: p.id, name: p.name, source: (p.id.includes('!') ? 'backup' : 'local') as LibrarySource, kind: p.kind, size: p.bytes.length, bytes: p.bytes,
  }));
}

/** Build a local Preset entry from a persisted import (id + filename + bytes).
 *  Returns null when the bytes aren't a recognized preset — so the shared import
 *  store (which also holds programs) yields only presets here. */
export function presetEntryFromImport(rec: { id: string; name: string; bytes: Uint8Array }): PresetEntry | null {
  const kind = presetKindForTag(identifyNordFile(rec.bytes).tag);
  if (!kind) return null;
  return { id: rec.id, name: programNameFromFilename(rec.name) ?? rec.name, source: 'local', kind, size: rec.bytes.length, bytes: rec.bytes };
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
    (source === 'all' || foundOn(e).includes(source)) &&
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

/** Cloud presets as entries. The kind comes from the file's type (its extension is its tag); anything else is not a preset. */
export function cloudPresetEntries(items: CloudItem[], files: ReadonlyMap<string, Uint8Array>): PresetEntry[] {
  return cloudItemsOf(items, 'preset').flatMap((item) => {
    const kind = presetKindForTag(extensionOf(item.filename) ?? '');
    if (!kind) return [];
    const bytes = files.get(item.fingerprint);
    return [{
      ...cloudEntryBase(item), kind, ...(bytes ? { bytes, size: bytes.length } : {}),
    }];
  });
}
