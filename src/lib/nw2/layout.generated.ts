// AUTO-GENERATED (wave-2) — DO NOT EDIT MANUALLY.
//
// Provenance: Wave 2 OS 1.24 registry; Wave 2 OS 1.24 Multi format (reads 3.00–3.01), slot sub-chain.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwField, FwLayout } from '../clavia/block-chain';

export type Nw2FieldKey =
  | 'common.slotFocus'
  | 'common.slotEnable'
  | 'common.slotGroup'
  | 'common.slotLock'
  | 'common.splEnable'
  | 'common.splEnableLow'
  | 'common.splEnableMid'
  | 'common.splEnableHigh'
  | 'common.splPosLow'
  | 'common.splPosMid'
  | 'common.splPosHigh'
  | 'common.splWidthLow'
  | 'common.splWidthMid'
  | 'common.splWidthHigh'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.kbdHold'
  | 'common.mstClkRate'
  | 'common.mstClkKBS'
  | 'common.gainLevel'
  | 'common.slotLevelA'
  | 'common.slotLevelA.morphImpulse'
  | 'common.slotLevelA.morphWheel'
  | 'common.slotLevelA.morphPedal'
  | 'common.slotLevelA.morphAfterTouch'
  | 'common.slotLevelA.morphVelocity'
  | 'common.slotLevelB'
  | 'common.slotLevelB.morphImpulse'
  | 'common.slotLevelB.morphWheel'
  | 'common.slotLevelB.morphPedal'
  | 'common.slotLevelB.morphAfterTouch'
  | 'common.slotLevelB.morphVelocity'
  | 'common.slotLevelC'
  | 'common.slotLevelC.morphImpulse'
  | 'common.slotLevelC.morphWheel'
  | 'common.slotLevelC.morphPedal'
  | 'common.slotLevelC.morphAfterTouch'
  | 'common.slotLevelC.morphVelocity'
  | 'common.slotLevelD'
  | 'common.slotLevelD.morphImpulse'
  | 'common.slotLevelD.morphWheel'
  | 'common.slotLevelD.morphPedal'
  | 'common.slotLevelD.morphAfterTouch'
  | 'common.slotLevelD.morphVelocity'
  | 'common.slotPanA'
  | 'common.slotPanA.morphImpulse'
  | 'common.slotPanA.morphWheel'
  | 'common.slotPanA.morphPedal'
  | 'common.slotPanA.morphAfterTouch'
  | 'common.slotPanA.morphVelocity'
  | 'common.slotPanB'
  | 'common.slotPanB.morphImpulse'
  | 'common.slotPanB.morphWheel'
  | 'common.slotPanB.morphPedal'
  | 'common.slotPanB.morphAfterTouch'
  | 'common.slotPanB.morphVelocity'
  | 'common.slotPanC'
  | 'common.slotPanC.morphImpulse'
  | 'common.slotPanC.morphWheel'
  | 'common.slotPanC.morphPedal'
  | 'common.slotPanC.morphAfterTouch'
  | 'common.slotPanC.morphVelocity'
  | 'common.slotPanD'
  | 'common.slotPanD.morphImpulse'
  | 'common.slotPanD.morphWheel'
  | 'common.slotPanD.morphPedal'
  | 'common.slotPanD.morphAfterTouch'
  | 'common.slotPanD.morphVelocity'
  | 'common.pitchStickRange'
  | 'common.octShiftGlobalEnable'
  | 'common.octShiftGlobal'
  | 'common.midiSlotA'
  | 'common.midiSlotB'
  | 'common.midiSlotC'
  | 'common.midiSlotD'
  | 'common.vibFocus'
  | 'slotACommon.octaveShift'
  | 'slotACommon.octaveShift.morphImpulse'
  | 'slotACommon.pitchStickEnable'
  | 'slotACommon.sustainEnable'
  | 'slotACommon.kbdHoldEnable'
  | 'slotACommon.vibratoMode'
  | 'slotACommon.vibratoMode.morphImpulse'
  | 'slotACommon.voiceMode'
  | 'slotACommon.voiceMode.morphImpulse'
  | 'slotACommon.glideRate'
  | 'slotACommon.glideRate.morphImpulse'
  | 'slotACommon.glideRate.morphWheel'
  | 'slotACommon.glideRate.morphPedal'
  | 'slotACommon.glideRate.morphAfterTouch'
  | 'slotACommon.glideRate.morphVelocity'
  | 'slotACommon.oscBank'
  | 'slotACommon.oscWave'
  | 'slotACommon.oscCtrl'
  | 'slotACommon.oscCtrl.morphImpulse'
  | 'slotACommon.oscCtrl.morphWheel'
  | 'slotACommon.oscCtrl.morphPedal'
  | 'slotACommon.oscCtrl.morphAfterTouch'
  | 'slotACommon.oscCtrl.morphVelocity'
  | 'slotACommon.oscTuneFine'
  | 'slotACommon.oscTuneFine.morphImpulse'
  | 'slotACommon.oscTuneFine.morphWheel'
  | 'slotACommon.oscTuneFine.morphPedal'
  | 'slotACommon.oscTuneFine.morphAfterTouch'
  | 'slotACommon.oscTuneFine.morphVelocity'
  | 'slotACommon.oscTuneCoarse'
  | 'slotACommon.oscTuneCoarse.morphImpulse'
  | 'slotACommon.oscTuneCoarse.morphWheel'
  | 'slotACommon.oscTuneCoarse.morphPedal'
  | 'slotACommon.oscTuneCoarse.morphAfterTouch'
  | 'slotACommon.oscTuneCoarse.morphVelocity'
  | 'slotACommon.oscDualMode'
  | 'slotACommon.oscDualMode.morphImpulse'
  | 'slotACommon.oscEnvAtk'
  | 'slotACommon.oscEnvAtk.morphImpulse'
  | 'slotACommon.oscEnvAtk.morphWheel'
  | 'slotACommon.oscEnvAtk.morphPedal'
  | 'slotACommon.oscEnvAtk.morphAfterTouch'
  | 'slotACommon.oscEnvAtk.morphVelocity'
  | 'slotACommon.oscEnvDcy'
  | 'slotACommon.oscEnvDcy.morphImpulse'
  | 'slotACommon.oscEnvDcy.morphWheel'
  | 'slotACommon.oscEnvDcy.morphPedal'
  | 'slotACommon.oscEnvDcy.morphAfterTouch'
  | 'slotACommon.oscEnvDcy.morphVelocity'
  | 'slotACommon.oscEnvAmt'
  | 'slotACommon.oscEnvAmt.morphImpulse'
  | 'slotACommon.oscEnvAmt.morphWheel'
  | 'slotACommon.oscEnvAmt.morphPedal'
  | 'slotACommon.oscEnvAmt.morphAfterTouch'
  | 'slotACommon.oscEnvAmt.morphVelocity'
  | 'slotACommon.oscEnvDst'
  | 'slotACommon.oscEnvDst.morphImpulse'
  | 'slotACommon.oscEnvMode'
  | 'slotACommon.oscEnvMode.morphImpulse'
  | 'slotACommon.oscEnvVel'
  | 'slotACommon.oscWhlDir'
  | 'slotACommon.smpNameHash'
  | 'slotACommon.smpPresets'
  | 'slotACommon.smpFastAtk'
  | 'slotACommon.smpFastAtk.morphImpulse'
  | 'slotACommon.smpVibRateUsageEol'
  | 'slotAArp.arpRun'
  | 'slotAArp.arpRun.morphImpulse'
  | 'slotAArp.arpTarget'
  | 'slotAArp.arpMode'
  | 'slotAArp.arpMode.morphImpulse'
  | 'slotAArp.arpModePtn'
  | 'slotAArp.arpModePtn.morphImpulse'
  | 'slotAArp.arpKbdSync'
  | 'slotAArp.arpKbdSync.morphImpulse'
  | 'slotAArp.arpRange'
  | 'slotAArp.arpRange.morphImpulse'
  | 'slotAArp.arpRange.morphWheel'
  | 'slotAArp.arpRange.morphPedal'
  | 'slotAArp.arpRange.morphAfterTouch'
  | 'slotAArp.arpRange.morphVelocity'
  | 'slotAArp.arpPattern'
  | 'slotAArp.arpPattern.morphImpulse'
  | 'slotAArp.arpZigZag'
  | 'slotAArp.arpZigZag.morphImpulse'
  | 'slotAArp.arpClkEnable'
  | 'slotAArp.arpRateClkDiv'
  | 'slotAArp.arpRateClkDiv.morphImpulse'
  | 'slotAArp.arpRateClkDiv.morphWheel'
  | 'slotAArp.arpRateClkDiv.morphPedal'
  | 'slotAArp.arpRateClkDiv.morphAfterTouch'
  | 'slotAArp.arpRateClkDiv.morphVelocity'
  | 'slotAArp.gateSeqLength'
  | 'slotAArp.gatePtnAcc'
  | 'slotAArp.gatePtnDur'
  | 'slotAArp.gatePtnPan'
  | 'slotAArp.gateSeqDivider'
  | 'slotALfo.lfoDst'
  | 'slotALfo.lfoDst.morphImpulse'
  | 'slotALfo.lfoTarget'
  | 'slotALfo.lfoWave'
  | 'slotALfo.lfoWave.morphImpulse'
  | 'slotALfo.lfoClkEnable'
  | 'slotALfo.lfoRateClkDiv'
  | 'slotALfo.lfoRateClkDiv.morphImpulse'
  | 'slotALfo.lfoRateClkDiv.morphWheel'
  | 'slotALfo.lfoRateClkDiv.morphPedal'
  | 'slotALfo.lfoRateClkDiv.morphAfterTouch'
  | 'slotALfo.lfoRateClkDiv.morphVelocity'
  | 'slotALfo.lfoAmt'
  | 'slotALfo.lfoAmt.morphImpulse'
  | 'slotALfo.lfoAmt.morphWheel'
  | 'slotALfo.lfoAmt.morphPedal'
  | 'slotALfo.lfoAmt.morphAfterTouch'
  | 'slotALfo.lfoAmt.morphVelocity'
  | 'slotALfo.lfoWhlDir'
  | 'slotAFilter.fltTarget'
  | 'slotAFilter.fltType'
  | 'slotAFilter.fltType.morphImpulse'
  | 'slotAFilter.fltFreq'
  | 'slotAFilter.fltFreq.morphImpulse'
  | 'slotAFilter.fltFreq.morphWheel'
  | 'slotAFilter.fltFreq.morphPedal'
  | 'slotAFilter.fltFreq.morphAfterTouch'
  | 'slotAFilter.fltFreq.morphVelocity'
  | 'slotAFilter.fltRes'
  | 'slotAFilter.fltRes.morphImpulse'
  | 'slotAFilter.fltRes.morphWheel'
  | 'slotAFilter.fltRes.morphPedal'
  | 'slotAFilter.fltRes.morphAfterTouch'
  | 'slotAFilter.fltRes.morphVelocity'
  | 'slotAFilter.fltKbdTrk'
  | 'slotAFilter.fltKbdTrk.morphImpulse'
  | 'slotAFilter.fltDrive'
  | 'slotAFilter.fltDrive.morphImpulse'
  | 'slotAFilter.fltEnvAmt'
  | 'slotAFilter.fltEnvAmt.morphImpulse'
  | 'slotAFilter.fltEnvAmt.morphWheel'
  | 'slotAFilter.fltEnvAmt.morphPedal'
  | 'slotAFilter.fltEnvAmt.morphAfterTouch'
  | 'slotAFilter.fltEnvAmt.morphVelocity'
  | 'slotAFilter.fltEnvAtk'
  | 'slotAFilter.fltEnvAtk.morphImpulse'
  | 'slotAFilter.fltEnvAtk.morphWheel'
  | 'slotAFilter.fltEnvAtk.morphPedal'
  | 'slotAFilter.fltEnvAtk.morphAfterTouch'
  | 'slotAFilter.fltEnvAtk.morphVelocity'
  | 'slotAFilter.fltEnvDcy'
  | 'slotAFilter.fltEnvDcy.morphImpulse'
  | 'slotAFilter.fltEnvDcy.morphWheel'
  | 'slotAFilter.fltEnvDcy.morphPedal'
  | 'slotAFilter.fltEnvDcy.morphAfterTouch'
  | 'slotAFilter.fltEnvDcy.morphVelocity'
  | 'slotAFilter.fltEnvSus'
  | 'slotAFilter.fltEnvSus.morphImpulse'
  | 'slotAFilter.fltEnvSus.morphWheel'
  | 'slotAFilter.fltEnvSus.morphPedal'
  | 'slotAFilter.fltEnvSus.morphAfterTouch'
  | 'slotAFilter.fltEnvSus.morphVelocity'
  | 'slotAFilter.fltEnvRls'
  | 'slotAFilter.fltEnvRls.morphImpulse'
  | 'slotAFilter.fltEnvRls.morphWheel'
  | 'slotAFilter.fltEnvRls.morphPedal'
  | 'slotAFilter.fltEnvRls.morphAfterTouch'
  | 'slotAFilter.fltEnvRls.morphVelocity'
  | 'slotAFilter.fltEnvVel'
  | 'slotAFilter.fltEnvInv'
  | 'slotAFilter.fltEnvInv.morphImpulse'
  | 'slotAFilter.fltWhlDir'
  | 'slotAFilter.fltEnable'
  | 'slotAFilter.fltEnable.morphImpulse'
  | 'slotAAmpEnv.ampEnvTarget'
  | 'slotAAmpEnv.ampEnvAtk'
  | 'slotAAmpEnv.ampEnvAtk.morphImpulse'
  | 'slotAAmpEnv.ampEnvAtk.morphWheel'
  | 'slotAAmpEnv.ampEnvAtk.morphPedal'
  | 'slotAAmpEnv.ampEnvAtk.morphAfterTouch'
  | 'slotAAmpEnv.ampEnvAtk.morphVelocity'
  | 'slotAAmpEnv.ampEnvAtkFast'
  | 'slotAAmpEnv.ampEnvAtkFast.morphImpulse'
  | 'slotAAmpEnv.ampEnvDcy'
  | 'slotAAmpEnv.ampEnvDcy.morphImpulse'
  | 'slotAAmpEnv.ampEnvDcy.morphWheel'
  | 'slotAAmpEnv.ampEnvDcy.morphPedal'
  | 'slotAAmpEnv.ampEnvDcy.morphAfterTouch'
  | 'slotAAmpEnv.ampEnvDcy.morphVelocity'
  | 'slotAAmpEnv.ampEnvSus'
  | 'slotAAmpEnv.ampEnvSus.morphImpulse'
  | 'slotAAmpEnv.ampEnvSus.morphWheel'
  | 'slotAAmpEnv.ampEnvSus.morphPedal'
  | 'slotAAmpEnv.ampEnvSus.morphAfterTouch'
  | 'slotAAmpEnv.ampEnvSus.morphVelocity'
  | 'slotAAmpEnv.ampEnvRls'
  | 'slotAAmpEnv.ampEnvRls.morphImpulse'
  | 'slotAAmpEnv.ampEnvRls.morphWheel'
  | 'slotAAmpEnv.ampEnvRls.morphPedal'
  | 'slotAAmpEnv.ampEnvRls.morphAfterTouch'
  | 'slotAAmpEnv.ampEnvRls.morphVelocity'
  | 'slotAAmpEnv.ampEnvVel'
  | 'slotAFx.fxTarget'
  | 'slotAFx.fxClkEnable'
  | 'slotAFx.fxType'
  | 'slotAFx.fxType.morphImpulse'
  | 'slotAFx.fxRateClkDiv'
  | 'slotAFx.fxRateClkDiv.morphImpulse'
  | 'slotAFx.fxRateClkDiv.morphWheel'
  | 'slotAFx.fxRateClkDiv.morphPedal'
  | 'slotAFx.fxRateClkDiv.morphAfterTouch'
  | 'slotAFx.fxRateClkDiv.morphVelocity'
  | 'slotAFx.fxAmt'
  | 'slotAFx.fxAmt.morphImpulse'
  | 'slotAFx.fxAmt.morphWheel'
  | 'slotAFx.fxAmt.morphPedal'
  | 'slotAFx.fxAmt.morphAfterTouch'
  | 'slotAFx.fxAmt.morphVelocity'
  | 'slotAFx.fxEnable'
  | 'slotAFx.fxEnable.morphImpulse'
  | 'slotAEq.eqTarget'
  | 'slotAEq.eqType'
  | 'slotAEq.eqTreble'
  | 'slotAEq.eqBass'
  | 'slotAEq.eqMidFreq'
  | 'slotAEq.eqMidGain'
  | 'slotAEq.eqDrive'
  | 'slotAEq.eqDrive.morphImpulse'
  | 'slotAEq.eqDrive.morphWheel'
  | 'slotAEq.eqDrive.morphPedal'
  | 'slotAEq.eqDrive.morphAfterTouch'
  | 'slotAEq.eqDrive.morphVelocity'
  | 'slotAEq.eqEnable'
  | 'slotAEq.eqEnable.morphImpulse'
  | 'slotADelay.dlyTarget'
  | 'slotADelay.dlyClkEnable'
  | 'slotADelay.dlyRateClkDiv'
  | 'slotADelay.dlyRateClkDiv.morphImpulse'
  | 'slotADelay.dlyRateClkDiv.morphWheel'
  | 'slotADelay.dlyRateClkDiv.morphPedal'
  | 'slotADelay.dlyRateClkDiv.morphAfterTouch'
  | 'slotADelay.dlyRateClkDiv.morphVelocity'
  | 'slotADelay.dlyMix'
  | 'slotADelay.dlyMix.morphImpulse'
  | 'slotADelay.dlyMix.morphWheel'
  | 'slotADelay.dlyMix.morphPedal'
  | 'slotADelay.dlyMix.morphAfterTouch'
  | 'slotADelay.dlyMix.morphVelocity'
  | 'slotADelay.dlyMode'
  | 'slotADelay.dlyMode.morphImpulse'
  | 'slotADelay.dlyFbkPingPong'
  | 'slotADelay.dlyFbkPingPong.morphImpulse'
  | 'slotADelay.dlyFbkFilt'
  | 'slotADelay.dlyFbkFilt.morphImpulse'
  | 'slotADelay.dlyFbkAmt'
  | 'slotADelay.dlyFbkAmt.morphImpulse'
  | 'slotADelay.dlyFbkAmt.morphWheel'
  | 'slotADelay.dlyFbkAmt.morphPedal'
  | 'slotADelay.dlyFbkAmt.morphAfterTouch'
  | 'slotADelay.dlyFbkAmt.morphVelocity'
  | 'slotADelay.dlyFbkFx'
  | 'slotADelay.dlyFbkFx.morphImpulse'
  | 'slotADelay.dlyFbkDeep'
  | 'slotADelay.dlyFbkDeep.morphImpulse'
  | 'slotADelay.dlyEnable'
  | 'slotADelay.dlyEnable.morphImpulse'
  | 'slotAReverb.rvbTarget'
  | 'slotAReverb.rvbType'
  | 'slotAReverb.rvbType.morphImpulse'
  | 'slotAReverb.rvbColor'
  | 'slotAReverb.rvbColor.morphImpulse'
  | 'slotAReverb.rvbModulate'
  | 'slotAReverb.rvbModulate.morphImpulse'
  | 'slotAReverb.rvbAmt'
  | 'slotAReverb.rvbAmt.morphImpulse'
  | 'slotAReverb.rvbAmt.morphWheel'
  | 'slotAReverb.rvbAmt.morphPedal'
  | 'slotAReverb.rvbAmt.morphAfterTouch'
  | 'slotAReverb.rvbAmt.morphVelocity'
  | 'slotAReverb.rvbEnable'
  | 'slotAReverb.rvbEnable.morphImpulse'
  | 'slotAVibrato.vibratoRate'
  | 'slotAVibrato.vibratoAmount'
  | 'slotBCommon.octaveShift'
  | 'slotBCommon.octaveShift.morphImpulse'
  | 'slotBCommon.pitchStickEnable'
  | 'slotBCommon.sustainEnable'
  | 'slotBCommon.kbdHoldEnable'
  | 'slotBCommon.vibratoMode'
  | 'slotBCommon.vibratoMode.morphImpulse'
  | 'slotBCommon.voiceMode'
  | 'slotBCommon.voiceMode.morphImpulse'
  | 'slotBCommon.glideRate'
  | 'slotBCommon.glideRate.morphImpulse'
  | 'slotBCommon.glideRate.morphWheel'
  | 'slotBCommon.glideRate.morphPedal'
  | 'slotBCommon.glideRate.morphAfterTouch'
  | 'slotBCommon.glideRate.morphVelocity'
  | 'slotBCommon.oscBank'
  | 'slotBCommon.oscWave'
  | 'slotBCommon.oscCtrl'
  | 'slotBCommon.oscCtrl.morphImpulse'
  | 'slotBCommon.oscCtrl.morphWheel'
  | 'slotBCommon.oscCtrl.morphPedal'
  | 'slotBCommon.oscCtrl.morphAfterTouch'
  | 'slotBCommon.oscCtrl.morphVelocity'
  | 'slotBCommon.oscTuneFine'
  | 'slotBCommon.oscTuneFine.morphImpulse'
  | 'slotBCommon.oscTuneFine.morphWheel'
  | 'slotBCommon.oscTuneFine.morphPedal'
  | 'slotBCommon.oscTuneFine.morphAfterTouch'
  | 'slotBCommon.oscTuneFine.morphVelocity'
  | 'slotBCommon.oscTuneCoarse'
  | 'slotBCommon.oscTuneCoarse.morphImpulse'
  | 'slotBCommon.oscTuneCoarse.morphWheel'
  | 'slotBCommon.oscTuneCoarse.morphPedal'
  | 'slotBCommon.oscTuneCoarse.morphAfterTouch'
  | 'slotBCommon.oscTuneCoarse.morphVelocity'
  | 'slotBCommon.oscDualMode'
  | 'slotBCommon.oscDualMode.morphImpulse'
  | 'slotBCommon.oscEnvAtk'
  | 'slotBCommon.oscEnvAtk.morphImpulse'
  | 'slotBCommon.oscEnvAtk.morphWheel'
  | 'slotBCommon.oscEnvAtk.morphPedal'
  | 'slotBCommon.oscEnvAtk.morphAfterTouch'
  | 'slotBCommon.oscEnvAtk.morphVelocity'
  | 'slotBCommon.oscEnvDcy'
  | 'slotBCommon.oscEnvDcy.morphImpulse'
  | 'slotBCommon.oscEnvDcy.morphWheel'
  | 'slotBCommon.oscEnvDcy.morphPedal'
  | 'slotBCommon.oscEnvDcy.morphAfterTouch'
  | 'slotBCommon.oscEnvDcy.morphVelocity'
  | 'slotBCommon.oscEnvAmt'
  | 'slotBCommon.oscEnvAmt.morphImpulse'
  | 'slotBCommon.oscEnvAmt.morphWheel'
  | 'slotBCommon.oscEnvAmt.morphPedal'
  | 'slotBCommon.oscEnvAmt.morphAfterTouch'
  | 'slotBCommon.oscEnvAmt.morphVelocity'
  | 'slotBCommon.oscEnvDst'
  | 'slotBCommon.oscEnvDst.morphImpulse'
  | 'slotBCommon.oscEnvMode'
  | 'slotBCommon.oscEnvMode.morphImpulse'
  | 'slotBCommon.oscEnvVel'
  | 'slotBCommon.oscWhlDir'
  | 'slotBCommon.smpNameHash'
  | 'slotBCommon.smpPresets'
  | 'slotBCommon.smpFastAtk'
  | 'slotBCommon.smpFastAtk.morphImpulse'
  | 'slotBCommon.smpVibRateUsageEol'
  | 'slotBArp.arpRun'
  | 'slotBArp.arpRun.morphImpulse'
  | 'slotBArp.arpTarget'
  | 'slotBArp.arpMode'
  | 'slotBArp.arpMode.morphImpulse'
  | 'slotBArp.arpModePtn'
  | 'slotBArp.arpModePtn.morphImpulse'
  | 'slotBArp.arpKbdSync'
  | 'slotBArp.arpKbdSync.morphImpulse'
  | 'slotBArp.arpRange'
  | 'slotBArp.arpRange.morphImpulse'
  | 'slotBArp.arpRange.morphWheel'
  | 'slotBArp.arpRange.morphPedal'
  | 'slotBArp.arpRange.morphAfterTouch'
  | 'slotBArp.arpRange.morphVelocity'
  | 'slotBArp.arpPattern'
  | 'slotBArp.arpPattern.morphImpulse'
  | 'slotBArp.arpZigZag'
  | 'slotBArp.arpZigZag.morphImpulse'
  | 'slotBArp.arpClkEnable'
  | 'slotBArp.arpRateClkDiv'
  | 'slotBArp.arpRateClkDiv.morphImpulse'
  | 'slotBArp.arpRateClkDiv.morphWheel'
  | 'slotBArp.arpRateClkDiv.morphPedal'
  | 'slotBArp.arpRateClkDiv.morphAfterTouch'
  | 'slotBArp.arpRateClkDiv.morphVelocity'
  | 'slotBArp.gateSeqLength'
  | 'slotBArp.gatePtnAcc'
  | 'slotBArp.gatePtnDur'
  | 'slotBArp.gatePtnPan'
  | 'slotBArp.gateSeqDivider'
  | 'slotBLfo.lfoDst'
  | 'slotBLfo.lfoDst.morphImpulse'
  | 'slotBLfo.lfoTarget'
  | 'slotBLfo.lfoWave'
  | 'slotBLfo.lfoWave.morphImpulse'
  | 'slotBLfo.lfoClkEnable'
  | 'slotBLfo.lfoRateClkDiv'
  | 'slotBLfo.lfoRateClkDiv.morphImpulse'
  | 'slotBLfo.lfoRateClkDiv.morphWheel'
  | 'slotBLfo.lfoRateClkDiv.morphPedal'
  | 'slotBLfo.lfoRateClkDiv.morphAfterTouch'
  | 'slotBLfo.lfoRateClkDiv.morphVelocity'
  | 'slotBLfo.lfoAmt'
  | 'slotBLfo.lfoAmt.morphImpulse'
  | 'slotBLfo.lfoAmt.morphWheel'
  | 'slotBLfo.lfoAmt.morphPedal'
  | 'slotBLfo.lfoAmt.morphAfterTouch'
  | 'slotBLfo.lfoAmt.morphVelocity'
  | 'slotBLfo.lfoWhlDir'
  | 'slotBFilter.fltTarget'
  | 'slotBFilter.fltType'
  | 'slotBFilter.fltType.morphImpulse'
  | 'slotBFilter.fltFreq'
  | 'slotBFilter.fltFreq.morphImpulse'
  | 'slotBFilter.fltFreq.morphWheel'
  | 'slotBFilter.fltFreq.morphPedal'
  | 'slotBFilter.fltFreq.morphAfterTouch'
  | 'slotBFilter.fltFreq.morphVelocity'
  | 'slotBFilter.fltRes'
  | 'slotBFilter.fltRes.morphImpulse'
  | 'slotBFilter.fltRes.morphWheel'
  | 'slotBFilter.fltRes.morphPedal'
  | 'slotBFilter.fltRes.morphAfterTouch'
  | 'slotBFilter.fltRes.morphVelocity'
  | 'slotBFilter.fltKbdTrk'
  | 'slotBFilter.fltKbdTrk.morphImpulse'
  | 'slotBFilter.fltDrive'
  | 'slotBFilter.fltDrive.morphImpulse'
  | 'slotBFilter.fltEnvAmt'
  | 'slotBFilter.fltEnvAmt.morphImpulse'
  | 'slotBFilter.fltEnvAmt.morphWheel'
  | 'slotBFilter.fltEnvAmt.morphPedal'
  | 'slotBFilter.fltEnvAmt.morphAfterTouch'
  | 'slotBFilter.fltEnvAmt.morphVelocity'
  | 'slotBFilter.fltEnvAtk'
  | 'slotBFilter.fltEnvAtk.morphImpulse'
  | 'slotBFilter.fltEnvAtk.morphWheel'
  | 'slotBFilter.fltEnvAtk.morphPedal'
  | 'slotBFilter.fltEnvAtk.morphAfterTouch'
  | 'slotBFilter.fltEnvAtk.morphVelocity'
  | 'slotBFilter.fltEnvDcy'
  | 'slotBFilter.fltEnvDcy.morphImpulse'
  | 'slotBFilter.fltEnvDcy.morphWheel'
  | 'slotBFilter.fltEnvDcy.morphPedal'
  | 'slotBFilter.fltEnvDcy.morphAfterTouch'
  | 'slotBFilter.fltEnvDcy.morphVelocity'
  | 'slotBFilter.fltEnvSus'
  | 'slotBFilter.fltEnvSus.morphImpulse'
  | 'slotBFilter.fltEnvSus.morphWheel'
  | 'slotBFilter.fltEnvSus.morphPedal'
  | 'slotBFilter.fltEnvSus.morphAfterTouch'
  | 'slotBFilter.fltEnvSus.morphVelocity'
  | 'slotBFilter.fltEnvRls'
  | 'slotBFilter.fltEnvRls.morphImpulse'
  | 'slotBFilter.fltEnvRls.morphWheel'
  | 'slotBFilter.fltEnvRls.morphPedal'
  | 'slotBFilter.fltEnvRls.morphAfterTouch'
  | 'slotBFilter.fltEnvRls.morphVelocity'
  | 'slotBFilter.fltEnvVel'
  | 'slotBFilter.fltEnvInv'
  | 'slotBFilter.fltEnvInv.morphImpulse'
  | 'slotBFilter.fltWhlDir'
  | 'slotBFilter.fltEnable'
  | 'slotBFilter.fltEnable.morphImpulse'
  | 'slotBAmpEnv.ampEnvTarget'
  | 'slotBAmpEnv.ampEnvAtk'
  | 'slotBAmpEnv.ampEnvAtk.morphImpulse'
  | 'slotBAmpEnv.ampEnvAtk.morphWheel'
  | 'slotBAmpEnv.ampEnvAtk.morphPedal'
  | 'slotBAmpEnv.ampEnvAtk.morphAfterTouch'
  | 'slotBAmpEnv.ampEnvAtk.morphVelocity'
  | 'slotBAmpEnv.ampEnvAtkFast'
  | 'slotBAmpEnv.ampEnvAtkFast.morphImpulse'
  | 'slotBAmpEnv.ampEnvDcy'
  | 'slotBAmpEnv.ampEnvDcy.morphImpulse'
  | 'slotBAmpEnv.ampEnvDcy.morphWheel'
  | 'slotBAmpEnv.ampEnvDcy.morphPedal'
  | 'slotBAmpEnv.ampEnvDcy.morphAfterTouch'
  | 'slotBAmpEnv.ampEnvDcy.morphVelocity'
  | 'slotBAmpEnv.ampEnvSus'
  | 'slotBAmpEnv.ampEnvSus.morphImpulse'
  | 'slotBAmpEnv.ampEnvSus.morphWheel'
  | 'slotBAmpEnv.ampEnvSus.morphPedal'
  | 'slotBAmpEnv.ampEnvSus.morphAfterTouch'
  | 'slotBAmpEnv.ampEnvSus.morphVelocity'
  | 'slotBAmpEnv.ampEnvRls'
  | 'slotBAmpEnv.ampEnvRls.morphImpulse'
  | 'slotBAmpEnv.ampEnvRls.morphWheel'
  | 'slotBAmpEnv.ampEnvRls.morphPedal'
  | 'slotBAmpEnv.ampEnvRls.morphAfterTouch'
  | 'slotBAmpEnv.ampEnvRls.morphVelocity'
  | 'slotBAmpEnv.ampEnvVel'
  | 'slotBFx.fxTarget'
  | 'slotBFx.fxClkEnable'
  | 'slotBFx.fxType'
  | 'slotBFx.fxType.morphImpulse'
  | 'slotBFx.fxRateClkDiv'
  | 'slotBFx.fxRateClkDiv.morphImpulse'
  | 'slotBFx.fxRateClkDiv.morphWheel'
  | 'slotBFx.fxRateClkDiv.morphPedal'
  | 'slotBFx.fxRateClkDiv.morphAfterTouch'
  | 'slotBFx.fxRateClkDiv.morphVelocity'
  | 'slotBFx.fxAmt'
  | 'slotBFx.fxAmt.morphImpulse'
  | 'slotBFx.fxAmt.morphWheel'
  | 'slotBFx.fxAmt.morphPedal'
  | 'slotBFx.fxAmt.morphAfterTouch'
  | 'slotBFx.fxAmt.morphVelocity'
  | 'slotBFx.fxEnable'
  | 'slotBFx.fxEnable.morphImpulse'
  | 'slotBEq.eqTarget'
  | 'slotBEq.eqType'
  | 'slotBEq.eqTreble'
  | 'slotBEq.eqBass'
  | 'slotBEq.eqMidFreq'
  | 'slotBEq.eqMidGain'
  | 'slotBEq.eqDrive'
  | 'slotBEq.eqDrive.morphImpulse'
  | 'slotBEq.eqDrive.morphWheel'
  | 'slotBEq.eqDrive.morphPedal'
  | 'slotBEq.eqDrive.morphAfterTouch'
  | 'slotBEq.eqDrive.morphVelocity'
  | 'slotBEq.eqEnable'
  | 'slotBEq.eqEnable.morphImpulse'
  | 'slotBDelay.dlyTarget'
  | 'slotBDelay.dlyClkEnable'
  | 'slotBDelay.dlyRateClkDiv'
  | 'slotBDelay.dlyRateClkDiv.morphImpulse'
  | 'slotBDelay.dlyRateClkDiv.morphWheel'
  | 'slotBDelay.dlyRateClkDiv.morphPedal'
  | 'slotBDelay.dlyRateClkDiv.morphAfterTouch'
  | 'slotBDelay.dlyRateClkDiv.morphVelocity'
  | 'slotBDelay.dlyMix'
  | 'slotBDelay.dlyMix.morphImpulse'
  | 'slotBDelay.dlyMix.morphWheel'
  | 'slotBDelay.dlyMix.morphPedal'
  | 'slotBDelay.dlyMix.morphAfterTouch'
  | 'slotBDelay.dlyMix.morphVelocity'
  | 'slotBDelay.dlyMode'
  | 'slotBDelay.dlyMode.morphImpulse'
  | 'slotBDelay.dlyFbkPingPong'
  | 'slotBDelay.dlyFbkPingPong.morphImpulse'
  | 'slotBDelay.dlyFbkFilt'
  | 'slotBDelay.dlyFbkFilt.morphImpulse'
  | 'slotBDelay.dlyFbkAmt'
  | 'slotBDelay.dlyFbkAmt.morphImpulse'
  | 'slotBDelay.dlyFbkAmt.morphWheel'
  | 'slotBDelay.dlyFbkAmt.morphPedal'
  | 'slotBDelay.dlyFbkAmt.morphAfterTouch'
  | 'slotBDelay.dlyFbkAmt.morphVelocity'
  | 'slotBDelay.dlyFbkFx'
  | 'slotBDelay.dlyFbkFx.morphImpulse'
  | 'slotBDelay.dlyFbkDeep'
  | 'slotBDelay.dlyFbkDeep.morphImpulse'
  | 'slotBDelay.dlyEnable'
  | 'slotBDelay.dlyEnable.morphImpulse'
  | 'slotBReverb.rvbTarget'
  | 'slotBReverb.rvbType'
  | 'slotBReverb.rvbType.morphImpulse'
  | 'slotBReverb.rvbColor'
  | 'slotBReverb.rvbColor.morphImpulse'
  | 'slotBReverb.rvbModulate'
  | 'slotBReverb.rvbModulate.morphImpulse'
  | 'slotBReverb.rvbAmt'
  | 'slotBReverb.rvbAmt.morphImpulse'
  | 'slotBReverb.rvbAmt.morphWheel'
  | 'slotBReverb.rvbAmt.morphPedal'
  | 'slotBReverb.rvbAmt.morphAfterTouch'
  | 'slotBReverb.rvbAmt.morphVelocity'
  | 'slotBReverb.rvbEnable'
  | 'slotBReverb.rvbEnable.morphImpulse'
  | 'slotBVibrato.vibratoRate'
  | 'slotBVibrato.vibratoAmount'
  | 'slotCCommon.octaveShift'
  | 'slotCCommon.octaveShift.morphImpulse'
  | 'slotCCommon.pitchStickEnable'
  | 'slotCCommon.sustainEnable'
  | 'slotCCommon.kbdHoldEnable'
  | 'slotCCommon.vibratoMode'
  | 'slotCCommon.vibratoMode.morphImpulse'
  | 'slotCCommon.voiceMode'
  | 'slotCCommon.voiceMode.morphImpulse'
  | 'slotCCommon.glideRate'
  | 'slotCCommon.glideRate.morphImpulse'
  | 'slotCCommon.glideRate.morphWheel'
  | 'slotCCommon.glideRate.morphPedal'
  | 'slotCCommon.glideRate.morphAfterTouch'
  | 'slotCCommon.glideRate.morphVelocity'
  | 'slotCCommon.oscBank'
  | 'slotCCommon.oscWave'
  | 'slotCCommon.oscCtrl'
  | 'slotCCommon.oscCtrl.morphImpulse'
  | 'slotCCommon.oscCtrl.morphWheel'
  | 'slotCCommon.oscCtrl.morphPedal'
  | 'slotCCommon.oscCtrl.morphAfterTouch'
  | 'slotCCommon.oscCtrl.morphVelocity'
  | 'slotCCommon.oscTuneFine'
  | 'slotCCommon.oscTuneFine.morphImpulse'
  | 'slotCCommon.oscTuneFine.morphWheel'
  | 'slotCCommon.oscTuneFine.morphPedal'
  | 'slotCCommon.oscTuneFine.morphAfterTouch'
  | 'slotCCommon.oscTuneFine.morphVelocity'
  | 'slotCCommon.oscTuneCoarse'
  | 'slotCCommon.oscTuneCoarse.morphImpulse'
  | 'slotCCommon.oscTuneCoarse.morphWheel'
  | 'slotCCommon.oscTuneCoarse.morphPedal'
  | 'slotCCommon.oscTuneCoarse.morphAfterTouch'
  | 'slotCCommon.oscTuneCoarse.morphVelocity'
  | 'slotCCommon.oscDualMode'
  | 'slotCCommon.oscDualMode.morphImpulse'
  | 'slotCCommon.oscEnvAtk'
  | 'slotCCommon.oscEnvAtk.morphImpulse'
  | 'slotCCommon.oscEnvAtk.morphWheel'
  | 'slotCCommon.oscEnvAtk.morphPedal'
  | 'slotCCommon.oscEnvAtk.morphAfterTouch'
  | 'slotCCommon.oscEnvAtk.morphVelocity'
  | 'slotCCommon.oscEnvDcy'
  | 'slotCCommon.oscEnvDcy.morphImpulse'
  | 'slotCCommon.oscEnvDcy.morphWheel'
  | 'slotCCommon.oscEnvDcy.morphPedal'
  | 'slotCCommon.oscEnvDcy.morphAfterTouch'
  | 'slotCCommon.oscEnvDcy.morphVelocity'
  | 'slotCCommon.oscEnvAmt'
  | 'slotCCommon.oscEnvAmt.morphImpulse'
  | 'slotCCommon.oscEnvAmt.morphWheel'
  | 'slotCCommon.oscEnvAmt.morphPedal'
  | 'slotCCommon.oscEnvAmt.morphAfterTouch'
  | 'slotCCommon.oscEnvAmt.morphVelocity'
  | 'slotCCommon.oscEnvDst'
  | 'slotCCommon.oscEnvDst.morphImpulse'
  | 'slotCCommon.oscEnvMode'
  | 'slotCCommon.oscEnvMode.morphImpulse'
  | 'slotCCommon.oscEnvVel'
  | 'slotCCommon.oscWhlDir'
  | 'slotCCommon.smpNameHash'
  | 'slotCCommon.smpPresets'
  | 'slotCCommon.smpFastAtk'
  | 'slotCCommon.smpFastAtk.morphImpulse'
  | 'slotCCommon.smpVibRateUsageEol'
  | 'slotCArp.arpRun'
  | 'slotCArp.arpRun.morphImpulse'
  | 'slotCArp.arpTarget'
  | 'slotCArp.arpMode'
  | 'slotCArp.arpMode.morphImpulse'
  | 'slotCArp.arpModePtn'
  | 'slotCArp.arpModePtn.morphImpulse'
  | 'slotCArp.arpKbdSync'
  | 'slotCArp.arpKbdSync.morphImpulse'
  | 'slotCArp.arpRange'
  | 'slotCArp.arpRange.morphImpulse'
  | 'slotCArp.arpRange.morphWheel'
  | 'slotCArp.arpRange.morphPedal'
  | 'slotCArp.arpRange.morphAfterTouch'
  | 'slotCArp.arpRange.morphVelocity'
  | 'slotCArp.arpPattern'
  | 'slotCArp.arpPattern.morphImpulse'
  | 'slotCArp.arpZigZag'
  | 'slotCArp.arpZigZag.morphImpulse'
  | 'slotCArp.arpClkEnable'
  | 'slotCArp.arpRateClkDiv'
  | 'slotCArp.arpRateClkDiv.morphImpulse'
  | 'slotCArp.arpRateClkDiv.morphWheel'
  | 'slotCArp.arpRateClkDiv.morphPedal'
  | 'slotCArp.arpRateClkDiv.morphAfterTouch'
  | 'slotCArp.arpRateClkDiv.morphVelocity'
  | 'slotCArp.gateSeqLength'
  | 'slotCArp.gatePtnAcc'
  | 'slotCArp.gatePtnDur'
  | 'slotCArp.gatePtnPan'
  | 'slotCArp.gateSeqDivider'
  | 'slotCLfo.lfoDst'
  | 'slotCLfo.lfoDst.morphImpulse'
  | 'slotCLfo.lfoTarget'
  | 'slotCLfo.lfoWave'
  | 'slotCLfo.lfoWave.morphImpulse'
  | 'slotCLfo.lfoClkEnable'
  | 'slotCLfo.lfoRateClkDiv'
  | 'slotCLfo.lfoRateClkDiv.morphImpulse'
  | 'slotCLfo.lfoRateClkDiv.morphWheel'
  | 'slotCLfo.lfoRateClkDiv.morphPedal'
  | 'slotCLfo.lfoRateClkDiv.morphAfterTouch'
  | 'slotCLfo.lfoRateClkDiv.morphVelocity'
  | 'slotCLfo.lfoAmt'
  | 'slotCLfo.lfoAmt.morphImpulse'
  | 'slotCLfo.lfoAmt.morphWheel'
  | 'slotCLfo.lfoAmt.morphPedal'
  | 'slotCLfo.lfoAmt.morphAfterTouch'
  | 'slotCLfo.lfoAmt.morphVelocity'
  | 'slotCLfo.lfoWhlDir'
  | 'slotCFilter.fltTarget'
  | 'slotCFilter.fltType'
  | 'slotCFilter.fltType.morphImpulse'
  | 'slotCFilter.fltFreq'
  | 'slotCFilter.fltFreq.morphImpulse'
  | 'slotCFilter.fltFreq.morphWheel'
  | 'slotCFilter.fltFreq.morphPedal'
  | 'slotCFilter.fltFreq.morphAfterTouch'
  | 'slotCFilter.fltFreq.morphVelocity'
  | 'slotCFilter.fltRes'
  | 'slotCFilter.fltRes.morphImpulse'
  | 'slotCFilter.fltRes.morphWheel'
  | 'slotCFilter.fltRes.morphPedal'
  | 'slotCFilter.fltRes.morphAfterTouch'
  | 'slotCFilter.fltRes.morphVelocity'
  | 'slotCFilter.fltKbdTrk'
  | 'slotCFilter.fltKbdTrk.morphImpulse'
  | 'slotCFilter.fltDrive'
  | 'slotCFilter.fltDrive.morphImpulse'
  | 'slotCFilter.fltEnvAmt'
  | 'slotCFilter.fltEnvAmt.morphImpulse'
  | 'slotCFilter.fltEnvAmt.morphWheel'
  | 'slotCFilter.fltEnvAmt.morphPedal'
  | 'slotCFilter.fltEnvAmt.morphAfterTouch'
  | 'slotCFilter.fltEnvAmt.morphVelocity'
  | 'slotCFilter.fltEnvAtk'
  | 'slotCFilter.fltEnvAtk.morphImpulse'
  | 'slotCFilter.fltEnvAtk.morphWheel'
  | 'slotCFilter.fltEnvAtk.morphPedal'
  | 'slotCFilter.fltEnvAtk.morphAfterTouch'
  | 'slotCFilter.fltEnvAtk.morphVelocity'
  | 'slotCFilter.fltEnvDcy'
  | 'slotCFilter.fltEnvDcy.morphImpulse'
  | 'slotCFilter.fltEnvDcy.morphWheel'
  | 'slotCFilter.fltEnvDcy.morphPedal'
  | 'slotCFilter.fltEnvDcy.morphAfterTouch'
  | 'slotCFilter.fltEnvDcy.morphVelocity'
  | 'slotCFilter.fltEnvSus'
  | 'slotCFilter.fltEnvSus.morphImpulse'
  | 'slotCFilter.fltEnvSus.morphWheel'
  | 'slotCFilter.fltEnvSus.morphPedal'
  | 'slotCFilter.fltEnvSus.morphAfterTouch'
  | 'slotCFilter.fltEnvSus.morphVelocity'
  | 'slotCFilter.fltEnvRls'
  | 'slotCFilter.fltEnvRls.morphImpulse'
  | 'slotCFilter.fltEnvRls.morphWheel'
  | 'slotCFilter.fltEnvRls.morphPedal'
  | 'slotCFilter.fltEnvRls.morphAfterTouch'
  | 'slotCFilter.fltEnvRls.morphVelocity'
  | 'slotCFilter.fltEnvVel'
  | 'slotCFilter.fltEnvInv'
  | 'slotCFilter.fltEnvInv.morphImpulse'
  | 'slotCFilter.fltWhlDir'
  | 'slotCFilter.fltEnable'
  | 'slotCFilter.fltEnable.morphImpulse'
  | 'slotCAmpEnv.ampEnvTarget'
  | 'slotCAmpEnv.ampEnvAtk'
  | 'slotCAmpEnv.ampEnvAtk.morphImpulse'
  | 'slotCAmpEnv.ampEnvAtk.morphWheel'
  | 'slotCAmpEnv.ampEnvAtk.morphPedal'
  | 'slotCAmpEnv.ampEnvAtk.morphAfterTouch'
  | 'slotCAmpEnv.ampEnvAtk.morphVelocity'
  | 'slotCAmpEnv.ampEnvAtkFast'
  | 'slotCAmpEnv.ampEnvAtkFast.morphImpulse'
  | 'slotCAmpEnv.ampEnvDcy'
  | 'slotCAmpEnv.ampEnvDcy.morphImpulse'
  | 'slotCAmpEnv.ampEnvDcy.morphWheel'
  | 'slotCAmpEnv.ampEnvDcy.morphPedal'
  | 'slotCAmpEnv.ampEnvDcy.morphAfterTouch'
  | 'slotCAmpEnv.ampEnvDcy.morphVelocity'
  | 'slotCAmpEnv.ampEnvSus'
  | 'slotCAmpEnv.ampEnvSus.morphImpulse'
  | 'slotCAmpEnv.ampEnvSus.morphWheel'
  | 'slotCAmpEnv.ampEnvSus.morphPedal'
  | 'slotCAmpEnv.ampEnvSus.morphAfterTouch'
  | 'slotCAmpEnv.ampEnvSus.morphVelocity'
  | 'slotCAmpEnv.ampEnvRls'
  | 'slotCAmpEnv.ampEnvRls.morphImpulse'
  | 'slotCAmpEnv.ampEnvRls.morphWheel'
  | 'slotCAmpEnv.ampEnvRls.morphPedal'
  | 'slotCAmpEnv.ampEnvRls.morphAfterTouch'
  | 'slotCAmpEnv.ampEnvRls.morphVelocity'
  | 'slotCAmpEnv.ampEnvVel'
  | 'slotCFx.fxTarget'
  | 'slotCFx.fxClkEnable'
  | 'slotCFx.fxType'
  | 'slotCFx.fxType.morphImpulse'
  | 'slotCFx.fxRateClkDiv'
  | 'slotCFx.fxRateClkDiv.morphImpulse'
  | 'slotCFx.fxRateClkDiv.morphWheel'
  | 'slotCFx.fxRateClkDiv.morphPedal'
  | 'slotCFx.fxRateClkDiv.morphAfterTouch'
  | 'slotCFx.fxRateClkDiv.morphVelocity'
  | 'slotCFx.fxAmt'
  | 'slotCFx.fxAmt.morphImpulse'
  | 'slotCFx.fxAmt.morphWheel'
  | 'slotCFx.fxAmt.morphPedal'
  | 'slotCFx.fxAmt.morphAfterTouch'
  | 'slotCFx.fxAmt.morphVelocity'
  | 'slotCFx.fxEnable'
  | 'slotCFx.fxEnable.morphImpulse'
  | 'slotCEq.eqTarget'
  | 'slotCEq.eqType'
  | 'slotCEq.eqTreble'
  | 'slotCEq.eqBass'
  | 'slotCEq.eqMidFreq'
  | 'slotCEq.eqMidGain'
  | 'slotCEq.eqDrive'
  | 'slotCEq.eqDrive.morphImpulse'
  | 'slotCEq.eqDrive.morphWheel'
  | 'slotCEq.eqDrive.morphPedal'
  | 'slotCEq.eqDrive.morphAfterTouch'
  | 'slotCEq.eqDrive.morphVelocity'
  | 'slotCEq.eqEnable'
  | 'slotCEq.eqEnable.morphImpulse'
  | 'slotCDelay.dlyTarget'
  | 'slotCDelay.dlyClkEnable'
  | 'slotCDelay.dlyRateClkDiv'
  | 'slotCDelay.dlyRateClkDiv.morphImpulse'
  | 'slotCDelay.dlyRateClkDiv.morphWheel'
  | 'slotCDelay.dlyRateClkDiv.morphPedal'
  | 'slotCDelay.dlyRateClkDiv.morphAfterTouch'
  | 'slotCDelay.dlyRateClkDiv.morphVelocity'
  | 'slotCDelay.dlyMix'
  | 'slotCDelay.dlyMix.morphImpulse'
  | 'slotCDelay.dlyMix.morphWheel'
  | 'slotCDelay.dlyMix.morphPedal'
  | 'slotCDelay.dlyMix.morphAfterTouch'
  | 'slotCDelay.dlyMix.morphVelocity'
  | 'slotCDelay.dlyMode'
  | 'slotCDelay.dlyMode.morphImpulse'
  | 'slotCDelay.dlyFbkPingPong'
  | 'slotCDelay.dlyFbkPingPong.morphImpulse'
  | 'slotCDelay.dlyFbkFilt'
  | 'slotCDelay.dlyFbkFilt.morphImpulse'
  | 'slotCDelay.dlyFbkAmt'
  | 'slotCDelay.dlyFbkAmt.morphImpulse'
  | 'slotCDelay.dlyFbkAmt.morphWheel'
  | 'slotCDelay.dlyFbkAmt.morphPedal'
  | 'slotCDelay.dlyFbkAmt.morphAfterTouch'
  | 'slotCDelay.dlyFbkAmt.morphVelocity'
  | 'slotCDelay.dlyFbkFx'
  | 'slotCDelay.dlyFbkFx.morphImpulse'
  | 'slotCDelay.dlyFbkDeep'
  | 'slotCDelay.dlyFbkDeep.morphImpulse'
  | 'slotCDelay.dlyEnable'
  | 'slotCDelay.dlyEnable.morphImpulse'
  | 'slotCReverb.rvbTarget'
  | 'slotCReverb.rvbType'
  | 'slotCReverb.rvbType.morphImpulse'
  | 'slotCReverb.rvbColor'
  | 'slotCReverb.rvbColor.morphImpulse'
  | 'slotCReverb.rvbModulate'
  | 'slotCReverb.rvbModulate.morphImpulse'
  | 'slotCReverb.rvbAmt'
  | 'slotCReverb.rvbAmt.morphImpulse'
  | 'slotCReverb.rvbAmt.morphWheel'
  | 'slotCReverb.rvbAmt.morphPedal'
  | 'slotCReverb.rvbAmt.morphAfterTouch'
  | 'slotCReverb.rvbAmt.morphVelocity'
  | 'slotCReverb.rvbEnable'
  | 'slotCReverb.rvbEnable.morphImpulse'
  | 'slotCVibrato.vibratoRate'
  | 'slotCVibrato.vibratoAmount'
  | 'slotDCommon.octaveShift'
  | 'slotDCommon.octaveShift.morphImpulse'
  | 'slotDCommon.pitchStickEnable'
  | 'slotDCommon.sustainEnable'
  | 'slotDCommon.kbdHoldEnable'
  | 'slotDCommon.vibratoMode'
  | 'slotDCommon.vibratoMode.morphImpulse'
  | 'slotDCommon.voiceMode'
  | 'slotDCommon.voiceMode.morphImpulse'
  | 'slotDCommon.glideRate'
  | 'slotDCommon.glideRate.morphImpulse'
  | 'slotDCommon.glideRate.morphWheel'
  | 'slotDCommon.glideRate.morphPedal'
  | 'slotDCommon.glideRate.morphAfterTouch'
  | 'slotDCommon.glideRate.morphVelocity'
  | 'slotDCommon.oscBank'
  | 'slotDCommon.oscWave'
  | 'slotDCommon.oscCtrl'
  | 'slotDCommon.oscCtrl.morphImpulse'
  | 'slotDCommon.oscCtrl.morphWheel'
  | 'slotDCommon.oscCtrl.morphPedal'
  | 'slotDCommon.oscCtrl.morphAfterTouch'
  | 'slotDCommon.oscCtrl.morphVelocity'
  | 'slotDCommon.oscTuneFine'
  | 'slotDCommon.oscTuneFine.morphImpulse'
  | 'slotDCommon.oscTuneFine.morphWheel'
  | 'slotDCommon.oscTuneFine.morphPedal'
  | 'slotDCommon.oscTuneFine.morphAfterTouch'
  | 'slotDCommon.oscTuneFine.morphVelocity'
  | 'slotDCommon.oscTuneCoarse'
  | 'slotDCommon.oscTuneCoarse.morphImpulse'
  | 'slotDCommon.oscTuneCoarse.morphWheel'
  | 'slotDCommon.oscTuneCoarse.morphPedal'
  | 'slotDCommon.oscTuneCoarse.morphAfterTouch'
  | 'slotDCommon.oscTuneCoarse.morphVelocity'
  | 'slotDCommon.oscDualMode'
  | 'slotDCommon.oscDualMode.morphImpulse'
  | 'slotDCommon.oscEnvAtk'
  | 'slotDCommon.oscEnvAtk.morphImpulse'
  | 'slotDCommon.oscEnvAtk.morphWheel'
  | 'slotDCommon.oscEnvAtk.morphPedal'
  | 'slotDCommon.oscEnvAtk.morphAfterTouch'
  | 'slotDCommon.oscEnvAtk.morphVelocity'
  | 'slotDCommon.oscEnvDcy'
  | 'slotDCommon.oscEnvDcy.morphImpulse'
  | 'slotDCommon.oscEnvDcy.morphWheel'
  | 'slotDCommon.oscEnvDcy.morphPedal'
  | 'slotDCommon.oscEnvDcy.morphAfterTouch'
  | 'slotDCommon.oscEnvDcy.morphVelocity'
  | 'slotDCommon.oscEnvAmt'
  | 'slotDCommon.oscEnvAmt.morphImpulse'
  | 'slotDCommon.oscEnvAmt.morphWheel'
  | 'slotDCommon.oscEnvAmt.morphPedal'
  | 'slotDCommon.oscEnvAmt.morphAfterTouch'
  | 'slotDCommon.oscEnvAmt.morphVelocity'
  | 'slotDCommon.oscEnvDst'
  | 'slotDCommon.oscEnvDst.morphImpulse'
  | 'slotDCommon.oscEnvMode'
  | 'slotDCommon.oscEnvMode.morphImpulse'
  | 'slotDCommon.oscEnvVel'
  | 'slotDCommon.oscWhlDir'
  | 'slotDCommon.smpNameHash'
  | 'slotDCommon.smpPresets'
  | 'slotDCommon.smpFastAtk'
  | 'slotDCommon.smpFastAtk.morphImpulse'
  | 'slotDCommon.smpVibRateUsageEol'
  | 'slotDArp.arpRun'
  | 'slotDArp.arpRun.morphImpulse'
  | 'slotDArp.arpTarget'
  | 'slotDArp.arpMode'
  | 'slotDArp.arpMode.morphImpulse'
  | 'slotDArp.arpModePtn'
  | 'slotDArp.arpModePtn.morphImpulse'
  | 'slotDArp.arpKbdSync'
  | 'slotDArp.arpKbdSync.morphImpulse'
  | 'slotDArp.arpRange'
  | 'slotDArp.arpRange.morphImpulse'
  | 'slotDArp.arpRange.morphWheel'
  | 'slotDArp.arpRange.morphPedal'
  | 'slotDArp.arpRange.morphAfterTouch'
  | 'slotDArp.arpRange.morphVelocity'
  | 'slotDArp.arpPattern'
  | 'slotDArp.arpPattern.morphImpulse'
  | 'slotDArp.arpZigZag'
  | 'slotDArp.arpZigZag.morphImpulse'
  | 'slotDArp.arpClkEnable'
  | 'slotDArp.arpRateClkDiv'
  | 'slotDArp.arpRateClkDiv.morphImpulse'
  | 'slotDArp.arpRateClkDiv.morphWheel'
  | 'slotDArp.arpRateClkDiv.morphPedal'
  | 'slotDArp.arpRateClkDiv.morphAfterTouch'
  | 'slotDArp.arpRateClkDiv.morphVelocity'
  | 'slotDArp.gateSeqLength'
  | 'slotDArp.gatePtnAcc'
  | 'slotDArp.gatePtnDur'
  | 'slotDArp.gatePtnPan'
  | 'slotDArp.gateSeqDivider'
  | 'slotDLfo.lfoDst'
  | 'slotDLfo.lfoDst.morphImpulse'
  | 'slotDLfo.lfoTarget'
  | 'slotDLfo.lfoWave'
  | 'slotDLfo.lfoWave.morphImpulse'
  | 'slotDLfo.lfoClkEnable'
  | 'slotDLfo.lfoRateClkDiv'
  | 'slotDLfo.lfoRateClkDiv.morphImpulse'
  | 'slotDLfo.lfoRateClkDiv.morphWheel'
  | 'slotDLfo.lfoRateClkDiv.morphPedal'
  | 'slotDLfo.lfoRateClkDiv.morphAfterTouch'
  | 'slotDLfo.lfoRateClkDiv.morphVelocity'
  | 'slotDLfo.lfoAmt'
  | 'slotDLfo.lfoAmt.morphImpulse'
  | 'slotDLfo.lfoAmt.morphWheel'
  | 'slotDLfo.lfoAmt.morphPedal'
  | 'slotDLfo.lfoAmt.morphAfterTouch'
  | 'slotDLfo.lfoAmt.morphVelocity'
  | 'slotDLfo.lfoWhlDir'
  | 'slotDFilter.fltTarget'
  | 'slotDFilter.fltType'
  | 'slotDFilter.fltType.morphImpulse'
  | 'slotDFilter.fltFreq'
  | 'slotDFilter.fltFreq.morphImpulse'
  | 'slotDFilter.fltFreq.morphWheel'
  | 'slotDFilter.fltFreq.morphPedal'
  | 'slotDFilter.fltFreq.morphAfterTouch'
  | 'slotDFilter.fltFreq.morphVelocity'
  | 'slotDFilter.fltRes'
  | 'slotDFilter.fltRes.morphImpulse'
  | 'slotDFilter.fltRes.morphWheel'
  | 'slotDFilter.fltRes.morphPedal'
  | 'slotDFilter.fltRes.morphAfterTouch'
  | 'slotDFilter.fltRes.morphVelocity'
  | 'slotDFilter.fltKbdTrk'
  | 'slotDFilter.fltKbdTrk.morphImpulse'
  | 'slotDFilter.fltDrive'
  | 'slotDFilter.fltDrive.morphImpulse'
  | 'slotDFilter.fltEnvAmt'
  | 'slotDFilter.fltEnvAmt.morphImpulse'
  | 'slotDFilter.fltEnvAmt.morphWheel'
  | 'slotDFilter.fltEnvAmt.morphPedal'
  | 'slotDFilter.fltEnvAmt.morphAfterTouch'
  | 'slotDFilter.fltEnvAmt.morphVelocity'
  | 'slotDFilter.fltEnvAtk'
  | 'slotDFilter.fltEnvAtk.morphImpulse'
  | 'slotDFilter.fltEnvAtk.morphWheel'
  | 'slotDFilter.fltEnvAtk.morphPedal'
  | 'slotDFilter.fltEnvAtk.morphAfterTouch'
  | 'slotDFilter.fltEnvAtk.morphVelocity'
  | 'slotDFilter.fltEnvDcy'
  | 'slotDFilter.fltEnvDcy.morphImpulse'
  | 'slotDFilter.fltEnvDcy.morphWheel'
  | 'slotDFilter.fltEnvDcy.morphPedal'
  | 'slotDFilter.fltEnvDcy.morphAfterTouch'
  | 'slotDFilter.fltEnvDcy.morphVelocity'
  | 'slotDFilter.fltEnvSus'
  | 'slotDFilter.fltEnvSus.morphImpulse'
  | 'slotDFilter.fltEnvSus.morphWheel'
  | 'slotDFilter.fltEnvSus.morphPedal'
  | 'slotDFilter.fltEnvSus.morphAfterTouch'
  | 'slotDFilter.fltEnvSus.morphVelocity'
  | 'slotDFilter.fltEnvRls'
  | 'slotDFilter.fltEnvRls.morphImpulse'
  | 'slotDFilter.fltEnvRls.morphWheel'
  | 'slotDFilter.fltEnvRls.morphPedal'
  | 'slotDFilter.fltEnvRls.morphAfterTouch'
  | 'slotDFilter.fltEnvRls.morphVelocity'
  | 'slotDFilter.fltEnvVel'
  | 'slotDFilter.fltEnvInv'
  | 'slotDFilter.fltEnvInv.morphImpulse'
  | 'slotDFilter.fltWhlDir'
  | 'slotDFilter.fltEnable'
  | 'slotDFilter.fltEnable.morphImpulse'
  | 'slotDAmpEnv.ampEnvTarget'
  | 'slotDAmpEnv.ampEnvAtk'
  | 'slotDAmpEnv.ampEnvAtk.morphImpulse'
  | 'slotDAmpEnv.ampEnvAtk.morphWheel'
  | 'slotDAmpEnv.ampEnvAtk.morphPedal'
  | 'slotDAmpEnv.ampEnvAtk.morphAfterTouch'
  | 'slotDAmpEnv.ampEnvAtk.morphVelocity'
  | 'slotDAmpEnv.ampEnvAtkFast'
  | 'slotDAmpEnv.ampEnvAtkFast.morphImpulse'
  | 'slotDAmpEnv.ampEnvDcy'
  | 'slotDAmpEnv.ampEnvDcy.morphImpulse'
  | 'slotDAmpEnv.ampEnvDcy.morphWheel'
  | 'slotDAmpEnv.ampEnvDcy.morphPedal'
  | 'slotDAmpEnv.ampEnvDcy.morphAfterTouch'
  | 'slotDAmpEnv.ampEnvDcy.morphVelocity'
  | 'slotDAmpEnv.ampEnvSus'
  | 'slotDAmpEnv.ampEnvSus.morphImpulse'
  | 'slotDAmpEnv.ampEnvSus.morphWheel'
  | 'slotDAmpEnv.ampEnvSus.morphPedal'
  | 'slotDAmpEnv.ampEnvSus.morphAfterTouch'
  | 'slotDAmpEnv.ampEnvSus.morphVelocity'
  | 'slotDAmpEnv.ampEnvRls'
  | 'slotDAmpEnv.ampEnvRls.morphImpulse'
  | 'slotDAmpEnv.ampEnvRls.morphWheel'
  | 'slotDAmpEnv.ampEnvRls.morphPedal'
  | 'slotDAmpEnv.ampEnvRls.morphAfterTouch'
  | 'slotDAmpEnv.ampEnvRls.morphVelocity'
  | 'slotDAmpEnv.ampEnvVel'
  | 'slotDFx.fxTarget'
  | 'slotDFx.fxClkEnable'
  | 'slotDFx.fxType'
  | 'slotDFx.fxType.morphImpulse'
  | 'slotDFx.fxRateClkDiv'
  | 'slotDFx.fxRateClkDiv.morphImpulse'
  | 'slotDFx.fxRateClkDiv.morphWheel'
  | 'slotDFx.fxRateClkDiv.morphPedal'
  | 'slotDFx.fxRateClkDiv.morphAfterTouch'
  | 'slotDFx.fxRateClkDiv.morphVelocity'
  | 'slotDFx.fxAmt'
  | 'slotDFx.fxAmt.morphImpulse'
  | 'slotDFx.fxAmt.morphWheel'
  | 'slotDFx.fxAmt.morphPedal'
  | 'slotDFx.fxAmt.morphAfterTouch'
  | 'slotDFx.fxAmt.morphVelocity'
  | 'slotDFx.fxEnable'
  | 'slotDFx.fxEnable.morphImpulse'
  | 'slotDEq.eqTarget'
  | 'slotDEq.eqType'
  | 'slotDEq.eqTreble'
  | 'slotDEq.eqBass'
  | 'slotDEq.eqMidFreq'
  | 'slotDEq.eqMidGain'
  | 'slotDEq.eqDrive'
  | 'slotDEq.eqDrive.morphImpulse'
  | 'slotDEq.eqDrive.morphWheel'
  | 'slotDEq.eqDrive.morphPedal'
  | 'slotDEq.eqDrive.morphAfterTouch'
  | 'slotDEq.eqDrive.morphVelocity'
  | 'slotDEq.eqEnable'
  | 'slotDEq.eqEnable.morphImpulse'
  | 'slotDDelay.dlyTarget'
  | 'slotDDelay.dlyClkEnable'
  | 'slotDDelay.dlyRateClkDiv'
  | 'slotDDelay.dlyRateClkDiv.morphImpulse'
  | 'slotDDelay.dlyRateClkDiv.morphWheel'
  | 'slotDDelay.dlyRateClkDiv.morphPedal'
  | 'slotDDelay.dlyRateClkDiv.morphAfterTouch'
  | 'slotDDelay.dlyRateClkDiv.morphVelocity'
  | 'slotDDelay.dlyMix'
  | 'slotDDelay.dlyMix.morphImpulse'
  | 'slotDDelay.dlyMix.morphWheel'
  | 'slotDDelay.dlyMix.morphPedal'
  | 'slotDDelay.dlyMix.morphAfterTouch'
  | 'slotDDelay.dlyMix.morphVelocity'
  | 'slotDDelay.dlyMode'
  | 'slotDDelay.dlyMode.morphImpulse'
  | 'slotDDelay.dlyFbkPingPong'
  | 'slotDDelay.dlyFbkPingPong.morphImpulse'
  | 'slotDDelay.dlyFbkFilt'
  | 'slotDDelay.dlyFbkFilt.morphImpulse'
  | 'slotDDelay.dlyFbkAmt'
  | 'slotDDelay.dlyFbkAmt.morphImpulse'
  | 'slotDDelay.dlyFbkAmt.morphWheel'
  | 'slotDDelay.dlyFbkAmt.morphPedal'
  | 'slotDDelay.dlyFbkAmt.morphAfterTouch'
  | 'slotDDelay.dlyFbkAmt.morphVelocity'
  | 'slotDDelay.dlyFbkFx'
  | 'slotDDelay.dlyFbkFx.morphImpulse'
  | 'slotDDelay.dlyFbkDeep'
  | 'slotDDelay.dlyFbkDeep.morphImpulse'
  | 'slotDDelay.dlyEnable'
  | 'slotDDelay.dlyEnable.morphImpulse'
  | 'slotDReverb.rvbTarget'
  | 'slotDReverb.rvbType'
  | 'slotDReverb.rvbType.morphImpulse'
  | 'slotDReverb.rvbColor'
  | 'slotDReverb.rvbColor.morphImpulse'
  | 'slotDReverb.rvbModulate'
  | 'slotDReverb.rvbModulate.morphImpulse'
  | 'slotDReverb.rvbAmt'
  | 'slotDReverb.rvbAmt.morphImpulse'
  | 'slotDReverb.rvbAmt.morphWheel'
  | 'slotDReverb.rvbAmt.morphPedal'
  | 'slotDReverb.rvbAmt.morphAfterTouch'
  | 'slotDReverb.rvbAmt.morphVelocity'
  | 'slotDReverb.rvbEnable'
  | 'slotDReverb.rvbEnable.morphImpulse'
  | 'slotDVibrato.vibratoRate'
  | 'slotDVibrato.vibratoAmount';

/** Fields 0–499 (see the generator's TS2590 note). */
const FIELDS_0: readonly FwField<Nw2FieldKey>[] = [
  { key: 'common.slotFocus', name: 'Edt_Com_kSlotFocus', block: 0, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 82' },
  { key: 'common.slotEnable', name: 'Edt_Com_kSlotEnable', block: 0, bit: 2, width: 4, min: 1, max: 15, def: 1, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 83' },
  { key: 'common.slotGroup', name: 'Edt_Com_kSlotGroup', block: 0, bit: 6, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 84' },
  { key: 'common.slotLock', name: 'Edt_Com_kSlotLock', block: 0, bit: 10, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 86' },
  { key: 'common.splEnable', name: 'Edt_Com_kSplEnable', block: 0, bit: 11, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 113' },
  { key: 'common.splEnableLow', name: 'Edt_Com_kSplEnableLow', block: 0, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 114' },
  { key: 'common.splEnableMid', name: 'Edt_Com_kSplEnableMid', block: 0, bit: 13, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 115' },
  { key: 'common.splEnableHigh', name: 'Edt_Com_kSplEnableHigh', block: 0, bit: 14, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 116' },
  { key: 'common.splPosLow', name: 'Edt_Com_kSplPosLow', block: 0, bit: 15, width: 3, min: 0, max: 7, def: 1, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 117' },
  { key: 'common.splPosMid', name: 'Edt_Com_kSplPosMid', block: 0, bit: 18, width: 3, min: 0, max: 7, def: 4, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 118' },
  { key: 'common.splPosHigh', name: 'Edt_Com_kSplPosHigh', block: 0, bit: 21, width: 3, min: 0, max: 7, def: 7, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 119' },
  { key: 'common.splWidthLow', name: 'Edt_Com_kSplWidthLow', block: 0, bit: 24, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 120' },
  { key: 'common.splWidthMid', name: 'Edt_Com_kSplWidthMid', block: 0, bit: 26, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 121' },
  { key: 'common.splWidthHigh', name: 'Edt_Com_kSplWidthHigh', block: 0, bit: 28, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 122' },
  { key: 'common.transposeEnable', name: 'Edt_Com_kTransposeEnable', block: 0, bit: 30, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 96' },
  { key: 'common.transposeValue', name: 'Edt_Com_kTransposeValue', block: 0, bit: 31, width: 4, min: -6, max: 6, def: 1, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 97' },
  { key: 'common.kbdHold', name: 'Edt_Com_kKbdHold', block: 0, bit: 35, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 102' },
  { key: 'common.mstClkRate', name: 'Edt_Com_kMstClkRate', block: 0, bit: 36, width: 8, min: 30, max: 240, def: 120, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 98' },
  { key: 'common.mstClkKBS', name: 'Edt_Com_kMstClkKBS', block: 0, bit: 44, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 99' },
  { key: 'common.gainLevel', name: 'Edt_Com_kGainLevel', block: 0, bit: 45, width: 7, min: 0, max: 127, def: 95, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 103' },
  { key: 'common.slotLevelA', name: 'Edt_Com_kSlotLevelA', block: 0, bit: 52, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88' },
  { key: 'common.slotLevelA.morphImpulse', name: 'Edt_Com_kSlotLevelA@Impulse', block: 0, bit: 59, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88 · Impulse morph' },
  { key: 'common.slotLevelA.morphWheel', name: 'Edt_Com_kSlotLevelA@Wheel', block: 0, bit: 67, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88 · Wheel morph' },
  { key: 'common.slotLevelA.morphPedal', name: 'Edt_Com_kSlotLevelA@Pedal', block: 0, bit: 75, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88 · Pedal morph' },
  { key: 'common.slotLevelA.morphAfterTouch', name: 'Edt_Com_kSlotLevelA@ATouch', block: 0, bit: 83, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88 · ATouch morph' },
  { key: 'common.slotLevelA.morphVelocity', name: 'Edt_Com_kSlotLevelA@Velocity', block: 0, bit: 91, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 88 · Velocity morph' },
  { key: 'common.slotLevelB', name: 'Edt_Com_kSlotLevelB', block: 0, bit: 99, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89' },
  { key: 'common.slotLevelB.morphImpulse', name: 'Edt_Com_kSlotLevelB@Impulse', block: 0, bit: 106, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89 · Impulse morph' },
  { key: 'common.slotLevelB.morphWheel', name: 'Edt_Com_kSlotLevelB@Wheel', block: 0, bit: 114, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89 · Wheel morph' },
  { key: 'common.slotLevelB.morphPedal', name: 'Edt_Com_kSlotLevelB@Pedal', block: 0, bit: 122, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89 · Pedal morph' },
  { key: 'common.slotLevelB.morphAfterTouch', name: 'Edt_Com_kSlotLevelB@ATouch', block: 0, bit: 130, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89 · ATouch morph' },
  { key: 'common.slotLevelB.morphVelocity', name: 'Edt_Com_kSlotLevelB@Velocity', block: 0, bit: 138, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 89 · Velocity morph' },
  { key: 'common.slotLevelC', name: 'Edt_Com_kSlotLevelC', block: 0, bit: 146, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90' },
  { key: 'common.slotLevelC.morphImpulse', name: 'Edt_Com_kSlotLevelC@Impulse', block: 0, bit: 153, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90 · Impulse morph' },
  { key: 'common.slotLevelC.morphWheel', name: 'Edt_Com_kSlotLevelC@Wheel', block: 0, bit: 161, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90 · Wheel morph' },
  { key: 'common.slotLevelC.morphPedal', name: 'Edt_Com_kSlotLevelC@Pedal', block: 0, bit: 169, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90 · Pedal morph' },
  { key: 'common.slotLevelC.morphAfterTouch', name: 'Edt_Com_kSlotLevelC@ATouch', block: 0, bit: 177, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90 · ATouch morph' },
  { key: 'common.slotLevelC.morphVelocity', name: 'Edt_Com_kSlotLevelC@Velocity', block: 0, bit: 185, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 90 · Velocity morph' },
  { key: 'common.slotLevelD', name: 'Edt_Com_kSlotLevelD', block: 0, bit: 193, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91' },
  { key: 'common.slotLevelD.morphImpulse', name: 'Edt_Com_kSlotLevelD@Impulse', block: 0, bit: 200, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91 · Impulse morph' },
  { key: 'common.slotLevelD.morphWheel', name: 'Edt_Com_kSlotLevelD@Wheel', block: 0, bit: 208, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91 · Wheel morph' },
  { key: 'common.slotLevelD.morphPedal', name: 'Edt_Com_kSlotLevelD@Pedal', block: 0, bit: 216, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91 · Pedal morph' },
  { key: 'common.slotLevelD.morphAfterTouch', name: 'Edt_Com_kSlotLevelD@ATouch', block: 0, bit: 224, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91 · ATouch morph' },
  { key: 'common.slotLevelD.morphVelocity', name: 'Edt_Com_kSlotLevelD@Velocity', block: 0, bit: 232, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 91 · Velocity morph' },
  { key: 'common.slotPanA', name: 'Edt_Com_kSlotPanA', block: 0, bit: 240, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92' },
  { key: 'common.slotPanA.morphImpulse', name: 'Edt_Com_kSlotPanA@Impulse', block: 0, bit: 247, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92 · Impulse morph' },
  { key: 'common.slotPanA.morphWheel', name: 'Edt_Com_kSlotPanA@Wheel', block: 0, bit: 255, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92 · Wheel morph' },
  { key: 'common.slotPanA.morphPedal', name: 'Edt_Com_kSlotPanA@Pedal', block: 0, bit: 263, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92 · Pedal morph' },
  { key: 'common.slotPanA.morphAfterTouch', name: 'Edt_Com_kSlotPanA@ATouch', block: 0, bit: 271, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92 · ATouch morph' },
  { key: 'common.slotPanA.morphVelocity', name: 'Edt_Com_kSlotPanA@Velocity', block: 0, bit: 279, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 92 · Velocity morph' },
  { key: 'common.slotPanB', name: 'Edt_Com_kSlotPanB', block: 0, bit: 287, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93' },
  { key: 'common.slotPanB.morphImpulse', name: 'Edt_Com_kSlotPanB@Impulse', block: 0, bit: 294, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93 · Impulse morph' },
  { key: 'common.slotPanB.morphWheel', name: 'Edt_Com_kSlotPanB@Wheel', block: 0, bit: 302, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93 · Wheel morph' },
  { key: 'common.slotPanB.morphPedal', name: 'Edt_Com_kSlotPanB@Pedal', block: 0, bit: 310, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93 · Pedal morph' },
  { key: 'common.slotPanB.morphAfterTouch', name: 'Edt_Com_kSlotPanB@ATouch', block: 0, bit: 318, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93 · ATouch morph' },
  { key: 'common.slotPanB.morphVelocity', name: 'Edt_Com_kSlotPanB@Velocity', block: 0, bit: 326, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 93 · Velocity morph' },
  { key: 'common.slotPanC', name: 'Edt_Com_kSlotPanC', block: 0, bit: 334, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94' },
  { key: 'common.slotPanC.morphImpulse', name: 'Edt_Com_kSlotPanC@Impulse', block: 0, bit: 341, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94 · Impulse morph' },
  { key: 'common.slotPanC.morphWheel', name: 'Edt_Com_kSlotPanC@Wheel', block: 0, bit: 349, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94 · Wheel morph' },
  { key: 'common.slotPanC.morphPedal', name: 'Edt_Com_kSlotPanC@Pedal', block: 0, bit: 357, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94 · Pedal morph' },
  { key: 'common.slotPanC.morphAfterTouch', name: 'Edt_Com_kSlotPanC@ATouch', block: 0, bit: 365, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94 · ATouch morph' },
  { key: 'common.slotPanC.morphVelocity', name: 'Edt_Com_kSlotPanC@Velocity', block: 0, bit: 373, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 94 · Velocity morph' },
  { key: 'common.slotPanD', name: 'Edt_Com_kSlotPanD', block: 0, bit: 381, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95' },
  { key: 'common.slotPanD.morphImpulse', name: 'Edt_Com_kSlotPanD@Impulse', block: 0, bit: 388, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95 · Impulse morph' },
  { key: 'common.slotPanD.morphWheel', name: 'Edt_Com_kSlotPanD@Wheel', block: 0, bit: 396, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95 · Wheel morph' },
  { key: 'common.slotPanD.morphPedal', name: 'Edt_Com_kSlotPanD@Pedal', block: 0, bit: 404, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95 · Pedal morph' },
  { key: 'common.slotPanD.morphAfterTouch', name: 'Edt_Com_kSlotPanD@ATouch', block: 0, bit: 412, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95 · ATouch morph' },
  { key: 'common.slotPanD.morphVelocity', name: 'Edt_Com_kSlotPanD@Velocity', block: 0, bit: 420, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 95 · Velocity morph' },
  { key: 'common.pitchStickRange', name: 'Edt_Com_kPitchStickRange', block: 0, bit: 428, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 104' },
  { key: 'common.octShiftGlobalEnable', name: 'Edt_Com_kOctShiftGlobalEnable', block: 0, bit: 432, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 80' },
  { key: 'common.octShiftGlobal', name: 'Edt_Com_kOctShiftGlobal', block: 0, bit: 433, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 79' },
  { key: 'common.midiSlotA', name: 'Edt_Com_kMIDISlotA', block: 0, bit: 437, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 123' },
  { key: 'common.midiSlotB', name: 'Edt_Com_kMIDISlotB', block: 0, bit: 442, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 124' },
  { key: 'common.midiSlotC', name: 'Edt_Com_kMIDISlotC', block: 0, bit: 447, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 125' },
  { key: 'common.midiSlotD', name: 'Edt_Com_kMIDISlotD', block: 0, bit: 452, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 126' },
  { key: 'common.vibFocus', name: 'Edt_Com_kVibFocus', block: 0, bit: 457, width: 4, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Wave 2 OS 1.24 registry · id 127' },
  { key: 'slotACommon.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 1, bit: 0, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128' },
  { key: 'slotACommon.octaveShift.morphImpulse', name: 'Edt_Syn_kOctaveShift@Impulse', block: 1, bit: 4, width: 5, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128 · Impulse morph' },
  { key: 'slotACommon.pitchStickEnable', name: 'Edt_Syn_kPitchStickEnable', block: 1, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 129' },
  { key: 'slotACommon.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 1, bit: 10, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 130' },
  { key: 'slotACommon.kbdHoldEnable', name: 'Edt_Syn_kKbdHoldEnable', block: 1, bit: 11, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 132' },
  { key: 'slotACommon.vibratoMode', name: 'Edt_Syn_kVibratoMode', block: 1, bit: 12, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135' },
  { key: 'slotACommon.vibratoMode.morphImpulse', name: 'Edt_Syn_kVibratoMode@Impulse', block: 1, bit: 15, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135 · Impulse morph' },
  { key: 'slotACommon.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 1, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133' },
  { key: 'slotACommon.voiceMode.morphImpulse', name: 'Edt_Syn_kVoiceMode@Impulse', block: 1, bit: 21, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133 · Impulse morph' },
  { key: 'slotACommon.glideRate', name: 'Edt_Syn_kGlideRate', block: 1, bit: 24, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134' },
  { key: 'slotACommon.glideRate.morphImpulse', name: 'Edt_Syn_kGlideRate@Impulse', block: 1, bit: 31, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Impulse morph' },
  { key: 'slotACommon.glideRate.morphWheel', name: 'Edt_Syn_kGlideRate@Wheel', block: 1, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Wheel morph' },
  { key: 'slotACommon.glideRate.morphPedal', name: 'Edt_Syn_kGlideRate@Pedal', block: 1, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Pedal morph' },
  { key: 'slotACommon.glideRate.morphAfterTouch', name: 'Edt_Syn_kGlideRate@ATouch', block: 1, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · ATouch morph' },
  { key: 'slotACommon.glideRate.morphVelocity', name: 'Edt_Syn_kGlideRate@Velocity', block: 1, bit: 63, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Velocity morph' },
  { key: 'slotACommon.oscBank', name: 'Edt_Syn_kOscBank', block: 1, bit: 71, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 167' },
  { key: 'slotACommon.oscWave', name: 'Edt_Syn_kOscWave', block: 1, bit: 74, width: 16, min: 0, max: 4095, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 168' },
  { key: 'slotACommon.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 1, bit: 90, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170' },
  { key: 'slotACommon.oscCtrl.morphImpulse', name: 'Edt_Syn_kOscCtrl@Impulse', block: 1, bit: 97, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Impulse morph' },
  { key: 'slotACommon.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 1, bit: 105, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Wheel morph' },
  { key: 'slotACommon.oscCtrl.morphPedal', name: 'Edt_Syn_kOscCtrl@Pedal', block: 1, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Pedal morph' },
  { key: 'slotACommon.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@ATouch', block: 1, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · ATouch morph' },
  { key: 'slotACommon.oscCtrl.morphVelocity', name: 'Edt_Syn_kOscCtrl@Velocity', block: 1, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Velocity morph' },
  { key: 'slotACommon.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 1, bit: 137, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171' },
  { key: 'slotACommon.oscTuneFine.morphImpulse', name: 'Edt_Syn_kOscTuneFine@Impulse', block: 1, bit: 144, width: 8, min: 0, max: 101, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Impulse morph' },
  { key: 'slotACommon.oscTuneFine.morphWheel', name: 'Edt_Syn_kOscTuneFine@Wheel', block: 1, bit: 152, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Wheel morph' },
  { key: 'slotACommon.oscTuneFine.morphPedal', name: 'Edt_Syn_kOscTuneFine@Pedal', block: 1, bit: 160, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Pedal morph' },
  { key: 'slotACommon.oscTuneFine.morphAfterTouch', name: 'Edt_Syn_kOscTuneFine@ATouch', block: 1, bit: 168, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · ATouch morph' },
  { key: 'slotACommon.oscTuneFine.morphVelocity', name: 'Edt_Syn_kOscTuneFine@Velocity', block: 1, bit: 176, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Velocity morph' },
  { key: 'slotACommon.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 1, bit: 184, width: 7, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172' },
  { key: 'slotACommon.oscTuneCoarse.morphImpulse', name: 'Edt_Syn_kOscTuneCoarse@Impulse', block: 1, bit: 191, width: 8, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Impulse morph' },
  { key: 'slotACommon.oscTuneCoarse.morphWheel', name: 'Edt_Syn_kOscTuneCoarse@Wheel', block: 1, bit: 199, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Wheel morph' },
  { key: 'slotACommon.oscTuneCoarse.morphPedal', name: 'Edt_Syn_kOscTuneCoarse@Pedal', block: 1, bit: 207, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Pedal morph' },
  { key: 'slotACommon.oscTuneCoarse.morphAfterTouch', name: 'Edt_Syn_kOscTuneCoarse@ATouch', block: 1, bit: 215, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · ATouch morph' },
  { key: 'slotACommon.oscTuneCoarse.morphVelocity', name: 'Edt_Syn_kOscTuneCoarse@Velocity', block: 1, bit: 223, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Velocity morph' },
  { key: 'slotACommon.oscDualMode', name: 'Edt_Syn_kOscDualMode', block: 1, bit: 231, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173' },
  { key: 'slotACommon.oscDualMode.morphImpulse', name: 'Edt_Syn_kOscDualMode@Impulse', block: 1, bit: 233, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173 · Impulse morph' },
  { key: 'slotACommon.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 1, bit: 236, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160' },
  { key: 'slotACommon.oscEnvAtk.morphImpulse', name: 'Edt_Syn_kOscEnvAtk@Impulse', block: 1, bit: 243, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Impulse morph' },
  { key: 'slotACommon.oscEnvAtk.morphWheel', name: 'Edt_Syn_kOscEnvAtk@Wheel', block: 1, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Wheel morph' },
  { key: 'slotACommon.oscEnvAtk.morphPedal', name: 'Edt_Syn_kOscEnvAtk@Pedal', block: 1, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Pedal morph' },
  { key: 'slotACommon.oscEnvAtk.morphAfterTouch', name: 'Edt_Syn_kOscEnvAtk@ATouch', block: 1, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · ATouch morph' },
  { key: 'slotACommon.oscEnvAtk.morphVelocity', name: 'Edt_Syn_kOscEnvAtk@Velocity', block: 1, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Velocity morph' },
  { key: 'slotACommon.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 1, bit: 283, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161' },
  { key: 'slotACommon.oscEnvDcy.morphImpulse', name: 'Edt_Syn_kOscEnvDcy@Impulse', block: 1, bit: 290, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Impulse morph' },
  { key: 'slotACommon.oscEnvDcy.morphWheel', name: 'Edt_Syn_kOscEnvDcy@Wheel', block: 1, bit: 298, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Wheel morph' },
  { key: 'slotACommon.oscEnvDcy.morphPedal', name: 'Edt_Syn_kOscEnvDcy@Pedal', block: 1, bit: 306, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Pedal morph' },
  { key: 'slotACommon.oscEnvDcy.morphAfterTouch', name: 'Edt_Syn_kOscEnvDcy@ATouch', block: 1, bit: 314, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · ATouch morph' },
  { key: 'slotACommon.oscEnvDcy.morphVelocity', name: 'Edt_Syn_kOscEnvDcy@Velocity', block: 1, bit: 322, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Velocity morph' },
  { key: 'slotACommon.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 1, bit: 330, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162' },
  { key: 'slotACommon.oscEnvAmt.morphImpulse', name: 'Edt_Syn_kOscEnvAmt@Impulse', block: 1, bit: 337, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Impulse morph' },
  { key: 'slotACommon.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 1, bit: 345, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Wheel morph' },
  { key: 'slotACommon.oscEnvAmt.morphPedal', name: 'Edt_Syn_kOscEnvAmt@Pedal', block: 1, bit: 353, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Pedal morph' },
  { key: 'slotACommon.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@ATouch', block: 1, bit: 361, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · ATouch morph' },
  { key: 'slotACommon.oscEnvAmt.morphVelocity', name: 'Edt_Syn_kOscEnvAmt@Velocity', block: 1, bit: 369, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Velocity morph' },
  { key: 'slotACommon.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 1, bit: 377, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165' },
  { key: 'slotACommon.oscEnvDst.morphImpulse', name: 'Edt_Syn_kOscEnvDst@Impulse', block: 1, bit: 379, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165 · Impulse morph' },
  { key: 'slotACommon.oscEnvMode', name: 'Edt_Syn_kOscEnvMode', block: 1, bit: 382, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163' },
  { key: 'slotACommon.oscEnvMode.morphImpulse', name: 'Edt_Syn_kOscEnvMode@Impulse', block: 1, bit: 383, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163 · Impulse morph' },
  { key: 'slotACommon.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 1, bit: 385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 164' },
  { key: 'slotACommon.oscWhlDir', name: 'Edt_Syn_kOscWhlDir', block: 1, bit: 386, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 174' },
  { key: 'slotACommon.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 1, bit: 387, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 235' },
  { key: 'slotACommon.smpPresets', name: 'Edt_Syn_kSmpPresets', block: 1, bit: 419, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 233' },
  { key: 'slotACommon.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 1, bit: 420, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232' },
  { key: 'slotACommon.smpFastAtk.morphImpulse', name: 'Edt_Syn_kSmpFastAtk@Impulse', block: 1, bit: 421, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232 · Impulse morph' },
  { key: 'slotACommon.smpVibRateUsageEol', name: 'Edt_Syn_kSmpVibRateUsage_EOL', block: 1, bit: 423, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 200' },
  { key: 'slotAArp.arpRun', name: 'Edt_Syn_kArpRun', block: 2, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140' },
  { key: 'slotAArp.arpRun.morphImpulse', name: 'Edt_Syn_kArpRun@Impulse', block: 2, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140 · Impulse morph' },
  { key: 'slotAArp.arpTarget', name: 'Edt_Syn_kArpTarget', block: 2, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 106' },
  { key: 'slotAArp.arpMode', name: 'Edt_Syn_kArpMode', block: 2, bit: 4, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138' },
  { key: 'slotAArp.arpMode.morphImpulse', name: 'Edt_Syn_kArpMode@Impulse', block: 2, bit: 6, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138 · Impulse morph' },
  { key: 'slotAArp.arpModePtn', name: 'Edt_Syn_kArpModePtn', block: 2, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139' },
  { key: 'slotAArp.arpModePtn.morphImpulse', name: 'Edt_Syn_kArpModePtn@Impulse', block: 2, bit: 10, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139 · Impulse morph' },
  { key: 'slotAArp.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 2, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141' },
  { key: 'slotAArp.arpKbdSync.morphImpulse', name: 'Edt_Syn_kArpKbdSync@Impulse', block: 2, bit: 13, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141 · Impulse morph' },
  { key: 'slotAArp.arpRange', name: 'Edt_Syn_kArpRange', block: 2, bit: 15, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142' },
  { key: 'slotAArp.arpRange.morphImpulse', name: 'Edt_Syn_kArpRange@Impulse', block: 2, bit: 22, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Impulse morph' },
  { key: 'slotAArp.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 2, bit: 30, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Wheel morph' },
  { key: 'slotAArp.arpRange.morphPedal', name: 'Edt_Syn_kArpRange@Pedal', block: 2, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Pedal morph' },
  { key: 'slotAArp.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@ATouch', block: 2, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · ATouch morph' },
  { key: 'slotAArp.arpRange.morphVelocity', name: 'Edt_Syn_kArpRange@Velocity', block: 2, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Velocity morph' },
  { key: 'slotAArp.arpPattern', name: 'Edt_Syn_kArpPattern', block: 2, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143' },
  { key: 'slotAArp.arpPattern.morphImpulse', name: 'Edt_Syn_kArpPattern@Impulse', block: 2, bit: 64, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143 · Impulse morph' },
  { key: 'slotAArp.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 2, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144' },
  { key: 'slotAArp.arpZigZag.morphImpulse', name: 'Edt_Syn_kArpZigZag@Impulse', block: 2, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144 · Impulse morph' },
  { key: 'slotAArp.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 2, bit: 70, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 145' },
  { key: 'slotAArp.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 2, bit: 71, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146' },
  { key: 'slotAArp.arpRateClkDiv.morphImpulse', name: 'Edt_Syn_kArpRateClkDiv@Impulse', block: 2, bit: 78, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Impulse morph' },
  { key: 'slotAArp.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 2, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Wheel morph' },
  { key: 'slotAArp.arpRateClkDiv.morphPedal', name: 'Edt_Syn_kArpRateClkDiv@Pedal', block: 2, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Pedal morph' },
  { key: 'slotAArp.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@ATouch', block: 2, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · ATouch morph' },
  { key: 'slotAArp.arpRateClkDiv.morphVelocity', name: 'Edt_Syn_kArpRateClkDiv@Velocity', block: 2, bit: 110, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Velocity morph' },
  { key: 'slotAArp.gateSeqLength', name: 'Edt_Syn_kGateSeqLength', block: 2, bit: 118, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 149' },
  { key: 'slotAArp.gatePtnAcc', name: 'Edt_Syn_kGatePtnAcc', block: 2, bit: 122, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 151' },
  { key: 'slotAArp.gatePtnDur', name: 'Edt_Syn_kGatePtnDur', block: 2, bit: 154, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 152' },
  { key: 'slotAArp.gatePtnPan', name: 'Edt_Syn_kGatePtnPan', block: 2, bit: 186, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 153' },
  { key: 'slotAArp.gateSeqDivider', name: 'Edt_Syn_kGateSeqDivider', block: 2, bit: 218, width: 7, min: 0, max: 8, def: 4, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 150' },
  { key: 'slotALfo.lfoDst', name: 'Edt_Syn_kLFODst', block: 3, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154' },
  { key: 'slotALfo.lfoDst.morphImpulse', name: 'Edt_Syn_kLFODst@Impulse', block: 3, bit: 2, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154 · Impulse morph' },
  { key: 'slotALfo.lfoTarget', name: 'Edt_Syn_kLFOTarget', block: 3, bit: 5, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 105' },
  { key: 'slotALfo.lfoWave', name: 'Edt_Syn_kLFOWave', block: 3, bit: 6, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155' },
  { key: 'slotALfo.lfoWave.morphImpulse', name: 'Edt_Syn_kLFOWave@Impulse', block: 3, bit: 9, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155 · Impulse morph' },
  { key: 'slotALfo.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 3, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 156' },
  { key: 'slotALfo.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 3, bit: 14, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157' },
  { key: 'slotALfo.lfoRateClkDiv.morphImpulse', name: 'Edt_Syn_kLFORateClkDiv@Impulse', block: 3, bit: 21, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Impulse morph' },
  { key: 'slotALfo.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 3, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Wheel morph' },
  { key: 'slotALfo.lfoRateClkDiv.morphPedal', name: 'Edt_Syn_kLFORateClkDiv@Pedal', block: 3, bit: 37, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Pedal morph' },
  { key: 'slotALfo.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@ATouch', block: 3, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · ATouch morph' },
  { key: 'slotALfo.lfoRateClkDiv.morphVelocity', name: 'Edt_Syn_kLFORateClkDiv@Velocity', block: 3, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Velocity morph' },
  { key: 'slotALfo.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 3, bit: 61, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158' },
  { key: 'slotALfo.lfoAmt.morphImpulse', name: 'Edt_Syn_kLFOAmt@Impulse', block: 3, bit: 68, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Impulse morph' },
  { key: 'slotALfo.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 3, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Wheel morph' },
  { key: 'slotALfo.lfoAmt.morphPedal', name: 'Edt_Syn_kLFOAmt@Pedal', block: 3, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Pedal morph' },
  { key: 'slotALfo.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@ATouch', block: 3, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · ATouch morph' },
  { key: 'slotALfo.lfoAmt.morphVelocity', name: 'Edt_Syn_kLFOAmt@Velocity', block: 3, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Velocity morph' },
  { key: 'slotALfo.lfoWhlDir', name: 'Edt_Syn_kLFOWhlDir', block: 3, bit: 108, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 159' },
  { key: 'slotAFilter.fltTarget', name: 'Edt_Syn_kFltTarget', block: 4, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 107' },
  { key: 'slotAFilter.fltType', name: 'Edt_Syn_kFltType', block: 4, bit: 1, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182' },
  { key: 'slotAFilter.fltType.morphImpulse', name: 'Edt_Syn_kFltType@Impulse', block: 4, bit: 4, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182 · Impulse morph' },
  { key: 'slotAFilter.fltFreq', name: 'Edt_Syn_kFltFreq', block: 4, bit: 8, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183' },
  { key: 'slotAFilter.fltFreq.morphImpulse', name: 'Edt_Syn_kFltFreq@Impulse', block: 4, bit: 15, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Impulse morph' },
  { key: 'slotAFilter.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 4, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Wheel morph' },
  { key: 'slotAFilter.fltFreq.morphPedal', name: 'Edt_Syn_kFltFreq@Pedal', block: 4, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Pedal morph' },
  { key: 'slotAFilter.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@ATouch', block: 4, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · ATouch morph' },
  { key: 'slotAFilter.fltFreq.morphVelocity', name: 'Edt_Syn_kFltFreq@Velocity', block: 4, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Velocity morph' },
  { key: 'slotAFilter.fltRes', name: 'Edt_Syn_kFltRes', block: 4, bit: 55, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184' },
  { key: 'slotAFilter.fltRes.morphImpulse', name: 'Edt_Syn_kFltRes@Impulse', block: 4, bit: 62, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Impulse morph' },
  { key: 'slotAFilter.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 4, bit: 70, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Wheel morph' },
  { key: 'slotAFilter.fltRes.morphPedal', name: 'Edt_Syn_kFltRes@Pedal', block: 4, bit: 78, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Pedal morph' },
  { key: 'slotAFilter.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@ATouch', block: 4, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · ATouch morph' },
  { key: 'slotAFilter.fltRes.morphVelocity', name: 'Edt_Syn_kFltRes@Velocity', block: 4, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Velocity morph' },
  { key: 'slotAFilter.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 4, bit: 102, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185' },
  { key: 'slotAFilter.fltKbdTrk.morphImpulse', name: 'Edt_Syn_kFltKbdTrk@Impulse', block: 4, bit: 104, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185 · Impulse morph' },
  { key: 'slotAFilter.fltDrive', name: 'Edt_Syn_kFltDrive', block: 4, bit: 107, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186' },
  { key: 'slotAFilter.fltDrive.morphImpulse', name: 'Edt_Syn_kFltDrive@Impulse', block: 4, bit: 109, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186 · Impulse morph' },
  { key: 'slotAFilter.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 4, bit: 112, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187' },
  { key: 'slotAFilter.fltEnvAmt.morphImpulse', name: 'Edt_Syn_kFltEnvAmt@Impulse', block: 4, bit: 119, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Impulse morph' },
  { key: 'slotAFilter.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 4, bit: 127, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Wheel morph' },
  { key: 'slotAFilter.fltEnvAmt.morphPedal', name: 'Edt_Syn_kFltEnvAmt@Pedal', block: 4, bit: 135, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Pedal morph' },
  { key: 'slotAFilter.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@ATouch', block: 4, bit: 143, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · ATouch morph' },
  { key: 'slotAFilter.fltEnvAmt.morphVelocity', name: 'Edt_Syn_kFltEnvAmt@Velocity', block: 4, bit: 151, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Velocity morph' },
  { key: 'slotAFilter.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 4, bit: 159, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188' },
  { key: 'slotAFilter.fltEnvAtk.morphImpulse', name: 'Edt_Syn_kFltEnvAtk@Impulse', block: 4, bit: 166, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Impulse morph' },
  { key: 'slotAFilter.fltEnvAtk.morphWheel', name: 'Edt_Syn_kFltEnvAtk@Wheel', block: 4, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Wheel morph' },
  { key: 'slotAFilter.fltEnvAtk.morphPedal', name: 'Edt_Syn_kFltEnvAtk@Pedal', block: 4, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Pedal morph' },
  { key: 'slotAFilter.fltEnvAtk.morphAfterTouch', name: 'Edt_Syn_kFltEnvAtk@ATouch', block: 4, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · ATouch morph' },
  { key: 'slotAFilter.fltEnvAtk.morphVelocity', name: 'Edt_Syn_kFltEnvAtk@Velocity', block: 4, bit: 198, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Velocity morph' },
  { key: 'slotAFilter.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 4, bit: 206, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189' },
  { key: 'slotAFilter.fltEnvDcy.morphImpulse', name: 'Edt_Syn_kFltEnvDcy@Impulse', block: 4, bit: 213, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Impulse morph' },
  { key: 'slotAFilter.fltEnvDcy.morphWheel', name: 'Edt_Syn_kFltEnvDcy@Wheel', block: 4, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Wheel morph' },
  { key: 'slotAFilter.fltEnvDcy.morphPedal', name: 'Edt_Syn_kFltEnvDcy@Pedal', block: 4, bit: 229, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Pedal morph' },
  { key: 'slotAFilter.fltEnvDcy.morphAfterTouch', name: 'Edt_Syn_kFltEnvDcy@ATouch', block: 4, bit: 237, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · ATouch morph' },
  { key: 'slotAFilter.fltEnvDcy.morphVelocity', name: 'Edt_Syn_kFltEnvDcy@Velocity', block: 4, bit: 245, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Velocity morph' },
  { key: 'slotAFilter.fltEnvSus', name: 'Edt_Syn_kFltEnvSus', block: 4, bit: 253, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190' },
  { key: 'slotAFilter.fltEnvSus.morphImpulse', name: 'Edt_Syn_kFltEnvSus@Impulse', block: 4, bit: 260, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Impulse morph' },
  { key: 'slotAFilter.fltEnvSus.morphWheel', name: 'Edt_Syn_kFltEnvSus@Wheel', block: 4, bit: 268, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Wheel morph' },
  { key: 'slotAFilter.fltEnvSus.morphPedal', name: 'Edt_Syn_kFltEnvSus@Pedal', block: 4, bit: 276, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Pedal morph' },
  { key: 'slotAFilter.fltEnvSus.morphAfterTouch', name: 'Edt_Syn_kFltEnvSus@ATouch', block: 4, bit: 284, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · ATouch morph' },
  { key: 'slotAFilter.fltEnvSus.morphVelocity', name: 'Edt_Syn_kFltEnvSus@Velocity', block: 4, bit: 292, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Velocity morph' },
  { key: 'slotAFilter.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 4, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191' },
  { key: 'slotAFilter.fltEnvRls.morphImpulse', name: 'Edt_Syn_kFltEnvRls@Impulse', block: 4, bit: 307, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Impulse morph' },
  { key: 'slotAFilter.fltEnvRls.morphWheel', name: 'Edt_Syn_kFltEnvRls@Wheel', block: 4, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Wheel morph' },
  { key: 'slotAFilter.fltEnvRls.morphPedal', name: 'Edt_Syn_kFltEnvRls@Pedal', block: 4, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Pedal morph' },
  { key: 'slotAFilter.fltEnvRls.morphAfterTouch', name: 'Edt_Syn_kFltEnvRls@ATouch', block: 4, bit: 331, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · ATouch morph' },
  { key: 'slotAFilter.fltEnvRls.morphVelocity', name: 'Edt_Syn_kFltEnvRls@Velocity', block: 4, bit: 339, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Velocity morph' },
  { key: 'slotAFilter.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 4, bit: 347, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 192' },
  { key: 'slotAFilter.fltEnvInv', name: 'Edt_Syn_kFltEnvInv', block: 4, bit: 348, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193' },
  { key: 'slotAFilter.fltEnvInv.morphImpulse', name: 'Edt_Syn_kFltEnvInv@Impulse', block: 4, bit: 349, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193 · Impulse morph' },
  { key: 'slotAFilter.fltWhlDir', name: 'Edt_Syn_kFltWhlDir', block: 4, bit: 351, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 194' },
  { key: 'slotAFilter.fltEnable', name: 'Edt_Syn_kFltEnable', block: 4, bit: 352, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181' },
  { key: 'slotAFilter.fltEnable.morphImpulse', name: 'Edt_Syn_kFltEnable@Impulse', block: 4, bit: 353, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvTarget', name: 'Edt_Syn_kAmpEnvTarget', block: 5, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 108' },
  { key: 'slotAAmpEnv.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 5, bit: 1, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175' },
  { key: 'slotAAmpEnv.ampEnvAtk.morphImpulse', name: 'Edt_Syn_kAmpEnvAtk@Impulse', block: 5, bit: 8, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvAtk.morphWheel', name: 'Edt_Syn_kAmpEnvAtk@Wheel', block: 5, bit: 16, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Wheel morph' },
  { key: 'slotAAmpEnv.ampEnvAtk.morphPedal', name: 'Edt_Syn_kAmpEnvAtk@Pedal', block: 5, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Pedal morph' },
  { key: 'slotAAmpEnv.ampEnvAtk.morphAfterTouch', name: 'Edt_Syn_kAmpEnvAtk@ATouch', block: 5, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · ATouch morph' },
  { key: 'slotAAmpEnv.ampEnvAtk.morphVelocity', name: 'Edt_Syn_kAmpEnvAtk@Velocity', block: 5, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Velocity morph' },
  { key: 'slotAAmpEnv.ampEnvAtkFast', name: 'Edt_Syn_kAmpEnvAtkFast', block: 5, bit: 48, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176' },
  { key: 'slotAAmpEnv.ampEnvAtkFast.morphImpulse', name: 'Edt_Syn_kAmpEnvAtkFast@Impulse', block: 5, bit: 49, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 5, bit: 51, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177' },
  { key: 'slotAAmpEnv.ampEnvDcy.morphImpulse', name: 'Edt_Syn_kAmpEnvDcy@Impulse', block: 5, bit: 58, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvDcy.morphWheel', name: 'Edt_Syn_kAmpEnvDcy@Wheel', block: 5, bit: 66, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Wheel morph' },
  { key: 'slotAAmpEnv.ampEnvDcy.morphPedal', name: 'Edt_Syn_kAmpEnvDcy@Pedal', block: 5, bit: 74, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Pedal morph' },
  { key: 'slotAAmpEnv.ampEnvDcy.morphAfterTouch', name: 'Edt_Syn_kAmpEnvDcy@ATouch', block: 5, bit: 82, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · ATouch morph' },
  { key: 'slotAAmpEnv.ampEnvDcy.morphVelocity', name: 'Edt_Syn_kAmpEnvDcy@Velocity', block: 5, bit: 90, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Velocity morph' },
  { key: 'slotAAmpEnv.ampEnvSus', name: 'Edt_Syn_kAmpEnvSus', block: 5, bit: 98, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178' },
  { key: 'slotAAmpEnv.ampEnvSus.morphImpulse', name: 'Edt_Syn_kAmpEnvSus@Impulse', block: 5, bit: 105, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvSus.morphWheel', name: 'Edt_Syn_kAmpEnvSus@Wheel', block: 5, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Wheel morph' },
  { key: 'slotAAmpEnv.ampEnvSus.morphPedal', name: 'Edt_Syn_kAmpEnvSus@Pedal', block: 5, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Pedal morph' },
  { key: 'slotAAmpEnv.ampEnvSus.morphAfterTouch', name: 'Edt_Syn_kAmpEnvSus@ATouch', block: 5, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · ATouch morph' },
  { key: 'slotAAmpEnv.ampEnvSus.morphVelocity', name: 'Edt_Syn_kAmpEnvSus@Velocity', block: 5, bit: 137, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Velocity morph' },
  { key: 'slotAAmpEnv.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 5, bit: 145, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179' },
  { key: 'slotAAmpEnv.ampEnvRls.morphImpulse', name: 'Edt_Syn_kAmpEnvRls@Impulse', block: 5, bit: 152, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Impulse morph' },
  { key: 'slotAAmpEnv.ampEnvRls.morphWheel', name: 'Edt_Syn_kAmpEnvRls@Wheel', block: 5, bit: 160, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Wheel morph' },
  { key: 'slotAAmpEnv.ampEnvRls.morphPedal', name: 'Edt_Syn_kAmpEnvRls@Pedal', block: 5, bit: 168, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Pedal morph' },
  { key: 'slotAAmpEnv.ampEnvRls.morphAfterTouch', name: 'Edt_Syn_kAmpEnvRls@ATouch', block: 5, bit: 176, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · ATouch morph' },
  { key: 'slotAAmpEnv.ampEnvRls.morphVelocity', name: 'Edt_Syn_kAmpEnvRls@Velocity', block: 5, bit: 184, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Velocity morph' },
  { key: 'slotAAmpEnv.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 5, bit: 192, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 180' },
  { key: 'slotAFx.fxTarget', name: 'Edt_Effects_kFxTarget', block: 6, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 109' },
  { key: 'slotAFx.fxClkEnable', name: 'Edt_Effects_kFxClkEnable', block: 6, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 238' },
  { key: 'slotAFx.fxType', name: 'Edt_Effects_kFxType', block: 6, bit: 2, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237' },
  { key: 'slotAFx.fxType.morphImpulse', name: 'Edt_Effects_kFxType@Impulse', block: 6, bit: 5, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237 · Impulse morph' },
  { key: 'slotAFx.fxRateClkDiv', name: 'Edt_Effects_kFxRateClkDiv', block: 6, bit: 9, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239' },
  { key: 'slotAFx.fxRateClkDiv.morphImpulse', name: 'Edt_Effects_kFxRateClkDiv@Impulse', block: 6, bit: 16, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Impulse morph' },
  { key: 'slotAFx.fxRateClkDiv.morphWheel', name: 'Edt_Effects_kFxRateClkDiv@Wheel', block: 6, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Wheel morph' },
  { key: 'slotAFx.fxRateClkDiv.morphPedal', name: 'Edt_Effects_kFxRateClkDiv@Pedal', block: 6, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Pedal morph' },
  { key: 'slotAFx.fxRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFxRateClkDiv@ATouch', block: 6, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · ATouch morph' },
  { key: 'slotAFx.fxRateClkDiv.morphVelocity', name: 'Edt_Effects_kFxRateClkDiv@Velocity', block: 6, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Velocity morph' },
  { key: 'slotAFx.fxAmt', name: 'Edt_Effects_kFxAmt', block: 6, bit: 56, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240' },
  { key: 'slotAFx.fxAmt.morphImpulse', name: 'Edt_Effects_kFxAmt@Impulse', block: 6, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Impulse morph' },
  { key: 'slotAFx.fxAmt.morphWheel', name: 'Edt_Effects_kFxAmt@Wheel', block: 6, bit: 71, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Wheel morph' },
  { key: 'slotAFx.fxAmt.morphPedal', name: 'Edt_Effects_kFxAmt@Pedal', block: 6, bit: 79, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Pedal morph' },
  { key: 'slotAFx.fxAmt.morphAfterTouch', name: 'Edt_Effects_kFxAmt@ATouch', block: 6, bit: 87, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · ATouch morph' },
  { key: 'slotAFx.fxAmt.morphVelocity', name: 'Edt_Effects_kFxAmt@Velocity', block: 6, bit: 95, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Velocity morph' },
  { key: 'slotAFx.fxEnable', name: 'Edt_Effects_kFxEnable', block: 6, bit: 103, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236' },
  { key: 'slotAFx.fxEnable.morphImpulse', name: 'Edt_Effects_kFxEnable@Impulse', block: 6, bit: 104, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236 · Impulse morph' },
  { key: 'slotAEq.eqTarget', name: 'Edt_Effects_kEqTarget', block: 7, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 110' },
  { key: 'slotAEq.eqType', name: 'Edt_Effects_kEqType', block: 7, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 256' },
  { key: 'slotAEq.eqTreble', name: 'Edt_Effects_kEqTreble', block: 7, bit: 2, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 253' },
  { key: 'slotAEq.eqBass', name: 'Edt_Effects_kEqBass', block: 7, bit: 9, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 254' },
  { key: 'slotAEq.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 7, bit: 16, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 257' },
  { key: 'slotAEq.eqMidGain', name: 'Edt_Effects_kEqMidGain', block: 7, bit: 23, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 258' },
  { key: 'slotAEq.eqDrive', name: 'Edt_Effects_kEqDrive', block: 7, bit: 30, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255' },
  { key: 'slotAEq.eqDrive.morphImpulse', name: 'Edt_Effects_kEqDrive@Impulse', block: 7, bit: 37, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Impulse morph' },
  { key: 'slotAEq.eqDrive.morphWheel', name: 'Edt_Effects_kEqDrive@Wheel', block: 7, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Wheel morph' },
  { key: 'slotAEq.eqDrive.morphPedal', name: 'Edt_Effects_kEqDrive@Pedal', block: 7, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Pedal morph' },
  { key: 'slotAEq.eqDrive.morphAfterTouch', name: 'Edt_Effects_kEqDrive@ATouch', block: 7, bit: 61, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · ATouch morph' },
  { key: 'slotAEq.eqDrive.morphVelocity', name: 'Edt_Effects_kEqDrive@Velocity', block: 7, bit: 69, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Velocity morph' },
  { key: 'slotAEq.eqEnable', name: 'Edt_Effects_kEqEnable', block: 7, bit: 77, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252' },
  { key: 'slotAEq.eqEnable.morphImpulse', name: 'Edt_Effects_kEqEnable@Impulse', block: 7, bit: 78, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252 · Impulse morph' },
  { key: 'slotADelay.dlyTarget', name: 'Edt_Effects_kDlyTarget', block: 8, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 111' },
  { key: 'slotADelay.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 8, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 242' },
  { key: 'slotADelay.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 8, bit: 2, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243' },
  { key: 'slotADelay.dlyRateClkDiv.morphImpulse', name: 'Edt_Effects_kDlyRateClkDiv@Impulse', block: 8, bit: 16, width: 15, min: 0, max: 16384, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Impulse morph' },
  { key: 'slotADelay.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 8, bit: 31, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Wheel morph' },
  { key: 'slotADelay.dlyRateClkDiv.morphPedal', name: 'Edt_Effects_kDlyRateClkDiv@Pedal', block: 8, bit: 46, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Pedal morph' },
  { key: 'slotADelay.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@ATouch', block: 8, bit: 61, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · ATouch morph' },
  { key: 'slotADelay.dlyRateClkDiv.morphVelocity', name: 'Edt_Effects_kDlyRateClkDiv@Velocity', block: 8, bit: 76, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Velocity morph' },
  { key: 'slotADelay.dlyMix', name: 'Edt_Effects_kDlyMix', block: 8, bit: 91, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245' },
  { key: 'slotADelay.dlyMix.morphImpulse', name: 'Edt_Effects_kDlyMix@Impulse', block: 8, bit: 98, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Impulse morph' },
  { key: 'slotADelay.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 8, bit: 106, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Wheel morph' },
  { key: 'slotADelay.dlyMix.morphPedal', name: 'Edt_Effects_kDlyMix@Pedal', block: 8, bit: 114, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Pedal morph' },
  { key: 'slotADelay.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@ATouch', block: 8, bit: 122, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · ATouch morph' },
  { key: 'slotADelay.dlyMix.morphVelocity', name: 'Edt_Effects_kDlyMix@Velocity', block: 8, bit: 130, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Velocity morph' },
  { key: 'slotADelay.dlyMode', name: 'Edt_Effects_kDlyMode', block: 8, bit: 138, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246' },
  { key: 'slotADelay.dlyMode.morphImpulse', name: 'Edt_Effects_kDlyMode@Impulse', block: 8, bit: 139, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246 · Impulse morph' },
  { key: 'slotADelay.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 8, bit: 141, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247' },
  { key: 'slotADelay.dlyFbkPingPong.morphImpulse', name: 'Edt_Effects_kDlyFbkPingPong@Impulse', block: 8, bit: 142, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247 · Impulse morph' },
  { key: 'slotADelay.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 8, bit: 144, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248' },
  { key: 'slotADelay.dlyFbkFilt.morphImpulse', name: 'Edt_Effects_kDlyFbkFilt@Impulse', block: 8, bit: 146, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248 · Impulse morph' },
  { key: 'slotADelay.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 8, bit: 149, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249' },
  { key: 'slotADelay.dlyFbkAmt.morphImpulse', name: 'Edt_Effects_kDlyFbkAmt@Impulse', block: 8, bit: 156, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Impulse morph' },
  { key: 'slotADelay.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 8, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Wheel morph' },
  { key: 'slotADelay.dlyFbkAmt.morphPedal', name: 'Edt_Effects_kDlyFbkAmt@Pedal', block: 8, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Pedal morph' },
  { key: 'slotADelay.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@ATouch', block: 8, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · ATouch morph' },
  { key: 'slotADelay.dlyFbkAmt.morphVelocity', name: 'Edt_Effects_kDlyFbkAmt@Velocity', block: 8, bit: 188, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Velocity morph' },
  { key: 'slotADelay.dlyFbkFx', name: 'Edt_Effects_kDlyFbkFx', block: 8, bit: 196, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250' },
  { key: 'slotADelay.dlyFbkFx.morphImpulse', name: 'Edt_Effects_kDlyFbkFx@Impulse', block: 8, bit: 198, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250 · Impulse morph' },
  { key: 'slotADelay.dlyFbkDeep', name: 'Edt_Effects_kDlyFbkDeep', block: 8, bit: 201, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251' },
  { key: 'slotADelay.dlyFbkDeep.morphImpulse', name: 'Edt_Effects_kDlyFbkDeep@Impulse', block: 8, bit: 202, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251 · Impulse morph' },
  { key: 'slotADelay.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 8, bit: 204, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241' },
  { key: 'slotADelay.dlyEnable.morphImpulse', name: 'Edt_Effects_kDlyEnable@Impulse', block: 8, bit: 205, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241 · Impulse morph' },
  { key: 'slotAReverb.rvbTarget', name: 'Edt_Effects_kRvbTarget', block: 9, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 112' },
  { key: 'slotAReverb.rvbType', name: 'Edt_Effects_kRvbType', block: 9, bit: 1, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260' },
  { key: 'slotAReverb.rvbType.morphImpulse', name: 'Edt_Effects_kRvbType@Impulse', block: 9, bit: 4, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260 · Impulse morph' },
  { key: 'slotAReverb.rvbColor', name: 'Edt_Effects_kRvbColor', block: 9, bit: 8, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261' },
  { key: 'slotAReverb.rvbColor.morphImpulse', name: 'Edt_Effects_kRvbColor@Impulse', block: 9, bit: 10, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261 · Impulse morph' },
  { key: 'slotAReverb.rvbModulate', name: 'Edt_Effects_kRvbModulate', block: 9, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263' },
  { key: 'slotAReverb.rvbModulate.morphImpulse', name: 'Edt_Effects_kRvbModulate@Impulse', block: 9, bit: 14, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263 · Impulse morph' },
  { key: 'slotAReverb.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 9, bit: 16, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262' },
  { key: 'slotAReverb.rvbAmt.morphImpulse', name: 'Edt_Effects_kRvbAmt@Impulse', block: 9, bit: 23, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Impulse morph' },
  { key: 'slotAReverb.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 9, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Wheel morph' },
  { key: 'slotAReverb.rvbAmt.morphPedal', name: 'Edt_Effects_kRvbAmt@Pedal', block: 9, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Pedal morph' },
  { key: 'slotAReverb.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@ATouch', block: 9, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · ATouch morph' },
  { key: 'slotAReverb.rvbAmt.morphVelocity', name: 'Edt_Effects_kRvbAmt@Velocity', block: 9, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Velocity morph' },
  { key: 'slotAReverb.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 9, bit: 63, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259' },
  { key: 'slotAReverb.rvbEnable.morphImpulse', name: 'Edt_Effects_kRvbEnable@Impulse', block: 9, bit: 64, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259 · Impulse morph' },
  { key: 'slotAVibrato.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 10, bit: 0, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 136' },
  { key: 'slotAVibrato.vibratoAmount', name: 'Edt_Syn_kVibratoAmount', block: 10, bit: 7, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 137' },
  { key: 'slotBCommon.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 11, bit: 0, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128' },
  { key: 'slotBCommon.octaveShift.morphImpulse', name: 'Edt_Syn_kOctaveShift@Impulse', block: 11, bit: 4, width: 5, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128 · Impulse morph' },
  { key: 'slotBCommon.pitchStickEnable', name: 'Edt_Syn_kPitchStickEnable', block: 11, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 129' },
  { key: 'slotBCommon.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 11, bit: 10, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 130' },
  { key: 'slotBCommon.kbdHoldEnable', name: 'Edt_Syn_kKbdHoldEnable', block: 11, bit: 11, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 132' },
  { key: 'slotBCommon.vibratoMode', name: 'Edt_Syn_kVibratoMode', block: 11, bit: 12, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135' },
  { key: 'slotBCommon.vibratoMode.morphImpulse', name: 'Edt_Syn_kVibratoMode@Impulse', block: 11, bit: 15, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135 · Impulse morph' },
  { key: 'slotBCommon.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 11, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133' },
  { key: 'slotBCommon.voiceMode.morphImpulse', name: 'Edt_Syn_kVoiceMode@Impulse', block: 11, bit: 21, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133 · Impulse morph' },
  { key: 'slotBCommon.glideRate', name: 'Edt_Syn_kGlideRate', block: 11, bit: 24, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134' },
  { key: 'slotBCommon.glideRate.morphImpulse', name: 'Edt_Syn_kGlideRate@Impulse', block: 11, bit: 31, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Impulse morph' },
  { key: 'slotBCommon.glideRate.morphWheel', name: 'Edt_Syn_kGlideRate@Wheel', block: 11, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Wheel morph' },
  { key: 'slotBCommon.glideRate.morphPedal', name: 'Edt_Syn_kGlideRate@Pedal', block: 11, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Pedal morph' },
  { key: 'slotBCommon.glideRate.morphAfterTouch', name: 'Edt_Syn_kGlideRate@ATouch', block: 11, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · ATouch morph' },
  { key: 'slotBCommon.glideRate.morphVelocity', name: 'Edt_Syn_kGlideRate@Velocity', block: 11, bit: 63, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Velocity morph' },
  { key: 'slotBCommon.oscBank', name: 'Edt_Syn_kOscBank', block: 11, bit: 71, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 167' },
  { key: 'slotBCommon.oscWave', name: 'Edt_Syn_kOscWave', block: 11, bit: 74, width: 16, min: 0, max: 4095, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 168' },
  { key: 'slotBCommon.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 11, bit: 90, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170' },
  { key: 'slotBCommon.oscCtrl.morphImpulse', name: 'Edt_Syn_kOscCtrl@Impulse', block: 11, bit: 97, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Impulse morph' },
  { key: 'slotBCommon.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 11, bit: 105, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Wheel morph' },
  { key: 'slotBCommon.oscCtrl.morphPedal', name: 'Edt_Syn_kOscCtrl@Pedal', block: 11, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Pedal morph' },
  { key: 'slotBCommon.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@ATouch', block: 11, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · ATouch morph' },
  { key: 'slotBCommon.oscCtrl.morphVelocity', name: 'Edt_Syn_kOscCtrl@Velocity', block: 11, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Velocity morph' },
  { key: 'slotBCommon.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 11, bit: 137, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171' },
  { key: 'slotBCommon.oscTuneFine.morphImpulse', name: 'Edt_Syn_kOscTuneFine@Impulse', block: 11, bit: 144, width: 8, min: 0, max: 101, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Impulse morph' },
  { key: 'slotBCommon.oscTuneFine.morphWheel', name: 'Edt_Syn_kOscTuneFine@Wheel', block: 11, bit: 152, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Wheel morph' },
  { key: 'slotBCommon.oscTuneFine.morphPedal', name: 'Edt_Syn_kOscTuneFine@Pedal', block: 11, bit: 160, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Pedal morph' },
  { key: 'slotBCommon.oscTuneFine.morphAfterTouch', name: 'Edt_Syn_kOscTuneFine@ATouch', block: 11, bit: 168, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · ATouch morph' },
  { key: 'slotBCommon.oscTuneFine.morphVelocity', name: 'Edt_Syn_kOscTuneFine@Velocity', block: 11, bit: 176, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Velocity morph' },
  { key: 'slotBCommon.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 11, bit: 184, width: 7, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172' },
  { key: 'slotBCommon.oscTuneCoarse.morphImpulse', name: 'Edt_Syn_kOscTuneCoarse@Impulse', block: 11, bit: 191, width: 8, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Impulse morph' },
  { key: 'slotBCommon.oscTuneCoarse.morphWheel', name: 'Edt_Syn_kOscTuneCoarse@Wheel', block: 11, bit: 199, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Wheel morph' },
  { key: 'slotBCommon.oscTuneCoarse.morphPedal', name: 'Edt_Syn_kOscTuneCoarse@Pedal', block: 11, bit: 207, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Pedal morph' },
  { key: 'slotBCommon.oscTuneCoarse.morphAfterTouch', name: 'Edt_Syn_kOscTuneCoarse@ATouch', block: 11, bit: 215, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · ATouch morph' },
  { key: 'slotBCommon.oscTuneCoarse.morphVelocity', name: 'Edt_Syn_kOscTuneCoarse@Velocity', block: 11, bit: 223, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Velocity morph' },
  { key: 'slotBCommon.oscDualMode', name: 'Edt_Syn_kOscDualMode', block: 11, bit: 231, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173' },
  { key: 'slotBCommon.oscDualMode.morphImpulse', name: 'Edt_Syn_kOscDualMode@Impulse', block: 11, bit: 233, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173 · Impulse morph' },
  { key: 'slotBCommon.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 11, bit: 236, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160' },
  { key: 'slotBCommon.oscEnvAtk.morphImpulse', name: 'Edt_Syn_kOscEnvAtk@Impulse', block: 11, bit: 243, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Impulse morph' },
  { key: 'slotBCommon.oscEnvAtk.morphWheel', name: 'Edt_Syn_kOscEnvAtk@Wheel', block: 11, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Wheel morph' },
  { key: 'slotBCommon.oscEnvAtk.morphPedal', name: 'Edt_Syn_kOscEnvAtk@Pedal', block: 11, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Pedal morph' },
  { key: 'slotBCommon.oscEnvAtk.morphAfterTouch', name: 'Edt_Syn_kOscEnvAtk@ATouch', block: 11, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · ATouch morph' },
  { key: 'slotBCommon.oscEnvAtk.morphVelocity', name: 'Edt_Syn_kOscEnvAtk@Velocity', block: 11, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Velocity morph' },
  { key: 'slotBCommon.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 11, bit: 283, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161' },
  { key: 'slotBCommon.oscEnvDcy.morphImpulse', name: 'Edt_Syn_kOscEnvDcy@Impulse', block: 11, bit: 290, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Impulse morph' },
  { key: 'slotBCommon.oscEnvDcy.morphWheel', name: 'Edt_Syn_kOscEnvDcy@Wheel', block: 11, bit: 298, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Wheel morph' },
  { key: 'slotBCommon.oscEnvDcy.morphPedal', name: 'Edt_Syn_kOscEnvDcy@Pedal', block: 11, bit: 306, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Pedal morph' },
  { key: 'slotBCommon.oscEnvDcy.morphAfterTouch', name: 'Edt_Syn_kOscEnvDcy@ATouch', block: 11, bit: 314, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · ATouch morph' },
  { key: 'slotBCommon.oscEnvDcy.morphVelocity', name: 'Edt_Syn_kOscEnvDcy@Velocity', block: 11, bit: 322, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Velocity morph' },
  { key: 'slotBCommon.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 11, bit: 330, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162' },
  { key: 'slotBCommon.oscEnvAmt.morphImpulse', name: 'Edt_Syn_kOscEnvAmt@Impulse', block: 11, bit: 337, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Impulse morph' },
  { key: 'slotBCommon.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 11, bit: 345, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Wheel morph' },
  { key: 'slotBCommon.oscEnvAmt.morphPedal', name: 'Edt_Syn_kOscEnvAmt@Pedal', block: 11, bit: 353, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Pedal morph' },
  { key: 'slotBCommon.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@ATouch', block: 11, bit: 361, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · ATouch morph' },
  { key: 'slotBCommon.oscEnvAmt.morphVelocity', name: 'Edt_Syn_kOscEnvAmt@Velocity', block: 11, bit: 369, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Velocity morph' },
  { key: 'slotBCommon.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 11, bit: 377, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165' },
  { key: 'slotBCommon.oscEnvDst.morphImpulse', name: 'Edt_Syn_kOscEnvDst@Impulse', block: 11, bit: 379, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165 · Impulse morph' },
  { key: 'slotBCommon.oscEnvMode', name: 'Edt_Syn_kOscEnvMode', block: 11, bit: 382, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163' },
  { key: 'slotBCommon.oscEnvMode.morphImpulse', name: 'Edt_Syn_kOscEnvMode@Impulse', block: 11, bit: 383, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163 · Impulse morph' },
  { key: 'slotBCommon.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 11, bit: 385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 164' },
  { key: 'slotBCommon.oscWhlDir', name: 'Edt_Syn_kOscWhlDir', block: 11, bit: 386, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 174' },
  { key: 'slotBCommon.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 11, bit: 387, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 235' },
  { key: 'slotBCommon.smpPresets', name: 'Edt_Syn_kSmpPresets', block: 11, bit: 419, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 233' },
  { key: 'slotBCommon.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 11, bit: 420, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232' },
  { key: 'slotBCommon.smpFastAtk.morphImpulse', name: 'Edt_Syn_kSmpFastAtk@Impulse', block: 11, bit: 421, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232 · Impulse morph' },
  { key: 'slotBCommon.smpVibRateUsageEol', name: 'Edt_Syn_kSmpVibRateUsage_EOL', block: 11, bit: 423, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 200' },
  { key: 'slotBArp.arpRun', name: 'Edt_Syn_kArpRun', block: 12, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140' },
  { key: 'slotBArp.arpRun.morphImpulse', name: 'Edt_Syn_kArpRun@Impulse', block: 12, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140 · Impulse morph' },
  { key: 'slotBArp.arpTarget', name: 'Edt_Syn_kArpTarget', block: 12, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 106' },
  { key: 'slotBArp.arpMode', name: 'Edt_Syn_kArpMode', block: 12, bit: 4, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138' },
  { key: 'slotBArp.arpMode.morphImpulse', name: 'Edt_Syn_kArpMode@Impulse', block: 12, bit: 6, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138 · Impulse morph' },
  { key: 'slotBArp.arpModePtn', name: 'Edt_Syn_kArpModePtn', block: 12, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139' },
  { key: 'slotBArp.arpModePtn.morphImpulse', name: 'Edt_Syn_kArpModePtn@Impulse', block: 12, bit: 10, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139 · Impulse morph' },
  { key: 'slotBArp.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 12, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141' },
  { key: 'slotBArp.arpKbdSync.morphImpulse', name: 'Edt_Syn_kArpKbdSync@Impulse', block: 12, bit: 13, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141 · Impulse morph' },
  { key: 'slotBArp.arpRange', name: 'Edt_Syn_kArpRange', block: 12, bit: 15, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142' },
  { key: 'slotBArp.arpRange.morphImpulse', name: 'Edt_Syn_kArpRange@Impulse', block: 12, bit: 22, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Impulse morph' },
  { key: 'slotBArp.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 12, bit: 30, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Wheel morph' },
  { key: 'slotBArp.arpRange.morphPedal', name: 'Edt_Syn_kArpRange@Pedal', block: 12, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Pedal morph' },
  { key: 'slotBArp.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@ATouch', block: 12, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · ATouch morph' },
  { key: 'slotBArp.arpRange.morphVelocity', name: 'Edt_Syn_kArpRange@Velocity', block: 12, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Velocity morph' },
  { key: 'slotBArp.arpPattern', name: 'Edt_Syn_kArpPattern', block: 12, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143' },
  { key: 'slotBArp.arpPattern.morphImpulse', name: 'Edt_Syn_kArpPattern@Impulse', block: 12, bit: 64, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143 · Impulse morph' },
  { key: 'slotBArp.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 12, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144' },
  { key: 'slotBArp.arpZigZag.morphImpulse', name: 'Edt_Syn_kArpZigZag@Impulse', block: 12, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144 · Impulse morph' },
  { key: 'slotBArp.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 12, bit: 70, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 145' },
  { key: 'slotBArp.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 12, bit: 71, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146' },
  { key: 'slotBArp.arpRateClkDiv.morphImpulse', name: 'Edt_Syn_kArpRateClkDiv@Impulse', block: 12, bit: 78, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Impulse morph' },
  { key: 'slotBArp.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 12, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Wheel morph' },
  { key: 'slotBArp.arpRateClkDiv.morphPedal', name: 'Edt_Syn_kArpRateClkDiv@Pedal', block: 12, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Pedal morph' },
  { key: 'slotBArp.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@ATouch', block: 12, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · ATouch morph' },
  { key: 'slotBArp.arpRateClkDiv.morphVelocity', name: 'Edt_Syn_kArpRateClkDiv@Velocity', block: 12, bit: 110, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Velocity morph' },
  { key: 'slotBArp.gateSeqLength', name: 'Edt_Syn_kGateSeqLength', block: 12, bit: 118, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 149' },
  { key: 'slotBArp.gatePtnAcc', name: 'Edt_Syn_kGatePtnAcc', block: 12, bit: 122, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 151' },
  { key: 'slotBArp.gatePtnDur', name: 'Edt_Syn_kGatePtnDur', block: 12, bit: 154, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 152' },
  { key: 'slotBArp.gatePtnPan', name: 'Edt_Syn_kGatePtnPan', block: 12, bit: 186, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 153' },
  { key: 'slotBArp.gateSeqDivider', name: 'Edt_Syn_kGateSeqDivider', block: 12, bit: 218, width: 7, min: 0, max: 8, def: 4, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 150' },
  { key: 'slotBLfo.lfoDst', name: 'Edt_Syn_kLFODst', block: 13, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154' },
  { key: 'slotBLfo.lfoDst.morphImpulse', name: 'Edt_Syn_kLFODst@Impulse', block: 13, bit: 2, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154 · Impulse morph' },
  { key: 'slotBLfo.lfoTarget', name: 'Edt_Syn_kLFOTarget', block: 13, bit: 5, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 105' },
  { key: 'slotBLfo.lfoWave', name: 'Edt_Syn_kLFOWave', block: 13, bit: 6, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155' },
  { key: 'slotBLfo.lfoWave.morphImpulse', name: 'Edt_Syn_kLFOWave@Impulse', block: 13, bit: 9, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155 · Impulse morph' },
  { key: 'slotBLfo.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 13, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 156' },
  { key: 'slotBLfo.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 13, bit: 14, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157' },
  { key: 'slotBLfo.lfoRateClkDiv.morphImpulse', name: 'Edt_Syn_kLFORateClkDiv@Impulse', block: 13, bit: 21, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Impulse morph' },
  { key: 'slotBLfo.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 13, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Wheel morph' },
  { key: 'slotBLfo.lfoRateClkDiv.morphPedal', name: 'Edt_Syn_kLFORateClkDiv@Pedal', block: 13, bit: 37, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Pedal morph' },
  { key: 'slotBLfo.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@ATouch', block: 13, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · ATouch morph' },
  { key: 'slotBLfo.lfoRateClkDiv.morphVelocity', name: 'Edt_Syn_kLFORateClkDiv@Velocity', block: 13, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Velocity morph' },
  { key: 'slotBLfo.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 13, bit: 61, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158' },
  { key: 'slotBLfo.lfoAmt.morphImpulse', name: 'Edt_Syn_kLFOAmt@Impulse', block: 13, bit: 68, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Impulse morph' },
  { key: 'slotBLfo.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 13, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Wheel morph' },
  { key: 'slotBLfo.lfoAmt.morphPedal', name: 'Edt_Syn_kLFOAmt@Pedal', block: 13, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Pedal morph' },
  { key: 'slotBLfo.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@ATouch', block: 13, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · ATouch morph' },
  { key: 'slotBLfo.lfoAmt.morphVelocity', name: 'Edt_Syn_kLFOAmt@Velocity', block: 13, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Velocity morph' },
  { key: 'slotBLfo.lfoWhlDir', name: 'Edt_Syn_kLFOWhlDir', block: 13, bit: 108, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 159' },
  { key: 'slotBFilter.fltTarget', name: 'Edt_Syn_kFltTarget', block: 14, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 107' },
  { key: 'slotBFilter.fltType', name: 'Edt_Syn_kFltType', block: 14, bit: 1, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182' },
  { key: 'slotBFilter.fltType.morphImpulse', name: 'Edt_Syn_kFltType@Impulse', block: 14, bit: 4, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182 · Impulse morph' },
  { key: 'slotBFilter.fltFreq', name: 'Edt_Syn_kFltFreq', block: 14, bit: 8, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183' },
  { key: 'slotBFilter.fltFreq.morphImpulse', name: 'Edt_Syn_kFltFreq@Impulse', block: 14, bit: 15, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Impulse morph' },
  { key: 'slotBFilter.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 14, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Wheel morph' },
  { key: 'slotBFilter.fltFreq.morphPedal', name: 'Edt_Syn_kFltFreq@Pedal', block: 14, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Pedal morph' },
  { key: 'slotBFilter.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@ATouch', block: 14, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · ATouch morph' },
  { key: 'slotBFilter.fltFreq.morphVelocity', name: 'Edt_Syn_kFltFreq@Velocity', block: 14, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Velocity morph' },
  { key: 'slotBFilter.fltRes', name: 'Edt_Syn_kFltRes', block: 14, bit: 55, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184' },
  { key: 'slotBFilter.fltRes.morphImpulse', name: 'Edt_Syn_kFltRes@Impulse', block: 14, bit: 62, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Impulse morph' },
  { key: 'slotBFilter.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 14, bit: 70, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Wheel morph' },
  { key: 'slotBFilter.fltRes.morphPedal', name: 'Edt_Syn_kFltRes@Pedal', block: 14, bit: 78, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Pedal morph' },
  { key: 'slotBFilter.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@ATouch', block: 14, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · ATouch morph' },
  { key: 'slotBFilter.fltRes.morphVelocity', name: 'Edt_Syn_kFltRes@Velocity', block: 14, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Velocity morph' },
  { key: 'slotBFilter.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 14, bit: 102, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185' },
  { key: 'slotBFilter.fltKbdTrk.morphImpulse', name: 'Edt_Syn_kFltKbdTrk@Impulse', block: 14, bit: 104, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185 · Impulse morph' },
  { key: 'slotBFilter.fltDrive', name: 'Edt_Syn_kFltDrive', block: 14, bit: 107, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186' },
  { key: 'slotBFilter.fltDrive.morphImpulse', name: 'Edt_Syn_kFltDrive@Impulse', block: 14, bit: 109, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186 · Impulse morph' },
  { key: 'slotBFilter.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 14, bit: 112, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187' },
  { key: 'slotBFilter.fltEnvAmt.morphImpulse', name: 'Edt_Syn_kFltEnvAmt@Impulse', block: 14, bit: 119, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Impulse morph' },
  { key: 'slotBFilter.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 14, bit: 127, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Wheel morph' },
  { key: 'slotBFilter.fltEnvAmt.morphPedal', name: 'Edt_Syn_kFltEnvAmt@Pedal', block: 14, bit: 135, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Pedal morph' },
  { key: 'slotBFilter.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@ATouch', block: 14, bit: 143, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · ATouch morph' },
  { key: 'slotBFilter.fltEnvAmt.morphVelocity', name: 'Edt_Syn_kFltEnvAmt@Velocity', block: 14, bit: 151, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Velocity morph' },
  { key: 'slotBFilter.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 14, bit: 159, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188' },
  { key: 'slotBFilter.fltEnvAtk.morphImpulse', name: 'Edt_Syn_kFltEnvAtk@Impulse', block: 14, bit: 166, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Impulse morph' },
  { key: 'slotBFilter.fltEnvAtk.morphWheel', name: 'Edt_Syn_kFltEnvAtk@Wheel', block: 14, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Wheel morph' },
];

/** Fields 500–999 (see the generator's TS2590 note). */
const FIELDS_1: readonly FwField<Nw2FieldKey>[] = [
  { key: 'slotBFilter.fltEnvAtk.morphPedal', name: 'Edt_Syn_kFltEnvAtk@Pedal', block: 14, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Pedal morph' },
  { key: 'slotBFilter.fltEnvAtk.morphAfterTouch', name: 'Edt_Syn_kFltEnvAtk@ATouch', block: 14, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · ATouch morph' },
  { key: 'slotBFilter.fltEnvAtk.morphVelocity', name: 'Edt_Syn_kFltEnvAtk@Velocity', block: 14, bit: 198, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Velocity morph' },
  { key: 'slotBFilter.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 14, bit: 206, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189' },
  { key: 'slotBFilter.fltEnvDcy.morphImpulse', name: 'Edt_Syn_kFltEnvDcy@Impulse', block: 14, bit: 213, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Impulse morph' },
  { key: 'slotBFilter.fltEnvDcy.morphWheel', name: 'Edt_Syn_kFltEnvDcy@Wheel', block: 14, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Wheel morph' },
  { key: 'slotBFilter.fltEnvDcy.morphPedal', name: 'Edt_Syn_kFltEnvDcy@Pedal', block: 14, bit: 229, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Pedal morph' },
  { key: 'slotBFilter.fltEnvDcy.morphAfterTouch', name: 'Edt_Syn_kFltEnvDcy@ATouch', block: 14, bit: 237, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · ATouch morph' },
  { key: 'slotBFilter.fltEnvDcy.morphVelocity', name: 'Edt_Syn_kFltEnvDcy@Velocity', block: 14, bit: 245, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Velocity morph' },
  { key: 'slotBFilter.fltEnvSus', name: 'Edt_Syn_kFltEnvSus', block: 14, bit: 253, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190' },
  { key: 'slotBFilter.fltEnvSus.morphImpulse', name: 'Edt_Syn_kFltEnvSus@Impulse', block: 14, bit: 260, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Impulse morph' },
  { key: 'slotBFilter.fltEnvSus.morphWheel', name: 'Edt_Syn_kFltEnvSus@Wheel', block: 14, bit: 268, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Wheel morph' },
  { key: 'slotBFilter.fltEnvSus.morphPedal', name: 'Edt_Syn_kFltEnvSus@Pedal', block: 14, bit: 276, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Pedal morph' },
  { key: 'slotBFilter.fltEnvSus.morphAfterTouch', name: 'Edt_Syn_kFltEnvSus@ATouch', block: 14, bit: 284, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · ATouch morph' },
  { key: 'slotBFilter.fltEnvSus.morphVelocity', name: 'Edt_Syn_kFltEnvSus@Velocity', block: 14, bit: 292, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Velocity morph' },
  { key: 'slotBFilter.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 14, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191' },
  { key: 'slotBFilter.fltEnvRls.morphImpulse', name: 'Edt_Syn_kFltEnvRls@Impulse', block: 14, bit: 307, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Impulse morph' },
  { key: 'slotBFilter.fltEnvRls.morphWheel', name: 'Edt_Syn_kFltEnvRls@Wheel', block: 14, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Wheel morph' },
  { key: 'slotBFilter.fltEnvRls.morphPedal', name: 'Edt_Syn_kFltEnvRls@Pedal', block: 14, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Pedal morph' },
  { key: 'slotBFilter.fltEnvRls.morphAfterTouch', name: 'Edt_Syn_kFltEnvRls@ATouch', block: 14, bit: 331, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · ATouch morph' },
  { key: 'slotBFilter.fltEnvRls.morphVelocity', name: 'Edt_Syn_kFltEnvRls@Velocity', block: 14, bit: 339, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Velocity morph' },
  { key: 'slotBFilter.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 14, bit: 347, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 192' },
  { key: 'slotBFilter.fltEnvInv', name: 'Edt_Syn_kFltEnvInv', block: 14, bit: 348, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193' },
  { key: 'slotBFilter.fltEnvInv.morphImpulse', name: 'Edt_Syn_kFltEnvInv@Impulse', block: 14, bit: 349, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193 · Impulse morph' },
  { key: 'slotBFilter.fltWhlDir', name: 'Edt_Syn_kFltWhlDir', block: 14, bit: 351, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 194' },
  { key: 'slotBFilter.fltEnable', name: 'Edt_Syn_kFltEnable', block: 14, bit: 352, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181' },
  { key: 'slotBFilter.fltEnable.morphImpulse', name: 'Edt_Syn_kFltEnable@Impulse', block: 14, bit: 353, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvTarget', name: 'Edt_Syn_kAmpEnvTarget', block: 15, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 108' },
  { key: 'slotBAmpEnv.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 15, bit: 1, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175' },
  { key: 'slotBAmpEnv.ampEnvAtk.morphImpulse', name: 'Edt_Syn_kAmpEnvAtk@Impulse', block: 15, bit: 8, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvAtk.morphWheel', name: 'Edt_Syn_kAmpEnvAtk@Wheel', block: 15, bit: 16, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Wheel morph' },
  { key: 'slotBAmpEnv.ampEnvAtk.morphPedal', name: 'Edt_Syn_kAmpEnvAtk@Pedal', block: 15, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Pedal morph' },
  { key: 'slotBAmpEnv.ampEnvAtk.morphAfterTouch', name: 'Edt_Syn_kAmpEnvAtk@ATouch', block: 15, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · ATouch morph' },
  { key: 'slotBAmpEnv.ampEnvAtk.morphVelocity', name: 'Edt_Syn_kAmpEnvAtk@Velocity', block: 15, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Velocity morph' },
  { key: 'slotBAmpEnv.ampEnvAtkFast', name: 'Edt_Syn_kAmpEnvAtkFast', block: 15, bit: 48, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176' },
  { key: 'slotBAmpEnv.ampEnvAtkFast.morphImpulse', name: 'Edt_Syn_kAmpEnvAtkFast@Impulse', block: 15, bit: 49, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 15, bit: 51, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177' },
  { key: 'slotBAmpEnv.ampEnvDcy.morphImpulse', name: 'Edt_Syn_kAmpEnvDcy@Impulse', block: 15, bit: 58, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvDcy.morphWheel', name: 'Edt_Syn_kAmpEnvDcy@Wheel', block: 15, bit: 66, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Wheel morph' },
  { key: 'slotBAmpEnv.ampEnvDcy.morphPedal', name: 'Edt_Syn_kAmpEnvDcy@Pedal', block: 15, bit: 74, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Pedal morph' },
  { key: 'slotBAmpEnv.ampEnvDcy.morphAfterTouch', name: 'Edt_Syn_kAmpEnvDcy@ATouch', block: 15, bit: 82, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · ATouch morph' },
  { key: 'slotBAmpEnv.ampEnvDcy.morphVelocity', name: 'Edt_Syn_kAmpEnvDcy@Velocity', block: 15, bit: 90, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Velocity morph' },
  { key: 'slotBAmpEnv.ampEnvSus', name: 'Edt_Syn_kAmpEnvSus', block: 15, bit: 98, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178' },
  { key: 'slotBAmpEnv.ampEnvSus.morphImpulse', name: 'Edt_Syn_kAmpEnvSus@Impulse', block: 15, bit: 105, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvSus.morphWheel', name: 'Edt_Syn_kAmpEnvSus@Wheel', block: 15, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Wheel morph' },
  { key: 'slotBAmpEnv.ampEnvSus.morphPedal', name: 'Edt_Syn_kAmpEnvSus@Pedal', block: 15, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Pedal morph' },
  { key: 'slotBAmpEnv.ampEnvSus.morphAfterTouch', name: 'Edt_Syn_kAmpEnvSus@ATouch', block: 15, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · ATouch morph' },
  { key: 'slotBAmpEnv.ampEnvSus.morphVelocity', name: 'Edt_Syn_kAmpEnvSus@Velocity', block: 15, bit: 137, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Velocity morph' },
  { key: 'slotBAmpEnv.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 15, bit: 145, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179' },
  { key: 'slotBAmpEnv.ampEnvRls.morphImpulse', name: 'Edt_Syn_kAmpEnvRls@Impulse', block: 15, bit: 152, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Impulse morph' },
  { key: 'slotBAmpEnv.ampEnvRls.morphWheel', name: 'Edt_Syn_kAmpEnvRls@Wheel', block: 15, bit: 160, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Wheel morph' },
  { key: 'slotBAmpEnv.ampEnvRls.morphPedal', name: 'Edt_Syn_kAmpEnvRls@Pedal', block: 15, bit: 168, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Pedal morph' },
  { key: 'slotBAmpEnv.ampEnvRls.morphAfterTouch', name: 'Edt_Syn_kAmpEnvRls@ATouch', block: 15, bit: 176, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · ATouch morph' },
  { key: 'slotBAmpEnv.ampEnvRls.morphVelocity', name: 'Edt_Syn_kAmpEnvRls@Velocity', block: 15, bit: 184, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Velocity morph' },
  { key: 'slotBAmpEnv.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 15, bit: 192, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 180' },
  { key: 'slotBFx.fxTarget', name: 'Edt_Effects_kFxTarget', block: 16, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 109' },
  { key: 'slotBFx.fxClkEnable', name: 'Edt_Effects_kFxClkEnable', block: 16, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 238' },
  { key: 'slotBFx.fxType', name: 'Edt_Effects_kFxType', block: 16, bit: 2, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237' },
  { key: 'slotBFx.fxType.morphImpulse', name: 'Edt_Effects_kFxType@Impulse', block: 16, bit: 5, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237 · Impulse morph' },
  { key: 'slotBFx.fxRateClkDiv', name: 'Edt_Effects_kFxRateClkDiv', block: 16, bit: 9, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239' },
  { key: 'slotBFx.fxRateClkDiv.morphImpulse', name: 'Edt_Effects_kFxRateClkDiv@Impulse', block: 16, bit: 16, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Impulse morph' },
  { key: 'slotBFx.fxRateClkDiv.morphWheel', name: 'Edt_Effects_kFxRateClkDiv@Wheel', block: 16, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Wheel morph' },
  { key: 'slotBFx.fxRateClkDiv.morphPedal', name: 'Edt_Effects_kFxRateClkDiv@Pedal', block: 16, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Pedal morph' },
  { key: 'slotBFx.fxRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFxRateClkDiv@ATouch', block: 16, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · ATouch morph' },
  { key: 'slotBFx.fxRateClkDiv.morphVelocity', name: 'Edt_Effects_kFxRateClkDiv@Velocity', block: 16, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Velocity morph' },
  { key: 'slotBFx.fxAmt', name: 'Edt_Effects_kFxAmt', block: 16, bit: 56, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240' },
  { key: 'slotBFx.fxAmt.morphImpulse', name: 'Edt_Effects_kFxAmt@Impulse', block: 16, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Impulse morph' },
  { key: 'slotBFx.fxAmt.morphWheel', name: 'Edt_Effects_kFxAmt@Wheel', block: 16, bit: 71, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Wheel morph' },
  { key: 'slotBFx.fxAmt.morphPedal', name: 'Edt_Effects_kFxAmt@Pedal', block: 16, bit: 79, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Pedal morph' },
  { key: 'slotBFx.fxAmt.morphAfterTouch', name: 'Edt_Effects_kFxAmt@ATouch', block: 16, bit: 87, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · ATouch morph' },
  { key: 'slotBFx.fxAmt.morphVelocity', name: 'Edt_Effects_kFxAmt@Velocity', block: 16, bit: 95, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Velocity morph' },
  { key: 'slotBFx.fxEnable', name: 'Edt_Effects_kFxEnable', block: 16, bit: 103, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236' },
  { key: 'slotBFx.fxEnable.morphImpulse', name: 'Edt_Effects_kFxEnable@Impulse', block: 16, bit: 104, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236 · Impulse morph' },
  { key: 'slotBEq.eqTarget', name: 'Edt_Effects_kEqTarget', block: 17, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 110' },
  { key: 'slotBEq.eqType', name: 'Edt_Effects_kEqType', block: 17, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 256' },
  { key: 'slotBEq.eqTreble', name: 'Edt_Effects_kEqTreble', block: 17, bit: 2, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 253' },
  { key: 'slotBEq.eqBass', name: 'Edt_Effects_kEqBass', block: 17, bit: 9, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 254' },
  { key: 'slotBEq.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 17, bit: 16, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 257' },
  { key: 'slotBEq.eqMidGain', name: 'Edt_Effects_kEqMidGain', block: 17, bit: 23, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 258' },
  { key: 'slotBEq.eqDrive', name: 'Edt_Effects_kEqDrive', block: 17, bit: 30, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255' },
  { key: 'slotBEq.eqDrive.morphImpulse', name: 'Edt_Effects_kEqDrive@Impulse', block: 17, bit: 37, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Impulse morph' },
  { key: 'slotBEq.eqDrive.morphWheel', name: 'Edt_Effects_kEqDrive@Wheel', block: 17, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Wheel morph' },
  { key: 'slotBEq.eqDrive.morphPedal', name: 'Edt_Effects_kEqDrive@Pedal', block: 17, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Pedal morph' },
  { key: 'slotBEq.eqDrive.morphAfterTouch', name: 'Edt_Effects_kEqDrive@ATouch', block: 17, bit: 61, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · ATouch morph' },
  { key: 'slotBEq.eqDrive.morphVelocity', name: 'Edt_Effects_kEqDrive@Velocity', block: 17, bit: 69, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Velocity morph' },
  { key: 'slotBEq.eqEnable', name: 'Edt_Effects_kEqEnable', block: 17, bit: 77, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252' },
  { key: 'slotBEq.eqEnable.morphImpulse', name: 'Edt_Effects_kEqEnable@Impulse', block: 17, bit: 78, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252 · Impulse morph' },
  { key: 'slotBDelay.dlyTarget', name: 'Edt_Effects_kDlyTarget', block: 18, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 111' },
  { key: 'slotBDelay.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 18, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 242' },
  { key: 'slotBDelay.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 18, bit: 2, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243' },
  { key: 'slotBDelay.dlyRateClkDiv.morphImpulse', name: 'Edt_Effects_kDlyRateClkDiv@Impulse', block: 18, bit: 16, width: 15, min: 0, max: 16384, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Impulse morph' },
  { key: 'slotBDelay.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 18, bit: 31, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Wheel morph' },
  { key: 'slotBDelay.dlyRateClkDiv.morphPedal', name: 'Edt_Effects_kDlyRateClkDiv@Pedal', block: 18, bit: 46, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Pedal morph' },
  { key: 'slotBDelay.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@ATouch', block: 18, bit: 61, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · ATouch morph' },
  { key: 'slotBDelay.dlyRateClkDiv.morphVelocity', name: 'Edt_Effects_kDlyRateClkDiv@Velocity', block: 18, bit: 76, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Velocity morph' },
  { key: 'slotBDelay.dlyMix', name: 'Edt_Effects_kDlyMix', block: 18, bit: 91, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245' },
  { key: 'slotBDelay.dlyMix.morphImpulse', name: 'Edt_Effects_kDlyMix@Impulse', block: 18, bit: 98, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Impulse morph' },
  { key: 'slotBDelay.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 18, bit: 106, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Wheel morph' },
  { key: 'slotBDelay.dlyMix.morphPedal', name: 'Edt_Effects_kDlyMix@Pedal', block: 18, bit: 114, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Pedal morph' },
  { key: 'slotBDelay.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@ATouch', block: 18, bit: 122, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · ATouch morph' },
  { key: 'slotBDelay.dlyMix.morphVelocity', name: 'Edt_Effects_kDlyMix@Velocity', block: 18, bit: 130, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Velocity morph' },
  { key: 'slotBDelay.dlyMode', name: 'Edt_Effects_kDlyMode', block: 18, bit: 138, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246' },
  { key: 'slotBDelay.dlyMode.morphImpulse', name: 'Edt_Effects_kDlyMode@Impulse', block: 18, bit: 139, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246 · Impulse morph' },
  { key: 'slotBDelay.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 18, bit: 141, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247' },
  { key: 'slotBDelay.dlyFbkPingPong.morphImpulse', name: 'Edt_Effects_kDlyFbkPingPong@Impulse', block: 18, bit: 142, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247 · Impulse morph' },
  { key: 'slotBDelay.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 18, bit: 144, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248' },
  { key: 'slotBDelay.dlyFbkFilt.morphImpulse', name: 'Edt_Effects_kDlyFbkFilt@Impulse', block: 18, bit: 146, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248 · Impulse morph' },
  { key: 'slotBDelay.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 18, bit: 149, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249' },
  { key: 'slotBDelay.dlyFbkAmt.morphImpulse', name: 'Edt_Effects_kDlyFbkAmt@Impulse', block: 18, bit: 156, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Impulse morph' },
  { key: 'slotBDelay.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 18, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Wheel morph' },
  { key: 'slotBDelay.dlyFbkAmt.morphPedal', name: 'Edt_Effects_kDlyFbkAmt@Pedal', block: 18, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Pedal morph' },
  { key: 'slotBDelay.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@ATouch', block: 18, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · ATouch morph' },
  { key: 'slotBDelay.dlyFbkAmt.morphVelocity', name: 'Edt_Effects_kDlyFbkAmt@Velocity', block: 18, bit: 188, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Velocity morph' },
  { key: 'slotBDelay.dlyFbkFx', name: 'Edt_Effects_kDlyFbkFx', block: 18, bit: 196, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250' },
  { key: 'slotBDelay.dlyFbkFx.morphImpulse', name: 'Edt_Effects_kDlyFbkFx@Impulse', block: 18, bit: 198, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250 · Impulse morph' },
  { key: 'slotBDelay.dlyFbkDeep', name: 'Edt_Effects_kDlyFbkDeep', block: 18, bit: 201, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251' },
  { key: 'slotBDelay.dlyFbkDeep.morphImpulse', name: 'Edt_Effects_kDlyFbkDeep@Impulse', block: 18, bit: 202, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251 · Impulse morph' },
  { key: 'slotBDelay.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 18, bit: 204, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241' },
  { key: 'slotBDelay.dlyEnable.morphImpulse', name: 'Edt_Effects_kDlyEnable@Impulse', block: 18, bit: 205, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241 · Impulse morph' },
  { key: 'slotBReverb.rvbTarget', name: 'Edt_Effects_kRvbTarget', block: 19, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 112' },
  { key: 'slotBReverb.rvbType', name: 'Edt_Effects_kRvbType', block: 19, bit: 1, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260' },
  { key: 'slotBReverb.rvbType.morphImpulse', name: 'Edt_Effects_kRvbType@Impulse', block: 19, bit: 4, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260 · Impulse morph' },
  { key: 'slotBReverb.rvbColor', name: 'Edt_Effects_kRvbColor', block: 19, bit: 8, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261' },
  { key: 'slotBReverb.rvbColor.morphImpulse', name: 'Edt_Effects_kRvbColor@Impulse', block: 19, bit: 10, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261 · Impulse morph' },
  { key: 'slotBReverb.rvbModulate', name: 'Edt_Effects_kRvbModulate', block: 19, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263' },
  { key: 'slotBReverb.rvbModulate.morphImpulse', name: 'Edt_Effects_kRvbModulate@Impulse', block: 19, bit: 14, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263 · Impulse morph' },
  { key: 'slotBReverb.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 19, bit: 16, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262' },
  { key: 'slotBReverb.rvbAmt.morphImpulse', name: 'Edt_Effects_kRvbAmt@Impulse', block: 19, bit: 23, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Impulse morph' },
  { key: 'slotBReverb.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 19, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Wheel morph' },
  { key: 'slotBReverb.rvbAmt.morphPedal', name: 'Edt_Effects_kRvbAmt@Pedal', block: 19, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Pedal morph' },
  { key: 'slotBReverb.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@ATouch', block: 19, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · ATouch morph' },
  { key: 'slotBReverb.rvbAmt.morphVelocity', name: 'Edt_Effects_kRvbAmt@Velocity', block: 19, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Velocity morph' },
  { key: 'slotBReverb.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 19, bit: 63, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259' },
  { key: 'slotBReverb.rvbEnable.morphImpulse', name: 'Edt_Effects_kRvbEnable@Impulse', block: 19, bit: 64, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259 · Impulse morph' },
  { key: 'slotBVibrato.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 20, bit: 0, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 136' },
  { key: 'slotBVibrato.vibratoAmount', name: 'Edt_Syn_kVibratoAmount', block: 20, bit: 7, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 137' },
  { key: 'slotCCommon.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 21, bit: 0, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128' },
  { key: 'slotCCommon.octaveShift.morphImpulse', name: 'Edt_Syn_kOctaveShift@Impulse', block: 21, bit: 4, width: 5, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128 · Impulse morph' },
  { key: 'slotCCommon.pitchStickEnable', name: 'Edt_Syn_kPitchStickEnable', block: 21, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 129' },
  { key: 'slotCCommon.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 21, bit: 10, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 130' },
  { key: 'slotCCommon.kbdHoldEnable', name: 'Edt_Syn_kKbdHoldEnable', block: 21, bit: 11, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 132' },
  { key: 'slotCCommon.vibratoMode', name: 'Edt_Syn_kVibratoMode', block: 21, bit: 12, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135' },
  { key: 'slotCCommon.vibratoMode.morphImpulse', name: 'Edt_Syn_kVibratoMode@Impulse', block: 21, bit: 15, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135 · Impulse morph' },
  { key: 'slotCCommon.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 21, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133' },
  { key: 'slotCCommon.voiceMode.morphImpulse', name: 'Edt_Syn_kVoiceMode@Impulse', block: 21, bit: 21, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133 · Impulse morph' },
  { key: 'slotCCommon.glideRate', name: 'Edt_Syn_kGlideRate', block: 21, bit: 24, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134' },
  { key: 'slotCCommon.glideRate.morphImpulse', name: 'Edt_Syn_kGlideRate@Impulse', block: 21, bit: 31, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Impulse morph' },
  { key: 'slotCCommon.glideRate.morphWheel', name: 'Edt_Syn_kGlideRate@Wheel', block: 21, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Wheel morph' },
  { key: 'slotCCommon.glideRate.morphPedal', name: 'Edt_Syn_kGlideRate@Pedal', block: 21, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Pedal morph' },
  { key: 'slotCCommon.glideRate.morphAfterTouch', name: 'Edt_Syn_kGlideRate@ATouch', block: 21, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · ATouch morph' },
  { key: 'slotCCommon.glideRate.morphVelocity', name: 'Edt_Syn_kGlideRate@Velocity', block: 21, bit: 63, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Velocity morph' },
  { key: 'slotCCommon.oscBank', name: 'Edt_Syn_kOscBank', block: 21, bit: 71, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 167' },
  { key: 'slotCCommon.oscWave', name: 'Edt_Syn_kOscWave', block: 21, bit: 74, width: 16, min: 0, max: 4095, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 168' },
  { key: 'slotCCommon.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 21, bit: 90, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170' },
  { key: 'slotCCommon.oscCtrl.morphImpulse', name: 'Edt_Syn_kOscCtrl@Impulse', block: 21, bit: 97, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Impulse morph' },
  { key: 'slotCCommon.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 21, bit: 105, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Wheel morph' },
  { key: 'slotCCommon.oscCtrl.morphPedal', name: 'Edt_Syn_kOscCtrl@Pedal', block: 21, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Pedal morph' },
  { key: 'slotCCommon.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@ATouch', block: 21, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · ATouch morph' },
  { key: 'slotCCommon.oscCtrl.morphVelocity', name: 'Edt_Syn_kOscCtrl@Velocity', block: 21, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Velocity morph' },
  { key: 'slotCCommon.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 21, bit: 137, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171' },
  { key: 'slotCCommon.oscTuneFine.morphImpulse', name: 'Edt_Syn_kOscTuneFine@Impulse', block: 21, bit: 144, width: 8, min: 0, max: 101, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Impulse morph' },
  { key: 'slotCCommon.oscTuneFine.morphWheel', name: 'Edt_Syn_kOscTuneFine@Wheel', block: 21, bit: 152, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Wheel morph' },
  { key: 'slotCCommon.oscTuneFine.morphPedal', name: 'Edt_Syn_kOscTuneFine@Pedal', block: 21, bit: 160, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Pedal morph' },
  { key: 'slotCCommon.oscTuneFine.morphAfterTouch', name: 'Edt_Syn_kOscTuneFine@ATouch', block: 21, bit: 168, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · ATouch morph' },
  { key: 'slotCCommon.oscTuneFine.morphVelocity', name: 'Edt_Syn_kOscTuneFine@Velocity', block: 21, bit: 176, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Velocity morph' },
  { key: 'slotCCommon.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 21, bit: 184, width: 7, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172' },
  { key: 'slotCCommon.oscTuneCoarse.morphImpulse', name: 'Edt_Syn_kOscTuneCoarse@Impulse', block: 21, bit: 191, width: 8, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Impulse morph' },
  { key: 'slotCCommon.oscTuneCoarse.morphWheel', name: 'Edt_Syn_kOscTuneCoarse@Wheel', block: 21, bit: 199, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Wheel morph' },
  { key: 'slotCCommon.oscTuneCoarse.morphPedal', name: 'Edt_Syn_kOscTuneCoarse@Pedal', block: 21, bit: 207, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Pedal morph' },
  { key: 'slotCCommon.oscTuneCoarse.morphAfterTouch', name: 'Edt_Syn_kOscTuneCoarse@ATouch', block: 21, bit: 215, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · ATouch morph' },
  { key: 'slotCCommon.oscTuneCoarse.morphVelocity', name: 'Edt_Syn_kOscTuneCoarse@Velocity', block: 21, bit: 223, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Velocity morph' },
  { key: 'slotCCommon.oscDualMode', name: 'Edt_Syn_kOscDualMode', block: 21, bit: 231, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173' },
  { key: 'slotCCommon.oscDualMode.morphImpulse', name: 'Edt_Syn_kOscDualMode@Impulse', block: 21, bit: 233, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173 · Impulse morph' },
  { key: 'slotCCommon.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 21, bit: 236, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160' },
  { key: 'slotCCommon.oscEnvAtk.morphImpulse', name: 'Edt_Syn_kOscEnvAtk@Impulse', block: 21, bit: 243, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Impulse morph' },
  { key: 'slotCCommon.oscEnvAtk.morphWheel', name: 'Edt_Syn_kOscEnvAtk@Wheel', block: 21, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Wheel morph' },
  { key: 'slotCCommon.oscEnvAtk.morphPedal', name: 'Edt_Syn_kOscEnvAtk@Pedal', block: 21, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Pedal morph' },
  { key: 'slotCCommon.oscEnvAtk.morphAfterTouch', name: 'Edt_Syn_kOscEnvAtk@ATouch', block: 21, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · ATouch morph' },
  { key: 'slotCCommon.oscEnvAtk.morphVelocity', name: 'Edt_Syn_kOscEnvAtk@Velocity', block: 21, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Velocity morph' },
  { key: 'slotCCommon.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 21, bit: 283, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161' },
  { key: 'slotCCommon.oscEnvDcy.morphImpulse', name: 'Edt_Syn_kOscEnvDcy@Impulse', block: 21, bit: 290, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Impulse morph' },
  { key: 'slotCCommon.oscEnvDcy.morphWheel', name: 'Edt_Syn_kOscEnvDcy@Wheel', block: 21, bit: 298, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Wheel morph' },
  { key: 'slotCCommon.oscEnvDcy.morphPedal', name: 'Edt_Syn_kOscEnvDcy@Pedal', block: 21, bit: 306, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Pedal morph' },
  { key: 'slotCCommon.oscEnvDcy.morphAfterTouch', name: 'Edt_Syn_kOscEnvDcy@ATouch', block: 21, bit: 314, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · ATouch morph' },
  { key: 'slotCCommon.oscEnvDcy.morphVelocity', name: 'Edt_Syn_kOscEnvDcy@Velocity', block: 21, bit: 322, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Velocity morph' },
  { key: 'slotCCommon.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 21, bit: 330, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162' },
  { key: 'slotCCommon.oscEnvAmt.morphImpulse', name: 'Edt_Syn_kOscEnvAmt@Impulse', block: 21, bit: 337, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Impulse morph' },
  { key: 'slotCCommon.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 21, bit: 345, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Wheel morph' },
  { key: 'slotCCommon.oscEnvAmt.morphPedal', name: 'Edt_Syn_kOscEnvAmt@Pedal', block: 21, bit: 353, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Pedal morph' },
  { key: 'slotCCommon.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@ATouch', block: 21, bit: 361, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · ATouch morph' },
  { key: 'slotCCommon.oscEnvAmt.morphVelocity', name: 'Edt_Syn_kOscEnvAmt@Velocity', block: 21, bit: 369, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Velocity morph' },
  { key: 'slotCCommon.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 21, bit: 377, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165' },
  { key: 'slotCCommon.oscEnvDst.morphImpulse', name: 'Edt_Syn_kOscEnvDst@Impulse', block: 21, bit: 379, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165 · Impulse morph' },
  { key: 'slotCCommon.oscEnvMode', name: 'Edt_Syn_kOscEnvMode', block: 21, bit: 382, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163' },
  { key: 'slotCCommon.oscEnvMode.morphImpulse', name: 'Edt_Syn_kOscEnvMode@Impulse', block: 21, bit: 383, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163 · Impulse morph' },
  { key: 'slotCCommon.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 21, bit: 385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 164' },
  { key: 'slotCCommon.oscWhlDir', name: 'Edt_Syn_kOscWhlDir', block: 21, bit: 386, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 174' },
  { key: 'slotCCommon.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 21, bit: 387, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 235' },
  { key: 'slotCCommon.smpPresets', name: 'Edt_Syn_kSmpPresets', block: 21, bit: 419, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 233' },
  { key: 'slotCCommon.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 21, bit: 420, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232' },
  { key: 'slotCCommon.smpFastAtk.morphImpulse', name: 'Edt_Syn_kSmpFastAtk@Impulse', block: 21, bit: 421, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232 · Impulse morph' },
  { key: 'slotCCommon.smpVibRateUsageEol', name: 'Edt_Syn_kSmpVibRateUsage_EOL', block: 21, bit: 423, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 200' },
  { key: 'slotCArp.arpRun', name: 'Edt_Syn_kArpRun', block: 22, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140' },
  { key: 'slotCArp.arpRun.morphImpulse', name: 'Edt_Syn_kArpRun@Impulse', block: 22, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140 · Impulse morph' },
  { key: 'slotCArp.arpTarget', name: 'Edt_Syn_kArpTarget', block: 22, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 106' },
  { key: 'slotCArp.arpMode', name: 'Edt_Syn_kArpMode', block: 22, bit: 4, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138' },
  { key: 'slotCArp.arpMode.morphImpulse', name: 'Edt_Syn_kArpMode@Impulse', block: 22, bit: 6, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138 · Impulse morph' },
  { key: 'slotCArp.arpModePtn', name: 'Edt_Syn_kArpModePtn', block: 22, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139' },
  { key: 'slotCArp.arpModePtn.morphImpulse', name: 'Edt_Syn_kArpModePtn@Impulse', block: 22, bit: 10, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139 · Impulse morph' },
  { key: 'slotCArp.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 22, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141' },
  { key: 'slotCArp.arpKbdSync.morphImpulse', name: 'Edt_Syn_kArpKbdSync@Impulse', block: 22, bit: 13, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141 · Impulse morph' },
  { key: 'slotCArp.arpRange', name: 'Edt_Syn_kArpRange', block: 22, bit: 15, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142' },
  { key: 'slotCArp.arpRange.morphImpulse', name: 'Edt_Syn_kArpRange@Impulse', block: 22, bit: 22, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Impulse morph' },
  { key: 'slotCArp.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 22, bit: 30, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Wheel morph' },
  { key: 'slotCArp.arpRange.morphPedal', name: 'Edt_Syn_kArpRange@Pedal', block: 22, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Pedal morph' },
  { key: 'slotCArp.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@ATouch', block: 22, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · ATouch morph' },
  { key: 'slotCArp.arpRange.morphVelocity', name: 'Edt_Syn_kArpRange@Velocity', block: 22, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Velocity morph' },
  { key: 'slotCArp.arpPattern', name: 'Edt_Syn_kArpPattern', block: 22, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143' },
  { key: 'slotCArp.arpPattern.morphImpulse', name: 'Edt_Syn_kArpPattern@Impulse', block: 22, bit: 64, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143 · Impulse morph' },
  { key: 'slotCArp.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 22, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144' },
  { key: 'slotCArp.arpZigZag.morphImpulse', name: 'Edt_Syn_kArpZigZag@Impulse', block: 22, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144 · Impulse morph' },
  { key: 'slotCArp.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 22, bit: 70, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 145' },
  { key: 'slotCArp.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 22, bit: 71, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146' },
  { key: 'slotCArp.arpRateClkDiv.morphImpulse', name: 'Edt_Syn_kArpRateClkDiv@Impulse', block: 22, bit: 78, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Impulse morph' },
  { key: 'slotCArp.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 22, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Wheel morph' },
  { key: 'slotCArp.arpRateClkDiv.morphPedal', name: 'Edt_Syn_kArpRateClkDiv@Pedal', block: 22, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Pedal morph' },
  { key: 'slotCArp.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@ATouch', block: 22, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · ATouch morph' },
  { key: 'slotCArp.arpRateClkDiv.morphVelocity', name: 'Edt_Syn_kArpRateClkDiv@Velocity', block: 22, bit: 110, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Velocity morph' },
  { key: 'slotCArp.gateSeqLength', name: 'Edt_Syn_kGateSeqLength', block: 22, bit: 118, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 149' },
  { key: 'slotCArp.gatePtnAcc', name: 'Edt_Syn_kGatePtnAcc', block: 22, bit: 122, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 151' },
  { key: 'slotCArp.gatePtnDur', name: 'Edt_Syn_kGatePtnDur', block: 22, bit: 154, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 152' },
  { key: 'slotCArp.gatePtnPan', name: 'Edt_Syn_kGatePtnPan', block: 22, bit: 186, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 153' },
  { key: 'slotCArp.gateSeqDivider', name: 'Edt_Syn_kGateSeqDivider', block: 22, bit: 218, width: 7, min: 0, max: 8, def: 4, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 150' },
  { key: 'slotCLfo.lfoDst', name: 'Edt_Syn_kLFODst', block: 23, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154' },
  { key: 'slotCLfo.lfoDst.morphImpulse', name: 'Edt_Syn_kLFODst@Impulse', block: 23, bit: 2, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154 · Impulse morph' },
  { key: 'slotCLfo.lfoTarget', name: 'Edt_Syn_kLFOTarget', block: 23, bit: 5, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 105' },
  { key: 'slotCLfo.lfoWave', name: 'Edt_Syn_kLFOWave', block: 23, bit: 6, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155' },
  { key: 'slotCLfo.lfoWave.morphImpulse', name: 'Edt_Syn_kLFOWave@Impulse', block: 23, bit: 9, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155 · Impulse morph' },
  { key: 'slotCLfo.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 23, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 156' },
  { key: 'slotCLfo.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 23, bit: 14, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157' },
  { key: 'slotCLfo.lfoRateClkDiv.morphImpulse', name: 'Edt_Syn_kLFORateClkDiv@Impulse', block: 23, bit: 21, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Impulse morph' },
  { key: 'slotCLfo.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 23, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Wheel morph' },
  { key: 'slotCLfo.lfoRateClkDiv.morphPedal', name: 'Edt_Syn_kLFORateClkDiv@Pedal', block: 23, bit: 37, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Pedal morph' },
  { key: 'slotCLfo.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@ATouch', block: 23, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · ATouch morph' },
  { key: 'slotCLfo.lfoRateClkDiv.morphVelocity', name: 'Edt_Syn_kLFORateClkDiv@Velocity', block: 23, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Velocity morph' },
  { key: 'slotCLfo.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 23, bit: 61, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158' },
  { key: 'slotCLfo.lfoAmt.morphImpulse', name: 'Edt_Syn_kLFOAmt@Impulse', block: 23, bit: 68, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Impulse morph' },
  { key: 'slotCLfo.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 23, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Wheel morph' },
  { key: 'slotCLfo.lfoAmt.morphPedal', name: 'Edt_Syn_kLFOAmt@Pedal', block: 23, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Pedal morph' },
  { key: 'slotCLfo.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@ATouch', block: 23, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · ATouch morph' },
  { key: 'slotCLfo.lfoAmt.morphVelocity', name: 'Edt_Syn_kLFOAmt@Velocity', block: 23, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Velocity morph' },
  { key: 'slotCLfo.lfoWhlDir', name: 'Edt_Syn_kLFOWhlDir', block: 23, bit: 108, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 159' },
  { key: 'slotCFilter.fltTarget', name: 'Edt_Syn_kFltTarget', block: 24, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 107' },
  { key: 'slotCFilter.fltType', name: 'Edt_Syn_kFltType', block: 24, bit: 1, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182' },
  { key: 'slotCFilter.fltType.morphImpulse', name: 'Edt_Syn_kFltType@Impulse', block: 24, bit: 4, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182 · Impulse morph' },
  { key: 'slotCFilter.fltFreq', name: 'Edt_Syn_kFltFreq', block: 24, bit: 8, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183' },
  { key: 'slotCFilter.fltFreq.morphImpulse', name: 'Edt_Syn_kFltFreq@Impulse', block: 24, bit: 15, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Impulse morph' },
  { key: 'slotCFilter.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 24, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Wheel morph' },
  { key: 'slotCFilter.fltFreq.morphPedal', name: 'Edt_Syn_kFltFreq@Pedal', block: 24, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Pedal morph' },
  { key: 'slotCFilter.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@ATouch', block: 24, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · ATouch morph' },
  { key: 'slotCFilter.fltFreq.morphVelocity', name: 'Edt_Syn_kFltFreq@Velocity', block: 24, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Velocity morph' },
  { key: 'slotCFilter.fltRes', name: 'Edt_Syn_kFltRes', block: 24, bit: 55, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184' },
  { key: 'slotCFilter.fltRes.morphImpulse', name: 'Edt_Syn_kFltRes@Impulse', block: 24, bit: 62, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Impulse morph' },
  { key: 'slotCFilter.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 24, bit: 70, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Wheel morph' },
  { key: 'slotCFilter.fltRes.morphPedal', name: 'Edt_Syn_kFltRes@Pedal', block: 24, bit: 78, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Pedal morph' },
  { key: 'slotCFilter.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@ATouch', block: 24, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · ATouch morph' },
  { key: 'slotCFilter.fltRes.morphVelocity', name: 'Edt_Syn_kFltRes@Velocity', block: 24, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Velocity morph' },
  { key: 'slotCFilter.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 24, bit: 102, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185' },
  { key: 'slotCFilter.fltKbdTrk.morphImpulse', name: 'Edt_Syn_kFltKbdTrk@Impulse', block: 24, bit: 104, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185 · Impulse morph' },
  { key: 'slotCFilter.fltDrive', name: 'Edt_Syn_kFltDrive', block: 24, bit: 107, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186' },
  { key: 'slotCFilter.fltDrive.morphImpulse', name: 'Edt_Syn_kFltDrive@Impulse', block: 24, bit: 109, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186 · Impulse morph' },
  { key: 'slotCFilter.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 24, bit: 112, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187' },
  { key: 'slotCFilter.fltEnvAmt.morphImpulse', name: 'Edt_Syn_kFltEnvAmt@Impulse', block: 24, bit: 119, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Impulse morph' },
  { key: 'slotCFilter.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 24, bit: 127, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Wheel morph' },
  { key: 'slotCFilter.fltEnvAmt.morphPedal', name: 'Edt_Syn_kFltEnvAmt@Pedal', block: 24, bit: 135, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Pedal morph' },
  { key: 'slotCFilter.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@ATouch', block: 24, bit: 143, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · ATouch morph' },
  { key: 'slotCFilter.fltEnvAmt.morphVelocity', name: 'Edt_Syn_kFltEnvAmt@Velocity', block: 24, bit: 151, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Velocity morph' },
  { key: 'slotCFilter.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 24, bit: 159, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188' },
  { key: 'slotCFilter.fltEnvAtk.morphImpulse', name: 'Edt_Syn_kFltEnvAtk@Impulse', block: 24, bit: 166, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Impulse morph' },
  { key: 'slotCFilter.fltEnvAtk.morphWheel', name: 'Edt_Syn_kFltEnvAtk@Wheel', block: 24, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Wheel morph' },
  { key: 'slotCFilter.fltEnvAtk.morphPedal', name: 'Edt_Syn_kFltEnvAtk@Pedal', block: 24, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Pedal morph' },
  { key: 'slotCFilter.fltEnvAtk.morphAfterTouch', name: 'Edt_Syn_kFltEnvAtk@ATouch', block: 24, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · ATouch morph' },
  { key: 'slotCFilter.fltEnvAtk.morphVelocity', name: 'Edt_Syn_kFltEnvAtk@Velocity', block: 24, bit: 198, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Velocity morph' },
  { key: 'slotCFilter.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 24, bit: 206, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189' },
  { key: 'slotCFilter.fltEnvDcy.morphImpulse', name: 'Edt_Syn_kFltEnvDcy@Impulse', block: 24, bit: 213, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Impulse morph' },
  { key: 'slotCFilter.fltEnvDcy.morphWheel', name: 'Edt_Syn_kFltEnvDcy@Wheel', block: 24, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Wheel morph' },
  { key: 'slotCFilter.fltEnvDcy.morphPedal', name: 'Edt_Syn_kFltEnvDcy@Pedal', block: 24, bit: 229, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Pedal morph' },
  { key: 'slotCFilter.fltEnvDcy.morphAfterTouch', name: 'Edt_Syn_kFltEnvDcy@ATouch', block: 24, bit: 237, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · ATouch morph' },
  { key: 'slotCFilter.fltEnvDcy.morphVelocity', name: 'Edt_Syn_kFltEnvDcy@Velocity', block: 24, bit: 245, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Velocity morph' },
  { key: 'slotCFilter.fltEnvSus', name: 'Edt_Syn_kFltEnvSus', block: 24, bit: 253, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190' },
  { key: 'slotCFilter.fltEnvSus.morphImpulse', name: 'Edt_Syn_kFltEnvSus@Impulse', block: 24, bit: 260, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Impulse morph' },
  { key: 'slotCFilter.fltEnvSus.morphWheel', name: 'Edt_Syn_kFltEnvSus@Wheel', block: 24, bit: 268, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Wheel morph' },
  { key: 'slotCFilter.fltEnvSus.morphPedal', name: 'Edt_Syn_kFltEnvSus@Pedal', block: 24, bit: 276, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Pedal morph' },
  { key: 'slotCFilter.fltEnvSus.morphAfterTouch', name: 'Edt_Syn_kFltEnvSus@ATouch', block: 24, bit: 284, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · ATouch morph' },
  { key: 'slotCFilter.fltEnvSus.morphVelocity', name: 'Edt_Syn_kFltEnvSus@Velocity', block: 24, bit: 292, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Velocity morph' },
  { key: 'slotCFilter.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 24, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191' },
  { key: 'slotCFilter.fltEnvRls.morphImpulse', name: 'Edt_Syn_kFltEnvRls@Impulse', block: 24, bit: 307, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Impulse morph' },
  { key: 'slotCFilter.fltEnvRls.morphWheel', name: 'Edt_Syn_kFltEnvRls@Wheel', block: 24, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Wheel morph' },
  { key: 'slotCFilter.fltEnvRls.morphPedal', name: 'Edt_Syn_kFltEnvRls@Pedal', block: 24, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Pedal morph' },
  { key: 'slotCFilter.fltEnvRls.morphAfterTouch', name: 'Edt_Syn_kFltEnvRls@ATouch', block: 24, bit: 331, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · ATouch morph' },
  { key: 'slotCFilter.fltEnvRls.morphVelocity', name: 'Edt_Syn_kFltEnvRls@Velocity', block: 24, bit: 339, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Velocity morph' },
  { key: 'slotCFilter.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 24, bit: 347, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 192' },
  { key: 'slotCFilter.fltEnvInv', name: 'Edt_Syn_kFltEnvInv', block: 24, bit: 348, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193' },
  { key: 'slotCFilter.fltEnvInv.morphImpulse', name: 'Edt_Syn_kFltEnvInv@Impulse', block: 24, bit: 349, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193 · Impulse morph' },
  { key: 'slotCFilter.fltWhlDir', name: 'Edt_Syn_kFltWhlDir', block: 24, bit: 351, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 194' },
  { key: 'slotCFilter.fltEnable', name: 'Edt_Syn_kFltEnable', block: 24, bit: 352, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181' },
  { key: 'slotCFilter.fltEnable.morphImpulse', name: 'Edt_Syn_kFltEnable@Impulse', block: 24, bit: 353, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvTarget', name: 'Edt_Syn_kAmpEnvTarget', block: 25, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 108' },
  { key: 'slotCAmpEnv.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 25, bit: 1, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175' },
  { key: 'slotCAmpEnv.ampEnvAtk.morphImpulse', name: 'Edt_Syn_kAmpEnvAtk@Impulse', block: 25, bit: 8, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvAtk.morphWheel', name: 'Edt_Syn_kAmpEnvAtk@Wheel', block: 25, bit: 16, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Wheel morph' },
  { key: 'slotCAmpEnv.ampEnvAtk.morphPedal', name: 'Edt_Syn_kAmpEnvAtk@Pedal', block: 25, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Pedal morph' },
  { key: 'slotCAmpEnv.ampEnvAtk.morphAfterTouch', name: 'Edt_Syn_kAmpEnvAtk@ATouch', block: 25, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · ATouch morph' },
  { key: 'slotCAmpEnv.ampEnvAtk.morphVelocity', name: 'Edt_Syn_kAmpEnvAtk@Velocity', block: 25, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Velocity morph' },
  { key: 'slotCAmpEnv.ampEnvAtkFast', name: 'Edt_Syn_kAmpEnvAtkFast', block: 25, bit: 48, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176' },
  { key: 'slotCAmpEnv.ampEnvAtkFast.morphImpulse', name: 'Edt_Syn_kAmpEnvAtkFast@Impulse', block: 25, bit: 49, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 25, bit: 51, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177' },
  { key: 'slotCAmpEnv.ampEnvDcy.morphImpulse', name: 'Edt_Syn_kAmpEnvDcy@Impulse', block: 25, bit: 58, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvDcy.morphWheel', name: 'Edt_Syn_kAmpEnvDcy@Wheel', block: 25, bit: 66, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Wheel morph' },
  { key: 'slotCAmpEnv.ampEnvDcy.morphPedal', name: 'Edt_Syn_kAmpEnvDcy@Pedal', block: 25, bit: 74, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Pedal morph' },
  { key: 'slotCAmpEnv.ampEnvDcy.morphAfterTouch', name: 'Edt_Syn_kAmpEnvDcy@ATouch', block: 25, bit: 82, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · ATouch morph' },
  { key: 'slotCAmpEnv.ampEnvDcy.morphVelocity', name: 'Edt_Syn_kAmpEnvDcy@Velocity', block: 25, bit: 90, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Velocity morph' },
  { key: 'slotCAmpEnv.ampEnvSus', name: 'Edt_Syn_kAmpEnvSus', block: 25, bit: 98, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178' },
  { key: 'slotCAmpEnv.ampEnvSus.morphImpulse', name: 'Edt_Syn_kAmpEnvSus@Impulse', block: 25, bit: 105, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvSus.morphWheel', name: 'Edt_Syn_kAmpEnvSus@Wheel', block: 25, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Wheel morph' },
  { key: 'slotCAmpEnv.ampEnvSus.morphPedal', name: 'Edt_Syn_kAmpEnvSus@Pedal', block: 25, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Pedal morph' },
  { key: 'slotCAmpEnv.ampEnvSus.morphAfterTouch', name: 'Edt_Syn_kAmpEnvSus@ATouch', block: 25, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · ATouch morph' },
  { key: 'slotCAmpEnv.ampEnvSus.morphVelocity', name: 'Edt_Syn_kAmpEnvSus@Velocity', block: 25, bit: 137, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Velocity morph' },
  { key: 'slotCAmpEnv.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 25, bit: 145, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179' },
  { key: 'slotCAmpEnv.ampEnvRls.morphImpulse', name: 'Edt_Syn_kAmpEnvRls@Impulse', block: 25, bit: 152, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Impulse morph' },
  { key: 'slotCAmpEnv.ampEnvRls.morphWheel', name: 'Edt_Syn_kAmpEnvRls@Wheel', block: 25, bit: 160, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Wheel morph' },
  { key: 'slotCAmpEnv.ampEnvRls.morphPedal', name: 'Edt_Syn_kAmpEnvRls@Pedal', block: 25, bit: 168, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Pedal morph' },
  { key: 'slotCAmpEnv.ampEnvRls.morphAfterTouch', name: 'Edt_Syn_kAmpEnvRls@ATouch', block: 25, bit: 176, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · ATouch morph' },
  { key: 'slotCAmpEnv.ampEnvRls.morphVelocity', name: 'Edt_Syn_kAmpEnvRls@Velocity', block: 25, bit: 184, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Velocity morph' },
  { key: 'slotCAmpEnv.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 25, bit: 192, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 180' },
  { key: 'slotCFx.fxTarget', name: 'Edt_Effects_kFxTarget', block: 26, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 109' },
  { key: 'slotCFx.fxClkEnable', name: 'Edt_Effects_kFxClkEnable', block: 26, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 238' },
  { key: 'slotCFx.fxType', name: 'Edt_Effects_kFxType', block: 26, bit: 2, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237' },
  { key: 'slotCFx.fxType.morphImpulse', name: 'Edt_Effects_kFxType@Impulse', block: 26, bit: 5, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237 · Impulse morph' },
  { key: 'slotCFx.fxRateClkDiv', name: 'Edt_Effects_kFxRateClkDiv', block: 26, bit: 9, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239' },
  { key: 'slotCFx.fxRateClkDiv.morphImpulse', name: 'Edt_Effects_kFxRateClkDiv@Impulse', block: 26, bit: 16, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Impulse morph' },
  { key: 'slotCFx.fxRateClkDiv.morphWheel', name: 'Edt_Effects_kFxRateClkDiv@Wheel', block: 26, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Wheel morph' },
  { key: 'slotCFx.fxRateClkDiv.morphPedal', name: 'Edt_Effects_kFxRateClkDiv@Pedal', block: 26, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Pedal morph' },
  { key: 'slotCFx.fxRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFxRateClkDiv@ATouch', block: 26, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · ATouch morph' },
  { key: 'slotCFx.fxRateClkDiv.morphVelocity', name: 'Edt_Effects_kFxRateClkDiv@Velocity', block: 26, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Velocity morph' },
  { key: 'slotCFx.fxAmt', name: 'Edt_Effects_kFxAmt', block: 26, bit: 56, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240' },
  { key: 'slotCFx.fxAmt.morphImpulse', name: 'Edt_Effects_kFxAmt@Impulse', block: 26, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Impulse morph' },
  { key: 'slotCFx.fxAmt.morphWheel', name: 'Edt_Effects_kFxAmt@Wheel', block: 26, bit: 71, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Wheel morph' },
  { key: 'slotCFx.fxAmt.morphPedal', name: 'Edt_Effects_kFxAmt@Pedal', block: 26, bit: 79, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Pedal morph' },
  { key: 'slotCFx.fxAmt.morphAfterTouch', name: 'Edt_Effects_kFxAmt@ATouch', block: 26, bit: 87, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · ATouch morph' },
  { key: 'slotCFx.fxAmt.morphVelocity', name: 'Edt_Effects_kFxAmt@Velocity', block: 26, bit: 95, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Velocity morph' },
  { key: 'slotCFx.fxEnable', name: 'Edt_Effects_kFxEnable', block: 26, bit: 103, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236' },
  { key: 'slotCFx.fxEnable.morphImpulse', name: 'Edt_Effects_kFxEnable@Impulse', block: 26, bit: 104, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236 · Impulse morph' },
  { key: 'slotCEq.eqTarget', name: 'Edt_Effects_kEqTarget', block: 27, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 110' },
  { key: 'slotCEq.eqType', name: 'Edt_Effects_kEqType', block: 27, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 256' },
  { key: 'slotCEq.eqTreble', name: 'Edt_Effects_kEqTreble', block: 27, bit: 2, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 253' },
  { key: 'slotCEq.eqBass', name: 'Edt_Effects_kEqBass', block: 27, bit: 9, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 254' },
  { key: 'slotCEq.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 27, bit: 16, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 257' },
  { key: 'slotCEq.eqMidGain', name: 'Edt_Effects_kEqMidGain', block: 27, bit: 23, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 258' },
  { key: 'slotCEq.eqDrive', name: 'Edt_Effects_kEqDrive', block: 27, bit: 30, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255' },
  { key: 'slotCEq.eqDrive.morphImpulse', name: 'Edt_Effects_kEqDrive@Impulse', block: 27, bit: 37, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Impulse morph' },
  { key: 'slotCEq.eqDrive.morphWheel', name: 'Edt_Effects_kEqDrive@Wheel', block: 27, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Wheel morph' },
  { key: 'slotCEq.eqDrive.morphPedal', name: 'Edt_Effects_kEqDrive@Pedal', block: 27, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Pedal morph' },
  { key: 'slotCEq.eqDrive.morphAfterTouch', name: 'Edt_Effects_kEqDrive@ATouch', block: 27, bit: 61, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · ATouch morph' },
  { key: 'slotCEq.eqDrive.morphVelocity', name: 'Edt_Effects_kEqDrive@Velocity', block: 27, bit: 69, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Velocity morph' },
  { key: 'slotCEq.eqEnable', name: 'Edt_Effects_kEqEnable', block: 27, bit: 77, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252' },
  { key: 'slotCEq.eqEnable.morphImpulse', name: 'Edt_Effects_kEqEnable@Impulse', block: 27, bit: 78, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252 · Impulse morph' },
  { key: 'slotCDelay.dlyTarget', name: 'Edt_Effects_kDlyTarget', block: 28, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 111' },
  { key: 'slotCDelay.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 28, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 242' },
  { key: 'slotCDelay.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 28, bit: 2, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243' },
  { key: 'slotCDelay.dlyRateClkDiv.morphImpulse', name: 'Edt_Effects_kDlyRateClkDiv@Impulse', block: 28, bit: 16, width: 15, min: 0, max: 16384, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Impulse morph' },
  { key: 'slotCDelay.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 28, bit: 31, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Wheel morph' },
  { key: 'slotCDelay.dlyRateClkDiv.morphPedal', name: 'Edt_Effects_kDlyRateClkDiv@Pedal', block: 28, bit: 46, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Pedal morph' },
  { key: 'slotCDelay.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@ATouch', block: 28, bit: 61, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · ATouch morph' },
  { key: 'slotCDelay.dlyRateClkDiv.morphVelocity', name: 'Edt_Effects_kDlyRateClkDiv@Velocity', block: 28, bit: 76, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Velocity morph' },
  { key: 'slotCDelay.dlyMix', name: 'Edt_Effects_kDlyMix', block: 28, bit: 91, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245' },
  { key: 'slotCDelay.dlyMix.morphImpulse', name: 'Edt_Effects_kDlyMix@Impulse', block: 28, bit: 98, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Impulse morph' },
  { key: 'slotCDelay.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 28, bit: 106, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Wheel morph' },
  { key: 'slotCDelay.dlyMix.morphPedal', name: 'Edt_Effects_kDlyMix@Pedal', block: 28, bit: 114, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Pedal morph' },
  { key: 'slotCDelay.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@ATouch', block: 28, bit: 122, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · ATouch morph' },
  { key: 'slotCDelay.dlyMix.morphVelocity', name: 'Edt_Effects_kDlyMix@Velocity', block: 28, bit: 130, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Velocity morph' },
  { key: 'slotCDelay.dlyMode', name: 'Edt_Effects_kDlyMode', block: 28, bit: 138, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246' },
  { key: 'slotCDelay.dlyMode.morphImpulse', name: 'Edt_Effects_kDlyMode@Impulse', block: 28, bit: 139, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246 · Impulse morph' },
  { key: 'slotCDelay.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 28, bit: 141, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247' },
  { key: 'slotCDelay.dlyFbkPingPong.morphImpulse', name: 'Edt_Effects_kDlyFbkPingPong@Impulse', block: 28, bit: 142, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247 · Impulse morph' },
  { key: 'slotCDelay.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 28, bit: 144, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248' },
  { key: 'slotCDelay.dlyFbkFilt.morphImpulse', name: 'Edt_Effects_kDlyFbkFilt@Impulse', block: 28, bit: 146, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248 · Impulse morph' },
  { key: 'slotCDelay.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 28, bit: 149, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249' },
  { key: 'slotCDelay.dlyFbkAmt.morphImpulse', name: 'Edt_Effects_kDlyFbkAmt@Impulse', block: 28, bit: 156, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Impulse morph' },
  { key: 'slotCDelay.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 28, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Wheel morph' },
  { key: 'slotCDelay.dlyFbkAmt.morphPedal', name: 'Edt_Effects_kDlyFbkAmt@Pedal', block: 28, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Pedal morph' },
  { key: 'slotCDelay.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@ATouch', block: 28, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · ATouch morph' },
  { key: 'slotCDelay.dlyFbkAmt.morphVelocity', name: 'Edt_Effects_kDlyFbkAmt@Velocity', block: 28, bit: 188, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Velocity morph' },
  { key: 'slotCDelay.dlyFbkFx', name: 'Edt_Effects_kDlyFbkFx', block: 28, bit: 196, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250' },
  { key: 'slotCDelay.dlyFbkFx.morphImpulse', name: 'Edt_Effects_kDlyFbkFx@Impulse', block: 28, bit: 198, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250 · Impulse morph' },
  { key: 'slotCDelay.dlyFbkDeep', name: 'Edt_Effects_kDlyFbkDeep', block: 28, bit: 201, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251' },
  { key: 'slotCDelay.dlyFbkDeep.morphImpulse', name: 'Edt_Effects_kDlyFbkDeep@Impulse', block: 28, bit: 202, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251 · Impulse morph' },
  { key: 'slotCDelay.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 28, bit: 204, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241' },
  { key: 'slotCDelay.dlyEnable.morphImpulse', name: 'Edt_Effects_kDlyEnable@Impulse', block: 28, bit: 205, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241 · Impulse morph' },
  { key: 'slotCReverb.rvbTarget', name: 'Edt_Effects_kRvbTarget', block: 29, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 112' },
  { key: 'slotCReverb.rvbType', name: 'Edt_Effects_kRvbType', block: 29, bit: 1, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260' },
  { key: 'slotCReverb.rvbType.morphImpulse', name: 'Edt_Effects_kRvbType@Impulse', block: 29, bit: 4, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260 · Impulse morph' },
  { key: 'slotCReverb.rvbColor', name: 'Edt_Effects_kRvbColor', block: 29, bit: 8, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261' },
  { key: 'slotCReverb.rvbColor.morphImpulse', name: 'Edt_Effects_kRvbColor@Impulse', block: 29, bit: 10, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261 · Impulse morph' },
  { key: 'slotCReverb.rvbModulate', name: 'Edt_Effects_kRvbModulate', block: 29, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263' },
  { key: 'slotCReverb.rvbModulate.morphImpulse', name: 'Edt_Effects_kRvbModulate@Impulse', block: 29, bit: 14, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263 · Impulse morph' },
  { key: 'slotCReverb.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 29, bit: 16, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262' },
  { key: 'slotCReverb.rvbAmt.morphImpulse', name: 'Edt_Effects_kRvbAmt@Impulse', block: 29, bit: 23, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Impulse morph' },
  { key: 'slotCReverb.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 29, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Wheel morph' },
  { key: 'slotCReverb.rvbAmt.morphPedal', name: 'Edt_Effects_kRvbAmt@Pedal', block: 29, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Pedal morph' },
  { key: 'slotCReverb.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@ATouch', block: 29, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · ATouch morph' },
  { key: 'slotCReverb.rvbAmt.morphVelocity', name: 'Edt_Effects_kRvbAmt@Velocity', block: 29, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Velocity morph' },
  { key: 'slotCReverb.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 29, bit: 63, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259' },
  { key: 'slotCReverb.rvbEnable.morphImpulse', name: 'Edt_Effects_kRvbEnable@Impulse', block: 29, bit: 64, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259 · Impulse morph' },
  { key: 'slotCVibrato.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 30, bit: 0, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 136' },
  { key: 'slotCVibrato.vibratoAmount', name: 'Edt_Syn_kVibratoAmount', block: 30, bit: 7, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 137' },
  { key: 'slotDCommon.octaveShift', name: 'Edt_Syn_kOctaveShift', block: 31, bit: 0, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128' },
  { key: 'slotDCommon.octaveShift.morphImpulse', name: 'Edt_Syn_kOctaveShift@Impulse', block: 31, bit: 4, width: 5, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 128 · Impulse morph' },
  { key: 'slotDCommon.pitchStickEnable', name: 'Edt_Syn_kPitchStickEnable', block: 31, bit: 9, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 129' },
  { key: 'slotDCommon.sustainEnable', name: 'Edt_Syn_kSustainEnable', block: 31, bit: 10, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 130' },
  { key: 'slotDCommon.kbdHoldEnable', name: 'Edt_Syn_kKbdHoldEnable', block: 31, bit: 11, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 132' },
  { key: 'slotDCommon.vibratoMode', name: 'Edt_Syn_kVibratoMode', block: 31, bit: 12, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135' },
  { key: 'slotDCommon.vibratoMode.morphImpulse', name: 'Edt_Syn_kVibratoMode@Impulse', block: 31, bit: 15, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 135 · Impulse morph' },
  { key: 'slotDCommon.voiceMode', name: 'Edt_Syn_kVoiceMode', block: 31, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133' },
  { key: 'slotDCommon.voiceMode.morphImpulse', name: 'Edt_Syn_kVoiceMode@Impulse', block: 31, bit: 21, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 133 · Impulse morph' },
  { key: 'slotDCommon.glideRate', name: 'Edt_Syn_kGlideRate', block: 31, bit: 24, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134' },
  { key: 'slotDCommon.glideRate.morphImpulse', name: 'Edt_Syn_kGlideRate@Impulse', block: 31, bit: 31, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Impulse morph' },
  { key: 'slotDCommon.glideRate.morphWheel', name: 'Edt_Syn_kGlideRate@Wheel', block: 31, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Wheel morph' },
  { key: 'slotDCommon.glideRate.morphPedal', name: 'Edt_Syn_kGlideRate@Pedal', block: 31, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Pedal morph' },
  { key: 'slotDCommon.glideRate.morphAfterTouch', name: 'Edt_Syn_kGlideRate@ATouch', block: 31, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · ATouch morph' },
  { key: 'slotDCommon.glideRate.morphVelocity', name: 'Edt_Syn_kGlideRate@Velocity', block: 31, bit: 63, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 134 · Velocity morph' },
  { key: 'slotDCommon.oscBank', name: 'Edt_Syn_kOscBank', block: 31, bit: 71, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 167' },
  { key: 'slotDCommon.oscWave', name: 'Edt_Syn_kOscWave', block: 31, bit: 74, width: 16, min: 0, max: 4095, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 168' },
  { key: 'slotDCommon.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 31, bit: 90, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170' },
  { key: 'slotDCommon.oscCtrl.morphImpulse', name: 'Edt_Syn_kOscCtrl@Impulse', block: 31, bit: 97, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Impulse morph' },
  { key: 'slotDCommon.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 31, bit: 105, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Wheel morph' },
  { key: 'slotDCommon.oscCtrl.morphPedal', name: 'Edt_Syn_kOscCtrl@Pedal', block: 31, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Pedal morph' },
  { key: 'slotDCommon.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@ATouch', block: 31, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · ATouch morph' },
  { key: 'slotDCommon.oscCtrl.morphVelocity', name: 'Edt_Syn_kOscCtrl@Velocity', block: 31, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 170 · Velocity morph' },
  { key: 'slotDCommon.oscTuneFine', name: 'Edt_Syn_kOscTuneFine', block: 31, bit: 137, width: 7, min: -50, max: 50, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171' },
  { key: 'slotDCommon.oscTuneFine.morphImpulse', name: 'Edt_Syn_kOscTuneFine@Impulse', block: 31, bit: 144, width: 8, min: 0, max: 101, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Impulse morph' },
  { key: 'slotDCommon.oscTuneFine.morphWheel', name: 'Edt_Syn_kOscTuneFine@Wheel', block: 31, bit: 152, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Wheel morph' },
  { key: 'slotDCommon.oscTuneFine.morphPedal', name: 'Edt_Syn_kOscTuneFine@Pedal', block: 31, bit: 160, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Pedal morph' },
  { key: 'slotDCommon.oscTuneFine.morphAfterTouch', name: 'Edt_Syn_kOscTuneFine@ATouch', block: 31, bit: 168, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · ATouch morph' },
  { key: 'slotDCommon.oscTuneFine.morphVelocity', name: 'Edt_Syn_kOscTuneFine@Velocity', block: 31, bit: 176, width: 8, min: -100, max: 100, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 171 · Velocity morph' },
  { key: 'slotDCommon.oscTuneCoarse', name: 'Edt_Syn_kOscTuneCoarse', block: 31, bit: 184, width: 7, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172' },
  { key: 'slotDCommon.oscTuneCoarse.morphImpulse', name: 'Edt_Syn_kOscTuneCoarse@Impulse', block: 31, bit: 191, width: 8, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Impulse morph' },
  { key: 'slotDCommon.oscTuneCoarse.morphWheel', name: 'Edt_Syn_kOscTuneCoarse@Wheel', block: 31, bit: 199, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Wheel morph' },
  { key: 'slotDCommon.oscTuneCoarse.morphPedal', name: 'Edt_Syn_kOscTuneCoarse@Pedal', block: 31, bit: 207, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Pedal morph' },
  { key: 'slotDCommon.oscTuneCoarse.morphAfterTouch', name: 'Edt_Syn_kOscTuneCoarse@ATouch', block: 31, bit: 215, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · ATouch morph' },
  { key: 'slotDCommon.oscTuneCoarse.morphVelocity', name: 'Edt_Syn_kOscTuneCoarse@Velocity', block: 31, bit: 223, width: 8, min: -48, max: 48, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 172 · Velocity morph' },
  { key: 'slotDCommon.oscDualMode', name: 'Edt_Syn_kOscDualMode', block: 31, bit: 231, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173' },
  { key: 'slotDCommon.oscDualMode.morphImpulse', name: 'Edt_Syn_kOscDualMode@Impulse', block: 31, bit: 233, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 173 · Impulse morph' },
  { key: 'slotDCommon.oscEnvAtk', name: 'Edt_Syn_kOscEnvAtk', block: 31, bit: 236, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160' },
  { key: 'slotDCommon.oscEnvAtk.morphImpulse', name: 'Edt_Syn_kOscEnvAtk@Impulse', block: 31, bit: 243, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Impulse morph' },
  { key: 'slotDCommon.oscEnvAtk.morphWheel', name: 'Edt_Syn_kOscEnvAtk@Wheel', block: 31, bit: 251, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Wheel morph' },
  { key: 'slotDCommon.oscEnvAtk.morphPedal', name: 'Edt_Syn_kOscEnvAtk@Pedal', block: 31, bit: 259, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Pedal morph' },
  { key: 'slotDCommon.oscEnvAtk.morphAfterTouch', name: 'Edt_Syn_kOscEnvAtk@ATouch', block: 31, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · ATouch morph' },
  { key: 'slotDCommon.oscEnvAtk.morphVelocity', name: 'Edt_Syn_kOscEnvAtk@Velocity', block: 31, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 160 · Velocity morph' },
  { key: 'slotDCommon.oscEnvDcy', name: 'Edt_Syn_kOscEnvDcy', block: 31, bit: 283, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161' },
  { key: 'slotDCommon.oscEnvDcy.morphImpulse', name: 'Edt_Syn_kOscEnvDcy@Impulse', block: 31, bit: 290, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Impulse morph' },
  { key: 'slotDCommon.oscEnvDcy.morphWheel', name: 'Edt_Syn_kOscEnvDcy@Wheel', block: 31, bit: 298, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Wheel morph' },
  { key: 'slotDCommon.oscEnvDcy.morphPedal', name: 'Edt_Syn_kOscEnvDcy@Pedal', block: 31, bit: 306, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Pedal morph' },
  { key: 'slotDCommon.oscEnvDcy.morphAfterTouch', name: 'Edt_Syn_kOscEnvDcy@ATouch', block: 31, bit: 314, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · ATouch morph' },
  { key: 'slotDCommon.oscEnvDcy.morphVelocity', name: 'Edt_Syn_kOscEnvDcy@Velocity', block: 31, bit: 322, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 161 · Velocity morph' },
  { key: 'slotDCommon.oscEnvAmt', name: 'Edt_Syn_kOscEnvAmt', block: 31, bit: 330, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162' },
  { key: 'slotDCommon.oscEnvAmt.morphImpulse', name: 'Edt_Syn_kOscEnvAmt@Impulse', block: 31, bit: 337, width: 8, min: 0, max: 121, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Impulse morph' },
  { key: 'slotDCommon.oscEnvAmt.morphWheel', name: 'Edt_Syn_kOscEnvAmt@Wheel', block: 31, bit: 345, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Wheel morph' },
  { key: 'slotDCommon.oscEnvAmt.morphPedal', name: 'Edt_Syn_kOscEnvAmt@Pedal', block: 31, bit: 353, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Pedal morph' },
  { key: 'slotDCommon.oscEnvAmt.morphAfterTouch', name: 'Edt_Syn_kOscEnvAmt@ATouch', block: 31, bit: 361, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · ATouch morph' },
  { key: 'slotDCommon.oscEnvAmt.morphVelocity', name: 'Edt_Syn_kOscEnvAmt@Velocity', block: 31, bit: 369, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 162 · Velocity morph' },
  { key: 'slotDCommon.oscEnvDst', name: 'Edt_Syn_kOscEnvDst', block: 31, bit: 377, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165' },
  { key: 'slotDCommon.oscEnvDst.morphImpulse', name: 'Edt_Syn_kOscEnvDst@Impulse', block: 31, bit: 379, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 165 · Impulse morph' },
  { key: 'slotDCommon.oscEnvMode', name: 'Edt_Syn_kOscEnvMode', block: 31, bit: 382, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163' },
  { key: 'slotDCommon.oscEnvMode.morphImpulse', name: 'Edt_Syn_kOscEnvMode@Impulse', block: 31, bit: 383, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 163 · Impulse morph' },
  { key: 'slotDCommon.oscEnvVel', name: 'Edt_Syn_kOscEnvVel', block: 31, bit: 385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 164' },
  { key: 'slotDCommon.oscWhlDir', name: 'Edt_Syn_kOscWhlDir', block: 31, bit: 386, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 174' },
  { key: 'slotDCommon.smpNameHash', name: 'Edt_Syn_kSmpNameHash_Private', block: 31, bit: 387, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 235' },
  { key: 'slotDCommon.smpPresets', name: 'Edt_Syn_kSmpPresets', block: 31, bit: 419, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 233' },
  { key: 'slotDCommon.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 31, bit: 420, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232' },
  { key: 'slotDCommon.smpFastAtk.morphImpulse', name: 'Edt_Syn_kSmpFastAtk@Impulse', block: 31, bit: 421, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 232 · Impulse morph' },
  { key: 'slotDCommon.smpVibRateUsageEol', name: 'Edt_Syn_kSmpVibRateUsage_EOL', block: 31, bit: 423, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 200' },
  { key: 'slotDArp.arpRun', name: 'Edt_Syn_kArpRun', block: 32, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140' },
  { key: 'slotDArp.arpRun.morphImpulse', name: 'Edt_Syn_kArpRun@Impulse', block: 32, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 140 · Impulse morph' },
  { key: 'slotDArp.arpTarget', name: 'Edt_Syn_kArpTarget', block: 32, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 106' },
  { key: 'slotDArp.arpMode', name: 'Edt_Syn_kArpMode', block: 32, bit: 4, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138' },
  { key: 'slotDArp.arpMode.morphImpulse', name: 'Edt_Syn_kArpMode@Impulse', block: 32, bit: 6, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 138 · Impulse morph' },
  { key: 'slotDArp.arpModePtn', name: 'Edt_Syn_kArpModePtn', block: 32, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139' },
  { key: 'slotDArp.arpModePtn.morphImpulse', name: 'Edt_Syn_kArpModePtn@Impulse', block: 32, bit: 10, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 139 · Impulse morph' },
  { key: 'slotDArp.arpKbdSync', name: 'Edt_Syn_kArpKbdSync', block: 32, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141' },
  { key: 'slotDArp.arpKbdSync.morphImpulse', name: 'Edt_Syn_kArpKbdSync@Impulse', block: 32, bit: 13, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 141 · Impulse morph' },
  { key: 'slotDArp.arpRange', name: 'Edt_Syn_kArpRange', block: 32, bit: 15, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142' },
  { key: 'slotDArp.arpRange.morphImpulse', name: 'Edt_Syn_kArpRange@Impulse', block: 32, bit: 22, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Impulse morph' },
  { key: 'slotDArp.arpRange.morphWheel', name: 'Edt_Syn_kArpRange@Wheel', block: 32, bit: 30, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Wheel morph' },
  { key: 'slotDArp.arpRange.morphPedal', name: 'Edt_Syn_kArpRange@Pedal', block: 32, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Pedal morph' },
  { key: 'slotDArp.arpRange.morphAfterTouch', name: 'Edt_Syn_kArpRange@ATouch', block: 32, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · ATouch morph' },
  { key: 'slotDArp.arpRange.morphVelocity', name: 'Edt_Syn_kArpRange@Velocity', block: 32, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 142 · Velocity morph' },
  { key: 'slotDArp.arpPattern', name: 'Edt_Syn_kArpPattern', block: 32, bit: 62, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143' },
  { key: 'slotDArp.arpPattern.morphImpulse', name: 'Edt_Syn_kArpPattern@Impulse', block: 32, bit: 64, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 143 · Impulse morph' },
  { key: 'slotDArp.arpZigZag', name: 'Edt_Syn_kArpZigZag', block: 32, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144' },
];

/** Fields 1000–1195 (see the generator's TS2590 note). */
const FIELDS_2: readonly FwField<Nw2FieldKey>[] = [
  { key: 'slotDArp.arpZigZag.morphImpulse', name: 'Edt_Syn_kArpZigZag@Impulse', block: 32, bit: 68, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 144 · Impulse morph' },
  { key: 'slotDArp.arpClkEnable', name: 'Edt_Syn_kArpClkEnable', block: 32, bit: 70, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 145' },
  { key: 'slotDArp.arpRateClkDiv', name: 'Edt_Syn_kArpRateClkDiv', block: 32, bit: 71, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146' },
  { key: 'slotDArp.arpRateClkDiv.morphImpulse', name: 'Edt_Syn_kArpRateClkDiv@Impulse', block: 32, bit: 78, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Impulse morph' },
  { key: 'slotDArp.arpRateClkDiv.morphWheel', name: 'Edt_Syn_kArpRateClkDiv@Wheel', block: 32, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Wheel morph' },
  { key: 'slotDArp.arpRateClkDiv.morphPedal', name: 'Edt_Syn_kArpRateClkDiv@Pedal', block: 32, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Pedal morph' },
  { key: 'slotDArp.arpRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kArpRateClkDiv@ATouch', block: 32, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · ATouch morph' },
  { key: 'slotDArp.arpRateClkDiv.morphVelocity', name: 'Edt_Syn_kArpRateClkDiv@Velocity', block: 32, bit: 110, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 146 · Velocity morph' },
  { key: 'slotDArp.gateSeqLength', name: 'Edt_Syn_kGateSeqLength', block: 32, bit: 118, width: 4, min: 1, max: 15, def: 7, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 149' },
  { key: 'slotDArp.gatePtnAcc', name: 'Edt_Syn_kGatePtnAcc', block: 32, bit: 122, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 151' },
  { key: 'slotDArp.gatePtnDur', name: 'Edt_Syn_kGatePtnDur', block: 32, bit: 154, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 152' },
  { key: 'slotDArp.gatePtnPan', name: 'Edt_Syn_kGatePtnPan', block: 32, bit: 186, width: 32, min: -2147483648, max: 2147483647, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 153' },
  { key: 'slotDArp.gateSeqDivider', name: 'Edt_Syn_kGateSeqDivider', block: 32, bit: 218, width: 7, min: 0, max: 8, def: 4, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 150' },
  { key: 'slotDLfo.lfoDst', name: 'Edt_Syn_kLFODst', block: 33, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154' },
  { key: 'slotDLfo.lfoDst.morphImpulse', name: 'Edt_Syn_kLFODst@Impulse', block: 33, bit: 2, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 154 · Impulse morph' },
  { key: 'slotDLfo.lfoTarget', name: 'Edt_Syn_kLFOTarget', block: 33, bit: 5, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 105' },
  { key: 'slotDLfo.lfoWave', name: 'Edt_Syn_kLFOWave', block: 33, bit: 6, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155' },
  { key: 'slotDLfo.lfoWave.morphImpulse', name: 'Edt_Syn_kLFOWave@Impulse', block: 33, bit: 9, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 155 · Impulse morph' },
  { key: 'slotDLfo.lfoClkEnable', name: 'Edt_Syn_kLFOClkEnable', block: 33, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 156' },
  { key: 'slotDLfo.lfoRateClkDiv', name: 'Edt_Syn_kLFORateClkDiv', block: 33, bit: 14, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157' },
  { key: 'slotDLfo.lfoRateClkDiv.morphImpulse', name: 'Edt_Syn_kLFORateClkDiv@Impulse', block: 33, bit: 21, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Impulse morph' },
  { key: 'slotDLfo.lfoRateClkDiv.morphWheel', name: 'Edt_Syn_kLFORateClkDiv@Wheel', block: 33, bit: 29, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Wheel morph' },
  { key: 'slotDLfo.lfoRateClkDiv.morphPedal', name: 'Edt_Syn_kLFORateClkDiv@Pedal', block: 33, bit: 37, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Pedal morph' },
  { key: 'slotDLfo.lfoRateClkDiv.morphAfterTouch', name: 'Edt_Syn_kLFORateClkDiv@ATouch', block: 33, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · ATouch morph' },
  { key: 'slotDLfo.lfoRateClkDiv.morphVelocity', name: 'Edt_Syn_kLFORateClkDiv@Velocity', block: 33, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 157 · Velocity morph' },
  { key: 'slotDLfo.lfoAmt', name: 'Edt_Syn_kLFOAmt', block: 33, bit: 61, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158' },
  { key: 'slotDLfo.lfoAmt.morphImpulse', name: 'Edt_Syn_kLFOAmt@Impulse', block: 33, bit: 68, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Impulse morph' },
  { key: 'slotDLfo.lfoAmt.morphWheel', name: 'Edt_Syn_kLFOAmt@Wheel', block: 33, bit: 76, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Wheel morph' },
  { key: 'slotDLfo.lfoAmt.morphPedal', name: 'Edt_Syn_kLFOAmt@Pedal', block: 33, bit: 84, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Pedal morph' },
  { key: 'slotDLfo.lfoAmt.morphAfterTouch', name: 'Edt_Syn_kLFOAmt@ATouch', block: 33, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · ATouch morph' },
  { key: 'slotDLfo.lfoAmt.morphVelocity', name: 'Edt_Syn_kLFOAmt@Velocity', block: 33, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 158 · Velocity morph' },
  { key: 'slotDLfo.lfoWhlDir', name: 'Edt_Syn_kLFOWhlDir', block: 33, bit: 108, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 159' },
  { key: 'slotDFilter.fltTarget', name: 'Edt_Syn_kFltTarget', block: 34, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 107' },
  { key: 'slotDFilter.fltType', name: 'Edt_Syn_kFltType', block: 34, bit: 1, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182' },
  { key: 'slotDFilter.fltType.morphImpulse', name: 'Edt_Syn_kFltType@Impulse', block: 34, bit: 4, width: 4, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 182 · Impulse morph' },
  { key: 'slotDFilter.fltFreq', name: 'Edt_Syn_kFltFreq', block: 34, bit: 8, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183' },
  { key: 'slotDFilter.fltFreq.morphImpulse', name: 'Edt_Syn_kFltFreq@Impulse', block: 34, bit: 15, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Impulse morph' },
  { key: 'slotDFilter.fltFreq.morphWheel', name: 'Edt_Syn_kFltFreq@Wheel', block: 34, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Wheel morph' },
  { key: 'slotDFilter.fltFreq.morphPedal', name: 'Edt_Syn_kFltFreq@Pedal', block: 34, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Pedal morph' },
  { key: 'slotDFilter.fltFreq.morphAfterTouch', name: 'Edt_Syn_kFltFreq@ATouch', block: 34, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · ATouch morph' },
  { key: 'slotDFilter.fltFreq.morphVelocity', name: 'Edt_Syn_kFltFreq@Velocity', block: 34, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 183 · Velocity morph' },
  { key: 'slotDFilter.fltRes', name: 'Edt_Syn_kFltRes', block: 34, bit: 55, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184' },
  { key: 'slotDFilter.fltRes.morphImpulse', name: 'Edt_Syn_kFltRes@Impulse', block: 34, bit: 62, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Impulse morph' },
  { key: 'slotDFilter.fltRes.morphWheel', name: 'Edt_Syn_kFltRes@Wheel', block: 34, bit: 70, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Wheel morph' },
  { key: 'slotDFilter.fltRes.morphPedal', name: 'Edt_Syn_kFltRes@Pedal', block: 34, bit: 78, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Pedal morph' },
  { key: 'slotDFilter.fltRes.morphAfterTouch', name: 'Edt_Syn_kFltRes@ATouch', block: 34, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · ATouch morph' },
  { key: 'slotDFilter.fltRes.morphVelocity', name: 'Edt_Syn_kFltRes@Velocity', block: 34, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 184 · Velocity morph' },
  { key: 'slotDFilter.fltKbdTrk', name: 'Edt_Syn_kFltKbdTrk', block: 34, bit: 102, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185' },
  { key: 'slotDFilter.fltKbdTrk.morphImpulse', name: 'Edt_Syn_kFltKbdTrk@Impulse', block: 34, bit: 104, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 185 · Impulse morph' },
  { key: 'slotDFilter.fltDrive', name: 'Edt_Syn_kFltDrive', block: 34, bit: 107, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186' },
  { key: 'slotDFilter.fltDrive.morphImpulse', name: 'Edt_Syn_kFltDrive@Impulse', block: 34, bit: 109, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 186 · Impulse morph' },
  { key: 'slotDFilter.fltEnvAmt', name: 'Edt_Syn_kFltEnvAmt', block: 34, bit: 112, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187' },
  { key: 'slotDFilter.fltEnvAmt.morphImpulse', name: 'Edt_Syn_kFltEnvAmt@Impulse', block: 34, bit: 119, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Impulse morph' },
  { key: 'slotDFilter.fltEnvAmt.morphWheel', name: 'Edt_Syn_kFltEnvAmt@Wheel', block: 34, bit: 127, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Wheel morph' },
  { key: 'slotDFilter.fltEnvAmt.morphPedal', name: 'Edt_Syn_kFltEnvAmt@Pedal', block: 34, bit: 135, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Pedal morph' },
  { key: 'slotDFilter.fltEnvAmt.morphAfterTouch', name: 'Edt_Syn_kFltEnvAmt@ATouch', block: 34, bit: 143, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · ATouch morph' },
  { key: 'slotDFilter.fltEnvAmt.morphVelocity', name: 'Edt_Syn_kFltEnvAmt@Velocity', block: 34, bit: 151, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 187 · Velocity morph' },
  { key: 'slotDFilter.fltEnvAtk', name: 'Edt_Syn_kFltEnvAtk', block: 34, bit: 159, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188' },
  { key: 'slotDFilter.fltEnvAtk.morphImpulse', name: 'Edt_Syn_kFltEnvAtk@Impulse', block: 34, bit: 166, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Impulse morph' },
  { key: 'slotDFilter.fltEnvAtk.morphWheel', name: 'Edt_Syn_kFltEnvAtk@Wheel', block: 34, bit: 174, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Wheel morph' },
  { key: 'slotDFilter.fltEnvAtk.morphPedal', name: 'Edt_Syn_kFltEnvAtk@Pedal', block: 34, bit: 182, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Pedal morph' },
  { key: 'slotDFilter.fltEnvAtk.morphAfterTouch', name: 'Edt_Syn_kFltEnvAtk@ATouch', block: 34, bit: 190, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · ATouch morph' },
  { key: 'slotDFilter.fltEnvAtk.morphVelocity', name: 'Edt_Syn_kFltEnvAtk@Velocity', block: 34, bit: 198, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 188 · Velocity morph' },
  { key: 'slotDFilter.fltEnvDcy', name: 'Edt_Syn_kFltEnvDcy', block: 34, bit: 206, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189' },
  { key: 'slotDFilter.fltEnvDcy.morphImpulse', name: 'Edt_Syn_kFltEnvDcy@Impulse', block: 34, bit: 213, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Impulse morph' },
  { key: 'slotDFilter.fltEnvDcy.morphWheel', name: 'Edt_Syn_kFltEnvDcy@Wheel', block: 34, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Wheel morph' },
  { key: 'slotDFilter.fltEnvDcy.morphPedal', name: 'Edt_Syn_kFltEnvDcy@Pedal', block: 34, bit: 229, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Pedal morph' },
  { key: 'slotDFilter.fltEnvDcy.morphAfterTouch', name: 'Edt_Syn_kFltEnvDcy@ATouch', block: 34, bit: 237, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · ATouch morph' },
  { key: 'slotDFilter.fltEnvDcy.morphVelocity', name: 'Edt_Syn_kFltEnvDcy@Velocity', block: 34, bit: 245, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 189 · Velocity morph' },
  { key: 'slotDFilter.fltEnvSus', name: 'Edt_Syn_kFltEnvSus', block: 34, bit: 253, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190' },
  { key: 'slotDFilter.fltEnvSus.morphImpulse', name: 'Edt_Syn_kFltEnvSus@Impulse', block: 34, bit: 260, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Impulse morph' },
  { key: 'slotDFilter.fltEnvSus.morphWheel', name: 'Edt_Syn_kFltEnvSus@Wheel', block: 34, bit: 268, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Wheel morph' },
  { key: 'slotDFilter.fltEnvSus.morphPedal', name: 'Edt_Syn_kFltEnvSus@Pedal', block: 34, bit: 276, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Pedal morph' },
  { key: 'slotDFilter.fltEnvSus.morphAfterTouch', name: 'Edt_Syn_kFltEnvSus@ATouch', block: 34, bit: 284, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · ATouch morph' },
  { key: 'slotDFilter.fltEnvSus.morphVelocity', name: 'Edt_Syn_kFltEnvSus@Velocity', block: 34, bit: 292, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 190 · Velocity morph' },
  { key: 'slotDFilter.fltEnvRls', name: 'Edt_Syn_kFltEnvRls', block: 34, bit: 300, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191' },
  { key: 'slotDFilter.fltEnvRls.morphImpulse', name: 'Edt_Syn_kFltEnvRls@Impulse', block: 34, bit: 307, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Impulse morph' },
  { key: 'slotDFilter.fltEnvRls.morphWheel', name: 'Edt_Syn_kFltEnvRls@Wheel', block: 34, bit: 315, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Wheel morph' },
  { key: 'slotDFilter.fltEnvRls.morphPedal', name: 'Edt_Syn_kFltEnvRls@Pedal', block: 34, bit: 323, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Pedal morph' },
  { key: 'slotDFilter.fltEnvRls.morphAfterTouch', name: 'Edt_Syn_kFltEnvRls@ATouch', block: 34, bit: 331, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · ATouch morph' },
  { key: 'slotDFilter.fltEnvRls.morphVelocity', name: 'Edt_Syn_kFltEnvRls@Velocity', block: 34, bit: 339, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 191 · Velocity morph' },
  { key: 'slotDFilter.fltEnvVel', name: 'Edt_Syn_kFltEnvVel', block: 34, bit: 347, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 192' },
  { key: 'slotDFilter.fltEnvInv', name: 'Edt_Syn_kFltEnvInv', block: 34, bit: 348, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193' },
  { key: 'slotDFilter.fltEnvInv.morphImpulse', name: 'Edt_Syn_kFltEnvInv@Impulse', block: 34, bit: 349, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 193 · Impulse morph' },
  { key: 'slotDFilter.fltWhlDir', name: 'Edt_Syn_kFltWhlDir', block: 34, bit: 351, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 194' },
  { key: 'slotDFilter.fltEnable', name: 'Edt_Syn_kFltEnable', block: 34, bit: 352, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181' },
  { key: 'slotDFilter.fltEnable.morphImpulse', name: 'Edt_Syn_kFltEnable@Impulse', block: 34, bit: 353, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 181 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvTarget', name: 'Edt_Syn_kAmpEnvTarget', block: 35, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 108' },
  { key: 'slotDAmpEnv.ampEnvAtk', name: 'Edt_Syn_kAmpEnvAtk', block: 35, bit: 1, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175' },
  { key: 'slotDAmpEnv.ampEnvAtk.morphImpulse', name: 'Edt_Syn_kAmpEnvAtk@Impulse', block: 35, bit: 8, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvAtk.morphWheel', name: 'Edt_Syn_kAmpEnvAtk@Wheel', block: 35, bit: 16, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Wheel morph' },
  { key: 'slotDAmpEnv.ampEnvAtk.morphPedal', name: 'Edt_Syn_kAmpEnvAtk@Pedal', block: 35, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Pedal morph' },
  { key: 'slotDAmpEnv.ampEnvAtk.morphAfterTouch', name: 'Edt_Syn_kAmpEnvAtk@ATouch', block: 35, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · ATouch morph' },
  { key: 'slotDAmpEnv.ampEnvAtk.morphVelocity', name: 'Edt_Syn_kAmpEnvAtk@Velocity', block: 35, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 175 · Velocity morph' },
  { key: 'slotDAmpEnv.ampEnvAtkFast', name: 'Edt_Syn_kAmpEnvAtkFast', block: 35, bit: 48, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176' },
  { key: 'slotDAmpEnv.ampEnvAtkFast.morphImpulse', name: 'Edt_Syn_kAmpEnvAtkFast@Impulse', block: 35, bit: 49, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 176 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvDcy', name: 'Edt_Syn_kAmpEnvDcy', block: 35, bit: 51, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177' },
  { key: 'slotDAmpEnv.ampEnvDcy.morphImpulse', name: 'Edt_Syn_kAmpEnvDcy@Impulse', block: 35, bit: 58, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvDcy.morphWheel', name: 'Edt_Syn_kAmpEnvDcy@Wheel', block: 35, bit: 66, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Wheel morph' },
  { key: 'slotDAmpEnv.ampEnvDcy.morphPedal', name: 'Edt_Syn_kAmpEnvDcy@Pedal', block: 35, bit: 74, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Pedal morph' },
  { key: 'slotDAmpEnv.ampEnvDcy.morphAfterTouch', name: 'Edt_Syn_kAmpEnvDcy@ATouch', block: 35, bit: 82, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · ATouch morph' },
  { key: 'slotDAmpEnv.ampEnvDcy.morphVelocity', name: 'Edt_Syn_kAmpEnvDcy@Velocity', block: 35, bit: 90, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 177 · Velocity morph' },
  { key: 'slotDAmpEnv.ampEnvSus', name: 'Edt_Syn_kAmpEnvSus', block: 35, bit: 98, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178' },
  { key: 'slotDAmpEnv.ampEnvSus.morphImpulse', name: 'Edt_Syn_kAmpEnvSus@Impulse', block: 35, bit: 105, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvSus.morphWheel', name: 'Edt_Syn_kAmpEnvSus@Wheel', block: 35, bit: 113, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Wheel morph' },
  { key: 'slotDAmpEnv.ampEnvSus.morphPedal', name: 'Edt_Syn_kAmpEnvSus@Pedal', block: 35, bit: 121, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Pedal morph' },
  { key: 'slotDAmpEnv.ampEnvSus.morphAfterTouch', name: 'Edt_Syn_kAmpEnvSus@ATouch', block: 35, bit: 129, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · ATouch morph' },
  { key: 'slotDAmpEnv.ampEnvSus.morphVelocity', name: 'Edt_Syn_kAmpEnvSus@Velocity', block: 35, bit: 137, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 178 · Velocity morph' },
  { key: 'slotDAmpEnv.ampEnvRls', name: 'Edt_Syn_kAmpEnvRls', block: 35, bit: 145, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179' },
  { key: 'slotDAmpEnv.ampEnvRls.morphImpulse', name: 'Edt_Syn_kAmpEnvRls@Impulse', block: 35, bit: 152, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Impulse morph' },
  { key: 'slotDAmpEnv.ampEnvRls.morphWheel', name: 'Edt_Syn_kAmpEnvRls@Wheel', block: 35, bit: 160, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Wheel morph' },
  { key: 'slotDAmpEnv.ampEnvRls.morphPedal', name: 'Edt_Syn_kAmpEnvRls@Pedal', block: 35, bit: 168, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Pedal morph' },
  { key: 'slotDAmpEnv.ampEnvRls.morphAfterTouch', name: 'Edt_Syn_kAmpEnvRls@ATouch', block: 35, bit: 176, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · ATouch morph' },
  { key: 'slotDAmpEnv.ampEnvRls.morphVelocity', name: 'Edt_Syn_kAmpEnvRls@Velocity', block: 35, bit: 184, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 179 · Velocity morph' },
  { key: 'slotDAmpEnv.ampEnvVel', name: 'Edt_Syn_kAmpEnvVel', block: 35, bit: 192, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 180' },
  { key: 'slotDFx.fxTarget', name: 'Edt_Effects_kFxTarget', block: 36, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 109' },
  { key: 'slotDFx.fxClkEnable', name: 'Edt_Effects_kFxClkEnable', block: 36, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 238' },
  { key: 'slotDFx.fxType', name: 'Edt_Effects_kFxType', block: 36, bit: 2, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237' },
  { key: 'slotDFx.fxType.morphImpulse', name: 'Edt_Effects_kFxType@Impulse', block: 36, bit: 5, width: 4, min: 0, max: 7, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 237 · Impulse morph' },
  { key: 'slotDFx.fxRateClkDiv', name: 'Edt_Effects_kFxRateClkDiv', block: 36, bit: 9, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239' },
  { key: 'slotDFx.fxRateClkDiv.morphImpulse', name: 'Edt_Effects_kFxRateClkDiv@Impulse', block: 36, bit: 16, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Impulse morph' },
  { key: 'slotDFx.fxRateClkDiv.morphWheel', name: 'Edt_Effects_kFxRateClkDiv@Wheel', block: 36, bit: 24, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Wheel morph' },
  { key: 'slotDFx.fxRateClkDiv.morphPedal', name: 'Edt_Effects_kFxRateClkDiv@Pedal', block: 36, bit: 32, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Pedal morph' },
  { key: 'slotDFx.fxRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kFxRateClkDiv@ATouch', block: 36, bit: 40, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · ATouch morph' },
  { key: 'slotDFx.fxRateClkDiv.morphVelocity', name: 'Edt_Effects_kFxRateClkDiv@Velocity', block: 36, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 239 · Velocity morph' },
  { key: 'slotDFx.fxAmt', name: 'Edt_Effects_kFxAmt', block: 36, bit: 56, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240' },
  { key: 'slotDFx.fxAmt.morphImpulse', name: 'Edt_Effects_kFxAmt@Impulse', block: 36, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Impulse morph' },
  { key: 'slotDFx.fxAmt.morphWheel', name: 'Edt_Effects_kFxAmt@Wheel', block: 36, bit: 71, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Wheel morph' },
  { key: 'slotDFx.fxAmt.morphPedal', name: 'Edt_Effects_kFxAmt@Pedal', block: 36, bit: 79, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Pedal morph' },
  { key: 'slotDFx.fxAmt.morphAfterTouch', name: 'Edt_Effects_kFxAmt@ATouch', block: 36, bit: 87, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · ATouch morph' },
  { key: 'slotDFx.fxAmt.morphVelocity', name: 'Edt_Effects_kFxAmt@Velocity', block: 36, bit: 95, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 240 · Velocity morph' },
  { key: 'slotDFx.fxEnable', name: 'Edt_Effects_kFxEnable', block: 36, bit: 103, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236' },
  { key: 'slotDFx.fxEnable.morphImpulse', name: 'Edt_Effects_kFxEnable@Impulse', block: 36, bit: 104, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 236 · Impulse morph' },
  { key: 'slotDEq.eqTarget', name: 'Edt_Effects_kEqTarget', block: 37, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 110' },
  { key: 'slotDEq.eqType', name: 'Edt_Effects_kEqType', block: 37, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 256' },
  { key: 'slotDEq.eqTreble', name: 'Edt_Effects_kEqTreble', block: 37, bit: 2, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 253' },
  { key: 'slotDEq.eqBass', name: 'Edt_Effects_kEqBass', block: 37, bit: 9, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 254' },
  { key: 'slotDEq.eqMidFreq', name: 'Edt_Effects_kEqMidFreq', block: 37, bit: 16, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 257' },
  { key: 'slotDEq.eqMidGain', name: 'Edt_Effects_kEqMidGain', block: 37, bit: 23, width: 7, min: -60, max: 60, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 258' },
  { key: 'slotDEq.eqDrive', name: 'Edt_Effects_kEqDrive', block: 37, bit: 30, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255' },
  { key: 'slotDEq.eqDrive.morphImpulse', name: 'Edt_Effects_kEqDrive@Impulse', block: 37, bit: 37, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Impulse morph' },
  { key: 'slotDEq.eqDrive.morphWheel', name: 'Edt_Effects_kEqDrive@Wheel', block: 37, bit: 45, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Wheel morph' },
  { key: 'slotDEq.eqDrive.morphPedal', name: 'Edt_Effects_kEqDrive@Pedal', block: 37, bit: 53, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Pedal morph' },
  { key: 'slotDEq.eqDrive.morphAfterTouch', name: 'Edt_Effects_kEqDrive@ATouch', block: 37, bit: 61, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · ATouch morph' },
  { key: 'slotDEq.eqDrive.morphVelocity', name: 'Edt_Effects_kEqDrive@Velocity', block: 37, bit: 69, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 255 · Velocity morph' },
  { key: 'slotDEq.eqEnable', name: 'Edt_Effects_kEqEnable', block: 37, bit: 77, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252' },
  { key: 'slotDEq.eqEnable.morphImpulse', name: 'Edt_Effects_kEqEnable@Impulse', block: 37, bit: 78, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 252 · Impulse morph' },
  { key: 'slotDDelay.dlyTarget', name: 'Edt_Effects_kDlyTarget', block: 38, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 111' },
  { key: 'slotDDelay.dlyClkEnable', name: 'Edt_Effects_kDlyClkEnable', block: 38, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 242' },
  { key: 'slotDDelay.dlyRateClkDiv', name: 'Edt_Effects_kDlyRateClkDiv', block: 38, bit: 2, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243' },
  { key: 'slotDDelay.dlyRateClkDiv.morphImpulse', name: 'Edt_Effects_kDlyRateClkDiv@Impulse', block: 38, bit: 16, width: 15, min: 0, max: 16384, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Impulse morph' },
  { key: 'slotDDelay.dlyRateClkDiv.morphWheel', name: 'Edt_Effects_kDlyRateClkDiv@Wheel', block: 38, bit: 31, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Wheel morph' },
  { key: 'slotDDelay.dlyRateClkDiv.morphPedal', name: 'Edt_Effects_kDlyRateClkDiv@Pedal', block: 38, bit: 46, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Pedal morph' },
  { key: 'slotDDelay.dlyRateClkDiv.morphAfterTouch', name: 'Edt_Effects_kDlyRateClkDiv@ATouch', block: 38, bit: 61, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · ATouch morph' },
  { key: 'slotDDelay.dlyRateClkDiv.morphVelocity', name: 'Edt_Effects_kDlyRateClkDiv@Velocity', block: 38, bit: 76, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 243 · Velocity morph' },
  { key: 'slotDDelay.dlyMix', name: 'Edt_Effects_kDlyMix', block: 38, bit: 91, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245' },
  { key: 'slotDDelay.dlyMix.morphImpulse', name: 'Edt_Effects_kDlyMix@Impulse', block: 38, bit: 98, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Impulse morph' },
  { key: 'slotDDelay.dlyMix.morphWheel', name: 'Edt_Effects_kDlyMix@Wheel', block: 38, bit: 106, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Wheel morph' },
  { key: 'slotDDelay.dlyMix.morphPedal', name: 'Edt_Effects_kDlyMix@Pedal', block: 38, bit: 114, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Pedal morph' },
  { key: 'slotDDelay.dlyMix.morphAfterTouch', name: 'Edt_Effects_kDlyMix@ATouch', block: 38, bit: 122, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · ATouch morph' },
  { key: 'slotDDelay.dlyMix.morphVelocity', name: 'Edt_Effects_kDlyMix@Velocity', block: 38, bit: 130, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 245 · Velocity morph' },
  { key: 'slotDDelay.dlyMode', name: 'Edt_Effects_kDlyMode', block: 38, bit: 138, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246' },
  { key: 'slotDDelay.dlyMode.morphImpulse', name: 'Edt_Effects_kDlyMode@Impulse', block: 38, bit: 139, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 246 · Impulse morph' },
  { key: 'slotDDelay.dlyFbkPingPong', name: 'Edt_Effects_kDlyFbkPingPong', block: 38, bit: 141, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247' },
  { key: 'slotDDelay.dlyFbkPingPong.morphImpulse', name: 'Edt_Effects_kDlyFbkPingPong@Impulse', block: 38, bit: 142, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 247 · Impulse morph' },
  { key: 'slotDDelay.dlyFbkFilt', name: 'Edt_Effects_kDlyFbkFilt', block: 38, bit: 144, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248' },
  { key: 'slotDDelay.dlyFbkFilt.morphImpulse', name: 'Edt_Effects_kDlyFbkFilt@Impulse', block: 38, bit: 146, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 248 · Impulse morph' },
  { key: 'slotDDelay.dlyFbkAmt', name: 'Edt_Effects_kDlyFbkAmt', block: 38, bit: 149, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249' },
  { key: 'slotDDelay.dlyFbkAmt.morphImpulse', name: 'Edt_Effects_kDlyFbkAmt@Impulse', block: 38, bit: 156, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Impulse morph' },
  { key: 'slotDDelay.dlyFbkAmt.morphWheel', name: 'Edt_Effects_kDlyFbkAmt@Wheel', block: 38, bit: 164, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Wheel morph' },
  { key: 'slotDDelay.dlyFbkAmt.morphPedal', name: 'Edt_Effects_kDlyFbkAmt@Pedal', block: 38, bit: 172, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Pedal morph' },
  { key: 'slotDDelay.dlyFbkAmt.morphAfterTouch', name: 'Edt_Effects_kDlyFbkAmt@ATouch', block: 38, bit: 180, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · ATouch morph' },
  { key: 'slotDDelay.dlyFbkAmt.morphVelocity', name: 'Edt_Effects_kDlyFbkAmt@Velocity', block: 38, bit: 188, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 249 · Velocity morph' },
  { key: 'slotDDelay.dlyFbkFx', name: 'Edt_Effects_kDlyFbkFx', block: 38, bit: 196, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250' },
  { key: 'slotDDelay.dlyFbkFx.morphImpulse', name: 'Edt_Effects_kDlyFbkFx@Impulse', block: 38, bit: 198, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 250 · Impulse morph' },
  { key: 'slotDDelay.dlyFbkDeep', name: 'Edt_Effects_kDlyFbkDeep', block: 38, bit: 201, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251' },
  { key: 'slotDDelay.dlyFbkDeep.morphImpulse', name: 'Edt_Effects_kDlyFbkDeep@Impulse', block: 38, bit: 202, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 251 · Impulse morph' },
  { key: 'slotDDelay.dlyEnable', name: 'Edt_Effects_kDlyEnable', block: 38, bit: 204, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241' },
  { key: 'slotDDelay.dlyEnable.morphImpulse', name: 'Edt_Effects_kDlyEnable@Impulse', block: 38, bit: 205, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 241 · Impulse morph' },
  { key: 'slotDReverb.rvbTarget', name: 'Edt_Effects_kRvbTarget', block: 39, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 112' },
  { key: 'slotDReverb.rvbType', name: 'Edt_Effects_kRvbType', block: 39, bit: 1, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260' },
  { key: 'slotDReverb.rvbType.morphImpulse', name: 'Edt_Effects_kRvbType@Impulse', block: 39, bit: 4, width: 4, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 260 · Impulse morph' },
  { key: 'slotDReverb.rvbColor', name: 'Edt_Effects_kRvbColor', block: 39, bit: 8, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261' },
  { key: 'slotDReverb.rvbColor.morphImpulse', name: 'Edt_Effects_kRvbColor@Impulse', block: 39, bit: 10, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 261 · Impulse morph' },
  { key: 'slotDReverb.rvbModulate', name: 'Edt_Effects_kRvbModulate', block: 39, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263' },
  { key: 'slotDReverb.rvbModulate.morphImpulse', name: 'Edt_Effects_kRvbModulate@Impulse', block: 39, bit: 14, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 263 · Impulse morph' },
  { key: 'slotDReverb.rvbAmt', name: 'Edt_Effects_kRvbAmt', block: 39, bit: 16, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262' },
  { key: 'slotDReverb.rvbAmt.morphImpulse', name: 'Edt_Effects_kRvbAmt@Impulse', block: 39, bit: 23, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Impulse morph' },
  { key: 'slotDReverb.rvbAmt.morphWheel', name: 'Edt_Effects_kRvbAmt@Wheel', block: 39, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Wheel morph' },
  { key: 'slotDReverb.rvbAmt.morphPedal', name: 'Edt_Effects_kRvbAmt@Pedal', block: 39, bit: 39, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Pedal morph' },
  { key: 'slotDReverb.rvbAmt.morphAfterTouch', name: 'Edt_Effects_kRvbAmt@ATouch', block: 39, bit: 47, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · ATouch morph' },
  { key: 'slotDReverb.rvbAmt.morphVelocity', name: 'Edt_Effects_kRvbAmt@Velocity', block: 39, bit: 55, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 262 · Velocity morph' },
  { key: 'slotDReverb.rvbEnable', name: 'Edt_Effects_kRvbEnable', block: 39, bit: 63, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259' },
  { key: 'slotDReverb.rvbEnable.morphImpulse', name: 'Edt_Effects_kRvbEnable@Impulse', block: 39, bit: 64, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 259 · Impulse morph' },
  { key: 'slotDVibrato.vibratoRate', name: 'Edt_Syn_kVibratoRate', block: 40, bit: 0, width: 7, min: 0, max: 60, def: 35, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 136' },
  { key: 'slotDVibrato.vibratoAmount', name: 'Edt_Syn_kVibratoAmount', block: 40, bit: 7, width: 7, min: 0, max: 50, def: 25, enc: 'u', confidence: 'medium', src: 'Wave 2 OS 1.24 registry · id 137' },
];

export const NW2_LAYOUT: FwLayout<Nw2FieldKey> = {
  model: 'Nord Wave 2',
  source: 'Wave 2 OS 1.24 registry',
  container: 'Wave 2 OS 1.24 Multi format (reads 3.00–3.01), slot sub-chain',
  versionRange: [300, 301],
  bodyBytes: 1044,
  blocks: [
    { key: 'common', name: 'MultiCommon', offset: 4, length: 63 },
    { key: 'slotACommon', name: 'SingleA/Common', offset: 68, length: 54 },
    { key: 'slotAArp', name: 'SingleA/Arp', offset: 123, length: 32 },
    { key: 'slotALfo', name: 'SingleA/LFO', offset: 156, length: 14 },
    { key: 'slotAFilter', name: 'SingleA/Flt', offset: 171, length: 45 },
    { key: 'slotAAmpEnv', name: 'SingleA/AmpEnv', offset: 217, length: 25 },
    { key: 'slotAFx', name: 'SingleA/Fx', offset: 243, length: 14 },
    { key: 'slotAEq', name: 'SingleA/EQ', offset: 258, length: 11 },
    { key: 'slotADelay', name: 'SingleA/Dly', offset: 270, length: 27 },
    { key: 'slotAReverb', name: 'SingleA/Rvb', offset: 298, length: 9 },
    { key: 'slotAVibrato', name: 'SingleA/Vib', offset: 308, length: 3 },
    { key: 'slotBCommon', name: 'SingleB/Common', offset: 312, length: 54 },
    { key: 'slotBArp', name: 'SingleB/Arp', offset: 367, length: 32 },
    { key: 'slotBLfo', name: 'SingleB/LFO', offset: 400, length: 14 },
    { key: 'slotBFilter', name: 'SingleB/Flt', offset: 415, length: 45 },
    { key: 'slotBAmpEnv', name: 'SingleB/AmpEnv', offset: 461, length: 25 },
    { key: 'slotBFx', name: 'SingleB/Fx', offset: 487, length: 14 },
    { key: 'slotBEq', name: 'SingleB/EQ', offset: 502, length: 11 },
    { key: 'slotBDelay', name: 'SingleB/Dly', offset: 514, length: 27 },
    { key: 'slotBReverb', name: 'SingleB/Rvb', offset: 542, length: 9 },
    { key: 'slotBVibrato', name: 'SingleB/Vib', offset: 552, length: 3 },
    { key: 'slotCCommon', name: 'SingleC/Common', offset: 556, length: 54 },
    { key: 'slotCArp', name: 'SingleC/Arp', offset: 611, length: 32 },
    { key: 'slotCLfo', name: 'SingleC/LFO', offset: 644, length: 14 },
    { key: 'slotCFilter', name: 'SingleC/Flt', offset: 659, length: 45 },
    { key: 'slotCAmpEnv', name: 'SingleC/AmpEnv', offset: 705, length: 25 },
    { key: 'slotCFx', name: 'SingleC/Fx', offset: 731, length: 14 },
    { key: 'slotCEq', name: 'SingleC/EQ', offset: 746, length: 11 },
    { key: 'slotCDelay', name: 'SingleC/Dly', offset: 758, length: 27 },
    { key: 'slotCReverb', name: 'SingleC/Rvb', offset: 786, length: 9 },
    { key: 'slotCVibrato', name: 'SingleC/Vib', offset: 796, length: 3 },
    { key: 'slotDCommon', name: 'SingleD/Common', offset: 800, length: 54 },
    { key: 'slotDArp', name: 'SingleD/Arp', offset: 855, length: 32 },
    { key: 'slotDLfo', name: 'SingleD/LFO', offset: 888, length: 14 },
    { key: 'slotDFilter', name: 'SingleD/Flt', offset: 903, length: 45 },
    { key: 'slotDAmpEnv', name: 'SingleD/AmpEnv', offset: 949, length: 25 },
    { key: 'slotDFx', name: 'SingleD/Fx', offset: 975, length: 14 },
    { key: 'slotDEq', name: 'SingleD/EQ', offset: 990, length: 11 },
    { key: 'slotDDelay', name: 'SingleD/Dly', offset: 1002, length: 27 },
    { key: 'slotDReverb', name: 'SingleD/Rvb', offset: 1030, length: 9 },
    { key: 'slotDVibrato', name: 'SingleD/Vib', offset: 1040, length: 3 },
  ],
  fields: [...FIELDS_0, ...FIELDS_1, ...FIELDS_2],
};
