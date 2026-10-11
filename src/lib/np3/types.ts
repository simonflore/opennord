/**
 * Nord Piano 3 (`.np3p`) program model — read through the Piano 3 OS 2.04
 * firmware's own parameter containers (`layout.generated.ts`).
 *
 * The firmware stores a program as `[u16 version 4][53 bytes]`: one MSB-first
 * bitstream of four containers — common (96 bits), piano (96), synth (88) and
 * effects (144) = 424 bits — 76 stored parameters, no morph sources. In the
 * file the record version is the u16 at 0x18 (NSM copies it to 0x14) and the data is
 * taken to start at 0x1A, followed by the 2-byte trailer: 26 + 53 + 2 = 81
 * bytes (medium: no real `.np3p` has been checked yet).
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Np3FieldKey } from './layout.generated';

export type { Np3FieldKey };

export interface Np3Program extends LegacyProgram<Np3FieldKey> {
  readonly format: 'np3p';
  /** The 2-byte trailer as stored (a CRC-16 per the firmware family; coverage not verified). */
  readonly checksum: number;
}
