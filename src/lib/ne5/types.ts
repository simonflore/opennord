/**
 * Nord Electro 5 (`.ne5p`) program model — read through the Electro 5 OS 2.04
 * firmware's own parameter containers (`layout.generated.ts`).
 *
 * The firmware stores a program as `[u16 version 4][119 bytes]`: 24 containers
 * of 26-byte parameter records, one MSB-first bitstream of 952 bits. Block
 * order: common, piano, sampleSynth, then for each organ (B3, Vox, Farfisa,
 * Church) Global, Upper, Lower, Preset I, Preset II, and the effects. No morph
 * sources. In the file the data starts at **0x1A** and the 2-byte trailer
 * follows: 26 + 119 + 2 = 147, the `.ne5p` size (high). The CBIN version at
 * 0x14 is NSM's copy of the record version (4 on every corpus file); the
 * reader takes the record's own u16 at 0x18. Version 3 files are
 * converted on load (the converter moves one EQ bit); 1 and 2 are refused.
 *
 * The earlier corpus decoder read the same bytes from 0x2C ("body") and had the
 * drawbar offsets right but the names wrong; in firmware terms:
 *
 * | Old name              | body      | Firmware field                                          |
 * |-----------------------|-----------|---------------------------------------------------------|
 * | preset1Upper          | 21-25     | B3 Preset I drawbars                                     |
 * | preset1Lower          | 28-32     | B3 Preset II drawbars                                    |
 * | preset2Upper / Lower  | 39 / 45   | Vox Preset I / II drawbars                               |
 * | pedal                 | 55-59     | Farfisa Preset I drawbars                                |
 * | _extraNibbleGroup     | 71-74     | Church Preset I drawbars                                 |
 * | sampleSectionActive   | 17 bit 7  | top bit of the B3 vibrato/chorus type                    |
 * | sampleModelFlag       | 13 bit 7  | Sample Synth Filter Vel                                  |
 * | sampleModelId         | 7-12      | Sample Synth sample select + two 15-bit sample ids       |
 * | sampleDescriptor      | 83-94     | the effects block                                        |
 * | programTypeFlags      | 0         | inside the 15-bit piano ids                              |
 * | sectionEnableNibble   | 6         | Sample Synth attack                                      |
 * | flagByte19            | 19        | B3 Upper preset select                                   |
 * | _checksum             | 101-102   | the file trailer                                         |
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { Ne5FieldKey } from './layout.generated';

export type { Ne5FieldKey };

/** The four organ sound sets the record stores (each with its own two presets). */
export type Ne5OrganType = 'b3' | 'vox' | 'farf' | 'church';

/** One drawbar preset (Preset I or II) of an organ type. */
export interface Ne5DrawbarPreset {
  /** Nine drawbar levels 0–8 (CC 16–24, in the panel order; B3 16′ … 1′). */
  readonly drawbars: readonly number[];
  /** Vibrato (B3: vibrato/chorus) switch. */
  readonly vibrato: boolean;
  /** Percussion switch (B3 and Church presets only). */
  readonly percussion?: boolean;
  /** B3 presets only: the two bass (pedal) drawbars, 16′ and 8′ (inferred from their defaults). */
  readonly bass?: readonly [number, number];
}

/** One organ type: which preset each part plays, and both presets. */
export interface Ne5OrganSet {
  /** Upper part: 0 = Preset I, 1 = Preset II. */
  readonly upperPreset: number;
  /** Lower part: 0 = Preset I, 1 = Preset II. */
  readonly lowerPreset: number;
  readonly presetI: Ne5DrawbarPreset;
  readonly presetII: Ne5DrawbarPreset;
}

export interface Ne5Program extends LegacyProgram<Ne5FieldKey> {
  readonly format: 'ne5p';
  /** Organ model 0–4 (common container, "Organ Model"). */
  readonly organModel: number;
  /** The four organ sound sets. */
  readonly organ: Readonly<Record<Ne5OrganType, Ne5OrganSet>>;
  /** Piano container: type 0–5, model 0–49 and the two 15-bit piano reference ids. */
  readonly piano: { readonly type: number; readonly model: number; readonly ids: readonly [number, number] };
  /** Sample Synth container: the sample select 0–158 and its two 15-bit sample reference ids. */
  readonly sampleSynth: { readonly sample: number; readonly ids: readonly [number, number] };
  /** The 2-byte trailer as stored (a CRC-16 per the firmware; its coverage is not verified). */
  readonly checksum: number;
}
