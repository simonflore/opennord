/**
 * Find the piano a program uses among the user's own local pianos (folder scan or
 * backup), so it can be auditioned on this machine. Pure; never fetches anything.
 *
 * ## How a program names its piano
 * A Stage 4 program stores a 32-bit piano model id. `PIANO_NAMES` (ns4decode's table)
 * turns it into the instrument's panel name: "White Grand XL", "Royal Grand 3D Lrg",
 * "Clavinet D6 6.1". The id can't be computed from a `.npno` file — CRC, header fields
 * and common string hashes of its name/filename were all checked against the three
 * real files on hand without a hit (2026-10-10) — so the match is by **name**.
 *
 * ## How a local piano is named
 * - On the Nord / in a backup: "<panel name> <version>" ("EP1 Deep Timbre Lrg 6.0").
 * - Downloaded from Nord: the catalog filename, which also spells out the recorded
 *   instrument for v5 libraries ("Royal_Grand_3D_YaS6_XL_5.4", "Electric_Grand_1_CP80__5.3").
 * - The file header carries "name#instrument" + version, but not the size.
 *
 * ## The rule (conservative)
 * Underscores → spaces, whitespace collapsed, case folded, a trailing version split off.
 * A local piano matches when that model text equals the program's exactly — after, for
 * Nord's download names, dropping the instrument token the file's own header names.
 * When the program's name carries a version ("Clavinet D6 6.1") the versions must agree
 * too. A renamed file ("clav61.npno") falls back to its header name, which only equals a
 * program name for pianos sold in one size. No fuzzy or partial matching.
 *
 * ## The limit
 * Most panel names don't say the version, and Nord re-released many pianos (v5 → v6)
 * under the same name: `PIANO_NAMES` lists several ids for "White Grand XL". When it
 * does, the local copy is the right instrument but may not be the exact recording the
 * program was saved with — `versionUncertain` says so.
 */
import type { ScannedPiano } from '../folder/scan';
import type { BackupRef } from '../clavia/backup/backup-index';
import { readNspIdentity, type NspIdentity } from '../ns4/nsp';
import { PIANO_NAMES } from '../ns4/names.generated';
import { pianoNameFromFilename } from '../clavia/name';

/** A piano the user has on this machine, as far as matching needs it. */
export interface LocalPiano {
  id: string;
  /** File name without `.npno` ("White Grand XL 6.3", "Electric_Grand_1_CP80__5.3"). */
  name: string;
  source: 'local' | 'backup';
  /** Folder pianos: the file, ready to play. */
  bytes?: Uint8Array;
  /** Backup pianos: where to extract it from, on request. */
  backupRef?: BackupRef;
  /** From the file header (folder pianos only). */
  header?: NspIdentity;
}

export interface PianoKey {
  /** Normalized name without the version: "white grand xl". */
  model: string;
  /** Version as major·100 + minor: 6.3 → 630, 6.10 → 610. */
  version?: number;
}

export interface ProgramPianoMatch {
  piano: LocalPiano;
  /** Version of the local copy as a musician reads it ("6.3"), when known. */
  version?: string;
  /** The program names its version, and this copy is that version. */
  exactVersion: boolean;
  /** Nord made this piano in more than one version and the program doesn't say which. */
  versionUncertain: boolean;
}

/** Underscores → spaces, whitespace collapsed, lower case, `.npno` dropped. */
export function normalizePianoName(s: string): string {
  return s.replace(/\.npno$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** "6.3" / "6.30" → 630, "6.10" → 610 (device names use one digit, headers two). */
export function versionNumber(v: string): number | undefined {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(v.trim());
  if (!m) return undefined;
  return Number(m[1]) * 100 + (m[2].length === 1 ? Number(m[2]) * 10 : Number(m[2]));
}

/** 630 → "6.3", 610 → "6.1", 625 → "6.25" — the way Nord writes piano versions. */
export function versionLabel(v: number): string {
  const major = Math.trunc(v / 100);
  const minor = v - major * 100;
  return `${major}.${minor % 10 === 0 ? minor / 10 : String(minor).padStart(2, '0')}`;
}

/** Split a piano name into model + version: "White_Grand_XL_6.3" → { "white grand xl", 630 }. */
export function pianoKey(name: string): PianoKey {
  const n = normalizePianoName(name);
  const m = /(?<![\d.])(\d{1,2}\.\d{1,2})$/.exec(n);
  const model = m ? n.slice(0, m.index).trim() : '';
  if (!m || !model) return { model: n };
  return { model, version: versionNumber(m[1]) };
}

const startsWithWord = (s: string, prefix: string) => s === prefix || s.startsWith(`${prefix} `);

/** Every name this local piano can fairly be matched under. */
export function localPianoKeys(p: LocalPiano): PianoKey[] {
  const fromName = pianoKey(p.name);
  const headerVersion = p.header?.versionRaw;
  const version = headerVersion ?? fromName.version;
  const keys: PianoKey[] = [{ model: fromName.model, version }];
  const head = p.header?.name ? normalizePianoName(p.header.name) : '';
  if (!head) return keys;
  const variant = p.header?.variant ? normalizePianoName(p.header.variant) : '';
  // Nord's download names spell out the recorded instrument after the name
  // ("royal grand 3d yas6 xl"); the panel name leaves it out ("royal grand 3d xl").
  if (variant && startsWithWord(fromName.model, `${head} ${variant}`)) {
    const rest = fromName.model.slice(head.length + variant.length + 2).trim();
    keys.push({ model: rest ? `${head} ${rest}` : head, version });
  }
  // A renamed file: only its header says what it is.
  if (!startsWithWord(fromName.model, head)) keys.push({ model: head, version: headerVersion });
  return keys;
}

let namesByModel: Map<string, number> | undefined;
/** How many piano ids `PIANO_NAMES` lists under this (normalized) name. */
export function knownVersionCount(programPiano: string): number {
  if (!namesByModel) {
    namesByModel = new Map();
    for (const n of Object.values(PIANO_NAMES)) {
      const k = normalizePianoName(n);
      namesByModel.set(k, (namesByModel.get(k) ?? 0) + 1);
    }
  }
  return namesByModel.get(normalizePianoName(programPiano)) ?? 0;
}

/**
 * The local piano a program's piano layer plays, or null. `programPiano` is the name the
 * program view shows ("White Grand XL"). Prefers a folder copy (plays at once) over a
 * backup one, then the newest version.
 */
export function findProgramPiano(programPiano: string, locals: readonly LocalPiano[]): ProgramPianoMatch | null {
  const want = pianoKey(programPiano);
  if (!want.model || want.model === '—' || want.model === 'name unknown') return null;
  const hits: { piano: LocalPiano; version?: number }[] = [];
  for (const piano of locals) {
    if (!piano.bytes && !piano.backupRef) continue;
    const key = localPianoKeys(piano).find((k) =>
      k.model === want.model && (want.version === undefined || k.version === want.version));
    if (key) hits.push({ piano, version: key.version });
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) =>
    Number(!!b.piano.bytes) - Number(!!a.piano.bytes)
    || (b.version ?? -1) - (a.version ?? -1)
    || a.piano.name.localeCompare(b.piano.name));
  const best = hits[0];
  return {
    piano: best.piano,
    version: best.version !== undefined ? versionLabel(best.version) : undefined,
    exactVersion: want.version !== undefined,
    versionUncertain: want.version === undefined && knownVersionCount(programPiano) > 1,
  };
}

// Header reads are cached per file: the folder hands the same bytes to every render.
const identityCache = new WeakMap<Uint8Array, NspIdentity | null>();
function identityOf(bytes: Uint8Array): NspIdentity | undefined {
  let id = identityCache.get(bytes);
  if (id === undefined) {
    try { id = readNspIdentity(bytes) ?? null; } catch { id = null; }
    identityCache.set(bytes, id);
  }
  return id ?? undefined;
}

/** The pianos a linked folder holds: loose `.npno` files plus those inside backups. */
export function localPianos(folder: { pianos: readonly ScannedPiano[]; backupPianos: readonly BackupRef[] }): LocalPiano[] {
  return [
    ...folder.pianos.map((p): LocalPiano => ({
      id: p.id, name: p.name, source: 'local', bytes: p.bytes, header: identityOf(p.bytes),
    })),
    ...folder.backupPianos.map((ref): LocalPiano => ({
      id: `backup:${ref.bundlePath}!${ref.entry.path}`,
      name: pianoNameFromFilename(ref.entry.path),
      source: 'backup',
      backupRef: ref,
    })),
  ];
}
