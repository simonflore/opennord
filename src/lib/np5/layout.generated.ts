// AUTO-GENERATED (piano-5) — DO NOT EDIT MANUALLY.
//
// Provenance: Piano 5 OS 1.34 registry; Piano 5 OS 1.34 program archive (1.00–1.01, medium).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwLayout } from '../clavia/block-chain';

export type Np5FieldKey =
  | 'common.slotPnoFocus'
  | 'common.slotSynFocus'
  | 'common.slotPnoEnable'
  | 'common.slotSynEnable'
  | 'common.splMode'
  | 'common.splPos'
  | 'common.splWidth'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.layerDetune'
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
  | 'effects.dlyFeedback'
  | 'effects.dlyPingPong'
  | 'effects.eqlEnable'
  | 'effects.eqlSrc'
  | 'effects.eqlTreble'
  | 'effects.eqlBass'
  | 'effects.eqlMidGain'
  | 'effects.eqlMidFreq'
  | 'effects.rvbEnable'
  | 'effects.rvbType'
  | 'effects.rvbColor'
  | 'effects.rvbAmt'
  | 'effects.rvbChorale'
  | 'effects.spkEnable'
  | 'effects.spkSrc'
  | 'effects.spkAmt'
  | 'effects.spkType'
  | 'pianoA.kbZone'
  | 'pianoA.level'
  | 'pianoA.octaveShift'
  | 'pianoA.timbre'
  | 'pianoA.bank'
  | 'pianoA.entry'
  | 'pianoA.variation'
  | 'pianoA.nameHash'
  | 'pianoA.sustainEnable'
  | 'pianoA.controlEnable'
  | 'pianoA.acoustic'
  | 'pianoA.kbdTouch'
  | 'pianoA.pedalNoise'
  | 'pianoA.dynComp'
  | 'pianoB.kbZone'
  | 'pianoB.level'
  | 'pianoB.octaveShift'
  | 'pianoB.timbre'
  | 'pianoB.bank'
  | 'pianoB.entry'
  | 'pianoB.variation'
  | 'pianoB.nameHash'
  | 'pianoB.sustainEnable'
  | 'pianoB.controlEnable'
  | 'pianoB.acoustic'
  | 'pianoB.kbdTouch'
  | 'pianoB.pedalNoise'
  | 'pianoB.dynComp'
  | 'synthA.kbZone'
  | 'synthA.level'
  | 'synthA.octaveShift'
  | 'synthA.sustainEnable'
  | 'synthA.controlEnable'
  | 'synthA.smpPos'
  | 'synthA.smpNameHash'
  | 'synthA.ampEnvAtc'
  | 'synthA.ampEnvDcyRls'
  | 'synthA.dynamics'
  | 'synthA.unison'
  | 'synthA.timbre'
  | 'synthA.vibratoModeEol'
  | 'synthA.vibratoRate'
  | 'synthA.vibratoAmt'
  | 'synthA.vibratoSrc'
  | 'synthA.vibratoDly'
  | 'synthA.voiceMode'
  | 'synthA.glideRate'
  | 'synthB.kbZone'
  | 'synthB.level'
  | 'synthB.octaveShift'
  | 'synthB.sustainEnable'
  | 'synthB.controlEnable'
  | 'synthB.smpPos'
  | 'synthB.smpNameHash'
  | 'synthB.ampEnvAtc'
  | 'synthB.ampEnvDcyRls'
  | 'synthB.dynamics'
  | 'synthB.unison'
  | 'synthB.timbre'
  | 'synthB.vibratoModeEol'
  | 'synthB.vibratoRate'
  | 'synthB.vibratoAmt'
  | 'synthB.vibratoSrc'
  | 'synthB.vibratoDly'
  | 'synthB.voiceMode'
  | 'synthB.glideRate';

export const NP5_LAYOUT: FwLayout<Np5FieldKey> = {
  model: 'Nord Piano 5',
  source: 'Piano 5 OS 1.34 registry',
  container: 'Piano 5 OS 1.34 program archive (1.00–1.01, medium)',
  versionRange: [100, 101],
  bodyBytes: 237,
  blocks: [
    { key: 'common', name: 'MultiCommon', offset: 4, length: 12 },
    { key: 'effects', name: 'Effects', offset: 17, length: 39 },
    { key: 'pianoA', name: 'PianoA', offset: 57, length: 31 },
    { key: 'pianoB', name: 'PianoB', offset: 89, length: 31 },
    { key: 'synthA', name: 'SynthA', offset: 121, length: 57 },
    { key: 'synthB', name: 'SynthB', offset: 179, length: 57 },
  ],
  fields: [
    { key: 'common.slotPnoFocus', name: 'Edt_Com_kSlotPnoFocus', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 90' },
    { key: 'common.slotSynFocus', name: 'Edt_Com_kSlotSynFocus', block: 0, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 91' },
    { key: 'common.slotPnoEnable', name: 'Edt_Com_kSlotPnoEnable', block: 0, bit: 2, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 92' },
    { key: 'common.slotSynEnable', name: 'Edt_Com_kSlotSynEnable', block: 0, bit: 4, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 93' },
    { key: 'common.splMode', name: 'Edt_Com_kSplMode', block: 0, bit: 6, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 97' },
    { key: 'common.splPos', name: 'Edt_Com_kSplPos', block: 0, bit: 9, width: 3, min: 0, max: 6, def: 3, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 98' },
    { key: 'common.splWidth', name: 'Edt_Com_kSplWidth', block: 0, bit: 12, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 99' },
    { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 94' },
    { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 15, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 95' },
    { key: 'common.layerDetune', name: 'Edt_Pno_kLayerDetune', block: 0, bit: 19, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 197' },
    { key: 'effects.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 200' },
    { key: 'effects.fx1Src', name: 'Edt_Effects_kFx1Src', block: 1, bit: 1, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 201' },
    { key: 'effects.fx1Type', name: 'Edt_Effects_kFx1Type', block: 1, bit: 4, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 202' },
    { key: 'effects.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 1, bit: 7, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 203' },
    { key: 'effects.fx1PedCtrl', name: 'Edt_Effects_kFx1PedCtrl', block: 1, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 204' },
    { key: 'effects.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 1, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 205' },
    { key: 'effects.fx2Src', name: 'Edt_Effects_kFx2Src', block: 1, bit: 16, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 206' },
    { key: 'effects.fx2Type', name: 'Edt_Effects_kFx2Type', block: 1, bit: 19, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 207' },
    { key: 'effects.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 1, bit: 22, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 208' },
    { key: 'effects.fx2Deep', name: 'Edt_Effects_kFx2Deep', block: 1, bit: 29, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 209' },
    { key: 'effects.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 1, bit: 30, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 210' },
    { key: 'effects.dlySrc', name: 'Edt_Effects_kDlySrc', block: 1, bit: 31, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 211' },
    { key: 'effects.dlyRate', name: 'Edt_Effects_kDlyRate', block: 1, bit: 34, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 212' },
    { key: 'effects.dlyMix', name: 'Edt_Effects_kDlyMix', block: 1, bit: 48, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 213' },
    { key: 'effects.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 1, bit: 55, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 214' },
    { key: 'effects.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 1, bit: 57, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 215' },
    { key: 'effects.eqlEnable', name: 'Edt_Effects_kEqlEnable', block: 1, bit: 58, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 216' },
    { key: 'effects.eqlSrc', name: 'Edt_Effects_kEqlSrc', block: 1, bit: 59, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 217' },
    { key: 'effects.eqlTreble', name: 'Edt_Effects_kEqlTreble', block: 1, bit: 62, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 218' },
    { key: 'effects.eqlBass', name: 'Edt_Effects_kEqlBass', block: 1, bit: 69, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 219' },
    { key: 'effects.eqlMidGain', name: 'Edt_Effects_kEqlMidGain', block: 1, bit: 76, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 220' },
    { key: 'effects.eqlMidFreq', name: 'Edt_Effects_kEqlMidFreq', block: 1, bit: 83, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 221' },
    { key: 'effects.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 1, bit: 90, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 222' },
    { key: 'effects.rvbType', name: 'Edt_Effects_kRvbType', block: 1, bit: 91, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 223' },
    { key: 'effects.rvbColor', name: 'Edt_Effects_kRvbColor', block: 1, bit: 94, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 224' },
    { key: 'effects.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 1, bit: 96, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 225' },
    { key: 'effects.rvbChorale', name: 'Edt_Effects_kRvbChorale', block: 1, bit: 103, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 226' },
    { key: 'effects.spkEnable', name: 'Edt_Effects_kSpkEnable', block: 1, bit: 104, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 227' },
    { key: 'effects.spkSrc', name: 'Edt_Effects_kSpkSrc', block: 1, bit: 105, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 228' },
    { key: 'effects.spkAmt', name: 'Edt_Effects_kSpkAmt', block: 1, bit: 108, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 230' },
    { key: 'effects.spkType', name: 'Edt_Effects_kSpkType', block: 1, bit: 115, width: 3, min: 0, max: 4, def: 3, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 229' },
    { key: 'pianoA.kbZone', name: 'Edt_Pno_kKbZone', block: 2, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 183' },
    { key: 'pianoA.level', name: 'Edt_Pno_kLevel', block: 2, bit: 2, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 184' },
    { key: 'pianoA.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 2, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 185' },
    { key: 'pianoA.timbre', name: 'Edt_Pno_kTimbre', block: 2, bit: 13, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 186' },
    { key: 'pianoA.bank', name: 'Edt_Pno_kBank', block: 2, bit: 16, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 188' },
    { key: 'pianoA.entry', name: 'Edt_Pno_kEntry', block: 2, bit: 19, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 189' },
    { key: 'pianoA.variation', name: 'Edt_Pno_kVariation', block: 2, bit: 24, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 190' },
    { key: 'pianoA.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 2, bit: 26, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 192' },
    { key: 'pianoA.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 2, bit: 58, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 193' },
    { key: 'pianoA.controlEnable', name: 'Edt_Pno_kControlEnable', block: 2, bit: 59, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 194' },
    { key: 'pianoA.acoustic', name: 'Edt_Pno_kAcoustic', block: 2, bit: 60, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 195' },
    { key: 'pianoA.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 2, bit: 62, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 196' },
    { key: 'pianoA.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 2, bit: 64, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 198' },
    { key: 'pianoA.dynComp', name: 'Edt_Pno_kDynComp_revB', block: 2, bit: 65, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 199' },
    { key: 'pianoB.kbZone', name: 'Edt_Pno_kKbZone', block: 3, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 183' },
    { key: 'pianoB.level', name: 'Edt_Pno_kLevel', block: 3, bit: 2, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 184' },
    { key: 'pianoB.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 3, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 185' },
    { key: 'pianoB.timbre', name: 'Edt_Pno_kTimbre', block: 3, bit: 13, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 186' },
    { key: 'pianoB.bank', name: 'Edt_Pno_kBank', block: 3, bit: 16, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 188' },
    { key: 'pianoB.entry', name: 'Edt_Pno_kEntry', block: 3, bit: 19, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 189' },
    { key: 'pianoB.variation', name: 'Edt_Pno_kVariation', block: 3, bit: 24, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 190' },
    { key: 'pianoB.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 3, bit: 26, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 192' },
    { key: 'pianoB.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 3, bit: 58, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 193' },
    { key: 'pianoB.controlEnable', name: 'Edt_Pno_kControlEnable', block: 3, bit: 59, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 194' },
    { key: 'pianoB.acoustic', name: 'Edt_Pno_kAcoustic', block: 3, bit: 60, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 195' },
    { key: 'pianoB.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 3, bit: 62, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 196' },
    { key: 'pianoB.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 3, bit: 64, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 198' },
    { key: 'pianoB.dynComp', name: 'Edt_Pno_kDynComp_revB', block: 3, bit: 65, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 199' },
    { key: 'synthA.kbZone', name: 'Edt_Syn_kKbZone', block: 4, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 100' },
    { key: 'synthA.level', name: 'Edt_Syn_kLevel', block: 4, bit: 2, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 101' },
    { key: 'synthA.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 4, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 102' },
    { key: 'synthA.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 4, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 103' },
    { key: 'synthA.controlEnable', name: 'Edt_Syn_kControlEnable', block: 4, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 104' },
    { key: 'synthA.smpPos', name: 'Edt_Syn_kSmpPos', block: 4, bit: 15, width: 16, min: 0, max: 2599, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 117' },
    { key: 'synthA.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 4, bit: 31, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 119' },
    { key: 'synthA.ampEnvAtc', name: 'Edt_Syn_kAmpEnvAtc', block: 4, bit: 63, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 106' },
    { key: 'synthA.ampEnvDcyRls', name: 'Edt_Syn_kAmpEnvDcyRls', block: 4, bit: 70, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 105' },
    { key: 'synthA.dynamics', name: 'Edt_Syn_kDynamics', block: 4, bit: 77, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 107' },
    { key: 'synthA.unison', name: 'Edt_Syn_kUnison', block: 4, bit: 79, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 108' },
    { key: 'synthA.timbre', name: 'Edt_Syn_kTimbre', block: 4, bit: 81, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 109' },
    { key: 'synthA.vibratoModeEol', name: 'Edt_Syn_kVibratoMode_EOL', block: 4, bit: 83, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 110' },
    { key: 'synthA.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 4, bit: 85, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 111' },
    { key: 'synthA.vibratoAmt', name: 'Edt_Syn_kVibratoAmt', block: 4, bit: 92, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 112' },
    { key: 'synthA.vibratoSrc', name: 'Edt_Syn_kVibratoSrc', block: 4, bit: 99, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 113' },
    { key: 'synthA.vibratoDly', name: 'Edt_Syn_kVibratoDly', block: 4, bit: 101, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 114' },
    { key: 'synthA.voiceMode', name: 'Edt_Syn_kVoiceMode_revB', block: 4, bit: 103, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 115' },
    { key: 'synthA.glideRate', name: 'Edt_Syn_kGlideRate_revB', block: 4, bit: 105, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 116' },
    { key: 'synthB.kbZone', name: 'Edt_Syn_kKbZone', block: 5, bit: 0, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 100' },
    { key: 'synthB.level', name: 'Edt_Syn_kLevel', block: 5, bit: 2, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 101' },
    { key: 'synthB.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 5, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 102' },
    { key: 'synthB.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 5, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 103' },
    { key: 'synthB.controlEnable', name: 'Edt_Syn_kControlEnable', block: 5, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 104' },
    { key: 'synthB.smpPos', name: 'Edt_Syn_kSmpPos', block: 5, bit: 15, width: 16, min: 0, max: 2599, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 117' },
    { key: 'synthB.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 5, bit: 31, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 119' },
    { key: 'synthB.ampEnvAtc', name: 'Edt_Syn_kAmpEnvAtc', block: 5, bit: 63, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 106' },
    { key: 'synthB.ampEnvDcyRls', name: 'Edt_Syn_kAmpEnvDcyRls', block: 5, bit: 70, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 105' },
    { key: 'synthB.dynamics', name: 'Edt_Syn_kDynamics', block: 5, bit: 77, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 107' },
    { key: 'synthB.unison', name: 'Edt_Syn_kUnison', block: 5, bit: 79, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 108' },
    { key: 'synthB.timbre', name: 'Edt_Syn_kTimbre', block: 5, bit: 81, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 109' },
    { key: 'synthB.vibratoModeEol', name: 'Edt_Syn_kVibratoMode_EOL', block: 5, bit: 83, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 110' },
    { key: 'synthB.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 5, bit: 85, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 111' },
    { key: 'synthB.vibratoAmt', name: 'Edt_Syn_kVibratoAmt', block: 5, bit: 92, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 112' },
    { key: 'synthB.vibratoSrc', name: 'Edt_Syn_kVibratoSrc', block: 5, bit: 99, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 113' },
    { key: 'synthB.vibratoDly', name: 'Edt_Syn_kVibratoDly', block: 5, bit: 101, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 114' },
    { key: 'synthB.voiceMode', name: 'Edt_Syn_kVoiceMode_revB', block: 5, bit: 103, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 115' },
    { key: 'synthB.glideRate', name: 'Edt_Syn_kGlideRate_revB', block: 5, bit: 105, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 5 OS 1.34 registry · id 116' },
  ],
};
