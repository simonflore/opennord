/**
 * What has to hold before Nord Sound Manager and a Stage 4 accept a piano (`.npno`) — the
 * checks we could find, re-implemented so a home-made piano can be vetted before it goes
 * near an instrument. What each side checks:
 *
 *  - NSM 9.22 file loading (CNSP byte-sum
 *    checksum), `PopulateMetaData` and `S_GetVersion` (magic,
 *    header/meta version sets, version = format·100 + CNSP+0x1A·10 via
 *    the BCD version → piano format), the V6 piano partition
 *    (`.npno` versions 500–599 and 600–699).
 *  - Stage 4 OS 1.66 ARM image: the per-file gate (magic + header version +
 *    meta version vs the instrument's piano generation, reads the directory version at
 *    +0x61C) and the loader (directory + 0x76-byte records).
 *  - The same piano code on Stage 3 OS 2.64 (ARM; gate) and Stage 2 OS 3.00
 *    (ColdFire; gate): one gate, one record layout and one set of limits on all
 *    three. They differ only in the voice table every loaded piano shares (see
 *    {@link voiceTableEntries}) and in which piano partition NSM offers (v6 needs Stage 2
 *    OS ≥ 2.29 / Stage 3 OS ≥ 1.61, older systems take v5 only).
 *  - The rest of the line (Electro, Piano, Grand, C2D, Wave, Organ, Lead): which CNSP versions
 *    each model's gate loads, and its voice table, are in `clavia/media-compat.ts`, one row per
 *    model with the firmware function it comes from. The `model` option reads that table.
 *
 * The CBIN CRC (v6) / CRC-16 trailer (v5) is what the rest of OpenNord already checks for
 * every Clavia file; whether the instrument re-checks it after a USB write is unknown.
 * See the maintainers’ notes.
 */
import { verifyTrailerChecksum } from '../clavia/crc16';
import { verifyNs4Checksum } from '../clavia/checksum';
import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { decodeNspStroke, findCnsp, readLayerTable, readNspDirectory, type NspStroke } from './nsp-audio';
import { NSP_MAX_KEYS_ABOVE_ROOT, NSP_MIN_UNDAMPED_FROM, nspChecksumKind, readNspZones } from './nsp';
import { mediaCompat, pianoVersionNumber, type MediaModelId, type PianoAcceptance } from '../clavia/media-compat';

/** CNSP checksum: byte sum of everything after the 22-byte CNSP header, over the CNSP stream
 *  (`CNSP` tag … last block; a 32-bit sum NSM checks on load). */
export function cnspChecksum(stream: Uint8Array): number {
  let sum = 0;
  for (let i = 0x16; i < stream.length; i++) sum = (sum + stream[i]) >>> 0;
  return sum;
}

export interface NpnoCheck {
  id: string;
  ok: boolean;
  detail: string;
}

export interface NpnoAcceptance {
  /** Every check passed. */
  ok: boolean;
  checks: NpnoCheck[];
  /** NSM's version for the file (e.g. 610), when the header could be read. */
  nsmVersion?: number;
}

/**
 * The instrument a piano is checked for: any model of the line. What each one loads is in
 * `clavia/media-compat.ts` (Stage 2/3/4, Electro 5, Piano 3 and the ARM pianos share one piano
 * code base; the older ColdFire models have their own gates).
 */
export type NpnoModel = MediaModelId;

/**
 * Voice-table entries the Stage 4 loader has for every loaded piano's notes together
 *. The Stage 3 has the same; see {@link voiceTableEntries}.
 */
export const VOICE_TABLE_ENTRIES = 0x6000;

/**
 * The voice table every loaded piano shares, per model (`clavia/media-compat.ts`): 0x4000
 * entries on the Stage 2, Electro 5 and Piano 3 (the ColdFire gen-5 loaders),
 * 0x6000 on the Stage 3, Stage 4 and the Piano 4/5/6, Grand and
 * Grand 2. Undefined where the firmware pass didn't establish it (older ColdFire loaders,
 * Electro 6/7) or the model loads no pianos.
 */
export function voiceTableEntries(model: NpnoModel = 'stage-4'): number | undefined {
  const p = mediaCompat(model).pianos;
  return typeof p === 'object' ? p.voiceTable : undefined;
}

/**
 * The piano rules a check applies for a model. A model whose pianos aren't established yet
 * (Stage Classic/EX, C2) is held to the Stage 4's, which the caller is told.
 */
function pianoRules(model: NpnoModel | undefined): { rules: PianoAcceptance | 'none'; traced: boolean } {
  const own = mediaCompat(model ?? 'stage-4').pianos;
  if (own === 'unknown') return { rules: mediaCompat('stage-4').pianos as PianoAcceptance, traced: false };
  return { rules: own, traced: true };
}

/** `[0x450, 0x464]` → "version 5 or 6". */
function versionsPhrase(versions: readonly number[]): string {
  const n = versions.map((v) => pianoVersionNumber(v)!);
  return n.length === 1 ? `version ${n[0]}` : `version ${n.slice(0, -1).join(', ')} or ${n[n.length - 1]}`;
}

/** Why a file of CNSP version `v` doesn't load, in a player's words. */
function versionRefusal(v: number, versions: readonly number[]): string {
  const file = pianoVersionNumber(v);
  const newest = pianoVersionNumber(Math.max(...versions))!;
  const oldest = pianoVersionNumber(Math.min(...versions))!;
  if (file === undefined) return `This file's piano version isn't one a Nord loads (this Nord loads ${versionsPhrase(versions)})`;
  if (file > newest) return `This Nord loads pianos up to version ${newest}; this file is version ${file}`;
  if (file < oldest) return `This Nord loads pianos from version ${oldest} on; this file is version ${file}`;
  return `This Nord loads pianos of ${versionsPhrase(versions)}; this file is version ${file}`;
}

/**
 * Most notes (strokes) one piano may have, on all three models: the loader compares the
 * stroke count (CNSP+0x620) with the smaller of the free voice-table entries and 0x149F and
 * shows "Piano is too big" above it (Stage 4, Stage 3, Stage 2
 *).
 */
export const MAX_PIANO_STROKES = 0x149f; // 5,279

/**
 * Layer slots per root note and stroke type (dynamic layers, key-release sounds…): 30 in
 * the Stage 4 voice setup, the same on the Stage 3 (inferred) and Stage 2
 * (inferred), where nothing bounds the count, so a 31st layer overwrites
 * whatever follows the slots.
 */
export const MAX_LAYERS_PER_ROOT = 30;

/**
 * Longest piano name, in characters: the instrument measures the name of the piano
 * partition's entry (the name the file is stored under) and shows "Piano name error" above
 * 32 (Stage 2; the Stage 3 behaves the same). Whether the `.npno` extension
 * counts is not settled, so OpenNord counts it.
 */
export const MAX_PIANO_NAME = 32;

export interface NpnoCheckOptions {
  /** Also decode every stroke (catches a broken block stream; costs a full decode). */
  deep?: boolean;
  /**
   * The instrument the piano is meant for (default `stage-4`): sets the piano versions it loads
   * and its voice-table size, per `clavia/media-compat.ts`.
   */
  model?: NpnoModel;
  /**
   * The name the piano will be stored under on the instrument (the file name, with its
   * extension). Checked against {@link MAX_PIANO_NAME} when given.
   */
  fileName?: string;
}

/** `5279` → `5,279`. */
const thousands = (n: number) => n.toLocaleString('en-US');

/** Header versions NSM's CNSP reader accepts: 0x423–0x430, 0x440, 0x450, 0x464. */
function headerVersionKnown(v: number): boolean {
  return (v >= 0x423 && v <= 0x430) || v === 0x440 || v === 0x450 || v === 0x464;
}
/** The meta-block version set is wider at the bottom: 0x407–0x430, 0x440, 0x450, 0x464. */
function metaVersionKnown(v: number): boolean {
  return (v >= 0x407 && v <= 0x430) || v === 0x440 || v === 0x450 || v === 0x464;
}

/**
 * Run every known acceptance check. `deep` also decodes every stroke (catches a broken
 * block stream; costs a full decode); `model` picks the instrument (default Stage 4) and
 * `fileName` adds the name-length check.
 */
export function checkNpnoAcceptance(bytes: Uint8Array, opts: NpnoCheckOptions = {}): NpnoAcceptance {
  const checks: NpnoCheck[] = [];
  const add = (id: string, ok: boolean, detail: string) => { checks.push({ id, ok, detail }); return ok; };
  const done = (nsmVersion?: number): NpnoAcceptance => ({ ok: checks.every((c) => c.ok), checks, nsmVersion });

  if (opts.fileName !== undefined) {
    const n = opts.fileName.length;
    add('name-length', n <= MAX_PIANO_NAME, n <= MAX_PIANO_NAME
      ? `the name "${opts.fileName}" fits a Nord (${n} of ${MAX_PIANO_NAME} characters)`
      : `The name "${opts.fileName}" is too long for a Nord (${n} characters, ${MAX_PIANO_NAME} at most) — it would show "Piano name error"`);
  }
  const { rules, traced } = pianoRules(opts.model);
  if (rules === 'none') {
    add('model-pianos', false, "This Nord doesn't load pianos");
    return done();
  }
  if (!traced) {
    add('model-pianos', true, "OpenNord doesn't know yet which pianos this Nord loads; checked as for a Stage 4");
  }
  if (!add('cbin', hasCbinMagic(bytes) && fileTypeTag(bytes) === 'npno', 'CBIN magic and the `npno` type tag')) return done();
  const cnsp = findCnsp(bytes);
  if (!add('cnsp-tag', cnsp === 0x2c || cnsp === 0x18, `CNSP tag at 0x2C (v6 envelope) or 0x18 (v5); found ${cnsp < 0 ? 'none' : `0x${cnsp.toString(16)}`}`)) return done();
  // The header's format byte names the envelope (and so the checksum) the CNSP position implies;
  // `readNsp` and the backup check call a file whose two disagree damaged, and so does this.
  add('cbin-format', nspChecksumKind(bytes) !== undefined, `CBIN format byte ${bytes[4]} matches the CNSP position (1 → 0x2C, 0 → 0x18)`);
  const v6 = cnsp === 0x2c;
  if (v6) {
    add('cbin-crc32', verifyNs4Checksum(bytes), 'CRC-32 of bytes[0x2C:] at 0x18 (v6 envelope)');
  } else {
    add('cbin-crc16', verifyTrailerChecksum(bytes), 'CRC-16/CCITT-FALSE trailer over the file (v5 envelope)');
  }
  const end = v6 ? bytes.length : bytes.length - 2;
  const u16 = (o: number) => (bytes[o] << 8) | bytes[o + 1];
  const u32 = (o: number) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;

  const version = u16(cnsp + 4);
  add('header-version', headerVersionKnown(version), `CNSP header version 0x${version.toString(16)} in the accepted set`);
  const meta = u16(cnsp + 0x16);
  add('meta-version', metaVersionKnown(meta), `metadata version 0x${meta.toString(16)} in the accepted set`);
  add('cnsp-checksum', cnspChecksum(bytes.subarray(cnsp, end)) === u32(cnsp + 6), 'CNSP byte-sum checksum at +0x06 (a mismatch is refused)');

  // Piano format from the BCD version: only 0x440/0x450/0x464 map to a format (4/5/6).
  const format = pianoVersionNumber(version);
  const nsmVersion = format === undefined ? undefined : format * 100 + bytes[cnsp + 0x1a] * 10;
  add('nsm-format', format !== undefined, 'header version maps to a piano format');
  if (nsmVersion !== undefined) {
    // NSM's V6 piano partition (Stage 4; Stage 3 OS ≥ 1.61,; Stage 2 OS ≥ 2.29,
    //) takes 500–699; older Stage 2/3 systems only get the V5 partition (500–599).
    // For other models the range follows the versions the firmware loads (media-compat);
    // NSM's own partition per model wasn't traced beyond the Stage line. The id is historical.
    const lo = pianoVersionNumber(Math.min(...rules.versions))! * 100;
    const hi = pianoVersionNumber(Math.max(...rules.versions))! * 100 + 99;
    add('stage4-partition', nsmVersion >= lo && nsmVersion <= hi, `Piano version ${nsmVersion} within the piano partition (${lo}–${hi})`);
    const cbinVersion = bytes[0x14] | (bytes[0x15] << 8);
    add('cbin-version', cbinVersion === nsmVersion, `CBIN version ${cbinVersion} matches the CNSP version ${nsmVersion} (true of every factory file)`);
  }
  // The gate (Stage 4, Stage 3, Stage 2) takes the header,
  // metadata and directory (below) versions only when the instrument's piano generation is
  // below each version's threshold: 3/4/5/6/7 for 0x423–0x42F/0x430/0x440/0x450/0x464. All three
  // models build their piano manager with generation 5 and 120 slots (Stage 4 {4, 120, 5} at
  // →; Stage 3 →; Stage 2 →
  //), so only v5 (0x450) and v6 (0x464) load there; 0x423–0x440 are rejected
  // ("Unsupported version"). Other models differ (media-compat): the Electro 3 HP, Electro 4,
  // Piano 1 and Piano 2 load v5 only, the Electro 3 v4 and v5. The id keeps its historical name.
  const bad = [version, meta].find((v) => !rules.versions.some((x) => x === v));
  add('stage4-generation', bad === undefined, bad === undefined
    ? `header (0x${version.toString(16)}) and metadata (0x${meta.toString(16)}) versions are ones this Nord loads (${versionsPhrase(rules.versions)})`
    : versionRefusal(bad, rules.versions));

  const dir = readNspDirectory(bytes);
  add('directory', !!dir, 'stroke directory (+0x61C) and records (+0x732) readable, blocks inside the file');
  if (!dir) return done(nsmVersion);
  const { strokes } = dir;
  add('directory-version', u16(cnsp + 0x61c) === version, 'directory version (+0x61C) equals the header version');
  const layers = readLayerTable(bytes, cnsp).reduce((a, b) => a + b, 0);
  add('layer-table', layers === strokes.length, `layers-per-root table sums to the stroke count (${layers} / ${strokes.length})`);
  const blockEnd = (s: NspStroke) => s.offset + s.blocks * dir.blockWords * 2;
  const contiguous = strokes.every((s, i) => i === 0 || s.offset === blockEnd(strokes[i - 1]));
  add('contiguous', contiguous && blockEnd(strokes[strokes.length - 1]) === end, 'strokes are back to back and run to the end of the CNSP stream');
  add('block-size', dir.blockWords === 511 * dir.channels, `block size ${dir.blockWords} words (511 per channel)`);
  // "Piano is too big": the loader refuses more strokes than the smaller of 0x149F and the
  // free voice-table entries (Stage 4, Stage 3, Stage 2).
  // Where a model's own limit wasn't read (media-compat `maxStrokes` absent), the line's
  // 0x149F still holds the file to what every traced Nord takes.
  const count = strokes.length;
  add('piano-size', count <= MAX_PIANO_STROKES, count <= MAX_PIANO_STROKES
    ? `${thousands(count)} recorded notes, within the ${thousands(MAX_PIANO_STROKES)} a Nord loads in one piano`
    : `This piano has more notes than a Nord can load (${thousands(count)}; ${thousands(MAX_PIANO_STROKES)} at most) — it would show "Piano is too big"`);
  // The voice table is shared with every loaded piano, so a file can only be held to the
  // empty-instrument bound; whether it fits next to the others only the instrument knows.
  // Skipped where the model's table size wasn't established (media-compat `voiceTable`).
  const table = rules.voiceTable;
  if (table !== undefined) {
    add('voice-table', count <= table, count <= table
      ? `${thousands(count)} notes fit the instrument's voice table (${thousands(table)} entries, shared with every loaded piano)`
      : `This piano has more notes than this Nord has room for (${thousands(count)}; ${thousands(table)} at most, shared with every loaded piano) — it would show "Piano is too big"`);
  }
  // 30 layer slots per root and stroke type (Stage 4; Stage 2 has no
  // bound check, so more would overwrite memory there).
  const perSlot = new Map<string, number>();
  for (const s of strokes) {
    const key = `${s.zone}:${s.flags}`;
    perSlot.set(key, (perSlot.get(key) ?? 0) + 1);
  }
  const mostLayers = Math.max(0, ...perSlot.values());
  add('layers-per-zone', mostLayers <= MAX_LAYERS_PER_ROOT, mostLayers <= MAX_LAYERS_PER_ROOT
    ? `at most ${mostLayers} layers per key zone (a Nord has room for ${MAX_LAYERS_PER_ROOT})`
    : `A key zone has ${mostLayers} layers; a Nord has room for ${MAX_LAYERS_PER_ROOT} per zone (and as many key-release sounds)`);
  // Strokes are stored by root (lowest first), the key map by key: the two orders must agree,
  // and every key-map root must have strokes, or a key plays another zone's recording.
  const zones = readNspZones(bytes);
  const tableRoots = readLayerTable(bytes, cnsp).flatMap((c, n) => (c > 0 ? [n] : []));
  const keyRoots = zones.map((z) => z.rootNote);
  add('key-map', keyRoots.length > 0 && keyRoots.join() === tableRoots.join(),
    `key-map zones (${keyRoots.length}) match the notes' roots (${tableRoots.length}), with roots rising with the keys`);
  // No key more than one above its zone's root: the loader's pre-loop table index is
  // `root − key + 1`, and a key two above its root froze an instrument in an independent test (NSP_MAX_KEYS_ABOVE_ROOT).
  const high = zones.find((z) => z.highNote > z.rootNote + NSP_MAX_KEYS_ABOVE_ROOT);
  add('key-reach', !high, high
    ? `Key ${high.highNote} plays a recording stored for note ${high.rootNote}: a Nord plays a recording at most `
      + `${NSP_MAX_KEYS_ABOVE_ROOT} key above its stored note, and a higher key can freeze the instrument`
    : `no key is more than ${NSP_MAX_KEYS_ABOVE_ROOT} above its zone's stored note (as in every factory piano)`);
  // Header +0x40D, the first key without a damper: every factory piano has it at 89 or above.
  // Lower, keys from there up ring on after key-up (on a Stage 2, every key when it is 0).
  const undampedFrom = bytes[cnsp + 0x40d];
  add('dampers', undampedFrom >= NSP_MIN_UNDAMPED_FROM, undampedFrom >= NSP_MIN_UNDAMPED_FROM
    ? `keys below ${undampedFrom} stop when let go (as in every factory piano)`
    : `Keys from ${undampedFrom} up have no damper: they ring on after you let go, as if the pedal were down. `
      + 'Make this piano again with the current OpenNord');
  if (opts.deep) {
    let bad = '';
    for (const s of strokes) {
      try { decodeNspStroke(bytes, dir, s); } catch (e) { bad = (e as Error).message; break; }
    }
    add('decode', !bad, bad || 'every stroke decodes to its directory length');
  }
  return done(nsmVersion);
}
