// AUTO-GENERATED (piano-4) — DO NOT EDIT MANUALLY.
//
// Provenance: Piano 4 OS 2.66 registry; Piano 4 OS 2.66 program archive (reads 1.00–1.01).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwLayout } from '../clavia/block-chain';

export type Np4FieldKey =
  | 'common.slotFocus'
  | 'common.slotEnable'
  | 'common.splMode'
  | 'common.splPos'
  | 'common.splSelect'
  | 'common.splWidth'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.monoModeEol'
  | 'piano.enable'
  | 'piano.kbZone'
  | 'piano.level'
  | 'piano.octaveShift'
  | 'piano.sustainEnable'
  | 'piano.controlEnable'
  | 'piano.bank'
  | 'piano.entry'
  | 'piano.variation'
  | 'piano.nameHash'
  | 'piano.acoustic'
  | 'piano.kbdTouch'
  | 'piano.eq'
  | 'piano.pedalNoise'
  | 'synth.enable'
  | 'synth.kbZone'
  | 'synth.level'
  | 'synth.octaveShift'
  | 'synth.sustainEnable'
  | 'synth.controlEnable'
  | 'synth.smpPos'
  | 'synth.smpNameHash'
  | 'synth.fltDyn'
  | 'synth.fltType'
  | 'synth.fltKbdTrk'
  | 'synth.fltFreq'
  | 'synth.fltVelAmt'
  | 'synth.ampEnvAtc'
  | 'synth.ampEnvVel'
  | 'synth.ampEnvDcyRls'
  | 'synth.ampEnvRls'
  | 'synth.ampEnvVelEn'
  | 'effects.fx1Enable'
  | 'effects.fx1Src'
  | 'effects.fx1Type'
  | 'effects.fx1Rate'
  | 'effects.fx1PedCtrl'
  | 'effects.fx2Enable'
  | 'effects.fx2Src'
  | 'effects.fx2Type'
  | 'effects.fx2Rate'
  | 'effects.fx2Deep'
  | 'effects.dlyEnable'
  | 'effects.dlySrc'
  | 'effects.dlyRate'
  | 'effects.dlyMix'
  | 'effects.dlyPingPong'
  | 'effects.dlyFeedback'
  | 'effects.eqlEnable'
  | 'effects.eqlSrc'
  | 'effects.eqlTreble'
  | 'effects.eqlMid'
  | 'effects.eqlBass'
  | 'effects.eqlMidFreq'
  | 'effects.rvbEnable'
  | 'effects.rvbType'
  | 'effects.rvbBright'
  | 'effects.rvbAmt'
  | 'effects.spkEnable'
  | 'effects.spkAmt'
  | 'effects.spkSrc'
  | 'effects.spkType';

export const NP4_LAYOUT: FwLayout<Np4FieldKey> = {
  model: 'Nord Piano 4',
  source: 'Piano 4 OS 2.66 registry',
  container: 'Piano 4 OS 2.66 program archive (reads 1.00–1.01)',
  versionRange: [100, 101],
  bodyBytes: 90,
  blocks: [
    { key: 'common', name: 'MultiCommon', offset: 4, length: 11 },
    { key: 'piano', name: 'Piano', offset: 16, length: 17 },
    { key: 'synth', name: 'Synth', offset: 34, length: 23 },
    { key: 'effects', name: 'Effects', offset: 58, length: 31 },
  ],
  fields: [
    { key: 'common.slotFocus', name: 'Edt_Com_kSlotFocus', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 91' },
    { key: 'common.slotEnable', name: 'Edt_Com_kSlotEnable', block: 0, bit: 1, width: 2, min: 1, max: 3, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 92' },
    { key: 'common.splMode', name: 'Edt_Com_kSplMode', block: 0, bit: 3, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 96' },
    { key: 'common.splPos', name: 'Edt_Com_kSplPos', block: 0, bit: 6, width: 3, min: 0, max: 6, def: 3, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 97' },
    { key: 'common.splSelect', name: 'Edt_Com_kSplSelect', block: 0, bit: 9, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 99' },
    { key: 'common.splWidth', name: 'Edt_Com_kSplWidth', block: 0, bit: 11, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 98' },
    { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 93' },
    { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 14, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 94' },
    { key: 'common.monoModeEol', name: 'Edt_Com_kMonoMode_EOL', block: 0, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 100' },
    { key: 'piano.enable', name: 'Edt_Pno_kEnable', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 120' },
    { key: 'piano.kbZone', name: 'Edt_Pno_kKbZone', block: 1, bit: 1, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 121' },
    { key: 'piano.level', name: 'Edt_Pno_kLevel', block: 1, bit: 3, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 122' },
    { key: 'piano.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 1, bit: 10, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 123' },
    { key: 'piano.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 1, bit: 14, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 124' },
    { key: 'piano.controlEnable', name: 'Edt_Pno_kControlEnable', block: 1, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 125' },
    { key: 'piano.bank', name: 'Edt_Pno_kBank', block: 1, bit: 16, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 127' },
    { key: 'piano.entry', name: 'Edt_Pno_kEntry', block: 1, bit: 19, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 128' },
    { key: 'piano.variation', name: 'Edt_Pno_kVariation', block: 1, bit: 24, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 129' },
    { key: 'piano.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 1, bit: 26, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 131' },
    { key: 'piano.acoustic', name: 'Edt_Pno_kAcoustic', block: 1, bit: 58, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 132' },
    { key: 'piano.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 1, bit: 60, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 133' },
    { key: 'piano.eq', name: 'Edt_Pno_kEq', block: 1, bit: 62, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 134' },
    { key: 'piano.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 1, bit: 65, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 135' },
    { key: 'synth.enable', name: 'Edt_Syn_kEnable', block: 2, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 101' },
    { key: 'synth.kbZone', name: 'Edt_Syn_kKbZone', block: 2, bit: 1, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 102' },
    { key: 'synth.level', name: 'Edt_Syn_kLevel', block: 2, bit: 3, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 103' },
    { key: 'synth.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 2, bit: 10, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 104' },
    { key: 'synth.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 2, bit: 14, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 105' },
    { key: 'synth.controlEnable', name: 'Edt_Syn_kControlEnable', block: 2, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 106' },
    { key: 'synth.smpPos', name: 'Edt_Syn_kSmpPos', block: 2, bit: 16, width: 9, min: 0, max: 399, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 107' },
    { key: 'synth.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 2, bit: 25, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 109' },
    { key: 'synth.fltDyn', name: 'Edt_Syn_kFltDyn', block: 2, bit: 57, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 110' },
    { key: 'synth.fltType', name: 'Edt_Syn_kFltType', block: 2, bit: 58, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 111' },
    { key: 'synth.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 2, bit: 61, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 112' },
    { key: 'synth.fltFreq', name: 'Edt_Syn_kFltFreq', block: 2, bit: 63, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 113' },
    { key: 'synth.fltVelAmt', name: 'Edt_Syn_kFltVelAmt', block: 2, bit: 70, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 114' },
    { key: 'synth.ampEnvAtc', name: 'Edt_Syn_kAmpEnvAtc', block: 2, bit: 77, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 117' },
    { key: 'synth.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 2, bit: 84, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 118' },
    { key: 'synth.ampEnvDcyRls', name: 'Edt_Syn_kAmpEnvDcyRls', block: 2, bit: 86, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 115' },
    { key: 'synth.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 2, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 116' },
    { key: 'synth.ampEnvVelEn', name: 'Edt_Syn_kAmpEnvVelEn', block: 2, bit: 100, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 119' },
    { key: 'effects.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 3, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 136' },
    { key: 'effects.fx1Src', name: 'Edt_Effects_kFx1Src', block: 3, bit: 1, width: 2, min: 1, max: 2, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 137' },
    { key: 'effects.fx1Type', name: 'Edt_Effects_kFx1Type', block: 3, bit: 3, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 138' },
    { key: 'effects.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 3, bit: 6, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 139' },
    { key: 'effects.fx1PedCtrl', name: 'Edt_Effects_kFx1PedCtrl', block: 3, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 140' },
    { key: 'effects.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 3, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 141' },
    { key: 'effects.fx2Src', name: 'Edt_Effects_kFx2Src', block: 3, bit: 15, width: 2, min: 1, max: 2, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 142' },
    { key: 'effects.fx2Type', name: 'Edt_Effects_kFx2Type', block: 3, bit: 17, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 143' },
    { key: 'effects.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 3, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 144' },
    { key: 'effects.fx2Deep', name: 'Edt_Effects_kFx2Deep', block: 3, bit: 27, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 145' },
    { key: 'effects.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 3, bit: 28, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 146' },
    { key: 'effects.dlySrc', name: 'Edt_Effects_kDlySrc', block: 3, bit: 29, width: 2, min: 1, max: 2, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 147' },
    { key: 'effects.dlyRate', name: 'Edt_Effects_kDlyRate', block: 3, bit: 31, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 148' },
    { key: 'effects.dlyMix', name: 'Edt_Effects_kDlyMix', block: 3, bit: 45, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 149' },
    { key: 'effects.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 3, bit: 52, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 150' },
    { key: 'effects.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 3, bit: 53, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 151' },
    { key: 'effects.eqlEnable', name: 'Edt_Effects_kEqlEnable', block: 3, bit: 55, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 152' },
    { key: 'effects.eqlSrc', name: 'Edt_Effects_kEqlSrc', block: 3, bit: 56, width: 2, min: 1, max: 2, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 153' },
    { key: 'effects.eqlTreble', name: 'Edt_Effects_kEqlTreble', block: 3, bit: 58, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 154' },
    { key: 'effects.eqlMid', name: 'Edt_Effects_kEqlMid', block: 3, bit: 65, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 155' },
    { key: 'effects.eqlBass', name: 'Edt_Effects_kEqlBass', block: 3, bit: 72, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 156' },
    { key: 'effects.eqlMidFreq', name: 'Edt_Effects_kEqlMidFreq', block: 3, bit: 79, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 157' },
    { key: 'effects.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 3, bit: 86, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 158' },
    { key: 'effects.rvbType', name: 'Edt_Effects_kRvbType', block: 3, bit: 87, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 159' },
    { key: 'effects.rvbBright', name: 'Edt_Effects_kRvbBright', block: 3, bit: 89, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 160' },
    { key: 'effects.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 3, bit: 90, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 161' },
    { key: 'effects.spkEnable', name: 'Edt_Effects_kSpkEnable', block: 3, bit: 97, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 162' },
    { key: 'effects.spkAmt', name: 'Edt_Effects_kSpkAmt', block: 3, bit: 98, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 165' },
    { key: 'effects.spkSrc', name: 'Edt_Effects_kSpkSrc', block: 3, bit: 105, width: 2, min: 1, max: 2, def: 1, enc: 'offset', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 163' },
    { key: 'effects.spkType', name: 'Edt_Effects_kSpkType', block: 3, bit: 107, width: 3, min: 0, max: 4, def: 3, enc: 'u', confidence: 'high', src: 'Piano 4 OS 2.66 registry · id 164' },
  ],
};
