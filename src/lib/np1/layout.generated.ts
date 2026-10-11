// AUTO-GENERATED (piano-1) — DO NOT EDIT MANUALLY.
//
// Provenance: Nord Piano OS 1.50 parameter descriptors; Nord Piano OS 1.50 program record: 20 bytes in a 31-byte flash slot, no version, no converter; file position 0x1A assumed (low).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Np1FieldKey =
  | 'piano.pianoType'
  | 'piano.param1'
  | 'piano.param2'
  | 'piano.param3'
  | 'piano.param4'
  | 'piano.param5'
  | 'piano.param6'
  | 'piano.param7'
  | 'piano.param8'
  | 'piano.pedalNoise'
  | 'piano.acoustics'
  | 'piano.param11'
  | 'effects.eqBass'
  | 'effects.eqMidFreq'
  | 'effects.eqMid'
  | 'effects.eqTreble'
  | 'effects.effects1Rate'
  | 'effects.effects1Type'
  | 'effects.effects2Rate'
  | 'effects.effects2Type'
  | 'effects.ampCompDrive'
  | 'effects.ampCompType'
  | 'effects.reverbDryWet'
  | 'effects.reverbType'
  | 'effects.eqOn'
  | 'effects.effects1On'
  | 'effects.effects2On'
  | 'effects.ampCompOn'
  | 'effects.reverbOn';

export const NP1_LAYOUT: LegacyLayout<Np1FieldKey> = {
  model: 'Nord Piano',
  source: 'Nord Piano OS 1.50 parameter descriptors',
  container: 'Nord Piano OS 1.50 program record: 20 bytes in a 31-byte flash slot, no version, no converter; file position 0x1A assumed (low)',
  recordVersion: null,
  dataBytes: 20,
  fields: [
    { key: 'piano.pianoType', name: 'Piano type', id: 0, bit: 0, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 0', cc: 12 },
    { key: 'piano.param1', name: 'param 1', id: 1, bit: 3, width: 7, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 1', cc: 44 },
    { key: 'piano.param2', name: 'param 2', id: 2, bit: 10, width: 7, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 2', cc: 45 },
    { key: 'piano.param3', name: 'piano.param3', id: 3, bit: 17, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 3' },
    { key: 'piano.param4', name: 'piano.param4', id: 4, bit: 24, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 4' },
    { key: 'piano.param5', name: 'piano.param5', id: 5, bit: 31, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 5' },
    { key: 'piano.param6', name: 'piano.param6', id: 6, bit: 38, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 6' },
    { key: 'piano.param7', name: 'param 7', id: 7, bit: 45, width: 4, min: 0, max: 12, def: 6, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 7' },
    { key: 'piano.param8', name: 'param 8', id: 8, bit: 49, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 8', cc: 33 },
    { key: 'piano.pedalNoise', name: 'Pedal noise', id: 9, bit: 51, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 9', cc: 78 },
    { key: 'piano.acoustics', name: 'Acoustics', id: 10, bit: 52, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 10', cc: 79 },
    { key: 'piano.param11', name: 'piano.param11', id: 11, bit: 53, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · piano 11' },
    { key: 'effects.eqBass', name: 'EQ bass', id: 0, bit: 80, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 0', cc: 114 },
    { key: 'effects.eqMidFreq', name: 'EQ mid freq', id: 1, bit: 87, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 1', cc: 117 },
    { key: 'effects.eqMid', name: 'EQ mid', id: 2, bit: 94, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 2', cc: 116 },
    { key: 'effects.eqTreble', name: 'EQ treble', id: 3, bit: 101, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 3', cc: 113 },
    { key: 'effects.effects1Rate', name: 'Effects 1 rate', id: 4, bit: 108, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 4', cc: 63 },
    { key: 'effects.effects1Type', name: 'Effects 1 type', id: 5, bit: 115, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 5', cc: 60 },
    { key: 'effects.effects2Rate', name: 'Effects 2 rate', id: 6, bit: 119, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 6', cc: 62 },
    { key: 'effects.effects2Type', name: 'Effects 2 type', id: 7, bit: 126, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 7', cc: 61 },
    { key: 'effects.ampCompDrive', name: 'Amp/Comp drive', id: 8, bit: 130, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 8', cc: 111 },
    { key: 'effects.ampCompType', name: 'Amp/Comp type', id: 9, bit: 137, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 9', cc: 81 },
    { key: 'effects.reverbDryWet', name: 'Reverb dry/wet', id: 10, bit: 140, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 10', cc: 102 },
    { key: 'effects.reverbType', name: 'Reverb type', id: 11, bit: 147, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 11', cc: 96 },
    { key: 'effects.eqOn', name: 'EQ on', id: 12, bit: 151, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 12', cc: 115 },
    { key: 'effects.effects1On', name: 'Effects 1 on', id: 13, bit: 152, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 13', cc: 69 },
    { key: 'effects.effects2On', name: 'Effects 2 on', id: 14, bit: 153, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 14', cc: 80 },
    { key: 'effects.ampCompOn', name: 'Amp/Comp on', id: 15, bit: 154, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 15', cc: 86 },
    { key: 'effects.reverbOn', name: 'Reverb on', id: 16, bit: 155, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Nord Piano OS 1.50 parameter descriptors · effects 16', cc: 97 },
  ],
};
