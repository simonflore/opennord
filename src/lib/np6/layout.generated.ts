// AUTO-GENERATED (piano-6) — DO NOT EDIT MANUALLY.
//
// Provenance: Piano 6 OS 1.20 registry; Piano 6 OS 1.20 program archive (version range in a RAM global, not recovered).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwLayout } from '../clavia/block-chain';

export type Np6FieldKey =
  | 'common.splitEnable'
  | 'common.splitPosition'
  | 'common.splitWidth'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.fxSectionFocus'
  | 'common.fxEnable'
  | 'common.effectsEqGlobal'
  | 'common.effectsDlyGlobal'
  | 'common.effectsCmpGlobal'
  | 'common.effectsRvbPerLayer'
  | 'common.effectsRvbEnable'
  | 'common.effectsRvbColor'
  | 'common.effectsRvbType'
  | 'common.effectsRvbPreDelay'
  | 'common.effectsRvbChorale'
  | 'pianoCommon.layerFocus'
  | 'pianoCommon.layerEnable'
  | 'pianoCommon.effectsSectionModePno'
  | 'pianoA.layerLevel'
  | 'pianoA.kbdZone'
  | 'pianoA.octaveShift'
  | 'pianoA.sustainPedalEnable'
  | 'pianoA.volumePedalEnable'
  | 'pianoA.bank'
  | 'pianoA.entry'
  | 'pianoA.variation'
  | 'pianoA.nameHash'
  | 'pianoA.acoustic'
  | 'pianoA.pedalNoise'
  | 'pianoA.kbdTouch'
  | 'pianoA.unison'
  | 'pianoA.dynComp'
  | 'pianoA.eq'
  | 'pianoB.layerLevel'
  | 'pianoB.kbdZone'
  | 'pianoB.octaveShift'
  | 'pianoB.sustainPedalEnable'
  | 'pianoB.volumePedalEnable'
  | 'pianoB.bank'
  | 'pianoB.entry'
  | 'pianoB.variation'
  | 'pianoB.nameHash'
  | 'pianoB.acoustic'
  | 'pianoB.pedalNoise'
  | 'pianoB.kbdTouch'
  | 'pianoB.unison'
  | 'pianoB.dynComp'
  | 'pianoB.eq'
  | 'pianoFxA.fx1Enable'
  | 'pianoFxA.fx1Rate'
  | 'pianoFxA.fx1Amt'
  | 'pianoFxA.fx1Type'
  | 'pianoFxA.fx1PedalEnable'
  | 'pianoFxA.fx2Enable'
  | 'pianoFxA.fx2Rate'
  | 'pianoFxA.fx2Amt'
  | 'pianoFxA.fx2Type'
  | 'pianoFxA.fx2Mono'
  | 'pianoFxA.eqEnable'
  | 'pianoFxA.eqTreble'
  | 'pianoFxA.eqMid'
  | 'pianoFxA.eqBass'
  | 'pianoFxA.eqMidFreq'
  | 'pianoFxA.dlyEnable'
  | 'pianoFxA.dlyRate'
  | 'pianoFxA.dlyMix'
  | 'pianoFxA.dlyPingPong'
  | 'pianoFxA.dlyFltType'
  | 'pianoFxA.dlyFeedback'
  | 'pianoFxA.dlyFlam'
  | 'pianoFxA.ampEnable'
  | 'pianoFxA.ampDrive'
  | 'pianoFxA.ampType'
  | 'pianoFxA.ampAltTone'
  | 'pianoFxA.cmpEnable'
  | 'pianoFxA.cmpAmt'
  | 'pianoFxA.rvbAmt'
  | 'pianoFxB.fx1Enable'
  | 'pianoFxB.fx1Rate'
  | 'pianoFxB.fx1Amt'
  | 'pianoFxB.fx1Type'
  | 'pianoFxB.fx1PedalEnable'
  | 'pianoFxB.fx2Enable'
  | 'pianoFxB.fx2Rate'
  | 'pianoFxB.fx2Amt'
  | 'pianoFxB.fx2Type'
  | 'pianoFxB.fx2Mono'
  | 'pianoFxB.eqEnable'
  | 'pianoFxB.eqTreble'
  | 'pianoFxB.eqMid'
  | 'pianoFxB.eqBass'
  | 'pianoFxB.eqMidFreq'
  | 'pianoFxB.dlyEnable'
  | 'pianoFxB.dlyRate'
  | 'pianoFxB.dlyMix'
  | 'pianoFxB.dlyPingPong'
  | 'pianoFxB.dlyFltType'
  | 'pianoFxB.dlyFeedback'
  | 'pianoFxB.dlyFlam'
  | 'pianoFxB.ampEnable'
  | 'pianoFxB.ampDrive'
  | 'pianoFxB.ampType'
  | 'pianoFxB.ampAltTone'
  | 'pianoFxB.cmpEnable'
  | 'pianoFxB.cmpAmt'
  | 'pianoFxB.rvbAmt'
  | 'synthCommon.layerFocus'
  | 'synthCommon.layerEnable'
  | 'synthCommon.effectsSectionModeSyn'
  | 'synthA.layerLevel'
  | 'synthA.smpId'
  | 'synthA.smpNameHash'
  | 'synthA.kbdZone'
  | 'synthA.octaveShift'
  | 'synthA.sustainPedalEnable'
  | 'synthA.volumePedalEnable'
  | 'synthA.vibratoButtonEnable'
  | 'synthA.vibMode'
  | 'synthA.voiceMode'
  | 'synthA.glideRate'
  | 'synthA.oscUnison'
  | 'synthA.ampEnvAtk'
  | 'synthA.ampEnvDecay'
  | 'synthA.ampEnvRelease'
  | 'synthA.dynamics'
  | 'synthA.vibRate'
  | 'synthA.vibAmt'
  | 'synthA.vibDly'
  | 'synthB.layerLevel'
  | 'synthB.smpId'
  | 'synthB.smpNameHash'
  | 'synthB.kbdZone'
  | 'synthB.octaveShift'
  | 'synthB.sustainPedalEnable'
  | 'synthB.volumePedalEnable'
  | 'synthB.vibratoButtonEnable'
  | 'synthB.vibMode'
  | 'synthB.voiceMode'
  | 'synthB.glideRate'
  | 'synthB.oscUnison'
  | 'synthB.ampEnvAtk'
  | 'synthB.ampEnvDecay'
  | 'synthB.ampEnvRelease'
  | 'synthB.dynamics'
  | 'synthB.vibRate'
  | 'synthB.vibAmt'
  | 'synthB.vibDly'
  | 'synthFxA.fx1Enable'
  | 'synthFxA.fx1Rate'
  | 'synthFxA.fx1Amt'
  | 'synthFxA.fx1Type'
  | 'synthFxA.fx1PedalEnable'
  | 'synthFxA.fx2Enable'
  | 'synthFxA.fx2Rate'
  | 'synthFxA.fx2Amt'
  | 'synthFxA.fx2Type'
  | 'synthFxA.fx2Mono'
  | 'synthFxA.eqEnable'
  | 'synthFxA.eqTreble'
  | 'synthFxA.eqMid'
  | 'synthFxA.eqBass'
  | 'synthFxA.eqMidFreq'
  | 'synthFxA.dlyEnable'
  | 'synthFxA.dlyRate'
  | 'synthFxA.dlyMix'
  | 'synthFxA.dlyPingPong'
  | 'synthFxA.dlyFltType'
  | 'synthFxA.dlyFeedback'
  | 'synthFxA.dlyFlam'
  | 'synthFxA.ampEnable'
  | 'synthFxA.ampDrive'
  | 'synthFxA.ampType'
  | 'synthFxA.ampAltTone'
  | 'synthFxA.cmpEnable'
  | 'synthFxA.cmpAmt'
  | 'synthFxA.rvbAmt'
  | 'synthFxB.fx1Enable'
  | 'synthFxB.fx1Rate'
  | 'synthFxB.fx1Amt'
  | 'synthFxB.fx1Type'
  | 'synthFxB.fx1PedalEnable'
  | 'synthFxB.fx2Enable'
  | 'synthFxB.fx2Rate'
  | 'synthFxB.fx2Amt'
  | 'synthFxB.fx2Type'
  | 'synthFxB.fx2Mono'
  | 'synthFxB.eqEnable'
  | 'synthFxB.eqTreble'
  | 'synthFxB.eqMid'
  | 'synthFxB.eqBass'
  | 'synthFxB.eqMidFreq'
  | 'synthFxB.dlyEnable'
  | 'synthFxB.dlyRate'
  | 'synthFxB.dlyMix'
  | 'synthFxB.dlyPingPong'
  | 'synthFxB.dlyFltType'
  | 'synthFxB.dlyFeedback'
  | 'synthFxB.dlyFlam'
  | 'synthFxB.ampEnable'
  | 'synthFxB.ampDrive'
  | 'synthFxB.ampType'
  | 'synthFxB.ampAltTone'
  | 'synthFxB.cmpEnable'
  | 'synthFxB.cmpAmt'
  | 'synthFxB.rvbAmt';

export const NP6_LAYOUT: FwLayout<Np6FieldKey> = {
  model: 'Nord Piano 6',
  source: 'Piano 6 OS 1.20 registry',
  container: 'Piano 6 OS 1.20 program archive (version range in a RAM global, not recovered)',
  versionRange: null,
  bodyBytes: 185,
  blocks: [
    { key: 'common', name: 'MultiCom', offset: 4, length: 10 },
    { key: 'pianoCommon', name: 'PnoCom', offset: 15, length: 5 },
    { key: 'pianoA', name: 'PnoA', offset: 21, length: 13 },
    { key: 'pianoB', name: 'PnoB', offset: 35, length: 13 },
    { key: 'pianoFxA', name: 'PnoFxA', offset: 49, length: 21 },
    { key: 'pianoFxB', name: 'PnoFxB', offset: 71, length: 21 },
    { key: 'synthCommon', name: 'SynCom', offset: 93, length: 5 },
    { key: 'synthA', name: 'SynA', offset: 99, length: 20 },
    { key: 'synthB', name: 'SynB', offset: 120, length: 20 },
    { key: 'synthFxA', name: 'SynFxA', offset: 141, length: 21 },
    { key: 'synthFxB', name: 'SynFxB', offset: 163, length: 21 },
  ],
  fields: [
    { key: 'common.splitEnable', name: 'Edt_Com_kSplitEnable', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 99' },
    { key: 'common.splitPosition', name: 'Edt_Com_kSplitPosition', block: 0, bit: 1, width: 4, min: 0, max: 8, def: 3, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 100' },
    { key: 'common.splitWidth', name: 'Edt_Com_kSplitWidth', block: 0, bit: 5, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 101' },
    { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 7, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 96' },
    { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 8, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 97' },
    { key: 'common.fxSectionFocus', name: 'Edt_Com_kFxSectionFocus_private', block: 0, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 93' },
    { key: 'common.fxEnable', name: 'Edt_Com_kFxEnable', block: 0, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 94' },
    { key: 'common.effectsEqGlobal', name: 'Edt_Com_kEffectsEqGlobal', block: 0, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 158' },
    { key: 'common.effectsDlyGlobal', name: 'Edt_Com_kEffectsDlyGlobal', block: 0, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 167' },
    { key: 'common.effectsCmpGlobal', name: 'Edt_Com_kEffectsCmpGlobal', block: 0, bit: 16, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 174' },
    { key: 'common.effectsRvbPerLayer', name: 'Edt_Com_kEffectsRvbPerLayer', block: 0, bit: 17, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 181' },
    { key: 'common.effectsRvbEnable', name: 'Edt_Com_kEffectsRvbEnable', block: 0, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 175' },
    { key: 'common.effectsRvbColor', name: 'Edt_Com_kEffectsRvbColor', block: 0, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 179' },
    { key: 'common.effectsRvbType', name: 'Edt_Com_kEffectsRvbType', block: 0, bit: 21, width: 3, min: 0, max: 5, def: 3, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 176' },
    { key: 'common.effectsRvbPreDelay', name: 'Edt_Com_kEffectsRvbPreDelay', block: 0, bit: 24, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 177' },
    { key: 'common.effectsRvbChorale', name: 'Edt_Com_kEffectsRvbChorale', block: 0, bit: 25, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 178' },
    { key: 'pianoCommon.layerFocus', name: 'Edt_PnoCom_kLayerFocus_private', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 89' },
    { key: 'pianoCommon.layerEnable', name: 'Edt_PnoCom_kLayerEnable_private', block: 1, bit: 1, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 90' },
    { key: 'pianoCommon.effectsSectionModePno', name: 'Edt_PnoCom_kEffectsSectionModePno_private', block: 1, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 141' },
    { key: 'pianoA.layerLevel', name: 'Edt_Pno_kLayerLevel', block: 2, bit: 0, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 125' },
    { key: 'pianoA.kbdZone', name: 'Edt_Pno_kKbdZone', block: 2, bit: 7, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 126' },
    { key: 'pianoA.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 2, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 127' },
    { key: 'pianoA.sustainPedalEnable', name: 'Edt_Pno_kSustainPedalEnable', block: 2, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 128' },
    { key: 'pianoA.volumePedalEnable', name: 'Edt_Pno_kVolumePedalEnable', block: 2, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 129' },
    { key: 'pianoA.bank', name: 'Edt_Pno_kBank', block: 2, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 131' },
    { key: 'pianoA.entry', name: 'Edt_Pno_kEntry', block: 2, bit: 18, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 132' },
    { key: 'pianoA.variation', name: 'Edt_Pno_kVariation', block: 2, bit: 23, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 133' },
    { key: 'pianoA.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 2, bit: 25, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 134' },
    { key: 'pianoA.acoustic', name: 'Edt_Pno_kAcoustic', block: 2, bit: 57, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 135' },
    { key: 'pianoA.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 2, bit: 59, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 136' },
    { key: 'pianoA.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 2, bit: 60, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 137' },
    { key: 'pianoA.unison', name: 'Edt_Pno_kUnison', block: 2, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 139' },
    { key: 'pianoA.dynComp', name: 'Edt_Pno_kDynComp', block: 2, bit: 64, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 140' },
    { key: 'pianoA.eq', name: 'Edt_Pno_kEq', block: 2, bit: 66, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 138' },
    { key: 'pianoB.layerLevel', name: 'Edt_Pno_kLayerLevel', block: 3, bit: 0, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 125' },
    { key: 'pianoB.kbdZone', name: 'Edt_Pno_kKbdZone', block: 3, bit: 7, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 126' },
    { key: 'pianoB.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 3, bit: 9, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 127' },
    { key: 'pianoB.sustainPedalEnable', name: 'Edt_Pno_kSustainPedalEnable', block: 3, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 128' },
    { key: 'pianoB.volumePedalEnable', name: 'Edt_Pno_kVolumePedalEnable', block: 3, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 129' },
    { key: 'pianoB.bank', name: 'Edt_Pno_kBank', block: 3, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 131' },
    { key: 'pianoB.entry', name: 'Edt_Pno_kEntry', block: 3, bit: 18, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 132' },
    { key: 'pianoB.variation', name: 'Edt_Pno_kVariation', block: 3, bit: 23, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 133' },
    { key: 'pianoB.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 3, bit: 25, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 134' },
    { key: 'pianoB.acoustic', name: 'Edt_Pno_kAcoustic', block: 3, bit: 57, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 135' },
    { key: 'pianoB.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 3, bit: 59, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 136' },
    { key: 'pianoB.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 3, bit: 60, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 137' },
    { key: 'pianoB.unison', name: 'Edt_Pno_kUnison', block: 3, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 139' },
    { key: 'pianoB.dynComp', name: 'Edt_Pno_kDynComp', block: 3, bit: 64, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 140' },
    { key: 'pianoB.eq', name: 'Edt_Pno_kEq', block: 3, bit: 66, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 138' },
    { key: 'pianoFxA.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 4, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 143' },
    { key: 'pianoFxA.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 4, bit: 1, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 144' },
    { key: 'pianoFxA.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 4, bit: 8, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 145' },
    { key: 'pianoFxA.fx1Type', name: 'Edt_Effects_kFx1Type', block: 4, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 146' },
    { key: 'pianoFxA.fx1PedalEnable', name: 'Edt_Effects_kFx1PedalEnable', block: 4, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 147' },
    { key: 'pianoFxA.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 4, bit: 19, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 148' },
    { key: 'pianoFxA.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 4, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 149' },
    { key: 'pianoFxA.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 4, bit: 27, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 150' },
    { key: 'pianoFxA.fx2Type', name: 'Edt_Effects_kFx2Type', block: 4, bit: 34, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 151' },
    { key: 'pianoFxA.fx2Mono', name: 'Edt_Effects_kFx2Mono', block: 4, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 152' },
    { key: 'pianoFxA.eqEnable', name: 'Edt_Effects_kEqEnable', block: 4, bit: 38, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 153' },
    { key: 'pianoFxA.eqTreble', name: 'Edt_Effects_kEqTreble', block: 4, bit: 39, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 154' },
    { key: 'pianoFxA.eqMid', name: 'Edt_Effects_kEqMid', block: 4, bit: 46, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 155' },
    { key: 'pianoFxA.eqBass', name: 'Edt_Effects_kEqBass', block: 4, bit: 53, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 156' },
    { key: 'pianoFxA.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 4, bit: 60, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 157' },
    { key: 'pianoFxA.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 4, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 159' },
    { key: 'pianoFxA.dlyRate', name: 'Edt_Effects_kDlyRate', block: 4, bit: 68, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 160' },
    { key: 'pianoFxA.dlyMix', name: 'Edt_Effects_kDlyMix', block: 4, bit: 82, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 161' },
    { key: 'pianoFxA.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 4, bit: 89, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 162' },
    { key: 'pianoFxA.dlyFltType', name: 'Edt_Effects_kDlyFltType', block: 4, bit: 91, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 163' },
    { key: 'pianoFxA.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 4, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 164' },
    { key: 'pianoFxA.dlyFlam', name: 'Edt_Effects_kDlyFlam', block: 4, bit: 100, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 165' },
    { key: 'pianoFxA.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 4, bit: 101, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 168' },
    { key: 'pianoFxA.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 4, bit: 102, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 169' },
    { key: 'pianoFxA.ampType', name: 'Edt_Effects_kAmpType', block: 4, bit: 109, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 170' },
    { key: 'pianoFxA.ampAltTone', name: 'Edt_Effects_kAmpAltTone', block: 4, bit: 112, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 171' },
    { key: 'pianoFxA.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 4, bit: 113, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 172' },
    { key: 'pianoFxA.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 4, bit: 114, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 173' },
    { key: 'pianoFxA.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 4, bit: 121, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 180' },
    { key: 'pianoFxB.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 5, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 143' },
    { key: 'pianoFxB.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 5, bit: 1, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 144' },
    { key: 'pianoFxB.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 5, bit: 8, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 145' },
    { key: 'pianoFxB.fx1Type', name: 'Edt_Effects_kFx1Type', block: 5, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 146' },
    { key: 'pianoFxB.fx1PedalEnable', name: 'Edt_Effects_kFx1PedalEnable', block: 5, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 147' },
    { key: 'pianoFxB.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 5, bit: 19, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 148' },
    { key: 'pianoFxB.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 5, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 149' },
    { key: 'pianoFxB.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 5, bit: 27, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 150' },
    { key: 'pianoFxB.fx2Type', name: 'Edt_Effects_kFx2Type', block: 5, bit: 34, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 151' },
    { key: 'pianoFxB.fx2Mono', name: 'Edt_Effects_kFx2Mono', block: 5, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 152' },
    { key: 'pianoFxB.eqEnable', name: 'Edt_Effects_kEqEnable', block: 5, bit: 38, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 153' },
    { key: 'pianoFxB.eqTreble', name: 'Edt_Effects_kEqTreble', block: 5, bit: 39, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 154' },
    { key: 'pianoFxB.eqMid', name: 'Edt_Effects_kEqMid', block: 5, bit: 46, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 155' },
    { key: 'pianoFxB.eqBass', name: 'Edt_Effects_kEqBass', block: 5, bit: 53, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 156' },
    { key: 'pianoFxB.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 5, bit: 60, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 157' },
    { key: 'pianoFxB.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 5, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 159' },
    { key: 'pianoFxB.dlyRate', name: 'Edt_Effects_kDlyRate', block: 5, bit: 68, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 160' },
    { key: 'pianoFxB.dlyMix', name: 'Edt_Effects_kDlyMix', block: 5, bit: 82, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 161' },
    { key: 'pianoFxB.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 5, bit: 89, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 162' },
    { key: 'pianoFxB.dlyFltType', name: 'Edt_Effects_kDlyFltType', block: 5, bit: 91, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 163' },
    { key: 'pianoFxB.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 5, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 164' },
    { key: 'pianoFxB.dlyFlam', name: 'Edt_Effects_kDlyFlam', block: 5, bit: 100, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 165' },
    { key: 'pianoFxB.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 5, bit: 101, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 168' },
    { key: 'pianoFxB.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 5, bit: 102, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 169' },
    { key: 'pianoFxB.ampType', name: 'Edt_Effects_kAmpType', block: 5, bit: 109, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 170' },
    { key: 'pianoFxB.ampAltTone', name: 'Edt_Effects_kAmpAltTone', block: 5, bit: 112, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 171' },
    { key: 'pianoFxB.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 5, bit: 113, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 172' },
    { key: 'pianoFxB.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 5, bit: 114, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 173' },
    { key: 'pianoFxB.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 5, bit: 121, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 180' },
    { key: 'synthCommon.layerFocus', name: 'Edt_SynCom_kLayerFocus_private', block: 6, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 91' },
    { key: 'synthCommon.layerEnable', name: 'Edt_SynCom_kLayerEnable_private', block: 6, bit: 1, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 92' },
    { key: 'synthCommon.effectsSectionModeSyn', name: 'Edt_SynCom_kEffectsSectionModeSyn_private', block: 6, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 142' },
    { key: 'synthA.layerLevel', name: 'Edt_Syn_kLayerLevel', block: 7, bit: 0, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 102' },
    { key: 'synthA.smpId', name: 'Edt_Syn_kSmpId', block: 7, bit: 7, width: 16, min: 0, max: 16383, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 122' },
    { key: 'synthA.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 7, bit: 23, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 124' },
    { key: 'synthA.kbdZone', name: 'Edt_Syn_kKbdZone', block: 7, bit: 55, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 103' },
    { key: 'synthA.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 7, bit: 57, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 104' },
    { key: 'synthA.sustainPedalEnable', name: 'Edt_Syn_kSustainPedalEnable', block: 7, bit: 61, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 105' },
    { key: 'synthA.volumePedalEnable', name: 'Edt_Syn_kVolumePedalEnable', block: 7, bit: 62, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 106' },
    { key: 'synthA.vibratoButtonEnable', name: 'Edt_Syn_kVibratoButtonEnable', block: 7, bit: 63, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 107' },
    { key: 'synthA.vibMode', name: 'Edt_Syn_kVibMode', block: 7, bit: 64, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 110' },
    { key: 'synthA.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 7, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 108' },
    { key: 'synthA.glideRate', name: 'Edt_Syn_kGlideRate', block: 7, bit: 70, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 109' },
    { key: 'synthA.oscUnison', name: 'Edt_Syn_kOscUnison', block: 7, bit: 72, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 115' },
    { key: 'synthA.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 7, bit: 74, width: 7, min: 0, max: 127, def: 10, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 117' },
    { key: 'synthA.ampEnvDecay', name: 'Edt_Syn_kAmpEnvDecay', block: 7, bit: 81, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 118' },
    { key: 'synthA.ampEnvRelease', name: 'Edt_Syn_kAmpEnvRelease', block: 7, bit: 88, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 119' },
    { key: 'synthA.dynamics', name: 'Edt_Syn_kDynamics', block: 7, bit: 95, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 121' },
    { key: 'synthA.vibRate', name: 'Edt_Syn_kVibRate', block: 7, bit: 97, width: 7, min: 0, max: 127, def: 74, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 111' },
    { key: 'synthA.vibAmt', name: 'Edt_Syn_kVibAmt', block: 7, bit: 104, width: 6, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 112' },
    { key: 'synthA.vibDly', name: 'Edt_Syn_kVibDly', block: 7, bit: 110, width: 7, min: 1, max: 30, def: 7, enc: 'offset', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 113' },
    { key: 'synthB.layerLevel', name: 'Edt_Syn_kLayerLevel', block: 8, bit: 0, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 102' },
    { key: 'synthB.smpId', name: 'Edt_Syn_kSmpId', block: 8, bit: 7, width: 16, min: 0, max: 16383, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 122' },
    { key: 'synthB.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 8, bit: 23, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 124' },
    { key: 'synthB.kbdZone', name: 'Edt_Syn_kKbdZone', block: 8, bit: 55, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 103' },
    { key: 'synthB.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 8, bit: 57, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 104' },
    { key: 'synthB.sustainPedalEnable', name: 'Edt_Syn_kSustainPedalEnable', block: 8, bit: 61, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 105' },
    { key: 'synthB.volumePedalEnable', name: 'Edt_Syn_kVolumePedalEnable', block: 8, bit: 62, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 106' },
    { key: 'synthB.vibratoButtonEnable', name: 'Edt_Syn_kVibratoButtonEnable', block: 8, bit: 63, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 107' },
    { key: 'synthB.vibMode', name: 'Edt_Syn_kVibMode', block: 8, bit: 64, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 110' },
    { key: 'synthB.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 8, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 108' },
    { key: 'synthB.glideRate', name: 'Edt_Syn_kGlideRate', block: 8, bit: 70, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 109' },
    { key: 'synthB.oscUnison', name: 'Edt_Syn_kOscUnison', block: 8, bit: 72, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 115' },
    { key: 'synthB.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 8, bit: 74, width: 7, min: 0, max: 127, def: 10, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 117' },
    { key: 'synthB.ampEnvDecay', name: 'Edt_Syn_kAmpEnvDecay', block: 8, bit: 81, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 118' },
    { key: 'synthB.ampEnvRelease', name: 'Edt_Syn_kAmpEnvRelease', block: 8, bit: 88, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 119' },
    { key: 'synthB.dynamics', name: 'Edt_Syn_kDynamics', block: 8, bit: 95, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 121' },
    { key: 'synthB.vibRate', name: 'Edt_Syn_kVibRate', block: 8, bit: 97, width: 7, min: 0, max: 127, def: 74, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 111' },
    { key: 'synthB.vibAmt', name: 'Edt_Syn_kVibAmt', block: 8, bit: 104, width: 6, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 112' },
    { key: 'synthB.vibDly', name: 'Edt_Syn_kVibDly', block: 8, bit: 110, width: 7, min: 1, max: 30, def: 7, enc: 'offset', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 113' },
    { key: 'synthFxA.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 9, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 143' },
    { key: 'synthFxA.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 9, bit: 1, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 144' },
    { key: 'synthFxA.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 9, bit: 8, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 145' },
    { key: 'synthFxA.fx1Type', name: 'Edt_Effects_kFx1Type', block: 9, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 146' },
    { key: 'synthFxA.fx1PedalEnable', name: 'Edt_Effects_kFx1PedalEnable', block: 9, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 147' },
    { key: 'synthFxA.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 9, bit: 19, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 148' },
    { key: 'synthFxA.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 9, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 149' },
    { key: 'synthFxA.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 9, bit: 27, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 150' },
    { key: 'synthFxA.fx2Type', name: 'Edt_Effects_kFx2Type', block: 9, bit: 34, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 151' },
    { key: 'synthFxA.fx2Mono', name: 'Edt_Effects_kFx2Mono', block: 9, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 152' },
    { key: 'synthFxA.eqEnable', name: 'Edt_Effects_kEqEnable', block: 9, bit: 38, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 153' },
    { key: 'synthFxA.eqTreble', name: 'Edt_Effects_kEqTreble', block: 9, bit: 39, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 154' },
    { key: 'synthFxA.eqMid', name: 'Edt_Effects_kEqMid', block: 9, bit: 46, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 155' },
    { key: 'synthFxA.eqBass', name: 'Edt_Effects_kEqBass', block: 9, bit: 53, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 156' },
    { key: 'synthFxA.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 9, bit: 60, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 157' },
    { key: 'synthFxA.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 9, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 159' },
    { key: 'synthFxA.dlyRate', name: 'Edt_Effects_kDlyRate', block: 9, bit: 68, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 160' },
    { key: 'synthFxA.dlyMix', name: 'Edt_Effects_kDlyMix', block: 9, bit: 82, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 161' },
    { key: 'synthFxA.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 9, bit: 89, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 162' },
    { key: 'synthFxA.dlyFltType', name: 'Edt_Effects_kDlyFltType', block: 9, bit: 91, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 163' },
    { key: 'synthFxA.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 9, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 164' },
    { key: 'synthFxA.dlyFlam', name: 'Edt_Effects_kDlyFlam', block: 9, bit: 100, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 165' },
    { key: 'synthFxA.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 9, bit: 101, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 168' },
    { key: 'synthFxA.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 9, bit: 102, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 169' },
    { key: 'synthFxA.ampType', name: 'Edt_Effects_kAmpType', block: 9, bit: 109, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 170' },
    { key: 'synthFxA.ampAltTone', name: 'Edt_Effects_kAmpAltTone', block: 9, bit: 112, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 171' },
    { key: 'synthFxA.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 9, bit: 113, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 172' },
    { key: 'synthFxA.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 9, bit: 114, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 173' },
    { key: 'synthFxA.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 9, bit: 121, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 180' },
    { key: 'synthFxB.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 10, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 143' },
    { key: 'synthFxB.fx1Rate', name: 'Edt_Effects_kFx1Rate', block: 10, bit: 1, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 144' },
    { key: 'synthFxB.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 10, bit: 8, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 145' },
    { key: 'synthFxB.fx1Type', name: 'Edt_Effects_kFx1Type', block: 10, bit: 15, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 146' },
    { key: 'synthFxB.fx1PedalEnable', name: 'Edt_Effects_kFx1PedalEnable', block: 10, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 147' },
    { key: 'synthFxB.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 10, bit: 19, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 148' },
    { key: 'synthFxB.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 10, bit: 20, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 149' },
    { key: 'synthFxB.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 10, bit: 27, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 150' },
    { key: 'synthFxB.fx2Type', name: 'Edt_Effects_kFx2Type', block: 10, bit: 34, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 151' },
    { key: 'synthFxB.fx2Mono', name: 'Edt_Effects_kFx2Mono', block: 10, bit: 37, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 152' },
    { key: 'synthFxB.eqEnable', name: 'Edt_Effects_kEqEnable', block: 10, bit: 38, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 153' },
    { key: 'synthFxB.eqTreble', name: 'Edt_Effects_kEqTreble', block: 10, bit: 39, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 154' },
    { key: 'synthFxB.eqMid', name: 'Edt_Effects_kEqMid', block: 10, bit: 46, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 155' },
    { key: 'synthFxB.eqBass', name: 'Edt_Effects_kEqBass', block: 10, bit: 53, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Piano 6 OS 1.20 registry · id 156' },
    { key: 'synthFxB.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 10, bit: 60, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 157' },
    { key: 'synthFxB.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 10, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 159' },
    { key: 'synthFxB.dlyRate', name: 'Edt_Effects_kDlyRate', block: 10, bit: 68, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 160' },
    { key: 'synthFxB.dlyMix', name: 'Edt_Effects_kDlyMix', block: 10, bit: 82, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 161' },
    { key: 'synthFxB.dlyPingPong', name: 'Edt_Effects_kDlyPingPong', block: 10, bit: 89, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 162' },
    { key: 'synthFxB.dlyFltType', name: 'Edt_Effects_kDlyFltType', block: 10, bit: 91, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 163' },
    { key: 'synthFxB.dlyFeedback', name: 'Edt_Effects_kDlyFeedback', block: 10, bit: 93, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 164' },
    { key: 'synthFxB.dlyFlam', name: 'Edt_Effects_kDlyFlam', block: 10, bit: 100, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 165' },
    { key: 'synthFxB.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 10, bit: 101, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 168' },
    { key: 'synthFxB.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 10, bit: 102, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 169' },
    { key: 'synthFxB.ampType', name: 'Edt_Effects_kAmpType', block: 10, bit: 109, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 170' },
    { key: 'synthFxB.ampAltTone', name: 'Edt_Effects_kAmpAltTone', block: 10, bit: 112, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 171' },
    { key: 'synthFxB.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 10, bit: 113, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 172' },
    { key: 'synthFxB.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 10, bit: 114, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 173' },
    { key: 'synthFxB.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 10, bit: 121, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Piano 6 OS 1.20 registry · id 180' },
  ],
};
