import type { LibraryEntry, LibrarySource, LibrarySort } from './types';
import type { ProgramEntry } from '../device/transfer';
import type { ScannedProgram } from '../folder/scan';
import { formatSlot } from '../clavia/slot';
import { isNs4Program, parseClaviaFile } from '../formats';
import { identifyNordFile } from '../clavia/nord-file';
import { programNameFromFilename } from '../clavia/name';
import { programCategoryName, PROGRAM_CATEGORY } from '../clavia/categories';
import { activeEngineKinds, engineSearchText, type EngineKind } from '../clavia/engines';
import { isSplit } from '../ns4/view';
import { matchesAny, sortWithFavorites } from './browse';
import { foundOn } from './found-on';
import { cloudEntryBase, cloudItemsOf, extensionOf } from './cloud-entries';
import type { CloudItem } from '../capabilities/types';

/** Category names in Nord's canonical id order, de-duplicated — for the facet. */
const CATEGORY_ORDER: string[] = [...new Set(Object.values(PROGRAM_CATEGORY))];

/** Type badge (e.g. ".ns4p") + generation + category for a local/backup file's entry. */
function fileMetaFor(bytes: Uint8Array): Pick<LibraryEntry, 'typeLabel' | 'generation' | 'category'> {
  const info = identifyNordFile(bytes);
  if (!info.recognized) return {};
  const generation = info.generation === 'Stage 2' || info.generation === 'Stage 3' || info.generation === 'Stage 4'
    ? info.generation : undefined;
  return { typeLabel: info.tag ? `.${info.tag}` : undefined, generation, category: info.categoryName };
}

/** The Library id of the program in a Nord slot, e.g. "nord:A:26". */
export function nordEntryId(e: Pick<ProgramEntry, 'bank' | 'slot'>): string {
  return `nord:${formatSlot(e.bank, e.slot)}`;
}

/** Map the device's enumerated programs into Library entries. */
export function nordEntriesFromDevice(entries: ProgramEntry[]): LibraryEntry[] {
  return entries.map((e) => ({
    id: nordEntryId(e), name: e.name, source: 'nord', slot: formatSlot(e.bank, e.slot), category: programCategoryName(e.categoryId),
    // The type, so a file with this slot's name is hinted only when it is the same kind of file.
    typeLabel: `.${e.fourcc}`,
  }));
}

/** A Nord entry once its program has been read from the keyboard: it plays,
 *  shows and sends like a file (one OpenNord can't decode shows as such, as an
 *  imported file does). */
export function nordEntryWithProgram(entry: LibraryEntry, bytes: Uint8Array): LibraryEntry {
  const file = parseClaviaFile(bytes);
  file.program.name = entry.name;
  return { ...entry, engines: file.engines, program: file.program, bytes };
}

/**
 * Build a local Library entry from a persisted import (id + filename + bytes).
 * Pure: parsing the same bytes always yields the same entry, so it works equally
 * for a freshly-imported file and one restored from IndexedDB on reload.
 */
export function entryFromImport(rec: { id: string; name: string; bytes: Uint8Array }): LibraryEntry {
  const file = parseClaviaFile(rec.bytes);
  const program = file.program;
  program.name = programNameFromFilename(rec.name);
  return {
    id: rec.id,
    name: program.name ?? rec.name,
    source: 'local',
    ...fileMetaFor(rec.bytes),
    engines: file.engines,
    program,
    bytes: rec.bytes,
  };
}

/**
 * What a program plays, for the LED filter keys: every engine in `engines` must
 * be active, and with `split` the keyboard must be split (a Stage 4 program).
 */
export interface EntryTraits { engines: ReadonlySet<EngineKind>; split: boolean }

/** Filter by source tab + format generation + category + query (name/category/engine) + traits. */
export function filterEntries(
  entries: LibraryEntry[], source: LibrarySource | 'all', query: string,
  generation: LibraryEntry['generation'] | 'all' = 'all',
  category: string | 'all' = 'all',
  traits?: EntryTraits,
): LibraryEntry[] {
  return entries.filter((e) =>
    (source === 'all' || foundOn(e).includes(source)) &&
    (generation === 'all' || e.generation === generation) &&
    (category === 'all' || e.category === category) &&
    (!traits || hasTraits(e, traits)) &&
    matchesAny([e.name, e.category, e.engines && engineSearchText(e.engines)], query));
}

function hasTraits(e: LibraryEntry, { engines, split }: EntryTraits): boolean {
  if (engines.size) {
    if (!e.engines) return false;
    const active = activeEngineKinds(e.engines);
    for (const k of engines) if (!active.has(k)) return false;
  }
  return !split || (!!e.program && isNs4Program(e.program) && isSplit(e.program));
}

/** Distinct categories present in the entries, in Nord's canonical order — for the facet. */
export function presentCategories(entries: LibraryEntry[]): string[] {
  const have = new Set(entries.map((e) => e.category).filter((c): c is string => c != null));
  return CATEGORY_ORDER.filter((c) => have.has(c));
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
    if (sort === 'source') return foundOn(a)[0].localeCompare(foundOn(b)[0]) || a.name.localeCompare(b.name);
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
    ...fileMetaFor(p.bytes),
    engines: p.engines,
    program: p.program,
    bytes: p.bytes,
  }));
}

/** Cloud items as Library entries: like an unread Nord slot until the file has been fetched, like a file after. */
export function cloudProgramEntries(items: CloudItem[], files: ReadonlyMap<string, Uint8Array>): LibraryEntry[] {
  return cloudItemsOf(items, 'program').map((item) => {
    const ext = extensionOf(item.filename);
    const bare: LibraryEntry = {
      ...cloudEntryBase(item), ...(ext ? { typeLabel: `.${ext}` } : {}),
    };
    const bytes = files.get(item.fingerprint);
    return bytes ? withProgram(bare, bytes) : bare;
  });
}

// Parsed once per fetched file: the list is rebuilt on every snapshot or read, the parse is not.
const parsed = new WeakMap<Uint8Array, Pick<LibraryEntry, 'program' | 'engines' | 'generation' | 'category'>>();
function withProgram(entry: LibraryEntry, bytes: Uint8Array): LibraryEntry {
  let p = parsed.get(bytes);
  if (!p) {
    // parseClaviaFile hands back a placeholder for bytes it doesn't recognise, rather
    // than throwing: such a file stays listed without a program, and says so when opened.
    if (identifyNordFile(bytes).recognized) {
      const file = parseClaviaFile(bytes);
      const meta = fileMetaFor(bytes);
      p = { program: file.program, engines: file.engines, generation: meta.generation, category: meta.category };
    } else {
      p = {};
    }
    parsed.set(bytes, p);
  }
  // The finished entry too, so a rebuilt list keeps this row's identity (and its memoised table row).
  const done = finished.get(bytes);
  if (done && done.id === entry.id && done.name === entry.name && done.slot === entry.slot && done.typeLabel === entry.typeLabel) return done;
  const next = { ...entry, ...p, ...(p.program ? { program: { ...p.program, name: entry.name } } : {}), bytes };
  finished.set(bytes, next);
  return next;
}
const finished = new WeakMap<Uint8Array, LibraryEntry>();
