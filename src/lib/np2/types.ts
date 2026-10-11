/**
 * Nord Piano 2 (`.np2p`) program model — read through the Piano 2 OS 1.22
 * firmware's own parameter descriptors (`layout.generated.ts`).
 *
 * The firmware describes each parameter with a 24-byte descriptor (stored when
 * its byte +0x12 is 1) and writes a program as `[u16 version 2][42 bytes]`:
 * one MSB-first bitstream of four containers — common, piano, synth, effects
 * (336 bits) — 52 stored parameters, no morph sources. Version 0 and 1
 * records are converted on load (the converter remaps common parameter 4,
 * Keyboard Touch; decode.ts applies it too). In the file the
 * record version is the u16 at 0x18 (NSM copies it to 0x14) and the data is taken to
 * start at 0x1A, followed by the 2-byte trailer: 26 + 42 + 2 = 70 bytes.
 *
 * Names: the descriptors carry no labels, so most parameters are named by
 * matching their control ids (MIDI CCs) with the Piano 3's labelled
 * containers (medium); the rest keep their position (`common.param4`, …).
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Np2FieldKey } from './layout.generated';

export type { Np2FieldKey };

export interface Np2Program extends LegacyProgram<Np2FieldKey> {
  readonly format: 'np2p';
  /** The 2-byte trailer as stored (a CRC-16 per the firmware family; coverage not verified). */
  readonly checksum: number;
}
