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
 *    meta version vs the instrument's oldest supported piano generation, reads the directory
 *    version at +0x61C) and the loader (directory + 0x76-byte records).
 *
 * The CBIN CRC (v6) / CRC-16 trailer (v5) is what the rest of OpenNord already checks for
 * every Clavia file; whether the instrument re-checks it after a USB write is unknown.
 * See the maintainers’ notes.
 */
import { verifyTrailerChecksum } from '../clavia/crc16';
import { verifyNs4Checksum } from '../clavia/checksum';
import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { decodeNspStroke, findCnsp, readLayerTable, readNspDirectory, type NspStroke } from './nsp-audio';
import { nspChecksumKind, readNspZones } from './nsp';

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

/** Voice-table entries the Stage 4 loader has for every loaded piano's notes together. */
export const VOICE_TABLE_ENTRIES = 0x6000;

/** Header versions NSM's CNSP reader accepts: 0x423–0x430, 0x440, 0x450, 0x464. */
function headerVersionKnown(v: number): boolean {
  return (v >= 0x423 && v <= 0x430) || v === 0x440 || v === 0x450 || v === 0x464;
}
/** The meta-block version set is wider at the bottom: 0x407–0x430, 0x440, 0x450, 0x464. */
function metaVersionKnown(v: number): boolean {
  return (v >= 0x407 && v <= 0x430) || v === 0x440 || v === 0x450 || v === 0x464;
}
/** Piano format from the BCD version: only 0x440/0x450/0x464 map to a format. */
function pianoFormat(v: number): number | undefined {
  return ({ 0x440: 4, 0x450: 5, 0x464: 6 } as Record<number, number>)[v];
}

/**
 * Run every known acceptance check. `deep` also decodes every stroke (catches a broken
 * block stream; costs a full decode).
 */
export function checkNpnoAcceptance(bytes: Uint8Array, opts: { deep?: boolean } = {}): NpnoAcceptance {
  const checks: NpnoCheck[] = [];
  const add = (id: string, ok: boolean, detail: string) => { checks.push({ id, ok, detail }); return ok; };
  const done = (nsmVersion?: number): NpnoAcceptance => ({ ok: checks.every((c) => c.ok), checks, nsmVersion });

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

  const format = pianoFormat(version);
  const nsmVersion = format === undefined ? undefined : format * 100 + bytes[cnsp + 0x1a] * 10;
  add('nsm-format', format !== undefined, 'header version maps to a piano format');
  if (nsmVersion !== undefined) {
    add('stage4-partition', nsmVersion >= 500 && nsmVersion <= 699, `NSM version ${nsmVersion} within the Stage 4 piano partition (500–699)`);
    const cbinVersion = bytes[0x14] | (bytes[0x15] << 8);
    add('cbin-version', cbinVersion === nsmVersion, `CBIN version ${cbinVersion} matches the CNSP version ${nsmVersion} (true of every factory file)`);
  }
  // Stage 4's gate accepts the header version and the metadata version (and the
  // directory version, below) only when each is at least the instrument's oldest supported
  // piano generation; NSM lists v5 and v6 for the Stage 4.
  const stage4 = (v: number) => v === 0x450 || v === 0x464;
  add('stage4-generation', stage4(version) && stage4(meta),
    `header (0x${version.toString(16)}) and metadata (0x${meta.toString(16)}) versions are v5 (0x450) or v6 (0x464) — the generations the Stage 4 piano partition lists`);

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
  // The loader stops with an error state when the strokes outnumber the free
  // voice-table entries: 0x6000 minus what the pianos already loaded use (and a firmware cap
  // not traced yet). A file can only be held to the empty-instrument bound.
  add('voice-table', strokes.length <= VOICE_TABLE_ENTRIES,
    `${strokes.length} notes fit the instrument's voice table (${VOICE_TABLE_ENTRIES} entries, shared with every loaded piano)`);
  // Strokes are stored by root (lowest first), the key map by key: the two orders must agree,
  // and every key-map root must have strokes, or a key plays another zone's recording.
  const zones = readNspZones(bytes);
  const tableRoots = readLayerTable(bytes, cnsp).flatMap((c, n) => (c > 0 ? [n] : []));
  const keyRoots = zones.map((z) => z.rootNote);
  add('key-map', keyRoots.length > 0 && keyRoots.join() === tableRoots.join(),
    `key-map zones (${keyRoots.length}) match the notes' roots (${tableRoots.length}), with roots rising with the keys`);
  if (opts.deep) {
    let bad = '';
    for (const s of strokes) {
      try { decodeNspStroke(bytes, dir, s); } catch (e) { bad = (e as Error).message; break; }
    }
    add('decode', !bad, bad || 'every stroke decodes to its directory length');
  }
  return done(nsmVersion);
}
