/**
 * Nord C2D (`.nc2p`) program model.
 *
 * Legacy (formatType 0) CBIN record at file 0x18: a u16 record version (100,
 * the only one the firmware reads), then 345 bytes of MSB-first descriptor
 * data from **file 0x1A**, then the 2-byte trailer: 24 + 2 + 345 + 2 = 373
 * bytes. Layout from the C2D OS 1.12 container list (FUN_300200AE: 115
 * container instances; no morphs), generated into `layout.generated.ts`:
 * common, B3 (percussion, two manuals of drawbar sets and vibrato switches),
 * Vox, Farfisa, pipe organ, the three pedal modes, effects, rotary, and four
 * effect-switch sets.
 *
 * The firmware list repeats some containers (the last B3 / Vox / Farfisa
 * drawbar set and the last pipe stop set of each manual): the writer stores
 * them twice and the reader overwrites the first copy with the second. Both
 * copies are read; `values` holds the second under both keys, as the
 * instrument does, and each parameter is presented and counted once.
 *
 * Confidence: the container order is the firmware's (high); the block names
 * are inferred from descriptor shapes and control ids (medium–low), and the
 * alignment in the file is medium until a real file confirms it. The C2 has
 * its own program tag and record (`ncpg`, C2 OS 2.00: lib/nc); `nc2p` is the
 * C2D's alone.
 */
import type { Nc2FieldKey } from './layout.generated';

export type { Nc2FieldKey };

/** One manual's stored B3 drawbar sets (16′ … 1′, 0–8), in container order. */
export interface Nc2Manual {
  readonly b3Drawbars: readonly (readonly number[])[];
}

export interface Nc2Program {
  readonly parsed: true;
  /** CBIN version string — NSM's copy of the record version at 0x14 (100 → "1.00"). */
  readonly version: string;
  /** u16 record version at file 0x18 (100). */
  readonly recordVersion: number;
  /** Manuals 1 and 2 (which is upper is not established). */
  readonly manuals: readonly [Nc2Manual, Nc2Manual];
  /** Pedal drawbars of the first pedal set (two, 0–8). */
  readonly pedalDrawbars: readonly number[];
  /** The four stored effect-switch sets (four switches each, control ids 80, 115, 112, 97). */
  readonly effectSwitches: readonly (readonly number[])[];
  /** Every stored parameter by generated key; a repeated container's value under both keys. */
  readonly values: Partial<Record<Nc2FieldKey, number>>;
  /** Parameters outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly Nc2FieldKey[];
  /** True when the file holds the whole record. */
  readonly complete: boolean;
  /** The 2-byte LE trailer, as stored (its CRC coverage is unverified on the C2D). */
  readonly checksum: number;
  /** Record data: file 0x1A up to the trailer (345 bytes). */
  readonly _data: Uint8Array;
  readonly warnings: readonly string[];
  /** Original file bytes. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}
