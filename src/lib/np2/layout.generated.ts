// AUTO-GENERATED (piano-2) — DO NOT EDIT MANUALLY.
//
// Provenance: Piano 2 OS 1.22 parameter descriptors; Piano 2 OS 1.22 program record: 24-byte descriptors, u16 version 2 + 42 bytes (v1 converted: common param 4 remapped).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Np2FieldKey =
  | 'common.keybSplit'
  | 'common.splitPoint'
  | 'common.transpose'
  | 'common.transposeValue'
  | 'common.param4'
  | 'common.param5'
  | 'piano.pianoOn'
  | 'piano.pianoLevel'
  | 'piano.pianoOctaveShift'
  | 'piano.pianoType'
  | 'piano.pianoModel'
  | 'piano.pianoModel2'
  | 'piano.acoustics'
  | 'piano.pedalNoise'
  | 'piano.pianoIdA'
  | 'piano.pianoIdB'
  | 'piano.param10'
  | 'synth.synthOn'
  | 'synth.synthLevel'
  | 'synth.synthOctaveShift'
  | 'synth.attack'
  | 'synth.dcyRel'
  | 'synth.sampleSelect'
  | 'synth.sampleIdA'
  | 'synth.sampleIdB'
  | 'synth.param8'
  | 'effects.effects1On'
  | 'effects.effects1Source'
  | 'effects.effects1Type'
  | 'effects.effects1Rate'
  | 'effects.effects2On'
  | 'effects.effects2Source'
  | 'effects.effects2Type'
  | 'effects.effects2Rate'
  | 'effects.delayOn'
  | 'effects.delaySource'
  | 'effects.delayFeedback'
  | 'effects.delayTempo'
  | 'effects.delayDryWet'
  | 'effects.eqOn'
  | 'effects.eqSource'
  | 'effects.eqMidFreq'
  | 'effects.eqTreble'
  | 'effects.eqMid'
  | 'effects.eqBass'
  | 'effects.ampCompOn'
  | 'effects.ampCompSource'
  | 'effects.ampCompType'
  | 'effects.ampCompDrive'
  | 'effects.reverbOn'
  | 'effects.reverbType'
  | 'effects.reverbDryWet';

export const NP2_LAYOUT: LegacyLayout<Np2FieldKey> = {
  model: 'Nord Piano 2',
  source: 'Piano 2 OS 1.22 parameter descriptors',
  container: 'Piano 2 OS 1.22 program record: 24-byte descriptors, u16 version 2 + 42 bytes (v1 converted: common param 4 remapped)',
  recordVersion: 2,
  dataBytes: 42,
  fields: [
    { key: 'common.keybSplit', name: 'Keyb split', id: 0, bit: 0, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 0', cc: 14 },
    { key: 'common.splitPoint', name: 'Split point', id: 1, bit: 2, width: 7, min: 0, max: 87, def: 38, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 1' },
    { key: 'common.transpose', name: 'Transpose', id: 2, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 2', cc: 15 },
    { key: 'common.transposeValue', name: 'Transpose value', id: 3, bit: 10, width: 4, min: 0, max: 12, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 3' },
    { key: 'common.param4', name: 'param 4', id: 4, bit: 14, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 4', cc: 33 },
    { key: 'common.param5', name: 'param 5', id: 5, bit: 16, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · common 5', cc: 34 },
    { key: 'piano.pianoOn', name: 'Piano on', id: 0, bit: 32, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 0', cc: 46 },
    { key: 'piano.pianoLevel', name: 'Piano level', id: 1, bit: 33, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 1', cc: 106 },
    { key: 'piano.pianoOctaveShift', name: 'Piano octave shift', id: 2, bit: 40, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 2', cc: 105 },
    { key: 'piano.pianoType', name: 'Piano type', id: 3, bit: 44, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 3', cc: 12 },
    { key: 'piano.pianoModel', name: 'Piano model', id: 4, bit: 47, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 4', cc: 44 },
    { key: 'piano.pianoModel2', name: 'Piano model 2', id: 5, bit: 54, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 5', cc: 45 },
    { key: 'piano.acoustics', name: 'Acoustics', id: 6, bit: 61, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 6', cc: 79 },
    { key: 'piano.pedalNoise', name: 'Pedal noise', id: 7, bit: 63, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 7', cc: 78 },
    { key: 'piano.pianoIdA', name: 'Piano id A', id: 8, bit: 64, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 8' },
    { key: 'piano.pianoIdB', name: 'Piano id B', id: 9, bit: 79, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 9' },
    { key: 'piano.param10', name: 'piano.param10', id: 10, bit: 94, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · piano 10' },
    { key: 'synth.synthOn', name: 'Synth on', id: 0, bit: 128, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 0', cc: 55 },
    { key: 'synth.synthLevel', name: 'Synth level', id: 1, bit: 129, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 1', cc: 51 },
    { key: 'synth.synthOctaveShift', name: 'Synth octave shift', id: 2, bit: 136, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 2', cc: 56 },
    { key: 'synth.attack', name: 'Attack', id: 3, bit: 140, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 3', cc: 53 },
    { key: 'synth.dcyRel', name: 'Dcy/Rel', id: 4, bit: 147, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 4', cc: 54 },
    { key: 'synth.sampleSelect', name: 'Sample select', id: 5, bit: 154, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 5', cc: 52 },
    { key: 'synth.sampleIdA', name: 'Sample id A', id: 6, bit: 161, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 6' },
    { key: 'synth.sampleIdB', name: 'Sample id B', id: 7, bit: 176, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 7' },
    { key: 'synth.param8', name: 'synth.param8', id: 8, bit: 191, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · synth 8' },
    { key: 'effects.effects1On', name: 'Effects 1 on', id: 0, bit: 208, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 0', cc: 69 },
    { key: 'effects.effects1Source', name: 'Effects 1 source', id: 1, bit: 209, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 1', cc: 70 },
    { key: 'effects.effects1Type', name: 'Effects 1 type', id: 2, bit: 210, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 2', cc: 60 },
    { key: 'effects.effects1Rate', name: 'Effects 1 rate', id: 3, bit: 214, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 3', cc: 63 },
    { key: 'effects.effects2On', name: 'Effects 2 on', id: 4, bit: 221, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 4', cc: 80 },
    { key: 'effects.effects2Source', name: 'Effects 2 source', id: 5, bit: 222, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 5', cc: 71 },
    { key: 'effects.effects2Type', name: 'Effects 2 type', id: 6, bit: 223, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 6', cc: 61 },
    { key: 'effects.effects2Rate', name: 'Effects 2 rate', id: 7, bit: 227, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 7', cc: 62 },
    { key: 'effects.delayOn', name: 'Delay on', id: 8, bit: 234, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 8', cc: 84 },
    { key: 'effects.delaySource', name: 'Delay source', id: 9, bit: 235, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 9', cc: 85 },
    { key: 'effects.delayFeedback', name: 'Delay feedback', id: 10, bit: 236, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 10', cc: 76 },
    { key: 'effects.delayTempo', name: 'Delay tempo', id: 11, bit: 238, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 11' },
    { key: 'effects.delayDryWet', name: 'Delay dry/wet', id: 12, bit: 245, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 12', cc: 75 },
    { key: 'effects.eqOn', name: 'EQ on', id: 13, bit: 252, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 13', cc: 115 },
    { key: 'effects.eqSource', name: 'EQ source', id: 14, bit: 253, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 14', cc: 118 },
    { key: 'effects.eqMidFreq', name: 'EQ mid freq', id: 15, bit: 254, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 15', cc: 117 },
    { key: 'effects.eqTreble', name: 'EQ treble', id: 16, bit: 261, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 16', cc: 113 },
    { key: 'effects.eqMid', name: 'EQ mid', id: 17, bit: 268, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 17', cc: 116 },
    { key: 'effects.eqBass', name: 'EQ bass', id: 18, bit: 275, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 18', cc: 112 },
    { key: 'effects.ampCompOn', name: 'Amp/Comp on', id: 19, bit: 282, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 19', cc: 86 },
    { key: 'effects.ampCompSource', name: 'Amp/Comp source', id: 20, bit: 283, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 20', cc: 87 },
    { key: 'effects.ampCompType', name: 'Amp/Comp type', id: 21, bit: 284, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 21', cc: 81 },
    { key: 'effects.ampCompDrive', name: 'Amp/Comp drive', id: 22, bit: 287, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 22', cc: 111 },
    { key: 'effects.reverbOn', name: 'Reverb on', id: 23, bit: 294, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 23', cc: 97 },
    { key: 'effects.reverbType', name: 'Reverb type', id: 24, bit: 295, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 24', cc: 96 },
    { key: 'effects.reverbDryWet', name: 'Reverb dry/wet', id: 25, bit: 298, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 2 OS 1.22 parameter descriptors · effects 25', cc: 102 },
  ],
};
