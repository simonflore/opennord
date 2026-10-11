// AUTO-GENERATED (piano-3) — DO NOT EDIT MANUALLY.
//
// Provenance: Piano 3 OS 2.04 parameter containers; Piano 3 OS 2.04 program record: u16 version 4 + 53 bytes (common, piano, synth, effects).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Np3FieldKey =
  | 'common.partLInstrument'
  | 'common.partUInstrument'
  | 'common.partLOctaveShift'
  | 'common.partUOctaveShift'
  | 'common.partLSustPedal'
  | 'common.partUSustPedal'
  | 'common.partLCtrlPedal'
  | 'common.partUCtrlPedal'
  | 'common.param8'
  | 'common.keyboardSplitKeybSplit'
  | 'common.splitPoint'
  | 'common.transpose'
  | 'common.transposeValue'
  | 'common.monoModeMono'
  | 'common.partMix'
  | 'common.outLevel'
  | 'common.pianoLevel'
  | 'common.synthLevel'
  | 'common.param18'
  | 'common.pianoOn'
  | 'common.synthOn'
  | 'common.param21'
  | 'common.keyboardSplitSplitPoint'
  | 'piano.pianoType'
  | 'piano.pianoModel'
  | 'piano.pianoModel2'
  | 'piano.pianoAcoustics'
  | 'piano.pianoPedalNoise'
  | 'piano.pianoKbdTouch'
  | 'piano.pianoIdA'
  | 'piano.pianoIdB'
  | 'piano.param9'
  | 'piano.pianoPedals'
  | 'synth.sampleSynthAttack'
  | 'synth.sampleSynthDcyRel'
  | 'synth.sampleSelect'
  | 'synth.sampleIdA'
  | 'synth.sampleIdB'
  | 'synth.param6'
  | 'synth.sampleSynthDynamics'
  | 'synth.sampleSynthFilterVel'
  | 'synth.sampleSynthSynthPedals'
  | 'effects.effects1Fx1'
  | 'effects.effects1Fx1Src'
  | 'effects.effects1Fx1Type'
  | 'effects.effects1Fx1Rate'
  | 'effects.effects2Fx2'
  | 'effects.effects2Fx2Src'
  | 'effects.effects2Fx2Type'
  | 'effects.effects2Fx2Rate'
  | 'effects.delay'
  | 'effects.delaySrc'
  | 'effects.delayFeedback'
  | 'effects.delayTempo'
  | 'effects.delayDryWet'
  | 'effects.param13'
  | 'effects.equalizerEq'
  | 'effects.param15'
  | 'effects.equalizerMidFreq'
  | 'effects.equalizerTreble'
  | 'effects.equalizerMid'
  | 'effects.equalizerBass'
  | 'effects.ampCompAC'
  | 'effects.ampCompACSrc'
  | 'effects.ampCompACType'
  | 'effects.ampCompDrive'
  | 'effects.reverb'
  | 'effects.reverbBright'
  | 'effects.reverbType'
  | 'effects.reverbDryWet'
  | 'effects.param28'
  | 'effects.param29'
  | 'effects.param30'
  | 'effects.effects1PedCtrl'
  | 'effects.effects2Deep'
  | 'effects.equalizerEqSrc';

export const NP3_LAYOUT: LegacyLayout<Np3FieldKey> = {
  model: 'Nord Piano 3',
  source: 'Piano 3 OS 2.04 parameter containers',
  container: 'Piano 3 OS 2.04 program record: u16 version 4 + 53 bytes (common, piano, synth, effects)',
  recordVersion: 4,
  dataBytes: 53,
  fields: [
    { key: 'common.partLInstrument', name: 'Part L instrument', id: 0, bit: 0, width: 3, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 0' },
    { key: 'common.partUInstrument', name: 'Part U instrument', id: 1, bit: 3, width: 3, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 1' },
    { key: 'common.partLOctaveShift', name: 'Part L Octave Shift', id: 2, bit: 6, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 2', cc: 105 },
    { key: 'common.partUOctaveShift', name: 'Part U Octave Shift', id: 3, bit: 10, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 3', cc: 56 },
    { key: 'common.partLSustPedal', name: 'Part L Sust Pedal', id: 4, bit: 14, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 4' },
    { key: 'common.partUSustPedal', name: 'Part U Sust Pedal', id: 5, bit: 15, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 5' },
    { key: 'common.partLCtrlPedal', name: 'Part L Ctrl Pedal', id: 6, bit: 16, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 6' },
    { key: 'common.partUCtrlPedal', name: 'Part U Ctrl Pedal', id: 7, bit: 17, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 7' },
    { key: 'common.param8', name: 'common.param8', id: 8, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 8' },
    { key: 'common.keyboardSplitKeybSplit', name: 'Keyboard Split Keyb Split', id: 9, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 9', cc: 14 },
    { key: 'common.splitPoint', name: 'Split point', id: 10, bit: 21, width: 7, min: 0, max: 87, def: 44, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 10' },
    { key: 'common.transpose', name: 'Transpose', id: 11, bit: 28, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 11', cc: 15 },
    { key: 'common.transposeValue', name: 'Transpose value', id: 12, bit: 29, width: 4, min: 0, max: 12, def: 7, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 12', cc: 17 },
    { key: 'common.monoModeMono', name: 'Mono Mode Mono', id: 13, bit: 33, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 13', cc: 83 },
    { key: 'common.partMix', name: 'Part Mix', id: 14, bit: 34, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 14' },
    { key: 'common.outLevel', name: 'Out Level', id: 15, bit: 41, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 15' },
    { key: 'common.pianoLevel', name: 'Piano Level', id: 16, bit: 48, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 16', cc: 106 },
    { key: 'common.synthLevel', name: 'Synth Level', id: 17, bit: 55, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 17', cc: 51 },
    { key: 'common.param18', name: 'param 18', id: 18, bit: 62, width: 3, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 18' },
    { key: 'common.pianoOn', name: 'Piano on', id: 19, bit: 65, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 19', cc: 46 },
    { key: 'common.synthOn', name: 'Synth on', id: 20, bit: 66, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 20', cc: 55 },
    { key: 'common.param21', name: 'common.param21', id: 21, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 21' },
    { key: 'common.keyboardSplitSplitPoint', name: 'Keyboard Split Split point', id: 23, bit: 68, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · common 23', cc: 16 },
    { key: 'piano.pianoType', name: 'Piano Type', id: 1, bit: 96, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 1', cc: 12 },
    { key: 'piano.pianoModel', name: 'Piano model', id: 2, bit: 99, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 2', cc: 44 },
    { key: 'piano.pianoModel2', name: 'Piano model 2', id: 3, bit: 106, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 3', cc: 45 },
    { key: 'piano.pianoAcoustics', name: 'Piano Acoustics', id: 4, bit: 113, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 4', cc: 79 },
    { key: 'piano.pianoPedalNoise', name: 'Piano Pedal Noise', id: 5, bit: 115, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 5', cc: 78 },
    { key: 'piano.pianoKbdTouch', name: 'Piano Kbd Touch', id: 6, bit: 116, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 6', cc: 47 },
    { key: 'piano.pianoIdA', name: 'Piano id A', id: 7, bit: 118, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 7' },
    { key: 'piano.pianoIdB', name: 'Piano id B', id: 8, bit: 133, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 8' },
    { key: 'piano.param9', name: 'piano.param9', id: 9, bit: 148, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 9' },
    { key: 'piano.pianoPedals', name: 'Piano Pedals', id: 10, bit: 150, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · piano 10', cc: 107 },
    { key: 'synth.sampleSynthAttack', name: 'Sample Synth Attack', id: 1, bit: 192, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 1', cc: 53 },
    { key: 'synth.sampleSynthDcyRel', name: 'Sample Synth Dcy/Rel', id: 2, bit: 199, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 2', cc: 54 },
    { key: 'synth.sampleSelect', name: 'Sample select', id: 3, bit: 206, width: 8, min: 0, max: 158, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 3', cc: 52 },
    { key: 'synth.sampleIdA', name: 'Sample id A', id: 4, bit: 214, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 4' },
    { key: 'synth.sampleIdB', name: 'Sample id B', id: 5, bit: 229, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 5' },
    { key: 'synth.param6', name: 'synth.param6', id: 6, bit: 244, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 6' },
    { key: 'synth.sampleSynthDynamics', name: 'Sample Synth Dynamics', id: 7, bit: 246, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 7', cc: 57 },
    { key: 'synth.sampleSynthFilterVel', name: 'Sample Synth Filter Vel', id: 8, bit: 248, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 8' },
    { key: 'synth.sampleSynthSynthPedals', name: 'Sample Synth Synth Pedals', id: 9, bit: 249, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Piano 3 OS 2.04 parameter containers · synth 9', cc: 108 },
    { key: 'effects.effects1Fx1', name: 'Effects 1 Fx1', id: 0, bit: 280, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 0', cc: 69 },
    { key: 'effects.effects1Fx1Src', name: 'Effects 1 Fx1 Src', id: 1, bit: 281, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 1', cc: 70 },
    { key: 'effects.effects1Fx1Type', name: 'Effects 1 Fx1 Type', id: 2, bit: 282, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 2', cc: 60 },
    { key: 'effects.effects1Fx1Rate', name: 'Effects 1 Fx1 Rate', id: 3, bit: 286, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 3', cc: 63 },
    { key: 'effects.effects2Fx2', name: 'Effects 2 Fx2', id: 4, bit: 293, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 4', cc: 80 },
    { key: 'effects.effects2Fx2Src', name: 'Effects 2 Fx2 Src', id: 5, bit: 294, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 5', cc: 71 },
    { key: 'effects.effects2Fx2Type', name: 'Effects 2 Fx2 Type', id: 6, bit: 295, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 6', cc: 61 },
    { key: 'effects.effects2Fx2Rate', name: 'Effects 2 Fx2 Rate', id: 7, bit: 299, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 7', cc: 62 },
    { key: 'effects.delay', name: 'Delay', id: 8, bit: 306, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 8', cc: 84 },
    { key: 'effects.delaySrc', name: 'Delay Src', id: 9, bit: 307, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 9', cc: 85 },
    { key: 'effects.delayFeedback', name: 'Delay Feedback', id: 10, bit: 308, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 10', cc: 76 },
    { key: 'effects.delayTempo', name: 'Delay Tempo', id: 11, bit: 310, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 11', cc: 92 },
    { key: 'effects.delayDryWet', name: 'Delay Dry/Wet', id: 12, bit: 317, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 12', cc: 75 },
    { key: 'effects.param13', name: 'effects.param13', id: 13, bit: 324, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 13' },
    { key: 'effects.equalizerEq', name: 'Equalizer Eq', id: 14, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 14', cc: 115 },
    { key: 'effects.param15', name: 'effects.param15', id: 15, bit: 326, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 15' },
    { key: 'effects.equalizerMidFreq', name: 'Equalizer Mid Freq', id: 16, bit: 327, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 16', cc: 117 },
    { key: 'effects.equalizerTreble', name: 'Equalizer Treble', id: 17, bit: 334, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 17', cc: 113 },
    { key: 'effects.equalizerMid', name: 'Equalizer Mid', id: 18, bit: 341, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 18', cc: 116 },
    { key: 'effects.equalizerBass', name: 'Equalizer Bass', id: 19, bit: 348, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 19', cc: 112 },
    { key: 'effects.ampCompAC', name: 'Amp/Comp A/C', id: 20, bit: 355, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 20', cc: 86 },
    { key: 'effects.ampCompACSrc', name: 'Amp/Comp A/C Src', id: 21, bit: 356, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 21', cc: 87 },
    { key: 'effects.ampCompACType', name: 'Amp/Comp A/C Type', id: 22, bit: 357, width: 3, min: 0, max: 4, def: 3, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 22', cc: 81 },
    { key: 'effects.ampCompDrive', name: 'Amp/Comp Drive', id: 23, bit: 360, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 23', cc: 111 },
    { key: 'effects.reverb', name: 'Reverb', id: 24, bit: 367, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 24', cc: 97 },
    { key: 'effects.reverbBright', name: 'Reverb Bright', id: 25, bit: 368, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 25', cc: 98 },
    { key: 'effects.reverbType', name: 'Reverb Type', id: 26, bit: 369, width: 3, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 26', cc: 96 },
    { key: 'effects.reverbDryWet', name: 'Reverb Dry/Wet', id: 27, bit: 372, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 27', cc: 102 },
    { key: 'effects.param28', name: 'effects.param28', id: 28, bit: 379, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 28' },
    { key: 'effects.param29', name: 'effects.param29', id: 29, bit: 380, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 29' },
    { key: 'effects.param30', name: 'effects.param30', id: 30, bit: 381, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 30' },
    { key: 'effects.effects1PedCtrl', name: 'Effects 1 PedCtrl', id: 33, bit: 396, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 33', cc: 72 },
    { key: 'effects.effects2Deep', name: 'Effects 2 Deep', id: 34, bit: 397, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 34', cc: 73 },
    { key: 'effects.equalizerEqSrc', name: 'Equalizer Eq Src', id: 35, bit: 398, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 3 OS 2.04 parameter containers · effects 35', cc: 118 },
  ],
};
