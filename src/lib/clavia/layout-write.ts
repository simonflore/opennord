/**
 * In-place program writers for the firmware-layout formats — the inverse of the
 * block-chain reader (`decodeFwProgram`, block-chain.ts) and the legacy-record
 * reader (`readLegacyFile`, legacy-record.ts).
 *
 * Like the Stage 4 writer (ns4/writer.ts) these edit a real file rather than
 * serialise a model: they copy the original bytes, write only the fields asked
 * for (each at its layout bits, the exact inverse of `fieldValue`), and reseal
 * the checksum the header type uses (checksum.ts `sealFileChecksum`: the CRC-32
 * at 0x18 of an NSM-era file, the CRC-16 trailer of a legacy one). Every other
 * bit — reserved and unmapped bits, version words, block lengths, the header —
 * stays as it was, so a write with no values returns the input byte for byte.
 *
 * They refuse (throw {@link ProgramWriteError}) rather than guess:
 * - a file whose framing does not match the layout exactly (block chain, block
 *   sizes, record size), so a field could land on the wrong bits;
 * - a file whose checksum does not hold as found, since the reseal could then
 *   be the wrong algorithm for its model (the legacy trailer is unconfirmed on
 *   the Electro, C2/C2D and Piano 2/3 files);
 * - a format/record version the firmware does not read natively — an older one
 *   it converts on load is refused rather than written with the newer layout;
 * - an unknown key, a non-integer, or a value outside the field's range (a raw
 *   identifier field takes any unsigned value of its width). A value equal to
 *   what the file already holds is accepted and left alone, so a full read →
 *   edit one → write round-trips even where a stored value is out of range.
 *
 * Framing is the readers' own (block-chain.ts `fwBodyRange`, legacy-record.ts
 * `legacyDataOffset`): the body or record starts at 0x18 after a legacy (format
 * type 0) header and at 0x2C after an NSM-era one; a legacy file ends with its
 * 2-byte trailer.
 *
 * Legacy layouts: a second stored copy of a parameter (`copyOf`, the C2D's
 * repeated containers) is not written on its own — the firmware reads the last
 * copy and writes them all alike, so writing the first copy's key writes every
 * copy, and a copy key is accepted only with the value its first copy ends up
 * with. Inline morph deltas (`deltaOf`) are ordinary stored fields and written
 * like any other. Sparse morph lists (`morphLists`, Lead 4) are not fields and
 * stay as they are. Pure; model → clavia.
 */
import { hasCbinMagic } from './cbin';
import { readBits, writeBits } from './bitstream';
import { fieldRaw, fieldValue, fwBodyRange, walkBlockChain, type FwField, type FwLayout } from './block-chain';
import { sealFileChecksum, verifyFileChecksum } from './checksum';
import {
  legacyDataOffset, legacyFileBytes, legacyLayoutVersion, type LegacyField, type LegacyLayout,
} from './legacy-record';

/** Why a program could not be written. */
export class ProgramWriteError extends Error {
  override name = 'ProgramWriteError';
}

type EncodedField = Pick<FwField, 'key' | 'width' | 'min' | 'max' | 'enc'>;

/**
 * The raw bits `field` stores for `value`, or a {@link ProgramWriteError} when
 * the value is not an integer in the field's range (for a `raw` identifier:
 * an unsigned value of the field's width).
 */
export function encodeField(field: EncodedField, value: number): number {
  if (!Number.isInteger(value)) throw new ProgramWriteError(`${field.key}: ${value} is not a whole number`);
  if (field.enc === 'raw') {
    if (value < 0 || value >= 2 ** field.width) {
      throw new ProgramWriteError(`${field.key}: ${value} does not fit an unsigned ${field.width}-bit identifier`);
    }
    return value;
  }
  if (value < field.min || value > field.max) {
    throw new ProgramWriteError(`${field.key}: ${value} is outside its range ${field.min}–${field.max}`);
  }
  const raw = fieldRaw(value, field);
  if (raw < 0 || raw >= 2 ** field.width || fieldValue(raw, field) !== value) {
    throw new ProgramWriteError(`${field.key}: ${value} does not fit its ${field.width}-bit field`);
  }
  return raw;
}

function requireCbin(bytes: Uint8Array): void {
  if (!hasCbinMagic(bytes) || (bytes[0x04] !== 0 && bytes[0x04] !== 1)) {
    throw new ProgramWriteError('Not a Nord program file');
  }
}

/** Reseal only a file whose own checksum holds: it shows `sealFileChecksum` writes the one its model uses. */
function requireSealed(bytes: Uint8Array): void {
  if (!verifyFileChecksum(bytes)) {
    throw new ProgramWriteError('This program file’s checksum doesn’t match its contents, so OpenNord can’t tell how to reseal it');
  }
}

const versionText = (v: number) => (v / 100).toFixed(2);

export interface FwWriteOptions<K extends string> {
  /**
   * Fields this file's format version does not store yet (they sit in reserved
   * bits the firmware resets to their defaults on load), given the body's format
   * version. Writing one is refused, since the instrument would ignore it
   * (its default, which the instrument loads anyway, is accepted and not written).
   */
  readonly absentIn?: (formatVersion: number) => readonly K[];
}

/**
 * Write `values` into a firmware-layout program (a whole file, header included)
 * and return the new, resealed file. The input is not changed. Throws a
 * {@link ProgramWriteError} when the file or a value can't be written (see the
 * module comment).
 */
export function writeFwProgram<K extends string>(
  bytes: Uint8Array, layout: FwLayout<K>, values: Partial<Record<K, number>>, opts: FwWriteOptions<K> = {},
): Uint8Array {
  requireCbin(bytes);
  const { start, end } = fwBodyRange(bytes);
  const walk = walkBlockChain(bytes.subarray(start, Math.max(start, end)));
  if (!walk.ok) throw new ProgramWriteError(`Not a ${layout.model} program body: ${walk.reason}`);
  if (walk.blocks.length !== layout.blocks.length || walk.blocks.some((b, i) => b.length !== layout.blocks[i].length)) {
    throw new ProgramWriteError(`This ${layout.model} program is laid out differently from the firmware layout OpenNord writes`);
  }
  const v = walk.formatVersion ?? 0;
  if (layout.versionRange && (v < layout.versionRange[0] || v > layout.versionRange[1])) {
    throw new ProgramWriteError(
      `${layout.model} program format ${versionText(v)}: OpenNord writes only formats ` +
      `${versionText(layout.versionRange[0])}–${versionText(layout.versionRange[1])}, the ones the instrument reads as they are`);
  }
  requireSealed(bytes);
  const absent = new Set<string>(opts.absentIn?.(v) ?? []);

  const byKey = new Map<string, FwField<K>>(layout.fields.map((f) => [f.key, f]));
  const out = bytes.slice();
  for (const [key, value] of Object.entries(values) as [K, number | undefined][]) {
    if (value === undefined) continue;
    const f = byKey.get(key);
    if (!f) throw new ProgramWriteError(`${key}: not a ${layout.model} program field`);
    if (absent.has(key)) {
      // The instrument loads this field at its default (what the reader reports too): nothing to write.
      if (value === f.def) continue;
      throw new ProgramWriteError(`${key}: program format ${versionText(v)} does not store this setting yet`);
    }
    const at = (start + layout.blocks[f.block].offset + 1) * 8 + f.bit;
    if (value !== fieldValue(readBits(out, at, f.width), f)) writeBits(out, at, f.width, encodeField(f, value));
  }
  return sealFileChecksum(out);
}

/**
 * Write `values` into a single-record legacy formatType-0 program (a whole
 * file, either header type) and return the new, resealed file. The input is not changed.
 * Throws a {@link ProgramWriteError} when the file or a value can't be written
 * (see the module comment).
 */
export function writeLegacyProgram<K extends string>(
  bytes: Uint8Array, layout: LegacyLayout<K>, values: Partial<Record<K, number>>,
): Uint8Array {
  requireCbin(bytes);
  const expected = legacyFileBytes(bytes, layout);
  if (bytes.length !== expected) {
    throw new ProgramWriteError(`This ${layout.model} program file is ${bytes.length} bytes; the firmware record makes ${expected}`);
  }
  const recordVersion = legacyLayoutVersion(bytes, layout);
  if (layout.recordVersion !== null && recordVersion !== layout.recordVersion) {
    throw new ProgramWriteError(
      `${layout.model} program format version ${recordVersion}: OpenNord writes only version ${layout.recordVersion}, ` +
      'the one the instrument reads as it is');
  }

  requireSealed(bytes);

  const base = legacyDataOffset(bytes, layout) * 8;
  const byKey = new Map<string, LegacyField<K>>(layout.fields.map((f) => [f.key, f]));
  const copies = new Map<string, LegacyField<K>[]>();
  for (const f of layout.fields) if (f.copyOf) copies.set(f.copyOf, [...(copies.get(f.copyOf) ?? []), f]);
  const read = (f: LegacyField<K>, from: Uint8Array) => fieldValue(readBits(from, base + f.bit, f.width), f);
  /** The value the firmware takes for a parameter: its last stored copy (readLegacyRecord). */
  const effective = (f: LegacyField<K>, from: Uint8Array) => read(copies.get(f.key)?.at(-1) ?? f, from);

  const out = bytes.slice();
  const entries = (Object.entries(values) as [K, number | undefined][]).filter(([, v]) => v !== undefined) as [K, number][];
  for (const [key] of entries) if (!byKey.has(key)) throw new ProgramWriteError(`${key}: not a ${layout.model} program field`);
  for (const [key, value] of entries) {
    const f = byKey.get(key)!;
    if (f.copyOf || value === effective(f, out)) continue;
    const raw = encodeField(f, value);
    for (const target of [f, ...(copies.get(key) ?? [])]) writeBits(out, base + target.bit, target.width, raw);
  }
  // A second stored copy follows its first copy; it can't be set to anything else.
  for (const [key, value] of entries) {
    const f = byKey.get(key)!;
    if (f.copyOf && value !== effective(byKey.get(f.copyOf)!, out)) {
      throw new ProgramWriteError(`${key}: a second stored copy of ${f.copyOf}; set ${f.copyOf} instead`);
    }
  }
  return sealFileChecksum(out);
}
