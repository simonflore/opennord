// AUTO-GENERATED (stage-4) — DO NOT EDIT MANUALLY.
//
// Provenance: Stage 4 OS 1.66 registry; Stage 4 OS 1.66 program archive (writes 3.13; 3.07–3.13 files carry the same 24 blocks).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwField, FwLayout } from '../clavia/block-chain';

export type Ns4FieldKey =
  | 'common.splitEnabled'
  | 'common.splitEnabledLow'
  | 'common.splitEnabledMid'
  | 'common.splitEnabledHigh'
  | 'common.splitPosLow'
  | 'common.splitPosMid'
  | 'common.splitPosHigh'
  | 'common.splitWidthLow'
  | 'common.splitWidthMid'
  | 'common.splitWidthHigh'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.masterClockRate'
  | 'common.masterClockKbdSync'
  | 'common.fxSectionFocus'
  | 'common.effectsCmpGlobal'
  | 'common.effectsDlyGlobal'
  | 'common.effectsRvbGlobal'
  | 'common.orgPresetPos'
  | 'common.orgPresetNameHash'
  | 'common.pnoPresetPos'
  | 'common.pnoPresetNameHashA'
  | 'common.pnoPresetNameHashB'
  | 'common.pnoPresetLayerCntA'
  | 'common.pnoPresetLayerCntB'
  | 'common.synPresetPos'
  | 'common.synPresetNameHashA'
  | 'common.synPresetNameHashB'
  | 'common.synPresetNameHashC'
  | 'common.synPresetLayerCntA'
  | 'common.synPresetLayerCntB'
  | 'common.synPresetLayerCntC'
  | 'common.sectionEnableOrg_I'
  | 'common.sectionEnablePno_I'
  | 'common.sectionEnableSyn_I'
  | 'common.sectionEnableOrg_II'
  | 'common.sectionEnablePno_II'
  | 'common.sectionEnableSyn_II'
  | 'common.layerScene'
  | 'common.auxKbdVelCurve'
  | 'common.auxKbdEnable'
  | 'common.audioRoutingBusOrg'
  | 'common.audioRoutingBusLeslie'
  | 'common.audioRoutingBusPnoA'
  | 'common.audioRoutingBusPnoB'
  | 'common.audioRoutingBusSynA'
  | 'common.audioRoutingBusSynB'
  | 'common.audioRoutingBusSynC'
  | 'common.fxEnable'
  | 'common.pdlTapEnable'
  | 'common.pdlLayerSceneEnable'
  | 'organ.layerFocusOrg_I'
  | 'organ.layerEnableOrg_I'
  | 'organ.layerFocusOrg_II'
  | 'organ.layerEnableOrg_II'
  | 'organ.layerLevelOrgA'
  | 'organ.layerLevelOrgA.morphWheel'
  | 'organ.layerLevelOrgA.morphAfterTouch'
  | 'organ.layerLevelOrgA.morphCtrlPedal'
  | 'organ.layerLevelOrgB'
  | 'organ.layerLevelOrgB.morphWheel'
  | 'organ.layerLevelOrgB.morphAfterTouch'
  | 'organ.layerLevelOrgB.morphCtrlPedal'
  | 'organ.orgPStickEnable'
  | 'organ.effectsLeslieEnable'
  | 'organ.effectsLeslieDrv'
  | 'organ.leslieRotorAngle'
  | 'organ.leslieHornAngle'
  | 'organ.auxKbdControl'
  | 'organ.leslieStopPreset'
  | 'organ.leslieMicDistance'
  | 'organ.polyPercEnable'
  | 'organ.effectsLeslieStopMode'
  | 'organ.effectsLeslieSpeed'
  | 'organ.effectsLeslieSpeed.morphWheel'
  | 'organ.effectsLeslieSpeed.morphAfterTouch'
  | 'organ.effectsLeslieSpeed.morphCtrlPedal'
  | 'organ.vibratoTypeB3'
  | 'organ.vibratoTypeVox'
  | 'organ.vibratoTypeFarfisa'
  | 'organA.kbZone'
  | 'organA.octaveShift'
  | 'organA.sustainEnable'
  | 'organA.model'
  | 'organA.presetEnable'
  | 'organADrawbars.org_Preset_kDb1'
  | 'organADrawbars.org_Preset_kDb1.morphWheel'
  | 'organADrawbars.org_Preset_kDb1.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb1.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb2'
  | 'organADrawbars.org_Preset_kDb2.morphWheel'
  | 'organADrawbars.org_Preset_kDb2.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb2.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb3'
  | 'organADrawbars.org_Preset_kDb3.morphWheel'
  | 'organADrawbars.org_Preset_kDb3.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb3.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb4'
  | 'organADrawbars.org_Preset_kDb4.morphWheel'
  | 'organADrawbars.org_Preset_kDb4.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb4.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb5'
  | 'organADrawbars.org_Preset_kDb5.morphWheel'
  | 'organADrawbars.org_Preset_kDb5.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb5.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb6'
  | 'organADrawbars.org_Preset_kDb6.morphWheel'
  | 'organADrawbars.org_Preset_kDb6.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb6.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb7'
  | 'organADrawbars.org_Preset_kDb7.morphWheel'
  | 'organADrawbars.org_Preset_kDb7.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb7.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb8'
  | 'organADrawbars.org_Preset_kDb8.morphWheel'
  | 'organADrawbars.org_Preset_kDb8.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb8.morphCtrlPedal'
  | 'organADrawbars.org_Preset_kDb9'
  | 'organADrawbars.org_Preset_kDb9.morphWheel'
  | 'organADrawbars.org_Preset_kDb9.morphAfterTouch'
  | 'organADrawbars.org_Preset_kDb9.morphCtrlPedal'
  | 'organAVibPerc.org_Preset_kVibratoEnable'
  | 'organAVibPerc.org_Preset_kB3PercEnable'
  | 'organAVibPerc.org_Preset_kB3PercHarmonic'
  | 'organAVibPerc.org_Preset_kB3PercSpeed'
  | 'organAVibPerc.org_Preset_kB3PercLevel'
  | 'organB.kbZone'
  | 'organB.octaveShift'
  | 'organB.sustainEnable'
  | 'organB.model'
  | 'organB.presetEnable'
  | 'organBDrawbars.org_Preset_kDb1'
  | 'organBDrawbars.org_Preset_kDb1.morphWheel'
  | 'organBDrawbars.org_Preset_kDb1.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb1.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb2'
  | 'organBDrawbars.org_Preset_kDb2.morphWheel'
  | 'organBDrawbars.org_Preset_kDb2.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb2.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb3'
  | 'organBDrawbars.org_Preset_kDb3.morphWheel'
  | 'organBDrawbars.org_Preset_kDb3.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb3.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb4'
  | 'organBDrawbars.org_Preset_kDb4.morphWheel'
  | 'organBDrawbars.org_Preset_kDb4.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb4.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb5'
  | 'organBDrawbars.org_Preset_kDb5.morphWheel'
  | 'organBDrawbars.org_Preset_kDb5.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb5.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb6'
  | 'organBDrawbars.org_Preset_kDb6.morphWheel'
  | 'organBDrawbars.org_Preset_kDb6.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb6.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb7'
  | 'organBDrawbars.org_Preset_kDb7.morphWheel'
  | 'organBDrawbars.org_Preset_kDb7.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb7.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb8'
  | 'organBDrawbars.org_Preset_kDb8.morphWheel'
  | 'organBDrawbars.org_Preset_kDb8.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb8.morphCtrlPedal'
  | 'organBDrawbars.org_Preset_kDb9'
  | 'organBDrawbars.org_Preset_kDb9.morphWheel'
  | 'organBDrawbars.org_Preset_kDb9.morphAfterTouch'
  | 'organBDrawbars.org_Preset_kDb9.morphCtrlPedal'
  | 'organBVibPerc.org_Preset_kVibratoEnable'
  | 'organBVibPerc.org_Preset_kB3PercEnable'
  | 'organBVibPerc.org_Preset_kB3PercHarmonic'
  | 'organBVibPerc.org_Preset_kB3PercSpeed'
  | 'organBVibPerc.org_Preset_kB3PercLevel'
  | 'organFx.fx1Enable'
  | 'organFx.fx1ClkEnable'
  | 'organFx.fx1RateClkDiv'
  | 'organFx.fx1RateClkDiv.morphWheel'
  | 'organFx.fx1RateClkDiv.morphAfterTouch'
  | 'organFx.fx1RateClkDiv.morphCtrlPedal'
  | 'organFx.fx1Amt'
  | 'organFx.fx1Amt.morphWheel'
  | 'organFx.fx1Amt.morphAfterTouch'
  | 'organFx.fx1Amt.morphCtrlPedal'
  | 'organFx.fx1Type'
  | 'organFx.fx2Enable'
  | 'organFx.fx2Rate'
  | 'organFx.fx2Rate.morphWheel'
  | 'organFx.fx2Rate.morphAfterTouch'
  | 'organFx.fx2Rate.morphCtrlPedal'
  | 'organFx.fx2Amt'
  | 'organFx.fx2Amt.morphWheel'
  | 'organFx.fx2Amt.morphAfterTouch'
  | 'organFx.fx2Amt.morphCtrlPedal'
  | 'organFx.fx2Type'
  | 'organFx.ampEnable'
  | 'organFx.ampTreble'
  | 'organFx.ampMid'
  | 'organFx.ampBass'
  | 'organFx.ampMidFreq'
  | 'organFx.ampMidFreq.morphWheel'
  | 'organFx.ampMidFreq.morphAfterTouch'
  | 'organFx.ampMidFreq.morphCtrlPedal'
  | 'organFx.ampDrive'
  | 'organFx.ampDrive.morphWheel'
  | 'organFx.ampDrive.morphAfterTouch'
  | 'organFx.ampDrive.morphCtrlPedal'
  | 'organFx.cmpEnable'
  | 'organFx.cmpAmt'
  | 'organFx.cmpResponse'
  | 'organFx.dlyEnable'
  | 'organFx.dlyClkEnable'
  | 'organFx.dlyRateClkDiv'
  | 'organFx.dlyRateClkDiv.morphWheel'
  | 'organFx.dlyRateClkDiv.morphAfterTouch'
  | 'organFx.dlyRateClkDiv.morphCtrlPedal'
  | 'organFx.dlyMix'
  | 'organFx.dlyMix.morphWheel'
  | 'organFx.dlyMix.morphAfterTouch'
  | 'organFx.dlyMix.morphCtrlPedal'
  | 'organFx.dlyMode'
  | 'organFx.dlyFbkPingPong'
  | 'organFx.dlyFbkFilt'
  | 'organFx.dlyFbkAmt'
  | 'organFx.dlyFbkAmt.morphWheel'
  | 'organFx.dlyFbkAmt.morphAfterTouch'
  | 'organFx.dlyFbkAmt.morphCtrlPedal'
  | 'organFx.dlyFbFxType'
  | 'organFx.rvbEnable'
  | 'organFx.rvbAmt'
  | 'organFx.rvbAmt.morphWheel'
  | 'organFx.rvbAmt.morphAfterTouch'
  | 'organFx.rvbAmt.morphCtrlPedal'
  | 'organFx.rvbColor'
  | 'organFx.rvbType'
  | 'organFx.ampTypeNew'
  | 'piano.layerFocusPno_I'
  | 'piano.layerEnablePno_I'
  | 'piano.layerFocusPno_II'
  | 'piano.layerEnablePno_II'
  | 'piano.layerLevelPnoA'
  | 'piano.layerLevelPnoA.morphWheel'
  | 'piano.layerLevelPnoA.morphAfterTouch'
  | 'piano.layerLevelPnoA.morphCtrlPedal'
  | 'piano.layerLevelPnoB'
  | 'piano.layerLevelPnoB.morphWheel'
  | 'piano.layerLevelPnoB.morphAfterTouch'
  | 'piano.layerLevelPnoB.morphCtrlPedal'
  | 'piano.auxKbdControl'
  | 'piano.effectsSectionModePno'
  | 'piano.fxLayerFocusPno'
  | 'pianoA.kbZone'
  | 'pianoA.octaveShift'
  | 'pianoA.pStickEnable'
  | 'pianoA.sustainEnable'
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
  | 'pianoB.kbZone'
  | 'pianoB.octaveShift'
  | 'pianoB.pStickEnable'
  | 'pianoB.sustainEnable'
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
  | 'pianoAFx.fx1Enable'
  | 'pianoAFx.fx1ClkEnable'
  | 'pianoAFx.fx1RateClkDiv'
  | 'pianoAFx.fx1RateClkDiv.morphWheel'
  | 'pianoAFx.fx1RateClkDiv.morphAfterTouch'
  | 'pianoAFx.fx1RateClkDiv.morphCtrlPedal'
  | 'pianoAFx.fx1Amt'
  | 'pianoAFx.fx1Amt.morphWheel'
  | 'pianoAFx.fx1Amt.morphAfterTouch'
  | 'pianoAFx.fx1Amt.morphCtrlPedal'
  | 'pianoAFx.fx1Type'
  | 'pianoAFx.fx2Enable'
  | 'pianoAFx.fx2Rate'
  | 'pianoAFx.fx2Rate.morphWheel'
  | 'pianoAFx.fx2Rate.morphAfterTouch'
  | 'pianoAFx.fx2Rate.morphCtrlPedal'
  | 'pianoAFx.fx2Amt'
  | 'pianoAFx.fx2Amt.morphWheel'
  | 'pianoAFx.fx2Amt.morphAfterTouch'
  | 'pianoAFx.fx2Amt.morphCtrlPedal'
  | 'pianoAFx.fx2Type'
  | 'pianoAFx.ampEnable'
  | 'pianoAFx.ampTreble'
  | 'pianoAFx.ampMid'
  | 'pianoAFx.ampBass'
  | 'pianoAFx.ampMidFreq'
  | 'pianoAFx.ampMidFreq.morphWheel'
  | 'pianoAFx.ampMidFreq.morphAfterTouch'
  | 'pianoAFx.ampMidFreq.morphCtrlPedal'
  | 'pianoAFx.ampDrive'
  | 'pianoAFx.ampDrive.morphWheel'
  | 'pianoAFx.ampDrive.morphAfterTouch'
  | 'pianoAFx.ampDrive.morphCtrlPedal'
  | 'pianoAFx.cmpEnable'
  | 'pianoAFx.cmpAmt'
  | 'pianoAFx.cmpResponse'
  | 'pianoAFx.dlyEnable'
  | 'pianoAFx.dlyClkEnable'
  | 'pianoAFx.dlyRateClkDiv'
  | 'pianoAFx.dlyRateClkDiv.morphWheel'
  | 'pianoAFx.dlyRateClkDiv.morphAfterTouch'
  | 'pianoAFx.dlyRateClkDiv.morphCtrlPedal'
  | 'pianoAFx.dlyMix'
  | 'pianoAFx.dlyMix.morphWheel'
  | 'pianoAFx.dlyMix.morphAfterTouch'
  | 'pianoAFx.dlyMix.morphCtrlPedal'
  | 'pianoAFx.dlyMode'
  | 'pianoAFx.dlyFbkPingPong'
  | 'pianoAFx.dlyFbkFilt'
  | 'pianoAFx.dlyFbkAmt'
  | 'pianoAFx.dlyFbkAmt.morphWheel'
  | 'pianoAFx.dlyFbkAmt.morphAfterTouch'
  | 'pianoAFx.dlyFbkAmt.morphCtrlPedal'
  | 'pianoAFx.dlyFbFxType'
  | 'pianoAFx.rvbEnable'
  | 'pianoAFx.rvbAmt'
  | 'pianoAFx.rvbAmt.morphWheel'
  | 'pianoAFx.rvbAmt.morphAfterTouch'
  | 'pianoAFx.rvbAmt.morphCtrlPedal'
  | 'pianoAFx.rvbColor'
  | 'pianoAFx.rvbType'
  | 'pianoAFx.ampTypeNew'
  | 'pianoBFx.fx1Enable'
  | 'pianoBFx.fx1ClkEnable'
  | 'pianoBFx.fx1RateClkDiv'
  | 'pianoBFx.fx1RateClkDiv.morphWheel'
  | 'pianoBFx.fx1RateClkDiv.morphAfterTouch'
  | 'pianoBFx.fx1RateClkDiv.morphCtrlPedal'
  | 'pianoBFx.fx1Amt'
  | 'pianoBFx.fx1Amt.morphWheel'
  | 'pianoBFx.fx1Amt.morphAfterTouch'
  | 'pianoBFx.fx1Amt.morphCtrlPedal'
  | 'pianoBFx.fx1Type'
  | 'pianoBFx.fx2Enable'
  | 'pianoBFx.fx2Rate'
  | 'pianoBFx.fx2Rate.morphWheel'
  | 'pianoBFx.fx2Rate.morphAfterTouch'
  | 'pianoBFx.fx2Rate.morphCtrlPedal'
  | 'pianoBFx.fx2Amt'
  | 'pianoBFx.fx2Amt.morphWheel'
  | 'pianoBFx.fx2Amt.morphAfterTouch'
  | 'pianoBFx.fx2Amt.morphCtrlPedal'
  | 'pianoBFx.fx2Type'
  | 'pianoBFx.ampEnable'
  | 'pianoBFx.ampTreble'
  | 'pianoBFx.ampMid'
  | 'pianoBFx.ampBass'
  | 'pianoBFx.ampMidFreq'
  | 'pianoBFx.ampMidFreq.morphWheel'
  | 'pianoBFx.ampMidFreq.morphAfterTouch'
  | 'pianoBFx.ampMidFreq.morphCtrlPedal'
  | 'pianoBFx.ampDrive'
  | 'pianoBFx.ampDrive.morphWheel'
  | 'pianoBFx.ampDrive.morphAfterTouch'
  | 'pianoBFx.ampDrive.morphCtrlPedal'
  | 'pianoBFx.cmpEnable'
  | 'pianoBFx.cmpAmt'
  | 'pianoBFx.cmpResponse'
  | 'pianoBFx.dlyEnable'
  | 'pianoBFx.dlyClkEnable'
  | 'pianoBFx.dlyRateClkDiv'
  | 'pianoBFx.dlyRateClkDiv.morphWheel'
  | 'pianoBFx.dlyRateClkDiv.morphAfterTouch'
  | 'pianoBFx.dlyRateClkDiv.morphCtrlPedal'
  | 'pianoBFx.dlyMix'
  | 'pianoBFx.dlyMix.morphWheel'
  | 'pianoBFx.dlyMix.morphAfterTouch'
  | 'pianoBFx.dlyMix.morphCtrlPedal'
  | 'pianoBFx.dlyMode'
  | 'pianoBFx.dlyFbkPingPong'
  | 'pianoBFx.dlyFbkFilt'
  | 'pianoBFx.dlyFbkAmt'
  | 'pianoBFx.dlyFbkAmt.morphWheel'
  | 'pianoBFx.dlyFbkAmt.morphAfterTouch'
  | 'pianoBFx.dlyFbkAmt.morphCtrlPedal'
  | 'pianoBFx.dlyFbFxType'
  | 'pianoBFx.rvbEnable'
  | 'pianoBFx.rvbAmt'
  | 'pianoBFx.rvbAmt.morphWheel'
  | 'pianoBFx.rvbAmt.morphAfterTouch'
  | 'pianoBFx.rvbAmt.morphCtrlPedal'
  | 'pianoBFx.rvbColor'
  | 'pianoBFx.rvbType'
  | 'pianoBFx.ampTypeNew'
  | 'synth.layerFocusSyn_I'
  | 'synth.layerEnableSyn_I'
  | 'synth.layerFocusSyn_II'
  | 'synth.layerEnableSyn_II'
  | 'synth.layerLevelSynA'
  | 'synth.layerLevelSynA.morphWheel'
  | 'synth.layerLevelSynA.morphAfterTouch'
  | 'synth.layerLevelSynA.morphCtrlPedal'
  | 'synth.layerLevelSynB'
  | 'synth.layerLevelSynB.morphWheel'
  | 'synth.layerLevelSynB.morphAfterTouch'
  | 'synth.layerLevelSynB.morphCtrlPedal'
  | 'synth.layerLevelSynC'
  | 'synth.layerLevelSynC.morphWheel'
  | 'synth.layerLevelSynC.morphAfterTouch'
  | 'synth.layerLevelSynC.morphCtrlPedal'
  | 'synth.layerPanSynA'
  | 'synth.reserved_was_pan_a_morph'
  | 'synth.layerPanSynB'
  | 'synth.reserved_was_pan_b_morph'
  | 'synth.layerPanSynC'
  | 'synth.reserved_was_pan_c_morph'
  | 'synth.multiLayerFlt'
  | 'synth.multiLayerArp'
  | 'synth.multiLayerLFO'
  | 'synth.kbdHoldEnableCommon'
  | 'synth.auxKbdControl'
  | 'synth.effectsSectionModeSyn'
  | 'synth.fxLayerFocusSyn'
  | 'synthA.mode'
  | 'synthA.libName'
  | 'synthA.smpId'
  | 'synthA.smpNameHash'
  | 'synthA.kbZone'
  | 'synthA.octaveShift'
  | 'synthA.pStickEnable'
  | 'synthA.pitchStickRange'
  | 'synthA.sustainEnable'
  | 'synthA.vibMode'
  | 'synthA.voiceMode'
  | 'synthA.voicePrio'
  | 'synthA.glideRate'
  | 'synthA.externEnable'
  | 'synthA.externVelCurve'
  | 'synthA.externModWheelEnable'
  | 'synthA.externAftertouchEnable'
  | 'synthA.externCtrlPedalEnable'
  | 'synthA.externSwellPedalEnable'
  | 'synthA.externCCNumber1'
  | 'synthA.externSendOnLoad'
  | 'synthA.externBCValue_LSB'
  | 'synthA.externBCValue_MSB'
  | 'synthA.externPCValue'
  | 'synthA.externVolPedalEnable'
  | 'synthA.externCCNumber2'
  | 'synthA.kbdHoldEnableLayer'
  | 'synthA.arpRun'
  | 'synthA.arpMode'
  | 'synthA.arpPtnEnable'
  | 'synthA.arpKbdSync'
  | 'synthA.arpRange'
  | 'synthA.arpRange.morphWheel'
  | 'synthA.arpRange.morphAfterTouch'
  | 'synthA.arpRange.morphCtrlPedal'
  | 'synthA.arpDir'
  | 'synthA.arpZigZag'
  | 'synthA.arpClkEnable'
  | 'synthA.arpRateClkDiv'
  | 'synthA.arpRateClkDiv.morphWheel'
  | 'synthA.arpRateClkDiv.morphAfterTouch'
  | 'synthA.arpRateClkDiv.morphCtrlPedal'
  | 'synthA.arpPtnLen'
  | 'synthA.arpPtnAcc'
  | 'synthA.arpPtnDur'
  | 'synthA.arpPtnPan'
  | 'synthA.oscUnison'
  | 'synthA.externCCValue1'
  | 'synthA.externCCValue1.morphWheel'
  | 'synthA.externCCValue1.morphAfterTouch'
  | 'synthA.externCCValue1.morphCtrlPedal'
  | 'synthA.externCCValue2'
  | 'synthA.externCCValue2.morphWheel'
  | 'synthA.externCCValue2.morphAfterTouch'
  | 'synthA.externCCValue2.morphCtrlPedal'
  | 'synthA.vibDly'
  | 'synthB.mode'
  | 'synthB.libName'
  | 'synthB.smpId'
  | 'synthB.smpNameHash'
  | 'synthB.kbZone'
  | 'synthB.octaveShift'
  | 'synthB.pStickEnable'
  | 'synthB.pitchStickRange'
  | 'synthB.sustainEnable'
  | 'synthB.vibMode'
  | 'synthB.voiceMode'
  | 'synthB.voicePrio'
  | 'synthB.glideRate'
  | 'synthB.externEnable'
  | 'synthB.externVelCurve'
  | 'synthB.externModWheelEnable'
  | 'synthB.externAftertouchEnable'
  | 'synthB.externCtrlPedalEnable'
  | 'synthB.externSwellPedalEnable'
  | 'synthB.externCCNumber1'
  | 'synthB.externSendOnLoad'
  | 'synthB.externBCValue_LSB'
  | 'synthB.externBCValue_MSB'
  | 'synthB.externPCValue'
  | 'synthB.externVolPedalEnable'
  | 'synthB.externCCNumber2'
  | 'synthB.kbdHoldEnableLayer'
  | 'synthB.arpRun'
  | 'synthB.arpMode'
  | 'synthB.arpPtnEnable'
  | 'synthB.arpKbdSync'
  | 'synthB.arpRange'
  | 'synthB.arpRange.morphWheel'
  | 'synthB.arpRange.morphAfterTouch'
  | 'synthB.arpRange.morphCtrlPedal'
  | 'synthB.arpDir'
  | 'synthB.arpZigZag'
  | 'synthB.arpClkEnable'
  | 'synthB.arpRateClkDiv'
  | 'synthB.arpRateClkDiv.morphWheel'
  | 'synthB.arpRateClkDiv.morphAfterTouch'
  | 'synthB.arpRateClkDiv.morphCtrlPedal'
  | 'synthB.arpPtnLen'
  | 'synthB.arpPtnAcc'
  | 'synthB.arpPtnDur'
  | 'synthB.arpPtnPan'
  | 'synthB.oscUnison'
  | 'synthB.externCCValue1'
  | 'synthB.externCCValue1.morphWheel'
  | 'synthB.externCCValue1.morphAfterTouch'
  | 'synthB.externCCValue1.morphCtrlPedal'
  | 'synthB.externCCValue2'
  | 'synthB.externCCValue2.morphWheel'
  | 'synthB.externCCValue2.morphAfterTouch'
  | 'synthB.externCCValue2.morphCtrlPedal'
  | 'synthB.vibDly'
  | 'synthC.mode'
  | 'synthC.libName'
  | 'synthC.smpId'
  | 'synthC.smpNameHash'
  | 'synthC.kbZone'
  | 'synthC.octaveShift'
  | 'synthC.pStickEnable'
  | 'synthC.pitchStickRange'
  | 'synthC.sustainEnable'
  | 'synthC.vibMode'
  | 'synthC.voiceMode'
  | 'synthC.voicePrio'
  | 'synthC.glideRate'
  | 'synthC.externEnable'
  | 'synthC.externVelCurve'
  | 'synthC.externModWheelEnable'
  | 'synthC.externAftertouchEnable'
  | 'synthC.externCtrlPedalEnable'
  | 'synthC.externSwellPedalEnable'
  | 'synthC.externCCNumber1'
  | 'synthC.externSendOnLoad'
  | 'synthC.externBCValue_LSB'
  | 'synthC.externBCValue_MSB'
  | 'synthC.externPCValue'
  | 'synthC.externVolPedalEnable'
  | 'synthC.externCCNumber2'
  | 'synthC.kbdHoldEnableLayer'
  | 'synthC.arpRun'
  | 'synthC.arpMode'
  | 'synthC.arpPtnEnable'
  | 'synthC.arpKbdSync'
  | 'synthC.arpRange'
  | 'synthC.arpRange.morphWheel'
  | 'synthC.arpRange.morphAfterTouch'
  | 'synthC.arpRange.morphCtrlPedal'
  | 'synthC.arpDir'
  | 'synthC.arpZigZag'
  | 'synthC.arpClkEnable'
  | 'synthC.arpRateClkDiv'
  | 'synthC.arpRateClkDiv.morphWheel'
  | 'synthC.arpRateClkDiv.morphAfterTouch'
  | 'synthC.arpRateClkDiv.morphCtrlPedal'
  | 'synthC.arpPtnLen'
  | 'synthC.arpPtnAcc'
  | 'synthC.arpPtnDur'
  | 'synthC.arpPtnPan'
  | 'synthC.oscUnison'
  | 'synthC.externCCValue1'
  | 'synthC.externCCValue1.morphWheel'
  | 'synthC.externCCValue1.morphAfterTouch'
  | 'synthC.externCCValue1.morphCtrlPedal'
  | 'synthC.externCCValue2'
  | 'synthC.externCCValue2.morphWheel'
  | 'synthC.externCCValue2.morphAfterTouch'
  | 'synthC.externCCValue2.morphCtrlPedal'
  | 'synthC.vibDly'
  | 'synthASound.oscBank'
  | 'synthASound.oscCat'
  | 'synthASound.oscWave'
  | 'synthASound.oscCtrl'
  | 'synthASound.oscCtrl.morphWheel'
  | 'synthASound.oscCtrl.morphAfterTouch'
  | 'synthASound.oscCtrl.morphCtrlPedal'
  | 'synthASound.oscTuneFine'
  | 'synthASound.oscTuneCoarse'
  | 'synthASound.oscEnvAtk'
  | 'synthASound.oscEnvDcy'
  | 'synthASound.oscEnvRls'
  | 'synthASound.oscEnvAmt'
  | 'synthASound.oscEnvAmt.morphWheel'
  | 'synthASound.oscEnvAmt.morphAfterTouch'
  | 'synthASound.oscEnvAmt.morphCtrlPedal'
  | 'synthASound.oscEnvDst'
  | 'synthASound.oscEnvVel'
  | 'synthASound.smpDynamic'
  | 'synthASound.lfoDst'
  | 'synthASound.lfoWave'
  | 'synthASound.lfoClkEnable'
  | 'synthASound.lfoRateClkDiv'
  | 'synthASound.lfoRateClkDiv.morphWheel'
  | 'synthASound.lfoRateClkDiv.morphAfterTouch'
  | 'synthASound.lfoRateClkDiv.morphCtrlPedal'
  | 'synthASound.lfoAmt'
  | 'synthASound.lfoAmt.morphWheel'
  | 'synthASound.lfoAmt.morphAfterTouch'
  | 'synthASound.lfoAmt.morphCtrlPedal'
  | 'synthASound.ampEnvAtk'
  | 'synthASound.ampEnvDcy'
  | 'synthASound.ampEnvRls'
  | 'synthASound.ampEnvVel'
  | 'synthASound.fltType'
  | 'synthASound.fltFreq'
  | 'synthASound.fltFreq.morphWheel'
  | 'synthASound.fltFreq.morphAfterTouch'
  | 'synthASound.fltFreq.morphCtrlPedal'
  | 'synthASound.fltRes'
  | 'synthASound.fltRes.morphWheel'
  | 'synthASound.fltRes.morphAfterTouch'
  | 'synthASound.fltRes.morphCtrlPedal'
  | 'synthASound.fltKbdTrk'
  | 'synthASound.fltDrive'
  | 'synthASound.fltEnvAmt'
  | 'synthASound.fltEnvAmt.morphWheel'
  | 'synthASound.fltEnvAmt.morphAfterTouch'
  | 'synthASound.fltEnvAmt.morphCtrlPedal'
  | 'synthASound.fltEnvAtk'
  | 'synthASound.fltEnvDcy'
  | 'synthASound.fltEnvRls'
  | 'synthASound.fltEnvVel'
  | 'synthASound.fltEnable'
  | 'synthASound.vibRate'
  | 'synthASound.vibAmt'
  | 'synthASound.smpTimbre'
  | 'synthBSound.oscBank'
  | 'synthBSound.oscCat'
  | 'synthBSound.oscWave'
  | 'synthBSound.oscCtrl'
  | 'synthBSound.oscCtrl.morphWheel'
  | 'synthBSound.oscCtrl.morphAfterTouch'
  | 'synthBSound.oscCtrl.morphCtrlPedal'
  | 'synthBSound.oscTuneFine'
  | 'synthBSound.oscTuneCoarse'
  | 'synthBSound.oscEnvAtk'
  | 'synthBSound.oscEnvDcy'
  | 'synthBSound.oscEnvRls'
  | 'synthBSound.oscEnvAmt'
  | 'synthBSound.oscEnvAmt.morphWheel'
  | 'synthBSound.oscEnvAmt.morphAfterTouch'
  | 'synthBSound.oscEnvAmt.morphCtrlPedal'
  | 'synthBSound.oscEnvDst'
  | 'synthBSound.oscEnvVel'
  | 'synthBSound.smpDynamic'
  | 'synthBSound.lfoDst'
  | 'synthBSound.lfoWave'
  | 'synthBSound.lfoClkEnable'
  | 'synthBSound.lfoRateClkDiv'
  | 'synthBSound.lfoRateClkDiv.morphWheel'
  | 'synthBSound.lfoRateClkDiv.morphAfterTouch'
  | 'synthBSound.lfoRateClkDiv.morphCtrlPedal'
  | 'synthBSound.lfoAmt'
  | 'synthBSound.lfoAmt.morphWheel'
  | 'synthBSound.lfoAmt.morphAfterTouch'
  | 'synthBSound.lfoAmt.morphCtrlPedal'
  | 'synthBSound.ampEnvAtk'
  | 'synthBSound.ampEnvDcy'
  | 'synthBSound.ampEnvRls'
  | 'synthBSound.ampEnvVel'
  | 'synthBSound.fltType'
  | 'synthBSound.fltFreq'
  | 'synthBSound.fltFreq.morphWheel'
  | 'synthBSound.fltFreq.morphAfterTouch'
  | 'synthBSound.fltFreq.morphCtrlPedal'
  | 'synthBSound.fltRes'
  | 'synthBSound.fltRes.morphWheel'
  | 'synthBSound.fltRes.morphAfterTouch'
  | 'synthBSound.fltRes.morphCtrlPedal'
  | 'synthBSound.fltKbdTrk'
  | 'synthBSound.fltDrive'
  | 'synthBSound.fltEnvAmt'
  | 'synthBSound.fltEnvAmt.morphWheel'
  | 'synthBSound.fltEnvAmt.morphAfterTouch'
  | 'synthBSound.fltEnvAmt.morphCtrlPedal'
  | 'synthBSound.fltEnvAtk'
  | 'synthBSound.fltEnvDcy'
  | 'synthBSound.fltEnvRls'
  | 'synthBSound.fltEnvVel'
  | 'synthBSound.fltEnable'
  | 'synthBSound.vibRate'
  | 'synthBSound.vibAmt'
  | 'synthBSound.smpTimbre'
  | 'synthCSound.oscBank'
  | 'synthCSound.oscCat'
  | 'synthCSound.oscWave'
  | 'synthCSound.oscCtrl'
  | 'synthCSound.oscCtrl.morphWheel'
  | 'synthCSound.oscCtrl.morphAfterTouch'
  | 'synthCSound.oscCtrl.morphCtrlPedal'
  | 'synthCSound.oscTuneFine'
  | 'synthCSound.oscTuneCoarse'
  | 'synthCSound.oscEnvAtk'
  | 'synthCSound.oscEnvDcy'
  | 'synthCSound.oscEnvRls'
  | 'synthCSound.oscEnvAmt'
  | 'synthCSound.oscEnvAmt.morphWheel'
  | 'synthCSound.oscEnvAmt.morphAfterTouch'
  | 'synthCSound.oscEnvAmt.morphCtrlPedal'
  | 'synthCSound.oscEnvDst'
  | 'synthCSound.oscEnvVel'
  | 'synthCSound.smpDynamic'
  | 'synthCSound.lfoDst'
  | 'synthCSound.lfoWave'
  | 'synthCSound.lfoClkEnable'
  | 'synthCSound.lfoRateClkDiv'
  | 'synthCSound.lfoRateClkDiv.morphWheel'
  | 'synthCSound.lfoRateClkDiv.morphAfterTouch'
  | 'synthCSound.lfoRateClkDiv.morphCtrlPedal'
  | 'synthCSound.lfoAmt'
  | 'synthCSound.lfoAmt.morphWheel'
  | 'synthCSound.lfoAmt.morphAfterTouch'
  | 'synthCSound.lfoAmt.morphCtrlPedal'
  | 'synthCSound.ampEnvAtk'
  | 'synthCSound.ampEnvDcy'
  | 'synthCSound.ampEnvRls'
  | 'synthCSound.ampEnvVel'
  | 'synthCSound.fltType'
  | 'synthCSound.fltFreq'
  | 'synthCSound.fltFreq.morphWheel'
  | 'synthCSound.fltFreq.morphAfterTouch'
  | 'synthCSound.fltFreq.morphCtrlPedal'
  | 'synthCSound.fltRes'
  | 'synthCSound.fltRes.morphWheel'
  | 'synthCSound.fltRes.morphAfterTouch'
  | 'synthCSound.fltRes.morphCtrlPedal'
  | 'synthCSound.fltKbdTrk'
  | 'synthCSound.fltDrive'
  | 'synthCSound.fltEnvAmt'
  | 'synthCSound.fltEnvAmt.morphWheel'
  | 'synthCSound.fltEnvAmt.morphAfterTouch'
  | 'synthCSound.fltEnvAmt.morphCtrlPedal'
  | 'synthCSound.fltEnvAtk'
  | 'synthCSound.fltEnvDcy'
  | 'synthCSound.fltEnvRls'
  | 'synthCSound.fltEnvVel'
  | 'synthCSound.fltEnable'
  | 'synthCSound.vibRate'
  | 'synthCSound.vibAmt'
  | 'synthCSound.smpTimbre'
  | 'synthAFx.fx1Enable'
  | 'synthAFx.fx1ClkEnable'
  | 'synthAFx.fx1RateClkDiv'
  | 'synthAFx.fx1RateClkDiv.morphWheel'
  | 'synthAFx.fx1RateClkDiv.morphAfterTouch'
  | 'synthAFx.fx1RateClkDiv.morphCtrlPedal'
  | 'synthAFx.fx1Amt'
  | 'synthAFx.fx1Amt.morphWheel'
  | 'synthAFx.fx1Amt.morphAfterTouch'
  | 'synthAFx.fx1Amt.morphCtrlPedal'
  | 'synthAFx.fx1Type'
  | 'synthAFx.fx2Enable'
  | 'synthAFx.fx2Rate'
  | 'synthAFx.fx2Rate.morphWheel'
  | 'synthAFx.fx2Rate.morphAfterTouch'
  | 'synthAFx.fx2Rate.morphCtrlPedal'
  | 'synthAFx.fx2Amt'
  | 'synthAFx.fx2Amt.morphWheel'
  | 'synthAFx.fx2Amt.morphAfterTouch'
  | 'synthAFx.fx2Amt.morphCtrlPedal'
  | 'synthAFx.fx2Type'
  | 'synthAFx.ampEnable'
  | 'synthAFx.ampTreble'
  | 'synthAFx.ampMid'
  | 'synthAFx.ampBass'
  | 'synthAFx.ampMidFreq'
  | 'synthAFx.ampMidFreq.morphWheel'
  | 'synthAFx.ampMidFreq.morphAfterTouch'
  | 'synthAFx.ampMidFreq.morphCtrlPedal'
  | 'synthAFx.ampDrive'
  | 'synthAFx.ampDrive.morphWheel'
  | 'synthAFx.ampDrive.morphAfterTouch'
  | 'synthAFx.ampDrive.morphCtrlPedal'
  | 'synthAFx.cmpEnable'
  | 'synthAFx.cmpAmt'
  | 'synthAFx.cmpResponse'
  | 'synthAFx.dlyEnable'
  | 'synthAFx.dlyClkEnable'
  | 'synthAFx.dlyRateClkDiv'
  | 'synthAFx.dlyRateClkDiv.morphWheel'
  | 'synthAFx.dlyRateClkDiv.morphAfterTouch'
  | 'synthAFx.dlyRateClkDiv.morphCtrlPedal'
  | 'synthAFx.dlyMix'
  | 'synthAFx.dlyMix.morphWheel'
  | 'synthAFx.dlyMix.morphAfterTouch'
  | 'synthAFx.dlyMix.morphCtrlPedal'
  | 'synthAFx.dlyMode'
  | 'synthAFx.dlyFbkPingPong'
  | 'synthAFx.dlyFbkFilt'
  | 'synthAFx.dlyFbkAmt'
  | 'synthAFx.dlyFbkAmt.morphWheel'
  | 'synthAFx.dlyFbkAmt.morphAfterTouch'
  | 'synthAFx.dlyFbkAmt.morphCtrlPedal'
  | 'synthAFx.dlyFbFxType'
  | 'synthAFx.rvbEnable'
  | 'synthAFx.rvbAmt'
  | 'synthAFx.rvbAmt.morphWheel'
  | 'synthAFx.rvbAmt.morphAfterTouch'
  | 'synthAFx.rvbAmt.morphCtrlPedal'
  | 'synthAFx.rvbColor'
  | 'synthAFx.rvbType'
  | 'synthAFx.ampTypeNew'
  | 'synthBFx.fx1Enable'
  | 'synthBFx.fx1ClkEnable'
  | 'synthBFx.fx1RateClkDiv'
  | 'synthBFx.fx1RateClkDiv.morphWheel'
  | 'synthBFx.fx1RateClkDiv.morphAfterTouch'
  | 'synthBFx.fx1RateClkDiv.morphCtrlPedal'
  | 'synthBFx.fx1Amt'
  | 'synthBFx.fx1Amt.morphWheel'
  | 'synthBFx.fx1Amt.morphAfterTouch'
  | 'synthBFx.fx1Amt.morphCtrlPedal'
  | 'synthBFx.fx1Type'
  | 'synthBFx.fx2Enable'
  | 'synthBFx.fx2Rate'
  | 'synthBFx.fx2Rate.morphWheel'
  | 'synthBFx.fx2Rate.morphAfterTouch'
  | 'synthBFx.fx2Rate.morphCtrlPedal'
  | 'synthBFx.fx2Amt'
  | 'synthBFx.fx2Amt.morphWheel'
  | 'synthBFx.fx2Amt.morphAfterTouch'
  | 'synthBFx.fx2Amt.morphCtrlPedal'
  | 'synthBFx.fx2Type'
  | 'synthBFx.ampEnable'
  | 'synthBFx.ampTreble'
  | 'synthBFx.ampMid'
  | 'synthBFx.ampBass'
  | 'synthBFx.ampMidFreq'
  | 'synthBFx.ampMidFreq.morphWheel'
  | 'synthBFx.ampMidFreq.morphAfterTouch'
  | 'synthBFx.ampMidFreq.morphCtrlPedal'
  | 'synthBFx.ampDrive'
  | 'synthBFx.ampDrive.morphWheel'
  | 'synthBFx.ampDrive.morphAfterTouch'
  | 'synthBFx.ampDrive.morphCtrlPedal'
  | 'synthBFx.cmpEnable'
  | 'synthBFx.cmpAmt'
  | 'synthBFx.cmpResponse'
  | 'synthBFx.dlyEnable'
  | 'synthBFx.dlyClkEnable'
  | 'synthBFx.dlyRateClkDiv'
  | 'synthBFx.dlyRateClkDiv.morphWheel'
  | 'synthBFx.dlyRateClkDiv.morphAfterTouch'
  | 'synthBFx.dlyRateClkDiv.morphCtrlPedal'
  | 'synthBFx.dlyMix'
  | 'synthBFx.dlyMix.morphWheel'
  | 'synthBFx.dlyMix.morphAfterTouch'
  | 'synthBFx.dlyMix.morphCtrlPedal'
  | 'synthBFx.dlyMode'
  | 'synthBFx.dlyFbkPingPong'
  | 'synthBFx.dlyFbkFilt'
  | 'synthBFx.dlyFbkAmt'
  | 'synthBFx.dlyFbkAmt.morphWheel'
  | 'synthBFx.dlyFbkAmt.morphAfterTouch'
  | 'synthBFx.dlyFbkAmt.morphCtrlPedal'
  | 'synthBFx.dlyFbFxType'
  | 'synthBFx.rvbEnable'
  | 'synthBFx.rvbAmt'
  | 'synthBFx.rvbAmt.morphWheel'
  | 'synthBFx.rvbAmt.morphAfterTouch'
  | 'synthBFx.rvbAmt.morphCtrlPedal'
  | 'synthBFx.rvbColor'
  | 'synthBFx.rvbType'
  | 'synthBFx.ampTypeNew'
  | 'synthCFx.fx1Enable'
  | 'synthCFx.fx1ClkEnable'
  | 'synthCFx.fx1RateClkDiv'
  | 'synthCFx.fx1RateClkDiv.morphWheel'
  | 'synthCFx.fx1RateClkDiv.morphAfterTouch'
  | 'synthCFx.fx1RateClkDiv.morphCtrlPedal'
  | 'synthCFx.fx1Amt'
  | 'synthCFx.fx1Amt.morphWheel'
  | 'synthCFx.fx1Amt.morphAfterTouch'
  | 'synthCFx.fx1Amt.morphCtrlPedal'
  | 'synthCFx.fx1Type'
  | 'synthCFx.fx2Enable'
  | 'synthCFx.fx2Rate'
  | 'synthCFx.fx2Rate.morphWheel'
  | 'synthCFx.fx2Rate.morphAfterTouch'
  | 'synthCFx.fx2Rate.morphCtrlPedal'
  | 'synthCFx.fx2Amt'
  | 'synthCFx.fx2Amt.morphWheel'
  | 'synthCFx.fx2Amt.morphAfterTouch'
  | 'synthCFx.fx2Amt.morphCtrlPedal'
  | 'synthCFx.fx2Type'
  | 'synthCFx.ampEnable'
  | 'synthCFx.ampTreble'
  | 'synthCFx.ampMid'
  | 'synthCFx.ampBass'
  | 'synthCFx.ampMidFreq'
  | 'synthCFx.ampMidFreq.morphWheel'
  | 'synthCFx.ampMidFreq.morphAfterTouch'
  | 'synthCFx.ampMidFreq.morphCtrlPedal'
  | 'synthCFx.ampDrive'
  | 'synthCFx.ampDrive.morphWheel'
  | 'synthCFx.ampDrive.morphAfterTouch'
  | 'synthCFx.ampDrive.morphCtrlPedal'
  | 'synthCFx.cmpEnable'
  | 'synthCFx.cmpAmt'
  | 'synthCFx.cmpResponse'
  | 'synthCFx.dlyEnable'
  | 'synthCFx.dlyClkEnable'
  | 'synthCFx.dlyRateClkDiv'
  | 'synthCFx.dlyRateClkDiv.morphWheel'
  | 'synthCFx.dlyRateClkDiv.morphAfterTouch'
  | 'synthCFx.dlyRateClkDiv.morphCtrlPedal'
  | 'synthCFx.dlyMix'
  | 'synthCFx.dlyMix.morphWheel'
  | 'synthCFx.dlyMix.morphAfterTouch'
  | 'synthCFx.dlyMix.morphCtrlPedal'
  | 'synthCFx.dlyMode'
  | 'synthCFx.dlyFbkPingPong'
  | 'synthCFx.dlyFbkFilt'
  | 'synthCFx.dlyFbkAmt'
  | 'synthCFx.dlyFbkAmt.morphWheel'
  | 'synthCFx.dlyFbkAmt.morphAfterTouch'
  | 'synthCFx.dlyFbkAmt.morphCtrlPedal'
  | 'synthCFx.dlyFbFxType'
  | 'synthCFx.rvbEnable'
  | 'synthCFx.rvbAmt'
  | 'synthCFx.rvbAmt.morphWheel'
  | 'synthCFx.rvbAmt.morphAfterTouch'
  | 'synthCFx.rvbAmt.morphCtrlPedal'
  | 'synthCFx.rvbColor'
  | 'synthCFx.rvbType'
  | 'synthCFx.ampTypeNew';

/** Fields 0–499 (see the generator's TS2590 note). */
const FIELDS_0: readonly FwField<Ns4FieldKey>[] = [
  { key: 'common.splitEnabled', name: 'Edt_Com_kSplitEnabled', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 231' },
  { key: 'common.splitEnabledLow', name: 'Edt_Com_kSplitEnabledLow', block: 0, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 232' },
  { key: 'common.splitEnabledMid', name: 'Edt_Com_kSplitEnabledMid', block: 0, bit: 2, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 233' },
  { key: 'common.splitEnabledHigh', name: 'Edt_Com_kSplitEnabledHigh', block: 0, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 234' },
  { key: 'common.splitPosLow', name: 'Edt_Com_kSplitPosLow', block: 0, bit: 4, width: 4, min: 0, max: 10, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 235' },
  { key: 'common.splitPosMid', name: 'Edt_Com_kSplitPosMid', block: 0, bit: 8, width: 4, min: 0, max: 10, def: 4, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 236' },
  { key: 'common.splitPosHigh', name: 'Edt_Com_kSplitPosHigh', block: 0, bit: 12, width: 4, min: 0, max: 10, def: 7, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 237' },
  { key: 'common.splitWidthLow', name: 'Edt_Com_kSplitWidthLow', block: 0, bit: 16, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 238' },
  { key: 'common.splitWidthMid', name: 'Edt_Com_kSplitWidthMid', block: 0, bit: 18, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 239' },
  { key: 'common.splitWidthHigh', name: 'Edt_Com_kSplitWidthHigh', block: 0, bit: 20, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 240' },
  { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 22, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 216' },
  { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 23, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 217' },
  { key: 'common.masterClockRate', name: 'Edt_Com_kMasterClockRate', block: 0, bit: 27, width: 8, min: 30, max: 240, def: 120, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 218' },
  { key: 'common.masterClockKbdSync', name: 'Edt_Com_kMasterClockKbdSync', block: 0, bit: 35, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 151' },
  { key: 'common.fxSectionFocus', name: 'Edt_Com_kFxSectionFocus_private', block: 0, bit: 37, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 208' },
  { key: 'common.effectsCmpGlobal', name: 'Edt_Com_kEffectsCmpGlobal', block: 0, bit: 39, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 425' },
  { key: 'common.effectsDlyGlobal', name: 'Edt_Com_kEffectsDlyGlobal', block: 0, bit: 40, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 429' },
  { key: 'common.effectsRvbGlobal', name: 'Edt_Com_kEffectsRvbGlobal', block: 0, bit: 41, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 441' },
  { key: 'common.orgPresetPos', name: 'Edt_Com_kOrgPresetPos', block: 0, bit: 42, width: 10, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 193' },
  { key: 'common.orgPresetNameHash', name: 'Edt_Com_kOrgPresetNameHash', block: 0, bit: 52, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 195' },
  { key: 'common.pnoPresetPos', name: 'Edt_Com_kPnoPresetPos', block: 0, bit: 84, width: 10, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 197' },
  { key: 'common.pnoPresetNameHashA', name: 'Edt_Com_kPnoPresetNameHashA', block: 0, bit: 94, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 199' },
  { key: 'common.pnoPresetNameHashB', name: 'Edt_Com_kPnoPresetNameHashB', block: 0, bit: 126, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 200' },
  { key: 'common.pnoPresetLayerCntA', name: 'Edt_Com_kPnoPresetLayerCntA', block: 0, bit: 158, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 202' },
  { key: 'common.pnoPresetLayerCntB', name: 'Edt_Com_kPnoPresetLayerCntB', block: 0, bit: 160, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 203' },
  { key: 'common.synPresetPos', name: 'Edt_Com_kSynPresetPos', block: 0, bit: 162, width: 10, min: 0, max: 511, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 317' },
  { key: 'common.synPresetNameHashA', name: 'Edt_Com_kSynPresetNameHashA', block: 0, bit: 172, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 320' },
  { key: 'common.synPresetNameHashB', name: 'Edt_Com_kSynPresetNameHashB', block: 0, bit: 204, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 321' },
  { key: 'common.synPresetNameHashC', name: 'Edt_Com_kSynPresetNameHashC', block: 0, bit: 236, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 322' },
  { key: 'common.synPresetLayerCntA', name: 'Edt_Com_kSynPresetLayerCntA', block: 0, bit: 268, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 324' },
  { key: 'common.synPresetLayerCntB', name: 'Edt_Com_kSynPresetLayerCntB', block: 0, bit: 270, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 325' },
  { key: 'common.synPresetLayerCntC', name: 'Edt_Com_kSynPresetLayerCntC', block: 0, bit: 272, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 326' },
  { key: 'common.sectionEnableOrg_I', name: 'Edt_Com_kSectionEnableOrg_I_private', block: 0, bit: 276, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 154' },
  { key: 'common.sectionEnablePno_I', name: 'Edt_Com_kSectionEnablePno_I_private', block: 0, bit: 277, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 155' },
  { key: 'common.sectionEnableSyn_I', name: 'Edt_Com_kSectionEnableSyn_I_private', block: 0, bit: 278, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 156' },
  { key: 'common.sectionEnableOrg_II', name: 'Edt_Com_kSectionEnableOrg_II_private', block: 0, bit: 279, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 157' },
  { key: 'common.sectionEnablePno_II', name: 'Edt_Com_kSectionEnablePno_II_private', block: 0, bit: 280, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 158' },
  { key: 'common.sectionEnableSyn_II', name: 'Edt_Com_kSectionEnableSyn_II_private', block: 0, bit: 281, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 159' },
  { key: 'common.layerScene', name: 'Edt_Com_kLayerScene_private', block: 0, bit: 282, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 242' },
  { key: 'common.auxKbdVelCurve', name: 'Edt_Com_kAuxKbdVelCurve', block: 0, bit: 283, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 229' },
  { key: 'common.auxKbdEnable', name: 'Edt_Com_kAuxKbdEnable', block: 0, bit: 285, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 227' },
  { key: 'common.audioRoutingBusOrg', name: 'Edt_Com_kAudioRoutingBusOrg', block: 0, bit: 286, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 88' },
  { key: 'common.audioRoutingBusLeslie', name: 'Edt_Com_kAudioRoutingBusLeslie', block: 0, bit: 288, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 89' },
  { key: 'common.audioRoutingBusPnoA', name: 'Edt_Com_kAudioRoutingBusPnoA', block: 0, bit: 291, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 90' },
  { key: 'common.audioRoutingBusPnoB', name: 'Edt_Com_kAudioRoutingBusPnoB', block: 0, bit: 293, width: 3, min: 0, max: 4, def: 4, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 91' },
  { key: 'common.audioRoutingBusSynA', name: 'Edt_Com_kAudioRoutingBusSynA', block: 0, bit: 296, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 92' },
  { key: 'common.audioRoutingBusSynB', name: 'Edt_Com_kAudioRoutingBusSynB', block: 0, bit: 298, width: 3, min: 0, max: 4, def: 4, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 93' },
  { key: 'common.audioRoutingBusSynC', name: 'Edt_Com_kAudioRoutingBusSynC', block: 0, bit: 301, width: 3, min: 0, max: 4, def: 4, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 94' },
  { key: 'common.fxEnable', name: 'Edt_Com_kFxEnable', block: 0, bit: 307, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 209' },
  { key: 'common.pdlTapEnable', name: 'Edt_Com_kPdlTapEnable', block: 0, bit: 308, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 214' },
  { key: 'common.pdlLayerSceneEnable', name: 'Edt_Com_kPdlLayerSceneEnable', block: 0, bit: 309, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 215' },
  { key: 'organ.layerFocusOrg_I', name: 'Edt_OrgCom_kLayerFocusOrg_I_private', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 173' },
  { key: 'organ.layerEnableOrg_I', name: 'Edt_OrgCom_kLayerEnableOrg_I_private', block: 1, bit: 1, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 174' },
  { key: 'organ.layerFocusOrg_II', name: 'Edt_OrgCom_kLayerFocusOrg_II_private', block: 1, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 175' },
  { key: 'organ.layerEnableOrg_II', name: 'Edt_OrgCom_kLayerEnableOrg_II_private', block: 1, bit: 4, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 176' },
  { key: 'organ.layerLevelOrgA', name: 'Edt_OrgCom_kLayerLevelOrgA', block: 1, bit: 6, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 177' },
  { key: 'organ.layerLevelOrgA.morphWheel', name: 'Edt_OrgCom_kLayerLevelOrgA@Wheel', block: 1, bit: 13, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 177 · Wheel morph' },
  { key: 'organ.layerLevelOrgA.morphAfterTouch', name: 'Edt_OrgCom_kLayerLevelOrgA@AfterTouch', block: 1, bit: 21, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 177 · AfterTouch morph' },
  { key: 'organ.layerLevelOrgA.morphCtrlPedal', name: 'Edt_OrgCom_kLayerLevelOrgA@CtrlPedal', block: 1, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 177 · CtrlPedal morph' },
  { key: 'organ.layerLevelOrgB', name: 'Edt_OrgCom_kLayerLevelOrgB', block: 1, bit: 37, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 178' },
  { key: 'organ.layerLevelOrgB.morphWheel', name: 'Edt_OrgCom_kLayerLevelOrgB@Wheel', block: 1, bit: 44, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 178 · Wheel morph' },
  { key: 'organ.layerLevelOrgB.morphAfterTouch', name: 'Edt_OrgCom_kLayerLevelOrgB@AfterTouch', block: 1, bit: 52, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 178 · AfterTouch morph' },
  { key: 'organ.layerLevelOrgB.morphCtrlPedal', name: 'Edt_OrgCom_kLayerLevelOrgB@CtrlPedal', block: 1, bit: 60, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 178 · CtrlPedal morph' },
  { key: 'organ.orgPStickEnable', name: 'Edt_OrgCom_kOrgPStickEnable', block: 1, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 355' },
  { key: 'organ.effectsLeslieEnable', name: 'Edt_OrgCom_kEffectsLeslieEnable', block: 1, bit: 72, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 393' },
  { key: 'organ.effectsLeslieDrv', name: 'Edt_OrgCom_kEffectsLeslieDrv', block: 1, bit: 84, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 394' },
  { key: 'organ.leslieRotorAngle', name: 'Edt_OrgCom_kLeslieRotorAngle', block: 1, bit: 91, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 221' },
  { key: 'organ.leslieHornAngle', name: 'Edt_OrgCom_kLeslieHornAngle', block: 1, bit: 98, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 222' },
  { key: 'organ.auxKbdControl', name: 'Edt_OrgCom_kAuxKbdControl', block: 1, bit: 105, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 357' },
  { key: 'organ.leslieStopPreset', name: 'Edt_OrgCom_kLeslieStopPreset', block: 1, bit: 107, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 223' },
  { key: 'organ.leslieMicDistance', name: 'Edt_OrgCom_kLeslieMicDistance_revB', block: 1, bit: 111, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 224' },
  { key: 'organ.polyPercEnable', name: 'Edt_OrgCom_kPolyPercEnable_revB', block: 1, bit: 112, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 225' },
  { key: 'organ.effectsLeslieStopMode', name: 'Edt_OrgCom_kEffectsLeslieStopMode', block: 1, bit: 114, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 396' },
  { key: 'organ.effectsLeslieSpeed', name: 'Edt_OrgCom_kEffectsLeslieSpeed', block: 1, bit: 115, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 397' },
  { key: 'organ.effectsLeslieSpeed.morphWheel', name: 'Edt_OrgCom_kEffectsLeslieSpeed@Wheel', block: 1, bit: 116, width: 2, min: -1, max: 1, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 397 · Wheel morph' },
  { key: 'organ.effectsLeslieSpeed.morphAfterTouch', name: 'Edt_OrgCom_kEffectsLeslieSpeed@AfterTouch', block: 1, bit: 118, width: 2, min: -1, max: 1, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 397 · AfterTouch morph' },
  { key: 'organ.effectsLeslieSpeed.morphCtrlPedal', name: 'Edt_OrgCom_kEffectsLeslieSpeed@CtrlPedal', block: 1, bit: 120, width: 2, min: -1, max: 1, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 397 · CtrlPedal morph' },
  { key: 'organ.vibratoTypeB3', name: 'Edt_OrgCom_kVibratoTypeB3', block: 1, bit: 122, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 360' },
  { key: 'organ.vibratoTypeVox', name: 'Edt_OrgCom_kVibratoTypeVox', block: 1, bit: 125, width: 2, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 361' },
  { key: 'organ.vibratoTypeFarfisa', name: 'Edt_OrgCom_kVibratoTypeFarfisa', block: 1, bit: 127, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 362' },
  { key: 'organA.kbZone', name: 'Edt_Org_kKbZone', block: 2, bit: 0, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 353' },
  { key: 'organA.octaveShift', name: 'Edt_Org_kOctaveShift', block: 2, bit: 4, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 354' },
  { key: 'organA.sustainEnable', name: 'Edt_Org_kSustainEnable', block: 2, bit: 8, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 356' },
  { key: 'organA.model', name: 'Edt_Org_kModel', block: 2, bit: 9, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 358' },
  { key: 'organA.presetEnable', name: 'Edt_Org_kPresetEnable', block: 2, bit: 12, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 352' },
  { key: 'organADrawbars.org_Preset_kDb1', name: 'Edt_Org_Preset_kDb1', block: 3, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365' },
  { key: 'organADrawbars.org_Preset_kDb1.morphWheel', name: 'Edt_Org_Preset_kDb1@Wheel', block: 3, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb1.morphAfterTouch', name: 'Edt_Org_Preset_kDb1@AfterTouch', block: 3, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb1.morphCtrlPedal', name: 'Edt_Org_Preset_kDb1@CtrlPedal', block: 3, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb2', name: 'Edt_Org_Preset_kDb2', block: 3, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366' },
  { key: 'organADrawbars.org_Preset_kDb2.morphWheel', name: 'Edt_Org_Preset_kDb2@Wheel', block: 3, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb2.morphAfterTouch', name: 'Edt_Org_Preset_kDb2@AfterTouch', block: 3, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb2.morphCtrlPedal', name: 'Edt_Org_Preset_kDb2@CtrlPedal', block: 3, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb3', name: 'Edt_Org_Preset_kDb3', block: 3, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367' },
  { key: 'organADrawbars.org_Preset_kDb3.morphWheel', name: 'Edt_Org_Preset_kDb3@Wheel', block: 3, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb3.morphAfterTouch', name: 'Edt_Org_Preset_kDb3@AfterTouch', block: 3, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb3.morphCtrlPedal', name: 'Edt_Org_Preset_kDb3@CtrlPedal', block: 3, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb4', name: 'Edt_Org_Preset_kDb4', block: 3, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368' },
  { key: 'organADrawbars.org_Preset_kDb4.morphWheel', name: 'Edt_Org_Preset_kDb4@Wheel', block: 3, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb4.morphAfterTouch', name: 'Edt_Org_Preset_kDb4@AfterTouch', block: 3, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb4.morphCtrlPedal', name: 'Edt_Org_Preset_kDb4@CtrlPedal', block: 3, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb5', name: 'Edt_Org_Preset_kDb5', block: 3, bit: 76, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369' },
  { key: 'organADrawbars.org_Preset_kDb5.morphWheel', name: 'Edt_Org_Preset_kDb5@Wheel', block: 3, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb5.morphAfterTouch', name: 'Edt_Org_Preset_kDb5@AfterTouch', block: 3, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb5.morphCtrlPedal', name: 'Edt_Org_Preset_kDb5@CtrlPedal', block: 3, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb6', name: 'Edt_Org_Preset_kDb6', block: 3, bit: 95, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370' },
  { key: 'organADrawbars.org_Preset_kDb6.morphWheel', name: 'Edt_Org_Preset_kDb6@Wheel', block: 3, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb6.morphAfterTouch', name: 'Edt_Org_Preset_kDb6@AfterTouch', block: 3, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb6.morphCtrlPedal', name: 'Edt_Org_Preset_kDb6@CtrlPedal', block: 3, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb7', name: 'Edt_Org_Preset_kDb7', block: 3, bit: 114, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371' },
  { key: 'organADrawbars.org_Preset_kDb7.morphWheel', name: 'Edt_Org_Preset_kDb7@Wheel', block: 3, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb7.morphAfterTouch', name: 'Edt_Org_Preset_kDb7@AfterTouch', block: 3, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb7.morphCtrlPedal', name: 'Edt_Org_Preset_kDb7@CtrlPedal', block: 3, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb8', name: 'Edt_Org_Preset_kDb8', block: 3, bit: 133, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372' },
  { key: 'organADrawbars.org_Preset_kDb8.morphWheel', name: 'Edt_Org_Preset_kDb8@Wheel', block: 3, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb8.morphAfterTouch', name: 'Edt_Org_Preset_kDb8@AfterTouch', block: 3, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb8.morphCtrlPedal', name: 'Edt_Org_Preset_kDb8@CtrlPedal', block: 3, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · CtrlPedal morph' },
  { key: 'organADrawbars.org_Preset_kDb9', name: 'Edt_Org_Preset_kDb9', block: 3, bit: 152, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373' },
  { key: 'organADrawbars.org_Preset_kDb9.morphWheel', name: 'Edt_Org_Preset_kDb9@Wheel', block: 3, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · Wheel morph' },
  { key: 'organADrawbars.org_Preset_kDb9.morphAfterTouch', name: 'Edt_Org_Preset_kDb9@AfterTouch', block: 3, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · AfterTouch morph' },
  { key: 'organADrawbars.org_Preset_kDb9.morphCtrlPedal', name: 'Edt_Org_Preset_kDb9@CtrlPedal', block: 3, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · CtrlPedal morph' },
  { key: 'organAVibPerc.org_Preset_kVibratoEnable', name: 'Edt_Org_Preset_kVibratoEnable', block: 4, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 364' },
  { key: 'organAVibPerc.org_Preset_kB3PercEnable', name: 'Edt_Org_Preset_kB3PercEnable', block: 4, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 363' },
  { key: 'organAVibPerc.org_Preset_kB3PercHarmonic', name: 'Edt_Org_Preset_kB3PercHarmonic', block: 4, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 375' },
  { key: 'organAVibPerc.org_Preset_kB3PercSpeed', name: 'Edt_Org_Preset_kB3PercSpeed', block: 4, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 376' },
  { key: 'organAVibPerc.org_Preset_kB3PercLevel', name: 'Edt_Org_Preset_kB3PercLevel', block: 4, bit: 4, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 377' },
  { key: 'organB.kbZone', name: 'Edt_Org_kKbZone', block: 5, bit: 0, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 353' },
  { key: 'organB.octaveShift', name: 'Edt_Org_kOctaveShift', block: 5, bit: 4, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 354' },
  { key: 'organB.sustainEnable', name: 'Edt_Org_kSustainEnable', block: 5, bit: 8, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 356' },
  { key: 'organB.model', name: 'Edt_Org_kModel', block: 5, bit: 9, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 358' },
  { key: 'organB.presetEnable', name: 'Edt_Org_kPresetEnable', block: 5, bit: 12, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 352' },
  { key: 'organBDrawbars.org_Preset_kDb1', name: 'Edt_Org_Preset_kDb1', block: 6, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365' },
  { key: 'organBDrawbars.org_Preset_kDb1.morphWheel', name: 'Edt_Org_Preset_kDb1@Wheel', block: 6, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb1.morphAfterTouch', name: 'Edt_Org_Preset_kDb1@AfterTouch', block: 6, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb1.morphCtrlPedal', name: 'Edt_Org_Preset_kDb1@CtrlPedal', block: 6, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 365 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb2', name: 'Edt_Org_Preset_kDb2', block: 6, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366' },
  { key: 'organBDrawbars.org_Preset_kDb2.morphWheel', name: 'Edt_Org_Preset_kDb2@Wheel', block: 6, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb2.morphAfterTouch', name: 'Edt_Org_Preset_kDb2@AfterTouch', block: 6, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb2.morphCtrlPedal', name: 'Edt_Org_Preset_kDb2@CtrlPedal', block: 6, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 366 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb3', name: 'Edt_Org_Preset_kDb3', block: 6, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367' },
  { key: 'organBDrawbars.org_Preset_kDb3.morphWheel', name: 'Edt_Org_Preset_kDb3@Wheel', block: 6, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb3.morphAfterTouch', name: 'Edt_Org_Preset_kDb3@AfterTouch', block: 6, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb3.morphCtrlPedal', name: 'Edt_Org_Preset_kDb3@CtrlPedal', block: 6, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 367 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb4', name: 'Edt_Org_Preset_kDb4', block: 6, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368' },
  { key: 'organBDrawbars.org_Preset_kDb4.morphWheel', name: 'Edt_Org_Preset_kDb4@Wheel', block: 6, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb4.morphAfterTouch', name: 'Edt_Org_Preset_kDb4@AfterTouch', block: 6, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb4.morphCtrlPedal', name: 'Edt_Org_Preset_kDb4@CtrlPedal', block: 6, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 368 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb5', name: 'Edt_Org_Preset_kDb5', block: 6, bit: 76, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369' },
  { key: 'organBDrawbars.org_Preset_kDb5.morphWheel', name: 'Edt_Org_Preset_kDb5@Wheel', block: 6, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb5.morphAfterTouch', name: 'Edt_Org_Preset_kDb5@AfterTouch', block: 6, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb5.morphCtrlPedal', name: 'Edt_Org_Preset_kDb5@CtrlPedal', block: 6, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 369 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb6', name: 'Edt_Org_Preset_kDb6', block: 6, bit: 95, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370' },
  { key: 'organBDrawbars.org_Preset_kDb6.morphWheel', name: 'Edt_Org_Preset_kDb6@Wheel', block: 6, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb6.morphAfterTouch', name: 'Edt_Org_Preset_kDb6@AfterTouch', block: 6, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb6.morphCtrlPedal', name: 'Edt_Org_Preset_kDb6@CtrlPedal', block: 6, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 370 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb7', name: 'Edt_Org_Preset_kDb7', block: 6, bit: 114, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371' },
  { key: 'organBDrawbars.org_Preset_kDb7.morphWheel', name: 'Edt_Org_Preset_kDb7@Wheel', block: 6, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb7.morphAfterTouch', name: 'Edt_Org_Preset_kDb7@AfterTouch', block: 6, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb7.morphCtrlPedal', name: 'Edt_Org_Preset_kDb7@CtrlPedal', block: 6, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 371 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb8', name: 'Edt_Org_Preset_kDb8', block: 6, bit: 133, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372' },
  { key: 'organBDrawbars.org_Preset_kDb8.morphWheel', name: 'Edt_Org_Preset_kDb8@Wheel', block: 6, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb8.morphAfterTouch', name: 'Edt_Org_Preset_kDb8@AfterTouch', block: 6, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb8.morphCtrlPedal', name: 'Edt_Org_Preset_kDb8@CtrlPedal', block: 6, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 372 · CtrlPedal morph' },
  { key: 'organBDrawbars.org_Preset_kDb9', name: 'Edt_Org_Preset_kDb9', block: 6, bit: 152, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373' },
  { key: 'organBDrawbars.org_Preset_kDb9.morphWheel', name: 'Edt_Org_Preset_kDb9@Wheel', block: 6, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · Wheel morph' },
  { key: 'organBDrawbars.org_Preset_kDb9.morphAfterTouch', name: 'Edt_Org_Preset_kDb9@AfterTouch', block: 6, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · AfterTouch morph' },
  { key: 'organBDrawbars.org_Preset_kDb9.morphCtrlPedal', name: 'Edt_Org_Preset_kDb9@CtrlPedal', block: 6, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 373 · CtrlPedal morph' },
  { key: 'organBVibPerc.org_Preset_kVibratoEnable', name: 'Edt_Org_Preset_kVibratoEnable', block: 7, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 364' },
  { key: 'organBVibPerc.org_Preset_kB3PercEnable', name: 'Edt_Org_Preset_kB3PercEnable', block: 7, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 363' },
  { key: 'organBVibPerc.org_Preset_kB3PercHarmonic', name: 'Edt_Org_Preset_kB3PercHarmonic', block: 7, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 375' },
  { key: 'organBVibPerc.org_Preset_kB3PercSpeed', name: 'Edt_Org_Preset_kB3PercSpeed', block: 7, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 376' },
  { key: 'organBVibPerc.org_Preset_kB3PercLevel', name: 'Edt_Org_Preset_kB3PercLevel', block: 7, bit: 4, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 377' },
  { key: 'organFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 8, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'organFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 8, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'organFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 8, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'organFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 8, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'organFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 8, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'organFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 8, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'organFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 8, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'organFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 8, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'organFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 8, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'organFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 8, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'organFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 8, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'organFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 8, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'organFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 8, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'organFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 8, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'organFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 8, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'organFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 8, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'organFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 8, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'organFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 8, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'organFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 8, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'organFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 8, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'organFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 8, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'organFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 8, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'organFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 8, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'organFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 8, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'organFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 8, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'organFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 8, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'organFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 8, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'organFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 8, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'organFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 8, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'organFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 8, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'organFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 8, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'organFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 8, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'organFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 8, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'organFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 8, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'organFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 8, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'organFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 8, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'organFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 8, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'organFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 8, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'organFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 8, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'organFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 8, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'organFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 8, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'organFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 8, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'organFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 8, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'organFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 8, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'organFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 8, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'organFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 8, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'organFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 8, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'organFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 8, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'organFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 8, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'organFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 8, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'organFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 8, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'organFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 8, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'organFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 8, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'organFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 8, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'organFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 8, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'organFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 8, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'organFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 8, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'organFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 8, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'organFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 8, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'organFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 8, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'organFx.rvbType', name: 'Edt_Effects_kRvbType', block: 8, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'organFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 8, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
  { key: 'piano.layerFocusPno_I', name: 'Edt_PnoCom_kLayerFocusPno_I_private', block: 9, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 179' },
  { key: 'piano.layerEnablePno_I', name: 'Edt_PnoCom_kLayerEnablePno_I_private', block: 9, bit: 1, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 180' },
  { key: 'piano.layerFocusPno_II', name: 'Edt_PnoCom_kLayerFocusPno_II_private', block: 9, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 181' },
  { key: 'piano.layerEnablePno_II', name: 'Edt_PnoCom_kLayerEnablePno_II_private', block: 9, bit: 4, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 182' },
  { key: 'piano.layerLevelPnoA', name: 'Edt_PnoCom_kLayerLevelPnoA', block: 9, bit: 6, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 183' },
  { key: 'piano.layerLevelPnoA.morphWheel', name: 'Edt_PnoCom_kLayerLevelPnoA@Wheel', block: 9, bit: 13, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 183 · Wheel morph' },
  { key: 'piano.layerLevelPnoA.morphAfterTouch', name: 'Edt_PnoCom_kLayerLevelPnoA@AfterTouch', block: 9, bit: 21, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 183 · AfterTouch morph' },
  { key: 'piano.layerLevelPnoA.morphCtrlPedal', name: 'Edt_PnoCom_kLayerLevelPnoA@CtrlPedal', block: 9, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 183 · CtrlPedal morph' },
  { key: 'piano.layerLevelPnoB', name: 'Edt_PnoCom_kLayerLevelPnoB', block: 9, bit: 37, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 184' },
  { key: 'piano.layerLevelPnoB.morphWheel', name: 'Edt_PnoCom_kLayerLevelPnoB@Wheel', block: 9, bit: 44, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 184 · Wheel morph' },
  { key: 'piano.layerLevelPnoB.morphAfterTouch', name: 'Edt_PnoCom_kLayerLevelPnoB@AfterTouch', block: 9, bit: 52, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 184 · AfterTouch morph' },
  { key: 'piano.layerLevelPnoB.morphCtrlPedal', name: 'Edt_PnoCom_kLayerLevelPnoB@CtrlPedal', block: 9, bit: 60, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 184 · CtrlPedal morph' },
  { key: 'piano.auxKbdControl', name: 'Edt_PnoCom_kAuxKbdControl', block: 9, bit: 71, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 337' },
  { key: 'piano.effectsSectionModePno', name: 'Edt_PnoCom_kEffectsSectionModePno_private', block: 9, bit: 73, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 401' },
  { key: 'piano.fxLayerFocusPno', name: 'Edt_PnoCom_kFxLayerFocusPno_private', block: 9, bit: 74, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 212' },
  { key: 'pianoA.kbZone', name: 'Edt_Pno_kKbZone', block: 10, bit: 0, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 333' },
  { key: 'pianoA.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 10, bit: 4, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 334' },
  { key: 'pianoA.pStickEnable', name: 'Edt_Pno_kPStickEnable', block: 10, bit: 8, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 335' },
  { key: 'pianoA.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 10, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 336' },
  { key: 'pianoA.bank', name: 'Edt_Pno_kBank', block: 10, bit: 10, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 339' },
  { key: 'pianoA.entry', name: 'Edt_Pno_kEntry', block: 10, bit: 13, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 340' },
  { key: 'pianoA.variation', name: 'Edt_Pno_kVariation', block: 10, bit: 18, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 341' },
  { key: 'pianoA.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 10, bit: 20, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 342' },
  { key: 'pianoA.acoustic', name: 'Edt_Pno_kAcoustic', block: 10, bit: 52, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 343' },
  { key: 'pianoA.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 10, bit: 54, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 344' },
  { key: 'pianoA.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 10, bit: 55, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 345' },
  { key: 'pianoA.unison', name: 'Edt_Pno_kUnison', block: 10, bit: 57, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 349' },
  { key: 'pianoA.dynComp', name: 'Edt_Pno_kDynComp', block: 10, bit: 59, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 350' },
  { key: 'pianoA.eq', name: 'Edt_Pno_kEq', block: 10, bit: 61, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 348' },
  { key: 'pianoB.kbZone', name: 'Edt_Pno_kKbZone', block: 11, bit: 0, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 333' },
  { key: 'pianoB.octaveShift', name: 'Edt_Pno_kOctaveShift', block: 11, bit: 4, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 334' },
  { key: 'pianoB.pStickEnable', name: 'Edt_Pno_kPStickEnable', block: 11, bit: 8, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 335' },
  { key: 'pianoB.sustainEnable', name: 'Edt_Pno_kSustainEnable', block: 11, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 336' },
  { key: 'pianoB.bank', name: 'Edt_Pno_kBank', block: 11, bit: 10, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 339' },
  { key: 'pianoB.entry', name: 'Edt_Pno_kEntry', block: 11, bit: 13, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 340' },
  { key: 'pianoB.variation', name: 'Edt_Pno_kVariation', block: 11, bit: 18, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 341' },
  { key: 'pianoB.nameHash', name: 'Edt_Pno_kNameHash_Private', block: 11, bit: 20, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 342' },
  { key: 'pianoB.acoustic', name: 'Edt_Pno_kAcoustic', block: 11, bit: 52, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 343' },
  { key: 'pianoB.pedalNoise', name: 'Edt_Pno_kPedalNoise', block: 11, bit: 54, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 344' },
  { key: 'pianoB.kbdTouch', name: 'Edt_Pno_kKbdTouch', block: 11, bit: 55, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 345' },
  { key: 'pianoB.unison', name: 'Edt_Pno_kUnison', block: 11, bit: 57, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 349' },
  { key: 'pianoB.dynComp', name: 'Edt_Pno_kDynComp', block: 11, bit: 59, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 350' },
  { key: 'pianoB.eq', name: 'Edt_Pno_kEq', block: 11, bit: 61, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 348' },
  { key: 'pianoAFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 12, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'pianoAFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 12, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'pianoAFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 12, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'pianoAFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 12, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'pianoAFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 12, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'pianoAFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 12, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'pianoAFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 12, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'pianoAFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 12, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'pianoAFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 12, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'pianoAFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 12, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'pianoAFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 12, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'pianoAFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 12, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'pianoAFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 12, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'pianoAFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 12, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'pianoAFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 12, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'pianoAFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 12, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'pianoAFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 12, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'pianoAFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 12, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'pianoAFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 12, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'pianoAFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 12, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'pianoAFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 12, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'pianoAFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 12, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'pianoAFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 12, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'pianoAFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 12, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'pianoAFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 12, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'pianoAFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 12, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'pianoAFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 12, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'pianoAFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 12, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'pianoAFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 12, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'pianoAFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 12, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'pianoAFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 12, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'pianoAFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 12, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'pianoAFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 12, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'pianoAFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 12, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'pianoAFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 12, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'pianoAFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 12, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'pianoAFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 12, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'pianoAFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 12, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'pianoAFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 12, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'pianoAFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 12, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'pianoAFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 12, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'pianoAFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 12, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'pianoAFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 12, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'pianoAFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 12, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'pianoAFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 12, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'pianoAFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 12, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'pianoAFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 12, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'pianoAFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 12, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'pianoAFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 12, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'pianoAFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 12, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'pianoAFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 12, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'pianoAFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 12, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'pianoAFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 12, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'pianoAFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 12, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'pianoAFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 12, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'pianoAFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 12, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'pianoAFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 12, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'pianoAFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 12, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'pianoAFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 12, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'pianoAFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 12, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'pianoAFx.rvbType', name: 'Edt_Effects_kRvbType', block: 12, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'pianoAFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 12, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
  { key: 'pianoBFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 13, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'pianoBFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 13, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'pianoBFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 13, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'pianoBFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 13, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'pianoBFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 13, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'pianoBFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 13, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'pianoBFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 13, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'pianoBFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 13, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'pianoBFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 13, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'pianoBFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 13, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'pianoBFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 13, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'pianoBFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 13, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'pianoBFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 13, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'pianoBFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 13, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'pianoBFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 13, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'pianoBFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 13, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'pianoBFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 13, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'pianoBFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 13, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'pianoBFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 13, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'pianoBFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 13, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'pianoBFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 13, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'pianoBFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 13, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'pianoBFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 13, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'pianoBFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 13, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'pianoBFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 13, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'pianoBFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 13, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'pianoBFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 13, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'pianoBFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 13, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'pianoBFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 13, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'pianoBFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 13, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'pianoBFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 13, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'pianoBFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 13, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'pianoBFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 13, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'pianoBFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 13, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'pianoBFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 13, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'pianoBFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 13, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'pianoBFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 13, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'pianoBFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 13, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'pianoBFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 13, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'pianoBFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 13, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'pianoBFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 13, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'pianoBFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 13, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'pianoBFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 13, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'pianoBFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 13, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'pianoBFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 13, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'pianoBFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 13, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'pianoBFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 13, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'pianoBFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 13, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'pianoBFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 13, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'pianoBFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 13, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'pianoBFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 13, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'pianoBFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 13, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'pianoBFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 13, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'pianoBFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 13, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'pianoBFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 13, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'pianoBFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 13, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'pianoBFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 13, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'pianoBFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 13, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'pianoBFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 13, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'pianoBFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 13, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'pianoBFx.rvbType', name: 'Edt_Effects_kRvbType', block: 13, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'pianoBFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 13, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
  { key: 'synth.layerFocusSyn_I', name: 'Edt_SynCom_kLayerFocusSyn_I_private', block: 14, bit: 0, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 160' },
  { key: 'synth.layerEnableSyn_I', name: 'Edt_SynCom_kLayerEnableSyn_I_private', block: 14, bit: 2, width: 3, min: 0, max: 7, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 161' },
  { key: 'synth.layerFocusSyn_II', name: 'Edt_SynCom_kLayerFocusSyn_II_private', block: 14, bit: 5, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 162' },
  { key: 'synth.layerEnableSyn_II', name: 'Edt_SynCom_kLayerEnableSyn_II_private', block: 14, bit: 7, width: 3, min: 0, max: 7, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 163' },
  { key: 'synth.layerLevelSynA', name: 'Edt_SynCom_kLayerLevelSynA', block: 14, bit: 10, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 164' },
  { key: 'synth.layerLevelSynA.morphWheel', name: 'Edt_SynCom_kLayerLevelSynA@Wheel', block: 14, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 164 · Wheel morph' },
  { key: 'synth.layerLevelSynA.morphAfterTouch', name: 'Edt_SynCom_kLayerLevelSynA@AfterTouch', block: 14, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 164 · AfterTouch morph' },
  { key: 'synth.layerLevelSynA.morphCtrlPedal', name: 'Edt_SynCom_kLayerLevelSynA@CtrlPedal', block: 14, bit: 33, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 164 · CtrlPedal morph' },
  { key: 'synth.layerLevelSynB', name: 'Edt_SynCom_kLayerLevelSynB', block: 14, bit: 41, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 165' },
  { key: 'synth.layerLevelSynB.morphWheel', name: 'Edt_SynCom_kLayerLevelSynB@Wheel', block: 14, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 165 · Wheel morph' },
  { key: 'synth.layerLevelSynB.morphAfterTouch', name: 'Edt_SynCom_kLayerLevelSynB@AfterTouch', block: 14, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 165 · AfterTouch morph' },
  { key: 'synth.layerLevelSynB.morphCtrlPedal', name: 'Edt_SynCom_kLayerLevelSynB@CtrlPedal', block: 14, bit: 64, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 165 · CtrlPedal morph' },
  { key: 'synth.layerLevelSynC', name: 'Edt_SynCom_kLayerLevelSynC', block: 14, bit: 72, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 166' },
  { key: 'synth.layerLevelSynC.morphWheel', name: 'Edt_SynCom_kLayerLevelSynC@Wheel', block: 14, bit: 79, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 166 · Wheel morph' },
  { key: 'synth.layerLevelSynC.morphAfterTouch', name: 'Edt_SynCom_kLayerLevelSynC@AfterTouch', block: 14, bit: 87, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 166 · AfterTouch morph' },
  { key: 'synth.layerLevelSynC.morphCtrlPedal', name: 'Edt_SynCom_kLayerLevelSynC@CtrlPedal', block: 14, bit: 95, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 166 · CtrlPedal morph' },
  { key: 'synth.layerPanSynA', name: 'Edt_SynCom_kLayerPanSynA', block: 14, bit: 103, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 167' },
  { key: 'synth.reserved_was_pan_a_morph', name: 'Edt_SynCom_kReserved_was_pan_a_morph', block: 14, bit: 110, width: 24, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 168' },
  { key: 'synth.layerPanSynB', name: 'Edt_SynCom_kLayerPanSynB', block: 14, bit: 134, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 169' },
  { key: 'synth.reserved_was_pan_b_morph', name: 'Edt_SynCom_kReserved_was_pan_b_morph', block: 14, bit: 141, width: 24, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 170' },
  { key: 'synth.layerPanSynC', name: 'Edt_SynCom_kLayerPanSynC', block: 14, bit: 165, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 171' },
  { key: 'synth.reserved_was_pan_c_morph', name: 'Edt_SynCom_kReserved_was_pan_c_morph', block: 14, bit: 172, width: 24, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 172' },
  { key: 'synth.multiLayerFlt', name: 'Edt_SynCom_kMultiLayerFlt', block: 14, bit: 196, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 253' },
  { key: 'synth.multiLayerArp', name: 'Edt_SynCom_kMultiLayerArp', block: 14, bit: 197, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 254' },
  { key: 'synth.multiLayerLFO', name: 'Edt_SynCom_kMultiLayerLFO', block: 14, bit: 198, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 255' },
  { key: 'synth.kbdHoldEnableCommon', name: 'Edt_SynCom_kKbdHoldEnableCommon', block: 14, bit: 199, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 256' },
  { key: 'synth.auxKbdControl', name: 'Edt_SynCom_kAuxKbdControl', block: 14, bit: 200, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 249' },
  { key: 'synth.effectsSectionModeSyn', name: 'Edt_SynCom_kEffectsSectionModeSyn_private', block: 14, bit: 203, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 402' },
  { key: 'synth.fxLayerFocusSyn', name: 'Edt_SynCom_kFxLayerFocusSyn_private', block: 14, bit: 204, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 213' },
  { key: 'synthA.mode', name: 'Edt_Syn_kMode', block: 15, bit: 0, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 250' },
  { key: 'synthA.libName', name: 'Edt_Syn_kLibName', block: 15, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 251' },
  { key: 'synthA.smpId', name: 'Edt_Syn_kSmpId', block: 15, bit: 2, width: 16, min: 0, max: 16383, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 327' },
  { key: 'synthA.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 15, bit: 18, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 329' },
  { key: 'synthA.kbZone', name: 'Edt_Syn_kKbZone', block: 15, bit: 50, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 244' },
  { key: 'synthA.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 15, bit: 54, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 245' },
  { key: 'synthA.pStickEnable', name: 'Edt_Syn_kPStickEnable', block: 15, bit: 58, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 246' },
  { key: 'synthA.pitchStickRange', name: 'Edt_Syn_kPitchStickRange', block: 15, bit: 59, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 247' },
  { key: 'synthA.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 15, bit: 63, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 248' },
  { key: 'synthA.vibMode', name: 'Edt_Syn_kVibMode', block: 15, bit: 64, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 260' },
  { key: 'synthA.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 15, bit: 69, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 257' },
  { key: 'synthA.voicePrio', name: 'Edt_Syn_kVoicePrio', block: 15, bit: 71, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 258' },
  { key: 'synthA.glideRate', name: 'Edt_Syn_kGlideRate', block: 15, bit: 73, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 259' },
  { key: 'synthA.externEnable', name: 'Edt_Ext_kEnable', block: 15, bit: 80, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 378' },
  { key: 'synthA.externVelCurve', name: 'Edt_Ext_kVelCurve', block: 15, bit: 81, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 384' },
  { key: 'synthA.externModWheelEnable', name: 'Edt_Ext_kModWheelEnable', block: 15, bit: 83, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 379' },
  { key: 'synthA.externAftertouchEnable', name: 'Edt_Ext_kAftertouchEnable', block: 15, bit: 84, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 380' },
  { key: 'synthA.externCtrlPedalEnable', name: 'Edt_Ext_kCtrlPedalEnable', block: 15, bit: 85, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 381' },
  { key: 'synthA.externSwellPedalEnable', name: 'Edt_Ext_kSwellPedalEnable', block: 15, bit: 86, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 382' },
  { key: 'synthA.externCCNumber1', name: 'Edt_Ext_kCCNumber1', block: 15, bit: 87, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 385' },
  { key: 'synthA.externSendOnLoad', name: 'Edt_Ext_kSendOnLoad', block: 15, bit: 94, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 387' },
  { key: 'synthA.externBCValue_LSB', name: 'Edt_Ext_kBCValue_LSB', block: 15, bit: 95, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 388' },
  { key: 'synthA.externBCValue_MSB', name: 'Edt_Ext_kBCValue_MSB', block: 15, bit: 103, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 389' },
  { key: 'synthA.externPCValue', name: 'Edt_Ext_kPCValue', block: 15, bit: 111, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 390' },
  { key: 'synthA.externVolPedalEnable', name: 'Edt_Ext_kVolPedalEnable', block: 15, bit: 118, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 383' },
  { key: 'synthA.externCCNumber2', name: 'Edt_Ext_kCCNumber2', block: 15, bit: 119, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 386' },
  { key: 'synthA.kbdHoldEnableLayer', name: 'Edt_Syn_kKbdHoldEnableLayer', block: 15, bit: 126, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 252' },
  { key: 'synthA.arpRun', name: 'Edt_Syn_kArpRun', block: 15, bit: 127, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 269' },
  { key: 'synthA.arpMode', name: 'Edt_Syn_kArpMode', block: 15, bit: 128, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 267' },
  { key: 'synthA.arpPtnEnable', name: 'Edt_Syn_kArpPtnEnable', block: 15, bit: 130, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 268' },
  { key: 'synthA.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 15, bit: 131, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 270' },
  { key: 'synthA.arpRange', name: 'Edt_Syn_kArpRange', block: 15, bit: 132, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271' },
  { key: 'synthA.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 15, bit: 139, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · Wheel morph' },
  { key: 'synthA.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@AfterTouch', block: 15, bit: 147, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · AfterTouch morph' },
  { key: 'synthA.arpRange.morphCtrlPedal', name: 'Edt_Syn_kArpRange@CtrlPedal', block: 15, bit: 155, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · CtrlPedal morph' },
  { key: 'synthA.arpDir', name: 'Edt_Syn_kArpDir', block: 15, bit: 163, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 272' },
  { key: 'synthA.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 15, bit: 165, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 273' },
  { key: 'synthA.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 15, bit: 166, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 274' },
  { key: 'synthA.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 15, bit: 167, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275' },
  { key: 'synthA.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 15, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · Wheel morph' },
  { key: 'synthA.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@AfterTouch', block: 15, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · AfterTouch morph' },
  { key: 'synthA.arpRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kArpRateClkDiv@CtrlPedal', block: 15, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · CtrlPedal morph' },
  { key: 'synthA.arpPtnLen', name: 'Edt_Syn_kArpPtnLen', block: 15, bit: 198, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 278' },
  { key: 'synthA.arpPtnAcc', name: 'Edt_Syn_kArpPtnAcc', block: 15, bit: 202, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 279' },
  { key: 'synthA.arpPtnDur', name: 'Edt_Syn_kArpPtnDur', block: 15, bit: 234, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 280' },
  { key: 'synthA.arpPtnPan', name: 'Edt_Syn_kArpPtnPan', block: 15, bit: 266, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 281' },
  { key: 'synthA.oscUnison', name: 'Edt_Syn_kOscUnison', block: 15, bit: 298, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 300' },
  { key: 'synthA.externCCValue1', name: 'Edt_Ext_kCCValue1', block: 15, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391' },
  { key: 'synthA.externCCValue1.morphWheel', name: 'Edt_Ext_kCCValue1@Wheel', block: 15, bit: 307, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · Wheel morph' },
  { key: 'synthA.externCCValue1.morphAfterTouch', name: 'Edt_Ext_kCCValue1@AfterTouch', block: 15, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · AfterTouch morph' },
  { key: 'synthA.externCCValue1.morphCtrlPedal', name: 'Edt_Ext_kCCValue1@CtrlPedal', block: 15, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · CtrlPedal morph' },
  { key: 'synthA.externCCValue2', name: 'Edt_Ext_kCCValue2', block: 15, bit: 331, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392' },
  { key: 'synthA.externCCValue2.morphWheel', name: 'Edt_Ext_kCCValue2@Wheel', block: 15, bit: 338, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · Wheel morph' },
  { key: 'synthA.externCCValue2.morphAfterTouch', name: 'Edt_Ext_kCCValue2@AfterTouch', block: 15, bit: 346, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · AfterTouch morph' },
  { key: 'synthA.externCCValue2.morphCtrlPedal', name: 'Edt_Ext_kCCValue2@CtrlPedal', block: 15, bit: 354, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · CtrlPedal morph' },
  { key: 'synthA.vibDly', name: 'Edt_Syn_kVibDly', block: 15, bit: 362, width: 7, min: 1, max: 30, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 263' },
  { key: 'synthB.mode', name: 'Edt_Syn_kMode', block: 16, bit: 0, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 250' },
  { key: 'synthB.libName', name: 'Edt_Syn_kLibName', block: 16, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 251' },
  { key: 'synthB.smpId', name: 'Edt_Syn_kSmpId', block: 16, bit: 2, width: 16, min: 0, max: 16383, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 327' },
  { key: 'synthB.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 16, bit: 18, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 329' },
  { key: 'synthB.kbZone', name: 'Edt_Syn_kKbZone', block: 16, bit: 50, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 244' },
  { key: 'synthB.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 16, bit: 54, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 245' },
  { key: 'synthB.pStickEnable', name: 'Edt_Syn_kPStickEnable', block: 16, bit: 58, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 246' },
  { key: 'synthB.pitchStickRange', name: 'Edt_Syn_kPitchStickRange', block: 16, bit: 59, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 247' },
  { key: 'synthB.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 16, bit: 63, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 248' },
  { key: 'synthB.vibMode', name: 'Edt_Syn_kVibMode', block: 16, bit: 64, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 260' },
  { key: 'synthB.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 16, bit: 69, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 257' },
  { key: 'synthB.voicePrio', name: 'Edt_Syn_kVoicePrio', block: 16, bit: 71, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 258' },
  { key: 'synthB.glideRate', name: 'Edt_Syn_kGlideRate', block: 16, bit: 73, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 259' },
  { key: 'synthB.externEnable', name: 'Edt_Ext_kEnable', block: 16, bit: 80, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 378' },
];

/** Fields 500–954 (see the generator's TS2590 note). */
const FIELDS_1: readonly FwField<Ns4FieldKey>[] = [
  { key: 'synthB.externVelCurve', name: 'Edt_Ext_kVelCurve', block: 16, bit: 81, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 384' },
  { key: 'synthB.externModWheelEnable', name: 'Edt_Ext_kModWheelEnable', block: 16, bit: 83, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 379' },
  { key: 'synthB.externAftertouchEnable', name: 'Edt_Ext_kAftertouchEnable', block: 16, bit: 84, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 380' },
  { key: 'synthB.externCtrlPedalEnable', name: 'Edt_Ext_kCtrlPedalEnable', block: 16, bit: 85, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 381' },
  { key: 'synthB.externSwellPedalEnable', name: 'Edt_Ext_kSwellPedalEnable', block: 16, bit: 86, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 382' },
  { key: 'synthB.externCCNumber1', name: 'Edt_Ext_kCCNumber1', block: 16, bit: 87, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 385' },
  { key: 'synthB.externSendOnLoad', name: 'Edt_Ext_kSendOnLoad', block: 16, bit: 94, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 387' },
  { key: 'synthB.externBCValue_LSB', name: 'Edt_Ext_kBCValue_LSB', block: 16, bit: 95, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 388' },
  { key: 'synthB.externBCValue_MSB', name: 'Edt_Ext_kBCValue_MSB', block: 16, bit: 103, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 389' },
  { key: 'synthB.externPCValue', name: 'Edt_Ext_kPCValue', block: 16, bit: 111, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 390' },
  { key: 'synthB.externVolPedalEnable', name: 'Edt_Ext_kVolPedalEnable', block: 16, bit: 118, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 383' },
  { key: 'synthB.externCCNumber2', name: 'Edt_Ext_kCCNumber2', block: 16, bit: 119, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 386' },
  { key: 'synthB.kbdHoldEnableLayer', name: 'Edt_Syn_kKbdHoldEnableLayer', block: 16, bit: 126, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 252' },
  { key: 'synthB.arpRun', name: 'Edt_Syn_kArpRun', block: 16, bit: 127, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 269' },
  { key: 'synthB.arpMode', name: 'Edt_Syn_kArpMode', block: 16, bit: 128, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 267' },
  { key: 'synthB.arpPtnEnable', name: 'Edt_Syn_kArpPtnEnable', block: 16, bit: 130, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 268' },
  { key: 'synthB.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 16, bit: 131, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 270' },
  { key: 'synthB.arpRange', name: 'Edt_Syn_kArpRange', block: 16, bit: 132, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271' },
  { key: 'synthB.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 16, bit: 139, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · Wheel morph' },
  { key: 'synthB.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@AfterTouch', block: 16, bit: 147, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · AfterTouch morph' },
  { key: 'synthB.arpRange.morphCtrlPedal', name: 'Edt_Syn_kArpRange@CtrlPedal', block: 16, bit: 155, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · CtrlPedal morph' },
  { key: 'synthB.arpDir', name: 'Edt_Syn_kArpDir', block: 16, bit: 163, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 272' },
  { key: 'synthB.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 16, bit: 165, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 273' },
  { key: 'synthB.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 16, bit: 166, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 274' },
  { key: 'synthB.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 16, bit: 167, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275' },
  { key: 'synthB.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 16, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · Wheel morph' },
  { key: 'synthB.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@AfterTouch', block: 16, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · AfterTouch morph' },
  { key: 'synthB.arpRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kArpRateClkDiv@CtrlPedal', block: 16, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · CtrlPedal morph' },
  { key: 'synthB.arpPtnLen', name: 'Edt_Syn_kArpPtnLen', block: 16, bit: 198, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 278' },
  { key: 'synthB.arpPtnAcc', name: 'Edt_Syn_kArpPtnAcc', block: 16, bit: 202, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 279' },
  { key: 'synthB.arpPtnDur', name: 'Edt_Syn_kArpPtnDur', block: 16, bit: 234, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 280' },
  { key: 'synthB.arpPtnPan', name: 'Edt_Syn_kArpPtnPan', block: 16, bit: 266, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 281' },
  { key: 'synthB.oscUnison', name: 'Edt_Syn_kOscUnison', block: 16, bit: 298, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 300' },
  { key: 'synthB.externCCValue1', name: 'Edt_Ext_kCCValue1', block: 16, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391' },
  { key: 'synthB.externCCValue1.morphWheel', name: 'Edt_Ext_kCCValue1@Wheel', block: 16, bit: 307, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · Wheel morph' },
  { key: 'synthB.externCCValue1.morphAfterTouch', name: 'Edt_Ext_kCCValue1@AfterTouch', block: 16, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · AfterTouch morph' },
  { key: 'synthB.externCCValue1.morphCtrlPedal', name: 'Edt_Ext_kCCValue1@CtrlPedal', block: 16, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · CtrlPedal morph' },
  { key: 'synthB.externCCValue2', name: 'Edt_Ext_kCCValue2', block: 16, bit: 331, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392' },
  { key: 'synthB.externCCValue2.morphWheel', name: 'Edt_Ext_kCCValue2@Wheel', block: 16, bit: 338, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · Wheel morph' },
  { key: 'synthB.externCCValue2.morphAfterTouch', name: 'Edt_Ext_kCCValue2@AfterTouch', block: 16, bit: 346, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · AfterTouch morph' },
  { key: 'synthB.externCCValue2.morphCtrlPedal', name: 'Edt_Ext_kCCValue2@CtrlPedal', block: 16, bit: 354, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · CtrlPedal morph' },
  { key: 'synthB.vibDly', name: 'Edt_Syn_kVibDly', block: 16, bit: 362, width: 7, min: 1, max: 30, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 263' },
  { key: 'synthC.mode', name: 'Edt_Syn_kMode', block: 17, bit: 0, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 250' },
  { key: 'synthC.libName', name: 'Edt_Syn_kLibName', block: 17, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 251' },
  { key: 'synthC.smpId', name: 'Edt_Syn_kSmpId', block: 17, bit: 2, width: 16, min: 0, max: 16383, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 327' },
  { key: 'synthC.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 17, bit: 18, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 329' },
  { key: 'synthC.kbZone', name: 'Edt_Syn_kKbZone', block: 17, bit: 50, width: 4, min: 0, max: 11, def: 5, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 244' },
  { key: 'synthC.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 17, bit: 54, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 245' },
  { key: 'synthC.pStickEnable', name: 'Edt_Syn_kPStickEnable', block: 17, bit: 58, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 246' },
  { key: 'synthC.pitchStickRange', name: 'Edt_Syn_kPitchStickRange', block: 17, bit: 59, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 247' },
  { key: 'synthC.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 17, bit: 63, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 248' },
  { key: 'synthC.vibMode', name: 'Edt_Syn_kVibMode', block: 17, bit: 64, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 260' },
  { key: 'synthC.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 17, bit: 69, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 257' },
  { key: 'synthC.voicePrio', name: 'Edt_Syn_kVoicePrio', block: 17, bit: 71, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 258' },
  { key: 'synthC.glideRate', name: 'Edt_Syn_kGlideRate', block: 17, bit: 73, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 259' },
  { key: 'synthC.externEnable', name: 'Edt_Ext_kEnable', block: 17, bit: 80, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 378' },
  { key: 'synthC.externVelCurve', name: 'Edt_Ext_kVelCurve', block: 17, bit: 81, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 384' },
  { key: 'synthC.externModWheelEnable', name: 'Edt_Ext_kModWheelEnable', block: 17, bit: 83, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 379' },
  { key: 'synthC.externAftertouchEnable', name: 'Edt_Ext_kAftertouchEnable', block: 17, bit: 84, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 380' },
  { key: 'synthC.externCtrlPedalEnable', name: 'Edt_Ext_kCtrlPedalEnable', block: 17, bit: 85, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 381' },
  { key: 'synthC.externSwellPedalEnable', name: 'Edt_Ext_kSwellPedalEnable', block: 17, bit: 86, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 382' },
  { key: 'synthC.externCCNumber1', name: 'Edt_Ext_kCCNumber1', block: 17, bit: 87, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 385' },
  { key: 'synthC.externSendOnLoad', name: 'Edt_Ext_kSendOnLoad', block: 17, bit: 94, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 387' },
  { key: 'synthC.externBCValue_LSB', name: 'Edt_Ext_kBCValue_LSB', block: 17, bit: 95, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 388' },
  { key: 'synthC.externBCValue_MSB', name: 'Edt_Ext_kBCValue_MSB', block: 17, bit: 103, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 389' },
  { key: 'synthC.externPCValue', name: 'Edt_Ext_kPCValue', block: 17, bit: 111, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 390' },
  { key: 'synthC.externVolPedalEnable', name: 'Edt_Ext_kVolPedalEnable', block: 17, bit: 118, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 383' },
  { key: 'synthC.externCCNumber2', name: 'Edt_Ext_kCCNumber2', block: 17, bit: 119, width: 7, min: 0, max: 120, def: 3, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 386' },
  { key: 'synthC.kbdHoldEnableLayer', name: 'Edt_Syn_kKbdHoldEnableLayer', block: 17, bit: 126, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 252' },
  { key: 'synthC.arpRun', name: 'Edt_Syn_kArpRun', block: 17, bit: 127, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 269' },
  { key: 'synthC.arpMode', name: 'Edt_Syn_kArpMode', block: 17, bit: 128, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 267' },
  { key: 'synthC.arpPtnEnable', name: 'Edt_Syn_kArpPtnEnable', block: 17, bit: 130, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 268' },
  { key: 'synthC.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 17, bit: 131, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 270' },
  { key: 'synthC.arpRange', name: 'Edt_Syn_kArpRange', block: 17, bit: 132, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271' },
  { key: 'synthC.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 17, bit: 139, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · Wheel morph' },
  { key: 'synthC.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@AfterTouch', block: 17, bit: 147, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · AfterTouch morph' },
  { key: 'synthC.arpRange.morphCtrlPedal', name: 'Edt_Syn_kArpRange@CtrlPedal', block: 17, bit: 155, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 271 · CtrlPedal morph' },
  { key: 'synthC.arpDir', name: 'Edt_Syn_kArpDir', block: 17, bit: 163, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 272' },
  { key: 'synthC.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 17, bit: 165, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 273' },
  { key: 'synthC.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 17, bit: 166, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 274' },
  { key: 'synthC.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 17, bit: 167, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275' },
  { key: 'synthC.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 17, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · Wheel morph' },
  { key: 'synthC.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@AfterTouch', block: 17, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · AfterTouch morph' },
  { key: 'synthC.arpRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kArpRateClkDiv@CtrlPedal', block: 17, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 275 · CtrlPedal morph' },
  { key: 'synthC.arpPtnLen', name: 'Edt_Syn_kArpPtnLen', block: 17, bit: 198, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 278' },
  { key: 'synthC.arpPtnAcc', name: 'Edt_Syn_kArpPtnAcc', block: 17, bit: 202, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 279' },
  { key: 'synthC.arpPtnDur', name: 'Edt_Syn_kArpPtnDur', block: 17, bit: 234, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 280' },
  { key: 'synthC.arpPtnPan', name: 'Edt_Syn_kArpPtnPan', block: 17, bit: 266, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 281' },
  { key: 'synthC.oscUnison', name: 'Edt_Syn_kOscUnison', block: 17, bit: 298, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 300' },
  { key: 'synthC.externCCValue1', name: 'Edt_Ext_kCCValue1', block: 17, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391' },
  { key: 'synthC.externCCValue1.morphWheel', name: 'Edt_Ext_kCCValue1@Wheel', block: 17, bit: 307, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · Wheel morph' },
  { key: 'synthC.externCCValue1.morphAfterTouch', name: 'Edt_Ext_kCCValue1@AfterTouch', block: 17, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · AfterTouch morph' },
  { key: 'synthC.externCCValue1.morphCtrlPedal', name: 'Edt_Ext_kCCValue1@CtrlPedal', block: 17, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 391 · CtrlPedal morph' },
  { key: 'synthC.externCCValue2', name: 'Edt_Ext_kCCValue2', block: 17, bit: 331, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392' },
  { key: 'synthC.externCCValue2.morphWheel', name: 'Edt_Ext_kCCValue2@Wheel', block: 17, bit: 338, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · Wheel morph' },
  { key: 'synthC.externCCValue2.morphAfterTouch', name: 'Edt_Ext_kCCValue2@AfterTouch', block: 17, bit: 346, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · AfterTouch morph' },
  { key: 'synthC.externCCValue2.morphCtrlPedal', name: 'Edt_Ext_kCCValue2@CtrlPedal', block: 17, bit: 354, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 392 · CtrlPedal morph' },
  { key: 'synthC.vibDly', name: 'Edt_Syn_kVibDly', block: 17, bit: 362, width: 7, min: 1, max: 30, def: 7, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 263' },
  { key: 'synthASound.oscBank', name: 'Edt_Syn_kOscBank', block: 18, bit: 0, width: 4, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 293' },
  { key: 'synthASound.oscCat', name: 'Edt_Syn_kOscCat', block: 18, bit: 4, width: 6, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 294' },
  { key: 'synthASound.oscWave', name: 'Edt_Syn_kOscWave', block: 18, bit: 10, width: 7, min: 0, max: 127, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 295' },
  { key: 'synthASound.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 18, bit: 17, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296' },
  { key: 'synthASound.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 18, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · Wheel morph' },
  { key: 'synthASound.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@AfterTouch', block: 18, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · AfterTouch morph' },
  { key: 'synthASound.oscCtrl.morphCtrlPedal', name: 'Edt_Syn_kOscCtrl@CtrlPedal', block: 18, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · CtrlPedal morph' },
  { key: 'synthASound.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 18, bit: 48, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 297' },
  { key: 'synthASound.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 18, bit: 55, width: 6, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 298' },
  { key: 'synthASound.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 18, bit: 63, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 287' },
  { key: 'synthASound.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 18, bit: 70, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 288' },
  { key: 'synthASound.oscEnvRls', name: 'Edt_Syn_kOscEnvRls', block: 18, bit: 77, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 289' },
  { key: 'synthASound.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 18, bit: 84, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290' },
  { key: 'synthASound.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 18, bit: 91, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · Wheel morph' },
  { key: 'synthASound.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@AfterTouch', block: 18, bit: 99, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · AfterTouch morph' },
  { key: 'synthASound.oscEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kOscEnvAmt@CtrlPedal', block: 18, bit: 107, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · CtrlPedal morph' },
  { key: 'synthASound.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 18, bit: 115, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 291' },
  { key: 'synthASound.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 18, bit: 116, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 292' },
  { key: 'synthASound.smpDynamic', name: 'Edt_Syn_kSmpDynamic', block: 18, bit: 117, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 331' },
  { key: 'synthASound.lfoDst', name: 'Edt_Syn_kLFODst', block: 18, bit: 119, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 282' },
  { key: 'synthASound.lfoWave', name: 'Edt_Syn_kLFOWave', block: 18, bit: 121, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 283' },
  { key: 'synthASound.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 18, bit: 124, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 284' },
  { key: 'synthASound.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 18, bit: 125, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285' },
  { key: 'synthASound.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 18, bit: 132, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · Wheel morph' },
  { key: 'synthASound.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@AfterTouch', block: 18, bit: 140, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · AfterTouch morph' },
  { key: 'synthASound.lfoRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kLFORateClkDiv@CtrlPedal', block: 18, bit: 148, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · CtrlPedal morph' },
  { key: 'synthASound.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 18, bit: 156, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286' },
  { key: 'synthASound.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 18, bit: 163, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · Wheel morph' },
  { key: 'synthASound.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@AfterTouch', block: 18, bit: 171, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · AfterTouch morph' },
  { key: 'synthASound.lfoAmt.morphCtrlPedal', name: 'Edt_Syn_kLFOAmt@CtrlPedal', block: 18, bit: 179, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · CtrlPedal morph' },
  { key: 'synthASound.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 18, bit: 187, width: 7, min: 0, max: 127, def: 10, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 302' },
  { key: 'synthASound.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 18, bit: 194, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 303' },
  { key: 'synthASound.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 18, bit: 201, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 304' },
  { key: 'synthASound.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 18, bit: 208, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 305' },
  { key: 'synthASound.fltType', name: 'Edt_Syn_kFltType', block: 18, bit: 210, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 307' },
  { key: 'synthASound.fltFreq', name: 'Edt_Syn_kFltFreq', block: 18, bit: 213, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308' },
  { key: 'synthASound.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 18, bit: 220, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · Wheel morph' },
  { key: 'synthASound.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@AfterTouch', block: 18, bit: 228, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · AfterTouch morph' },
  { key: 'synthASound.fltFreq.morphCtrlPedal', name: 'Edt_Syn_kFltFreq@CtrlPedal', block: 18, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · CtrlPedal morph' },
  { key: 'synthASound.fltRes', name: 'Edt_Syn_kFltRes', block: 18, bit: 244, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309' },
  { key: 'synthASound.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 18, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · Wheel morph' },
  { key: 'synthASound.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@AfterTouch', block: 18, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · AfterTouch morph' },
  { key: 'synthASound.fltRes.morphCtrlPedal', name: 'Edt_Syn_kFltRes@CtrlPedal', block: 18, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · CtrlPedal morph' },
  { key: 'synthASound.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 18, bit: 275, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 310' },
  { key: 'synthASound.fltDrive', name: 'Edt_Syn_kFltDrive', block: 18, bit: 277, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 311' },
  { key: 'synthASound.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 18, bit: 279, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312' },
  { key: 'synthASound.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 18, bit: 286, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · Wheel morph' },
  { key: 'synthASound.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@AfterTouch', block: 18, bit: 294, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · AfterTouch morph' },
  { key: 'synthASound.fltEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kFltEnvAmt@CtrlPedal', block: 18, bit: 302, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · CtrlPedal morph' },
  { key: 'synthASound.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 18, bit: 310, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 313' },
  { key: 'synthASound.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 18, bit: 317, width: 7, min: 0, max: 127, def: 67, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 314' },
  { key: 'synthASound.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 18, bit: 324, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 315' },
  { key: 'synthASound.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 18, bit: 331, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 316' },
  { key: 'synthASound.fltEnable', name: 'Edt_Syn_kFltEnable', block: 18, bit: 332, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 306' },
  { key: 'synthASound.vibRate', name: 'Edt_Syn_kVibRate', block: 18, bit: 333, width: 7, min: 0, max: 127, def: 74, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 261' },
  { key: 'synthASound.vibAmt', name: 'Edt_Syn_kVibAmt', block: 18, bit: 340, width: 6, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 262' },
  { key: 'synthASound.smpTimbre', name: 'Edt_Syn_kSmpTimbre', block: 18, bit: 346, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 332' },
  { key: 'synthBSound.oscBank', name: 'Edt_Syn_kOscBank', block: 19, bit: 0, width: 4, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 293' },
  { key: 'synthBSound.oscCat', name: 'Edt_Syn_kOscCat', block: 19, bit: 4, width: 6, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 294' },
  { key: 'synthBSound.oscWave', name: 'Edt_Syn_kOscWave', block: 19, bit: 10, width: 7, min: 0, max: 127, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 295' },
  { key: 'synthBSound.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 19, bit: 17, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296' },
  { key: 'synthBSound.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 19, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · Wheel morph' },
  { key: 'synthBSound.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@AfterTouch', block: 19, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · AfterTouch morph' },
  { key: 'synthBSound.oscCtrl.morphCtrlPedal', name: 'Edt_Syn_kOscCtrl@CtrlPedal', block: 19, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · CtrlPedal morph' },
  { key: 'synthBSound.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 19, bit: 48, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 297' },
  { key: 'synthBSound.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 19, bit: 55, width: 6, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 298' },
  { key: 'synthBSound.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 19, bit: 63, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 287' },
  { key: 'synthBSound.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 19, bit: 70, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 288' },
  { key: 'synthBSound.oscEnvRls', name: 'Edt_Syn_kOscEnvRls', block: 19, bit: 77, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 289' },
  { key: 'synthBSound.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 19, bit: 84, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290' },
  { key: 'synthBSound.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 19, bit: 91, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · Wheel morph' },
  { key: 'synthBSound.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@AfterTouch', block: 19, bit: 99, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · AfterTouch morph' },
  { key: 'synthBSound.oscEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kOscEnvAmt@CtrlPedal', block: 19, bit: 107, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · CtrlPedal morph' },
  { key: 'synthBSound.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 19, bit: 115, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 291' },
  { key: 'synthBSound.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 19, bit: 116, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 292' },
  { key: 'synthBSound.smpDynamic', name: 'Edt_Syn_kSmpDynamic', block: 19, bit: 117, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 331' },
  { key: 'synthBSound.lfoDst', name: 'Edt_Syn_kLFODst', block: 19, bit: 119, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 282' },
  { key: 'synthBSound.lfoWave', name: 'Edt_Syn_kLFOWave', block: 19, bit: 121, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 283' },
  { key: 'synthBSound.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 19, bit: 124, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 284' },
  { key: 'synthBSound.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 19, bit: 125, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285' },
  { key: 'synthBSound.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 19, bit: 132, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · Wheel morph' },
  { key: 'synthBSound.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@AfterTouch', block: 19, bit: 140, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · AfterTouch morph' },
  { key: 'synthBSound.lfoRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kLFORateClkDiv@CtrlPedal', block: 19, bit: 148, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · CtrlPedal morph' },
  { key: 'synthBSound.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 19, bit: 156, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286' },
  { key: 'synthBSound.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 19, bit: 163, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · Wheel morph' },
  { key: 'synthBSound.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@AfterTouch', block: 19, bit: 171, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · AfterTouch morph' },
  { key: 'synthBSound.lfoAmt.morphCtrlPedal', name: 'Edt_Syn_kLFOAmt@CtrlPedal', block: 19, bit: 179, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · CtrlPedal morph' },
  { key: 'synthBSound.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 19, bit: 187, width: 7, min: 0, max: 127, def: 10, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 302' },
  { key: 'synthBSound.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 19, bit: 194, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 303' },
  { key: 'synthBSound.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 19, bit: 201, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 304' },
  { key: 'synthBSound.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 19, bit: 208, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 305' },
  { key: 'synthBSound.fltType', name: 'Edt_Syn_kFltType', block: 19, bit: 210, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 307' },
  { key: 'synthBSound.fltFreq', name: 'Edt_Syn_kFltFreq', block: 19, bit: 213, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308' },
  { key: 'synthBSound.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 19, bit: 220, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · Wheel morph' },
  { key: 'synthBSound.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@AfterTouch', block: 19, bit: 228, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · AfterTouch morph' },
  { key: 'synthBSound.fltFreq.morphCtrlPedal', name: 'Edt_Syn_kFltFreq@CtrlPedal', block: 19, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · CtrlPedal morph' },
  { key: 'synthBSound.fltRes', name: 'Edt_Syn_kFltRes', block: 19, bit: 244, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309' },
  { key: 'synthBSound.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 19, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · Wheel morph' },
  { key: 'synthBSound.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@AfterTouch', block: 19, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · AfterTouch morph' },
  { key: 'synthBSound.fltRes.morphCtrlPedal', name: 'Edt_Syn_kFltRes@CtrlPedal', block: 19, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · CtrlPedal morph' },
  { key: 'synthBSound.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 19, bit: 275, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 310' },
  { key: 'synthBSound.fltDrive', name: 'Edt_Syn_kFltDrive', block: 19, bit: 277, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 311' },
  { key: 'synthBSound.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 19, bit: 279, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312' },
  { key: 'synthBSound.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 19, bit: 286, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · Wheel morph' },
  { key: 'synthBSound.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@AfterTouch', block: 19, bit: 294, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · AfterTouch morph' },
  { key: 'synthBSound.fltEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kFltEnvAmt@CtrlPedal', block: 19, bit: 302, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · CtrlPedal morph' },
  { key: 'synthBSound.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 19, bit: 310, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 313' },
  { key: 'synthBSound.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 19, bit: 317, width: 7, min: 0, max: 127, def: 67, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 314' },
  { key: 'synthBSound.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 19, bit: 324, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 315' },
  { key: 'synthBSound.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 19, bit: 331, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 316' },
  { key: 'synthBSound.fltEnable', name: 'Edt_Syn_kFltEnable', block: 19, bit: 332, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 306' },
  { key: 'synthBSound.vibRate', name: 'Edt_Syn_kVibRate', block: 19, bit: 333, width: 7, min: 0, max: 127, def: 74, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 261' },
  { key: 'synthBSound.vibAmt', name: 'Edt_Syn_kVibAmt', block: 19, bit: 340, width: 6, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 262' },
  { key: 'synthBSound.smpTimbre', name: 'Edt_Syn_kSmpTimbre', block: 19, bit: 346, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 332' },
  { key: 'synthCSound.oscBank', name: 'Edt_Syn_kOscBank', block: 20, bit: 0, width: 4, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 293' },
  { key: 'synthCSound.oscCat', name: 'Edt_Syn_kOscCat', block: 20, bit: 4, width: 6, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 294' },
  { key: 'synthCSound.oscWave', name: 'Edt_Syn_kOscWave', block: 20, bit: 10, width: 7, min: 0, max: 127, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 295' },
  { key: 'synthCSound.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 20, bit: 17, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296' },
  { key: 'synthCSound.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 20, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · Wheel morph' },
  { key: 'synthCSound.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@AfterTouch', block: 20, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · AfterTouch morph' },
  { key: 'synthCSound.oscCtrl.morphCtrlPedal', name: 'Edt_Syn_kOscCtrl@CtrlPedal', block: 20, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 296 · CtrlPedal morph' },
  { key: 'synthCSound.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 20, bit: 48, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 297' },
  { key: 'synthCSound.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 20, bit: 55, width: 6, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 298' },
  { key: 'synthCSound.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 20, bit: 63, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 287' },
  { key: 'synthCSound.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 20, bit: 70, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 288' },
  { key: 'synthCSound.oscEnvRls', name: 'Edt_Syn_kOscEnvRls', block: 20, bit: 77, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 289' },
  { key: 'synthCSound.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 20, bit: 84, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290' },
  { key: 'synthCSound.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 20, bit: 91, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · Wheel morph' },
  { key: 'synthCSound.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@AfterTouch', block: 20, bit: 99, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · AfterTouch morph' },
  { key: 'synthCSound.oscEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kOscEnvAmt@CtrlPedal', block: 20, bit: 107, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 290 · CtrlPedal morph' },
  { key: 'synthCSound.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 20, bit: 115, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 291' },
  { key: 'synthCSound.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 20, bit: 116, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 292' },
  { key: 'synthCSound.smpDynamic', name: 'Edt_Syn_kSmpDynamic', block: 20, bit: 117, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 331' },
  { key: 'synthCSound.lfoDst', name: 'Edt_Syn_kLFODst', block: 20, bit: 119, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 282' },
  { key: 'synthCSound.lfoWave', name: 'Edt_Syn_kLFOWave', block: 20, bit: 121, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 283' },
  { key: 'synthCSound.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 20, bit: 124, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 284' },
  { key: 'synthCSound.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 20, bit: 125, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285' },
  { key: 'synthCSound.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 20, bit: 132, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · Wheel morph' },
  { key: 'synthCSound.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@AfterTouch', block: 20, bit: 140, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · AfterTouch morph' },
  { key: 'synthCSound.lfoRateClkDiv.morphCtrlPedal', name: 'Edt_Syn_kLFORateClkDiv@CtrlPedal', block: 20, bit: 148, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 285 · CtrlPedal morph' },
  { key: 'synthCSound.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 20, bit: 156, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286' },
  { key: 'synthCSound.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 20, bit: 163, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · Wheel morph' },
  { key: 'synthCSound.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@AfterTouch', block: 20, bit: 171, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · AfterTouch morph' },
  { key: 'synthCSound.lfoAmt.morphCtrlPedal', name: 'Edt_Syn_kLFOAmt@CtrlPedal', block: 20, bit: 179, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 286 · CtrlPedal morph' },
  { key: 'synthCSound.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 20, bit: 187, width: 7, min: 0, max: 127, def: 10, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 302' },
  { key: 'synthCSound.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 20, bit: 194, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 303' },
  { key: 'synthCSound.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 20, bit: 201, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 304' },
  { key: 'synthCSound.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 20, bit: 208, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 305' },
  { key: 'synthCSound.fltType', name: 'Edt_Syn_kFltType', block: 20, bit: 210, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 307' },
  { key: 'synthCSound.fltFreq', name: 'Edt_Syn_kFltFreq', block: 20, bit: 213, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308' },
  { key: 'synthCSound.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 20, bit: 220, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · Wheel morph' },
  { key: 'synthCSound.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@AfterTouch', block: 20, bit: 228, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · AfterTouch morph' },
  { key: 'synthCSound.fltFreq.morphCtrlPedal', name: 'Edt_Syn_kFltFreq@CtrlPedal', block: 20, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 308 · CtrlPedal morph' },
  { key: 'synthCSound.fltRes', name: 'Edt_Syn_kFltRes', block: 20, bit: 244, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309' },
  { key: 'synthCSound.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 20, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · Wheel morph' },
  { key: 'synthCSound.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@AfterTouch', block: 20, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · AfterTouch morph' },
  { key: 'synthCSound.fltRes.morphCtrlPedal', name: 'Edt_Syn_kFltRes@CtrlPedal', block: 20, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 309 · CtrlPedal morph' },
  { key: 'synthCSound.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 20, bit: 275, width: 2, min: 0, max: 3, def: 2, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 310' },
  { key: 'synthCSound.fltDrive', name: 'Edt_Syn_kFltDrive', block: 20, bit: 277, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 311' },
  { key: 'synthCSound.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 20, bit: 279, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312' },
  { key: 'synthCSound.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 20, bit: 286, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · Wheel morph' },
  { key: 'synthCSound.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@AfterTouch', block: 20, bit: 294, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · AfterTouch morph' },
  { key: 'synthCSound.fltEnvAmt.morphCtrlPedal', name: 'Edt_Syn_kFltEnvAmt@CtrlPedal', block: 20, bit: 302, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 312 · CtrlPedal morph' },
  { key: 'synthCSound.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 20, bit: 310, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 313' },
  { key: 'synthCSound.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 20, bit: 317, width: 7, min: 0, max: 127, def: 67, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 314' },
  { key: 'synthCSound.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 20, bit: 324, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 315' },
  { key: 'synthCSound.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 20, bit: 331, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 316' },
  { key: 'synthCSound.fltEnable', name: 'Edt_Syn_kFltEnable', block: 20, bit: 332, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 306' },
  { key: 'synthCSound.vibRate', name: 'Edt_Syn_kVibRate', block: 20, bit: 333, width: 7, min: 0, max: 127, def: 74, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 261' },
  { key: 'synthCSound.vibAmt', name: 'Edt_Syn_kVibAmt', block: 20, bit: 340, width: 6, min: 0, max: 50, def: 25, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 262' },
  { key: 'synthCSound.smpTimbre', name: 'Edt_Syn_kSmpTimbre', block: 20, bit: 346, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 332' },
  { key: 'synthAFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 21, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'synthAFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 21, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'synthAFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 21, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'synthAFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 21, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'synthAFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 21, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'synthAFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 21, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'synthAFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 21, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'synthAFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 21, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'synthAFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 21, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'synthAFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 21, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'synthAFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 21, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'synthAFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 21, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'synthAFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 21, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'synthAFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 21, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'synthAFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 21, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'synthAFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 21, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'synthAFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 21, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'synthAFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 21, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'synthAFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 21, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'synthAFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 21, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'synthAFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 21, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'synthAFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 21, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'synthAFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 21, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'synthAFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 21, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'synthAFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 21, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'synthAFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 21, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'synthAFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 21, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'synthAFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 21, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'synthAFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 21, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'synthAFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 21, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'synthAFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 21, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'synthAFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 21, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'synthAFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 21, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'synthAFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 21, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'synthAFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 21, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'synthAFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 21, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'synthAFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 21, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'synthAFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 21, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'synthAFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 21, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'synthAFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 21, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'synthAFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 21, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'synthAFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 21, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'synthAFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 21, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'synthAFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 21, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'synthAFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 21, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'synthAFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 21, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'synthAFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 21, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'synthAFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 21, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'synthAFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 21, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'synthAFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 21, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'synthAFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 21, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'synthAFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 21, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'synthAFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 21, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'synthAFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 21, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'synthAFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 21, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'synthAFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 21, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'synthAFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 21, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'synthAFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 21, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'synthAFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 21, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'synthAFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 21, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'synthAFx.rvbType', name: 'Edt_Effects_kRvbType', block: 21, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'synthAFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 21, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
  { key: 'synthBFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 22, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'synthBFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 22, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'synthBFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 22, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'synthBFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 22, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'synthBFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 22, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'synthBFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 22, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'synthBFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 22, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'synthBFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 22, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'synthBFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 22, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'synthBFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 22, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'synthBFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 22, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'synthBFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 22, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'synthBFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 22, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'synthBFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 22, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'synthBFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 22, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'synthBFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 22, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'synthBFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 22, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'synthBFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 22, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'synthBFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 22, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'synthBFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 22, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'synthBFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 22, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'synthBFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 22, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'synthBFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 22, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'synthBFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 22, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'synthBFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 22, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'synthBFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 22, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'synthBFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 22, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'synthBFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 22, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'synthBFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 22, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'synthBFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 22, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'synthBFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 22, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'synthBFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 22, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'synthBFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 22, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'synthBFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 22, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'synthBFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 22, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'synthBFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 22, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'synthBFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 22, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'synthBFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 22, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'synthBFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 22, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'synthBFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 22, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'synthBFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 22, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'synthBFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 22, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'synthBFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 22, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'synthBFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 22, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'synthBFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 22, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'synthBFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 22, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'synthBFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 22, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'synthBFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 22, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'synthBFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 22, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'synthBFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 22, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'synthBFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 22, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'synthBFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 22, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'synthBFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 22, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'synthBFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 22, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'synthBFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 22, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'synthBFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 22, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'synthBFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 22, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'synthBFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 22, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'synthBFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 22, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'synthBFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 22, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'synthBFx.rvbType', name: 'Edt_Effects_kRvbType', block: 22, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'synthBFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 22, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
  { key: 'synthCFx.fx1Enable', name: 'Edt_Effects_kFx1Enable', block: 23, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 403' },
  { key: 'synthCFx.fx1ClkEnable', name: 'Edt_Effects_kFx1ClkEnable', block: 23, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 404' },
  { key: 'synthCFx.fx1RateClkDiv', name: 'Edt_Effects_kFx1RateClkDiv', block: 23, bit: 2, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405' },
  { key: 'synthCFx.fx1RateClkDiv.morphWheel', name: 'Edt_Effects_kFx1RateClkDiv@Wheel', block: 23, bit: 9, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · Wheel morph' },
  { key: 'synthCFx.fx1RateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFx1RateClkDiv@AfterTouch', block: 23, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · AfterTouch morph' },
  { key: 'synthCFx.fx1RateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kFx1RateClkDiv@CtrlPedal', block: 23, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 405 · CtrlPedal morph' },
  { key: 'synthCFx.fx1Amt', name: 'Edt_Effects_kFx1Amt', block: 23, bit: 33, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406' },
  { key: 'synthCFx.fx1Amt.morphWheel', name: 'Edt_Effects_kFx1Amt@Wheel', block: 23, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · Wheel morph' },
  { key: 'synthCFx.fx1Amt.morphAfterTouch', name: 'Edt_Effects_kFx1Amt@AfterTouch', block: 23, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · AfterTouch morph' },
  { key: 'synthCFx.fx1Amt.morphCtrlPedal', name: 'Edt_Effects_kFx1Amt@CtrlPedal', block: 23, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 406 · CtrlPedal morph' },
  { key: 'synthCFx.fx1Type', name: 'Edt_Effects_kFx1Type', block: 23, bit: 64, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 408' },
  { key: 'synthCFx.fx2Enable', name: 'Edt_Effects_kFx2Enable', block: 23, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 410' },
  { key: 'synthCFx.fx2Rate', name: 'Edt_Effects_kFx2Rate', block: 23, bit: 69, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411' },
  { key: 'synthCFx.fx2Rate.morphWheel', name: 'Edt_Effects_kFx2Rate@Wheel', block: 23, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · Wheel morph' },
  { key: 'synthCFx.fx2Rate.morphAfterTouch', name: 'Edt_Effects_kFx2Rate@AfterTouch', block: 23, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · AfterTouch morph' },
  { key: 'synthCFx.fx2Rate.morphCtrlPedal', name: 'Edt_Effects_kFx2Rate@CtrlPedal', block: 23, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 411 · CtrlPedal morph' },
  { key: 'synthCFx.fx2Amt', name: 'Edt_Effects_kFx2Amt', block: 23, bit: 100, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412' },
  { key: 'synthCFx.fx2Amt.morphWheel', name: 'Edt_Effects_kFx2Amt@Wheel', block: 23, bit: 107, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · Wheel morph' },
  { key: 'synthCFx.fx2Amt.morphAfterTouch', name: 'Edt_Effects_kFx2Amt@AfterTouch', block: 23, bit: 115, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · AfterTouch morph' },
  { key: 'synthCFx.fx2Amt.morphCtrlPedal', name: 'Edt_Effects_kFx2Amt@CtrlPedal', block: 23, bit: 123, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 412 · CtrlPedal morph' },
  { key: 'synthCFx.fx2Type', name: 'Edt_Effects_kFx2Type', block: 23, bit: 131, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 413' },
  { key: 'synthCFx.ampEnable', name: 'Edt_Effects_kAmpEnable', block: 23, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 414' },
  { key: 'synthCFx.ampTreble', name: 'Edt_Effects_kAmpTreble', block: 23, bit: 136, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 415' },
  { key: 'synthCFx.ampMid', name: 'Edt_Effects_kAmpMid', block: 23, bit: 143, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 416' },
  { key: 'synthCFx.ampBass', name: 'Edt_Effects_kAmpBass', block: 23, bit: 150, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 417' },
  { key: 'synthCFx.ampMidFreq', name: 'Edt_Effects_kAmpMidFreq', block: 23, bit: 157, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418' },
  { key: 'synthCFx.ampMidFreq.morphWheel', name: 'Edt_Effects_kAmpMidFreq@Wheel', block: 23, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · Wheel morph' },
  { key: 'synthCFx.ampMidFreq.morphAfterTouch', name: 'Edt_Effects_kAmpMidFreq@AfterTouch', block: 23, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · AfterTouch morph' },
  { key: 'synthCFx.ampMidFreq.morphCtrlPedal', name: 'Edt_Effects_kAmpMidFreq@CtrlPedal', block: 23, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 418 · CtrlPedal morph' },
  { key: 'synthCFx.ampDrive', name: 'Edt_Effects_kAmpDrive', block: 23, bit: 188, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419' },
  { key: 'synthCFx.ampDrive.morphWheel', name: 'Edt_Effects_kAmpDrive@Wheel', block: 23, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · Wheel morph' },
  { key: 'synthCFx.ampDrive.morphAfterTouch', name: 'Edt_Effects_kAmpDrive@AfterTouch', block: 23, bit: 203, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · AfterTouch morph' },
  { key: 'synthCFx.ampDrive.morphCtrlPedal', name: 'Edt_Effects_kAmpDrive@CtrlPedal', block: 23, bit: 211, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 419 · CtrlPedal morph' },
  { key: 'synthCFx.cmpEnable', name: 'Edt_Effects_kCmpEnable', block: 23, bit: 223, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 424' },
  { key: 'synthCFx.cmpAmt', name: 'Edt_Effects_kCmpAmt', block: 23, bit: 224, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 426' },
  { key: 'synthCFx.cmpResponse', name: 'Edt_Effects_kCmpResponse', block: 23, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 427' },
  { key: 'synthCFx.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 23, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 428' },
  { key: 'synthCFx.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 23, bit: 233, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 430' },
  { key: 'synthCFx.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 23, bit: 234, width: 14, min: 0, max: 16383, def: 11008, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431' },
  { key: 'synthCFx.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 23, bit: 248, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · Wheel morph' },
  { key: 'synthCFx.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@AfterTouch', block: 23, bit: 263, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · AfterTouch morph' },
  { key: 'synthCFx.dlyRateClkDiv.morphCtrlPedal', name: 'Edt_Effects_kDlyRateClkDiv@CtrlPedal', block: 23, bit: 278, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 431 · CtrlPedal morph' },
  { key: 'synthCFx.dlyMix', name: 'Edt_Effects_kDlyMix', block: 23, bit: 293, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433' },
  { key: 'synthCFx.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 23, bit: 300, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · Wheel morph' },
  { key: 'synthCFx.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@AfterTouch', block: 23, bit: 308, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · AfterTouch morph' },
  { key: 'synthCFx.dlyMix.morphCtrlPedal', name: 'Edt_Effects_kDlyMix@CtrlPedal', block: 23, bit: 316, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 433 · CtrlPedal morph' },
  { key: 'synthCFx.dlyMode', name: 'Edt_Effects_kDlyMode', block: 23, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 434' },
  { key: 'synthCFx.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 23, bit: 325, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 435' },
  { key: 'synthCFx.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 23, bit: 326, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 436' },
  { key: 'synthCFx.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 23, bit: 328, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437' },
  { key: 'synthCFx.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 23, bit: 335, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · Wheel morph' },
  { key: 'synthCFx.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@AfterTouch', block: 23, bit: 343, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · AfterTouch morph' },
  { key: 'synthCFx.dlyFbkAmt.morphCtrlPedal', name: 'Edt_Effects_kDlyFbkAmt@CtrlPedal', block: 23, bit: 351, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 437 · CtrlPedal morph' },
  { key: 'synthCFx.dlyFbFxType', name: 'Edt_Effects_kDlyFbFxType', block: 23, bit: 359, width: 4, min: 0, max: 11, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 438' },
  { key: 'synthCFx.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 23, bit: 363, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 440' },
  { key: 'synthCFx.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 23, bit: 364, width: 7, min: 0, max: 127, def: 38, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444' },
  { key: 'synthCFx.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 23, bit: 371, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · Wheel morph' },
  { key: 'synthCFx.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@AfterTouch', block: 23, bit: 379, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · AfterTouch morph' },
  { key: 'synthCFx.rvbAmt.morphCtrlPedal', name: 'Edt_Effects_kRvbAmt@CtrlPedal', block: 23, bit: 387, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 444 · CtrlPedal morph' },
  { key: 'synthCFx.rvbColor', name: 'Edt_Effects_kRvbColor', block: 23, bit: 395, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 443' },
  { key: 'synthCFx.rvbType', name: 'Edt_Effects_kRvbType', block: 23, bit: 397, width: 4, min: 0, max: 11, def: 6, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 442' },
  { key: 'synthCFx.ampTypeNew', name: 'Edt_Effects_kAmpTypeNew', block: 23, bit: 405, width: 4, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Stage 4 OS 1.66 registry · id 423' },
];

export const NS4_LAYOUT: FwLayout<Ns4FieldKey> = {
  model: 'Nord Stage 4',
  source: 'Stage 4 OS 1.66 registry',
  container: 'Stage 4 OS 1.66 program archive (writes 3.13; 3.07–3.13 files carry the same 24 blocks)',
  versionRange: [307, 313],
  bodyBytes: 824,
  blocks: [
    { key: 'common', name: 'Common', offset: 4, length: 44 },
    { key: 'organ', name: 'Organ', offset: 49, length: 17 },
    { key: 'organA', name: 'Organ A', offset: 67, length: 3 },
    { key: 'organADrawbars', name: 'Organ A Drawbars', offset: 71, length: 23 },
    { key: 'organAVibPerc', name: 'Organ A Vib/Perc', offset: 95, length: 2 },
    { key: 'organB', name: 'Organ B', offset: 98, length: 3 },
    { key: 'organBDrawbars', name: 'Organ B Drawbars', offset: 102, length: 23 },
    { key: 'organBVibPerc', name: 'Organ B Vib/Perc', offset: 126, length: 2 },
    { key: 'organFx', name: 'Organ Effects', offset: 129, length: 54 },
    { key: 'piano', name: 'Piano', offset: 184, length: 12 },
    { key: 'pianoA', name: 'Piano A', offset: 197, length: 11 },
    { key: 'pianoB', name: 'Piano B', offset: 209, length: 11 },
    { key: 'pianoAFx', name: 'Piano A Effects', offset: 221, length: 54 },
    { key: 'pianoBFx', name: 'Piano B Effects', offset: 276, length: 54 },
    { key: 'synth', name: 'Synth', offset: 331, length: 30 },
    { key: 'synthA', name: 'Synth A', offset: 362, length: 50 },
    { key: 'synthB', name: 'Synth B', offset: 413, length: 50 },
    { key: 'synthC', name: 'Synth C', offset: 464, length: 50 },
    { key: 'synthASound', name: 'Synth A Sound', offset: 515, length: 47 },
    { key: 'synthBSound', name: 'Synth B Sound', offset: 563, length: 47 },
    { key: 'synthCSound', name: 'Synth C Sound', offset: 611, length: 47 },
    { key: 'synthAFx', name: 'Synth A Effects', offset: 659, length: 54 },
    { key: 'synthBFx', name: 'Synth B Effects', offset: 714, length: 54 },
    { key: 'synthCFx', name: 'Synth C Effects', offset: 769, length: 54 },
  ],
  fields: [...FIELDS_0, ...FIELDS_1],
};
