/**
 * Nord Wave (`.nwp`) decoder.
 *
 * Legacy formatType-0 CBIN: the record sits at file 0x18 — a u8 record version
 * (8), then the 321-byte parameter bitstream from **file 0x19** and 2 pad
 * bytes — and the last two bytes are the CRC-16 trailer: 24 + 1 + 321 + 2 + 2
 * = 350, the `.nwp` size. The field layout is the Wave OS 2.14 descriptor map
 * (global · slot A · slot B · common, inline morph deltas), generated into
 * `layout.generated.ts` by scripts/gen-fw-program-maps.py and read through
 * the shared legacy-record reader (clavia/legacy-record.ts). See types.ts for
 * the block table and how the earlier corpus reader's byte fields map onto it.
 * Never throws.
 */
import { formatCbinVersion } from '../clavia/cbin';
import { legacyMorphDeltas, readLegacyFile } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NW1_LAYOUT, type Nw1FieldKey } from './layout.generated';
import type { Nw1Program, Nw1Section } from './types';

/** Record versions the firmware reads (FUN_3000090E): 8, and 6–7 converted on load. */
export const NW1_RECORD_VERSIONS = [6, 7, 8] as const;

type Block = 'global' | 'slotA' | 'slotB' | 'common';

/** Descriptor index → field key, per block (morph deltas excluded). */
const BLOCK_KEYS: Record<Block, Map<number, Nw1FieldKey>> = (() => {
  const out: Record<Block, Map<number, Nw1FieldKey>> = { global: new Map(), slotA: new Map(), slotB: new Map(), common: new Map() };
  for (const f of NW1_LAYOUT.fields) if (!f.deltaOf) out[f.key.split('.')[0] as Block].set(f.id, f.key);
  return out;
})();

function section(
  block: Block, values: Partial<Record<Nw1FieldKey, number>>, deltas: Partial<Record<Nw1FieldKey, number[]>>,
): Nw1Section {
  const keys = BLOCK_KEYS[block];
  const params: (number | undefined)[] = [];
  const morphs: Record<number, readonly number[]> = {};
  for (const [id, key] of keys) {
    params[id] = values[key];
    const d = deltas[key];
    if (d) morphs[id] = d;
  }
  return { params, morphs };
}

/** Decode a Nord Wave program (full file bytes including the CBIN header). */
export function decodeNw1(bytes: Uint8Array): Nw1Program {
  const r = readLegacyFile(bytes, NW1_LAYOUT, NW1_RECORD_VERSIONS);
  if (r.recordVersion === 6 || r.recordVersion === 7) {
    r.warnings.push(`Record version ${r.recordVersion}: the firmware converts it on load; read with the version-8 layout`);
  }
  const morphDeltas = legacyMorphDeltas(NW1_LAYOUT, r.values);
  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    recordVersion: r.recordVersion,
    global: section('global', r.values, morphDeltas),
    slot1: section('slotA', r.values, morphDeltas),
    slot2: section('slotB', r.values, morphDeltas),
    common: section('common', r.values, morphDeltas),
    values: r.values,
    morphDeltas,
    outOfRange: r.outOfRange,
    complete: r.complete,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: r.data,
    bytes,
    warnings: r.warnings,
  };
}
