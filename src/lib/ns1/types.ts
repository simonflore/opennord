/**
 * Nord Stage Classic / Stage EX (`.nspg`) program model — the record layout
 * from the Stage Classic OS 5.08 firmware's own parameter descriptors
 * (`layout.generated.ts`); the Stage EX OS 6.08 registers identical ones.
 *
 * The record (high): a u8 version (10; versions 0–9 are converted up on load),
 * then 399 data bytes — common (40 parameters), panel A (166) and panel B (166)
 * — exactly 400 bytes, one MSB-first bitstream. 101 parameters are morphable:
 * each is preceded by three morph deltas one bit wider than itself, read as
 * two's complement (signedness medium), generated as `<field>.morph1..3` with
 * `deltaOf`. The layout's bits count from the data, after the version.
 *
 * Where the record sits in a `.nspg` file follows the CBIN framing rule every
 * Nord file uses (clavia/cbin.ts): 0x2C behind an NSM-era header (a 444-byte
 * file), 0x18 behind a legacy one (426 bytes with its 2-byte trailer). No real
 * file has been read yet, so the alignment is a candidate, not validated.
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Ns1FieldKey } from './layout.generated';

export type { Ns1FieldKey };

/** One read 400-byte record (u8 version + 399 data bytes). */
export interface Ns1Record {
  /** The record's own u8 version (10 current; 0–9 converted by the firmware). */
  readonly recordVersion: number;
  /** Every stored parameter by generated key, morph deltas included. */
  readonly values: Partial<Record<Ns1FieldKey, number>>;
  /** Parameters outside their descriptor range. */
  readonly outOfRange: readonly Ns1FieldKey[];
  /** The three morph deltas of each morphable parameter, in stored (source) order. */
  readonly morphDeltas: Partial<Record<Ns1FieldKey, number[]>>;
  readonly warnings: readonly string[];
}

export interface Ns1Program extends LegacyProgram<Ns1FieldKey> {
  readonly format: 'nspg';
  /** The record, when the file holds a whole one (null = header only). */
  readonly record: Ns1Record | null;
}
