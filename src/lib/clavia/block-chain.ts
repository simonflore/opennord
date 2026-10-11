/**
 * Length-prefixed block-chain reader for the firmware-registry program formats.
 *
 * Every Nord program format from the Stage 3 registry generation onward frames
 * its body the same way (firmware analysis, the maintainers’ notes and
 * the maintainers’ notes): a u32 big-endian format version (major·100 + minor),
 * then a chain of blocks, each an 8-bit length followed by that many bytes of
 * MSB-first bit fields in registration order, padded with reserved zero bits.
 * The chain ends exactly at EOF.
 *
 * A layout (`FwLayout`) lists a model's expected blocks and the fields inside
 * them. Layouts are generated from per-model registry offset maps by
 * the maintainers’ tools (`<model>/layout.generated.ts`), so each
 * field carries its own firmware citation.
 *
 * Used today by the Stage 3 (`ns3f`), Grand (`ngp`), Grand 2 (`ng2p`), Piano 4
 * (`np4p`), Piano 5 (`np5p`), Piano 6 (`np6p`), Electro 6 (`ne6p`), Electro 7
 * (`ne7p`), Organ 3 (`no3p`) and Wave 2 (`nw2p`) readers. The legacy
 * formatType-0 records (Lead 4, Lead A1, Electro 4) are not block chains — see
 * legacy-record.ts. Pure; model → clavia.
 *
 * Never throws: an odd or truncated file yields a header-only result with a
 * warning, so the Library can still list it.
 */
import { CBIN_BODY_OFFSET, formatCbinVersion } from './cbin';
import { readBits } from './bitstream';

/**
 * How a field's raw bits map to its value.
 * - `u`      — unsigned, value = raw.
 * - `offset` — value = raw + min (Stage 3 rule; also any field whose min is above 0).
 * - `twos`   — two's complement in the field width (negative-min fields wherever the registry's signed mode is 0).
 * - `raw`    — an opaque identifier (a 32-bit name hash), kept as the unsigned raw bits.
 */
export type FwEncoding = 'u' | 'offset' | 'twos' | 'raw';

/** A block in a layout. `offset` is the body byte of its length prefix. */
export interface FwBlock {
  readonly key: string;
  /** The firmware's buffer name, e.g. `PnoA` or `Organ/Drawbars1`. */
  readonly name: string;
  readonly offset: number;
  /** Payload bytes that follow the length byte. */
  readonly length: number;
}

/** A field in a layout. `bit` is relative to the first payload bit of its block. */
export interface FwField<K extends string = string> {
  readonly key: K;
  /** The firmware's parameter name, e.g. `Edt_Pno_kLevel`. */
  readonly name: string;
  /** Index into {@link FwLayout.blocks}. */
  readonly block: number;
  readonly bit: number;
  readonly width: number;
  readonly min: number;
  readonly max: number;
  readonly def: number;
  readonly enc: FwEncoding;
  readonly confidence: 'high' | 'medium';
  /** Firmware citation, e.g. "Piano 6 OS 1.20 registry · id 125". */
  readonly src: string;
}

export interface FwLayout<K extends string = string> {
  /** Musician-facing model name, e.g. "Nord Grand". */
  readonly model: string;
  /** Firmware registry the layout comes from. */
  readonly source: string;
  /** Firmware program-archive (container) function, and what it says about versions. */
  readonly container: string;
  /** Accepted body format versions (×100, inclusive), or null when not recovered. */
  readonly versionRange: readonly [number, number] | null;
  readonly bodyBytes: number;
  readonly blocks: readonly FwBlock[];
  readonly fields: readonly FwField<K>[];
}

/** The result of walking a body's block chain, before any layout is applied. */
export interface BlockChainWalk {
  /** True when the version word is present and the chain lands exactly on EOF. */
  ok: boolean;
  /** The u32 BE format version at body 0, or null when the body is too short. */
  formatVersion: number | null;
  /** Blocks found, in order (`offset` = body byte of the length prefix). */
  blocks: { offset: number; length: number }[];
  /** Why the walk failed, when it did. */
  reason?: string;
}

/** Walk a program body's block chain. Pure, never throws. */
export function walkBlockChain(body: Uint8Array): BlockChainWalk {
  if (body.length < 4) {
    return { ok: false, formatVersion: null, blocks: [], reason: `body is ${body.length} bytes, too short for the 4-byte format version` };
  }
  const formatVersion = (((body[0] << 24) | (body[1] << 16) | (body[2] << 8) | body[3]) >>> 0);
  const blocks: { offset: number; length: number }[] = [];
  let pos = 4;
  while (pos < body.length) {
    const length = body[pos];
    if (pos + 1 + length > body.length) {
      return { ok: false, formatVersion, blocks, reason: `block ${blocks.length + 1} at body byte ${pos} claims ${length} bytes but only ${body.length - pos - 1} remain` };
    }
    blocks.push({ offset: pos, length });
    pos += 1 + length;
  }
  if (blocks.length === 0) {
    return { ok: false, formatVersion, blocks, reason: 'no blocks after the format version' };
  }
  return { ok: true, formatVersion, blocks };
}

/** The warning for values outside their descriptor range (the firmware resets them to default on load). */
export function outOfRangeWarning(keys: readonly string[]): string {
  return `${keys.length} value(s) outside the instrument’s range (${keys.slice(0, 4).join(', ')}${keys.length > 4 ? ', …' : ''}).`;
}

/** Turn a field's raw bits into its value per the field's encoding. */
export function fieldValue(raw: number, field: Pick<FwField, 'enc' | 'width' | 'min'>): number {
  switch (field.enc) {
    case 'offset': return raw + field.min;
    case 'twos': return raw >= 2 ** (field.width - 1) ? raw - 2 ** field.width : raw;
    default: return raw;
  }
}

export interface FwBodyDecode<K extends string> {
  /** True when the chain walked to EOF with the layout's block count, so fields were read. */
  layoutMatched: boolean;
  formatVersion: number | null;
  /** Decoded values by field key. Empty when the layout did not match. */
  values: Partial<Record<K, number>>;
  warnings: string[];
}

/** Decode a program body (bytes after the CBIN header) against a layout. Never throws. */
export function decodeFwBody<K extends string>(body: Uint8Array, layout: FwLayout<K>): FwBodyDecode<K> {
  const warnings: string[] = [];
  const values: Partial<Record<K, number>> = {};
  const walk = walkBlockChain(body);

  if (!walk.ok) {
    warnings.push(`Not a ${layout.model} program body: ${walk.reason}. Showing the file header only.`);
    return { layoutMatched: false, formatVersion: walk.formatVersion, values, warnings };
  }
  if (walk.blocks.length !== layout.blocks.length) {
    warnings.push(
      `Expected ${layout.blocks.length} blocks for a ${layout.model} program, found ${walk.blocks.length}. ` +
      'This file uses a layout OpenNord has not seen yet; showing the file header only.');
    return { layoutMatched: false, formatVersion: walk.formatVersion, values, warnings };
  }

  const v = walk.formatVersion;
  if (v !== null && layout.versionRange && (v < layout.versionRange[0] || v > layout.versionRange[1])) {
    warnings.push(
      `Format version ${(v / 100).toFixed(2)} is outside the ${(layout.versionRange[0] / 100).toFixed(2)}–` +
      `${(layout.versionRange[1] / 100).toFixed(2)} range the instrument reads; values may be off.`);
  }

  const resized = walk.blocks.flatMap((b, i) => (b.length !== layout.blocks[i].length ? [layout.blocks[i].name] : []));
  if (resized.length > 0) {
    warnings.push(`Block size differs from the program map: ${resized.join(', ')}. Fields that still fit are read in place.`);
  }

  let clipped = 0;
  const outOfRange: string[] = [];
  for (const f of layout.fields) {
    const blk = walk.blocks[f.block];
    if (f.bit + f.width > blk.length * 8) { clipped++; continue; }
    const raw = readBits(body, (blk.offset + 1) * 8 + f.bit, f.width);
    const value = fieldValue(raw, f);
    if (f.enc !== 'raw' && (value < f.min || value > f.max)) outOfRange.push(f.key);
    values[f.key] = value;
  }
  if (clipped > 0) warnings.push(`${clipped} field(s) fall outside a shortened block and were skipped.`);
  if (outOfRange.length > 0) warnings.push(outOfRangeWarning(outOfRange));
  return { layoutMatched: true, formatVersion: v, values, warnings };
}

/** The decoded shape shared by the firmware-layout readers (see the list at the top of this file). */
export interface FwProgram<K extends string> {
  readonly parsed: true;
  /** Program version from the CBIN header, e.g. "1.00". */
  readonly version: string;
  /** The body's own u32 format version (×100), or null when the body is too short. */
  readonly formatVersion: number | null;
  /** True when the block chain matched the firmware layout and fields were read. */
  readonly layoutMatched: boolean;
  /** Decoded values by generated field key; empty when `layoutMatched` is false. */
  readonly values: Partial<Record<K, number>>;
  /** Full raw body for RE tooling. */
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  /** Original file bytes, kept so undecoded data is never lost. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}

/**
 * Decode a whole file (CBIN header + body) against a layout. Never throws.
 * The body is `bytes[bodyOffset, bodyEnd)`: by default from the NSM-era header's
 * 0x2C to EOF (a legacy Stage 3 file passes 0x18 and stops before its trailer).
 */
export function decodeFwProgram<K extends string>(
  bytes: Uint8Array, layout: FwLayout<K>, bodyOffset: number = CBIN_BODY_OFFSET, bodyEnd: number = bytes.length,
): FwProgram<K> {
  const warnings: string[] = [];
  if (bytes.length < bodyOffset) {
    warnings.push(`File too short: ${bytes.length} bytes (a Nord file header alone is ${bodyOffset}).`);
  }
  const body = bytes.slice(bodyOffset, Math.max(bodyOffset, bodyEnd));
  let decoded: FwBodyDecode<K>;
  try {
    decoded = decodeFwBody(body, layout);
  } catch (e) {
    decoded = { layoutMatched: false, formatVersion: null, values: {}, warnings: [`Could not read the program body: ${String(e)}`] };
  }
  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    formatVersion: decoded.formatVersion,
    layoutMatched: decoded.layoutMatched,
    values: decoded.values,
    _rawBody: body,
    warnings: [...warnings, ...decoded.warnings],
    bytes,
  };
}
