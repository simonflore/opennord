/**
 * Nord Piano 4 (`.np4p`) program model.
 *
 * The Piano 4 OS 2.66 firmware registry (FUN_c004c648; program archive
 * FUN_c004ed00, reads 1.00–1.01) gives the body as a Stage 3 style block chain:
 * u32 version, then four length-prefixed blocks — MultiCommon 11 · Piano 17 ·
 * Synth 23 · Effects 31 — a 90-byte body. It is the Grand (`.ngp`) layout minus
 * the Grand's 4-bit `Com_kSplPos`. Negative-min fields are two's complement in
 * their width.
 *
 * Fields come from the generated layout (`layout.generated.ts`), each citing its
 * firmware parameter id. The piano reference is `Pno_kBank` (type, body[19]
 * bits 7–5) + `Pno_kEntry` (0–19, body[19] bits 4–0) + `Pno_kVariation` (body
 * bits 160–161) + the 32-bit `Pno_kNameHash` (body bits 162–193), the key into
 * the family-wide piano-name table.
 *
 * Superseded corpus-era readings (2026-07-04 decoder): `pianoSlot` = body[19] &
 * 0x0f dropped Entry bit 4; `pianoModelId` = a 34-bit read at bit 160 that folded
 * Variation into the hash (equal to the hash only when Variation is 0);
 * `fxModWord` / `fxModParams` are the head of the Effects block (FX1/FX2 enables,
 * types and rates) and its EQ gains; the "constant" bytes are the version word,
 * the four block-length bytes and each block's reserved tail.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Np4FieldKey } from './layout.generated';

export type { Np4FieldKey };

export interface Np4Program extends FwProgram<Np4FieldKey> {
  readonly format: 'np4p';
}
