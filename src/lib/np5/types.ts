/**
 * Nord Piano 5 (`.np5p`) program model.
 *
 * The Piano 5 OS 1.34 firmware registry (program archive
 *, 1.00–1.01, medium) gives the body as a block chain: u32
 * version, then six length-prefixed blocks — MultiCommon 12 · Effects 39
 * (global) · PianoA 31 · PianoB 31 · SynthA 57 · SynthB 57 — a 237-byte body.
 * Negative-min fields are two's complement in their width. The Piano 5 is a
 * hybrid: one global effects block (each unit routed by its `Src` field), and a
 * different field order from the Piano 6 / Grand 2.
 *
 * Fields come from the generated layout (`layout.generated.ts`), each citing its
 * firmware parameter id. Layer enables are `Com_kSlotPnoEnable` /
 * `Com_kSlotSynEnable` (2 bits each, body bits 42–45), read as a bitmask
 * (A = 1, B = 2 — inferred from the 0–3 range and default 1, medium). Piano A's
 * reference is Bank (type) 480/3 · Entry 483/5 · Variation 488/2 · NameHash
 * 490/32 (absolute body bits); Piano B is +256.
 *
 * Superseded corpus-era readings (2026-06-22 decoder): the "format tag 0x0c65"
 * is the version word's low byte plus the MultiCommon length byte;
 * `layerBActive` (body[7] & 0x08) is the low bit of `Pno_kLayerDetune`; the
 * 72-bit "core" clusters at body bit 461/717 started 3 bits early, so their
 * 32-bit id at 489/745 sat one bit before the NameHash and folded in a Variation
 * bit; the sound-slot byte reads were approximate; and the "FX slots" at
 * body[121]/[179] are the Synth A/B blocks.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Np5FieldKey } from './layout.generated';

export type { Np5FieldKey };

export interface Np5Program extends FwProgram<Np5FieldKey> {
  readonly format: 'np5p';
}
