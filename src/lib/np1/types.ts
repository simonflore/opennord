/**
 * Nord Piano (first generation, `.nppg`) program model — read through the
 * Nord Piano OS 1.50 firmware's own parameter descriptors (`layout.generated.ts`).
 *
 * The firmware keeps a program as 20 bytes in a 31-byte flash slot: one
 * MSB-first bitstream of two containers — piano, then effects (156 bits) —
 * 29 stored parameters, no morph sources. The record has **no version** and
 * the firmware no converter.
 *
 * Where the record sits in a `.nppg` file is a guess (low): file 0x1A, as on
 * the other ColdFire legacy files, which predicts a 26 + 20 + 2 = 48-byte
 * file. Until a real file confirms it, every decode carries that caveat and
 * the coverage map stays `candidate`.
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Np1FieldKey } from './layout.generated';

export type { Np1FieldKey };

export interface Np1Program extends LegacyProgram<Np1FieldKey> {
  readonly format: 'nppg';
}
