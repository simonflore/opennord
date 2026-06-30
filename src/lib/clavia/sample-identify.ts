/**
 * Nord Sample (`.nsmp*` / `.npno`) header identification — container-level only.
 *
 * This recognizes the sample container and reads its version/codec generation from
 * the CBIN header and section-tree magic, WITHOUT decoding any audio. It's the
 * model-agnostic identity half of the sample codec (the full stroke/zone/audio
 * decode lives in `ns4/nsmp.ts`), so it belongs in the `clavia/` container layer:
 * the corpus/fixture scanner can identify a sample without depending on a model.
 *
 * Layout RE'd from the Nord Sample Editor — see `docs/NSMP-CODEC.md`.
 */

import { hasCbinMagic, fileTypeTag } from './cbin';

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u24be = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];

const NSMP_MAGIC = 0x4e534d50; // "NSMP" — codec 3/4 body root @0x2c
const NWS_MAGIC = 0x4e5753; // "NWS"  — OG/legacy body root @0x18

/**
 * Where the section tree starts and how its headers are framed. The CBIN **format
 * type** (`0x04`) sets the envelope length: format **1** carries a CRC-32 block so
 * the body root sits at `0x2c`; format **0** has none, so the root sits at `0x18`.
 * Two container kinds: **`NSMP`** (codec 3/4) with 12-byte `[tag:u32][version:u32]
 * [size:u32]` headers, and **`NWS`** (OG/legacy + codec 1/2) with 9-byte
 * `[tag:u24][version:u16][size:u32]` headers. So a `.nsmp3` exists both as format-1
 * (`NSMP`@0x2c) and format-0 (`NSMP`@0x18, e.g. some Library-3.0 exports). Detected
 * by the root magic at each candidate offset; falls back to the CBIN version for the
 * speculative case. (`CSectionIterator::Read_` / `PeekFormat`.)
 */
export function nsmpLayout(bytes: Uint8Array): { bodyStart: number; headerSize: number; legacy: boolean } {
  if (u32be(bytes, 0x2c) === NSMP_MAGIC) return { bodyStart: 0x2c, headerSize: 12, legacy: false };
  if (u32be(bytes, 0x18) === NSMP_MAGIC) return { bodyStart: 0x18, headerSize: 12, legacy: false };
  if (u24be(bytes, 0x18) === NWS_MAGIC) return { bodyStart: 0x18, headerSize: 9, legacy: true };
  const codec = Math.trunc((bytes[0x14] | (bytes[0x15] << 8)) / 100);
  const legacy = codec === 1 || codec === 2;
  return { bodyStart: 0x2c, headerSize: legacy ? 9 : 12, legacy };
}

/** Header-only identity of a Nord Sample container (no audio/section decode). */
export interface NsmpIdentity {
  /** True when this is a recognized Nord Sample (`nsmp`) or piano-library (`npno`) file. */
  recognized: boolean;
  /** `.npno` piano-library note file (`CNSP` root) — distinct from the `NSMP` stroke formats. */
  pianoLibrary?: boolean;
  /** Library version as shown, e.g. "3.00" / "4.00" (legacy → the raw revision, e.g. "8"). */
  version?: string;
  versionRaw?: number;
  /** Codec generation = floor(versionRaw / 100): 3 for `.nsmp3`, 4 for `.nsmp4`. */
  codec?: number;
  /** OG/legacy `NWS` container (original `.nsmp`, version 8) → 24-bit NW1 codec. */
  legacy: boolean;
}

/**
 * Identify a `.nsmp*` / `.npno` file from its header alone. Mirrors the header
 * fields `readNsmp` (ns4/nsmp.ts) produces, so the two stay consistent; the full
 * decoder delegates here for them.
 */
export function identifyNsmp(bytes: Uint8Array): NsmpIdentity {
  // `.npno` piano-library files: CBIN container, `npno` type tag, `CNSP` root.
  if (hasCbinMagic(bytes) && fileTypeTag(bytes) === 'npno') {
    return { recognized: true, pianoLibrary: true, legacy: false };
  }
  const recognized = hasCbinMagic(bytes) && fileTypeTag(bytes) === 'nsmp';
  if (!recognized) return { recognized: false, legacy: false };

  const { legacy } = nsmpLayout(bytes);
  const versionRaw = bytes[0x14] | (bytes[0x15] << 8);
  const major = Math.trunc(versionRaw / 100);
  // Modern codecs carry an x.yy library version (300 → "3.00"); the OG `.nsmp` uses
  // a small format revision (8) and has no CRC field, so don't fake either.
  const version = legacy ? `${versionRaw}` : `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;
  return { recognized: true, version, versionRaw, codec: major, legacy };
}
