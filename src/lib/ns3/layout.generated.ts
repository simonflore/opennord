// AUTO-GENERATED (stage-3) — DO NOT EDIT MANUALLY.
//
// Provenance: Stage 3 OS 2.64 registry; Stage 3 OS 2.64 Multi format, serialiser (reads 3.00–3.04; 2.01–2.03 only through a converter).
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.
import type { FwLayout } from '../clavia/block-chain';

export type Ns3FieldKey =
  | 'common.slotFocus'
  | 'common.slotEnable'
  | 'common.splitEnable'
  | 'common.splitLowEnable'
  | 'common.splitMidEnable'
  | 'common.splitHighEnable'
  | 'common.splitLowPos'
  | 'common.splitMidPos'
  | 'common.splitHighPos'
  | 'common.splitLowWidth'
  | 'common.splitMidWidth'
  | 'common.splitHighWidth'
  | 'common.layerDetune'
  | 'common.orgPStickEnable'
  | 'common.orgVibratoType'
  | 'common.leslieSpeed'
  | 'common.leslieSpeed.morphWheel'
  | 'common.leslieSpeed.morphAfterTouch'
  | 'common.leslieSpeed.morphCtrlPedal'
  | 'common.leslieRotorAngle'
  | 'common.leslieHornAngle'
  | 'common.transposeEnable'
  | 'common.transposeValue'
  | 'common.masterClockRate'
  | 'common.leslieDrv'
  | 'common.dualKbdEnable'
  | 'common.dualKbdStyle'
  | 'common.pitchStickRange'
  | 'pianoA.enable'
  | 'pianoA.kbZone'
  | 'pianoA.level'
  | 'pianoA.level.morphWheel'
  | 'pianoA.level.morphAfterTouch'
  | 'pianoA.level.morphCtrlPedal'
  | 'pianoA.octaveShift'
  | 'pianoA.pitchStickEnable'
  | 'pianoA.sustainEnable'
  | 'pianoA.bank'
  | 'pianoA.entry'
  | 'pianoA.variation'
  | 'pianoA.nameHash'
  | 'pianoA.acoustic'
  | 'pianoA.pedalNoise'
  | 'pianoA.kbdTouch'
  | 'pianoA.eq'
  | 'synthCommonA.enable'
  | 'synthCommonA.kbZone'
  | 'synthCommonA.level'
  | 'synthCommonA.level.morphWheel'
  | 'synthCommonA.level.morphAfterTouch'
  | 'synthCommonA.level.morphCtrlPedal'
  | 'synthCommonA.octaveShift'
  | 'synthCommonA.pitchStickEnable'
  | 'synthCommonA.sustainEnable'
  | 'synthCommonA.presetPos'
  | 'synthCommonA.name1'
  | 'synthCommonA.name2'
  | 'synthCommonA.name3'
  | 'synthCommonA.name4'
  | 'synthCommonA.name5'
  | 'synthCommonA.name6'
  | 'synthCommonA.name7'
  | 'synthCommonA.name8'
  | 'synthCommonA.presetNameHash'
  | 'synthA.kbdHold'
  | 'synthA.arpRun'
  | 'synthA.arpKbdSync'
  | 'synthA.arpRange'
  | 'synthA.arpPattern'
  | 'synthA.arpClkEnable'
  | 'synthA.arpRateClkDiv'
  | 'synthA.arpRateClkDiv.morphWheel'
  | 'synthA.arpRateClkDiv.morphAfterTouch'
  | 'synthA.arpRateClkDiv.morphCtrlPedal'
  | 'synthA.voiceMode'
  | 'synthA.glideRate'
  | 'synthA.unison'
  | 'synthA.vibratoMode'
  | 'synthA.lfoWave'
  | 'synthA.lfoClkEnable'
  | 'synthA.lfoRateClkDiv'
  | 'synthA.lfoRateClkDiv.morphWheel'
  | 'synthA.lfoRateClkDiv.morphAfterTouch'
  | 'synthA.lfoRateClkDiv.morphCtrlPedal'
  | 'synthA.modEnvAtc'
  | 'synthA.modEnvDcy'
  | 'synthA.modEnvRls'
  | 'synthA.modEnvVel'
  | 'synthA.oscBank'
  | 'synthA.oscWave'
  | 'synthA.oscConf'
  | 'synthA.dualOscDetune'
  | 'synthA.oscCtrl'
  | 'synthA.oscCtrl.morphWheel'
  | 'synthA.oscCtrl.morphAfterTouch'
  | 'synthA.oscCtrl.morphCtrlPedal'
  | 'synthA.oscMod'
  | 'synthA.oscMod.morphWheel'
  | 'synthA.oscMod.morphAfterTouch'
  | 'synthA.oscMod.morphCtrlPedal'
  | 'synthA.fltType'
  | 'synthA.fltFreq'
  | 'synthA.fltFreq.morphWheel'
  | 'synthA.fltFreq.morphAfterTouch'
  | 'synthA.fltFreq.morphCtrlPedal'
  | 'synthA.fltRes'
  | 'synthA.fltRes.morphWheel'
  | 'synthA.fltRes.morphAfterTouch'
  | 'synthA.fltRes.morphCtrlPedal'
  | 'synthA.fltLFOAmt'
  | 'synthA.fltLFOAmt.morphWheel'
  | 'synthA.fltLFOAmt.morphAfterTouch'
  | 'synthA.fltLFOAmt.morphCtrlPedal'
  | 'synthA.fltMod'
  | 'synthA.fltKbdTrk'
  | 'synthA.fltDrive'
  | 'synthA.ampEnvAtc'
  | 'synthA.ampEnvDcy'
  | 'synthA.ampEnvRls'
  | 'synthA.ampEnvVel'
  | 'synthA.smpNameHash'
  | 'synthA.smpFastAtk'
  | 'organA.enable'
  | 'organA.kbZone'
  | 'organA.level'
  | 'organA.level.morphWheel'
  | 'organA.level.morphAfterTouch'
  | 'organA.level.morphCtrlPedal'
  | 'organA.octaveShift'
  | 'organA.sustainEnable'
  | 'organA.model'
  | 'organA.presetFocus'
  | 'organPresetIA.db1'
  | 'organPresetIA.db1.morphWheel'
  | 'organPresetIA.db1.morphAfterTouch'
  | 'organPresetIA.db1.morphCtrlPedal'
  | 'organPresetIA.db2'
  | 'organPresetIA.db2.morphWheel'
  | 'organPresetIA.db2.morphAfterTouch'
  | 'organPresetIA.db2.morphCtrlPedal'
  | 'organPresetIA.db3'
  | 'organPresetIA.db3.morphWheel'
  | 'organPresetIA.db3.morphAfterTouch'
  | 'organPresetIA.db3.morphCtrlPedal'
  | 'organPresetIA.db4'
  | 'organPresetIA.db4.morphWheel'
  | 'organPresetIA.db4.morphAfterTouch'
  | 'organPresetIA.db4.morphCtrlPedal'
  | 'organPresetIA.db5'
  | 'organPresetIA.db5.morphWheel'
  | 'organPresetIA.db5.morphAfterTouch'
  | 'organPresetIA.db5.morphCtrlPedal'
  | 'organPresetIA.db6'
  | 'organPresetIA.db6.morphWheel'
  | 'organPresetIA.db6.morphAfterTouch'
  | 'organPresetIA.db6.morphCtrlPedal'
  | 'organPresetIA.db7'
  | 'organPresetIA.db7.morphWheel'
  | 'organPresetIA.db7.morphAfterTouch'
  | 'organPresetIA.db7.morphCtrlPedal'
  | 'organPresetIA.db8'
  | 'organPresetIA.db8.morphWheel'
  | 'organPresetIA.db8.morphAfterTouch'
  | 'organPresetIA.db8.morphCtrlPedal'
  | 'organPresetIA.db9'
  | 'organPresetIA.db9.morphWheel'
  | 'organPresetIA.db9.morphAfterTouch'
  | 'organPresetIA.db9.morphCtrlPedal'
  | 'organPresetIA.vibratoEnable'
  | 'organPresetIA.b3PercEnable'
  | 'organPresetIA.b3PercHarmonic'
  | 'organPresetIA.b3PercSpeed'
  | 'organPresetIA.b3PercLevel'
  | 'organPresetIIA.db1'
  | 'organPresetIIA.db1.morphWheel'
  | 'organPresetIIA.db1.morphAfterTouch'
  | 'organPresetIIA.db1.morphCtrlPedal'
  | 'organPresetIIA.db2'
  | 'organPresetIIA.db2.morphWheel'
  | 'organPresetIIA.db2.morphAfterTouch'
  | 'organPresetIIA.db2.morphCtrlPedal'
  | 'organPresetIIA.db3'
  | 'organPresetIIA.db3.morphWheel'
  | 'organPresetIIA.db3.morphAfterTouch'
  | 'organPresetIIA.db3.morphCtrlPedal'
  | 'organPresetIIA.db4'
  | 'organPresetIIA.db4.morphWheel'
  | 'organPresetIIA.db4.morphAfterTouch'
  | 'organPresetIIA.db4.morphCtrlPedal'
  | 'organPresetIIA.db5'
  | 'organPresetIIA.db5.morphWheel'
  | 'organPresetIIA.db5.morphAfterTouch'
  | 'organPresetIIA.db5.morphCtrlPedal'
  | 'organPresetIIA.db6'
  | 'organPresetIIA.db6.morphWheel'
  | 'organPresetIIA.db6.morphAfterTouch'
  | 'organPresetIIA.db6.morphCtrlPedal'
  | 'organPresetIIA.db7'
  | 'organPresetIIA.db7.morphWheel'
  | 'organPresetIIA.db7.morphAfterTouch'
  | 'organPresetIIA.db7.morphCtrlPedal'
  | 'organPresetIIA.db8'
  | 'organPresetIIA.db8.morphWheel'
  | 'organPresetIIA.db8.morphAfterTouch'
  | 'organPresetIIA.db8.morphCtrlPedal'
  | 'organPresetIIA.db9'
  | 'organPresetIIA.db9.morphWheel'
  | 'organPresetIIA.db9.morphAfterTouch'
  | 'organPresetIIA.db9.morphCtrlPedal'
  | 'organPresetIIA.vibratoEnable'
  | 'organPresetIIA.b3PercEnable'
  | 'organPresetIIA.b3PercHarmonic'
  | 'organPresetIIA.b3PercSpeed'
  | 'organPresetIIA.b3PercLevel'
  | 'externA.enable'
  | 'externA.kbZone'
  | 'externA.octaveShift'
  | 'externA.velCurve'
  | 'externA.midiCh'
  | 'externA.pitchStickEnable'
  | 'externA.sustainEnable'
  | 'externA.modWheelEnable'
  | 'externA.aftertouchEnable'
  | 'externA.ctrlPedalEnable'
  | 'externA.swellPedalEnable'
  | 'externA.paramSelect'
  | 'externA.ccNumber'
  | 'externA.ccValue'
  | 'externA.ccValue.morphWheel'
  | 'externA.ccValue.morphAfterTouch'
  | 'externA.ccValue.morphCtrlPedal'
  | 'externA.sendOnLoadCC'
  | 'externA.bcValue_LSB'
  | 'externA.bcValue_MSB'
  | 'externA.pcValue'
  | 'externA.pcValue.morphWheel'
  | 'externA.pcValue.morphAfterTouch'
  | 'externA.pcValue.morphCtrlPedal'
  | 'externA.sendOnLoadPC'
  | 'externA.volValue'
  | 'externA.volValue.morphWheel'
  | 'externA.volValue.morphAfterTouch'
  | 'externA.volValue.morphCtrlPedal'
  | 'externA.sendOnLoadVol'
  | 'externA.volPedalEnable'
  | 'effectsA.leslieEnable'
  | 'effectsA.leslieSrc'
  | 'effectsA.fx1Enable'
  | 'effectsA.fx1Src'
  | 'effectsA.fx1Type'
  | 'effectsA.fx1ClkEnable'
  | 'effectsA.fx1RateClkDiv'
  | 'effectsA.fx1RateClkDiv.morphWheel'
  | 'effectsA.fx1RateClkDiv.morphAfterTouch'
  | 'effectsA.fx1RateClkDiv.morphCtrlPedal'
  | 'effectsA.fx1Amt'
  | 'effectsA.fx1Amt.morphWheel'
  | 'effectsA.fx1Amt.morphAfterTouch'
  | 'effectsA.fx1Amt.morphCtrlPedal'
  | 'effectsA.fx2Enable'
  | 'effectsA.fx2Src'
  | 'effectsA.fx2Type'
  | 'effectsA.fx2Rate'
  | 'effectsA.fx2Amt'
  | 'effectsA.fx2Amt.morphWheel'
  | 'effectsA.fx2Amt.morphAfterTouch'
  | 'effectsA.fx2Amt.morphCtrlPedal'
  | 'effectsA.dlyEnable'
  | 'effectsA.dlySrc'
  | 'effectsA.dlyClkEnable'
  | 'effectsA.dlyRateClkDiv'
  | 'effectsA.dlyRateClkDiv.morphWheel'
  | 'effectsA.dlyRateClkDiv.morphAfterTouch'
  | 'effectsA.dlyRateClkDiv.morphCtrlPedal'
  | 'effectsA.dlyMix'
  | 'effectsA.dlyMix.morphWheel'
  | 'effectsA.dlyMix.morphAfterTouch'
  | 'effectsA.dlyMix.morphCtrlPedal'
  | 'effectsA.dlyPingPong'
  | 'effectsA.dlyFltType'
  | 'effectsA.dlyFeedback'
  | 'effectsA.dlyFeedback.morphWheel'
  | 'effectsA.dlyFeedback.morphAfterTouch'
  | 'effectsA.dlyFeedback.morphCtrlPedal'
  | 'effectsA.dlyMode'
  | 'effectsA.ampEnable'
  | 'effectsA.ampSrc'
  | 'effectsA.ampType'
  | 'effectsA.ampTreble'
  | 'effectsA.ampMid'
  | 'effectsA.ampBass'
  | 'effectsA.ampMidFreq'
  | 'effectsA.ampMidFreq.morphWheel'
  | 'effectsA.ampMidFreq.morphAfterTouch'
  | 'effectsA.ampMidFreq.morphCtrlPedal'
  | 'effectsA.ampDrive'
  | 'effectsA.ampDrive.morphWheel'
  | 'effectsA.ampDrive.morphAfterTouch'
  | 'effectsA.ampDrive.morphCtrlPedal'
  | 'effectsA.rvbEnable'
  | 'effectsA.rvbType'
  | 'effectsA.rvbBright'
  | 'effectsA.rvbAmt'
  | 'effectsA.rvbAmt.morphWheel'
  | 'effectsA.rvbAmt.morphAfterTouch'
  | 'effectsA.rvbAmt.morphCtrlPedal'
  | 'effectsA.cmpEnable'
  | 'effectsA.cmpAmt'
  | 'effectsA.cmpResponse'
  | 'mixerA.audioRouteProg'
  | 'mixerA.audioRouteProgSub'
  | 'mixerA.audioRouteProgSubDest'
  | 'pianoB.enable'
  | 'pianoB.kbZone'
  | 'pianoB.level'
  | 'pianoB.level.morphWheel'
  | 'pianoB.level.morphAfterTouch'
  | 'pianoB.level.morphCtrlPedal'
  | 'pianoB.octaveShift'
  | 'pianoB.pitchStickEnable'
  | 'pianoB.sustainEnable'
  | 'pianoB.bank'
  | 'pianoB.entry'
  | 'pianoB.variation'
  | 'pianoB.nameHash'
  | 'pianoB.acoustic'
  | 'pianoB.pedalNoise'
  | 'pianoB.kbdTouch'
  | 'pianoB.eq'
  | 'synthCommonB.enable'
  | 'synthCommonB.kbZone'
  | 'synthCommonB.level'
  | 'synthCommonB.level.morphWheel'
  | 'synthCommonB.level.morphAfterTouch'
  | 'synthCommonB.level.morphCtrlPedal'
  | 'synthCommonB.octaveShift'
  | 'synthCommonB.pitchStickEnable'
  | 'synthCommonB.sustainEnable'
  | 'synthCommonB.presetPos'
  | 'synthCommonB.name1'
  | 'synthCommonB.name2'
  | 'synthCommonB.name3'
  | 'synthCommonB.name4'
  | 'synthCommonB.name5'
  | 'synthCommonB.name6'
  | 'synthCommonB.name7'
  | 'synthCommonB.name8'
  | 'synthCommonB.presetNameHash'
  | 'synthB.kbdHold'
  | 'synthB.arpRun'
  | 'synthB.arpKbdSync'
  | 'synthB.arpRange'
  | 'synthB.arpPattern'
  | 'synthB.arpClkEnable'
  | 'synthB.arpRateClkDiv'
  | 'synthB.arpRateClkDiv.morphWheel'
  | 'synthB.arpRateClkDiv.morphAfterTouch'
  | 'synthB.arpRateClkDiv.morphCtrlPedal'
  | 'synthB.voiceMode'
  | 'synthB.glideRate'
  | 'synthB.unison'
  | 'synthB.vibratoMode'
  | 'synthB.lfoWave'
  | 'synthB.lfoClkEnable'
  | 'synthB.lfoRateClkDiv'
  | 'synthB.lfoRateClkDiv.morphWheel'
  | 'synthB.lfoRateClkDiv.morphAfterTouch'
  | 'synthB.lfoRateClkDiv.morphCtrlPedal'
  | 'synthB.modEnvAtc'
  | 'synthB.modEnvDcy'
  | 'synthB.modEnvRls'
  | 'synthB.modEnvVel'
  | 'synthB.oscBank'
  | 'synthB.oscWave'
  | 'synthB.oscConf'
  | 'synthB.dualOscDetune'
  | 'synthB.oscCtrl'
  | 'synthB.oscCtrl.morphWheel'
  | 'synthB.oscCtrl.morphAfterTouch'
  | 'synthB.oscCtrl.morphCtrlPedal'
  | 'synthB.oscMod'
  | 'synthB.oscMod.morphWheel'
  | 'synthB.oscMod.morphAfterTouch'
  | 'synthB.oscMod.morphCtrlPedal'
  | 'synthB.fltType'
  | 'synthB.fltFreq'
  | 'synthB.fltFreq.morphWheel'
  | 'synthB.fltFreq.morphAfterTouch'
  | 'synthB.fltFreq.morphCtrlPedal'
  | 'synthB.fltRes'
  | 'synthB.fltRes.morphWheel'
  | 'synthB.fltRes.morphAfterTouch'
  | 'synthB.fltRes.morphCtrlPedal'
  | 'synthB.fltLFOAmt'
  | 'synthB.fltLFOAmt.morphWheel'
  | 'synthB.fltLFOAmt.morphAfterTouch'
  | 'synthB.fltLFOAmt.morphCtrlPedal'
  | 'synthB.fltMod'
  | 'synthB.fltKbdTrk'
  | 'synthB.fltDrive'
  | 'synthB.ampEnvAtc'
  | 'synthB.ampEnvDcy'
  | 'synthB.ampEnvRls'
  | 'synthB.ampEnvVel'
  | 'synthB.smpNameHash'
  | 'synthB.smpFastAtk'
  | 'organB.enable'
  | 'organB.kbZone'
  | 'organB.level'
  | 'organB.level.morphWheel'
  | 'organB.level.morphAfterTouch'
  | 'organB.level.morphCtrlPedal'
  | 'organB.octaveShift'
  | 'organB.sustainEnable'
  | 'organB.model'
  | 'organB.presetFocus'
  | 'organPresetIB.db1'
  | 'organPresetIB.db1.morphWheel'
  | 'organPresetIB.db1.morphAfterTouch'
  | 'organPresetIB.db1.morphCtrlPedal'
  | 'organPresetIB.db2'
  | 'organPresetIB.db2.morphWheel'
  | 'organPresetIB.db2.morphAfterTouch'
  | 'organPresetIB.db2.morphCtrlPedal'
  | 'organPresetIB.db3'
  | 'organPresetIB.db3.morphWheel'
  | 'organPresetIB.db3.morphAfterTouch'
  | 'organPresetIB.db3.morphCtrlPedal'
  | 'organPresetIB.db4'
  | 'organPresetIB.db4.morphWheel'
  | 'organPresetIB.db4.morphAfterTouch'
  | 'organPresetIB.db4.morphCtrlPedal'
  | 'organPresetIB.db5'
  | 'organPresetIB.db5.morphWheel'
  | 'organPresetIB.db5.morphAfterTouch'
  | 'organPresetIB.db5.morphCtrlPedal'
  | 'organPresetIB.db6'
  | 'organPresetIB.db6.morphWheel'
  | 'organPresetIB.db6.morphAfterTouch'
  | 'organPresetIB.db6.morphCtrlPedal'
  | 'organPresetIB.db7'
  | 'organPresetIB.db7.morphWheel'
  | 'organPresetIB.db7.morphAfterTouch'
  | 'organPresetIB.db7.morphCtrlPedal'
  | 'organPresetIB.db8'
  | 'organPresetIB.db8.morphWheel'
  | 'organPresetIB.db8.morphAfterTouch'
  | 'organPresetIB.db8.morphCtrlPedal'
  | 'organPresetIB.db9'
  | 'organPresetIB.db9.morphWheel'
  | 'organPresetIB.db9.morphAfterTouch'
  | 'organPresetIB.db9.morphCtrlPedal'
  | 'organPresetIB.vibratoEnable'
  | 'organPresetIB.b3PercEnable'
  | 'organPresetIB.b3PercHarmonic'
  | 'organPresetIB.b3PercSpeed'
  | 'organPresetIB.b3PercLevel'
  | 'organPresetIIB.db1'
  | 'organPresetIIB.db1.morphWheel'
  | 'organPresetIIB.db1.morphAfterTouch'
  | 'organPresetIIB.db1.morphCtrlPedal'
  | 'organPresetIIB.db2'
  | 'organPresetIIB.db2.morphWheel'
  | 'organPresetIIB.db2.morphAfterTouch'
  | 'organPresetIIB.db2.morphCtrlPedal'
  | 'organPresetIIB.db3'
  | 'organPresetIIB.db3.morphWheel'
  | 'organPresetIIB.db3.morphAfterTouch'
  | 'organPresetIIB.db3.morphCtrlPedal'
  | 'organPresetIIB.db4'
  | 'organPresetIIB.db4.morphWheel'
  | 'organPresetIIB.db4.morphAfterTouch'
  | 'organPresetIIB.db4.morphCtrlPedal'
  | 'organPresetIIB.db5'
  | 'organPresetIIB.db5.morphWheel'
  | 'organPresetIIB.db5.morphAfterTouch'
  | 'organPresetIIB.db5.morphCtrlPedal'
  | 'organPresetIIB.db6'
  | 'organPresetIIB.db6.morphWheel'
  | 'organPresetIIB.db6.morphAfterTouch'
  | 'organPresetIIB.db6.morphCtrlPedal'
  | 'organPresetIIB.db7'
  | 'organPresetIIB.db7.morphWheel'
  | 'organPresetIIB.db7.morphAfterTouch'
  | 'organPresetIIB.db7.morphCtrlPedal'
  | 'organPresetIIB.db8'
  | 'organPresetIIB.db8.morphWheel'
  | 'organPresetIIB.db8.morphAfterTouch'
  | 'organPresetIIB.db8.morphCtrlPedal'
  | 'organPresetIIB.db9'
  | 'organPresetIIB.db9.morphWheel'
  | 'organPresetIIB.db9.morphAfterTouch'
  | 'organPresetIIB.db9.morphCtrlPedal'
  | 'organPresetIIB.vibratoEnable'
  | 'organPresetIIB.b3PercEnable'
  | 'organPresetIIB.b3PercHarmonic'
  | 'organPresetIIB.b3PercSpeed'
  | 'organPresetIIB.b3PercLevel'
  | 'externB.enable'
  | 'externB.kbZone'
  | 'externB.octaveShift'
  | 'externB.velCurve'
  | 'externB.midiCh'
  | 'externB.pitchStickEnable'
  | 'externB.sustainEnable'
  | 'externB.modWheelEnable'
  | 'externB.aftertouchEnable'
  | 'externB.ctrlPedalEnable'
  | 'externB.swellPedalEnable'
  | 'externB.paramSelect'
  | 'externB.ccNumber'
  | 'externB.ccValue'
  | 'externB.ccValue.morphWheel'
  | 'externB.ccValue.morphAfterTouch'
  | 'externB.ccValue.morphCtrlPedal'
  | 'externB.sendOnLoadCC'
  | 'externB.bcValue_LSB'
  | 'externB.bcValue_MSB'
  | 'externB.pcValue'
  | 'externB.pcValue.morphWheel'
  | 'externB.pcValue.morphAfterTouch'
  | 'externB.pcValue.morphCtrlPedal'
  | 'externB.sendOnLoadPC'
  | 'externB.volValue'
  | 'externB.volValue.morphWheel'
  | 'externB.volValue.morphAfterTouch'
  | 'externB.volValue.morphCtrlPedal'
  | 'externB.sendOnLoadVol'
  | 'externB.volPedalEnable'
  | 'effectsB.leslieEnable'
  | 'effectsB.leslieSrc'
  | 'effectsB.fx1Enable'
  | 'effectsB.fx1Src'
  | 'effectsB.fx1Type'
  | 'effectsB.fx1ClkEnable'
  | 'effectsB.fx1RateClkDiv'
  | 'effectsB.fx1RateClkDiv.morphWheel'
  | 'effectsB.fx1RateClkDiv.morphAfterTouch'
  | 'effectsB.fx1RateClkDiv.morphCtrlPedal'
  | 'effectsB.fx1Amt'
  | 'effectsB.fx1Amt.morphWheel'
  | 'effectsB.fx1Amt.morphAfterTouch'
  | 'effectsB.fx1Amt.morphCtrlPedal'
  | 'effectsB.fx2Enable'
  | 'effectsB.fx2Src'
  | 'effectsB.fx2Type'
  | 'effectsB.fx2Rate'
  | 'effectsB.fx2Amt'
  | 'effectsB.fx2Amt.morphWheel'
  | 'effectsB.fx2Amt.morphAfterTouch'
  | 'effectsB.fx2Amt.morphCtrlPedal'
  | 'effectsB.dlyEnable'
  | 'effectsB.dlySrc'
  | 'effectsB.dlyClkEnable'
  | 'effectsB.dlyRateClkDiv'
  | 'effectsB.dlyRateClkDiv.morphWheel'
  | 'effectsB.dlyRateClkDiv.morphAfterTouch'
  | 'effectsB.dlyRateClkDiv.morphCtrlPedal'
  | 'effectsB.dlyMix'
  | 'effectsB.dlyMix.morphWheel'
  | 'effectsB.dlyMix.morphAfterTouch'
  | 'effectsB.dlyMix.morphCtrlPedal'
  | 'effectsB.dlyPingPong'
  | 'effectsB.dlyFltType'
  | 'effectsB.dlyFeedback'
  | 'effectsB.dlyFeedback.morphWheel'
  | 'effectsB.dlyFeedback.morphAfterTouch'
  | 'effectsB.dlyFeedback.morphCtrlPedal'
  | 'effectsB.dlyMode'
  | 'effectsB.ampEnable'
  | 'effectsB.ampSrc'
  | 'effectsB.ampType'
  | 'effectsB.ampTreble'
  | 'effectsB.ampMid'
  | 'effectsB.ampBass'
  | 'effectsB.ampMidFreq'
  | 'effectsB.ampMidFreq.morphWheel'
  | 'effectsB.ampMidFreq.morphAfterTouch'
  | 'effectsB.ampMidFreq.morphCtrlPedal'
  | 'effectsB.ampDrive'
  | 'effectsB.ampDrive.morphWheel'
  | 'effectsB.ampDrive.morphAfterTouch'
  | 'effectsB.ampDrive.morphCtrlPedal'
  | 'effectsB.rvbEnable'
  | 'effectsB.rvbType'
  | 'effectsB.rvbBright'
  | 'effectsB.rvbAmt'
  | 'effectsB.rvbAmt.morphWheel'
  | 'effectsB.rvbAmt.morphAfterTouch'
  | 'effectsB.rvbAmt.morphCtrlPedal'
  | 'effectsB.cmpEnable'
  | 'effectsB.cmpAmt'
  | 'effectsB.cmpResponse'
  | 'mixerB.audioRouteProg'
  | 'mixerB.audioRouteProgSub'
  | 'mixerB.audioRouteProgSubDest';

export const NS3_LAYOUT: FwLayout<Ns3FieldKey> = {
  model: 'Nord Stage 3',
  source: 'Stage 3 OS 2.64 registry',
  container: 'Stage 3 OS 2.64 Multi format, serialiser (reads 3.00–3.04; 2.01–2.03 only through a converter)',
  versionRange: [300, 304],
  bodyBytes: 548,
  blocks: [
    { key: 'common', name: 'Common:MultiCommon', offset: 4, length: 17 },
    { key: 'pianoA', name: 'A:Piano', offset: 22, length: 14 },
    { key: 'synthCommonA', name: 'A:SynthCommon', offset: 37, length: 45 },
    { key: 'synthA', name: 'A:Synth', offset: 83, length: 53 },
    { key: 'organA', name: 'A:Organ', offset: 137, length: 7 },
    { key: 'organPresetIA', name: 'A:OrgPreset/PresetI', offset: 145, length: 26 },
    { key: 'organPresetIIA', name: 'A:OrgPreset/PresetII', offset: 172, length: 26 },
    { key: 'externA', name: 'A:Extern', offset: 199, length: 22 },
    { key: 'effectsA', name: 'A:Effects', offset: 222, length: 56 },
    { key: 'mixerA', name: 'A:Mixer', offset: 279, length: 5 },
    { key: 'pianoB', name: 'B:Piano', offset: 285, length: 14 },
    { key: 'synthCommonB', name: 'B:SynthCommon', offset: 300, length: 45 },
    { key: 'synthB', name: 'B:Synth', offset: 346, length: 53 },
    { key: 'organB', name: 'B:Organ', offset: 400, length: 7 },
    { key: 'organPresetIB', name: 'B:OrgPreset/PresetI', offset: 408, length: 26 },
    { key: 'organPresetIIB', name: 'B:OrgPreset/PresetII', offset: 435, length: 26 },
    { key: 'externB', name: 'B:Extern', offset: 462, length: 22 },
    { key: 'effectsB', name: 'B:Effects', offset: 485, length: 56 },
    { key: 'mixerB', name: 'B:Mixer', offset: 542, length: 5 },
  ],
  fields: [
    { key: 'common.slotFocus', name: 'Param_Com_kSlotFocus', block: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 115' },
    { key: 'common.slotEnable', name: 'Param_Com_kSlotEnable', block: 0, bit: 1, width: 2, min: 1, max: 3, def: 1, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 116' },
    { key: 'common.splitEnable', name: 'Param_Spl_kEnable', block: 0, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 126' },
    { key: 'common.splitLowEnable', name: 'Param_Spl_kLowEnable', block: 0, bit: 4, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 127' },
    { key: 'common.splitMidEnable', name: 'Param_Spl_kMidEnable', block: 0, bit: 5, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 128' },
    { key: 'common.splitHighEnable', name: 'Param_Spl_kHighEnable', block: 0, bit: 6, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 129' },
    { key: 'common.splitLowPos', name: 'Param_Spl_kLowPos', block: 0, bit: 7, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 130' },
    { key: 'common.splitMidPos', name: 'Param_Spl_kMidPos', block: 0, bit: 11, width: 4, min: 0, max: 9, def: 4, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 131' },
    { key: 'common.splitHighPos', name: 'Param_Spl_kHighPos', block: 0, bit: 15, width: 4, min: 0, max: 9, def: 7, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 132' },
    { key: 'common.splitLowWidth', name: 'Param_Spl_kLowWidth', block: 0, bit: 19, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 133' },
    { key: 'common.splitMidWidth', name: 'Param_Spl_kMidWidth', block: 0, bit: 21, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 134' },
    { key: 'common.splitHighWidth', name: 'Param_Spl_kHighWidth', block: 0, bit: 23, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 135' },
    { key: 'common.layerDetune', name: 'Param_Pno_kLayerDetune', block: 0, bit: 25, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 210' },
    { key: 'common.orgPStickEnable', name: 'Param_Com_kOrgPStickEnable', block: 0, bit: 27, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 216' },
    { key: 'common.orgVibratoType', name: 'Param_Com_kOrgVibratoType', block: 0, bit: 28, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 219' },
    { key: 'common.leslieSpeed', name: 'Param_Effects_kLeslieSpeed', block: 0, bit: 31, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 260' },
    { key: 'common.leslieSpeed.morphWheel', name: 'Param_Effects_kLeslieSpeed@Wheel', block: 0, bit: 33, width: 3, min: -3, max: 3, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 260 · Wheel morph' },
    { key: 'common.leslieSpeed.morphAfterTouch', name: 'Param_Effects_kLeslieSpeed@AfterTouch', block: 0, bit: 36, width: 3, min: -3, max: 3, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 260 · AfterTouch morph' },
    { key: 'common.leslieSpeed.morphCtrlPedal', name: 'Param_Effects_kLeslieSpeed@CtrlPedal', block: 0, bit: 39, width: 3, min: -3, max: 3, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 260 · CtrlPedal morph' },
    { key: 'common.leslieRotorAngle', name: 'Param_Com_kLeslieRotorAngle', block: 0, bit: 42, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 121' },
    { key: 'common.leslieHornAngle', name: 'Param_Com_kLeslieHornAngle', block: 0, bit: 49, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 122' },
    { key: 'common.transposeEnable', name: 'Param_Com_kTransposeEnable', block: 0, bit: 56, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 117' },
    { key: 'common.transposeValue', name: 'Param_Com_kTransposeValue', block: 0, bit: 57, width: 4, min: -6, max: 6, def: 1, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 118' },
    { key: 'common.masterClockRate', name: 'Param_Com_kMasterClockRate', block: 0, bit: 61, width: 8, min: 30, max: 240, def: 120, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 119' },
    { key: 'common.leslieDrv', name: 'Param_Effects_kLeslieDrv', block: 0, bit: 69, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 259' },
    { key: 'common.dualKbdEnable', name: 'Param_Com_kDualKbdEnable', block: 0, bit: 76, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 123' },
    { key: 'common.dualKbdStyle', name: 'Param_Com_kDualKbdStyle', block: 0, bit: 77, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 124' },
    { key: 'common.pitchStickRange', name: 'Param_Syn_kPitchStickRange', block: 0, bit: 80, width: 4, min: 0, max: 9, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 157' },
    { key: 'pianoA.enable', name: 'Param_Pno_kEnable', block: 1, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 196' },
    { key: 'pianoA.kbZone', name: 'Param_Pno_kKbZone', block: 1, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 197' },
    { key: 'pianoA.level', name: 'Param_Pno_kLevel', block: 1, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198' },
    { key: 'pianoA.level.morphWheel', name: 'Param_Pno_kLevel@Wheel', block: 1, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · Wheel morph' },
    { key: 'pianoA.level.morphAfterTouch', name: 'Param_Pno_kLevel@AfterTouch', block: 1, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · AfterTouch morph' },
    { key: 'pianoA.level.morphCtrlPedal', name: 'Param_Pno_kLevel@CtrlPedal', block: 1, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · CtrlPedal morph' },
    { key: 'pianoA.octaveShift', name: 'Param_Pno_kOctaveShift', block: 1, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 199' },
    { key: 'pianoA.pitchStickEnable', name: 'Param_Pno_kPitchStickEnable', block: 1, bit: 40, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 200' },
    { key: 'pianoA.sustainEnable', name: 'Param_Pno_kSustainEnable', block: 1, bit: 41, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 201' },
    { key: 'pianoA.bank', name: 'Param_Pno_kBank', block: 1, bit: 42, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 203' },
    { key: 'pianoA.entry', name: 'Param_Pno_kEntry', block: 1, bit: 45, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 204' },
    { key: 'pianoA.variation', name: 'Param_Pno_kVariation', block: 1, bit: 50, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 205' },
    { key: 'pianoA.nameHash', name: 'Param_Pno_kNameHash_Private', block: 1, bit: 52, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 206' },
    { key: 'pianoA.acoustic', name: 'Param_Pno_kAcoustic', block: 1, bit: 84, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 207' },
    { key: 'pianoA.pedalNoise', name: 'Param_Pno_kPedalNoise', block: 1, bit: 86, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 208' },
    { key: 'pianoA.kbdTouch', name: 'Param_Pno_kKbdTouch', block: 1, bit: 87, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 209' },
    { key: 'pianoA.eq', name: 'Param_Pno_kEq', block: 1, bit: 89, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 211' },
    { key: 'synthCommonA.enable', name: 'Param_Syn_kEnable', block: 2, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 139' },
    { key: 'synthCommonA.kbZone', name: 'Param_Syn_kKbZone', block: 2, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 140' },
    { key: 'synthCommonA.level', name: 'Param_Syn_kLevel', block: 2, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141' },
    { key: 'synthCommonA.level.morphWheel', name: 'Param_Syn_kLevel@Wheel', block: 2, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · Wheel morph' },
    { key: 'synthCommonA.level.morphAfterTouch', name: 'Param_Syn_kLevel@AfterTouch', block: 2, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · AfterTouch morph' },
    { key: 'synthCommonA.level.morphCtrlPedal', name: 'Param_Syn_kLevel@CtrlPedal', block: 2, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · CtrlPedal morph' },
    { key: 'synthCommonA.octaveShift', name: 'Param_Syn_kOctaveShift', block: 2, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 142' },
    { key: 'synthCommonA.pitchStickEnable', name: 'Param_Syn_kPitchStickEnable', block: 2, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 143' },
    { key: 'synthCommonA.sustainEnable', name: 'Param_Syn_kSustainEnable', block: 2, bit: 41, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 144' },
    { key: 'synthCommonA.presetPos', name: 'Param_Syn_kPresetPos', block: 2, bit: 42, width: 10, min: 0, max: 799, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 145' },
    { key: 'synthCommonA.name1', name: 'Param_Syn_kName1_Private', block: 2, bit: 52, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 146' },
    { key: 'synthCommonA.name2', name: 'Param_Syn_kName2_Private', block: 2, bit: 84, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 147' },
    { key: 'synthCommonA.name3', name: 'Param_Syn_kName3_Private', block: 2, bit: 116, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 148' },
    { key: 'synthCommonA.name4', name: 'Param_Syn_kName4_Private', block: 2, bit: 148, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 149' },
    { key: 'synthCommonA.name5', name: 'Param_Syn_kName5_Private', block: 2, bit: 180, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 150' },
    { key: 'synthCommonA.name6', name: 'Param_Syn_kName6_Private', block: 2, bit: 212, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 151' },
    { key: 'synthCommonA.name7', name: 'Param_Syn_kName7_Private', block: 2, bit: 244, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 152' },
    { key: 'synthCommonA.name8', name: 'Param_Syn_kName8_Private', block: 2, bit: 276, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 153' },
    { key: 'synthCommonA.presetNameHash', name: 'Param_Syn_kPresetNameHash_Private', block: 2, bit: 308, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 154' },
    { key: 'synthA.kbdHold', name: 'Param_Syn_kKbdHold', block: 3, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 158' },
    { key: 'synthA.arpRun', name: 'Param_Syn_kArpRun', block: 3, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 159' },
    { key: 'synthA.arpKbdSync', name: 'Param_Syn_kArpKbdSync', block: 3, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 160' },
    { key: 'synthA.arpRange', name: 'Param_Syn_kArpRange', block: 3, bit: 3, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 161' },
    { key: 'synthA.arpPattern', name: 'Param_Syn_kArpPattern', block: 3, bit: 5, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 162' },
    { key: 'synthA.arpClkEnable', name: 'Param_Syn_kArpClkEnable', block: 3, bit: 7, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 163' },
    { key: 'synthA.arpRateClkDiv', name: 'Param_Syn_kArpRateClkDiv', block: 3, bit: 8, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164' },
    { key: 'synthA.arpRateClkDiv.morphWheel', name: 'Param_Syn_kArpRateClkDiv@Wheel', block: 3, bit: 15, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · Wheel morph' },
    { key: 'synthA.arpRateClkDiv.morphAfterTouch', name: 'Param_Syn_kArpRateClkDiv@AfterTouch', block: 3, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · AfterTouch morph' },
    { key: 'synthA.arpRateClkDiv.morphCtrlPedal', name: 'Param_Syn_kArpRateClkDiv@CtrlPedal', block: 3, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · CtrlPedal morph' },
    { key: 'synthA.voiceMode', name: 'Param_Syn_kVoiceMode', block: 3, bit: 39, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 165' },
    { key: 'synthA.glideRate', name: 'Param_Syn_kGlideRate', block: 3, bit: 41, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 166' },
    { key: 'synthA.unison', name: 'Param_Syn_kUnison', block: 3, bit: 48, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 167' },
    { key: 'synthA.vibratoMode', name: 'Param_Syn_kVibratoMode', block: 3, bit: 50, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 168' },
    { key: 'synthA.lfoWave', name: 'Param_Syn_kLFOWave', block: 3, bit: 53, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 169' },
    { key: 'synthA.lfoClkEnable', name: 'Param_Syn_kLFOClkEnable', block: 3, bit: 56, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 170' },
    { key: 'synthA.lfoRateClkDiv', name: 'Param_Syn_kLFORateClkDiv', block: 3, bit: 57, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171' },
    { key: 'synthA.lfoRateClkDiv.morphWheel', name: 'Param_Syn_kLFORateClkDiv@Wheel', block: 3, bit: 64, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · Wheel morph' },
    { key: 'synthA.lfoRateClkDiv.morphAfterTouch', name: 'Param_Syn_kLFORateClkDiv@AfterTouch', block: 3, bit: 72, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · AfterTouch morph' },
    { key: 'synthA.lfoRateClkDiv.morphCtrlPedal', name: 'Param_Syn_kLFORateClkDiv@CtrlPedal', block: 3, bit: 80, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · CtrlPedal morph' },
    { key: 'synthA.modEnvAtc', name: 'Param_Syn_kModEnvAtc', block: 3, bit: 88, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 172' },
    { key: 'synthA.modEnvDcy', name: 'Param_Syn_kModEnvDcy', block: 3, bit: 95, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 173' },
    { key: 'synthA.modEnvRls', name: 'Param_Syn_kModEnvRls', block: 3, bit: 102, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 174' },
    { key: 'synthA.modEnvVel', name: 'Param_Syn_kModEnvVel', block: 3, bit: 109, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 175' },
    { key: 'synthA.oscBank', name: 'Edt_Syn_kOscBank', block: 3, bit: 110, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 195' },
    { key: 'synthA.oscWave', name: 'Edt_Syn_kOscWave', block: 3, bit: 113, width: 9, min: 0, max: 399, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 176' },
    { key: 'synthA.oscConf', name: 'Edt_Syn_kOscConf', block: 3, bit: 122, width: 5, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 177' },
    { key: 'synthA.dualOscDetune', name: 'Edt_Syn_kDualOscDetune', block: 3, bit: 127, width: 6, min: 0, max: 60, def: 12, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 179' },
    { key: 'synthA.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 3, bit: 133, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178' },
    { key: 'synthA.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 3, bit: 140, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · Wheel morph' },
    { key: 'synthA.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@AfterTouch', block: 3, bit: 148, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · AfterTouch morph' },
    { key: 'synthA.oscCtrl.morphCtrlPedal', name: 'Edt_Syn_kOscCtrl@CtrlPedal', block: 3, bit: 156, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · CtrlPedal morph' },
    { key: 'synthA.oscMod', name: 'Param_Syn_kOscMod', block: 3, bit: 164, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180' },
    { key: 'synthA.oscMod.morphWheel', name: 'Param_Syn_kOscMod@Wheel', block: 3, bit: 171, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · Wheel morph' },
    { key: 'synthA.oscMod.morphAfterTouch', name: 'Param_Syn_kOscMod@AfterTouch', block: 3, bit: 179, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · AfterTouch morph' },
    { key: 'synthA.oscMod.morphCtrlPedal', name: 'Param_Syn_kOscMod@CtrlPedal', block: 3, bit: 187, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · CtrlPedal morph' },
    { key: 'synthA.fltType', name: 'Param_Syn_kFltType', block: 3, bit: 195, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 181' },
    { key: 'synthA.fltFreq', name: 'Param_Syn_kFltFreq', block: 3, bit: 198, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182' },
    { key: 'synthA.fltFreq.morphWheel', name: 'Param_Syn_kFltFreq@Wheel', block: 3, bit: 205, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · Wheel morph' },
    { key: 'synthA.fltFreq.morphAfterTouch', name: 'Param_Syn_kFltFreq@AfterTouch', block: 3, bit: 213, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · AfterTouch morph' },
    { key: 'synthA.fltFreq.morphCtrlPedal', name: 'Param_Syn_kFltFreq@CtrlPedal', block: 3, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · CtrlPedal morph' },
    { key: 'synthA.fltRes', name: 'Param_Syn_kFltRes', block: 3, bit: 229, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183' },
    { key: 'synthA.fltRes.morphWheel', name: 'Param_Syn_kFltRes@Wheel', block: 3, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · Wheel morph' },
    { key: 'synthA.fltRes.morphAfterTouch', name: 'Param_Syn_kFltRes@AfterTouch', block: 3, bit: 244, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · AfterTouch morph' },
    { key: 'synthA.fltRes.morphCtrlPedal', name: 'Param_Syn_kFltRes@CtrlPedal', block: 3, bit: 252, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · CtrlPedal morph' },
    { key: 'synthA.fltLFOAmt', name: 'Param_Syn_kFltLFOAmt', block: 3, bit: 260, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184' },
    { key: 'synthA.fltLFOAmt.morphWheel', name: 'Param_Syn_kFltLFOAmt@Wheel', block: 3, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · Wheel morph' },
    { key: 'synthA.fltLFOAmt.morphAfterTouch', name: 'Param_Syn_kFltLFOAmt@AfterTouch', block: 3, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · AfterTouch morph' },
    { key: 'synthA.fltLFOAmt.morphCtrlPedal', name: 'Param_Syn_kFltLFOAmt@CtrlPedal', block: 3, bit: 283, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · CtrlPedal morph' },
    { key: 'synthA.fltMod', name: 'Param_Syn_kFltMod', block: 3, bit: 291, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 185' },
    { key: 'synthA.fltKbdTrk', name: 'Param_Syn_kFltKbdTrk', block: 3, bit: 298, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 187' },
    { key: 'synthA.fltDrive', name: 'Param_Syn_kFltDrive', block: 3, bit: 300, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 186' },
    { key: 'synthA.ampEnvAtc', name: 'Param_Syn_kAmpEnvAtc', block: 3, bit: 302, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 188' },
    { key: 'synthA.ampEnvDcy', name: 'Param_Syn_kAmpEnvDcy', block: 3, bit: 309, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 189' },
    { key: 'synthA.ampEnvRls', name: 'Param_Syn_kAmpEnvRls', block: 3, bit: 316, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 190' },
    { key: 'synthA.ampEnvVel', name: 'Param_Syn_kAmpEnvVel', block: 3, bit: 323, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 191' },
    { key: 'synthA.smpNameHash', name: 'Param_Syn_kSmpNameHash_Private', block: 3, bit: 325, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 194' },
    { key: 'synthA.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 3, bit: 357, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 192' },
    { key: 'organA.enable', name: 'Param_Org_kEnable', block: 4, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 212' },
    { key: 'organA.kbZone', name: 'Param_Org_kKbZone', block: 4, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 213' },
    { key: 'organA.level', name: 'Param_Org_kLevel', block: 4, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214' },
    { key: 'organA.level.morphWheel', name: 'Param_Org_kLevel@Wheel', block: 4, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · Wheel morph' },
    { key: 'organA.level.morphAfterTouch', name: 'Param_Org_kLevel@AfterTouch', block: 4, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · AfterTouch morph' },
    { key: 'organA.level.morphCtrlPedal', name: 'Param_Org_kLevel@CtrlPedal', block: 4, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · CtrlPedal morph' },
    { key: 'organA.octaveShift', name: 'Param_Org_kOctaveShift', block: 4, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 215' },
    { key: 'organA.sustainEnable', name: 'Param_Org_kSustainEnable', block: 4, bit: 40, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 217' },
    { key: 'organA.model', name: 'Param_Org_kModel', block: 4, bit: 41, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 218' },
    { key: 'organA.presetFocus', name: 'Param_Org_kPresetFocus', block: 4, bit: 44, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 220' },
    { key: 'organPresetIA.db1', name: 'Param_Preset_kDb1', block: 5, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223' },
    { key: 'organPresetIA.db1.morphWheel', name: 'Param_Preset_kDb1@Wheel', block: 5, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · Wheel morph' },
    { key: 'organPresetIA.db1.morphAfterTouch', name: 'Param_Preset_kDb1@AfterTouch', block: 5, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · AfterTouch morph' },
    { key: 'organPresetIA.db1.morphCtrlPedal', name: 'Param_Preset_kDb1@CtrlPedal', block: 5, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · CtrlPedal morph' },
    { key: 'organPresetIA.db2', name: 'Param_Preset_kDb2', block: 5, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224' },
    { key: 'organPresetIA.db2.morphWheel', name: 'Param_Preset_kDb2@Wheel', block: 5, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · Wheel morph' },
    { key: 'organPresetIA.db2.morphAfterTouch', name: 'Param_Preset_kDb2@AfterTouch', block: 5, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · AfterTouch morph' },
    { key: 'organPresetIA.db2.morphCtrlPedal', name: 'Param_Preset_kDb2@CtrlPedal', block: 5, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · CtrlPedal morph' },
    { key: 'organPresetIA.db3', name: 'Param_Preset_kDb3', block: 5, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225' },
    { key: 'organPresetIA.db3.morphWheel', name: 'Param_Preset_kDb3@Wheel', block: 5, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · Wheel morph' },
    { key: 'organPresetIA.db3.morphAfterTouch', name: 'Param_Preset_kDb3@AfterTouch', block: 5, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · AfterTouch morph' },
    { key: 'organPresetIA.db3.morphCtrlPedal', name: 'Param_Preset_kDb3@CtrlPedal', block: 5, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · CtrlPedal morph' },
    { key: 'organPresetIA.db4', name: 'Param_Preset_kDb4', block: 5, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226' },
    { key: 'organPresetIA.db4.morphWheel', name: 'Param_Preset_kDb4@Wheel', block: 5, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · Wheel morph' },
    { key: 'organPresetIA.db4.morphAfterTouch', name: 'Param_Preset_kDb4@AfterTouch', block: 5, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · AfterTouch morph' },
    { key: 'organPresetIA.db4.morphCtrlPedal', name: 'Param_Preset_kDb4@CtrlPedal', block: 5, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · CtrlPedal morph' },
    { key: 'organPresetIA.db5', name: 'Param_Preset_kDb5', block: 5, bit: 76, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227' },
    { key: 'organPresetIA.db5.morphWheel', name: 'Param_Preset_kDb5@Wheel', block: 5, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · Wheel morph' },
    { key: 'organPresetIA.db5.morphAfterTouch', name: 'Param_Preset_kDb5@AfterTouch', block: 5, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · AfterTouch morph' },
    { key: 'organPresetIA.db5.morphCtrlPedal', name: 'Param_Preset_kDb5@CtrlPedal', block: 5, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · CtrlPedal morph' },
    { key: 'organPresetIA.db6', name: 'Param_Preset_kDb6', block: 5, bit: 95, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228' },
    { key: 'organPresetIA.db6.morphWheel', name: 'Param_Preset_kDb6@Wheel', block: 5, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · Wheel morph' },
    { key: 'organPresetIA.db6.morphAfterTouch', name: 'Param_Preset_kDb6@AfterTouch', block: 5, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · AfterTouch morph' },
    { key: 'organPresetIA.db6.morphCtrlPedal', name: 'Param_Preset_kDb6@CtrlPedal', block: 5, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · CtrlPedal morph' },
    { key: 'organPresetIA.db7', name: 'Param_Preset_kDb7', block: 5, bit: 114, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229' },
    { key: 'organPresetIA.db7.morphWheel', name: 'Param_Preset_kDb7@Wheel', block: 5, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · Wheel morph' },
    { key: 'organPresetIA.db7.morphAfterTouch', name: 'Param_Preset_kDb7@AfterTouch', block: 5, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · AfterTouch morph' },
    { key: 'organPresetIA.db7.morphCtrlPedal', name: 'Param_Preset_kDb7@CtrlPedal', block: 5, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · CtrlPedal morph' },
    { key: 'organPresetIA.db8', name: 'Param_Preset_kDb8', block: 5, bit: 133, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230' },
    { key: 'organPresetIA.db8.morphWheel', name: 'Param_Preset_kDb8@Wheel', block: 5, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · Wheel morph' },
    { key: 'organPresetIA.db8.morphAfterTouch', name: 'Param_Preset_kDb8@AfterTouch', block: 5, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · AfterTouch morph' },
    { key: 'organPresetIA.db8.morphCtrlPedal', name: 'Param_Preset_kDb8@CtrlPedal', block: 5, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · CtrlPedal morph' },
    { key: 'organPresetIA.db9', name: 'Param_Preset_kDb9', block: 5, bit: 152, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231' },
    { key: 'organPresetIA.db9.morphWheel', name: 'Param_Preset_kDb9@Wheel', block: 5, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · Wheel morph' },
    { key: 'organPresetIA.db9.morphAfterTouch', name: 'Param_Preset_kDb9@AfterTouch', block: 5, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · AfterTouch morph' },
    { key: 'organPresetIA.db9.morphCtrlPedal', name: 'Param_Preset_kDb9@CtrlPedal', block: 5, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · CtrlPedal morph' },
    { key: 'organPresetIA.vibratoEnable', name: 'Param_Preset_kVibratoEnable', block: 5, bit: 171, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 222' },
    { key: 'organPresetIA.b3PercEnable', name: 'Param_Preset_kB3PercEnable', block: 5, bit: 172, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 221' },
    { key: 'organPresetIA.b3PercHarmonic', name: 'Param_Preset_kB3PercHarmonic', block: 5, bit: 173, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 232' },
    { key: 'organPresetIA.b3PercSpeed', name: 'Param_Preset_kB3PercSpeed', block: 5, bit: 174, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 233' },
    { key: 'organPresetIA.b3PercLevel', name: 'Param_Preset_kB3PercLevel', block: 5, bit: 175, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 234' },
    { key: 'organPresetIIA.db1', name: 'Param_Preset_kDb1', block: 6, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223' },
    { key: 'organPresetIIA.db1.morphWheel', name: 'Param_Preset_kDb1@Wheel', block: 6, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · Wheel morph' },
    { key: 'organPresetIIA.db1.morphAfterTouch', name: 'Param_Preset_kDb1@AfterTouch', block: 6, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · AfterTouch morph' },
    { key: 'organPresetIIA.db1.morphCtrlPedal', name: 'Param_Preset_kDb1@CtrlPedal', block: 6, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · CtrlPedal morph' },
    { key: 'organPresetIIA.db2', name: 'Param_Preset_kDb2', block: 6, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224' },
    { key: 'organPresetIIA.db2.morphWheel', name: 'Param_Preset_kDb2@Wheel', block: 6, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · Wheel morph' },
    { key: 'organPresetIIA.db2.morphAfterTouch', name: 'Param_Preset_kDb2@AfterTouch', block: 6, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · AfterTouch morph' },
    { key: 'organPresetIIA.db2.morphCtrlPedal', name: 'Param_Preset_kDb2@CtrlPedal', block: 6, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · CtrlPedal morph' },
    { key: 'organPresetIIA.db3', name: 'Param_Preset_kDb3', block: 6, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225' },
    { key: 'organPresetIIA.db3.morphWheel', name: 'Param_Preset_kDb3@Wheel', block: 6, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · Wheel morph' },
    { key: 'organPresetIIA.db3.morphAfterTouch', name: 'Param_Preset_kDb3@AfterTouch', block: 6, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · AfterTouch morph' },
    { key: 'organPresetIIA.db3.morphCtrlPedal', name: 'Param_Preset_kDb3@CtrlPedal', block: 6, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · CtrlPedal morph' },
    { key: 'organPresetIIA.db4', name: 'Param_Preset_kDb4', block: 6, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226' },
    { key: 'organPresetIIA.db4.morphWheel', name: 'Param_Preset_kDb4@Wheel', block: 6, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · Wheel morph' },
    { key: 'organPresetIIA.db4.morphAfterTouch', name: 'Param_Preset_kDb4@AfterTouch', block: 6, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · AfterTouch morph' },
    { key: 'organPresetIIA.db4.morphCtrlPedal', name: 'Param_Preset_kDb4@CtrlPedal', block: 6, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · CtrlPedal morph' },
    { key: 'organPresetIIA.db5', name: 'Param_Preset_kDb5', block: 6, bit: 76, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227' },
    { key: 'organPresetIIA.db5.morphWheel', name: 'Param_Preset_kDb5@Wheel', block: 6, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · Wheel morph' },
    { key: 'organPresetIIA.db5.morphAfterTouch', name: 'Param_Preset_kDb5@AfterTouch', block: 6, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · AfterTouch morph' },
    { key: 'organPresetIIA.db5.morphCtrlPedal', name: 'Param_Preset_kDb5@CtrlPedal', block: 6, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · CtrlPedal morph' },
    { key: 'organPresetIIA.db6', name: 'Param_Preset_kDb6', block: 6, bit: 95, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228' },
    { key: 'organPresetIIA.db6.morphWheel', name: 'Param_Preset_kDb6@Wheel', block: 6, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · Wheel morph' },
    { key: 'organPresetIIA.db6.morphAfterTouch', name: 'Param_Preset_kDb6@AfterTouch', block: 6, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · AfterTouch morph' },
    { key: 'organPresetIIA.db6.morphCtrlPedal', name: 'Param_Preset_kDb6@CtrlPedal', block: 6, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · CtrlPedal morph' },
    { key: 'organPresetIIA.db7', name: 'Param_Preset_kDb7', block: 6, bit: 114, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229' },
    { key: 'organPresetIIA.db7.morphWheel', name: 'Param_Preset_kDb7@Wheel', block: 6, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · Wheel morph' },
    { key: 'organPresetIIA.db7.morphAfterTouch', name: 'Param_Preset_kDb7@AfterTouch', block: 6, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · AfterTouch morph' },
    { key: 'organPresetIIA.db7.morphCtrlPedal', name: 'Param_Preset_kDb7@CtrlPedal', block: 6, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · CtrlPedal morph' },
    { key: 'organPresetIIA.db8', name: 'Param_Preset_kDb8', block: 6, bit: 133, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230' },
    { key: 'organPresetIIA.db8.morphWheel', name: 'Param_Preset_kDb8@Wheel', block: 6, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · Wheel morph' },
    { key: 'organPresetIIA.db8.morphAfterTouch', name: 'Param_Preset_kDb8@AfterTouch', block: 6, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · AfterTouch morph' },
    { key: 'organPresetIIA.db8.morphCtrlPedal', name: 'Param_Preset_kDb8@CtrlPedal', block: 6, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · CtrlPedal morph' },
    { key: 'organPresetIIA.db9', name: 'Param_Preset_kDb9', block: 6, bit: 152, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231' },
    { key: 'organPresetIIA.db9.morphWheel', name: 'Param_Preset_kDb9@Wheel', block: 6, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · Wheel morph' },
    { key: 'organPresetIIA.db9.morphAfterTouch', name: 'Param_Preset_kDb9@AfterTouch', block: 6, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · AfterTouch morph' },
    { key: 'organPresetIIA.db9.morphCtrlPedal', name: 'Param_Preset_kDb9@CtrlPedal', block: 6, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · CtrlPedal morph' },
    { key: 'organPresetIIA.vibratoEnable', name: 'Param_Preset_kVibratoEnable', block: 6, bit: 171, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 222' },
    { key: 'organPresetIIA.b3PercEnable', name: 'Param_Preset_kB3PercEnable', block: 6, bit: 172, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 221' },
    { key: 'organPresetIIA.b3PercHarmonic', name: 'Param_Preset_kB3PercHarmonic', block: 6, bit: 173, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 232' },
    { key: 'organPresetIIA.b3PercSpeed', name: 'Param_Preset_kB3PercSpeed', block: 6, bit: 174, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 233' },
    { key: 'organPresetIIA.b3PercLevel', name: 'Param_Preset_kB3PercLevel', block: 6, bit: 175, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 234' },
    { key: 'externA.enable', name: 'Param_Ext_kEnable', block: 7, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 235' },
    { key: 'externA.kbZone', name: 'Param_Ext_kKbZone', block: 7, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 236' },
    { key: 'externA.octaveShift', name: 'Param_Ext_kOctaveShift', block: 7, bit: 5, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 237' },
    { key: 'externA.velCurve', name: 'Param_Ext_kVelCurve', block: 7, bit: 9, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 246' },
    { key: 'externA.midiCh', name: 'Param_Ext_kMIDICh', block: 7, bit: 11, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 240' },
    { key: 'externA.pitchStickEnable', name: 'Param_Ext_kPitchStickEnable', block: 7, bit: 16, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 238' },
    { key: 'externA.sustainEnable', name: 'Param_Ext_kSustainEnable', block: 7, bit: 17, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 239' },
    { key: 'externA.modWheelEnable', name: 'Param_Ext_kModWheelEnable', block: 7, bit: 18, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 241' },
    { key: 'externA.aftertouchEnable', name: 'Param_Ext_kAftertouchEnable', block: 7, bit: 19, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 242' },
    { key: 'externA.ctrlPedalEnable', name: 'Param_Ext_kCtrlPedalEnable', block: 7, bit: 20, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 243' },
    { key: 'externA.swellPedalEnable', name: 'Param_Ext_kSwellPedalEnable', block: 7, bit: 21, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 244' },
    { key: 'externA.paramSelect', name: 'Param_Ext_kParamSelect', block: 7, bit: 22, width: 2, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 247' },
    { key: 'externA.ccNumber', name: 'Param_Ext_kCCNumber', block: 7, bit: 24, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 248' },
    { key: 'externA.ccValue', name: 'Param_Ext_kCCValue', block: 7, bit: 31, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249' },
    { key: 'externA.ccValue.morphWheel', name: 'Param_Ext_kCCValue@Wheel', block: 7, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · Wheel morph' },
    { key: 'externA.ccValue.morphAfterTouch', name: 'Param_Ext_kCCValue@AfterTouch', block: 7, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · AfterTouch morph' },
    { key: 'externA.ccValue.morphCtrlPedal', name: 'Param_Ext_kCCValue@CtrlPedal', block: 7, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · CtrlPedal morph' },
    { key: 'externA.sendOnLoadCC', name: 'Param_Ext_kSendOnLoadCC', block: 7, bit: 62, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 250' },
    { key: 'externA.bcValue_LSB', name: 'Param_Ext_kBCValue_LSB', block: 7, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 251' },
    { key: 'externA.bcValue_MSB', name: 'Param_Ext_kBCValue_MSB', block: 7, bit: 71, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 252' },
    { key: 'externA.pcValue', name: 'Param_Ext_kPCValue', block: 7, bit: 79, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253' },
    { key: 'externA.pcValue.morphWheel', name: 'Param_Ext_kPCValue@Wheel', block: 7, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · Wheel morph' },
    { key: 'externA.pcValue.morphAfterTouch', name: 'Param_Ext_kPCValue@AfterTouch', block: 7, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · AfterTouch morph' },
    { key: 'externA.pcValue.morphCtrlPedal', name: 'Param_Ext_kPCValue@CtrlPedal', block: 7, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · CtrlPedal morph' },
    { key: 'externA.sendOnLoadPC', name: 'Param_Ext_kSendOnLoadPC', block: 7, bit: 110, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 254' },
    { key: 'externA.volValue', name: 'Param_Ext_kVolValue', block: 7, bit: 111, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255' },
    { key: 'externA.volValue.morphWheel', name: 'Param_Ext_kVolValue@Wheel', block: 7, bit: 118, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · Wheel morph' },
    { key: 'externA.volValue.morphAfterTouch', name: 'Param_Ext_kVolValue@AfterTouch', block: 7, bit: 126, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · AfterTouch morph' },
    { key: 'externA.volValue.morphCtrlPedal', name: 'Param_Ext_kVolValue@CtrlPedal', block: 7, bit: 134, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · CtrlPedal morph' },
    { key: 'externA.sendOnLoadVol', name: 'Param_Ext_kSendOnLoadVol', block: 7, bit: 142, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 256' },
    { key: 'externA.volPedalEnable', name: 'Param_Ext_kVolPedalEnable', block: 7, bit: 143, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 245' },
    { key: 'effectsA.leslieEnable', name: 'Param_Effects_kLeslieEnable', block: 8, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 257' },
    { key: 'effectsA.leslieSrc', name: 'Param_Effects_kLeslieSrc', block: 8, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 258' },
    { key: 'effectsA.fx1Enable', name: 'Param_Effects_kFx1Enable', block: 8, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 261' },
    { key: 'effectsA.fx1Src', name: 'Param_Effects_kFx1Src', block: 8, bit: 4, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 262' },
    { key: 'effectsA.fx1Type', name: 'Param_Effects_kFx1Type', block: 8, bit: 6, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 263' },
    { key: 'effectsA.fx1ClkEnable', name: 'Param_Effects_kFx1ClkEnable', block: 8, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 264' },
    { key: 'effectsA.fx1RateClkDiv', name: 'Param_Effects_kFx1RateClkDiv', block: 8, bit: 10, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265' },
    { key: 'effectsA.fx1RateClkDiv.morphWheel', name: 'Param_Effects_kFx1RateClkDiv@Wheel', block: 8, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · Wheel morph' },
    { key: 'effectsA.fx1RateClkDiv.morphAfterTouch', name: 'Param_Effects_kFx1RateClkDiv@AfterTouch', block: 8, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · AfterTouch morph' },
    { key: 'effectsA.fx1RateClkDiv.morphCtrlPedal', name: 'Param_Effects_kFx1RateClkDiv@CtrlPedal', block: 8, bit: 33, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · CtrlPedal morph' },
    { key: 'effectsA.fx1Amt', name: 'Param_Effects_kFx1Amt', block: 8, bit: 41, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266' },
    { key: 'effectsA.fx1Amt.morphWheel', name: 'Param_Effects_kFx1Amt@Wheel', block: 8, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · Wheel morph' },
    { key: 'effectsA.fx1Amt.morphAfterTouch', name: 'Param_Effects_kFx1Amt@AfterTouch', block: 8, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · AfterTouch morph' },
    { key: 'effectsA.fx1Amt.morphCtrlPedal', name: 'Param_Effects_kFx1Amt@CtrlPedal', block: 8, bit: 64, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · CtrlPedal morph' },
    { key: 'effectsA.fx2Enable', name: 'Param_Effects_kFx2Enable', block: 8, bit: 72, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 267' },
    { key: 'effectsA.fx2Src', name: 'Param_Effects_kFx2Src', block: 8, bit: 73, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 268' },
    { key: 'effectsA.fx2Type', name: 'Param_Effects_kFx2Type', block: 8, bit: 75, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 269' },
    { key: 'effectsA.fx2Rate', name: 'Param_Effects_kFx2Rate', block: 8, bit: 78, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 270' },
    { key: 'effectsA.fx2Amt', name: 'Param_Effects_kFx2Amt', block: 8, bit: 85, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271' },
    { key: 'effectsA.fx2Amt.morphWheel', name: 'Param_Effects_kFx2Amt@Wheel', block: 8, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · Wheel morph' },
    { key: 'effectsA.fx2Amt.morphAfterTouch', name: 'Param_Effects_kFx2Amt@AfterTouch', block: 8, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · AfterTouch morph' },
    { key: 'effectsA.fx2Amt.morphCtrlPedal', name: 'Param_Effects_kFx2Amt@CtrlPedal', block: 8, bit: 108, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · CtrlPedal morph' },
    { key: 'effectsA.dlyEnable', name: 'Param_Effects_kDlyEnable', block: 8, bit: 116, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 272' },
    { key: 'effectsA.dlySrc', name: 'Param_Effects_kDlySrc', block: 8, bit: 117, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 273' },
    { key: 'effectsA.dlyClkEnable', name: 'Param_Effects_kDlyClkEnable', block: 8, bit: 119, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 274' },
    { key: 'effectsA.dlyRateClkDiv', name: 'Param_Effects_kDlyRateClkDiv', block: 8, bit: 120, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275' },
    { key: 'effectsA.dlyRateClkDiv.morphWheel', name: 'Param_Effects_kDlyRateClkDiv@Wheel', block: 8, bit: 134, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · Wheel morph' },
    { key: 'effectsA.dlyRateClkDiv.morphAfterTouch', name: 'Param_Effects_kDlyRateClkDiv@AfterTouch', block: 8, bit: 149, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · AfterTouch morph' },
    { key: 'effectsA.dlyRateClkDiv.morphCtrlPedal', name: 'Param_Effects_kDlyRateClkDiv@CtrlPedal', block: 8, bit: 164, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · CtrlPedal morph' },
    { key: 'effectsA.dlyMix', name: 'Param_Effects_kDlyMix', block: 8, bit: 179, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277' },
    { key: 'effectsA.dlyMix.morphWheel', name: 'Param_Effects_kDlyMix@Wheel', block: 8, bit: 186, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · Wheel morph' },
    { key: 'effectsA.dlyMix.morphAfterTouch', name: 'Param_Effects_kDlyMix@AfterTouch', block: 8, bit: 194, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · AfterTouch morph' },
    { key: 'effectsA.dlyMix.morphCtrlPedal', name: 'Param_Effects_kDlyMix@CtrlPedal', block: 8, bit: 202, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · CtrlPedal morph' },
    { key: 'effectsA.dlyPingPong', name: 'Param_Effects_kDlyPingPong', block: 8, bit: 210, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 278' },
    { key: 'effectsA.dlyFltType', name: 'Param_Effects_kDlyFltType', block: 8, bit: 211, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 279' },
    { key: 'effectsA.dlyFeedback', name: 'Param_Effects_kDlyFeedback', block: 8, bit: 213, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280' },
    { key: 'effectsA.dlyFeedback.morphWheel', name: 'Param_Effects_kDlyFeedback@Wheel', block: 8, bit: 220, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · Wheel morph' },
    { key: 'effectsA.dlyFeedback.morphAfterTouch', name: 'Param_Effects_kDlyFeedback@AfterTouch', block: 8, bit: 228, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · AfterTouch morph' },
    { key: 'effectsA.dlyFeedback.morphCtrlPedal', name: 'Param_Effects_kDlyFeedback@CtrlPedal', block: 8, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · CtrlPedal morph' },
    { key: 'effectsA.dlyMode', name: 'Param_Effects_kDlyMode', block: 8, bit: 244, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 281' },
    { key: 'effectsA.ampEnable', name: 'Param_Effects_kAmpEnable', block: 8, bit: 245, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 282' },
    { key: 'effectsA.ampSrc', name: 'Param_Effects_kAmpSrc', block: 8, bit: 246, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 283' },
    { key: 'effectsA.ampType', name: 'Param_Effects_kAmpType', block: 8, bit: 248, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 284' },
    { key: 'effectsA.ampTreble', name: 'Param_Effects_kAmpTreble', block: 8, bit: 251, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 285' },
    { key: 'effectsA.ampMid', name: 'Param_Effects_kAmpMid', block: 8, bit: 258, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 286' },
    { key: 'effectsA.ampBass', name: 'Param_Effects_kAmpBass', block: 8, bit: 265, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 287' },
    { key: 'effectsA.ampMidFreq', name: 'Param_Effects_kAmpMidFreq', block: 8, bit: 272, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288' },
    { key: 'effectsA.ampMidFreq.morphWheel', name: 'Param_Effects_kAmpMidFreq@Wheel', block: 8, bit: 279, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · Wheel morph' },
    { key: 'effectsA.ampMidFreq.morphAfterTouch', name: 'Param_Effects_kAmpMidFreq@AfterTouch', block: 8, bit: 287, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · AfterTouch morph' },
    { key: 'effectsA.ampMidFreq.morphCtrlPedal', name: 'Param_Effects_kAmpMidFreq@CtrlPedal', block: 8, bit: 295, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · CtrlPedal morph' },
    { key: 'effectsA.ampDrive', name: 'Param_Effects_kAmpDrive', block: 8, bit: 303, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289' },
    { key: 'effectsA.ampDrive.morphWheel', name: 'Param_Effects_kAmpDrive@Wheel', block: 8, bit: 310, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · Wheel morph' },
    { key: 'effectsA.ampDrive.morphAfterTouch', name: 'Param_Effects_kAmpDrive@AfterTouch', block: 8, bit: 318, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · AfterTouch morph' },
    { key: 'effectsA.ampDrive.morphCtrlPedal', name: 'Param_Effects_kAmpDrive@CtrlPedal', block: 8, bit: 326, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · CtrlPedal morph' },
    { key: 'effectsA.rvbEnable', name: 'Param_Effects_kRvbEnable', block: 8, bit: 334, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 290' },
    { key: 'effectsA.rvbType', name: 'Param_Effects_kRvbType', block: 8, bit: 335, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 291' },
    { key: 'effectsA.rvbBright', name: 'Param_Effects_kRvbBright', block: 8, bit: 338, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 292' },
    { key: 'effectsA.rvbAmt', name: 'Param_Effects_kRvbAmt', block: 8, bit: 339, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293' },
    { key: 'effectsA.rvbAmt.morphWheel', name: 'Param_Effects_kRvbAmt@Wheel', block: 8, bit: 346, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · Wheel morph' },
    { key: 'effectsA.rvbAmt.morphAfterTouch', name: 'Param_Effects_kRvbAmt@AfterTouch', block: 8, bit: 354, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · AfterTouch morph' },
    { key: 'effectsA.rvbAmt.morphCtrlPedal', name: 'Param_Effects_kRvbAmt@CtrlPedal', block: 8, bit: 362, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · CtrlPedal morph' },
    { key: 'effectsA.cmpEnable', name: 'Param_Effects_kCmpEnable', block: 8, bit: 370, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 294' },
    { key: 'effectsA.cmpAmt', name: 'Param_Effects_kCmpAmt', block: 8, bit: 371, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 295' },
    { key: 'effectsA.cmpResponse', name: 'Param_Effects_kCmpResponse', block: 8, bit: 378, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 296' },
    { key: 'mixerA.audioRouteProg', name: 'Param_Com_kAudioRouteProg', block: 9, bit: 0, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 136' },
    { key: 'mixerA.audioRouteProgSub', name: 'Param_Com_kAudioRouteProgSub', block: 9, bit: 3, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 137' },
    { key: 'mixerA.audioRouteProgSubDest', name: 'Param_Com_kAudioRouteProgSubDest', block: 9, bit: 5, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 138' },
    { key: 'pianoB.enable', name: 'Param_Pno_kEnable', block: 10, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 196' },
    { key: 'pianoB.kbZone', name: 'Param_Pno_kKbZone', block: 10, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 197' },
    { key: 'pianoB.level', name: 'Param_Pno_kLevel', block: 10, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198' },
    { key: 'pianoB.level.morphWheel', name: 'Param_Pno_kLevel@Wheel', block: 10, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · Wheel morph' },
    { key: 'pianoB.level.morphAfterTouch', name: 'Param_Pno_kLevel@AfterTouch', block: 10, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · AfterTouch morph' },
    { key: 'pianoB.level.morphCtrlPedal', name: 'Param_Pno_kLevel@CtrlPedal', block: 10, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 198 · CtrlPedal morph' },
    { key: 'pianoB.octaveShift', name: 'Param_Pno_kOctaveShift', block: 10, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 199' },
    { key: 'pianoB.pitchStickEnable', name: 'Param_Pno_kPitchStickEnable', block: 10, bit: 40, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 200' },
    { key: 'pianoB.sustainEnable', name: 'Param_Pno_kSustainEnable', block: 10, bit: 41, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 201' },
    { key: 'pianoB.bank', name: 'Param_Pno_kBank', block: 10, bit: 42, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 203' },
    { key: 'pianoB.entry', name: 'Param_Pno_kEntry', block: 10, bit: 45, width: 5, min: 0, max: 19, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 204' },
    { key: 'pianoB.variation', name: 'Param_Pno_kVariation', block: 10, bit: 50, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 205' },
    { key: 'pianoB.nameHash', name: 'Param_Pno_kNameHash_Private', block: 10, bit: 52, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 206' },
    { key: 'pianoB.acoustic', name: 'Param_Pno_kAcoustic', block: 10, bit: 84, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 207' },
    { key: 'pianoB.pedalNoise', name: 'Param_Pno_kPedalNoise', block: 10, bit: 86, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 208' },
    { key: 'pianoB.kbdTouch', name: 'Param_Pno_kKbdTouch', block: 10, bit: 87, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 209' },
    { key: 'pianoB.eq', name: 'Param_Pno_kEq', block: 10, bit: 89, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 211' },
    { key: 'synthCommonB.enable', name: 'Param_Syn_kEnable', block: 11, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 139' },
    { key: 'synthCommonB.kbZone', name: 'Param_Syn_kKbZone', block: 11, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 140' },
    { key: 'synthCommonB.level', name: 'Param_Syn_kLevel', block: 11, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141' },
    { key: 'synthCommonB.level.morphWheel', name: 'Param_Syn_kLevel@Wheel', block: 11, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · Wheel morph' },
    { key: 'synthCommonB.level.morphAfterTouch', name: 'Param_Syn_kLevel@AfterTouch', block: 11, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · AfterTouch morph' },
    { key: 'synthCommonB.level.morphCtrlPedal', name: 'Param_Syn_kLevel@CtrlPedal', block: 11, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 141 · CtrlPedal morph' },
    { key: 'synthCommonB.octaveShift', name: 'Param_Syn_kOctaveShift', block: 11, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 142' },
    { key: 'synthCommonB.pitchStickEnable', name: 'Param_Syn_kPitchStickEnable', block: 11, bit: 40, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 143' },
    { key: 'synthCommonB.sustainEnable', name: 'Param_Syn_kSustainEnable', block: 11, bit: 41, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 144' },
    { key: 'synthCommonB.presetPos', name: 'Param_Syn_kPresetPos', block: 11, bit: 42, width: 10, min: 0, max: 799, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 145' },
    { key: 'synthCommonB.name1', name: 'Param_Syn_kName1_Private', block: 11, bit: 52, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 146' },
    { key: 'synthCommonB.name2', name: 'Param_Syn_kName2_Private', block: 11, bit: 84, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 147' },
    { key: 'synthCommonB.name3', name: 'Param_Syn_kName3_Private', block: 11, bit: 116, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 148' },
    { key: 'synthCommonB.name4', name: 'Param_Syn_kName4_Private', block: 11, bit: 148, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 149' },
    { key: 'synthCommonB.name5', name: 'Param_Syn_kName5_Private', block: 11, bit: 180, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 150' },
    { key: 'synthCommonB.name6', name: 'Param_Syn_kName6_Private', block: 11, bit: 212, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 151' },
    { key: 'synthCommonB.name7', name: 'Param_Syn_kName7_Private', block: 11, bit: 244, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 152' },
    { key: 'synthCommonB.name8', name: 'Param_Syn_kName8_Private', block: 11, bit: 276, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'medium', src: 'Stage 3 OS 2.64 registry · id 153' },
    { key: 'synthCommonB.presetNameHash', name: 'Param_Syn_kPresetNameHash_Private', block: 11, bit: 308, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 154' },
    { key: 'synthB.kbdHold', name: 'Param_Syn_kKbdHold', block: 12, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 158' },
    { key: 'synthB.arpRun', name: 'Param_Syn_kArpRun', block: 12, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 159' },
    { key: 'synthB.arpKbdSync', name: 'Param_Syn_kArpKbdSync', block: 12, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 160' },
    { key: 'synthB.arpRange', name: 'Param_Syn_kArpRange', block: 12, bit: 3, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 161' },
    { key: 'synthB.arpPattern', name: 'Param_Syn_kArpPattern', block: 12, bit: 5, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 162' },
    { key: 'synthB.arpClkEnable', name: 'Param_Syn_kArpClkEnable', block: 12, bit: 7, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 163' },
    { key: 'synthB.arpRateClkDiv', name: 'Param_Syn_kArpRateClkDiv', block: 12, bit: 8, width: 7, min: 0, max: 127, def: 54, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164' },
    { key: 'synthB.arpRateClkDiv.morphWheel', name: 'Param_Syn_kArpRateClkDiv@Wheel', block: 12, bit: 15, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · Wheel morph' },
    { key: 'synthB.arpRateClkDiv.morphAfterTouch', name: 'Param_Syn_kArpRateClkDiv@AfterTouch', block: 12, bit: 23, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · AfterTouch morph' },
    { key: 'synthB.arpRateClkDiv.morphCtrlPedal', name: 'Param_Syn_kArpRateClkDiv@CtrlPedal', block: 12, bit: 31, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 164 · CtrlPedal morph' },
    { key: 'synthB.voiceMode', name: 'Param_Syn_kVoiceMode', block: 12, bit: 39, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 165' },
    { key: 'synthB.glideRate', name: 'Param_Syn_kGlideRate', block: 12, bit: 41, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 166' },
    { key: 'synthB.unison', name: 'Param_Syn_kUnison', block: 12, bit: 48, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 167' },
    { key: 'synthB.vibratoMode', name: 'Param_Syn_kVibratoMode', block: 12, bit: 50, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 168' },
    { key: 'synthB.lfoWave', name: 'Param_Syn_kLFOWave', block: 12, bit: 53, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 169' },
    { key: 'synthB.lfoClkEnable', name: 'Param_Syn_kLFOClkEnable', block: 12, bit: 56, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 170' },
    { key: 'synthB.lfoRateClkDiv', name: 'Param_Syn_kLFORateClkDiv', block: 12, bit: 57, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171' },
    { key: 'synthB.lfoRateClkDiv.morphWheel', name: 'Param_Syn_kLFORateClkDiv@Wheel', block: 12, bit: 64, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · Wheel morph' },
    { key: 'synthB.lfoRateClkDiv.morphAfterTouch', name: 'Param_Syn_kLFORateClkDiv@AfterTouch', block: 12, bit: 72, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · AfterTouch morph' },
    { key: 'synthB.lfoRateClkDiv.morphCtrlPedal', name: 'Param_Syn_kLFORateClkDiv@CtrlPedal', block: 12, bit: 80, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 171 · CtrlPedal morph' },
    { key: 'synthB.modEnvAtc', name: 'Param_Syn_kModEnvAtc', block: 12, bit: 88, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 172' },
    { key: 'synthB.modEnvDcy', name: 'Param_Syn_kModEnvDcy', block: 12, bit: 95, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 173' },
    { key: 'synthB.modEnvRls', name: 'Param_Syn_kModEnvRls', block: 12, bit: 102, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 174' },
    { key: 'synthB.modEnvVel', name: 'Param_Syn_kModEnvVel', block: 12, bit: 109, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 175' },
    { key: 'synthB.oscBank', name: 'Edt_Syn_kOscBank', block: 12, bit: 110, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 195' },
    { key: 'synthB.oscWave', name: 'Edt_Syn_kOscWave', block: 12, bit: 113, width: 9, min: 0, max: 399, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 176' },
    { key: 'synthB.oscConf', name: 'Edt_Syn_kOscConf', block: 12, bit: 122, width: 5, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 177' },
    { key: 'synthB.dualOscDetune', name: 'Edt_Syn_kDualOscDetune', block: 12, bit: 127, width: 6, min: 0, max: 60, def: 12, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 179' },
    { key: 'synthB.oscCtrl', name: 'Edt_Syn_kOscCtrl', block: 12, bit: 133, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178' },
    { key: 'synthB.oscCtrl.morphWheel', name: 'Edt_Syn_kOscCtrl@Wheel', block: 12, bit: 140, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · Wheel morph' },
    { key: 'synthB.oscCtrl.morphAfterTouch', name: 'Edt_Syn_kOscCtrl@AfterTouch', block: 12, bit: 148, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · AfterTouch morph' },
    { key: 'synthB.oscCtrl.morphCtrlPedal', name: 'Edt_Syn_kOscCtrl@CtrlPedal', block: 12, bit: 156, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 178 · CtrlPedal morph' },
    { key: 'synthB.oscMod', name: 'Param_Syn_kOscMod', block: 12, bit: 164, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180' },
    { key: 'synthB.oscMod.morphWheel', name: 'Param_Syn_kOscMod@Wheel', block: 12, bit: 171, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · Wheel morph' },
    { key: 'synthB.oscMod.morphAfterTouch', name: 'Param_Syn_kOscMod@AfterTouch', block: 12, bit: 179, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · AfterTouch morph' },
    { key: 'synthB.oscMod.morphCtrlPedal', name: 'Param_Syn_kOscMod@CtrlPedal', block: 12, bit: 187, width: 8, min: -120, max: 120, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 180 · CtrlPedal morph' },
    { key: 'synthB.fltType', name: 'Param_Syn_kFltType', block: 12, bit: 195, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 181' },
    { key: 'synthB.fltFreq', name: 'Param_Syn_kFltFreq', block: 12, bit: 198, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182' },
    { key: 'synthB.fltFreq.morphWheel', name: 'Param_Syn_kFltFreq@Wheel', block: 12, bit: 205, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · Wheel morph' },
    { key: 'synthB.fltFreq.morphAfterTouch', name: 'Param_Syn_kFltFreq@AfterTouch', block: 12, bit: 213, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · AfterTouch morph' },
    { key: 'synthB.fltFreq.morphCtrlPedal', name: 'Param_Syn_kFltFreq@CtrlPedal', block: 12, bit: 221, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 182 · CtrlPedal morph' },
    { key: 'synthB.fltRes', name: 'Param_Syn_kFltRes', block: 12, bit: 229, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183' },
    { key: 'synthB.fltRes.morphWheel', name: 'Param_Syn_kFltRes@Wheel', block: 12, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · Wheel morph' },
    { key: 'synthB.fltRes.morphAfterTouch', name: 'Param_Syn_kFltRes@AfterTouch', block: 12, bit: 244, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · AfterTouch morph' },
    { key: 'synthB.fltRes.morphCtrlPedal', name: 'Param_Syn_kFltRes@CtrlPedal', block: 12, bit: 252, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 183 · CtrlPedal morph' },
    { key: 'synthB.fltLFOAmt', name: 'Param_Syn_kFltLFOAmt', block: 12, bit: 260, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184' },
    { key: 'synthB.fltLFOAmt.morphWheel', name: 'Param_Syn_kFltLFOAmt@Wheel', block: 12, bit: 267, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · Wheel morph' },
    { key: 'synthB.fltLFOAmt.morphAfterTouch', name: 'Param_Syn_kFltLFOAmt@AfterTouch', block: 12, bit: 275, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · AfterTouch morph' },
    { key: 'synthB.fltLFOAmt.morphCtrlPedal', name: 'Param_Syn_kFltLFOAmt@CtrlPedal', block: 12, bit: 283, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 184 · CtrlPedal morph' },
    { key: 'synthB.fltMod', name: 'Param_Syn_kFltMod', block: 12, bit: 291, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 185' },
    { key: 'synthB.fltKbdTrk', name: 'Param_Syn_kFltKbdTrk', block: 12, bit: 298, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 187' },
    { key: 'synthB.fltDrive', name: 'Param_Syn_kFltDrive', block: 12, bit: 300, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 186' },
    { key: 'synthB.ampEnvAtc', name: 'Param_Syn_kAmpEnvAtc', block: 12, bit: 302, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 188' },
    { key: 'synthB.ampEnvDcy', name: 'Param_Syn_kAmpEnvDcy', block: 12, bit: 309, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 189' },
    { key: 'synthB.ampEnvRls', name: 'Param_Syn_kAmpEnvRls', block: 12, bit: 316, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 190' },
    { key: 'synthB.ampEnvVel', name: 'Param_Syn_kAmpEnvVel', block: 12, bit: 323, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 191' },
    { key: 'synthB.smpNameHash', name: 'Param_Syn_kSmpNameHash_Private', block: 12, bit: 325, width: 32, min: -2147483647, max: 2147483647, def: 0, enc: 'raw', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 194' },
    { key: 'synthB.smpFastAtk', name: 'Edt_Syn_kSmpFastAtk', block: 12, bit: 357, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 192' },
    { key: 'organB.enable', name: 'Param_Org_kEnable', block: 13, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 212' },
    { key: 'organB.kbZone', name: 'Param_Org_kKbZone', block: 13, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 213' },
    { key: 'organB.level', name: 'Param_Org_kLevel', block: 13, bit: 5, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214' },
    { key: 'organB.level.morphWheel', name: 'Param_Org_kLevel@Wheel', block: 13, bit: 12, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · Wheel morph' },
    { key: 'organB.level.morphAfterTouch', name: 'Param_Org_kLevel@AfterTouch', block: 13, bit: 20, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · AfterTouch morph' },
    { key: 'organB.level.morphCtrlPedal', name: 'Param_Org_kLevel@CtrlPedal', block: 13, bit: 28, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 214 · CtrlPedal morph' },
    { key: 'organB.octaveShift', name: 'Param_Org_kOctaveShift', block: 13, bit: 36, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 215' },
    { key: 'organB.sustainEnable', name: 'Param_Org_kSustainEnable', block: 13, bit: 40, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 217' },
    { key: 'organB.model', name: 'Param_Org_kModel', block: 13, bit: 41, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 218' },
    { key: 'organB.presetFocus', name: 'Param_Org_kPresetFocus', block: 13, bit: 44, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 220' },
    { key: 'organPresetIB.db1', name: 'Param_Preset_kDb1', block: 14, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223' },
    { key: 'organPresetIB.db1.morphWheel', name: 'Param_Preset_kDb1@Wheel', block: 14, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · Wheel morph' },
    { key: 'organPresetIB.db1.morphAfterTouch', name: 'Param_Preset_kDb1@AfterTouch', block: 14, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · AfterTouch morph' },
    { key: 'organPresetIB.db1.morphCtrlPedal', name: 'Param_Preset_kDb1@CtrlPedal', block: 14, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · CtrlPedal morph' },
    { key: 'organPresetIB.db2', name: 'Param_Preset_kDb2', block: 14, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224' },
    { key: 'organPresetIB.db2.morphWheel', name: 'Param_Preset_kDb2@Wheel', block: 14, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · Wheel morph' },
    { key: 'organPresetIB.db2.morphAfterTouch', name: 'Param_Preset_kDb2@AfterTouch', block: 14, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · AfterTouch morph' },
    { key: 'organPresetIB.db2.morphCtrlPedal', name: 'Param_Preset_kDb2@CtrlPedal', block: 14, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · CtrlPedal morph' },
    { key: 'organPresetIB.db3', name: 'Param_Preset_kDb3', block: 14, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225' },
    { key: 'organPresetIB.db3.morphWheel', name: 'Param_Preset_kDb3@Wheel', block: 14, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · Wheel morph' },
    { key: 'organPresetIB.db3.morphAfterTouch', name: 'Param_Preset_kDb3@AfterTouch', block: 14, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · AfterTouch morph' },
    { key: 'organPresetIB.db3.morphCtrlPedal', name: 'Param_Preset_kDb3@CtrlPedal', block: 14, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · CtrlPedal morph' },
    { key: 'organPresetIB.db4', name: 'Param_Preset_kDb4', block: 14, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226' },
    { key: 'organPresetIB.db4.morphWheel', name: 'Param_Preset_kDb4@Wheel', block: 14, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · Wheel morph' },
    { key: 'organPresetIB.db4.morphAfterTouch', name: 'Param_Preset_kDb4@AfterTouch', block: 14, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · AfterTouch morph' },
    { key: 'organPresetIB.db4.morphCtrlPedal', name: 'Param_Preset_kDb4@CtrlPedal', block: 14, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · CtrlPedal morph' },
    { key: 'organPresetIB.db5', name: 'Param_Preset_kDb5', block: 14, bit: 76, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227' },
    { key: 'organPresetIB.db5.morphWheel', name: 'Param_Preset_kDb5@Wheel', block: 14, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · Wheel morph' },
    { key: 'organPresetIB.db5.morphAfterTouch', name: 'Param_Preset_kDb5@AfterTouch', block: 14, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · AfterTouch morph' },
    { key: 'organPresetIB.db5.morphCtrlPedal', name: 'Param_Preset_kDb5@CtrlPedal', block: 14, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · CtrlPedal morph' },
    { key: 'organPresetIB.db6', name: 'Param_Preset_kDb6', block: 14, bit: 95, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228' },
    { key: 'organPresetIB.db6.morphWheel', name: 'Param_Preset_kDb6@Wheel', block: 14, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · Wheel morph' },
    { key: 'organPresetIB.db6.morphAfterTouch', name: 'Param_Preset_kDb6@AfterTouch', block: 14, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · AfterTouch morph' },
    { key: 'organPresetIB.db6.morphCtrlPedal', name: 'Param_Preset_kDb6@CtrlPedal', block: 14, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · CtrlPedal morph' },
    { key: 'organPresetIB.db7', name: 'Param_Preset_kDb7', block: 14, bit: 114, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229' },
    { key: 'organPresetIB.db7.morphWheel', name: 'Param_Preset_kDb7@Wheel', block: 14, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · Wheel morph' },
    { key: 'organPresetIB.db7.morphAfterTouch', name: 'Param_Preset_kDb7@AfterTouch', block: 14, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · AfterTouch morph' },
    { key: 'organPresetIB.db7.morphCtrlPedal', name: 'Param_Preset_kDb7@CtrlPedal', block: 14, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · CtrlPedal morph' },
    { key: 'organPresetIB.db8', name: 'Param_Preset_kDb8', block: 14, bit: 133, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230' },
    { key: 'organPresetIB.db8.morphWheel', name: 'Param_Preset_kDb8@Wheel', block: 14, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · Wheel morph' },
    { key: 'organPresetIB.db8.morphAfterTouch', name: 'Param_Preset_kDb8@AfterTouch', block: 14, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · AfterTouch morph' },
    { key: 'organPresetIB.db8.morphCtrlPedal', name: 'Param_Preset_kDb8@CtrlPedal', block: 14, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · CtrlPedal morph' },
    { key: 'organPresetIB.db9', name: 'Param_Preset_kDb9', block: 14, bit: 152, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231' },
    { key: 'organPresetIB.db9.morphWheel', name: 'Param_Preset_kDb9@Wheel', block: 14, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · Wheel morph' },
    { key: 'organPresetIB.db9.morphAfterTouch', name: 'Param_Preset_kDb9@AfterTouch', block: 14, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · AfterTouch morph' },
    { key: 'organPresetIB.db9.morphCtrlPedal', name: 'Param_Preset_kDb9@CtrlPedal', block: 14, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · CtrlPedal morph' },
    { key: 'organPresetIB.vibratoEnable', name: 'Param_Preset_kVibratoEnable', block: 14, bit: 171, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 222' },
    { key: 'organPresetIB.b3PercEnable', name: 'Param_Preset_kB3PercEnable', block: 14, bit: 172, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 221' },
    { key: 'organPresetIB.b3PercHarmonic', name: 'Param_Preset_kB3PercHarmonic', block: 14, bit: 173, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 232' },
    { key: 'organPresetIB.b3PercSpeed', name: 'Param_Preset_kB3PercSpeed', block: 14, bit: 174, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 233' },
    { key: 'organPresetIB.b3PercLevel', name: 'Param_Preset_kB3PercLevel', block: 14, bit: 175, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 234' },
    { key: 'organPresetIIB.db1', name: 'Param_Preset_kDb1', block: 15, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223' },
    { key: 'organPresetIIB.db1.morphWheel', name: 'Param_Preset_kDb1@Wheel', block: 15, bit: 4, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · Wheel morph' },
    { key: 'organPresetIIB.db1.morphAfterTouch', name: 'Param_Preset_kDb1@AfterTouch', block: 15, bit: 9, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · AfterTouch morph' },
    { key: 'organPresetIIB.db1.morphCtrlPedal', name: 'Param_Preset_kDb1@CtrlPedal', block: 15, bit: 14, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 223 · CtrlPedal morph' },
    { key: 'organPresetIIB.db2', name: 'Param_Preset_kDb2', block: 15, bit: 19, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224' },
    { key: 'organPresetIIB.db2.morphWheel', name: 'Param_Preset_kDb2@Wheel', block: 15, bit: 23, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · Wheel morph' },
    { key: 'organPresetIIB.db2.morphAfterTouch', name: 'Param_Preset_kDb2@AfterTouch', block: 15, bit: 28, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · AfterTouch morph' },
    { key: 'organPresetIIB.db2.morphCtrlPedal', name: 'Param_Preset_kDb2@CtrlPedal', block: 15, bit: 33, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 224 · CtrlPedal morph' },
    { key: 'organPresetIIB.db3', name: 'Param_Preset_kDb3', block: 15, bit: 38, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225' },
    { key: 'organPresetIIB.db3.morphWheel', name: 'Param_Preset_kDb3@Wheel', block: 15, bit: 42, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · Wheel morph' },
    { key: 'organPresetIIB.db3.morphAfterTouch', name: 'Param_Preset_kDb3@AfterTouch', block: 15, bit: 47, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · AfterTouch morph' },
    { key: 'organPresetIIB.db3.morphCtrlPedal', name: 'Param_Preset_kDb3@CtrlPedal', block: 15, bit: 52, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 225 · CtrlPedal morph' },
    { key: 'organPresetIIB.db4', name: 'Param_Preset_kDb4', block: 15, bit: 57, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226' },
    { key: 'organPresetIIB.db4.morphWheel', name: 'Param_Preset_kDb4@Wheel', block: 15, bit: 61, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · Wheel morph' },
    { key: 'organPresetIIB.db4.morphAfterTouch', name: 'Param_Preset_kDb4@AfterTouch', block: 15, bit: 66, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · AfterTouch morph' },
    { key: 'organPresetIIB.db4.morphCtrlPedal', name: 'Param_Preset_kDb4@CtrlPedal', block: 15, bit: 71, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 226 · CtrlPedal morph' },
    { key: 'organPresetIIB.db5', name: 'Param_Preset_kDb5', block: 15, bit: 76, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227' },
    { key: 'organPresetIIB.db5.morphWheel', name: 'Param_Preset_kDb5@Wheel', block: 15, bit: 80, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · Wheel morph' },
    { key: 'organPresetIIB.db5.morphAfterTouch', name: 'Param_Preset_kDb5@AfterTouch', block: 15, bit: 85, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · AfterTouch morph' },
    { key: 'organPresetIIB.db5.morphCtrlPedal', name: 'Param_Preset_kDb5@CtrlPedal', block: 15, bit: 90, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 227 · CtrlPedal morph' },
    { key: 'organPresetIIB.db6', name: 'Param_Preset_kDb6', block: 15, bit: 95, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228' },
    { key: 'organPresetIIB.db6.morphWheel', name: 'Param_Preset_kDb6@Wheel', block: 15, bit: 99, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · Wheel morph' },
    { key: 'organPresetIIB.db6.morphAfterTouch', name: 'Param_Preset_kDb6@AfterTouch', block: 15, bit: 104, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · AfterTouch morph' },
    { key: 'organPresetIIB.db6.morphCtrlPedal', name: 'Param_Preset_kDb6@CtrlPedal', block: 15, bit: 109, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 228 · CtrlPedal morph' },
    { key: 'organPresetIIB.db7', name: 'Param_Preset_kDb7', block: 15, bit: 114, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229' },
    { key: 'organPresetIIB.db7.morphWheel', name: 'Param_Preset_kDb7@Wheel', block: 15, bit: 118, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · Wheel morph' },
    { key: 'organPresetIIB.db7.morphAfterTouch', name: 'Param_Preset_kDb7@AfterTouch', block: 15, bit: 123, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · AfterTouch morph' },
    { key: 'organPresetIIB.db7.morphCtrlPedal', name: 'Param_Preset_kDb7@CtrlPedal', block: 15, bit: 128, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 229 · CtrlPedal morph' },
    { key: 'organPresetIIB.db8', name: 'Param_Preset_kDb8', block: 15, bit: 133, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230' },
    { key: 'organPresetIIB.db8.morphWheel', name: 'Param_Preset_kDb8@Wheel', block: 15, bit: 137, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · Wheel morph' },
    { key: 'organPresetIIB.db8.morphAfterTouch', name: 'Param_Preset_kDb8@AfterTouch', block: 15, bit: 142, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · AfterTouch morph' },
    { key: 'organPresetIIB.db8.morphCtrlPedal', name: 'Param_Preset_kDb8@CtrlPedal', block: 15, bit: 147, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 230 · CtrlPedal morph' },
    { key: 'organPresetIIB.db9', name: 'Param_Preset_kDb9', block: 15, bit: 152, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231' },
    { key: 'organPresetIIB.db9.morphWheel', name: 'Param_Preset_kDb9@Wheel', block: 15, bit: 156, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · Wheel morph' },
    { key: 'organPresetIIB.db9.morphAfterTouch', name: 'Param_Preset_kDb9@AfterTouch', block: 15, bit: 161, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · AfterTouch morph' },
    { key: 'organPresetIIB.db9.morphCtrlPedal', name: 'Param_Preset_kDb9@CtrlPedal', block: 15, bit: 166, width: 5, min: -8, max: 8, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 231 · CtrlPedal morph' },
    { key: 'organPresetIIB.vibratoEnable', name: 'Param_Preset_kVibratoEnable', block: 15, bit: 171, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 222' },
    { key: 'organPresetIIB.b3PercEnable', name: 'Param_Preset_kB3PercEnable', block: 15, bit: 172, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 221' },
    { key: 'organPresetIIB.b3PercHarmonic', name: 'Param_Preset_kB3PercHarmonic', block: 15, bit: 173, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 232' },
    { key: 'organPresetIIB.b3PercSpeed', name: 'Param_Preset_kB3PercSpeed', block: 15, bit: 174, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 233' },
    { key: 'organPresetIIB.b3PercLevel', name: 'Param_Preset_kB3PercLevel', block: 15, bit: 175, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 234' },
    { key: 'externB.enable', name: 'Param_Ext_kEnable', block: 16, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 235' },
    { key: 'externB.kbZone', name: 'Param_Ext_kKbZone', block: 16, bit: 1, width: 4, min: 0, max: 10, def: 9, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 236' },
    { key: 'externB.octaveShift', name: 'Param_Ext_kOctaveShift', block: 16, bit: 5, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 237' },
    { key: 'externB.velCurve', name: 'Param_Ext_kVelCurve', block: 16, bit: 9, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 246' },
    { key: 'externB.midiCh', name: 'Param_Ext_kMIDICh', block: 16, bit: 11, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 240' },
    { key: 'externB.pitchStickEnable', name: 'Param_Ext_kPitchStickEnable', block: 16, bit: 16, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 238' },
    { key: 'externB.sustainEnable', name: 'Param_Ext_kSustainEnable', block: 16, bit: 17, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 239' },
    { key: 'externB.modWheelEnable', name: 'Param_Ext_kModWheelEnable', block: 16, bit: 18, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 241' },
    { key: 'externB.aftertouchEnable', name: 'Param_Ext_kAftertouchEnable', block: 16, bit: 19, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 242' },
    { key: 'externB.ctrlPedalEnable', name: 'Param_Ext_kCtrlPedalEnable', block: 16, bit: 20, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 243' },
    { key: 'externB.swellPedalEnable', name: 'Param_Ext_kSwellPedalEnable', block: 16, bit: 21, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 244' },
    { key: 'externB.paramSelect', name: 'Param_Ext_kParamSelect', block: 16, bit: 22, width: 2, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 247' },
    { key: 'externB.ccNumber', name: 'Param_Ext_kCCNumber', block: 16, bit: 24, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 248' },
    { key: 'externB.ccValue', name: 'Param_Ext_kCCValue', block: 16, bit: 31, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249' },
    { key: 'externB.ccValue.morphWheel', name: 'Param_Ext_kCCValue@Wheel', block: 16, bit: 38, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · Wheel morph' },
    { key: 'externB.ccValue.morphAfterTouch', name: 'Param_Ext_kCCValue@AfterTouch', block: 16, bit: 46, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · AfterTouch morph' },
    { key: 'externB.ccValue.morphCtrlPedal', name: 'Param_Ext_kCCValue@CtrlPedal', block: 16, bit: 54, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 249 · CtrlPedal morph' },
    { key: 'externB.sendOnLoadCC', name: 'Param_Ext_kSendOnLoadCC', block: 16, bit: 62, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 250' },
    { key: 'externB.bcValue_LSB', name: 'Param_Ext_kBCValue_LSB', block: 16, bit: 63, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 251' },
    { key: 'externB.bcValue_MSB', name: 'Param_Ext_kBCValue_MSB', block: 16, bit: 71, width: 8, min: 0, max: 128, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 252' },
    { key: 'externB.pcValue', name: 'Param_Ext_kPCValue', block: 16, bit: 79, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253' },
    { key: 'externB.pcValue.morphWheel', name: 'Param_Ext_kPCValue@Wheel', block: 16, bit: 86, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · Wheel morph' },
    { key: 'externB.pcValue.morphAfterTouch', name: 'Param_Ext_kPCValue@AfterTouch', block: 16, bit: 94, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · AfterTouch morph' },
    { key: 'externB.pcValue.morphCtrlPedal', name: 'Param_Ext_kPCValue@CtrlPedal', block: 16, bit: 102, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 253 · CtrlPedal morph' },
    { key: 'externB.sendOnLoadPC', name: 'Param_Ext_kSendOnLoadPC', block: 16, bit: 110, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 254' },
    { key: 'externB.volValue', name: 'Param_Ext_kVolValue', block: 16, bit: 111, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255' },
    { key: 'externB.volValue.morphWheel', name: 'Param_Ext_kVolValue@Wheel', block: 16, bit: 118, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · Wheel morph' },
    { key: 'externB.volValue.morphAfterTouch', name: 'Param_Ext_kVolValue@AfterTouch', block: 16, bit: 126, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · AfterTouch morph' },
    { key: 'externB.volValue.morphCtrlPedal', name: 'Param_Ext_kVolValue@CtrlPedal', block: 16, bit: 134, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 255 · CtrlPedal morph' },
    { key: 'externB.sendOnLoadVol', name: 'Param_Ext_kSendOnLoadVol', block: 16, bit: 142, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 256' },
    { key: 'externB.volPedalEnable', name: 'Param_Ext_kVolPedalEnable', block: 16, bit: 143, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 245' },
    { key: 'effectsB.leslieEnable', name: 'Param_Effects_kLeslieEnable', block: 17, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 257' },
    { key: 'effectsB.leslieSrc', name: 'Param_Effects_kLeslieSrc', block: 17, bit: 1, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 258' },
    { key: 'effectsB.fx1Enable', name: 'Param_Effects_kFx1Enable', block: 17, bit: 3, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 261' },
    { key: 'effectsB.fx1Src', name: 'Param_Effects_kFx1Src', block: 17, bit: 4, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 262' },
    { key: 'effectsB.fx1Type', name: 'Param_Effects_kFx1Type', block: 17, bit: 6, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 263' },
    { key: 'effectsB.fx1ClkEnable', name: 'Param_Effects_kFx1ClkEnable', block: 17, bit: 9, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 264' },
    { key: 'effectsB.fx1RateClkDiv', name: 'Param_Effects_kFx1RateClkDiv', block: 17, bit: 10, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265' },
    { key: 'effectsB.fx1RateClkDiv.morphWheel', name: 'Param_Effects_kFx1RateClkDiv@Wheel', block: 17, bit: 17, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · Wheel morph' },
    { key: 'effectsB.fx1RateClkDiv.morphAfterTouch', name: 'Param_Effects_kFx1RateClkDiv@AfterTouch', block: 17, bit: 25, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · AfterTouch morph' },
    { key: 'effectsB.fx1RateClkDiv.morphCtrlPedal', name: 'Param_Effects_kFx1RateClkDiv@CtrlPedal', block: 17, bit: 33, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 265 · CtrlPedal morph' },
    { key: 'effectsB.fx1Amt', name: 'Param_Effects_kFx1Amt', block: 17, bit: 41, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266' },
    { key: 'effectsB.fx1Amt.morphWheel', name: 'Param_Effects_kFx1Amt@Wheel', block: 17, bit: 48, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · Wheel morph' },
    { key: 'effectsB.fx1Amt.morphAfterTouch', name: 'Param_Effects_kFx1Amt@AfterTouch', block: 17, bit: 56, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · AfterTouch morph' },
    { key: 'effectsB.fx1Amt.morphCtrlPedal', name: 'Param_Effects_kFx1Amt@CtrlPedal', block: 17, bit: 64, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 266 · CtrlPedal morph' },
    { key: 'effectsB.fx2Enable', name: 'Param_Effects_kFx2Enable', block: 17, bit: 72, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 267' },
    { key: 'effectsB.fx2Src', name: 'Param_Effects_kFx2Src', block: 17, bit: 73, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 268' },
    { key: 'effectsB.fx2Type', name: 'Param_Effects_kFx2Type', block: 17, bit: 75, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 269' },
    { key: 'effectsB.fx2Rate', name: 'Param_Effects_kFx2Rate', block: 17, bit: 78, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 270' },
    { key: 'effectsB.fx2Amt', name: 'Param_Effects_kFx2Amt', block: 17, bit: 85, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271' },
    { key: 'effectsB.fx2Amt.morphWheel', name: 'Param_Effects_kFx2Amt@Wheel', block: 17, bit: 92, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · Wheel morph' },
    { key: 'effectsB.fx2Amt.morphAfterTouch', name: 'Param_Effects_kFx2Amt@AfterTouch', block: 17, bit: 100, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · AfterTouch morph' },
    { key: 'effectsB.fx2Amt.morphCtrlPedal', name: 'Param_Effects_kFx2Amt@CtrlPedal', block: 17, bit: 108, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 271 · CtrlPedal morph' },
    { key: 'effectsB.dlyEnable', name: 'Param_Effects_kDlyEnable', block: 17, bit: 116, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 272' },
    { key: 'effectsB.dlySrc', name: 'Param_Effects_kDlySrc', block: 17, bit: 117, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 273' },
    { key: 'effectsB.dlyClkEnable', name: 'Param_Effects_kDlyClkEnable', block: 17, bit: 119, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 274' },
    { key: 'effectsB.dlyRateClkDiv', name: 'Param_Effects_kDlyRateClkDiv', block: 17, bit: 120, width: 14, min: 0, max: 16383, def: 8192, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275' },
    { key: 'effectsB.dlyRateClkDiv.morphWheel', name: 'Param_Effects_kDlyRateClkDiv@Wheel', block: 17, bit: 134, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · Wheel morph' },
    { key: 'effectsB.dlyRateClkDiv.morphAfterTouch', name: 'Param_Effects_kDlyRateClkDiv@AfterTouch', block: 17, bit: 149, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · AfterTouch morph' },
    { key: 'effectsB.dlyRateClkDiv.morphCtrlPedal', name: 'Param_Effects_kDlyRateClkDiv@CtrlPedal', block: 17, bit: 164, width: 15, min: -16383, max: 16383, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 275 · CtrlPedal morph' },
    { key: 'effectsB.dlyMix', name: 'Param_Effects_kDlyMix', block: 17, bit: 179, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277' },
    { key: 'effectsB.dlyMix.morphWheel', name: 'Param_Effects_kDlyMix@Wheel', block: 17, bit: 186, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · Wheel morph' },
    { key: 'effectsB.dlyMix.morphAfterTouch', name: 'Param_Effects_kDlyMix@AfterTouch', block: 17, bit: 194, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · AfterTouch morph' },
    { key: 'effectsB.dlyMix.morphCtrlPedal', name: 'Param_Effects_kDlyMix@CtrlPedal', block: 17, bit: 202, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 277 · CtrlPedal morph' },
    { key: 'effectsB.dlyPingPong', name: 'Param_Effects_kDlyPingPong', block: 17, bit: 210, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 278' },
    { key: 'effectsB.dlyFltType', name: 'Param_Effects_kDlyFltType', block: 17, bit: 211, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 279' },
    { key: 'effectsB.dlyFeedback', name: 'Param_Effects_kDlyFeedback', block: 17, bit: 213, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280' },
    { key: 'effectsB.dlyFeedback.morphWheel', name: 'Param_Effects_kDlyFeedback@Wheel', block: 17, bit: 220, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · Wheel morph' },
    { key: 'effectsB.dlyFeedback.morphAfterTouch', name: 'Param_Effects_kDlyFeedback@AfterTouch', block: 17, bit: 228, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · AfterTouch morph' },
    { key: 'effectsB.dlyFeedback.morphCtrlPedal', name: 'Param_Effects_kDlyFeedback@CtrlPedal', block: 17, bit: 236, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 280 · CtrlPedal morph' },
    { key: 'effectsB.dlyMode', name: 'Param_Effects_kDlyMode', block: 17, bit: 244, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 281' },
    { key: 'effectsB.ampEnable', name: 'Param_Effects_kAmpEnable', block: 17, bit: 245, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 282' },
    { key: 'effectsB.ampSrc', name: 'Param_Effects_kAmpSrc', block: 17, bit: 246, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 283' },
    { key: 'effectsB.ampType', name: 'Param_Effects_kAmpType', block: 17, bit: 248, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 284' },
    { key: 'effectsB.ampTreble', name: 'Param_Effects_kAmpTreble', block: 17, bit: 251, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 285' },
    { key: 'effectsB.ampMid', name: 'Param_Effects_kAmpMid', block: 17, bit: 258, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 286' },
    { key: 'effectsB.ampBass', name: 'Param_Effects_kAmpBass', block: 17, bit: 265, width: 7, min: -60, max: 60, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 287' },
    { key: 'effectsB.ampMidFreq', name: 'Param_Effects_kAmpMidFreq', block: 17, bit: 272, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288' },
    { key: 'effectsB.ampMidFreq.morphWheel', name: 'Param_Effects_kAmpMidFreq@Wheel', block: 17, bit: 279, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · Wheel morph' },
    { key: 'effectsB.ampMidFreq.morphAfterTouch', name: 'Param_Effects_kAmpMidFreq@AfterTouch', block: 17, bit: 287, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · AfterTouch morph' },
    { key: 'effectsB.ampMidFreq.morphCtrlPedal', name: 'Param_Effects_kAmpMidFreq@CtrlPedal', block: 17, bit: 295, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 288 · CtrlPedal morph' },
    { key: 'effectsB.ampDrive', name: 'Param_Effects_kAmpDrive', block: 17, bit: 303, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289' },
    { key: 'effectsB.ampDrive.morphWheel', name: 'Param_Effects_kAmpDrive@Wheel', block: 17, bit: 310, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · Wheel morph' },
    { key: 'effectsB.ampDrive.morphAfterTouch', name: 'Param_Effects_kAmpDrive@AfterTouch', block: 17, bit: 318, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · AfterTouch morph' },
    { key: 'effectsB.ampDrive.morphCtrlPedal', name: 'Param_Effects_kAmpDrive@CtrlPedal', block: 17, bit: 326, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 289 · CtrlPedal morph' },
    { key: 'effectsB.rvbEnable', name: 'Param_Effects_kRvbEnable', block: 17, bit: 334, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 290' },
    { key: 'effectsB.rvbType', name: 'Param_Effects_kRvbType', block: 17, bit: 335, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 291' },
    { key: 'effectsB.rvbBright', name: 'Param_Effects_kRvbBright', block: 17, bit: 338, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 292' },
    { key: 'effectsB.rvbAmt', name: 'Param_Effects_kRvbAmt', block: 17, bit: 339, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293' },
    { key: 'effectsB.rvbAmt.morphWheel', name: 'Param_Effects_kRvbAmt@Wheel', block: 17, bit: 346, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · Wheel morph' },
    { key: 'effectsB.rvbAmt.morphAfterTouch', name: 'Param_Effects_kRvbAmt@AfterTouch', block: 17, bit: 354, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · AfterTouch morph' },
    { key: 'effectsB.rvbAmt.morphCtrlPedal', name: 'Param_Effects_kRvbAmt@CtrlPedal', block: 17, bit: 362, width: 8, min: -127, max: 127, def: 0, enc: 'offset', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 293 · CtrlPedal morph' },
    { key: 'effectsB.cmpEnable', name: 'Param_Effects_kCmpEnable', block: 17, bit: 370, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 294' },
    { key: 'effectsB.cmpAmt', name: 'Param_Effects_kCmpAmt', block: 17, bit: 371, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 295' },
    { key: 'effectsB.cmpResponse', name: 'Param_Effects_kCmpResponse', block: 17, bit: 378, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 296' },
    { key: 'mixerB.audioRouteProg', name: 'Param_Com_kAudioRouteProg', block: 18, bit: 0, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 136' },
    { key: 'mixerB.audioRouteProgSub', name: 'Param_Com_kAudioRouteProgSub', block: 18, bit: 3, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 137' },
    { key: 'mixerB.audioRouteProgSubDest', name: 'Param_Com_kAudioRouteProgSubDest', block: 18, bit: 5, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Stage 3 OS 2.64 registry · id 138' },
  ],
};
