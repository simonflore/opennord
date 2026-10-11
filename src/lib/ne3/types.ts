/**
 * Nord Electro 3 / Electro 3 HP (`.nepg`) program model.
 *
 * Legacy (formatType 0) CBIN record at file 0x18: a u16 record version (101;
 * a version-100 record is upgraded on load by copying piano parameter 16 into
 * parameter 17, FUN_30017F9A), then 108 bytes of MSB-first descriptor data from
 * **file 0x1A**, then the 2-byte trailer: 24 + 2 + 108 + 2 = 136 bytes. Layout
 * from the Electro 3 OS 3.14 parameter containers (8 blocks: Common 4 · Organ
 * Common 9 · Organ Preset I 39 · Organ Preset II 39 · Piano 20 · Effects Shared
 * 17 · Effects Organ 8 · Effects Piano 8 descriptors, reserved ones included;
 * no morphs), generated into `layout.generated.ts`. The piano and effects blocks
 * start where the Electro 4's do (`lib/ne4`), and the effects parameters match
 * it; the Electro 3 piano block keeps one model number per piano type. The block
 * alignment in the file is medium until a real file confirms it.
 *
 * The Electro 3 HP (OS 3.16) writes the same record — same tag, version and
 * size — with 5 more parameters in what the Electro 3 reserves (piano 18–19,
 * shared effects 15–17; `layout-hp.generated.ts`). Files are read with the HP
 * layout, a superset: on a plain Electro 3 file those 5 read as their default 0.
 *
 * Meanings come from the firmware where it shows them (high): Common 0 picks
 * the organ (0) or the piano (FUN_30009764 derives the program category from
 * it), the organ model is 0 B3 / 1 Farfisa / 2 Vox, the piano type is 0 Grand ·
 * 1 Upright · 2 EPiano · 3 Wurl · 4 Clav/Hps · 5 sample. Other parameters are
 * named by block and index, with the descriptor's control id (probably the
 * MIDI CC, low) in the layout.
 */
import type { Ne3FieldKey } from './layout.generated';
import type { Ne3HpFieldKey } from './layout-hp.generated';

export type { Ne3FieldKey, Ne3HpFieldKey };

/** One organ preset (Preset I or II): every organ model keeps its own registration. */
export interface Ne3OrganPreset {
  /** B3 drawbars 16′ … 1′, 0–8. */
  readonly b3Drawbars: readonly number[];
  /** Vox drawbars, 0–8. */
  readonly voxDrawbars: readonly number[];
  /** Farfisa tabs, 0/1. */
  readonly farfTabs: readonly number[];
}

export interface Ne3Program {
  readonly parsed: true;
  /** CBIN version string — NSM's copy of the record version at 0x14 (101 → "1.01"). */
  readonly version: string;
  /** u16 record version at file 0x18 (101; 100 is upgraded on load). */
  readonly recordVersion: number;
  /**
   * True when a parameter only the Electro 3 HP stores holds a non-zero value,
   * so the file comes from an HP; null when the file can't tell (the plain
   * Electro 3 and an HP program with those parameters at 0 look the same).
   */
  readonly hp: true | null;
  /** Which instrument the program plays: Common 0 (0 = organ). */
  readonly focus: 'organ' | 'piano';
  /** Organ model: 0 B3, 1 Farfisa, 2 Vox. */
  readonly organModel: number;
  readonly presetI: Ne3OrganPreset;
  readonly presetII: Ne3OrganPreset;
  /** Piano type: 0 Grand, 1 Upright, 2 EPiano, 3 Wurl, 4 Clav/Hps, 5 sample. */
  readonly pianoType: number;
  /** The model number within the piano type (one stored per type; order by type medium). */
  readonly pianoModel: number;
  /** The five per-instrument effect switches (control ids 115, 69, 80, 86, 97), organ then piano. */
  readonly effectSwitches: { readonly organ: readonly number[]; readonly piano: readonly number[] };
  /** Every stored parameter by generated key, read with the HP layout. */
  readonly values: Partial<Record<Ne3HpFieldKey, number>>;
  /** Parameters outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly Ne3HpFieldKey[];
  /** True when the file holds the whole record. */
  readonly complete: boolean;
  /** The 2-byte LE trailer, as stored (its CRC coverage is unverified on the Electro 3). */
  readonly checksum: number;
  /** Record data: file 0x1A up to the trailer (108 bytes). */
  readonly _data: Uint8Array;
  readonly warnings: readonly string[];
  /** Original file bytes. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}
