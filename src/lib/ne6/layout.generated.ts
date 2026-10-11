// AUTO-GENERATED (electro-6) — DO NOT EDIT MANUALLY.
//
// Provenance: Electro 6 OS 2.66 registry; Electro 6 OS 2.66 Multi format (reads 2.00–2.04), block order from the node-key initialiser.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwLayout } from '../clavia/block-chain';

export type Ne6FieldKey =
  | 'common.slotFocus'
  | 'common.slotEnable'
  | 'common.splMode'
  | 'common.splPos'
  | 'common.splWidth'
  | 'common.layerDetuneEol'
  | 'common.leslieSpeed'
  | 'common.leslieRotorAngle'
  | 'common.leslieHornAngle'
  | 'common.transposeEnable'
  | 'common.transposeValue'
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
  | 'piano.monoModeEol'
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
  | 'effects.spkType'
  | 'organ.enable'
  | 'organ.sustainEnable'
  | 'organ.controlEnable'
  | 'organ.liveManual'
  | 'organ.vibratoTypeEol'
  | 'organMultiA.kbZone'
  | 'organMultiA.octaveShift'
  | 'organMultiB.kbZone'
  | 'organMultiB.octaveShift'
  | 'organManualCommon.level'
  | 'organManualCommon.model'
  | 'organManualCommon.vibratoType'
  | 'manualAPresetCommon.presetFocus'
  | 'manualAPresetI.db1'
  | 'manualAPresetI.db2'
  | 'manualAPresetI.db3'
  | 'manualAPresetI.db4'
  | 'manualAPresetI.db5'
  | 'manualAPresetI.db6'
  | 'manualAPresetI.db7'
  | 'manualAPresetI.db8'
  | 'manualAPresetI.db9'
  | 'manualAPresetI.vibratoEnable'
  | 'manualAPresetI.b3PercEnable'
  | 'manualAPresetI.b3PercHarmonic'
  | 'manualAPresetI.b3PercSpeed'
  | 'manualAPresetI.b3PercLevel'
  | 'manualAPresetII.db1'
  | 'manualAPresetII.db2'
  | 'manualAPresetII.db3'
  | 'manualAPresetII.db4'
  | 'manualAPresetII.db5'
  | 'manualAPresetII.db6'
  | 'manualAPresetII.db7'
  | 'manualAPresetII.db8'
  | 'manualAPresetII.db9'
  | 'manualAPresetII.vibratoEnable'
  | 'manualAPresetII.b3PercEnable'
  | 'manualAPresetII.b3PercHarmonic'
  | 'manualAPresetII.b3PercSpeed'
  | 'manualAPresetII.b3PercLevel'
  | 'manualBPresetCommon.presetFocus'
  | 'manualBPresetI.db1'
  | 'manualBPresetI.db2'
  | 'manualBPresetI.db3'
  | 'manualBPresetI.db4'
  | 'manualBPresetI.db5'
  | 'manualBPresetI.db6'
  | 'manualBPresetI.db7'
  | 'manualBPresetI.db8'
  | 'manualBPresetI.db9'
  | 'manualBPresetI.vibratoEnable'
  | 'manualBPresetI.b3PercEnable'
  | 'manualBPresetI.b3PercHarmonic'
  | 'manualBPresetI.b3PercSpeed'
  | 'manualBPresetI.b3PercLevel'
  | 'manualBPresetII.db1'
  | 'manualBPresetII.db2'
  | 'manualBPresetII.db3'
  | 'manualBPresetII.db4'
  | 'manualBPresetII.db5'
  | 'manualBPresetII.db6'
  | 'manualBPresetII.db7'
  | 'manualBPresetII.db8'
  | 'manualBPresetII.db9'
  | 'manualBPresetII.vibratoEnable'
  | 'manualBPresetII.b3PercEnable'
  | 'manualBPresetII.b3PercHarmonic'
  | 'manualBPresetII.b3PercSpeed'
  | 'manualBPresetII.b3PercLevel';

export const NE6_LAYOUT: FwLayout<Ne6FieldKey> = {
  model: 'Nord Electro 6',
  source: 'Electro 6 OS 2.66 registry',
  container: 'Electro 6 OS 2.66 Multi format (reads 2.00–2.04), block order from the node-key initialiser',
  versionRange: [200, 204],
  bodyBytes: 211,
  blocks: [
    { key: 'common', name: 'MultiComm', offset: 4, length: 14 },
    { key: 'piano', name: 'Piano', offset: 19, length: 17 },
    { key: 'synth', name: 'Synth', offset: 37, length: 23 },
    { key: 'effects', name: 'Effects', offset: 61, length: 31 },
    { key: 'organ', name: 'Organ', offset: 93, length: 9 },
    { key: 'organMultiA', name: 'OrganMultiA', offset: 103, length: 9 },
    { key: 'organMultiB', name: 'OrganMultiB', offset: 113, length: 9 },
    { key: 'organManualCommon', name: 'OrgMan/Comm', offset: 123, length: 9 },
    { key: 'manualAPresetCommon', name: 'OrgMan/A/PresetComm', offset: 133, length: 8 },
    { key: 'manualAPresetI', name: 'OrgMan/A/PresetI', offset: 142, length: 14 },
    { key: 'manualAPresetII', name: 'OrgMan/A/PresetII', offset: 157, length: 14 },
    { key: 'manualBPresetCommon', name: 'OrgMan/B/PresetComm', offset: 172, length: 8 },
    { key: 'manualBPresetI', name: 'OrgMan/B/PresetI', offset: 181, length: 14 },
    { key: 'manualBPresetII', name: 'OrgMan/B/PresetII', offset: 196, length: 14 },
  ],
  fields: [
    { key: 'common.slotFocus', name: 'Edt_Com_kSlotFocus', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 98' },
    { key: 'common.slotEnable', name: 'Edt_Com_kSlotEnable', block: 0, bit: 1, width: 2, min: 1, max: 3, def: 1, enc: 'offset', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 99' },
    { key: 'common.splMode', name: 'Edt_Com_kSplMode', block: 0, bit: 3, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 105' },
    { key: 'common.splPos', name: 'Edt_Com_kSplPos', block: 0, bit: 6, width: 3, min: 0, max: 5, def: 3, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 106' },
    { key: 'common.splWidth', name: 'Edt_Com_kSplWidth', block: 0, bit: 9, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 107' },
    { key: 'common.layerDetuneEol', name: 'Edt_Pno_kLayerDetune_EOL', block: 0, bit: 11, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 140' },
    { key: 'common.leslieSpeed', name: 'Edt_Effects_kLeslieSpeed', block: 0, bit: 13, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 170' },
    { key: 'common.leslieRotorAngle', name: 'Edt_Com_kLeslieRotorAngle', block: 0, bit: 15, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 102' },
    { key: 'common.leslieHornAngle', name: 'Edt_Com_kLeslieHornAngle', block: 0, bit: 22, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 103' },
    { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 29, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 100' },
    { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 30, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 101' },
    { key: 'piano.enable', name: 'Edt_Pno_kEnable', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 126' },
    { key: 'piano.kbZone', name: 'Edt_Pno_kKbZone', block: 1, bit: 1, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 127' },
    { key: 'piano.level', name: 'Edt_Pno_kLevel', block: 1, bit: 3, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 128' },
    { key: 'piano.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 1, bit: 10, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 129' },
    { key: 'piano.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 1, bit: 14, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 130' },
    { key: 'piano.controlEnable', name: 'Edt_Pno_kControlEnable', block: 1, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 131' },
    { key: 'piano.bank', name: 'Edt_Pno_kBank', block: 1, bit: 16, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 133' },
    { key: 'piano.entry', name: 'Edt_Pno_kEntry', block: 1, bit: 19, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 134' },
    { key: 'piano.variation', name: 'Edt_Pno_kVariation', block: 1, bit: 24, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 135' },
    { key: 'piano.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 1, bit: 26, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 137' },
    { key: 'piano.acoustic', name: 'Edt_Pno_kAcoustic', block: 1, bit: 58, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 138' },
    { key: 'piano.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 1, bit: 60, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 139' },
    { key: 'piano.eq', name: 'Edt_Pno_kEq', block: 1, bit: 62, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 141' },
    { key: 'piano.monoModeEol', name: 'Edt_Pno_kMonoMode_EOL', block: 1, bit: 65, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 142' },
    { key: 'synth.enable', name: 'Edt_Syn_kEnable', block: 2, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 108' },
    { key: 'synth.kbZone', name: 'Edt_Syn_kKbZone', block: 2, bit: 1, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 109' },
    { key: 'synth.level', name: 'Edt_Syn_kLevel', block: 2, bit: 3, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 110' },
    { key: 'synth.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 2, bit: 10, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 111' },
    { key: 'synth.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 2, bit: 14, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 112' },
    { key: 'synth.controlEnable', name: 'Edt_Syn_kControlEnable', block: 2, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 113' },
    { key: 'synth.smpPos', name: 'Edt_Syn_kSmpPos', block: 2, bit: 16, width: 9, min: 0, max: 399, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 114' },
    { key: 'synth.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 2, bit: 25, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 116' },
    { key: 'synth.fltDyn', name: 'Edt_Syn_kFltDyn', block: 2, bit: 57, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 117' },
    { key: 'synth.fltType', name: 'Edt_Syn_kFltType', block: 2, bit: 58, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 118' },
    { key: 'synth.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 2, bit: 61, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 119' },
    { key: 'synth.fltFreq', name: 'Edt_Syn_kFltFreq', block: 2, bit: 63, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 120' },
    { key: 'synth.fltVelAmt', name: 'Edt_Syn_kFltVelAmt', block: 2, bit: 70, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 121' },
    { key: 'synth.ampEnvAtc', name: 'Edt_Syn_kAmpEnvAtc', block: 2, bit: 77, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 124' },
    { key: 'synth.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 2, bit: 84, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 125' },
    { key: 'synth.ampEnvDcyRls', name: 'Edt_Syn_kAmpEnvDcyRls', block: 2, bit: 86, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 122' },
    { key: 'synth.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 2, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 123' },
    { key: 'effects.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 3, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 171' },
    { key: 'effects.fx1Src', name: 'Edt_Effects_kFx1Src', block: 3, bit: 1, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 172' },
    { key: 'effects.fx1Type', name: 'Edt_Effects_kFx1Type', block: 3, bit: 3, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 173' },
    { key: 'effects.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 3, bit: 6, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 174' },
    { key: 'effects.fx1PedCtrl', name: 'Edt_Effects_kFx1PedCtrl', block: 3, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 175' },
    { key: 'effects.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 3, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 176' },
    { key: 'effects.fx2Src', name: 'Edt_Effects_kFx2Src', block: 3, bit: 15, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 177' },
    { key: 'effects.fx2Type', name: 'Edt_Effects_kFx2Type', block: 3, bit: 17, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 178' },
    { key: 'effects.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 3, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 179' },
    { key: 'effects.fx2Deep', name: 'Edt_Effects_kFx2Deep', block: 3, bit: 27, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 180' },
    { key: 'effects.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 3, bit: 28, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 181' },
    { key: 'effects.dlySrc', name: 'Edt_Effects_kDlySrc', block: 3, bit: 29, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 182' },
    { key: 'effects.dlyRate', name: 'Edt_Effects_kDlyRate', block: 3, bit: 31, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 183' },
    { key: 'effects.dlyMix', name: 'Edt_Effects_kDlyMix', block: 3, bit: 45, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 184' },
    { key: 'effects.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 3, bit: 52, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 185' },
    { key: 'effects.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 3, bit: 53, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 186' },
    { key: 'effects.eqlEnable', name: 'Edt_Effects_kEqlEnable', block: 3, bit: 55, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 187' },
    { key: 'effects.eqlSrc', name: 'Edt_Effects_kEqlSrc', block: 3, bit: 56, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 188' },
    { key: 'effects.eqlTreble', name: 'Edt_Effects_kEqlTreble', block: 3, bit: 58, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 189' },
    { key: 'effects.eqlMid', name: 'Edt_Effects_kEqlMid', block: 3, bit: 65, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 190' },
    { key: 'effects.eqlBass', name: 'Edt_Effects_kEqlBass', block: 3, bit: 72, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 191' },
    { key: 'effects.eqlMidFreq', name: 'Edt_Effects_kEqlMidFreq', block: 3, bit: 79, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 192' },
    { key: 'effects.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 3, bit: 86, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 193' },
    { key: 'effects.rvbType', name: 'Edt_Effects_kRvbType', block: 3, bit: 87, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 194' },
    { key: 'effects.rvbBright', name: 'Edt_Effects_kRvbBright', block: 3, bit: 89, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 195' },
    { key: 'effects.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 3, bit: 90, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 196' },
    { key: 'effects.spkEnable', name: 'Edt_Effects_kSpkEnable', block: 3, bit: 97, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 197' },
    { key: 'effects.spkAmt', name: 'Edt_Effects_kSpkAmt', block: 3, bit: 98, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 200' },
    { key: 'effects.spkSrc', name: 'Edt_Effects_kSpkSrc', block: 3, bit: 105, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 198' },
    { key: 'effects.spkType', name: 'Edt_Effects_kSpkType', block: 3, bit: 107, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 199' },
    { key: 'organ.enable', name: 'Edt_Org_kEnable', block: 4, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 143' },
    { key: 'organ.sustainEnable', name: 'Edt_Org_kSustainEnable', block: 4, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 145' },
    { key: 'organ.controlEnable', name: 'Edt_Org_kControlEnable', block: 4, bit: 2, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 146' },
    { key: 'organ.liveManual', name: 'Edt_Org_kLiveManual', block: 4, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 150' },
    { key: 'organ.vibratoTypeEol', name: 'Edt_Org_kVibratoType_EOL', block: 4, bit: 4, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 148' },
    { key: 'organMultiA.kbZone', name: 'Edt_Org_kKbZone', block: 5, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 153' },
    { key: 'organMultiA.octaveShift', name: 'Edt_Org_kOctaveShift', block: 5, bit: 2, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 152' },
    { key: 'organMultiB.kbZone', name: 'Edt_Org_kKbZone', block: 6, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 153' },
    { key: 'organMultiB.octaveShift', name: 'Edt_Org_kOctaveShift', block: 6, bit: 2, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 152' },
    { key: 'organManualCommon.level', name: 'Edt_Org_kLevel', block: 7, bit: 0, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 144' },
    { key: 'organManualCommon.model', name: 'Edt_Org_kModel', block: 7, bit: 7, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 147' },
    { key: 'organManualCommon.vibratoType', name: 'Edt_Org_kVibratoType', block: 7, bit: 10, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 149' },
    { key: 'manualAPresetCommon.presetFocus', name: 'Edt_Org_kPresetFocus', block: 8, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 151' },
    { key: 'manualAPresetI.db1', name: 'Edt_OrgPreset_kDb1', block: 9, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 155' },
    { key: 'manualAPresetI.db2', name: 'Edt_OrgPreset_kDb2', block: 9, bit: 4, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 156' },
    { key: 'manualAPresetI.db3', name: 'Edt_OrgPreset_kDb3', block: 9, bit: 8, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 157' },
    { key: 'manualAPresetI.db4', name: 'Edt_OrgPreset_kDb4', block: 9, bit: 12, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 158' },
    { key: 'manualAPresetI.db5', name: 'Edt_OrgPreset_kDb5', block: 9, bit: 16, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 159' },
    { key: 'manualAPresetI.db6', name: 'Edt_OrgPreset_kDb6', block: 9, bit: 20, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 160' },
    { key: 'manualAPresetI.db7', name: 'Edt_OrgPreset_kDb7', block: 9, bit: 24, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 161' },
    { key: 'manualAPresetI.db8', name: 'Edt_OrgPreset_kDb8', block: 9, bit: 28, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 162' },
    { key: 'manualAPresetI.db9', name: 'Edt_OrgPreset_kDb9', block: 9, bit: 32, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 163' },
    { key: 'manualAPresetI.vibratoEnable', name: 'Edt_OrgPreset_kVibratoEnable', block: 9, bit: 36, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 154' },
    { key: 'manualAPresetI.b3PercEnable', name: 'Edt_OrgPreset_kB3PercEnable', block: 9, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 164' },
    { key: 'manualAPresetI.b3PercHarmonic', name: 'Edt_OrgPreset_kB3PercHarmonic', block: 9, bit: 38, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 165' },
    { key: 'manualAPresetI.b3PercSpeed', name: 'Edt_OrgPreset_kB3PercSpeed', block: 9, bit: 39, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 166' },
    { key: 'manualAPresetI.b3PercLevel', name: 'Edt_OrgPreset_kB3PercLevel', block: 9, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 167' },
    { key: 'manualAPresetII.db1', name: 'Edt_OrgPreset_kDb1', block: 10, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 155' },
    { key: 'manualAPresetII.db2', name: 'Edt_OrgPreset_kDb2', block: 10, bit: 4, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 156' },
    { key: 'manualAPresetII.db3', name: 'Edt_OrgPreset_kDb3', block: 10, bit: 8, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 157' },
    { key: 'manualAPresetII.db4', name: 'Edt_OrgPreset_kDb4', block: 10, bit: 12, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 158' },
    { key: 'manualAPresetII.db5', name: 'Edt_OrgPreset_kDb5', block: 10, bit: 16, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 159' },
    { key: 'manualAPresetII.db6', name: 'Edt_OrgPreset_kDb6', block: 10, bit: 20, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 160' },
    { key: 'manualAPresetII.db7', name: 'Edt_OrgPreset_kDb7', block: 10, bit: 24, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 161' },
    { key: 'manualAPresetII.db8', name: 'Edt_OrgPreset_kDb8', block: 10, bit: 28, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 162' },
    { key: 'manualAPresetII.db9', name: 'Edt_OrgPreset_kDb9', block: 10, bit: 32, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 163' },
    { key: 'manualAPresetII.vibratoEnable', name: 'Edt_OrgPreset_kVibratoEnable', block: 10, bit: 36, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 154' },
    { key: 'manualAPresetII.b3PercEnable', name: 'Edt_OrgPreset_kB3PercEnable', block: 10, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 164' },
    { key: 'manualAPresetII.b3PercHarmonic', name: 'Edt_OrgPreset_kB3PercHarmonic', block: 10, bit: 38, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 165' },
    { key: 'manualAPresetII.b3PercSpeed', name: 'Edt_OrgPreset_kB3PercSpeed', block: 10, bit: 39, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 166' },
    { key: 'manualAPresetII.b3PercLevel', name: 'Edt_OrgPreset_kB3PercLevel', block: 10, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 167' },
    { key: 'manualBPresetCommon.presetFocus', name: 'Edt_Org_kPresetFocus', block: 11, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 151' },
    { key: 'manualBPresetI.db1', name: 'Edt_OrgPreset_kDb1', block: 12, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 155' },
    { key: 'manualBPresetI.db2', name: 'Edt_OrgPreset_kDb2', block: 12, bit: 4, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 156' },
    { key: 'manualBPresetI.db3', name: 'Edt_OrgPreset_kDb3', block: 12, bit: 8, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 157' },
    { key: 'manualBPresetI.db4', name: 'Edt_OrgPreset_kDb4', block: 12, bit: 12, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 158' },
    { key: 'manualBPresetI.db5', name: 'Edt_OrgPreset_kDb5', block: 12, bit: 16, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 159' },
    { key: 'manualBPresetI.db6', name: 'Edt_OrgPreset_kDb6', block: 12, bit: 20, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 160' },
    { key: 'manualBPresetI.db7', name: 'Edt_OrgPreset_kDb7', block: 12, bit: 24, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 161' },
    { key: 'manualBPresetI.db8', name: 'Edt_OrgPreset_kDb8', block: 12, bit: 28, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 162' },
    { key: 'manualBPresetI.db9', name: 'Edt_OrgPreset_kDb9', block: 12, bit: 32, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 163' },
    { key: 'manualBPresetI.vibratoEnable', name: 'Edt_OrgPreset_kVibratoEnable', block: 12, bit: 36, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 154' },
    { key: 'manualBPresetI.b3PercEnable', name: 'Edt_OrgPreset_kB3PercEnable', block: 12, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 164' },
    { key: 'manualBPresetI.b3PercHarmonic', name: 'Edt_OrgPreset_kB3PercHarmonic', block: 12, bit: 38, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 165' },
    { key: 'manualBPresetI.b3PercSpeed', name: 'Edt_OrgPreset_kB3PercSpeed', block: 12, bit: 39, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 166' },
    { key: 'manualBPresetI.b3PercLevel', name: 'Edt_OrgPreset_kB3PercLevel', block: 12, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 167' },
    { key: 'manualBPresetII.db1', name: 'Edt_OrgPreset_kDb1', block: 13, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 155' },
    { key: 'manualBPresetII.db2', name: 'Edt_OrgPreset_kDb2', block: 13, bit: 4, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 156' },
    { key: 'manualBPresetII.db3', name: 'Edt_OrgPreset_kDb3', block: 13, bit: 8, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 157' },
    { key: 'manualBPresetII.db4', name: 'Edt_OrgPreset_kDb4', block: 13, bit: 12, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 158' },
    { key: 'manualBPresetII.db5', name: 'Edt_OrgPreset_kDb5', block: 13, bit: 16, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 159' },
    { key: 'manualBPresetII.db6', name: 'Edt_OrgPreset_kDb6', block: 13, bit: 20, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 160' },
    { key: 'manualBPresetII.db7', name: 'Edt_OrgPreset_kDb7', block: 13, bit: 24, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 161' },
    { key: 'manualBPresetII.db8', name: 'Edt_OrgPreset_kDb8', block: 13, bit: 28, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 162' },
    { key: 'manualBPresetII.db9', name: 'Edt_OrgPreset_kDb9', block: 13, bit: 32, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 163' },
    { key: 'manualBPresetII.vibratoEnable', name: 'Edt_OrgPreset_kVibratoEnable', block: 13, bit: 36, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 154' },
    { key: 'manualBPresetII.b3PercEnable', name: 'Edt_OrgPreset_kB3PercEnable', block: 13, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 164' },
    { key: 'manualBPresetII.b3PercHarmonic', name: 'Edt_OrgPreset_kB3PercHarmonic', block: 13, bit: 38, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 165' },
    { key: 'manualBPresetII.b3PercSpeed', name: 'Edt_OrgPreset_kB3PercSpeed', block: 13, bit: 39, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 166' },
    { key: 'manualBPresetII.b3PercLevel', name: 'Edt_OrgPreset_kB3PercLevel', block: 13, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Electro 6 OS 2.66 registry · id 167' },
  ],
};
