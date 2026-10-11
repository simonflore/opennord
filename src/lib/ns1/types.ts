/**
 * Nord Stage Classic / Stage EX (`.nspg`) program model — the record layout
 * from the Stage Classic OS 5.08 firmware's own parameter descriptors
 * (`layout.generated.ts`); the Stage EX OS 6.08 registers identical ones.
 *
 * The record (high): a u8 version (10; versions 0–9 are converted up on load),
 * then common (40 parameters), panel A (166) and panel B (166) — exactly 400
 * bytes, one MSB-first bitstream. 101 parameters are morphable: each is
 * preceded by three morph deltas one bit wider than itself, read as two's
 * complement (signedness medium), generated as `<field>.morph1..3` with
 * `deltaOf`.
 *
 * Where the record starts inside a `.nspg` file is NOT known: no real file has
 * been read, and neither the repository nor NSM notes establish it. By
 * analogy with its successor the Stage 2 (record at 0x18 after the legacy
 * header) it may start at 0x18, which would make a 0x18 + 400 + 2 = 426-byte
 * file — an unconfirmed guess the reader does not apply. So a file opens
 * header-only with a warning; `decodeNs1Record` reads a record once its bytes
 * are located.
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Ns1FieldKey } from './layout.generated';

export type { Ns1FieldKey };

/** One read 400-byte record. */
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
  /** The record, when its start in the file is known (today: never — see above). */
  readonly record: Ns1Record | null;
}
