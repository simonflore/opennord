/**
 * Nord Electro 4 (`.ne4p`) program model.
 *
 * Legacy (formatType 0) CBIN record: the parameter bitstream starts at **file
 * 0x1A** (14 descriptor blocks, 864 bits = 108 bytes) and is followed by the
 * 2-byte CRC-16 trailer: 26 + 108 + 2 = 136 bytes. Layout from Electro 4 OS
 * 1.22 (serialiser, container builder); block order:
 * programCommon, B3/Vox/Farfisa Common, B3/Vox/Farfisa Preset I, B3/Vox/Farfisa
 * Preset II, pianoSample, effects, blockX1, blockX2. See `layout.generated.ts`.
 *
 * Reconciled with the corpus RE (16 fixtures, 2026-06-22), which read from
 * file 0x2C ("body"): the factory-default drawbars at body 4-8 / 25-29 are the
 * Vox Preset I / II drawbars; the "active" drawbars at body 16-20 are B3 Preset
 * II; body 20 low nibble / 21 are the B3 Preset II vibrato type and percussion
 * flags; body 0 ("sectionFlags") is B3 Preset I's percussion flags + 3-bit
 * field; B3 Preset I's drawbars sit at file 0x27-0x2B, inside the bytes the
 * NSM-era header layout would call header; body 90-91 is the CRC trailer.
 *
 * `cc` notes cite the descriptor control id, which is probably the MIDI CC
 * (low confidence). Field meanings beyond drawbars are named only as far as the
 * firmware strings and cardinalities support. The record version is not
 * known; the corpus files carry 103 ("1.03") at 0x14.
 */
import type { Ne4FieldKey } from './layout.generated';

export type { Ne4FieldKey };

/** B3 preset (17 descriptors): drawbars, vibrato/chorus, percussion. */
export interface Ne4B3Preset {
  /** Descriptors 0-8: nine drawbars, 0-8, 16′ … 1′. */
  readonly drawbars: readonly number[];
  /** Descriptor 9 (3 bits, 0-5, control 84) — vibrato/chorus type (six B3 settings, medium). */
  readonly vibratoType: number;
  /** Descriptor 10 (1 bit, no control id). */
  readonly flag10: number;
  /** Descriptors 11-14 (1 bit each, controls 88, 89, 95, 87) — percussion switches (order unresolved). */
  readonly percussion: readonly number[];
  /** Descriptor 15 (3 bits, 0-4, default 2) — shared by every organ preset; meaning unresolved. */
  readonly mode: number;
}

/** Vox preset (12 descriptors). */
export interface Ne4VoxPreset {
  /** Descriptors 0-8: nine drawbars, 0-8. */
  readonly drawbars: readonly number[];
  /** Descriptor 9 (1 bit, control 85). */
  readonly flag9: number;
  /** Descriptor 10 (3 bits, 0-4, default 2). */
  readonly mode: number;
}

/** Farfisa preset (13 descriptors). */
export interface Ne4FarfisaPreset {
  /** Descriptors 0-8: nine tab switches (0/1). */
  readonly tabs: readonly number[];
  /** Descriptor 9 (2 bits, 0-3, control 84) — vibrato setting (four values, medium). */
  readonly vibrato: number;
  /** Descriptor 10 (1 bit, control 85). */
  readonly flag10: number;
  /** Descriptor 11 (3 bits, 0-4, default 2). */
  readonly mode: number;
}

export interface Ne4Organ {
  /** B3 Preset I — drawbars at file 0x27-0x2B. */
  readonly b3PresetI: Ne4B3Preset;
  /** B3 Preset II — drawbars at file 0x3C-0x40 (the corpus "active" set, body 16-20). */
  readonly b3PresetII: Ne4B3Preset;
  /** Vox Preset I — drawbars at file 0x30-0x34 (corpus body 4-8). */
  readonly voxPresetI: Ne4VoxPreset;
  /** Vox Preset II — drawbars at file 0x45-0x49 (corpus body 25-29). */
  readonly voxPresetII: Ne4VoxPreset;
  /** Farfisa Preset I — tabs at file 0x37-0x38. */
  readonly farfPresetI: Ne4FarfisaPreset;
  /** Farfisa Preset II — tabs at file 0x4C-0x4D. */
  readonly farfPresetII: Ne4FarfisaPreset;
}

/** pianoSample block (21 descriptors) at file 0x51. */
export interface Ne4PianoSample {
  /** Descriptor 0 (3 bits, 0-5, control 12) — piano/sample type. */
  readonly type: number;
  /** Descriptor 1 (7 bits, 0-49, control 44) — model within the type. */
  readonly model: number;
  /** Descriptor 2 (3 bits, 0-7, control 45). */
  readonly variation: number;
  /**
   * Descriptors 3-4 (two 15-bit fields) — the sound's reference id: programs on
   * the same sample share them (electro-4 backup meta.xml, 2026-07-04).
   */
  readonly refIds: readonly [number, number];
}

export interface Ne4Program {
  readonly parsed: true;
  /** CBIN version string — the u16 at 0x14 (=103 → "1.03" across the corpus). */
  readonly version: string;
  readonly organ: Ne4Organ;
  readonly pianoSample: Ne4PianoSample;
  /** Every stored parameter by generated key `block.index`, e.g. `effects.12`. */
  readonly values: Partial<Record<Ne4FieldKey, number>>;
  /** Parameters above their descriptor max (the firmware resets these to default on load). */
  readonly outOfRange: readonly Ne4FieldKey[];
  /**
   * The 2-byte LE trailer after the record (file bytes 134-135; corpus "body
   * 90-91"), a CRC-16 per the E4 serialiser. Its exact coverage is unverified:
   * the corpus RE found it is not the plain CRC over file[0:-2] that the Lead /
   * Wave files carry, so it is exposed as stored, not checked.
   */
  readonly checksum: number;
  /** Record data: file 0x1A up to the CRC trailer (108 bytes). */
  readonly _data: Uint8Array;
  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];
  /**
   * Original file bytes — kept so undecoded data is never lost and USB transfer
   * ("Send to Nord") can round-trip the file without re-encoding.
   */
  bytes: Uint8Array;
  /** Program name — NOT stored in the file, injected from the filename on import. */
  name?: string;
}
