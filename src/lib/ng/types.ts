/**
 * Nord Grand (`.ngp`) program model.
 *
 * The Grand OS 1.68 firmware registry shows the `.ngp` body is
 * the Piano 4 layout bit for bit, plus one MultiCommon field, `Com_kSplPos`
 * (4 bits, 0–8) at body bit 59 (the older 3-bit split position is kept and
 * renamed `_EOL`). Stage 3 framing: u32 version, then four length-prefixed
 * blocks (MultiCommon 11 · Piano 17 · Synth 23 · Effects 31) — a 90-byte body.
 * Negative-min fields are two's complement in their width.
 *
 * Fields come from the generated layout (`layout.generated.ts`), each citing its
 * firmware parameter id. Not yet checked against a real `.ngp` file.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { NgFieldKey } from './layout.generated';

export type { NgFieldKey };

export interface NgProgram extends FwProgram<NgFieldKey> {
  readonly format: 'ngp';
}
