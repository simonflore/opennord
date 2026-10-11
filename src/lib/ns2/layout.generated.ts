// AUTO-GENERATED (stage-2) — DO NOT EDIT MANUALLY.
//
// Provenance: Stage 2 OS 3.00 parameter containers; Stage 2 OS 3.00 container list (7 global, then 15 per slot for A and B), record write / read.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x2E behind the NSM-era header, 0x1A behind the legacy one).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Ns2FieldKey =
  | 'programCommon.param0'
  | 'programCommon.param1'
  | 'programCommon.param2'
  | 'programCommon.param4'
  | 'programCommon.param5'
  | 'programCommon.param6'
  | 'programCommon.param8'
  | 'programCommon.param9'
  | 'programCommon.param10'
  | 'programCommon.param11'
  | 'organCommon.organModel'
  | 'b3Common.b3VibratoType'
  | 'b3Common.b3PercussionHarmonic'
  | 'b3Common.b3PercussionDecay'
  | 'b3Common.b3PercussionVolume'
  | 'voxCommon.voxVibratoType'
  | 'voxCommon.voxVibrato'
  | 'farfCommon.farfisaVibratoType'
  | 'farfCommon.farfisaVibrato'
  | 'pianoCommon.pianoSlotDetune'
  | 'globalFx.reverbEnable'
  | 'globalFx.reverbType'
  | 'globalFx.reverbDryWet'
  | 'globalFx.compressorEnable'
  | 'globalFx.compressorAmount'
  | 'globalFx.rotarySpeakerEnable'
  | 'globalFx.rotarySpeakerSource'
  | 'globalFx.rotarySpeakerDrive'
  | 'globalFx.rotarySpeakerStopMode'
  | 'globalFx.param9'
  | 'globalFx.rotarySpeakerWheelMorph'
  | 'globalFx.rotarySpeakerATouchMorph'
  | 'globalFx.rotarySpeakerCtrlPedMorph'
  | 'globalFx.param13'
  | 'globalFx.param14'
  | 'slotA_common.organEnable'
  | 'slotA_common.organLevel.morphWheel'
  | 'slotA_common.organLevel.morphAfterTouch'
  | 'slotA_common.organLevel.morphCtrlPedal'
  | 'slotA_common.organLevel'
  | 'slotA_common.organZone'
  | 'slotA_common.organOctaveShift'
  | 'slotA_common.param4'
  | 'slotA_common.pianoEnable'
  | 'slotA_common.pianoLevel.morphWheel'
  | 'slotA_common.pianoLevel.morphAfterTouch'
  | 'slotA_common.pianoLevel.morphCtrlPedal'
  | 'slotA_common.pianoLevel'
  | 'slotA_common.pianoZone'
  | 'slotA_common.pianoOctaveShift'
  | 'slotA_common.param9'
  | 'slotA_common.param10'
  | 'slotA_common.synthEnable'
  | 'slotA_common.synthLevel.morphWheel'
  | 'slotA_common.synthLevel.morphAfterTouch'
  | 'slotA_common.synthLevel.morphCtrlPedal'
  | 'slotA_common.synthLevel'
  | 'slotA_common.synthZone'
  | 'slotA_common.synthOctaveShift'
  | 'slotA_common.param15'
  | 'slotA_common.param16'
  | 'slotA_common.externEnable'
  | 'slotA_common.param18.morphWheel'
  | 'slotA_common.param18.morphAfterTouch'
  | 'slotA_common.param18.morphCtrlPedal'
  | 'slotA_common.param18'
  | 'slotA_common.externZone'
  | 'slotA_common.externOctaveShift'
  | 'slotA_common.param21'
  | 'slotA_common.param22'
  | 'slotA_common.param25'
  | 'slotA_common.param26'
  | 'slotA_common.param27'
  | 'slotA_common.param28'
  | 'slotA_common.param29'
  | 'slotA_common.param30'
  | 'slotA_common.param31'
  | 'slotA_common.param32'
  | 'slotA_common.param33'
  | 'slotA_b3Select.b3Preset'
  | 'slotA_voxSelect.voxPreset'
  | 'slotA_farfSelect.farfisaPreset'
  | 'slotA_b3PresetI.b3Sub.morphWheel'
  | 'slotA_b3PresetI.b3Sub.morphAfterTouch'
  | 'slotA_b3PresetI.b3Sub.morphCtrlPedal'
  | 'slotA_b3PresetI.b3Sub'
  | 'slotA_b3PresetI.b3Sub3.morphWheel'
  | 'slotA_b3PresetI.b3Sub3.morphAfterTouch'
  | 'slotA_b3PresetI.b3Sub3.morphCtrlPedal'
  | 'slotA_b3PresetI.b3Sub3'
  | 'slotA_b3PresetI.b3Fund.morphWheel'
  | 'slotA_b3PresetI.b3Fund.morphAfterTouch'
  | 'slotA_b3PresetI.b3Fund.morphCtrlPedal'
  | 'slotA_b3PresetI.b3Fund'
  | 'slotA_b3PresetI.b32nd.morphWheel'
  | 'slotA_b3PresetI.b32nd.morphAfterTouch'
  | 'slotA_b3PresetI.b32nd.morphCtrlPedal'
  | 'slotA_b3PresetI.b32nd'
  | 'slotA_b3PresetI.b33rd.morphWheel'
  | 'slotA_b3PresetI.b33rd.morphAfterTouch'
  | 'slotA_b3PresetI.b33rd.morphCtrlPedal'
  | 'slotA_b3PresetI.b33rd'
  | 'slotA_b3PresetI.b34th.morphWheel'
  | 'slotA_b3PresetI.b34th.morphAfterTouch'
  | 'slotA_b3PresetI.b34th.morphCtrlPedal'
  | 'slotA_b3PresetI.b34th'
  | 'slotA_b3PresetI.b35th.morphWheel'
  | 'slotA_b3PresetI.b35th.morphAfterTouch'
  | 'slotA_b3PresetI.b35th.morphCtrlPedal'
  | 'slotA_b3PresetI.b35th'
  | 'slotA_b3PresetI.b36th.morphWheel'
  | 'slotA_b3PresetI.b36th.morphAfterTouch'
  | 'slotA_b3PresetI.b36th.morphCtrlPedal'
  | 'slotA_b3PresetI.b36th'
  | 'slotA_b3PresetI.b38th.morphWheel'
  | 'slotA_b3PresetI.b38th.morphAfterTouch'
  | 'slotA_b3PresetI.b38th.morphCtrlPedal'
  | 'slotA_b3PresetI.b38th'
  | 'slotA_b3PresetI.b3Vibrato'
  | 'slotA_b3PresetI.b3Percussion'
  | 'slotA_voxPresetI.vox16Foot.morphWheel'
  | 'slotA_voxPresetI.vox16Foot.morphAfterTouch'
  | 'slotA_voxPresetI.vox16Foot.morphCtrlPedal'
  | 'slotA_voxPresetI.vox16Foot'
  | 'slotA_voxPresetI.vox8Foot.morphWheel'
  | 'slotA_voxPresetI.vox8Foot.morphAfterTouch'
  | 'slotA_voxPresetI.vox8Foot.morphCtrlPedal'
  | 'slotA_voxPresetI.vox8Foot'
  | 'slotA_voxPresetI.vox4Foot.morphWheel'
  | 'slotA_voxPresetI.vox4Foot.morphAfterTouch'
  | 'slotA_voxPresetI.vox4Foot.morphCtrlPedal'
  | 'slotA_voxPresetI.vox4Foot'
  | 'slotA_voxPresetI.vox2Foot.morphWheel'
  | 'slotA_voxPresetI.vox2Foot.morphAfterTouch'
  | 'slotA_voxPresetI.vox2Foot.morphCtrlPedal'
  | 'slotA_voxPresetI.vox2Foot'
  | 'slotA_voxPresetI.voxII.morphWheel'
  | 'slotA_voxPresetI.voxII.morphAfterTouch'
  | 'slotA_voxPresetI.voxII.morphCtrlPedal'
  | 'slotA_voxPresetI.voxII'
  | 'slotA_voxPresetI.voxIII.morphWheel'
  | 'slotA_voxPresetI.voxIII.morphAfterTouch'
  | 'slotA_voxPresetI.voxIII.morphCtrlPedal'
  | 'slotA_voxPresetI.voxIII'
  | 'slotA_voxPresetI.voxIV.morphWheel'
  | 'slotA_voxPresetI.voxIV.morphAfterTouch'
  | 'slotA_voxPresetI.voxIV.morphCtrlPedal'
  | 'slotA_voxPresetI.voxIV'
  | 'slotA_voxPresetI.voxSin.morphWheel'
  | 'slotA_voxPresetI.voxSin.morphAfterTouch'
  | 'slotA_voxPresetI.voxSin.morphCtrlPedal'
  | 'slotA_voxPresetI.voxSin'
  | 'slotA_voxPresetI.voxTri.morphWheel'
  | 'slotA_voxPresetI.voxTri.morphAfterTouch'
  | 'slotA_voxPresetI.voxTri.morphCtrlPedal'
  | 'slotA_voxPresetI.voxTri'
  | 'slotA_farfPresetI.farfisaBass16.morphWheel'
  | 'slotA_farfPresetI.farfisaBass16.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaBass16.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaBass16'
  | 'slotA_farfPresetI.farfisaString16.morphWheel'
  | 'slotA_farfPresetI.farfisaString16.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaString16.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaString16'
  | 'slotA_farfPresetI.farfisaFlute8.morphWheel'
  | 'slotA_farfPresetI.farfisaFlute8.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaFlute8.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaFlute8'
  | 'slotA_farfPresetI.farfisaOboe8.morphWheel'
  | 'slotA_farfPresetI.farfisaOboe8.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaOboe8.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaOboe8'
  | 'slotA_farfPresetI.farfisaTrumpet8.morphWheel'
  | 'slotA_farfPresetI.farfisaTrumpet8.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaTrumpet8.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaTrumpet8'
  | 'slotA_farfPresetI.farfisaString8.morphWheel'
  | 'slotA_farfPresetI.farfisaString8.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaString8.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaString8'
  | 'slotA_farfPresetI.farfisaFlute4.morphWheel'
  | 'slotA_farfPresetI.farfisaFlute4.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaFlute4.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaFlute4'
  | 'slotA_farfPresetI.farfisaString4.morphWheel'
  | 'slotA_farfPresetI.farfisaString4.morphAfterTouch'
  | 'slotA_farfPresetI.farfisaString4.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisaString4'
  | 'slotA_farfPresetI.farfisa223.morphWheel'
  | 'slotA_farfPresetI.farfisa223.morphAfterTouch'
  | 'slotA_farfPresetI.farfisa223.morphCtrlPedal'
  | 'slotA_farfPresetI.farfisa223'
  | 'slotA_b3PresetII.b3Sub.morphWheel'
  | 'slotA_b3PresetII.b3Sub.morphAfterTouch'
  | 'slotA_b3PresetII.b3Sub.morphCtrlPedal'
  | 'slotA_b3PresetII.b3Sub'
  | 'slotA_b3PresetII.b3Sub3.morphWheel'
  | 'slotA_b3PresetII.b3Sub3.morphAfterTouch'
  | 'slotA_b3PresetII.b3Sub3.morphCtrlPedal'
  | 'slotA_b3PresetII.b3Sub3'
  | 'slotA_b3PresetII.b3Fund.morphWheel'
  | 'slotA_b3PresetII.b3Fund.morphAfterTouch'
  | 'slotA_b3PresetII.b3Fund.morphCtrlPedal'
  | 'slotA_b3PresetII.b3Fund'
  | 'slotA_b3PresetII.b32nd.morphWheel'
  | 'slotA_b3PresetII.b32nd.morphAfterTouch'
  | 'slotA_b3PresetII.b32nd.morphCtrlPedal'
  | 'slotA_b3PresetII.b32nd'
  | 'slotA_b3PresetII.b33rd.morphWheel'
  | 'slotA_b3PresetII.b33rd.morphAfterTouch'
  | 'slotA_b3PresetII.b33rd.morphCtrlPedal'
  | 'slotA_b3PresetII.b33rd'
  | 'slotA_b3PresetII.b34th.morphWheel'
  | 'slotA_b3PresetII.b34th.morphAfterTouch'
  | 'slotA_b3PresetII.b34th.morphCtrlPedal'
  | 'slotA_b3PresetII.b34th'
  | 'slotA_b3PresetII.b35th.morphWheel'
  | 'slotA_b3PresetII.b35th.morphAfterTouch'
  | 'slotA_b3PresetII.b35th.morphCtrlPedal'
  | 'slotA_b3PresetII.b35th'
  | 'slotA_b3PresetII.b36th.morphWheel'
  | 'slotA_b3PresetII.b36th.morphAfterTouch'
  | 'slotA_b3PresetII.b36th.morphCtrlPedal'
  | 'slotA_b3PresetII.b36th'
  | 'slotA_b3PresetII.b38th.morphWheel'
  | 'slotA_b3PresetII.b38th.morphAfterTouch'
  | 'slotA_b3PresetII.b38th.morphCtrlPedal'
  | 'slotA_b3PresetII.b38th'
  | 'slotA_b3PresetII.b3Vibrato'
  | 'slotA_b3PresetII.b3Percussion'
  | 'slotA_voxPresetII.vox16Foot.morphWheel'
  | 'slotA_voxPresetII.vox16Foot.morphAfterTouch'
  | 'slotA_voxPresetII.vox16Foot.morphCtrlPedal'
  | 'slotA_voxPresetII.vox16Foot'
  | 'slotA_voxPresetII.vox8Foot.morphWheel'
  | 'slotA_voxPresetII.vox8Foot.morphAfterTouch'
  | 'slotA_voxPresetII.vox8Foot.morphCtrlPedal'
  | 'slotA_voxPresetII.vox8Foot'
  | 'slotA_voxPresetII.vox4Foot.morphWheel'
  | 'slotA_voxPresetII.vox4Foot.morphAfterTouch'
  | 'slotA_voxPresetII.vox4Foot.morphCtrlPedal'
  | 'slotA_voxPresetII.vox4Foot'
  | 'slotA_voxPresetII.vox2Foot.morphWheel'
  | 'slotA_voxPresetII.vox2Foot.morphAfterTouch'
  | 'slotA_voxPresetII.vox2Foot.morphCtrlPedal'
  | 'slotA_voxPresetII.vox2Foot'
  | 'slotA_voxPresetII.voxII.morphWheel'
  | 'slotA_voxPresetII.voxII.morphAfterTouch'
  | 'slotA_voxPresetII.voxII.morphCtrlPedal'
  | 'slotA_voxPresetII.voxII'
  | 'slotA_voxPresetII.voxIII.morphWheel'
  | 'slotA_voxPresetII.voxIII.morphAfterTouch'
  | 'slotA_voxPresetII.voxIII.morphCtrlPedal'
  | 'slotA_voxPresetII.voxIII'
  | 'slotA_voxPresetII.voxIV.morphWheel'
  | 'slotA_voxPresetII.voxIV.morphAfterTouch'
  | 'slotA_voxPresetII.voxIV.morphCtrlPedal'
  | 'slotA_voxPresetII.voxIV'
  | 'slotA_voxPresetII.voxSin.morphWheel'
  | 'slotA_voxPresetII.voxSin.morphAfterTouch'
  | 'slotA_voxPresetII.voxSin.morphCtrlPedal'
  | 'slotA_voxPresetII.voxSin'
  | 'slotA_voxPresetII.voxTri.morphWheel'
  | 'slotA_voxPresetII.voxTri.morphAfterTouch'
  | 'slotA_voxPresetII.voxTri.morphCtrlPedal'
  | 'slotA_voxPresetII.voxTri'
  | 'slotA_farfPresetII.farfisaBass16.morphWheel'
  | 'slotA_farfPresetII.farfisaBass16.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaBass16.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaBass16'
  | 'slotA_farfPresetII.farfisaString16.morphWheel'
  | 'slotA_farfPresetII.farfisaString16.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaString16.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaString16'
  | 'slotA_farfPresetII.farfisaFlute8.morphWheel'
  | 'slotA_farfPresetII.farfisaFlute8.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaFlute8.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaFlute8'
  | 'slotA_farfPresetII.farfisaOboe8.morphWheel'
  | 'slotA_farfPresetII.farfisaOboe8.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaOboe8.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaOboe8'
  | 'slotA_farfPresetII.farfisaTrumpet8.morphWheel'
  | 'slotA_farfPresetII.farfisaTrumpet8.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaTrumpet8.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaTrumpet8'
  | 'slotA_farfPresetII.farfisaString8.morphWheel'
  | 'slotA_farfPresetII.farfisaString8.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaString8.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaString8'
  | 'slotA_farfPresetII.farfisaFlute4.morphWheel'
  | 'slotA_farfPresetII.farfisaFlute4.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaFlute4.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaFlute4'
  | 'slotA_farfPresetII.farfisaString4.morphWheel'
  | 'slotA_farfPresetII.farfisaString4.morphAfterTouch'
  | 'slotA_farfPresetII.farfisaString4.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisaString4'
  | 'slotA_farfPresetII.farfisa223.morphWheel'
  | 'slotA_farfPresetII.farfisa223.morphAfterTouch'
  | 'slotA_farfPresetII.farfisa223.morphCtrlPedal'
  | 'slotA_farfPresetII.farfisa223'
  | 'slotA_piano.param0'
  | 'slotA_piano.param2'
  | 'slotA_piano.param3'
  | 'slotA_piano.pianoAcoustic'
  | 'slotA_piano.pianoPedalNoise'
  | 'slotA_piano.pianoDynamics'
  | 'slotA_piano.clavinetEQMode'
  | 'slotA_piano.clavinetEQMode8'
  | 'slotA_piano.param9'
  | 'slotA_piano.param10'
  | 'slotA_piano.param11'
  | 'slotA_arpLfo.arpeggiatorRun'
  | 'slotA_arpLfo.arpeggiatorMstClk'
  | 'slotA_arpLfo.arpeggiatorMstClkDiv'
  | 'slotA_arpLfo.arpeggiatorRate'
  | 'slotA_arpLfo.arpeggiatorPattern'
  | 'slotA_arpLfo.arpeggiatorRange'
  | 'slotA_arpLfo.lFOMstClk'
  | 'slotA_arpLfo.lFOMstClkDiv'
  | 'slotA_arpLfo.holdState'
  | 'slotA_synth.modEnvelopeAttack'
  | 'slotA_synth.modEnvelopeDecay'
  | 'slotA_synth.modEnvelopeRelease'
  | 'slotA_synth.modEnvelopeVelocity'
  | 'slotA_synth.param4'
  | 'slotA_synth.param5'
  | 'slotA_synth.oscShape.morphWheel'
  | 'slotA_synth.oscShape.morphAfterTouch'
  | 'slotA_synth.oscShape.morphCtrlPedal'
  | 'slotA_synth.oscShape'
  | 'slotA_synth.shapeModAmount'
  | 'slotA_synth.oscDetune.morphWheel'
  | 'slotA_synth.oscDetune.morphAfterTouch'
  | 'slotA_synth.oscDetune.morphCtrlPedal'
  | 'slotA_synth.oscDetune'
  | 'slotA_synth.sampSkipAttack.morphWheel'
  | 'slotA_synth.sampSkipAttack.morphAfterTouch'
  | 'slotA_synth.sampSkipAttack.morphCtrlPedal'
  | 'slotA_synth.sampSkipAttack'
  | 'slotA_synth.filterFrequency.morphWheel'
  | 'slotA_synth.filterFrequency.morphAfterTouch'
  | 'slotA_synth.filterFrequency.morphCtrlPedal'
  | 'slotA_synth.filterFrequency'
  | 'slotA_synth.filterResonance'
  | 'slotA_synth.fltFreqMod2Amount'
  | 'slotA_synth.fltFreqMod1Amount'
  | 'slotA_synth.fltKBTTrack'
  | 'slotA_synth.filterMode'
  | 'slotA_synth.ampEnvelopeAttack'
  | 'slotA_synth.ampEnvelopeDecay'
  | 'slotA_synth.ampEnvelopeRelease'
  | 'slotA_synth.ampEnvelopeVelocity'
  | 'slotA_synth.lFORate'
  | 'slotA_synth.lFOWave'
  | 'slotA_synth.param22'
  | 'slotA_synth.param23'
  | 'slotA_synth.param24'
  | 'slotA_synth.glideRate'
  | 'slotA_synth.voiceMode'
  | 'slotA_synth.unisonMode'
  | 'slotA_synth.vibratoMode'
  | 'slotA_extern.param0'
  | 'slotA_extern.param1'
  | 'slotA_extern.externCCValue.morphWheel'
  | 'slotA_extern.externCCValue.morphAfterTouch'
  | 'slotA_extern.externCCValue.morphCtrlPedal'
  | 'slotA_extern.externCCValue'
  | 'slotA_extern.param3'
  | 'slotA_extern.param4'
  | 'slotA_extern.param5'
  | 'slotA_extern.param6'
  | 'slotA_extern.param7'
  | 'slotA_extern.externProgChange'
  | 'slotA_extern.param9'
  | 'slotA_extern.param10'
  | 'slotA_extern.param11'
  | 'slotA_extern.externVolume.morphWheel'
  | 'slotA_extern.externVolume.morphAfterTouch'
  | 'slotA_extern.externVolume.morphCtrlPedal'
  | 'slotA_extern.externVolume'
  | 'slotA_extern.param13'
  | 'slotA_extern.param14'
  | 'slotA_extern.param15'
  | 'slotA_extern.param16'
  | 'slotA_extern.param17'
  | 'slotA_extern.param18'
  | 'slotA_effects.param0'
  | 'slotA_effects.effect1Enable'
  | 'slotA_effects.effect1Source'
  | 'slotA_effects.effect1Type'
  | 'slotA_effects.effect1MstClk'
  | 'slotA_effects.effect1MstClkDiv.morphWheel'
  | 'slotA_effects.effect1MstClkDiv.morphAfterTouch'
  | 'slotA_effects.effect1MstClkDiv.morphCtrlPedal'
  | 'slotA_effects.effect1MstClkDiv'
  | 'slotA_effects.effect1Rate.morphWheel'
  | 'slotA_effects.effect1Rate.morphAfterTouch'
  | 'slotA_effects.effect1Rate.morphCtrlPedal'
  | 'slotA_effects.effect1Rate'
  | 'slotA_effects.effect1Amount.morphWheel'
  | 'slotA_effects.effect1Amount.morphAfterTouch'
  | 'slotA_effects.effect1Amount.morphCtrlPedal'
  | 'slotA_effects.effect1Amount'
  | 'slotA_effects.effect2Enable'
  | 'slotA_effects.effect2Source'
  | 'slotA_effects.effect2Type'
  | 'slotA_effects.effect2MstClk'
  | 'slotA_effects.effect2MstClkDiv.morphWheel'
  | 'slotA_effects.effect2MstClkDiv.morphAfterTouch'
  | 'slotA_effects.effect2MstClkDiv.morphCtrlPedal'
  | 'slotA_effects.effect2MstClkDiv'
  | 'slotA_effects.effect2Rate.morphWheel'
  | 'slotA_effects.effect2Rate.morphAfterTouch'
  | 'slotA_effects.effect2Rate.morphCtrlPedal'
  | 'slotA_effects.effect2Rate'
  | 'slotA_effects.effect2Amount.morphWheel'
  | 'slotA_effects.effect2Amount.morphAfterTouch'
  | 'slotA_effects.effect2Amount.morphCtrlPedal'
  | 'slotA_effects.effect2Amount'
  | 'slotA_effects.delayEnable'
  | 'slotA_effects.delaySource'
  | 'slotA_effects.delayMode'
  | 'slotA_effects.delayMstClk'
  | 'slotA_effects.delayMstClkDiv.morphWheel'
  | 'slotA_effects.delayMstClkDiv.morphAfterTouch'
  | 'slotA_effects.delayMstClkDiv.morphCtrlPedal'
  | 'slotA_effects.delayMstClkDiv'
  | 'slotA_effects.delayRate.morphWheel'
  | 'slotA_effects.delayRate.morphAfterTouch'
  | 'slotA_effects.delayRate.morphCtrlPedal'
  | 'slotA_effects.delayRate'
  | 'slotA_effects.delayAmount.morphWheel'
  | 'slotA_effects.delayAmount.morphAfterTouch'
  | 'slotA_effects.delayAmount.morphCtrlPedal'
  | 'slotA_effects.delayAmount'
  | 'slotA_effects.delayFeedback'
  | 'slotA_effects.ampSimEqEnable'
  | 'slotA_effects.ampSimEqSource'
  | 'slotA_effects.ampSimEqType'
  | 'slotA_effects.ampSimEqDrive'
  | 'slotA_effects.ampSimEqTreble'
  | 'slotA_effects.ampSimEqMid'
  | 'slotA_effects.ampSimEqBass'
  | 'slotA_effects.ampSimEqMidFreq'
  | 'slotB_common.organEnable'
  | 'slotB_common.organLevel.morphWheel'
  | 'slotB_common.organLevel.morphAfterTouch'
  | 'slotB_common.organLevel.morphCtrlPedal'
  | 'slotB_common.organLevel'
  | 'slotB_common.organZone'
  | 'slotB_common.organOctaveShift'
  | 'slotB_common.param4'
  | 'slotB_common.pianoEnable'
  | 'slotB_common.pianoLevel.morphWheel'
  | 'slotB_common.pianoLevel.morphAfterTouch'
  | 'slotB_common.pianoLevel.morphCtrlPedal'
  | 'slotB_common.pianoLevel'
  | 'slotB_common.pianoZone'
  | 'slotB_common.pianoOctaveShift'
  | 'slotB_common.param9'
  | 'slotB_common.param10'
  | 'slotB_common.synthEnable'
  | 'slotB_common.synthLevel.morphWheel'
  | 'slotB_common.synthLevel.morphAfterTouch'
  | 'slotB_common.synthLevel.morphCtrlPedal'
  | 'slotB_common.synthLevel'
  | 'slotB_common.synthZone'
  | 'slotB_common.synthOctaveShift'
  | 'slotB_common.param15'
  | 'slotB_common.param16'
  | 'slotB_common.externEnable'
  | 'slotB_common.param18.morphWheel'
  | 'slotB_common.param18.morphAfterTouch'
  | 'slotB_common.param18.morphCtrlPedal'
  | 'slotB_common.param18'
  | 'slotB_common.externZone'
  | 'slotB_common.externOctaveShift'
  | 'slotB_common.param21'
  | 'slotB_common.param22'
  | 'slotB_common.param25'
  | 'slotB_common.param26'
  | 'slotB_common.param27'
  | 'slotB_common.param28'
  | 'slotB_common.param29'
  | 'slotB_common.param30'
  | 'slotB_common.param31'
  | 'slotB_common.param32'
  | 'slotB_common.param33'
  | 'slotB_b3Select.b3Preset'
  | 'slotB_voxSelect.voxPreset'
  | 'slotB_farfSelect.farfisaPreset'
  | 'slotB_b3PresetI.b3Sub.morphWheel'
  | 'slotB_b3PresetI.b3Sub.morphAfterTouch'
  | 'slotB_b3PresetI.b3Sub.morphCtrlPedal'
  | 'slotB_b3PresetI.b3Sub'
  | 'slotB_b3PresetI.b3Sub3.morphWheel'
  | 'slotB_b3PresetI.b3Sub3.morphAfterTouch'
  | 'slotB_b3PresetI.b3Sub3.morphCtrlPedal'
  | 'slotB_b3PresetI.b3Sub3'
  | 'slotB_b3PresetI.b3Fund.morphWheel'
  | 'slotB_b3PresetI.b3Fund.morphAfterTouch'
  | 'slotB_b3PresetI.b3Fund.morphCtrlPedal'
  | 'slotB_b3PresetI.b3Fund'
  | 'slotB_b3PresetI.b32nd.morphWheel'
  | 'slotB_b3PresetI.b32nd.morphAfterTouch'
  | 'slotB_b3PresetI.b32nd.morphCtrlPedal'
  | 'slotB_b3PresetI.b32nd'
  | 'slotB_b3PresetI.b33rd.morphWheel'
  | 'slotB_b3PresetI.b33rd.morphAfterTouch'
  | 'slotB_b3PresetI.b33rd.morphCtrlPedal'
  | 'slotB_b3PresetI.b33rd'
  | 'slotB_b3PresetI.b34th.morphWheel'
  | 'slotB_b3PresetI.b34th.morphAfterTouch'
  | 'slotB_b3PresetI.b34th.morphCtrlPedal'
  | 'slotB_b3PresetI.b34th'
  | 'slotB_b3PresetI.b35th.morphWheel'
  | 'slotB_b3PresetI.b35th.morphAfterTouch'
  | 'slotB_b3PresetI.b35th.morphCtrlPedal'
  | 'slotB_b3PresetI.b35th'
  | 'slotB_b3PresetI.b36th.morphWheel'
  | 'slotB_b3PresetI.b36th.morphAfterTouch'
  | 'slotB_b3PresetI.b36th.morphCtrlPedal'
  | 'slotB_b3PresetI.b36th'
  | 'slotB_b3PresetI.b38th.morphWheel'
  | 'slotB_b3PresetI.b38th.morphAfterTouch'
  | 'slotB_b3PresetI.b38th.morphCtrlPedal'
  | 'slotB_b3PresetI.b38th'
  | 'slotB_b3PresetI.b3Vibrato'
  | 'slotB_b3PresetI.b3Percussion'
  | 'slotB_voxPresetI.vox16Foot.morphWheel'
  | 'slotB_voxPresetI.vox16Foot.morphAfterTouch'
  | 'slotB_voxPresetI.vox16Foot.morphCtrlPedal'
  | 'slotB_voxPresetI.vox16Foot'
  | 'slotB_voxPresetI.vox8Foot.morphWheel'
  | 'slotB_voxPresetI.vox8Foot.morphAfterTouch'
  | 'slotB_voxPresetI.vox8Foot.morphCtrlPedal'
  | 'slotB_voxPresetI.vox8Foot'
  | 'slotB_voxPresetI.vox4Foot.morphWheel'
  | 'slotB_voxPresetI.vox4Foot.morphAfterTouch'
  | 'slotB_voxPresetI.vox4Foot.morphCtrlPedal'
  | 'slotB_voxPresetI.vox4Foot'
  | 'slotB_voxPresetI.vox2Foot.morphWheel'
  | 'slotB_voxPresetI.vox2Foot.morphAfterTouch'
  | 'slotB_voxPresetI.vox2Foot.morphCtrlPedal'
  | 'slotB_voxPresetI.vox2Foot'
  | 'slotB_voxPresetI.voxII.morphWheel'
  | 'slotB_voxPresetI.voxII.morphAfterTouch'
  | 'slotB_voxPresetI.voxII.morphCtrlPedal'
  | 'slotB_voxPresetI.voxII'
  | 'slotB_voxPresetI.voxIII.morphWheel'
  | 'slotB_voxPresetI.voxIII.morphAfterTouch'
  | 'slotB_voxPresetI.voxIII.morphCtrlPedal'
  | 'slotB_voxPresetI.voxIII'
  | 'slotB_voxPresetI.voxIV.morphWheel'
  | 'slotB_voxPresetI.voxIV.morphAfterTouch'
  | 'slotB_voxPresetI.voxIV.morphCtrlPedal'
  | 'slotB_voxPresetI.voxIV'
  | 'slotB_voxPresetI.voxSin.morphWheel'
  | 'slotB_voxPresetI.voxSin.morphAfterTouch'
  | 'slotB_voxPresetI.voxSin.morphCtrlPedal'
  | 'slotB_voxPresetI.voxSin'
  | 'slotB_voxPresetI.voxTri.morphWheel'
  | 'slotB_voxPresetI.voxTri.morphAfterTouch'
  | 'slotB_voxPresetI.voxTri.morphCtrlPedal'
  | 'slotB_voxPresetI.voxTri'
  | 'slotB_farfPresetI.farfisaBass16.morphWheel'
  | 'slotB_farfPresetI.farfisaBass16.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaBass16.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaBass16'
  | 'slotB_farfPresetI.farfisaString16.morphWheel'
  | 'slotB_farfPresetI.farfisaString16.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaString16.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaString16'
  | 'slotB_farfPresetI.farfisaFlute8.morphWheel'
  | 'slotB_farfPresetI.farfisaFlute8.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaFlute8.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaFlute8'
  | 'slotB_farfPresetI.farfisaOboe8.morphWheel'
  | 'slotB_farfPresetI.farfisaOboe8.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaOboe8.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaOboe8'
  | 'slotB_farfPresetI.farfisaTrumpet8.morphWheel'
  | 'slotB_farfPresetI.farfisaTrumpet8.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaTrumpet8.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaTrumpet8'
  | 'slotB_farfPresetI.farfisaString8.morphWheel'
  | 'slotB_farfPresetI.farfisaString8.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaString8.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaString8'
  | 'slotB_farfPresetI.farfisaFlute4.morphWheel'
  | 'slotB_farfPresetI.farfisaFlute4.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaFlute4.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaFlute4'
  | 'slotB_farfPresetI.farfisaString4.morphWheel'
  | 'slotB_farfPresetI.farfisaString4.morphAfterTouch'
  | 'slotB_farfPresetI.farfisaString4.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisaString4'
  | 'slotB_farfPresetI.farfisa223.morphWheel'
  | 'slotB_farfPresetI.farfisa223.morphAfterTouch'
  | 'slotB_farfPresetI.farfisa223.morphCtrlPedal'
  | 'slotB_farfPresetI.farfisa223'
  | 'slotB_b3PresetII.b3Sub.morphWheel'
  | 'slotB_b3PresetII.b3Sub.morphAfterTouch'
  | 'slotB_b3PresetII.b3Sub.morphCtrlPedal'
  | 'slotB_b3PresetII.b3Sub'
  | 'slotB_b3PresetII.b3Sub3.morphWheel'
  | 'slotB_b3PresetII.b3Sub3.morphAfterTouch'
  | 'slotB_b3PresetII.b3Sub3.morphCtrlPedal'
  | 'slotB_b3PresetII.b3Sub3'
  | 'slotB_b3PresetII.b3Fund.morphWheel'
  | 'slotB_b3PresetII.b3Fund.morphAfterTouch'
  | 'slotB_b3PresetII.b3Fund.morphCtrlPedal'
  | 'slotB_b3PresetII.b3Fund'
  | 'slotB_b3PresetII.b32nd.morphWheel'
  | 'slotB_b3PresetII.b32nd.morphAfterTouch'
  | 'slotB_b3PresetII.b32nd.morphCtrlPedal'
  | 'slotB_b3PresetII.b32nd'
  | 'slotB_b3PresetII.b33rd.morphWheel'
  | 'slotB_b3PresetII.b33rd.morphAfterTouch'
  | 'slotB_b3PresetII.b33rd.morphCtrlPedal'
  | 'slotB_b3PresetII.b33rd'
  | 'slotB_b3PresetII.b34th.morphWheel'
  | 'slotB_b3PresetII.b34th.morphAfterTouch'
  | 'slotB_b3PresetII.b34th.morphCtrlPedal'
  | 'slotB_b3PresetII.b34th'
  | 'slotB_b3PresetII.b35th.morphWheel'
  | 'slotB_b3PresetII.b35th.morphAfterTouch'
  | 'slotB_b3PresetII.b35th.morphCtrlPedal'
  | 'slotB_b3PresetII.b35th'
  | 'slotB_b3PresetII.b36th.morphWheel'
  | 'slotB_b3PresetII.b36th.morphAfterTouch'
  | 'slotB_b3PresetII.b36th.morphCtrlPedal'
  | 'slotB_b3PresetII.b36th'
  | 'slotB_b3PresetII.b38th.morphWheel'
  | 'slotB_b3PresetII.b38th.morphAfterTouch'
  | 'slotB_b3PresetII.b38th.morphCtrlPedal'
  | 'slotB_b3PresetII.b38th'
  | 'slotB_b3PresetII.b3Vibrato'
  | 'slotB_b3PresetII.b3Percussion'
  | 'slotB_voxPresetII.vox16Foot.morphWheel'
  | 'slotB_voxPresetII.vox16Foot.morphAfterTouch'
  | 'slotB_voxPresetII.vox16Foot.morphCtrlPedal'
  | 'slotB_voxPresetII.vox16Foot'
  | 'slotB_voxPresetII.vox8Foot.morphWheel'
  | 'slotB_voxPresetII.vox8Foot.morphAfterTouch'
  | 'slotB_voxPresetII.vox8Foot.morphCtrlPedal'
  | 'slotB_voxPresetII.vox8Foot'
  | 'slotB_voxPresetII.vox4Foot.morphWheel'
  | 'slotB_voxPresetII.vox4Foot.morphAfterTouch'
  | 'slotB_voxPresetII.vox4Foot.morphCtrlPedal'
  | 'slotB_voxPresetII.vox4Foot'
  | 'slotB_voxPresetII.vox2Foot.morphWheel'
  | 'slotB_voxPresetII.vox2Foot.morphAfterTouch'
  | 'slotB_voxPresetII.vox2Foot.morphCtrlPedal'
  | 'slotB_voxPresetII.vox2Foot'
  | 'slotB_voxPresetII.voxII.morphWheel'
  | 'slotB_voxPresetII.voxII.morphAfterTouch'
  | 'slotB_voxPresetII.voxII.morphCtrlPedal'
  | 'slotB_voxPresetII.voxII'
  | 'slotB_voxPresetII.voxIII.morphWheel'
  | 'slotB_voxPresetII.voxIII.morphAfterTouch'
  | 'slotB_voxPresetII.voxIII.morphCtrlPedal'
  | 'slotB_voxPresetII.voxIII'
  | 'slotB_voxPresetII.voxIV.morphWheel'
  | 'slotB_voxPresetII.voxIV.morphAfterTouch'
  | 'slotB_voxPresetII.voxIV.morphCtrlPedal'
  | 'slotB_voxPresetII.voxIV'
  | 'slotB_voxPresetII.voxSin.morphWheel'
  | 'slotB_voxPresetII.voxSin.morphAfterTouch'
  | 'slotB_voxPresetII.voxSin.morphCtrlPedal'
  | 'slotB_voxPresetII.voxSin'
  | 'slotB_voxPresetII.voxTri.morphWheel'
  | 'slotB_voxPresetII.voxTri.morphAfterTouch'
  | 'slotB_voxPresetII.voxTri.morphCtrlPedal'
  | 'slotB_voxPresetII.voxTri'
  | 'slotB_farfPresetII.farfisaBass16.morphWheel'
  | 'slotB_farfPresetII.farfisaBass16.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaBass16.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaBass16'
  | 'slotB_farfPresetII.farfisaString16.morphWheel'
  | 'slotB_farfPresetII.farfisaString16.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaString16.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaString16'
  | 'slotB_farfPresetII.farfisaFlute8.morphWheel'
  | 'slotB_farfPresetII.farfisaFlute8.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaFlute8.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaFlute8'
  | 'slotB_farfPresetII.farfisaOboe8.morphWheel'
  | 'slotB_farfPresetII.farfisaOboe8.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaOboe8.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaOboe8'
  | 'slotB_farfPresetII.farfisaTrumpet8.morphWheel'
  | 'slotB_farfPresetII.farfisaTrumpet8.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaTrumpet8.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaTrumpet8'
  | 'slotB_farfPresetII.farfisaString8.morphWheel'
  | 'slotB_farfPresetII.farfisaString8.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaString8.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaString8'
  | 'slotB_farfPresetII.farfisaFlute4.morphWheel'
  | 'slotB_farfPresetII.farfisaFlute4.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaFlute4.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaFlute4'
  | 'slotB_farfPresetII.farfisaString4.morphWheel'
  | 'slotB_farfPresetII.farfisaString4.morphAfterTouch'
  | 'slotB_farfPresetII.farfisaString4.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisaString4'
  | 'slotB_farfPresetII.farfisa223.morphWheel'
  | 'slotB_farfPresetII.farfisa223.morphAfterTouch'
  | 'slotB_farfPresetII.farfisa223.morphCtrlPedal'
  | 'slotB_farfPresetII.farfisa223'
  | 'slotB_piano.param0'
  | 'slotB_piano.param2'
  | 'slotB_piano.param3'
  | 'slotB_piano.pianoAcoustic'
  | 'slotB_piano.pianoPedalNoise'
  | 'slotB_piano.pianoDynamics'
  | 'slotB_piano.clavinetEQMode'
  | 'slotB_piano.clavinetEQMode8'
  | 'slotB_piano.param9'
  | 'slotB_piano.param10'
  | 'slotB_piano.param11'
  | 'slotB_arpLfo.arpeggiatorRun'
  | 'slotB_arpLfo.arpeggiatorMstClk'
  | 'slotB_arpLfo.arpeggiatorMstClkDiv'
  | 'slotB_arpLfo.arpeggiatorRate'
  | 'slotB_arpLfo.arpeggiatorPattern'
  | 'slotB_arpLfo.arpeggiatorRange'
  | 'slotB_arpLfo.lFOMstClk'
  | 'slotB_arpLfo.lFOMstClkDiv'
  | 'slotB_arpLfo.holdState'
  | 'slotB_synth.modEnvelopeAttack'
  | 'slotB_synth.modEnvelopeDecay'
  | 'slotB_synth.modEnvelopeRelease'
  | 'slotB_synth.modEnvelopeVelocity'
  | 'slotB_synth.param4'
  | 'slotB_synth.param5'
  | 'slotB_synth.oscShape.morphWheel'
  | 'slotB_synth.oscShape.morphAfterTouch'
  | 'slotB_synth.oscShape.morphCtrlPedal'
  | 'slotB_synth.oscShape'
  | 'slotB_synth.shapeModAmount'
  | 'slotB_synth.oscDetune.morphWheel'
  | 'slotB_synth.oscDetune.morphAfterTouch'
  | 'slotB_synth.oscDetune.morphCtrlPedal'
  | 'slotB_synth.oscDetune'
  | 'slotB_synth.sampSkipAttack.morphWheel'
  | 'slotB_synth.sampSkipAttack.morphAfterTouch'
  | 'slotB_synth.sampSkipAttack.morphCtrlPedal'
  | 'slotB_synth.sampSkipAttack'
  | 'slotB_synth.filterFrequency.morphWheel'
  | 'slotB_synth.filterFrequency.morphAfterTouch'
  | 'slotB_synth.filterFrequency.morphCtrlPedal'
  | 'slotB_synth.filterFrequency'
  | 'slotB_synth.filterResonance'
  | 'slotB_synth.fltFreqMod2Amount'
  | 'slotB_synth.fltFreqMod1Amount'
  | 'slotB_synth.fltKBTTrack'
  | 'slotB_synth.filterMode'
  | 'slotB_synth.ampEnvelopeAttack'
  | 'slotB_synth.ampEnvelopeDecay'
  | 'slotB_synth.ampEnvelopeRelease'
  | 'slotB_synth.ampEnvelopeVelocity'
  | 'slotB_synth.lFORate'
  | 'slotB_synth.lFOWave'
  | 'slotB_synth.param22'
  | 'slotB_synth.param23'
  | 'slotB_synth.param24'
  | 'slotB_synth.glideRate'
  | 'slotB_synth.voiceMode'
  | 'slotB_synth.unisonMode'
  | 'slotB_synth.vibratoMode'
  | 'slotB_extern.param0'
  | 'slotB_extern.param1'
  | 'slotB_extern.externCCValue.morphWheel'
  | 'slotB_extern.externCCValue.morphAfterTouch'
  | 'slotB_extern.externCCValue.morphCtrlPedal'
  | 'slotB_extern.externCCValue'
  | 'slotB_extern.param3'
  | 'slotB_extern.param4'
  | 'slotB_extern.param5'
  | 'slotB_extern.param6'
  | 'slotB_extern.param7'
  | 'slotB_extern.externProgChange'
  | 'slotB_extern.param9'
  | 'slotB_extern.param10'
  | 'slotB_extern.param11'
  | 'slotB_extern.externVolume.morphWheel'
  | 'slotB_extern.externVolume.morphAfterTouch'
  | 'slotB_extern.externVolume.morphCtrlPedal'
  | 'slotB_extern.externVolume'
  | 'slotB_extern.param13'
  | 'slotB_extern.param14'
  | 'slotB_extern.param15'
  | 'slotB_extern.param16'
  | 'slotB_extern.param17'
  | 'slotB_extern.param18'
  | 'slotB_effects.param0'
  | 'slotB_effects.effect1Enable'
  | 'slotB_effects.effect1Source'
  | 'slotB_effects.effect1Type'
  | 'slotB_effects.effect1MstClk'
  | 'slotB_effects.effect1MstClkDiv.morphWheel'
  | 'slotB_effects.effect1MstClkDiv.morphAfterTouch'
  | 'slotB_effects.effect1MstClkDiv.morphCtrlPedal'
  | 'slotB_effects.effect1MstClkDiv'
  | 'slotB_effects.effect1Rate.morphWheel'
  | 'slotB_effects.effect1Rate.morphAfterTouch'
  | 'slotB_effects.effect1Rate.morphCtrlPedal'
  | 'slotB_effects.effect1Rate'
  | 'slotB_effects.effect1Amount.morphWheel'
  | 'slotB_effects.effect1Amount.morphAfterTouch'
  | 'slotB_effects.effect1Amount.morphCtrlPedal'
  | 'slotB_effects.effect1Amount'
  | 'slotB_effects.effect2Enable'
  | 'slotB_effects.effect2Source'
  | 'slotB_effects.effect2Type'
  | 'slotB_effects.effect2MstClk'
  | 'slotB_effects.effect2MstClkDiv.morphWheel'
  | 'slotB_effects.effect2MstClkDiv.morphAfterTouch'
  | 'slotB_effects.effect2MstClkDiv.morphCtrlPedal'
  | 'slotB_effects.effect2MstClkDiv'
  | 'slotB_effects.effect2Rate.morphWheel'
  | 'slotB_effects.effect2Rate.morphAfterTouch'
  | 'slotB_effects.effect2Rate.morphCtrlPedal'
  | 'slotB_effects.effect2Rate'
  | 'slotB_effects.effect2Amount.morphWheel'
  | 'slotB_effects.effect2Amount.morphAfterTouch'
  | 'slotB_effects.effect2Amount.morphCtrlPedal'
  | 'slotB_effects.effect2Amount'
  | 'slotB_effects.delayEnable'
  | 'slotB_effects.delaySource'
  | 'slotB_effects.delayMode'
  | 'slotB_effects.delayMstClk'
  | 'slotB_effects.delayMstClkDiv.morphWheel'
  | 'slotB_effects.delayMstClkDiv.morphAfterTouch'
  | 'slotB_effects.delayMstClkDiv.morphCtrlPedal'
  | 'slotB_effects.delayMstClkDiv'
  | 'slotB_effects.delayRate.morphWheel'
  | 'slotB_effects.delayRate.morphAfterTouch'
  | 'slotB_effects.delayRate.morphCtrlPedal'
  | 'slotB_effects.delayRate'
  | 'slotB_effects.delayAmount.morphWheel'
  | 'slotB_effects.delayAmount.morphAfterTouch'
  | 'slotB_effects.delayAmount.morphCtrlPedal'
  | 'slotB_effects.delayAmount'
  | 'slotB_effects.delayFeedback'
  | 'slotB_effects.ampSimEqEnable'
  | 'slotB_effects.ampSimEqSource'
  | 'slotB_effects.ampSimEqType'
  | 'slotB_effects.ampSimEqDrive'
  | 'slotB_effects.ampSimEqTreble'
  | 'slotB_effects.ampSimEqMid'
  | 'slotB_effects.ampSimEqBass'
  | 'slotB_effects.ampSimEqMidFreq';

export const NS2_LAYOUT: LegacyLayout<Ns2FieldKey> = {
  model: 'Nord Stage 2',
  source: 'Stage 2 OS 3.00 parameter containers',
  container: 'Stage 2 OS 3.00 container list (7 global, then 15 per slot for A and B), record write / read',
  recordVersion: 7,
  dataBytes: 519,
  fields: [
    { key: 'programCommon.param0', name: 'programCommon.param0', id: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 0' },
    { key: 'programCommon.param1', name: 'programCommon.param1', id: 1, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 1', cc: 68 },
    { key: 'programCommon.param2', name: 'programCommon.param2', id: 2, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 2' },
    { key: 'programCommon.param4', name: 'programCommon.param4', id: 4, bit: 4, width: 4, min: 0, max: 9, def: 2, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 4' },
    { key: 'programCommon.param5', name: 'programCommon.param5', id: 5, bit: 8, width: 4, min: 0, max: 9, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 5' },
    { key: 'programCommon.param6', name: 'programCommon.param6', id: 6, bit: 12, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 6' },
    { key: 'programCommon.param8', name: 'programCommon.param8', id: 8, bit: 17, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 8' },
    { key: 'programCommon.param9', name: 'programCommon.param9', id: 9, bit: 18, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 9' },
    { key: 'programCommon.param10', name: 'programCommon.param10', id: 10, bit: 19, width: 4, min: 0, max: 12, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 10' },
    { key: 'programCommon.param11', name: 'programCommon.param11', id: 11, bit: 23, width: 12, min: 0, max: 210, def: 90, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · programCommon 11' },
    { key: 'organCommon.organModel', name: 'organCommon.organModel', id: 0, bit: 48, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · organCommon 0', cc: 23 },
    { key: 'b3Common.b3VibratoType', name: 'b3Common.b3VibratoType', id: 0, bit: 56, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · b3Common 0', cc: 24 },
    { key: 'b3Common.b3PercussionHarmonic', name: 'b3Common.b3PercussionHarmonic', id: 1, bit: 59, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · b3Common 1', cc: 26 },
    { key: 'b3Common.b3PercussionDecay', name: 'b3Common.b3PercussionDecay', id: 2, bit: 60, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · b3Common 2', cc: 27 },
    { key: 'b3Common.b3PercussionVolume', name: 'b3Common.b3PercussionVolume', id: 3, bit: 61, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · b3Common 3', cc: 28 },
    { key: 'voxCommon.voxVibratoType', name: 'voxCommon.voxVibratoType', id: 0, bit: 72, width: 3, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · voxCommon 0', cc: 24 },
    { key: 'voxCommon.voxVibrato', name: 'voxCommon.voxVibrato', id: 1, bit: 75, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · voxCommon 1', cc: 25 },
    { key: 'farfCommon.farfisaVibratoType', name: 'farfCommon.farfisaVibratoType', id: 0, bit: 88, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · farfCommon 0', cc: 24 },
    { key: 'farfCommon.farfisaVibrato', name: 'farfCommon.farfisaVibrato', id: 1, bit: 91, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · farfCommon 1', cc: 25 },
    { key: 'pianoCommon.pianoSlotDetune', name: 'pianoCommon.pianoSlotDetune', id: 0, bit: 104, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · pianoCommon 0', cc: 5 },
    { key: 'globalFx.reverbEnable', name: 'globalFx.reverbEnable', id: 0, bit: 120, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 0', cc: 97 },
    { key: 'globalFx.reverbType', name: 'globalFx.reverbType', id: 1, bit: 121, width: 3, min: 0, max: 5, def: 2, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 1', cc: 96 },
    { key: 'globalFx.reverbDryWet', name: 'globalFx.reverbDryWet', id: 2, bit: 124, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 2', cc: 95 },
    { key: 'globalFx.compressorEnable', name: 'globalFx.compressorEnable', id: 3, bit: 131, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 3', cc: 94 },
    { key: 'globalFx.compressorAmount', name: 'globalFx.compressorAmount', id: 4, bit: 132, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 4', cc: 93 },
    { key: 'globalFx.rotarySpeakerEnable', name: 'globalFx.rotarySpeakerEnable', id: 5, bit: 139, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 5', cc: 92 },
    { key: 'globalFx.rotarySpeakerSource', name: 'globalFx.rotarySpeakerSource', id: 6, bit: 140, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 6', cc: 88 },
    { key: 'globalFx.rotarySpeakerDrive', name: 'globalFx.rotarySpeakerDrive', id: 7, bit: 142, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 7', cc: 89 },
    { key: 'globalFx.rotarySpeakerStopMode', name: 'globalFx.rotarySpeakerStopMode', id: 8, bit: 149, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 8', cc: 91 },
    { key: 'globalFx.param9', name: 'globalFx.param9', id: 9, bit: 150, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 9', cc: 82 },
    { key: 'globalFx.rotarySpeakerWheelMorph', name: 'globalFx.rotarySpeakerWheelMorph', id: 10, bit: 151, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 10' },
    { key: 'globalFx.rotarySpeakerATouchMorph', name: 'globalFx.rotarySpeakerATouchMorph', id: 11, bit: 152, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 11' },
    { key: 'globalFx.rotarySpeakerCtrlPedMorph', name: 'globalFx.rotarySpeakerCtrlPedMorph', id: 12, bit: 153, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 12' },
    { key: 'globalFx.param13', name: 'globalFx.param13', id: 13, bit: 154, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 13' },
    { key: 'globalFx.param14', name: 'globalFx.param14', id: 14, bit: 161, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · globalFx 14' },
    { key: 'slotA_common.organEnable', name: 'slotA_common.organEnable', id: 0, bit: 168, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 0', cc: 101 },
    { key: 'slotA_common.organLevel.morphWheel', name: 'slotA_common.organLevel morph Wheel', id: 1, bit: 169, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 1 · Wheel morph', deltaOf: 'slotA_common.organLevel' },
    { key: 'slotA_common.organLevel.morphAfterTouch', name: 'slotA_common.organLevel morph After Touch', id: 1, bit: 177, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 1 · After Touch morph', deltaOf: 'slotA_common.organLevel' },
    { key: 'slotA_common.organLevel.morphCtrlPedal', name: 'slotA_common.organLevel morph Ctrl Pedal', id: 1, bit: 185, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 1 · Ctrl Pedal morph', deltaOf: 'slotA_common.organLevel' },
    { key: 'slotA_common.organLevel', name: 'slotA_common.organLevel', id: 1, bit: 193, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 1', cc: 100 },
    { key: 'slotA_common.organZone', name: 'slotA_common.organZone', id: 2, bit: 200, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 2' },
    { key: 'slotA_common.organOctaveShift', name: 'slotA_common.organOctaveShift', id: 3, bit: 203, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 3', cc: 99 },
    { key: 'slotA_common.param4', name: 'slotA_common.param4', id: 4, bit: 207, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 4' },
    { key: 'slotA_common.pianoEnable', name: 'slotA_common.pianoEnable', id: 5, bit: 208, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 5', cc: 107 },
    { key: 'slotA_common.pianoLevel.morphWheel', name: 'slotA_common.pianoLevel morph Wheel', id: 6, bit: 209, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 6 · Wheel morph', deltaOf: 'slotA_common.pianoLevel' },
    { key: 'slotA_common.pianoLevel.morphAfterTouch', name: 'slotA_common.pianoLevel morph After Touch', id: 6, bit: 217, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 6 · After Touch morph', deltaOf: 'slotA_common.pianoLevel' },
    { key: 'slotA_common.pianoLevel.morphCtrlPedal', name: 'slotA_common.pianoLevel morph Ctrl Pedal', id: 6, bit: 225, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 6 · Ctrl Pedal morph', deltaOf: 'slotA_common.pianoLevel' },
    { key: 'slotA_common.pianoLevel', name: 'slotA_common.pianoLevel', id: 6, bit: 233, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 6', cc: 106 },
    { key: 'slotA_common.pianoZone', name: 'slotA_common.pianoZone', id: 7, bit: 240, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 7' },
    { key: 'slotA_common.pianoOctaveShift', name: 'slotA_common.pianoOctaveShift', id: 8, bit: 243, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 8', cc: 105 },
    { key: 'slotA_common.param9', name: 'slotA_common.param9', id: 9, bit: 247, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 9' },
    { key: 'slotA_common.param10', name: 'slotA_common.param10', id: 10, bit: 248, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 10' },
    { key: 'slotA_common.synthEnable', name: 'slotA_common.synthEnable', id: 11, bit: 249, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 11', cc: 113 },
    { key: 'slotA_common.synthLevel.morphWheel', name: 'slotA_common.synthLevel morph Wheel', id: 12, bit: 250, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 12 · Wheel morph', deltaOf: 'slotA_common.synthLevel' },
    { key: 'slotA_common.synthLevel.morphAfterTouch', name: 'slotA_common.synthLevel morph After Touch', id: 12, bit: 258, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 12 · After Touch morph', deltaOf: 'slotA_common.synthLevel' },
    { key: 'slotA_common.synthLevel.morphCtrlPedal', name: 'slotA_common.synthLevel morph Ctrl Pedal', id: 12, bit: 266, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 12 · Ctrl Pedal morph', deltaOf: 'slotA_common.synthLevel' },
    { key: 'slotA_common.synthLevel', name: 'slotA_common.synthLevel', id: 12, bit: 274, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 12', cc: 112 },
    { key: 'slotA_common.synthZone', name: 'slotA_common.synthZone', id: 13, bit: 281, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 13' },
    { key: 'slotA_common.synthOctaveShift', name: 'slotA_common.synthOctaveShift', id: 14, bit: 284, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 14', cc: 111 },
    { key: 'slotA_common.param15', name: 'slotA_common.param15', id: 15, bit: 288, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 15' },
    { key: 'slotA_common.param16', name: 'slotA_common.param16', id: 16, bit: 289, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 16' },
    { key: 'slotA_common.externEnable', name: 'slotA_common.externEnable', id: 17, bit: 290, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 17' },
    { key: 'slotA_common.param18.morphWheel', name: 'slotA_common.param18 morph Wheel', id: 18, bit: 291, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 18 · Wheel morph', deltaOf: 'slotA_common.param18' },
    { key: 'slotA_common.param18.morphAfterTouch', name: 'slotA_common.param18 morph After Touch', id: 18, bit: 299, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 18 · After Touch morph', deltaOf: 'slotA_common.param18' },
    { key: 'slotA_common.param18.morphCtrlPedal', name: 'slotA_common.param18 morph Ctrl Pedal', id: 18, bit: 307, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 18 · Ctrl Pedal morph', deltaOf: 'slotA_common.param18' },
    { key: 'slotA_common.param18', name: 'slotA_common.param18', id: 18, bit: 315, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 18' },
    { key: 'slotA_common.externZone', name: 'slotA_common.externZone', id: 19, bit: 322, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 19' },
    { key: 'slotA_common.externOctaveShift', name: 'slotA_common.externOctaveShift', id: 20, bit: 325, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 20' },
    { key: 'slotA_common.param21', name: 'slotA_common.param21', id: 21, bit: 329, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 21' },
    { key: 'slotA_common.param22', name: 'slotA_common.param22', id: 22, bit: 330, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 22' },
    { key: 'slotA_common.param25', name: 'slotA_common.param25', id: 25, bit: 341, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 25' },
    { key: 'slotA_common.param26', name: 'slotA_common.param26', id: 26, bit: 344, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 26' },
    { key: 'slotA_common.param27', name: 'slotA_common.param27', id: 27, bit: 347, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 27' },
    { key: 'slotA_common.param28', name: 'slotA_common.param28', id: 28, bit: 350, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 28' },
    { key: 'slotA_common.param29', name: 'slotA_common.param29', id: 29, bit: 351, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 29' },
    { key: 'slotA_common.param30', name: 'slotA_common.param30', id: 30, bit: 352, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 30' },
    { key: 'slotA_common.param31', name: 'slotA_common.param31', id: 31, bit: 353, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 31' },
    { key: 'slotA_common.param32', name: 'slotA_common.param32', id: 32, bit: 354, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 32' },
    { key: 'slotA_common.param33', name: 'slotA_common.param33', id: 33, bit: 355, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_common 33' },
    { key: 'slotA_b3Select.b3Preset', name: 'slotA_b3Select.b3Preset', id: 0, bit: 368, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3Select 0', cc: 3 },
    { key: 'slotA_voxSelect.voxPreset', name: 'slotA_voxSelect.voxPreset', id: 0, bit: 376, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxSelect 0', cc: 3 },
    { key: 'slotA_farfSelect.farfisaPreset', name: 'slotA_farfSelect.farfisaPreset', id: 0, bit: 384, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfSelect 0', cc: 3 },
    { key: 'slotA_b3PresetI.b3Sub.morphWheel', name: 'slotA_b3PresetI.b3Sub morph Wheel', id: 0, bit: 392, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 0 · Wheel morph', deltaOf: 'slotA_b3PresetI.b3Sub' },
    { key: 'slotA_b3PresetI.b3Sub.morphAfterTouch', name: 'slotA_b3PresetI.b3Sub morph After Touch', id: 0, bit: 397, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 0 · After Touch morph', deltaOf: 'slotA_b3PresetI.b3Sub' },
    { key: 'slotA_b3PresetI.b3Sub.morphCtrlPedal', name: 'slotA_b3PresetI.b3Sub morph Ctrl Pedal', id: 0, bit: 402, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 0 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b3Sub' },
    { key: 'slotA_b3PresetI.b3Sub', name: 'slotA_b3PresetI.b3Sub', id: 0, bit: 407, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 0', cc: 9 },
    { key: 'slotA_b3PresetI.b3Sub3.morphWheel', name: 'slotA_b3PresetI.b3Sub3 morph Wheel', id: 1, bit: 411, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 1 · Wheel morph', deltaOf: 'slotA_b3PresetI.b3Sub3' },
    { key: 'slotA_b3PresetI.b3Sub3.morphAfterTouch', name: 'slotA_b3PresetI.b3Sub3 morph After Touch', id: 1, bit: 416, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 1 · After Touch morph', deltaOf: 'slotA_b3PresetI.b3Sub3' },
    { key: 'slotA_b3PresetI.b3Sub3.morphCtrlPedal', name: 'slotA_b3PresetI.b3Sub3 morph Ctrl Pedal', id: 1, bit: 421, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 1 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b3Sub3' },
    { key: 'slotA_b3PresetI.b3Sub3', name: 'slotA_b3PresetI.b3Sub3', id: 1, bit: 426, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 1', cc: 14 },
    { key: 'slotA_b3PresetI.b3Fund.morphWheel', name: 'slotA_b3PresetI.b3Fund morph Wheel', id: 2, bit: 430, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 2 · Wheel morph', deltaOf: 'slotA_b3PresetI.b3Fund' },
    { key: 'slotA_b3PresetI.b3Fund.morphAfterTouch', name: 'slotA_b3PresetI.b3Fund morph After Touch', id: 2, bit: 435, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 2 · After Touch morph', deltaOf: 'slotA_b3PresetI.b3Fund' },
    { key: 'slotA_b3PresetI.b3Fund.morphCtrlPedal', name: 'slotA_b3PresetI.b3Fund morph Ctrl Pedal', id: 2, bit: 440, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 2 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b3Fund' },
    { key: 'slotA_b3PresetI.b3Fund', name: 'slotA_b3PresetI.b3Fund', id: 2, bit: 445, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 2', cc: 15 },
    { key: 'slotA_b3PresetI.b32nd.morphWheel', name: 'slotA_b3PresetI.b32nd morph Wheel', id: 3, bit: 449, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 3 · Wheel morph', deltaOf: 'slotA_b3PresetI.b32nd' },
    { key: 'slotA_b3PresetI.b32nd.morphAfterTouch', name: 'slotA_b3PresetI.b32nd morph After Touch', id: 3, bit: 454, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 3 · After Touch morph', deltaOf: 'slotA_b3PresetI.b32nd' },
    { key: 'slotA_b3PresetI.b32nd.morphCtrlPedal', name: 'slotA_b3PresetI.b32nd morph Ctrl Pedal', id: 3, bit: 459, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 3 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b32nd' },
    { key: 'slotA_b3PresetI.b32nd', name: 'slotA_b3PresetI.b32nd', id: 3, bit: 464, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 3', cc: 16 },
    { key: 'slotA_b3PresetI.b33rd.morphWheel', name: 'slotA_b3PresetI.b33rd morph Wheel', id: 4, bit: 468, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 4 · Wheel morph', deltaOf: 'slotA_b3PresetI.b33rd' },
    { key: 'slotA_b3PresetI.b33rd.morphAfterTouch', name: 'slotA_b3PresetI.b33rd morph After Touch', id: 4, bit: 473, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 4 · After Touch morph', deltaOf: 'slotA_b3PresetI.b33rd' },
    { key: 'slotA_b3PresetI.b33rd.morphCtrlPedal', name: 'slotA_b3PresetI.b33rd morph Ctrl Pedal', id: 4, bit: 478, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 4 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b33rd' },
    { key: 'slotA_b3PresetI.b33rd', name: 'slotA_b3PresetI.b33rd', id: 4, bit: 483, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 4', cc: 17 },
    { key: 'slotA_b3PresetI.b34th.morphWheel', name: 'slotA_b3PresetI.b34th morph Wheel', id: 5, bit: 487, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 5 · Wheel morph', deltaOf: 'slotA_b3PresetI.b34th' },
    { key: 'slotA_b3PresetI.b34th.morphAfterTouch', name: 'slotA_b3PresetI.b34th morph After Touch', id: 5, bit: 492, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 5 · After Touch morph', deltaOf: 'slotA_b3PresetI.b34th' },
    { key: 'slotA_b3PresetI.b34th.morphCtrlPedal', name: 'slotA_b3PresetI.b34th morph Ctrl Pedal', id: 5, bit: 497, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 5 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b34th' },
    { key: 'slotA_b3PresetI.b34th', name: 'slotA_b3PresetI.b34th', id: 5, bit: 502, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 5', cc: 18 },
    { key: 'slotA_b3PresetI.b35th.morphWheel', name: 'slotA_b3PresetI.b35th morph Wheel', id: 6, bit: 506, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 6 · Wheel morph', deltaOf: 'slotA_b3PresetI.b35th' },
    { key: 'slotA_b3PresetI.b35th.morphAfterTouch', name: 'slotA_b3PresetI.b35th morph After Touch', id: 6, bit: 511, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 6 · After Touch morph', deltaOf: 'slotA_b3PresetI.b35th' },
    { key: 'slotA_b3PresetI.b35th.morphCtrlPedal', name: 'slotA_b3PresetI.b35th morph Ctrl Pedal', id: 6, bit: 516, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 6 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b35th' },
    { key: 'slotA_b3PresetI.b35th', name: 'slotA_b3PresetI.b35th', id: 6, bit: 521, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 6', cc: 19 },
    { key: 'slotA_b3PresetI.b36th.morphWheel', name: 'slotA_b3PresetI.b36th morph Wheel', id: 7, bit: 525, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 7 · Wheel morph', deltaOf: 'slotA_b3PresetI.b36th' },
    { key: 'slotA_b3PresetI.b36th.morphAfterTouch', name: 'slotA_b3PresetI.b36th morph After Touch', id: 7, bit: 530, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 7 · After Touch morph', deltaOf: 'slotA_b3PresetI.b36th' },
    { key: 'slotA_b3PresetI.b36th.morphCtrlPedal', name: 'slotA_b3PresetI.b36th morph Ctrl Pedal', id: 7, bit: 535, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 7 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b36th' },
    { key: 'slotA_b3PresetI.b36th', name: 'slotA_b3PresetI.b36th', id: 7, bit: 540, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 7', cc: 20 },
    { key: 'slotA_b3PresetI.b38th.morphWheel', name: 'slotA_b3PresetI.b38th morph Wheel', id: 8, bit: 544, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 8 · Wheel morph', deltaOf: 'slotA_b3PresetI.b38th' },
    { key: 'slotA_b3PresetI.b38th.morphAfterTouch', name: 'slotA_b3PresetI.b38th morph After Touch', id: 8, bit: 549, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 8 · After Touch morph', deltaOf: 'slotA_b3PresetI.b38th' },
    { key: 'slotA_b3PresetI.b38th.morphCtrlPedal', name: 'slotA_b3PresetI.b38th morph Ctrl Pedal', id: 8, bit: 554, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 8 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetI.b38th' },
    { key: 'slotA_b3PresetI.b38th', name: 'slotA_b3PresetI.b38th', id: 8, bit: 559, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 8', cc: 21 },
    { key: 'slotA_b3PresetI.b3Vibrato', name: 'slotA_b3PresetI.b3Vibrato', id: 9, bit: 563, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 9', cc: 25 },
    { key: 'slotA_b3PresetI.b3Percussion', name: 'slotA_b3PresetI.b3Percussion', id: 10, bit: 564, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetI 10', cc: 22 },
    { key: 'slotA_voxPresetI.vox16Foot.morphWheel', name: 'slotA_voxPresetI.vox16Foot morph Wheel', id: 0, bit: 576, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 0 · Wheel morph', deltaOf: 'slotA_voxPresetI.vox16Foot' },
    { key: 'slotA_voxPresetI.vox16Foot.morphAfterTouch', name: 'slotA_voxPresetI.vox16Foot morph After Touch', id: 0, bit: 581, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 0 · After Touch morph', deltaOf: 'slotA_voxPresetI.vox16Foot' },
    { key: 'slotA_voxPresetI.vox16Foot.morphCtrlPedal', name: 'slotA_voxPresetI.vox16Foot morph Ctrl Pedal', id: 0, bit: 586, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 0 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.vox16Foot' },
    { key: 'slotA_voxPresetI.vox16Foot', name: 'slotA_voxPresetI.vox16Foot', id: 0, bit: 591, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 0', cc: 9 },
    { key: 'slotA_voxPresetI.vox8Foot.morphWheel', name: 'slotA_voxPresetI.vox8Foot morph Wheel', id: 1, bit: 595, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 1 · Wheel morph', deltaOf: 'slotA_voxPresetI.vox8Foot' },
    { key: 'slotA_voxPresetI.vox8Foot.morphAfterTouch', name: 'slotA_voxPresetI.vox8Foot morph After Touch', id: 1, bit: 600, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 1 · After Touch morph', deltaOf: 'slotA_voxPresetI.vox8Foot' },
    { key: 'slotA_voxPresetI.vox8Foot.morphCtrlPedal', name: 'slotA_voxPresetI.vox8Foot morph Ctrl Pedal', id: 1, bit: 605, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 1 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.vox8Foot' },
    { key: 'slotA_voxPresetI.vox8Foot', name: 'slotA_voxPresetI.vox8Foot', id: 1, bit: 610, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 1', cc: 14 },
    { key: 'slotA_voxPresetI.vox4Foot.morphWheel', name: 'slotA_voxPresetI.vox4Foot morph Wheel', id: 2, bit: 614, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 2 · Wheel morph', deltaOf: 'slotA_voxPresetI.vox4Foot' },
    { key: 'slotA_voxPresetI.vox4Foot.morphAfterTouch', name: 'slotA_voxPresetI.vox4Foot morph After Touch', id: 2, bit: 619, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 2 · After Touch morph', deltaOf: 'slotA_voxPresetI.vox4Foot' },
    { key: 'slotA_voxPresetI.vox4Foot.morphCtrlPedal', name: 'slotA_voxPresetI.vox4Foot morph Ctrl Pedal', id: 2, bit: 624, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 2 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.vox4Foot' },
    { key: 'slotA_voxPresetI.vox4Foot', name: 'slotA_voxPresetI.vox4Foot', id: 2, bit: 629, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 2', cc: 15 },
    { key: 'slotA_voxPresetI.vox2Foot.morphWheel', name: 'slotA_voxPresetI.vox2Foot morph Wheel', id: 3, bit: 633, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 3 · Wheel morph', deltaOf: 'slotA_voxPresetI.vox2Foot' },
    { key: 'slotA_voxPresetI.vox2Foot.morphAfterTouch', name: 'slotA_voxPresetI.vox2Foot morph After Touch', id: 3, bit: 638, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 3 · After Touch morph', deltaOf: 'slotA_voxPresetI.vox2Foot' },
    { key: 'slotA_voxPresetI.vox2Foot.morphCtrlPedal', name: 'slotA_voxPresetI.vox2Foot morph Ctrl Pedal', id: 3, bit: 643, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 3 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.vox2Foot' },
    { key: 'slotA_voxPresetI.vox2Foot', name: 'slotA_voxPresetI.vox2Foot', id: 3, bit: 648, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 3', cc: 16 },
    { key: 'slotA_voxPresetI.voxII.morphWheel', name: 'slotA_voxPresetI.voxII morph Wheel', id: 4, bit: 652, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 4 · Wheel morph', deltaOf: 'slotA_voxPresetI.voxII' },
    { key: 'slotA_voxPresetI.voxII.morphAfterTouch', name: 'slotA_voxPresetI.voxII morph After Touch', id: 4, bit: 657, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 4 · After Touch morph', deltaOf: 'slotA_voxPresetI.voxII' },
    { key: 'slotA_voxPresetI.voxII.morphCtrlPedal', name: 'slotA_voxPresetI.voxII morph Ctrl Pedal', id: 4, bit: 662, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 4 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.voxII' },
    { key: 'slotA_voxPresetI.voxII', name: 'slotA_voxPresetI.voxII', id: 4, bit: 667, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 4', cc: 17 },
    { key: 'slotA_voxPresetI.voxIII.morphWheel', name: 'slotA_voxPresetI.voxIII morph Wheel', id: 5, bit: 671, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 5 · Wheel morph', deltaOf: 'slotA_voxPresetI.voxIII' },
    { key: 'slotA_voxPresetI.voxIII.morphAfterTouch', name: 'slotA_voxPresetI.voxIII morph After Touch', id: 5, bit: 676, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 5 · After Touch morph', deltaOf: 'slotA_voxPresetI.voxIII' },
    { key: 'slotA_voxPresetI.voxIII.morphCtrlPedal', name: 'slotA_voxPresetI.voxIII morph Ctrl Pedal', id: 5, bit: 681, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 5 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.voxIII' },
    { key: 'slotA_voxPresetI.voxIII', name: 'slotA_voxPresetI.voxIII', id: 5, bit: 686, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 5', cc: 18 },
    { key: 'slotA_voxPresetI.voxIV.morphWheel', name: 'slotA_voxPresetI.voxIV morph Wheel', id: 6, bit: 690, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 6 · Wheel morph', deltaOf: 'slotA_voxPresetI.voxIV' },
    { key: 'slotA_voxPresetI.voxIV.morphAfterTouch', name: 'slotA_voxPresetI.voxIV morph After Touch', id: 6, bit: 695, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 6 · After Touch morph', deltaOf: 'slotA_voxPresetI.voxIV' },
    { key: 'slotA_voxPresetI.voxIV.morphCtrlPedal', name: 'slotA_voxPresetI.voxIV morph Ctrl Pedal', id: 6, bit: 700, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 6 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.voxIV' },
    { key: 'slotA_voxPresetI.voxIV', name: 'slotA_voxPresetI.voxIV', id: 6, bit: 705, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 6', cc: 19 },
    { key: 'slotA_voxPresetI.voxSin.morphWheel', name: 'slotA_voxPresetI.voxSin morph Wheel', id: 7, bit: 709, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 7 · Wheel morph', deltaOf: 'slotA_voxPresetI.voxSin' },
    { key: 'slotA_voxPresetI.voxSin.morphAfterTouch', name: 'slotA_voxPresetI.voxSin morph After Touch', id: 7, bit: 714, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 7 · After Touch morph', deltaOf: 'slotA_voxPresetI.voxSin' },
    { key: 'slotA_voxPresetI.voxSin.morphCtrlPedal', name: 'slotA_voxPresetI.voxSin morph Ctrl Pedal', id: 7, bit: 719, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 7 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.voxSin' },
    { key: 'slotA_voxPresetI.voxSin', name: 'slotA_voxPresetI.voxSin', id: 7, bit: 724, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 7', cc: 20 },
    { key: 'slotA_voxPresetI.voxTri.morphWheel', name: 'slotA_voxPresetI.voxTri morph Wheel', id: 8, bit: 728, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 8 · Wheel morph', deltaOf: 'slotA_voxPresetI.voxTri' },
    { key: 'slotA_voxPresetI.voxTri.morphAfterTouch', name: 'slotA_voxPresetI.voxTri morph After Touch', id: 8, bit: 733, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 8 · After Touch morph', deltaOf: 'slotA_voxPresetI.voxTri' },
    { key: 'slotA_voxPresetI.voxTri.morphCtrlPedal', name: 'slotA_voxPresetI.voxTri morph Ctrl Pedal', id: 8, bit: 738, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 8 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetI.voxTri' },
    { key: 'slotA_voxPresetI.voxTri', name: 'slotA_voxPresetI.voxTri', id: 8, bit: 743, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetI 8', cc: 21 },
    { key: 'slotA_farfPresetI.farfisaBass16.morphWheel', name: 'slotA_farfPresetI.farfisaBass16 morph Wheel', id: 0, bit: 760, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 0 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaBass16' },
    { key: 'slotA_farfPresetI.farfisaBass16.morphAfterTouch', name: 'slotA_farfPresetI.farfisaBass16 morph After Touch', id: 0, bit: 762, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 0 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaBass16' },
    { key: 'slotA_farfPresetI.farfisaBass16.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaBass16 morph Ctrl Pedal', id: 0, bit: 764, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 0 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaBass16' },
    { key: 'slotA_farfPresetI.farfisaBass16', name: 'slotA_farfPresetI.farfisaBass16', id: 0, bit: 766, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 0', cc: 9 },
    { key: 'slotA_farfPresetI.farfisaString16.morphWheel', name: 'slotA_farfPresetI.farfisaString16 morph Wheel', id: 1, bit: 767, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 1 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaString16' },
    { key: 'slotA_farfPresetI.farfisaString16.morphAfterTouch', name: 'slotA_farfPresetI.farfisaString16 morph After Touch', id: 1, bit: 769, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 1 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaString16' },
    { key: 'slotA_farfPresetI.farfisaString16.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaString16 morph Ctrl Pedal', id: 1, bit: 771, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 1 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaString16' },
    { key: 'slotA_farfPresetI.farfisaString16', name: 'slotA_farfPresetI.farfisaString16', id: 1, bit: 773, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 1', cc: 14 },
    { key: 'slotA_farfPresetI.farfisaFlute8.morphWheel', name: 'slotA_farfPresetI.farfisaFlute8 morph Wheel', id: 2, bit: 774, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 2 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaFlute8' },
    { key: 'slotA_farfPresetI.farfisaFlute8.morphAfterTouch', name: 'slotA_farfPresetI.farfisaFlute8 morph After Touch', id: 2, bit: 776, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 2 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaFlute8' },
    { key: 'slotA_farfPresetI.farfisaFlute8.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaFlute8 morph Ctrl Pedal', id: 2, bit: 778, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 2 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaFlute8' },
    { key: 'slotA_farfPresetI.farfisaFlute8', name: 'slotA_farfPresetI.farfisaFlute8', id: 2, bit: 780, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 2', cc: 15 },
    { key: 'slotA_farfPresetI.farfisaOboe8.morphWheel', name: 'slotA_farfPresetI.farfisaOboe8 morph Wheel', id: 3, bit: 781, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 3 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaOboe8' },
    { key: 'slotA_farfPresetI.farfisaOboe8.morphAfterTouch', name: 'slotA_farfPresetI.farfisaOboe8 morph After Touch', id: 3, bit: 783, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 3 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaOboe8' },
    { key: 'slotA_farfPresetI.farfisaOboe8.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaOboe8 morph Ctrl Pedal', id: 3, bit: 785, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 3 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaOboe8' },
    { key: 'slotA_farfPresetI.farfisaOboe8', name: 'slotA_farfPresetI.farfisaOboe8', id: 3, bit: 787, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 3', cc: 16 },
    { key: 'slotA_farfPresetI.farfisaTrumpet8.morphWheel', name: 'slotA_farfPresetI.farfisaTrumpet8 morph Wheel', id: 4, bit: 788, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 4 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaTrumpet8' },
    { key: 'slotA_farfPresetI.farfisaTrumpet8.morphAfterTouch', name: 'slotA_farfPresetI.farfisaTrumpet8 morph After Touch', id: 4, bit: 790, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 4 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaTrumpet8' },
    { key: 'slotA_farfPresetI.farfisaTrumpet8.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaTrumpet8 morph Ctrl Pedal', id: 4, bit: 792, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 4 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaTrumpet8' },
    { key: 'slotA_farfPresetI.farfisaTrumpet8', name: 'slotA_farfPresetI.farfisaTrumpet8', id: 4, bit: 794, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 4', cc: 17 },
    { key: 'slotA_farfPresetI.farfisaString8.morphWheel', name: 'slotA_farfPresetI.farfisaString8 morph Wheel', id: 5, bit: 795, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 5 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaString8' },
    { key: 'slotA_farfPresetI.farfisaString8.morphAfterTouch', name: 'slotA_farfPresetI.farfisaString8 morph After Touch', id: 5, bit: 797, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 5 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaString8' },
    { key: 'slotA_farfPresetI.farfisaString8.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaString8 morph Ctrl Pedal', id: 5, bit: 799, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 5 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaString8' },
    { key: 'slotA_farfPresetI.farfisaString8', name: 'slotA_farfPresetI.farfisaString8', id: 5, bit: 801, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 5', cc: 18 },
    { key: 'slotA_farfPresetI.farfisaFlute4.morphWheel', name: 'slotA_farfPresetI.farfisaFlute4 morph Wheel', id: 6, bit: 802, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 6 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaFlute4' },
    { key: 'slotA_farfPresetI.farfisaFlute4.morphAfterTouch', name: 'slotA_farfPresetI.farfisaFlute4 morph After Touch', id: 6, bit: 804, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 6 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaFlute4' },
    { key: 'slotA_farfPresetI.farfisaFlute4.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaFlute4 morph Ctrl Pedal', id: 6, bit: 806, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 6 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaFlute4' },
    { key: 'slotA_farfPresetI.farfisaFlute4', name: 'slotA_farfPresetI.farfisaFlute4', id: 6, bit: 808, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 6', cc: 19 },
    { key: 'slotA_farfPresetI.farfisaString4.morphWheel', name: 'slotA_farfPresetI.farfisaString4 morph Wheel', id: 7, bit: 809, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 7 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisaString4' },
    { key: 'slotA_farfPresetI.farfisaString4.morphAfterTouch', name: 'slotA_farfPresetI.farfisaString4 morph After Touch', id: 7, bit: 811, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 7 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisaString4' },
    { key: 'slotA_farfPresetI.farfisaString4.morphCtrlPedal', name: 'slotA_farfPresetI.farfisaString4 morph Ctrl Pedal', id: 7, bit: 813, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 7 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisaString4' },
    { key: 'slotA_farfPresetI.farfisaString4', name: 'slotA_farfPresetI.farfisaString4', id: 7, bit: 815, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 7', cc: 20 },
    { key: 'slotA_farfPresetI.farfisa223.morphWheel', name: 'slotA_farfPresetI.farfisa223 morph Wheel', id: 8, bit: 816, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 8 · Wheel morph', deltaOf: 'slotA_farfPresetI.farfisa223' },
    { key: 'slotA_farfPresetI.farfisa223.morphAfterTouch', name: 'slotA_farfPresetI.farfisa223 morph After Touch', id: 8, bit: 818, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 8 · After Touch morph', deltaOf: 'slotA_farfPresetI.farfisa223' },
    { key: 'slotA_farfPresetI.farfisa223.morphCtrlPedal', name: 'slotA_farfPresetI.farfisa223 morph Ctrl Pedal', id: 8, bit: 820, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 8 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetI.farfisa223' },
    { key: 'slotA_farfPresetI.farfisa223', name: 'slotA_farfPresetI.farfisa223', id: 8, bit: 822, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetI 8', cc: 21 },
    { key: 'slotA_b3PresetII.b3Sub.morphWheel', name: 'slotA_b3PresetII.b3Sub morph Wheel', id: 0, bit: 832, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 0 · Wheel morph', deltaOf: 'slotA_b3PresetII.b3Sub' },
    { key: 'slotA_b3PresetII.b3Sub.morphAfterTouch', name: 'slotA_b3PresetII.b3Sub morph After Touch', id: 0, bit: 837, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 0 · After Touch morph', deltaOf: 'slotA_b3PresetII.b3Sub' },
    { key: 'slotA_b3PresetII.b3Sub.morphCtrlPedal', name: 'slotA_b3PresetII.b3Sub morph Ctrl Pedal', id: 0, bit: 842, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 0 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b3Sub' },
    { key: 'slotA_b3PresetII.b3Sub', name: 'slotA_b3PresetII.b3Sub', id: 0, bit: 847, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 0', cc: 9 },
    { key: 'slotA_b3PresetII.b3Sub3.morphWheel', name: 'slotA_b3PresetII.b3Sub3 morph Wheel', id: 1, bit: 851, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 1 · Wheel morph', deltaOf: 'slotA_b3PresetII.b3Sub3' },
    { key: 'slotA_b3PresetII.b3Sub3.morphAfterTouch', name: 'slotA_b3PresetII.b3Sub3 morph After Touch', id: 1, bit: 856, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 1 · After Touch morph', deltaOf: 'slotA_b3PresetII.b3Sub3' },
    { key: 'slotA_b3PresetII.b3Sub3.morphCtrlPedal', name: 'slotA_b3PresetII.b3Sub3 morph Ctrl Pedal', id: 1, bit: 861, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 1 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b3Sub3' },
    { key: 'slotA_b3PresetII.b3Sub3', name: 'slotA_b3PresetII.b3Sub3', id: 1, bit: 866, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 1', cc: 14 },
    { key: 'slotA_b3PresetII.b3Fund.morphWheel', name: 'slotA_b3PresetII.b3Fund morph Wheel', id: 2, bit: 870, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 2 · Wheel morph', deltaOf: 'slotA_b3PresetII.b3Fund' },
    { key: 'slotA_b3PresetII.b3Fund.morphAfterTouch', name: 'slotA_b3PresetII.b3Fund morph After Touch', id: 2, bit: 875, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 2 · After Touch morph', deltaOf: 'slotA_b3PresetII.b3Fund' },
    { key: 'slotA_b3PresetII.b3Fund.morphCtrlPedal', name: 'slotA_b3PresetII.b3Fund morph Ctrl Pedal', id: 2, bit: 880, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 2 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b3Fund' },
    { key: 'slotA_b3PresetII.b3Fund', name: 'slotA_b3PresetII.b3Fund', id: 2, bit: 885, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 2', cc: 15 },
    { key: 'slotA_b3PresetII.b32nd.morphWheel', name: 'slotA_b3PresetII.b32nd morph Wheel', id: 3, bit: 889, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 3 · Wheel morph', deltaOf: 'slotA_b3PresetII.b32nd' },
    { key: 'slotA_b3PresetII.b32nd.morphAfterTouch', name: 'slotA_b3PresetII.b32nd morph After Touch', id: 3, bit: 894, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 3 · After Touch morph', deltaOf: 'slotA_b3PresetII.b32nd' },
    { key: 'slotA_b3PresetII.b32nd.morphCtrlPedal', name: 'slotA_b3PresetII.b32nd morph Ctrl Pedal', id: 3, bit: 899, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 3 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b32nd' },
    { key: 'slotA_b3PresetII.b32nd', name: 'slotA_b3PresetII.b32nd', id: 3, bit: 904, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 3', cc: 16 },
    { key: 'slotA_b3PresetII.b33rd.morphWheel', name: 'slotA_b3PresetII.b33rd morph Wheel', id: 4, bit: 908, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 4 · Wheel morph', deltaOf: 'slotA_b3PresetII.b33rd' },
    { key: 'slotA_b3PresetII.b33rd.morphAfterTouch', name: 'slotA_b3PresetII.b33rd morph After Touch', id: 4, bit: 913, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 4 · After Touch morph', deltaOf: 'slotA_b3PresetII.b33rd' },
    { key: 'slotA_b3PresetII.b33rd.morphCtrlPedal', name: 'slotA_b3PresetII.b33rd morph Ctrl Pedal', id: 4, bit: 918, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 4 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b33rd' },
    { key: 'slotA_b3PresetII.b33rd', name: 'slotA_b3PresetII.b33rd', id: 4, bit: 923, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 4', cc: 17 },
    { key: 'slotA_b3PresetII.b34th.morphWheel', name: 'slotA_b3PresetII.b34th morph Wheel', id: 5, bit: 927, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 5 · Wheel morph', deltaOf: 'slotA_b3PresetII.b34th' },
    { key: 'slotA_b3PresetII.b34th.morphAfterTouch', name: 'slotA_b3PresetII.b34th morph After Touch', id: 5, bit: 932, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 5 · After Touch morph', deltaOf: 'slotA_b3PresetII.b34th' },
    { key: 'slotA_b3PresetII.b34th.morphCtrlPedal', name: 'slotA_b3PresetII.b34th morph Ctrl Pedal', id: 5, bit: 937, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 5 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b34th' },
    { key: 'slotA_b3PresetII.b34th', name: 'slotA_b3PresetII.b34th', id: 5, bit: 942, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 5', cc: 18 },
    { key: 'slotA_b3PresetII.b35th.morphWheel', name: 'slotA_b3PresetII.b35th morph Wheel', id: 6, bit: 946, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 6 · Wheel morph', deltaOf: 'slotA_b3PresetII.b35th' },
    { key: 'slotA_b3PresetII.b35th.morphAfterTouch', name: 'slotA_b3PresetII.b35th morph After Touch', id: 6, bit: 951, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 6 · After Touch morph', deltaOf: 'slotA_b3PresetII.b35th' },
    { key: 'slotA_b3PresetII.b35th.morphCtrlPedal', name: 'slotA_b3PresetII.b35th morph Ctrl Pedal', id: 6, bit: 956, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 6 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b35th' },
    { key: 'slotA_b3PresetII.b35th', name: 'slotA_b3PresetII.b35th', id: 6, bit: 961, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 6', cc: 19 },
    { key: 'slotA_b3PresetII.b36th.morphWheel', name: 'slotA_b3PresetII.b36th morph Wheel', id: 7, bit: 965, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 7 · Wheel morph', deltaOf: 'slotA_b3PresetII.b36th' },
    { key: 'slotA_b3PresetII.b36th.morphAfterTouch', name: 'slotA_b3PresetII.b36th morph After Touch', id: 7, bit: 970, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 7 · After Touch morph', deltaOf: 'slotA_b3PresetII.b36th' },
    { key: 'slotA_b3PresetII.b36th.morphCtrlPedal', name: 'slotA_b3PresetII.b36th morph Ctrl Pedal', id: 7, bit: 975, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 7 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b36th' },
    { key: 'slotA_b3PresetII.b36th', name: 'slotA_b3PresetII.b36th', id: 7, bit: 980, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 7', cc: 20 },
    { key: 'slotA_b3PresetII.b38th.morphWheel', name: 'slotA_b3PresetII.b38th morph Wheel', id: 8, bit: 984, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 8 · Wheel morph', deltaOf: 'slotA_b3PresetII.b38th' },
    { key: 'slotA_b3PresetII.b38th.morphAfterTouch', name: 'slotA_b3PresetII.b38th morph After Touch', id: 8, bit: 989, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 8 · After Touch morph', deltaOf: 'slotA_b3PresetII.b38th' },
    { key: 'slotA_b3PresetII.b38th.morphCtrlPedal', name: 'slotA_b3PresetII.b38th morph Ctrl Pedal', id: 8, bit: 994, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 8 · Ctrl Pedal morph', deltaOf: 'slotA_b3PresetII.b38th' },
    { key: 'slotA_b3PresetII.b38th', name: 'slotA_b3PresetII.b38th', id: 8, bit: 999, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 8', cc: 21 },
    { key: 'slotA_b3PresetII.b3Vibrato', name: 'slotA_b3PresetII.b3Vibrato', id: 9, bit: 1003, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 9', cc: 25 },
    { key: 'slotA_b3PresetII.b3Percussion', name: 'slotA_b3PresetII.b3Percussion', id: 10, bit: 1004, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_b3PresetII 10', cc: 22 },
    { key: 'slotA_voxPresetII.vox16Foot.morphWheel', name: 'slotA_voxPresetII.vox16Foot morph Wheel', id: 0, bit: 1016, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 0 · Wheel morph', deltaOf: 'slotA_voxPresetII.vox16Foot' },
    { key: 'slotA_voxPresetII.vox16Foot.morphAfterTouch', name: 'slotA_voxPresetII.vox16Foot morph After Touch', id: 0, bit: 1021, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 0 · After Touch morph', deltaOf: 'slotA_voxPresetII.vox16Foot' },
    { key: 'slotA_voxPresetII.vox16Foot.morphCtrlPedal', name: 'slotA_voxPresetII.vox16Foot morph Ctrl Pedal', id: 0, bit: 1026, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 0 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.vox16Foot' },
    { key: 'slotA_voxPresetII.vox16Foot', name: 'slotA_voxPresetII.vox16Foot', id: 0, bit: 1031, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 0', cc: 9 },
    { key: 'slotA_voxPresetII.vox8Foot.morphWheel', name: 'slotA_voxPresetII.vox8Foot morph Wheel', id: 1, bit: 1035, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 1 · Wheel morph', deltaOf: 'slotA_voxPresetII.vox8Foot' },
    { key: 'slotA_voxPresetII.vox8Foot.morphAfterTouch', name: 'slotA_voxPresetII.vox8Foot morph After Touch', id: 1, bit: 1040, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 1 · After Touch morph', deltaOf: 'slotA_voxPresetII.vox8Foot' },
    { key: 'slotA_voxPresetII.vox8Foot.morphCtrlPedal', name: 'slotA_voxPresetII.vox8Foot morph Ctrl Pedal', id: 1, bit: 1045, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 1 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.vox8Foot' },
    { key: 'slotA_voxPresetII.vox8Foot', name: 'slotA_voxPresetII.vox8Foot', id: 1, bit: 1050, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 1', cc: 14 },
    { key: 'slotA_voxPresetII.vox4Foot.morphWheel', name: 'slotA_voxPresetII.vox4Foot morph Wheel', id: 2, bit: 1054, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 2 · Wheel morph', deltaOf: 'slotA_voxPresetII.vox4Foot' },
    { key: 'slotA_voxPresetII.vox4Foot.morphAfterTouch', name: 'slotA_voxPresetII.vox4Foot morph After Touch', id: 2, bit: 1059, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 2 · After Touch morph', deltaOf: 'slotA_voxPresetII.vox4Foot' },
    { key: 'slotA_voxPresetII.vox4Foot.morphCtrlPedal', name: 'slotA_voxPresetII.vox4Foot morph Ctrl Pedal', id: 2, bit: 1064, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 2 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.vox4Foot' },
    { key: 'slotA_voxPresetII.vox4Foot', name: 'slotA_voxPresetII.vox4Foot', id: 2, bit: 1069, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 2', cc: 15 },
    { key: 'slotA_voxPresetII.vox2Foot.morphWheel', name: 'slotA_voxPresetII.vox2Foot morph Wheel', id: 3, bit: 1073, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 3 · Wheel morph', deltaOf: 'slotA_voxPresetII.vox2Foot' },
    { key: 'slotA_voxPresetII.vox2Foot.morphAfterTouch', name: 'slotA_voxPresetII.vox2Foot morph After Touch', id: 3, bit: 1078, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 3 · After Touch morph', deltaOf: 'slotA_voxPresetII.vox2Foot' },
    { key: 'slotA_voxPresetII.vox2Foot.morphCtrlPedal', name: 'slotA_voxPresetII.vox2Foot morph Ctrl Pedal', id: 3, bit: 1083, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 3 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.vox2Foot' },
    { key: 'slotA_voxPresetII.vox2Foot', name: 'slotA_voxPresetII.vox2Foot', id: 3, bit: 1088, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 3', cc: 16 },
    { key: 'slotA_voxPresetII.voxII.morphWheel', name: 'slotA_voxPresetII.voxII morph Wheel', id: 4, bit: 1092, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 4 · Wheel morph', deltaOf: 'slotA_voxPresetII.voxII' },
    { key: 'slotA_voxPresetII.voxII.morphAfterTouch', name: 'slotA_voxPresetII.voxII morph After Touch', id: 4, bit: 1097, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 4 · After Touch morph', deltaOf: 'slotA_voxPresetII.voxII' },
    { key: 'slotA_voxPresetII.voxII.morphCtrlPedal', name: 'slotA_voxPresetII.voxII morph Ctrl Pedal', id: 4, bit: 1102, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 4 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.voxII' },
    { key: 'slotA_voxPresetII.voxII', name: 'slotA_voxPresetII.voxII', id: 4, bit: 1107, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 4', cc: 17 },
    { key: 'slotA_voxPresetII.voxIII.morphWheel', name: 'slotA_voxPresetII.voxIII morph Wheel', id: 5, bit: 1111, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 5 · Wheel morph', deltaOf: 'slotA_voxPresetII.voxIII' },
    { key: 'slotA_voxPresetII.voxIII.morphAfterTouch', name: 'slotA_voxPresetII.voxIII morph After Touch', id: 5, bit: 1116, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 5 · After Touch morph', deltaOf: 'slotA_voxPresetII.voxIII' },
    { key: 'slotA_voxPresetII.voxIII.morphCtrlPedal', name: 'slotA_voxPresetII.voxIII morph Ctrl Pedal', id: 5, bit: 1121, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 5 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.voxIII' },
    { key: 'slotA_voxPresetII.voxIII', name: 'slotA_voxPresetII.voxIII', id: 5, bit: 1126, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 5', cc: 18 },
    { key: 'slotA_voxPresetII.voxIV.morphWheel', name: 'slotA_voxPresetII.voxIV morph Wheel', id: 6, bit: 1130, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 6 · Wheel morph', deltaOf: 'slotA_voxPresetII.voxIV' },
    { key: 'slotA_voxPresetII.voxIV.morphAfterTouch', name: 'slotA_voxPresetII.voxIV morph After Touch', id: 6, bit: 1135, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 6 · After Touch morph', deltaOf: 'slotA_voxPresetII.voxIV' },
    { key: 'slotA_voxPresetII.voxIV.morphCtrlPedal', name: 'slotA_voxPresetII.voxIV morph Ctrl Pedal', id: 6, bit: 1140, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 6 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.voxIV' },
    { key: 'slotA_voxPresetII.voxIV', name: 'slotA_voxPresetII.voxIV', id: 6, bit: 1145, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 6', cc: 19 },
    { key: 'slotA_voxPresetII.voxSin.morphWheel', name: 'slotA_voxPresetII.voxSin morph Wheel', id: 7, bit: 1149, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 7 · Wheel morph', deltaOf: 'slotA_voxPresetII.voxSin' },
    { key: 'slotA_voxPresetII.voxSin.morphAfterTouch', name: 'slotA_voxPresetII.voxSin morph After Touch', id: 7, bit: 1154, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 7 · After Touch morph', deltaOf: 'slotA_voxPresetII.voxSin' },
    { key: 'slotA_voxPresetII.voxSin.morphCtrlPedal', name: 'slotA_voxPresetII.voxSin morph Ctrl Pedal', id: 7, bit: 1159, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 7 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.voxSin' },
    { key: 'slotA_voxPresetII.voxSin', name: 'slotA_voxPresetII.voxSin', id: 7, bit: 1164, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 7', cc: 20 },
    { key: 'slotA_voxPresetII.voxTri.morphWheel', name: 'slotA_voxPresetII.voxTri morph Wheel', id: 8, bit: 1168, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 8 · Wheel morph', deltaOf: 'slotA_voxPresetII.voxTri' },
    { key: 'slotA_voxPresetII.voxTri.morphAfterTouch', name: 'slotA_voxPresetII.voxTri morph After Touch', id: 8, bit: 1173, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 8 · After Touch morph', deltaOf: 'slotA_voxPresetII.voxTri' },
    { key: 'slotA_voxPresetII.voxTri.morphCtrlPedal', name: 'slotA_voxPresetII.voxTri morph Ctrl Pedal', id: 8, bit: 1178, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 8 · Ctrl Pedal morph', deltaOf: 'slotA_voxPresetII.voxTri' },
    { key: 'slotA_voxPresetII.voxTri', name: 'slotA_voxPresetII.voxTri', id: 8, bit: 1183, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_voxPresetII 8', cc: 21 },
    { key: 'slotA_farfPresetII.farfisaBass16.morphWheel', name: 'slotA_farfPresetII.farfisaBass16 morph Wheel', id: 0, bit: 1200, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 0 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaBass16' },
    { key: 'slotA_farfPresetII.farfisaBass16.morphAfterTouch', name: 'slotA_farfPresetII.farfisaBass16 morph After Touch', id: 0, bit: 1202, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 0 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaBass16' },
    { key: 'slotA_farfPresetII.farfisaBass16.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaBass16 morph Ctrl Pedal', id: 0, bit: 1204, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 0 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaBass16' },
    { key: 'slotA_farfPresetII.farfisaBass16', name: 'slotA_farfPresetII.farfisaBass16', id: 0, bit: 1206, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 0', cc: 9 },
    { key: 'slotA_farfPresetII.farfisaString16.morphWheel', name: 'slotA_farfPresetII.farfisaString16 morph Wheel', id: 1, bit: 1207, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 1 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaString16' },
    { key: 'slotA_farfPresetII.farfisaString16.morphAfterTouch', name: 'slotA_farfPresetII.farfisaString16 morph After Touch', id: 1, bit: 1209, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 1 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaString16' },
    { key: 'slotA_farfPresetII.farfisaString16.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaString16 morph Ctrl Pedal', id: 1, bit: 1211, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 1 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaString16' },
    { key: 'slotA_farfPresetII.farfisaString16', name: 'slotA_farfPresetII.farfisaString16', id: 1, bit: 1213, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 1', cc: 14 },
    { key: 'slotA_farfPresetII.farfisaFlute8.morphWheel', name: 'slotA_farfPresetII.farfisaFlute8 morph Wheel', id: 2, bit: 1214, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 2 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaFlute8' },
    { key: 'slotA_farfPresetII.farfisaFlute8.morphAfterTouch', name: 'slotA_farfPresetII.farfisaFlute8 morph After Touch', id: 2, bit: 1216, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 2 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaFlute8' },
    { key: 'slotA_farfPresetII.farfisaFlute8.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaFlute8 morph Ctrl Pedal', id: 2, bit: 1218, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 2 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaFlute8' },
    { key: 'slotA_farfPresetII.farfisaFlute8', name: 'slotA_farfPresetII.farfisaFlute8', id: 2, bit: 1220, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 2', cc: 15 },
    { key: 'slotA_farfPresetII.farfisaOboe8.morphWheel', name: 'slotA_farfPresetII.farfisaOboe8 morph Wheel', id: 3, bit: 1221, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 3 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaOboe8' },
    { key: 'slotA_farfPresetII.farfisaOboe8.morphAfterTouch', name: 'slotA_farfPresetII.farfisaOboe8 morph After Touch', id: 3, bit: 1223, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 3 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaOboe8' },
    { key: 'slotA_farfPresetII.farfisaOboe8.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaOboe8 morph Ctrl Pedal', id: 3, bit: 1225, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 3 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaOboe8' },
    { key: 'slotA_farfPresetII.farfisaOboe8', name: 'slotA_farfPresetII.farfisaOboe8', id: 3, bit: 1227, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 3', cc: 16 },
    { key: 'slotA_farfPresetII.farfisaTrumpet8.morphWheel', name: 'slotA_farfPresetII.farfisaTrumpet8 morph Wheel', id: 4, bit: 1228, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 4 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaTrumpet8' },
    { key: 'slotA_farfPresetII.farfisaTrumpet8.morphAfterTouch', name: 'slotA_farfPresetII.farfisaTrumpet8 morph After Touch', id: 4, bit: 1230, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 4 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaTrumpet8' },
    { key: 'slotA_farfPresetII.farfisaTrumpet8.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaTrumpet8 morph Ctrl Pedal', id: 4, bit: 1232, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 4 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaTrumpet8' },
    { key: 'slotA_farfPresetII.farfisaTrumpet8', name: 'slotA_farfPresetII.farfisaTrumpet8', id: 4, bit: 1234, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 4', cc: 17 },
    { key: 'slotA_farfPresetII.farfisaString8.morphWheel', name: 'slotA_farfPresetII.farfisaString8 morph Wheel', id: 5, bit: 1235, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 5 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaString8' },
    { key: 'slotA_farfPresetII.farfisaString8.morphAfterTouch', name: 'slotA_farfPresetII.farfisaString8 morph After Touch', id: 5, bit: 1237, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 5 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaString8' },
    { key: 'slotA_farfPresetII.farfisaString8.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaString8 morph Ctrl Pedal', id: 5, bit: 1239, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 5 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaString8' },
    { key: 'slotA_farfPresetII.farfisaString8', name: 'slotA_farfPresetII.farfisaString8', id: 5, bit: 1241, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 5', cc: 18 },
    { key: 'slotA_farfPresetII.farfisaFlute4.morphWheel', name: 'slotA_farfPresetII.farfisaFlute4 morph Wheel', id: 6, bit: 1242, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 6 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaFlute4' },
    { key: 'slotA_farfPresetII.farfisaFlute4.morphAfterTouch', name: 'slotA_farfPresetII.farfisaFlute4 morph After Touch', id: 6, bit: 1244, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 6 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaFlute4' },
    { key: 'slotA_farfPresetII.farfisaFlute4.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaFlute4 morph Ctrl Pedal', id: 6, bit: 1246, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 6 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaFlute4' },
    { key: 'slotA_farfPresetII.farfisaFlute4', name: 'slotA_farfPresetII.farfisaFlute4', id: 6, bit: 1248, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 6', cc: 19 },
    { key: 'slotA_farfPresetII.farfisaString4.morphWheel', name: 'slotA_farfPresetII.farfisaString4 morph Wheel', id: 7, bit: 1249, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 7 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisaString4' },
    { key: 'slotA_farfPresetII.farfisaString4.morphAfterTouch', name: 'slotA_farfPresetII.farfisaString4 morph After Touch', id: 7, bit: 1251, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 7 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisaString4' },
    { key: 'slotA_farfPresetII.farfisaString4.morphCtrlPedal', name: 'slotA_farfPresetII.farfisaString4 morph Ctrl Pedal', id: 7, bit: 1253, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 7 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisaString4' },
    { key: 'slotA_farfPresetII.farfisaString4', name: 'slotA_farfPresetII.farfisaString4', id: 7, bit: 1255, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 7', cc: 20 },
    { key: 'slotA_farfPresetII.farfisa223.morphWheel', name: 'slotA_farfPresetII.farfisa223 morph Wheel', id: 8, bit: 1256, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 8 · Wheel morph', deltaOf: 'slotA_farfPresetII.farfisa223' },
    { key: 'slotA_farfPresetII.farfisa223.morphAfterTouch', name: 'slotA_farfPresetII.farfisa223 morph After Touch', id: 8, bit: 1258, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 8 · After Touch morph', deltaOf: 'slotA_farfPresetII.farfisa223' },
    { key: 'slotA_farfPresetII.farfisa223.morphCtrlPedal', name: 'slotA_farfPresetII.farfisa223 morph Ctrl Pedal', id: 8, bit: 1260, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 8 · Ctrl Pedal morph', deltaOf: 'slotA_farfPresetII.farfisa223' },
    { key: 'slotA_farfPresetII.farfisa223', name: 'slotA_farfPresetII.farfisa223', id: 8, bit: 1262, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_farfPresetII 8', cc: 21 },
    { key: 'slotA_piano.param0', name: 'slotA_piano.param0', id: 0, bit: 1272, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 0', cc: 8 },
    { key: 'slotA_piano.param2', name: 'slotA_piano.param2', id: 2, bit: 1275, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 2' },
    { key: 'slotA_piano.param3', name: 'slotA_piano.param3', id: 3, bit: 1282, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 3', cc: 65 },
    { key: 'slotA_piano.pianoAcoustic', name: 'slotA_piano.pianoAcoustic', id: 4, bit: 1289, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 4', cc: 98 },
    { key: 'slotA_piano.pianoPedalNoise', name: 'slotA_piano.pianoPedalNoise', id: 5, bit: 1291, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 5', cc: 108 },
    { key: 'slotA_piano.pianoDynamics', name: 'slotA_piano.pianoDynamics', id: 6, bit: 1292, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 6', cc: 33 },
    { key: 'slotA_piano.clavinetEQMode', name: 'slotA_piano.clavinetEQMode', id: 7, bit: 1294, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 7', cc: 30 },
    { key: 'slotA_piano.clavinetEQMode8', name: 'slotA_piano.clavinetEQMode8', id: 8, bit: 1296, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 8', cc: 31 },
    { key: 'slotA_piano.param9', name: 'slotA_piano.param9', id: 9, bit: 1298, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 9' },
    { key: 'slotA_piano.param10', name: 'slotA_piano.param10', id: 10, bit: 1313, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 10' },
    { key: 'slotA_piano.param11', name: 'slotA_piano.param11', id: 11, bit: 1328, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_piano 11' },
    { key: 'slotA_arpLfo.arpeggiatorRun', name: 'slotA_arpLfo.arpeggiatorRun', id: 1, bit: 1375, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 1', cc: 109 },
    { key: 'slotA_arpLfo.arpeggiatorMstClk', name: 'slotA_arpLfo.arpeggiatorMstClk', id: 2, bit: 1376, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 2', cc: 12 },
    { key: 'slotA_arpLfo.arpeggiatorMstClkDiv', name: 'slotA_arpLfo.arpeggiatorMstClkDiv', id: 3, bit: 1377, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 3', cc: 102 },
    { key: 'slotA_arpLfo.arpeggiatorRate', name: 'slotA_arpLfo.arpeggiatorRate', id: 4, bit: 1381, width: 8, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 4', cc: 102 },
    { key: 'slotA_arpLfo.arpeggiatorPattern', name: 'slotA_arpLfo.arpeggiatorPattern', id: 5, bit: 1389, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 5', cc: 103 },
    { key: 'slotA_arpLfo.arpeggiatorRange', name: 'slotA_arpLfo.arpeggiatorRange', id: 6, bit: 1391, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 6', cc: 104 },
    { key: 'slotA_arpLfo.lFOMstClk', name: 'slotA_arpLfo.lFOMstClk', id: 7, bit: 1393, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 7', cc: 13 },
    { key: 'slotA_arpLfo.lFOMstClkDiv', name: 'slotA_arpLfo.lFOMstClkDiv', id: 8, bit: 1394, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 8', cc: 115 },
    { key: 'slotA_arpLfo.holdState', name: 'slotA_arpLfo.holdState', id: 9, bit: 1398, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_arpLfo 9', cc: 110 },
    { key: 'slotA_synth.modEnvelopeAttack', name: 'slotA_synth.modEnvelopeAttack', id: 0, bit: 1416, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 0', cc: 39 },
    { key: 'slotA_synth.modEnvelopeDecay', name: 'slotA_synth.modEnvelopeDecay', id: 1, bit: 1423, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 1', cc: 40 },
    { key: 'slotA_synth.modEnvelopeRelease', name: 'slotA_synth.modEnvelopeRelease', id: 2, bit: 1430, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 2', cc: 41 },
    { key: 'slotA_synth.modEnvelopeVelocity', name: 'slotA_synth.modEnvelopeVelocity', id: 3, bit: 1437, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 3', cc: 42 },
    { key: 'slotA_synth.param4', name: 'slotA_synth.param4', id: 4, bit: 1438, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 4', cc: 43 },
    { key: 'slotA_synth.param5', name: 'slotA_synth.param5', id: 5, bit: 1441, width: 10, min: 0, max: 999, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 5', cc: 44 },
    { key: 'slotA_synth.oscShape.morphWheel', name: 'slotA_synth.oscShape morph Wheel', id: 6, bit: 1451, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 6 · Wheel morph', deltaOf: 'slotA_synth.oscShape' },
    { key: 'slotA_synth.oscShape.morphAfterTouch', name: 'slotA_synth.oscShape morph After Touch', id: 6, bit: 1459, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 6 · After Touch morph', deltaOf: 'slotA_synth.oscShape' },
    { key: 'slotA_synth.oscShape.morphCtrlPedal', name: 'slotA_synth.oscShape morph Ctrl Pedal', id: 6, bit: 1467, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 6 · Ctrl Pedal morph', deltaOf: 'slotA_synth.oscShape' },
    { key: 'slotA_synth.oscShape', name: 'slotA_synth.oscShape', id: 6, bit: 1475, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 6', cc: 45 },
    { key: 'slotA_synth.shapeModAmount', name: 'slotA_synth.shapeModAmount', id: 7, bit: 1482, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 7', cc: 46 },
    { key: 'slotA_synth.oscDetune.morphWheel', name: 'slotA_synth.oscDetune morph Wheel', id: 8, bit: 1489, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 8 · Wheel morph', deltaOf: 'slotA_synth.oscDetune' },
    { key: 'slotA_synth.oscDetune.morphAfterTouch', name: 'slotA_synth.oscDetune morph After Touch', id: 8, bit: 1497, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 8 · After Touch morph', deltaOf: 'slotA_synth.oscDetune' },
    { key: 'slotA_synth.oscDetune.morphCtrlPedal', name: 'slotA_synth.oscDetune morph Ctrl Pedal', id: 8, bit: 1505, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 8 · Ctrl Pedal morph', deltaOf: 'slotA_synth.oscDetune' },
    { key: 'slotA_synth.oscDetune', name: 'slotA_synth.oscDetune', id: 8, bit: 1513, width: 7, min: 0, max: 24, def: 12, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 8', cc: 45 },
    { key: 'slotA_synth.sampSkipAttack.morphWheel', name: 'slotA_synth.sampSkipAttack morph Wheel', id: 9, bit: 1520, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 9 · Wheel morph', deltaOf: 'slotA_synth.sampSkipAttack' },
    { key: 'slotA_synth.sampSkipAttack.morphAfterTouch', name: 'slotA_synth.sampSkipAttack morph After Touch', id: 9, bit: 1522, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 9 · After Touch morph', deltaOf: 'slotA_synth.sampSkipAttack' },
    { key: 'slotA_synth.sampSkipAttack.morphCtrlPedal', name: 'slotA_synth.sampSkipAttack morph Ctrl Pedal', id: 9, bit: 1524, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 9 · Ctrl Pedal morph', deltaOf: 'slotA_synth.sampSkipAttack' },
    { key: 'slotA_synth.sampSkipAttack', name: 'slotA_synth.sampSkipAttack', id: 9, bit: 1526, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 9', cc: 45 },
    { key: 'slotA_synth.filterFrequency.morphWheel', name: 'slotA_synth.filterFrequency morph Wheel', id: 10, bit: 1527, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 10 · Wheel morph', deltaOf: 'slotA_synth.filterFrequency' },
    { key: 'slotA_synth.filterFrequency.morphAfterTouch', name: 'slotA_synth.filterFrequency morph After Touch', id: 10, bit: 1535, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 10 · After Touch morph', deltaOf: 'slotA_synth.filterFrequency' },
    { key: 'slotA_synth.filterFrequency.morphCtrlPedal', name: 'slotA_synth.filterFrequency morph Ctrl Pedal', id: 10, bit: 1543, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 10 · Ctrl Pedal morph', deltaOf: 'slotA_synth.filterFrequency' },
    { key: 'slotA_synth.filterFrequency', name: 'slotA_synth.filterFrequency', id: 10, bit: 1551, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 10', cc: 48 },
    { key: 'slotA_synth.filterResonance', name: 'slotA_synth.filterResonance', id: 11, bit: 1558, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 11', cc: 49 },
    { key: 'slotA_synth.fltFreqMod2Amount', name: 'slotA_synth.fltFreqMod2Amount', id: 12, bit: 1565, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 12', cc: 2 },
    { key: 'slotA_synth.fltFreqMod1Amount', name: 'slotA_synth.fltFreqMod1Amount', id: 13, bit: 1572, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 13', cc: 51 },
    { key: 'slotA_synth.fltKBTTrack', name: 'slotA_synth.fltKBTTrack', id: 14, bit: 1579, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 14', cc: 52 },
    { key: 'slotA_synth.filterMode', name: 'slotA_synth.filterMode', id: 15, bit: 1580, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 15', cc: 53 },
    { key: 'slotA_synth.ampEnvelopeAttack', name: 'slotA_synth.ampEnvelopeAttack', id: 16, bit: 1583, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 16', cc: 54 },
    { key: 'slotA_synth.ampEnvelopeDecay', name: 'slotA_synth.ampEnvelopeDecay', id: 17, bit: 1590, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 17', cc: 55 },
    { key: 'slotA_synth.ampEnvelopeRelease', name: 'slotA_synth.ampEnvelopeRelease', id: 18, bit: 1597, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 18', cc: 56 },
    { key: 'slotA_synth.ampEnvelopeVelocity', name: 'slotA_synth.ampEnvelopeVelocity', id: 19, bit: 1604, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 19', cc: 57 },
    { key: 'slotA_synth.lFORate', name: 'slotA_synth.lFORate', id: 20, bit: 1605, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 20', cc: 115 },
    { key: 'slotA_synth.lFOWave', name: 'slotA_synth.lFOWave', id: 21, bit: 1612, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 21', cc: 116 },
    { key: 'slotA_synth.param22', name: 'slotA_synth.param22', id: 22, bit: 1614, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 22' },
    { key: 'slotA_synth.param23', name: 'slotA_synth.param23', id: 23, bit: 1629, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 23' },
    { key: 'slotA_synth.param24', name: 'slotA_synth.param24', id: 24, bit: 1644, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 24' },
    { key: 'slotA_synth.glideRate', name: 'slotA_synth.glideRate', id: 25, bit: 1646, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 25', cc: 34 },
    { key: 'slotA_synth.voiceMode', name: 'slotA_synth.voiceMode', id: 26, bit: 1653, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 26', cc: 36 },
    { key: 'slotA_synth.unisonMode', name: 'slotA_synth.unisonMode', id: 27, bit: 1655, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 27', cc: 37 },
    { key: 'slotA_synth.vibratoMode', name: 'slotA_synth.vibratoMode', id: 28, bit: 1658, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_synth 28', cc: 38 },
    { key: 'slotA_extern.param0', name: 'slotA_extern.param0', id: 0, bit: 1672, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 0' },
    { key: 'slotA_extern.param1', name: 'slotA_extern.param1', id: 1, bit: 1674, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 1' },
    { key: 'slotA_extern.externCCValue.morphWheel', name: 'slotA_extern.externCCValue morph Wheel', id: 2, bit: 1681, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 2 · Wheel morph', deltaOf: 'slotA_extern.externCCValue' },
    { key: 'slotA_extern.externCCValue.morphAfterTouch', name: 'slotA_extern.externCCValue morph After Touch', id: 2, bit: 1689, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 2 · After Touch morph', deltaOf: 'slotA_extern.externCCValue' },
    { key: 'slotA_extern.externCCValue.morphCtrlPedal', name: 'slotA_extern.externCCValue morph Ctrl Pedal', id: 2, bit: 1697, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 2 · Ctrl Pedal morph', deltaOf: 'slotA_extern.externCCValue' },
    { key: 'slotA_extern.externCCValue', name: 'slotA_extern.externCCValue', id: 2, bit: 1705, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 2' },
    { key: 'slotA_extern.param3', name: 'slotA_extern.param3', id: 3, bit: 1712, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 3' },
    { key: 'slotA_extern.param4', name: 'slotA_extern.param4', id: 4, bit: 1713, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 4' },
    { key: 'slotA_extern.param5', name: 'slotA_extern.param5', id: 5, bit: 1720, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 5' },
    { key: 'slotA_extern.param6', name: 'slotA_extern.param6', id: 6, bit: 1721, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 6' },
    { key: 'slotA_extern.param7', name: 'slotA_extern.param7', id: 7, bit: 1728, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 7' },
    { key: 'slotA_extern.externProgChange', name: 'slotA_extern.externProgChange', id: 8, bit: 1729, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 8' },
    { key: 'slotA_extern.param9', name: 'slotA_extern.param9', id: 9, bit: 1736, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 9' },
    { key: 'slotA_extern.param10', name: 'slotA_extern.param10', id: 10, bit: 1737, width: 4, min: 0, max: 15, def: 13, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 10' },
    { key: 'slotA_extern.param11', name: 'slotA_extern.param11', id: 11, bit: 1741, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 11' },
    { key: 'slotA_extern.externVolume.morphWheel', name: 'slotA_extern.externVolume morph Wheel', id: 12, bit: 1743, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 12 · Wheel morph', deltaOf: 'slotA_extern.externVolume' },
    { key: 'slotA_extern.externVolume.morphAfterTouch', name: 'slotA_extern.externVolume morph After Touch', id: 12, bit: 1751, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 12 · After Touch morph', deltaOf: 'slotA_extern.externVolume' },
    { key: 'slotA_extern.externVolume.morphCtrlPedal', name: 'slotA_extern.externVolume morph Ctrl Pedal', id: 12, bit: 1759, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 12 · Ctrl Pedal morph', deltaOf: 'slotA_extern.externVolume' },
    { key: 'slotA_extern.externVolume', name: 'slotA_extern.externVolume', id: 12, bit: 1767, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 12' },
    { key: 'slotA_extern.param13', name: 'slotA_extern.param13', id: 13, bit: 1774, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 13' },
    { key: 'slotA_extern.param14', name: 'slotA_extern.param14', id: 14, bit: 1775, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 14' },
    { key: 'slotA_extern.param15', name: 'slotA_extern.param15', id: 15, bit: 1776, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 15' },
    { key: 'slotA_extern.param16', name: 'slotA_extern.param16', id: 16, bit: 1777, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 16' },
    { key: 'slotA_extern.param17', name: 'slotA_extern.param17', id: 17, bit: 1778, width: 3, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 17' },
    { key: 'slotA_extern.param18', name: 'slotA_extern.param18', id: 18, bit: 1781, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_extern 18' },
    { key: 'slotA_effects.param0', name: 'slotA_effects.param0', id: 0, bit: 1800, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 0' },
    { key: 'slotA_effects.effect1Enable', name: 'slotA_effects.effect1Enable', id: 1, bit: 1802, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 1', cc: 69 },
    { key: 'slotA_effects.effect1Source', name: 'slotA_effects.effect1Source', id: 2, bit: 1803, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 2', cc: 61 },
    { key: 'slotA_effects.effect1Type', name: 'slotA_effects.effect1Type', id: 3, bit: 1805, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 3', cc: 60 },
    { key: 'slotA_effects.effect1MstClk', name: 'slotA_effects.effect1MstClk', id: 4, bit: 1808, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 4', cc: 117 },
    { key: 'slotA_effects.effect1MstClkDiv.morphWheel', name: 'slotA_effects.effect1MstClkDiv morph Wheel', id: 5, bit: 1809, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 5 · Wheel morph', deltaOf: 'slotA_effects.effect1MstClkDiv' },
    { key: 'slotA_effects.effect1MstClkDiv.morphAfterTouch', name: 'slotA_effects.effect1MstClkDiv morph After Touch', id: 5, bit: 1814, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 5 · After Touch morph', deltaOf: 'slotA_effects.effect1MstClkDiv' },
    { key: 'slotA_effects.effect1MstClkDiv.morphCtrlPedal', name: 'slotA_effects.effect1MstClkDiv morph Ctrl Pedal', id: 5, bit: 1819, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 5 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect1MstClkDiv' },
    { key: 'slotA_effects.effect1MstClkDiv', name: 'slotA_effects.effect1MstClkDiv', id: 5, bit: 1824, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 5', cc: 63 },
    { key: 'slotA_effects.effect1Rate.morphWheel', name: 'slotA_effects.effect1Rate morph Wheel', id: 6, bit: 1828, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 6 · Wheel morph', deltaOf: 'slotA_effects.effect1Rate' },
    { key: 'slotA_effects.effect1Rate.morphAfterTouch', name: 'slotA_effects.effect1Rate morph After Touch', id: 6, bit: 1836, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 6 · After Touch morph', deltaOf: 'slotA_effects.effect1Rate' },
    { key: 'slotA_effects.effect1Rate.morphCtrlPedal', name: 'slotA_effects.effect1Rate morph Ctrl Pedal', id: 6, bit: 1844, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 6 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect1Rate' },
    { key: 'slotA_effects.effect1Rate', name: 'slotA_effects.effect1Rate', id: 6, bit: 1852, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 6', cc: 63 },
    { key: 'slotA_effects.effect1Amount.morphWheel', name: 'slotA_effects.effect1Amount morph Wheel', id: 7, bit: 1859, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 7 · Wheel morph', deltaOf: 'slotA_effects.effect1Amount' },
    { key: 'slotA_effects.effect1Amount.morphAfterTouch', name: 'slotA_effects.effect1Amount morph After Touch', id: 7, bit: 1867, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 7 · After Touch morph', deltaOf: 'slotA_effects.effect1Amount' },
    { key: 'slotA_effects.effect1Amount.morphCtrlPedal', name: 'slotA_effects.effect1Amount morph Ctrl Pedal', id: 7, bit: 1875, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 7 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect1Amount' },
    { key: 'slotA_effects.effect1Amount', name: 'slotA_effects.effect1Amount', id: 7, bit: 1883, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 7', cc: 62 },
    { key: 'slotA_effects.effect2Enable', name: 'slotA_effects.effect2Enable', id: 8, bit: 1890, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 8', cc: 74 },
    { key: 'slotA_effects.effect2Source', name: 'slotA_effects.effect2Source', id: 9, bit: 1891, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 9', cc: 71 },
    { key: 'slotA_effects.effect2Type', name: 'slotA_effects.effect2Type', id: 10, bit: 1893, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 10', cc: 70 },
    { key: 'slotA_effects.effect2MstClk', name: 'slotA_effects.effect2MstClk', id: 11, bit: 1896, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 11', cc: 118 },
    { key: 'slotA_effects.effect2MstClkDiv.morphWheel', name: 'slotA_effects.effect2MstClkDiv morph Wheel', id: 12, bit: 1897, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 12 · Wheel morph', deltaOf: 'slotA_effects.effect2MstClkDiv' },
    { key: 'slotA_effects.effect2MstClkDiv.morphAfterTouch', name: 'slotA_effects.effect2MstClkDiv morph After Touch', id: 12, bit: 1902, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 12 · After Touch morph', deltaOf: 'slotA_effects.effect2MstClkDiv' },
    { key: 'slotA_effects.effect2MstClkDiv.morphCtrlPedal', name: 'slotA_effects.effect2MstClkDiv morph Ctrl Pedal', id: 12, bit: 1907, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 12 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect2MstClkDiv' },
    { key: 'slotA_effects.effect2MstClkDiv', name: 'slotA_effects.effect2MstClkDiv', id: 12, bit: 1912, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 12', cc: 73 },
    { key: 'slotA_effects.effect2Rate.morphWheel', name: 'slotA_effects.effect2Rate morph Wheel', id: 13, bit: 1916, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 13 · Wheel morph', deltaOf: 'slotA_effects.effect2Rate' },
    { key: 'slotA_effects.effect2Rate.morphAfterTouch', name: 'slotA_effects.effect2Rate morph After Touch', id: 13, bit: 1924, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 13 · After Touch morph', deltaOf: 'slotA_effects.effect2Rate' },
    { key: 'slotA_effects.effect2Rate.morphCtrlPedal', name: 'slotA_effects.effect2Rate morph Ctrl Pedal', id: 13, bit: 1932, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 13 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect2Rate' },
    { key: 'slotA_effects.effect2Rate', name: 'slotA_effects.effect2Rate', id: 13, bit: 1940, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 13', cc: 73 },
    { key: 'slotA_effects.effect2Amount.morphWheel', name: 'slotA_effects.effect2Amount morph Wheel', id: 14, bit: 1947, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 14 · Wheel morph', deltaOf: 'slotA_effects.effect2Amount' },
    { key: 'slotA_effects.effect2Amount.morphAfterTouch', name: 'slotA_effects.effect2Amount morph After Touch', id: 14, bit: 1955, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 14 · After Touch morph', deltaOf: 'slotA_effects.effect2Amount' },
    { key: 'slotA_effects.effect2Amount.morphCtrlPedal', name: 'slotA_effects.effect2Amount morph Ctrl Pedal', id: 14, bit: 1963, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 14 · Ctrl Pedal morph', deltaOf: 'slotA_effects.effect2Amount' },
    { key: 'slotA_effects.effect2Amount', name: 'slotA_effects.effect2Amount', id: 14, bit: 1971, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 14', cc: 72 },
    { key: 'slotA_effects.delayEnable', name: 'slotA_effects.delayEnable', id: 15, bit: 1978, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 15', cc: 80 },
    { key: 'slotA_effects.delaySource', name: 'slotA_effects.delaySource', id: 16, bit: 1979, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 16', cc: 75 },
    { key: 'slotA_effects.delayMode', name: 'slotA_effects.delayMode', id: 17, bit: 1981, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 17', cc: 79 },
    { key: 'slotA_effects.delayMstClk', name: 'slotA_effects.delayMstClk', id: 18, bit: 1982, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 18', cc: 119 },
    { key: 'slotA_effects.delayMstClkDiv.morphWheel', name: 'slotA_effects.delayMstClkDiv morph Wheel', id: 19, bit: 1983, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 19 · Wheel morph', deltaOf: 'slotA_effects.delayMstClkDiv' },
    { key: 'slotA_effects.delayMstClkDiv.morphAfterTouch', name: 'slotA_effects.delayMstClkDiv morph After Touch', id: 19, bit: 1988, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 19 · After Touch morph', deltaOf: 'slotA_effects.delayMstClkDiv' },
    { key: 'slotA_effects.delayMstClkDiv.morphCtrlPedal', name: 'slotA_effects.delayMstClkDiv morph Ctrl Pedal', id: 19, bit: 1993, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 19 · Ctrl Pedal morph', deltaOf: 'slotA_effects.delayMstClkDiv' },
    { key: 'slotA_effects.delayMstClkDiv', name: 'slotA_effects.delayMstClkDiv', id: 19, bit: 1998, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 19', cc: 77 },
    { key: 'slotA_effects.delayRate.morphWheel', name: 'slotA_effects.delayRate morph Wheel', id: 20, bit: 2002, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 20 · Wheel morph', deltaOf: 'slotA_effects.delayRate' },
    { key: 'slotA_effects.delayRate.morphAfterTouch', name: 'slotA_effects.delayRate morph After Touch', id: 20, bit: 2015, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 20 · After Touch morph', deltaOf: 'slotA_effects.delayRate' },
    { key: 'slotA_effects.delayRate.morphCtrlPedal', name: 'slotA_effects.delayRate morph Ctrl Pedal', id: 20, bit: 2028, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 20 · Ctrl Pedal morph', deltaOf: 'slotA_effects.delayRate' },
    { key: 'slotA_effects.delayRate', name: 'slotA_effects.delayRate', id: 20, bit: 2041, width: 12, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 20', cc: 77 },
    { key: 'slotA_effects.delayAmount.morphWheel', name: 'slotA_effects.delayAmount morph Wheel', id: 21, bit: 2053, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 21 · Wheel morph', deltaOf: 'slotA_effects.delayAmount' },
    { key: 'slotA_effects.delayAmount.morphAfterTouch', name: 'slotA_effects.delayAmount morph After Touch', id: 21, bit: 2061, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 21 · After Touch morph', deltaOf: 'slotA_effects.delayAmount' },
    { key: 'slotA_effects.delayAmount.morphCtrlPedal', name: 'slotA_effects.delayAmount morph Ctrl Pedal', id: 21, bit: 2069, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 21 · Ctrl Pedal morph', deltaOf: 'slotA_effects.delayAmount' },
    { key: 'slotA_effects.delayAmount', name: 'slotA_effects.delayAmount', id: 21, bit: 2077, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 21', cc: 76 },
    { key: 'slotA_effects.delayFeedback', name: 'slotA_effects.delayFeedback', id: 22, bit: 2084, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 22', cc: 78 },
    { key: 'slotA_effects.ampSimEqEnable', name: 'slotA_effects.ampSimEqEnable', id: 23, bit: 2091, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 23', cc: 87 },
    { key: 'slotA_effects.ampSimEqSource', name: 'slotA_effects.ampSimEqSource', id: 24, bit: 2092, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 24', cc: 90 },
    { key: 'slotA_effects.ampSimEqType', name: 'slotA_effects.ampSimEqType', id: 25, bit: 2094, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 25', cc: 81 },
    { key: 'slotA_effects.ampSimEqDrive', name: 'slotA_effects.ampSimEqDrive', id: 26, bit: 2096, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 26', cc: 83 },
    { key: 'slotA_effects.ampSimEqTreble', name: 'slotA_effects.ampSimEqTreble', id: 27, bit: 2103, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 27', cc: 86 },
    { key: 'slotA_effects.ampSimEqMid', name: 'slotA_effects.ampSimEqMid', id: 28, bit: 2110, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 28', cc: 85 },
    { key: 'slotA_effects.ampSimEqBass', name: 'slotA_effects.ampSimEqBass', id: 29, bit: 2117, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 29', cc: 84 },
    { key: 'slotA_effects.ampSimEqMidFreq', name: 'slotA_effects.ampSimEqMidFreq', id: 30, bit: 2124, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotA_effects 30', cc: 6 },
    { key: 'slotB_common.organEnable', name: 'slotB_common.organEnable', id: 0, bit: 2160, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 0', cc: 101 },
    { key: 'slotB_common.organLevel.morphWheel', name: 'slotB_common.organLevel morph Wheel', id: 1, bit: 2161, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 1 · Wheel morph', deltaOf: 'slotB_common.organLevel' },
    { key: 'slotB_common.organLevel.morphAfterTouch', name: 'slotB_common.organLevel morph After Touch', id: 1, bit: 2169, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 1 · After Touch morph', deltaOf: 'slotB_common.organLevel' },
    { key: 'slotB_common.organLevel.morphCtrlPedal', name: 'slotB_common.organLevel morph Ctrl Pedal', id: 1, bit: 2177, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 1 · Ctrl Pedal morph', deltaOf: 'slotB_common.organLevel' },
    { key: 'slotB_common.organLevel', name: 'slotB_common.organLevel', id: 1, bit: 2185, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 1', cc: 100 },
    { key: 'slotB_common.organZone', name: 'slotB_common.organZone', id: 2, bit: 2192, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 2' },
    { key: 'slotB_common.organOctaveShift', name: 'slotB_common.organOctaveShift', id: 3, bit: 2195, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 3', cc: 99 },
    { key: 'slotB_common.param4', name: 'slotB_common.param4', id: 4, bit: 2199, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 4' },
    { key: 'slotB_common.pianoEnable', name: 'slotB_common.pianoEnable', id: 5, bit: 2200, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 5', cc: 107 },
    { key: 'slotB_common.pianoLevel.morphWheel', name: 'slotB_common.pianoLevel morph Wheel', id: 6, bit: 2201, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 6 · Wheel morph', deltaOf: 'slotB_common.pianoLevel' },
    { key: 'slotB_common.pianoLevel.morphAfterTouch', name: 'slotB_common.pianoLevel morph After Touch', id: 6, bit: 2209, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 6 · After Touch morph', deltaOf: 'slotB_common.pianoLevel' },
    { key: 'slotB_common.pianoLevel.morphCtrlPedal', name: 'slotB_common.pianoLevel morph Ctrl Pedal', id: 6, bit: 2217, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 6 · Ctrl Pedal morph', deltaOf: 'slotB_common.pianoLevel' },
    { key: 'slotB_common.pianoLevel', name: 'slotB_common.pianoLevel', id: 6, bit: 2225, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 6', cc: 106 },
    { key: 'slotB_common.pianoZone', name: 'slotB_common.pianoZone', id: 7, bit: 2232, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 7' },
    { key: 'slotB_common.pianoOctaveShift', name: 'slotB_common.pianoOctaveShift', id: 8, bit: 2235, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 8', cc: 105 },
    { key: 'slotB_common.param9', name: 'slotB_common.param9', id: 9, bit: 2239, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 9' },
    { key: 'slotB_common.param10', name: 'slotB_common.param10', id: 10, bit: 2240, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 10' },
    { key: 'slotB_common.synthEnable', name: 'slotB_common.synthEnable', id: 11, bit: 2241, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 11', cc: 113 },
    { key: 'slotB_common.synthLevel.morphWheel', name: 'slotB_common.synthLevel morph Wheel', id: 12, bit: 2242, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 12 · Wheel morph', deltaOf: 'slotB_common.synthLevel' },
    { key: 'slotB_common.synthLevel.morphAfterTouch', name: 'slotB_common.synthLevel morph After Touch', id: 12, bit: 2250, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 12 · After Touch morph', deltaOf: 'slotB_common.synthLevel' },
    { key: 'slotB_common.synthLevel.morphCtrlPedal', name: 'slotB_common.synthLevel morph Ctrl Pedal', id: 12, bit: 2258, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 12 · Ctrl Pedal morph', deltaOf: 'slotB_common.synthLevel' },
    { key: 'slotB_common.synthLevel', name: 'slotB_common.synthLevel', id: 12, bit: 2266, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 12', cc: 112 },
    { key: 'slotB_common.synthZone', name: 'slotB_common.synthZone', id: 13, bit: 2273, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 13' },
    { key: 'slotB_common.synthOctaveShift', name: 'slotB_common.synthOctaveShift', id: 14, bit: 2276, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 14', cc: 111 },
    { key: 'slotB_common.param15', name: 'slotB_common.param15', id: 15, bit: 2280, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 15' },
    { key: 'slotB_common.param16', name: 'slotB_common.param16', id: 16, bit: 2281, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 16' },
    { key: 'slotB_common.externEnable', name: 'slotB_common.externEnable', id: 17, bit: 2282, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 17' },
    { key: 'slotB_common.param18.morphWheel', name: 'slotB_common.param18 morph Wheel', id: 18, bit: 2283, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 18 · Wheel morph', deltaOf: 'slotB_common.param18' },
    { key: 'slotB_common.param18.morphAfterTouch', name: 'slotB_common.param18 morph After Touch', id: 18, bit: 2291, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 18 · After Touch morph', deltaOf: 'slotB_common.param18' },
    { key: 'slotB_common.param18.morphCtrlPedal', name: 'slotB_common.param18 morph Ctrl Pedal', id: 18, bit: 2299, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 18 · Ctrl Pedal morph', deltaOf: 'slotB_common.param18' },
    { key: 'slotB_common.param18', name: 'slotB_common.param18', id: 18, bit: 2307, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 18' },
    { key: 'slotB_common.externZone', name: 'slotB_common.externZone', id: 19, bit: 2314, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 19' },
    { key: 'slotB_common.externOctaveShift', name: 'slotB_common.externOctaveShift', id: 20, bit: 2317, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 20' },
    { key: 'slotB_common.param21', name: 'slotB_common.param21', id: 21, bit: 2321, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 21' },
    { key: 'slotB_common.param22', name: 'slotB_common.param22', id: 22, bit: 2322, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 22' },
    { key: 'slotB_common.param25', name: 'slotB_common.param25', id: 25, bit: 2333, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 25' },
    { key: 'slotB_common.param26', name: 'slotB_common.param26', id: 26, bit: 2336, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 26' },
    { key: 'slotB_common.param27', name: 'slotB_common.param27', id: 27, bit: 2339, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 27' },
    { key: 'slotB_common.param28', name: 'slotB_common.param28', id: 28, bit: 2342, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 28' },
    { key: 'slotB_common.param29', name: 'slotB_common.param29', id: 29, bit: 2343, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 29' },
    { key: 'slotB_common.param30', name: 'slotB_common.param30', id: 30, bit: 2344, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 30' },
    { key: 'slotB_common.param31', name: 'slotB_common.param31', id: 31, bit: 2345, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 31' },
    { key: 'slotB_common.param32', name: 'slotB_common.param32', id: 32, bit: 2346, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 32' },
    { key: 'slotB_common.param33', name: 'slotB_common.param33', id: 33, bit: 2347, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_common 33' },
    { key: 'slotB_b3Select.b3Preset', name: 'slotB_b3Select.b3Preset', id: 0, bit: 2360, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3Select 0', cc: 3 },
    { key: 'slotB_voxSelect.voxPreset', name: 'slotB_voxSelect.voxPreset', id: 0, bit: 2368, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxSelect 0', cc: 3 },
    { key: 'slotB_farfSelect.farfisaPreset', name: 'slotB_farfSelect.farfisaPreset', id: 0, bit: 2376, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfSelect 0', cc: 3 },
    { key: 'slotB_b3PresetI.b3Sub.morphWheel', name: 'slotB_b3PresetI.b3Sub morph Wheel', id: 0, bit: 2384, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 0 · Wheel morph', deltaOf: 'slotB_b3PresetI.b3Sub' },
    { key: 'slotB_b3PresetI.b3Sub.morphAfterTouch', name: 'slotB_b3PresetI.b3Sub morph After Touch', id: 0, bit: 2389, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 0 · After Touch morph', deltaOf: 'slotB_b3PresetI.b3Sub' },
    { key: 'slotB_b3PresetI.b3Sub.morphCtrlPedal', name: 'slotB_b3PresetI.b3Sub morph Ctrl Pedal', id: 0, bit: 2394, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 0 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b3Sub' },
    { key: 'slotB_b3PresetI.b3Sub', name: 'slotB_b3PresetI.b3Sub', id: 0, bit: 2399, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 0', cc: 9 },
    { key: 'slotB_b3PresetI.b3Sub3.morphWheel', name: 'slotB_b3PresetI.b3Sub3 morph Wheel', id: 1, bit: 2403, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 1 · Wheel morph', deltaOf: 'slotB_b3PresetI.b3Sub3' },
    { key: 'slotB_b3PresetI.b3Sub3.morphAfterTouch', name: 'slotB_b3PresetI.b3Sub3 morph After Touch', id: 1, bit: 2408, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 1 · After Touch morph', deltaOf: 'slotB_b3PresetI.b3Sub3' },
    { key: 'slotB_b3PresetI.b3Sub3.morphCtrlPedal', name: 'slotB_b3PresetI.b3Sub3 morph Ctrl Pedal', id: 1, bit: 2413, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 1 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b3Sub3' },
    { key: 'slotB_b3PresetI.b3Sub3', name: 'slotB_b3PresetI.b3Sub3', id: 1, bit: 2418, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 1', cc: 14 },
    { key: 'slotB_b3PresetI.b3Fund.morphWheel', name: 'slotB_b3PresetI.b3Fund morph Wheel', id: 2, bit: 2422, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 2 · Wheel morph', deltaOf: 'slotB_b3PresetI.b3Fund' },
    { key: 'slotB_b3PresetI.b3Fund.morphAfterTouch', name: 'slotB_b3PresetI.b3Fund morph After Touch', id: 2, bit: 2427, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 2 · After Touch morph', deltaOf: 'slotB_b3PresetI.b3Fund' },
    { key: 'slotB_b3PresetI.b3Fund.morphCtrlPedal', name: 'slotB_b3PresetI.b3Fund morph Ctrl Pedal', id: 2, bit: 2432, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 2 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b3Fund' },
    { key: 'slotB_b3PresetI.b3Fund', name: 'slotB_b3PresetI.b3Fund', id: 2, bit: 2437, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 2', cc: 15 },
    { key: 'slotB_b3PresetI.b32nd.morphWheel', name: 'slotB_b3PresetI.b32nd morph Wheel', id: 3, bit: 2441, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 3 · Wheel morph', deltaOf: 'slotB_b3PresetI.b32nd' },
    { key: 'slotB_b3PresetI.b32nd.morphAfterTouch', name: 'slotB_b3PresetI.b32nd morph After Touch', id: 3, bit: 2446, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 3 · After Touch morph', deltaOf: 'slotB_b3PresetI.b32nd' },
    { key: 'slotB_b3PresetI.b32nd.morphCtrlPedal', name: 'slotB_b3PresetI.b32nd morph Ctrl Pedal', id: 3, bit: 2451, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 3 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b32nd' },
    { key: 'slotB_b3PresetI.b32nd', name: 'slotB_b3PresetI.b32nd', id: 3, bit: 2456, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 3', cc: 16 },
    { key: 'slotB_b3PresetI.b33rd.morphWheel', name: 'slotB_b3PresetI.b33rd morph Wheel', id: 4, bit: 2460, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 4 · Wheel morph', deltaOf: 'slotB_b3PresetI.b33rd' },
    { key: 'slotB_b3PresetI.b33rd.morphAfterTouch', name: 'slotB_b3PresetI.b33rd morph After Touch', id: 4, bit: 2465, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 4 · After Touch morph', deltaOf: 'slotB_b3PresetI.b33rd' },
    { key: 'slotB_b3PresetI.b33rd.morphCtrlPedal', name: 'slotB_b3PresetI.b33rd morph Ctrl Pedal', id: 4, bit: 2470, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 4 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b33rd' },
    { key: 'slotB_b3PresetI.b33rd', name: 'slotB_b3PresetI.b33rd', id: 4, bit: 2475, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 4', cc: 17 },
    { key: 'slotB_b3PresetI.b34th.morphWheel', name: 'slotB_b3PresetI.b34th morph Wheel', id: 5, bit: 2479, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 5 · Wheel morph', deltaOf: 'slotB_b3PresetI.b34th' },
    { key: 'slotB_b3PresetI.b34th.morphAfterTouch', name: 'slotB_b3PresetI.b34th morph After Touch', id: 5, bit: 2484, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 5 · After Touch morph', deltaOf: 'slotB_b3PresetI.b34th' },
    { key: 'slotB_b3PresetI.b34th.morphCtrlPedal', name: 'slotB_b3PresetI.b34th morph Ctrl Pedal', id: 5, bit: 2489, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 5 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b34th' },
    { key: 'slotB_b3PresetI.b34th', name: 'slotB_b3PresetI.b34th', id: 5, bit: 2494, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 5', cc: 18 },
    { key: 'slotB_b3PresetI.b35th.morphWheel', name: 'slotB_b3PresetI.b35th morph Wheel', id: 6, bit: 2498, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 6 · Wheel morph', deltaOf: 'slotB_b3PresetI.b35th' },
    { key: 'slotB_b3PresetI.b35th.morphAfterTouch', name: 'slotB_b3PresetI.b35th morph After Touch', id: 6, bit: 2503, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 6 · After Touch morph', deltaOf: 'slotB_b3PresetI.b35th' },
    { key: 'slotB_b3PresetI.b35th.morphCtrlPedal', name: 'slotB_b3PresetI.b35th morph Ctrl Pedal', id: 6, bit: 2508, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 6 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b35th' },
    { key: 'slotB_b3PresetI.b35th', name: 'slotB_b3PresetI.b35th', id: 6, bit: 2513, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 6', cc: 19 },
    { key: 'slotB_b3PresetI.b36th.morphWheel', name: 'slotB_b3PresetI.b36th morph Wheel', id: 7, bit: 2517, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 7 · Wheel morph', deltaOf: 'slotB_b3PresetI.b36th' },
    { key: 'slotB_b3PresetI.b36th.morphAfterTouch', name: 'slotB_b3PresetI.b36th morph After Touch', id: 7, bit: 2522, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 7 · After Touch morph', deltaOf: 'slotB_b3PresetI.b36th' },
    { key: 'slotB_b3PresetI.b36th.morphCtrlPedal', name: 'slotB_b3PresetI.b36th morph Ctrl Pedal', id: 7, bit: 2527, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 7 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b36th' },
    { key: 'slotB_b3PresetI.b36th', name: 'slotB_b3PresetI.b36th', id: 7, bit: 2532, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 7', cc: 20 },
    { key: 'slotB_b3PresetI.b38th.morphWheel', name: 'slotB_b3PresetI.b38th morph Wheel', id: 8, bit: 2536, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 8 · Wheel morph', deltaOf: 'slotB_b3PresetI.b38th' },
    { key: 'slotB_b3PresetI.b38th.morphAfterTouch', name: 'slotB_b3PresetI.b38th morph After Touch', id: 8, bit: 2541, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 8 · After Touch morph', deltaOf: 'slotB_b3PresetI.b38th' },
    { key: 'slotB_b3PresetI.b38th.morphCtrlPedal', name: 'slotB_b3PresetI.b38th morph Ctrl Pedal', id: 8, bit: 2546, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 8 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetI.b38th' },
    { key: 'slotB_b3PresetI.b38th', name: 'slotB_b3PresetI.b38th', id: 8, bit: 2551, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 8', cc: 21 },
    { key: 'slotB_b3PresetI.b3Vibrato', name: 'slotB_b3PresetI.b3Vibrato', id: 9, bit: 2555, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 9', cc: 25 },
    { key: 'slotB_b3PresetI.b3Percussion', name: 'slotB_b3PresetI.b3Percussion', id: 10, bit: 2556, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetI 10', cc: 22 },
    { key: 'slotB_voxPresetI.vox16Foot.morphWheel', name: 'slotB_voxPresetI.vox16Foot morph Wheel', id: 0, bit: 2568, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 0 · Wheel morph', deltaOf: 'slotB_voxPresetI.vox16Foot' },
    { key: 'slotB_voxPresetI.vox16Foot.morphAfterTouch', name: 'slotB_voxPresetI.vox16Foot morph After Touch', id: 0, bit: 2573, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 0 · After Touch morph', deltaOf: 'slotB_voxPresetI.vox16Foot' },
    { key: 'slotB_voxPresetI.vox16Foot.morphCtrlPedal', name: 'slotB_voxPresetI.vox16Foot morph Ctrl Pedal', id: 0, bit: 2578, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 0 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.vox16Foot' },
    { key: 'slotB_voxPresetI.vox16Foot', name: 'slotB_voxPresetI.vox16Foot', id: 0, bit: 2583, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 0', cc: 9 },
    { key: 'slotB_voxPresetI.vox8Foot.morphWheel', name: 'slotB_voxPresetI.vox8Foot morph Wheel', id: 1, bit: 2587, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 1 · Wheel morph', deltaOf: 'slotB_voxPresetI.vox8Foot' },
    { key: 'slotB_voxPresetI.vox8Foot.morphAfterTouch', name: 'slotB_voxPresetI.vox8Foot morph After Touch', id: 1, bit: 2592, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 1 · After Touch morph', deltaOf: 'slotB_voxPresetI.vox8Foot' },
    { key: 'slotB_voxPresetI.vox8Foot.morphCtrlPedal', name: 'slotB_voxPresetI.vox8Foot morph Ctrl Pedal', id: 1, bit: 2597, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 1 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.vox8Foot' },
    { key: 'slotB_voxPresetI.vox8Foot', name: 'slotB_voxPresetI.vox8Foot', id: 1, bit: 2602, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 1', cc: 14 },
    { key: 'slotB_voxPresetI.vox4Foot.morphWheel', name: 'slotB_voxPresetI.vox4Foot morph Wheel', id: 2, bit: 2606, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 2 · Wheel morph', deltaOf: 'slotB_voxPresetI.vox4Foot' },
    { key: 'slotB_voxPresetI.vox4Foot.morphAfterTouch', name: 'slotB_voxPresetI.vox4Foot morph After Touch', id: 2, bit: 2611, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 2 · After Touch morph', deltaOf: 'slotB_voxPresetI.vox4Foot' },
    { key: 'slotB_voxPresetI.vox4Foot.morphCtrlPedal', name: 'slotB_voxPresetI.vox4Foot morph Ctrl Pedal', id: 2, bit: 2616, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 2 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.vox4Foot' },
    { key: 'slotB_voxPresetI.vox4Foot', name: 'slotB_voxPresetI.vox4Foot', id: 2, bit: 2621, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 2', cc: 15 },
    { key: 'slotB_voxPresetI.vox2Foot.morphWheel', name: 'slotB_voxPresetI.vox2Foot morph Wheel', id: 3, bit: 2625, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 3 · Wheel morph', deltaOf: 'slotB_voxPresetI.vox2Foot' },
    { key: 'slotB_voxPresetI.vox2Foot.morphAfterTouch', name: 'slotB_voxPresetI.vox2Foot morph After Touch', id: 3, bit: 2630, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 3 · After Touch morph', deltaOf: 'slotB_voxPresetI.vox2Foot' },
    { key: 'slotB_voxPresetI.vox2Foot.morphCtrlPedal', name: 'slotB_voxPresetI.vox2Foot morph Ctrl Pedal', id: 3, bit: 2635, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 3 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.vox2Foot' },
    { key: 'slotB_voxPresetI.vox2Foot', name: 'slotB_voxPresetI.vox2Foot', id: 3, bit: 2640, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 3', cc: 16 },
    { key: 'slotB_voxPresetI.voxII.morphWheel', name: 'slotB_voxPresetI.voxII morph Wheel', id: 4, bit: 2644, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 4 · Wheel morph', deltaOf: 'slotB_voxPresetI.voxII' },
    { key: 'slotB_voxPresetI.voxII.morphAfterTouch', name: 'slotB_voxPresetI.voxII morph After Touch', id: 4, bit: 2649, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 4 · After Touch morph', deltaOf: 'slotB_voxPresetI.voxII' },
    { key: 'slotB_voxPresetI.voxII.morphCtrlPedal', name: 'slotB_voxPresetI.voxII morph Ctrl Pedal', id: 4, bit: 2654, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 4 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.voxII' },
    { key: 'slotB_voxPresetI.voxII', name: 'slotB_voxPresetI.voxII', id: 4, bit: 2659, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 4', cc: 17 },
    { key: 'slotB_voxPresetI.voxIII.morphWheel', name: 'slotB_voxPresetI.voxIII morph Wheel', id: 5, bit: 2663, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 5 · Wheel morph', deltaOf: 'slotB_voxPresetI.voxIII' },
    { key: 'slotB_voxPresetI.voxIII.morphAfterTouch', name: 'slotB_voxPresetI.voxIII morph After Touch', id: 5, bit: 2668, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 5 · After Touch morph', deltaOf: 'slotB_voxPresetI.voxIII' },
    { key: 'slotB_voxPresetI.voxIII.morphCtrlPedal', name: 'slotB_voxPresetI.voxIII morph Ctrl Pedal', id: 5, bit: 2673, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 5 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.voxIII' },
    { key: 'slotB_voxPresetI.voxIII', name: 'slotB_voxPresetI.voxIII', id: 5, bit: 2678, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 5', cc: 18 },
    { key: 'slotB_voxPresetI.voxIV.morphWheel', name: 'slotB_voxPresetI.voxIV morph Wheel', id: 6, bit: 2682, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 6 · Wheel morph', deltaOf: 'slotB_voxPresetI.voxIV' },
    { key: 'slotB_voxPresetI.voxIV.morphAfterTouch', name: 'slotB_voxPresetI.voxIV morph After Touch', id: 6, bit: 2687, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 6 · After Touch morph', deltaOf: 'slotB_voxPresetI.voxIV' },
    { key: 'slotB_voxPresetI.voxIV.morphCtrlPedal', name: 'slotB_voxPresetI.voxIV morph Ctrl Pedal', id: 6, bit: 2692, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 6 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.voxIV' },
    { key: 'slotB_voxPresetI.voxIV', name: 'slotB_voxPresetI.voxIV', id: 6, bit: 2697, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 6', cc: 19 },
    { key: 'slotB_voxPresetI.voxSin.morphWheel', name: 'slotB_voxPresetI.voxSin morph Wheel', id: 7, bit: 2701, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 7 · Wheel morph', deltaOf: 'slotB_voxPresetI.voxSin' },
    { key: 'slotB_voxPresetI.voxSin.morphAfterTouch', name: 'slotB_voxPresetI.voxSin morph After Touch', id: 7, bit: 2706, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 7 · After Touch morph', deltaOf: 'slotB_voxPresetI.voxSin' },
    { key: 'slotB_voxPresetI.voxSin.morphCtrlPedal', name: 'slotB_voxPresetI.voxSin morph Ctrl Pedal', id: 7, bit: 2711, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 7 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.voxSin' },
    { key: 'slotB_voxPresetI.voxSin', name: 'slotB_voxPresetI.voxSin', id: 7, bit: 2716, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 7', cc: 20 },
    { key: 'slotB_voxPresetI.voxTri.morphWheel', name: 'slotB_voxPresetI.voxTri morph Wheel', id: 8, bit: 2720, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 8 · Wheel morph', deltaOf: 'slotB_voxPresetI.voxTri' },
    { key: 'slotB_voxPresetI.voxTri.morphAfterTouch', name: 'slotB_voxPresetI.voxTri morph After Touch', id: 8, bit: 2725, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 8 · After Touch morph', deltaOf: 'slotB_voxPresetI.voxTri' },
    { key: 'slotB_voxPresetI.voxTri.morphCtrlPedal', name: 'slotB_voxPresetI.voxTri morph Ctrl Pedal', id: 8, bit: 2730, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 8 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetI.voxTri' },
    { key: 'slotB_voxPresetI.voxTri', name: 'slotB_voxPresetI.voxTri', id: 8, bit: 2735, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetI 8', cc: 21 },
    { key: 'slotB_farfPresetI.farfisaBass16.morphWheel', name: 'slotB_farfPresetI.farfisaBass16 morph Wheel', id: 0, bit: 2752, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 0 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaBass16' },
    { key: 'slotB_farfPresetI.farfisaBass16.morphAfterTouch', name: 'slotB_farfPresetI.farfisaBass16 morph After Touch', id: 0, bit: 2754, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 0 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaBass16' },
    { key: 'slotB_farfPresetI.farfisaBass16.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaBass16 morph Ctrl Pedal', id: 0, bit: 2756, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 0 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaBass16' },
    { key: 'slotB_farfPresetI.farfisaBass16', name: 'slotB_farfPresetI.farfisaBass16', id: 0, bit: 2758, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 0', cc: 9 },
    { key: 'slotB_farfPresetI.farfisaString16.morphWheel', name: 'slotB_farfPresetI.farfisaString16 morph Wheel', id: 1, bit: 2759, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 1 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaString16' },
    { key: 'slotB_farfPresetI.farfisaString16.morphAfterTouch', name: 'slotB_farfPresetI.farfisaString16 morph After Touch', id: 1, bit: 2761, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 1 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaString16' },
    { key: 'slotB_farfPresetI.farfisaString16.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaString16 morph Ctrl Pedal', id: 1, bit: 2763, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 1 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaString16' },
    { key: 'slotB_farfPresetI.farfisaString16', name: 'slotB_farfPresetI.farfisaString16', id: 1, bit: 2765, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 1', cc: 14 },
    { key: 'slotB_farfPresetI.farfisaFlute8.morphWheel', name: 'slotB_farfPresetI.farfisaFlute8 morph Wheel', id: 2, bit: 2766, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 2 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaFlute8' },
    { key: 'slotB_farfPresetI.farfisaFlute8.morphAfterTouch', name: 'slotB_farfPresetI.farfisaFlute8 morph After Touch', id: 2, bit: 2768, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 2 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaFlute8' },
    { key: 'slotB_farfPresetI.farfisaFlute8.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaFlute8 morph Ctrl Pedal', id: 2, bit: 2770, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 2 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaFlute8' },
    { key: 'slotB_farfPresetI.farfisaFlute8', name: 'slotB_farfPresetI.farfisaFlute8', id: 2, bit: 2772, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 2', cc: 15 },
    { key: 'slotB_farfPresetI.farfisaOboe8.morphWheel', name: 'slotB_farfPresetI.farfisaOboe8 morph Wheel', id: 3, bit: 2773, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 3 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaOboe8' },
    { key: 'slotB_farfPresetI.farfisaOboe8.morphAfterTouch', name: 'slotB_farfPresetI.farfisaOboe8 morph After Touch', id: 3, bit: 2775, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 3 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaOboe8' },
    { key: 'slotB_farfPresetI.farfisaOboe8.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaOboe8 morph Ctrl Pedal', id: 3, bit: 2777, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 3 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaOboe8' },
    { key: 'slotB_farfPresetI.farfisaOboe8', name: 'slotB_farfPresetI.farfisaOboe8', id: 3, bit: 2779, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 3', cc: 16 },
    { key: 'slotB_farfPresetI.farfisaTrumpet8.morphWheel', name: 'slotB_farfPresetI.farfisaTrumpet8 morph Wheel', id: 4, bit: 2780, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 4 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaTrumpet8' },
    { key: 'slotB_farfPresetI.farfisaTrumpet8.morphAfterTouch', name: 'slotB_farfPresetI.farfisaTrumpet8 morph After Touch', id: 4, bit: 2782, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 4 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaTrumpet8' },
    { key: 'slotB_farfPresetI.farfisaTrumpet8.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaTrumpet8 morph Ctrl Pedal', id: 4, bit: 2784, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 4 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaTrumpet8' },
    { key: 'slotB_farfPresetI.farfisaTrumpet8', name: 'slotB_farfPresetI.farfisaTrumpet8', id: 4, bit: 2786, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 4', cc: 17 },
    { key: 'slotB_farfPresetI.farfisaString8.morphWheel', name: 'slotB_farfPresetI.farfisaString8 morph Wheel', id: 5, bit: 2787, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 5 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaString8' },
    { key: 'slotB_farfPresetI.farfisaString8.morphAfterTouch', name: 'slotB_farfPresetI.farfisaString8 morph After Touch', id: 5, bit: 2789, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 5 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaString8' },
    { key: 'slotB_farfPresetI.farfisaString8.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaString8 morph Ctrl Pedal', id: 5, bit: 2791, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 5 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaString8' },
    { key: 'slotB_farfPresetI.farfisaString8', name: 'slotB_farfPresetI.farfisaString8', id: 5, bit: 2793, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 5', cc: 18 },
    { key: 'slotB_farfPresetI.farfisaFlute4.morphWheel', name: 'slotB_farfPresetI.farfisaFlute4 morph Wheel', id: 6, bit: 2794, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 6 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaFlute4' },
    { key: 'slotB_farfPresetI.farfisaFlute4.morphAfterTouch', name: 'slotB_farfPresetI.farfisaFlute4 morph After Touch', id: 6, bit: 2796, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 6 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaFlute4' },
    { key: 'slotB_farfPresetI.farfisaFlute4.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaFlute4 morph Ctrl Pedal', id: 6, bit: 2798, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 6 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaFlute4' },
    { key: 'slotB_farfPresetI.farfisaFlute4', name: 'slotB_farfPresetI.farfisaFlute4', id: 6, bit: 2800, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 6', cc: 19 },
    { key: 'slotB_farfPresetI.farfisaString4.morphWheel', name: 'slotB_farfPresetI.farfisaString4 morph Wheel', id: 7, bit: 2801, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 7 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisaString4' },
    { key: 'slotB_farfPresetI.farfisaString4.morphAfterTouch', name: 'slotB_farfPresetI.farfisaString4 morph After Touch', id: 7, bit: 2803, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 7 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisaString4' },
    { key: 'slotB_farfPresetI.farfisaString4.morphCtrlPedal', name: 'slotB_farfPresetI.farfisaString4 morph Ctrl Pedal', id: 7, bit: 2805, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 7 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisaString4' },
    { key: 'slotB_farfPresetI.farfisaString4', name: 'slotB_farfPresetI.farfisaString4', id: 7, bit: 2807, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 7', cc: 20 },
    { key: 'slotB_farfPresetI.farfisa223.morphWheel', name: 'slotB_farfPresetI.farfisa223 morph Wheel', id: 8, bit: 2808, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 8 · Wheel morph', deltaOf: 'slotB_farfPresetI.farfisa223' },
    { key: 'slotB_farfPresetI.farfisa223.morphAfterTouch', name: 'slotB_farfPresetI.farfisa223 morph After Touch', id: 8, bit: 2810, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 8 · After Touch morph', deltaOf: 'slotB_farfPresetI.farfisa223' },
    { key: 'slotB_farfPresetI.farfisa223.morphCtrlPedal', name: 'slotB_farfPresetI.farfisa223 morph Ctrl Pedal', id: 8, bit: 2812, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 8 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetI.farfisa223' },
    { key: 'slotB_farfPresetI.farfisa223', name: 'slotB_farfPresetI.farfisa223', id: 8, bit: 2814, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetI 8', cc: 21 },
    { key: 'slotB_b3PresetII.b3Sub.morphWheel', name: 'slotB_b3PresetII.b3Sub morph Wheel', id: 0, bit: 2824, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 0 · Wheel morph', deltaOf: 'slotB_b3PresetII.b3Sub' },
    { key: 'slotB_b3PresetII.b3Sub.morphAfterTouch', name: 'slotB_b3PresetII.b3Sub morph After Touch', id: 0, bit: 2829, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 0 · After Touch morph', deltaOf: 'slotB_b3PresetII.b3Sub' },
    { key: 'slotB_b3PresetII.b3Sub.morphCtrlPedal', name: 'slotB_b3PresetII.b3Sub morph Ctrl Pedal', id: 0, bit: 2834, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 0 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b3Sub' },
    { key: 'slotB_b3PresetII.b3Sub', name: 'slotB_b3PresetII.b3Sub', id: 0, bit: 2839, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 0', cc: 9 },
    { key: 'slotB_b3PresetII.b3Sub3.morphWheel', name: 'slotB_b3PresetII.b3Sub3 morph Wheel', id: 1, bit: 2843, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 1 · Wheel morph', deltaOf: 'slotB_b3PresetII.b3Sub3' },
    { key: 'slotB_b3PresetII.b3Sub3.morphAfterTouch', name: 'slotB_b3PresetII.b3Sub3 morph After Touch', id: 1, bit: 2848, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 1 · After Touch morph', deltaOf: 'slotB_b3PresetII.b3Sub3' },
    { key: 'slotB_b3PresetII.b3Sub3.morphCtrlPedal', name: 'slotB_b3PresetII.b3Sub3 morph Ctrl Pedal', id: 1, bit: 2853, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 1 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b3Sub3' },
    { key: 'slotB_b3PresetII.b3Sub3', name: 'slotB_b3PresetII.b3Sub3', id: 1, bit: 2858, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 1', cc: 14 },
    { key: 'slotB_b3PresetII.b3Fund.morphWheel', name: 'slotB_b3PresetII.b3Fund morph Wheel', id: 2, bit: 2862, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 2 · Wheel morph', deltaOf: 'slotB_b3PresetII.b3Fund' },
    { key: 'slotB_b3PresetII.b3Fund.morphAfterTouch', name: 'slotB_b3PresetII.b3Fund morph After Touch', id: 2, bit: 2867, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 2 · After Touch morph', deltaOf: 'slotB_b3PresetII.b3Fund' },
    { key: 'slotB_b3PresetII.b3Fund.morphCtrlPedal', name: 'slotB_b3PresetII.b3Fund morph Ctrl Pedal', id: 2, bit: 2872, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 2 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b3Fund' },
    { key: 'slotB_b3PresetII.b3Fund', name: 'slotB_b3PresetII.b3Fund', id: 2, bit: 2877, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 2', cc: 15 },
    { key: 'slotB_b3PresetII.b32nd.morphWheel', name: 'slotB_b3PresetII.b32nd morph Wheel', id: 3, bit: 2881, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 3 · Wheel morph', deltaOf: 'slotB_b3PresetII.b32nd' },
    { key: 'slotB_b3PresetII.b32nd.morphAfterTouch', name: 'slotB_b3PresetII.b32nd morph After Touch', id: 3, bit: 2886, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 3 · After Touch morph', deltaOf: 'slotB_b3PresetII.b32nd' },
    { key: 'slotB_b3PresetII.b32nd.morphCtrlPedal', name: 'slotB_b3PresetII.b32nd morph Ctrl Pedal', id: 3, bit: 2891, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 3 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b32nd' },
    { key: 'slotB_b3PresetII.b32nd', name: 'slotB_b3PresetII.b32nd', id: 3, bit: 2896, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 3', cc: 16 },
    { key: 'slotB_b3PresetII.b33rd.morphWheel', name: 'slotB_b3PresetII.b33rd morph Wheel', id: 4, bit: 2900, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 4 · Wheel morph', deltaOf: 'slotB_b3PresetII.b33rd' },
    { key: 'slotB_b3PresetII.b33rd.morphAfterTouch', name: 'slotB_b3PresetII.b33rd morph After Touch', id: 4, bit: 2905, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 4 · After Touch morph', deltaOf: 'slotB_b3PresetII.b33rd' },
    { key: 'slotB_b3PresetII.b33rd.morphCtrlPedal', name: 'slotB_b3PresetII.b33rd morph Ctrl Pedal', id: 4, bit: 2910, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 4 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b33rd' },
    { key: 'slotB_b3PresetII.b33rd', name: 'slotB_b3PresetII.b33rd', id: 4, bit: 2915, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 4', cc: 17 },
    { key: 'slotB_b3PresetII.b34th.morphWheel', name: 'slotB_b3PresetII.b34th morph Wheel', id: 5, bit: 2919, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 5 · Wheel morph', deltaOf: 'slotB_b3PresetII.b34th' },
    { key: 'slotB_b3PresetII.b34th.morphAfterTouch', name: 'slotB_b3PresetII.b34th morph After Touch', id: 5, bit: 2924, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 5 · After Touch morph', deltaOf: 'slotB_b3PresetII.b34th' },
    { key: 'slotB_b3PresetII.b34th.morphCtrlPedal', name: 'slotB_b3PresetII.b34th morph Ctrl Pedal', id: 5, bit: 2929, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 5 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b34th' },
    { key: 'slotB_b3PresetII.b34th', name: 'slotB_b3PresetII.b34th', id: 5, bit: 2934, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 5', cc: 18 },
    { key: 'slotB_b3PresetII.b35th.morphWheel', name: 'slotB_b3PresetII.b35th morph Wheel', id: 6, bit: 2938, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 6 · Wheel morph', deltaOf: 'slotB_b3PresetII.b35th' },
    { key: 'slotB_b3PresetII.b35th.morphAfterTouch', name: 'slotB_b3PresetII.b35th morph After Touch', id: 6, bit: 2943, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 6 · After Touch morph', deltaOf: 'slotB_b3PresetII.b35th' },
    { key: 'slotB_b3PresetII.b35th.morphCtrlPedal', name: 'slotB_b3PresetII.b35th morph Ctrl Pedal', id: 6, bit: 2948, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 6 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b35th' },
    { key: 'slotB_b3PresetII.b35th', name: 'slotB_b3PresetII.b35th', id: 6, bit: 2953, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 6', cc: 19 },
    { key: 'slotB_b3PresetII.b36th.morphWheel', name: 'slotB_b3PresetII.b36th morph Wheel', id: 7, bit: 2957, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 7 · Wheel morph', deltaOf: 'slotB_b3PresetII.b36th' },
    { key: 'slotB_b3PresetII.b36th.morphAfterTouch', name: 'slotB_b3PresetII.b36th morph After Touch', id: 7, bit: 2962, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 7 · After Touch morph', deltaOf: 'slotB_b3PresetII.b36th' },
    { key: 'slotB_b3PresetII.b36th.morphCtrlPedal', name: 'slotB_b3PresetII.b36th morph Ctrl Pedal', id: 7, bit: 2967, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 7 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b36th' },
    { key: 'slotB_b3PresetII.b36th', name: 'slotB_b3PresetII.b36th', id: 7, bit: 2972, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 7', cc: 20 },
    { key: 'slotB_b3PresetII.b38th.morphWheel', name: 'slotB_b3PresetII.b38th morph Wheel', id: 8, bit: 2976, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 8 · Wheel morph', deltaOf: 'slotB_b3PresetII.b38th' },
    { key: 'slotB_b3PresetII.b38th.morphAfterTouch', name: 'slotB_b3PresetII.b38th morph After Touch', id: 8, bit: 2981, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 8 · After Touch morph', deltaOf: 'slotB_b3PresetII.b38th' },
    { key: 'slotB_b3PresetII.b38th.morphCtrlPedal', name: 'slotB_b3PresetII.b38th morph Ctrl Pedal', id: 8, bit: 2986, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 8 · Ctrl Pedal morph', deltaOf: 'slotB_b3PresetII.b38th' },
    { key: 'slotB_b3PresetII.b38th', name: 'slotB_b3PresetII.b38th', id: 8, bit: 2991, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 8', cc: 21 },
    { key: 'slotB_b3PresetII.b3Vibrato', name: 'slotB_b3PresetII.b3Vibrato', id: 9, bit: 2995, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 9', cc: 25 },
    { key: 'slotB_b3PresetII.b3Percussion', name: 'slotB_b3PresetII.b3Percussion', id: 10, bit: 2996, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_b3PresetII 10', cc: 22 },
    { key: 'slotB_voxPresetII.vox16Foot.morphWheel', name: 'slotB_voxPresetII.vox16Foot morph Wheel', id: 0, bit: 3008, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 0 · Wheel morph', deltaOf: 'slotB_voxPresetII.vox16Foot' },
    { key: 'slotB_voxPresetII.vox16Foot.morphAfterTouch', name: 'slotB_voxPresetII.vox16Foot morph After Touch', id: 0, bit: 3013, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 0 · After Touch morph', deltaOf: 'slotB_voxPresetII.vox16Foot' },
    { key: 'slotB_voxPresetII.vox16Foot.morphCtrlPedal', name: 'slotB_voxPresetII.vox16Foot morph Ctrl Pedal', id: 0, bit: 3018, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 0 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.vox16Foot' },
    { key: 'slotB_voxPresetII.vox16Foot', name: 'slotB_voxPresetII.vox16Foot', id: 0, bit: 3023, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 0', cc: 9 },
    { key: 'slotB_voxPresetII.vox8Foot.morphWheel', name: 'slotB_voxPresetII.vox8Foot morph Wheel', id: 1, bit: 3027, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 1 · Wheel morph', deltaOf: 'slotB_voxPresetII.vox8Foot' },
    { key: 'slotB_voxPresetII.vox8Foot.morphAfterTouch', name: 'slotB_voxPresetII.vox8Foot morph After Touch', id: 1, bit: 3032, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 1 · After Touch morph', deltaOf: 'slotB_voxPresetII.vox8Foot' },
    { key: 'slotB_voxPresetII.vox8Foot.morphCtrlPedal', name: 'slotB_voxPresetII.vox8Foot morph Ctrl Pedal', id: 1, bit: 3037, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 1 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.vox8Foot' },
    { key: 'slotB_voxPresetII.vox8Foot', name: 'slotB_voxPresetII.vox8Foot', id: 1, bit: 3042, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 1', cc: 14 },
    { key: 'slotB_voxPresetII.vox4Foot.morphWheel', name: 'slotB_voxPresetII.vox4Foot morph Wheel', id: 2, bit: 3046, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 2 · Wheel morph', deltaOf: 'slotB_voxPresetII.vox4Foot' },
    { key: 'slotB_voxPresetII.vox4Foot.morphAfterTouch', name: 'slotB_voxPresetII.vox4Foot morph After Touch', id: 2, bit: 3051, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 2 · After Touch morph', deltaOf: 'slotB_voxPresetII.vox4Foot' },
    { key: 'slotB_voxPresetII.vox4Foot.morphCtrlPedal', name: 'slotB_voxPresetII.vox4Foot morph Ctrl Pedal', id: 2, bit: 3056, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 2 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.vox4Foot' },
    { key: 'slotB_voxPresetII.vox4Foot', name: 'slotB_voxPresetII.vox4Foot', id: 2, bit: 3061, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 2', cc: 15 },
    { key: 'slotB_voxPresetII.vox2Foot.morphWheel', name: 'slotB_voxPresetII.vox2Foot morph Wheel', id: 3, bit: 3065, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 3 · Wheel morph', deltaOf: 'slotB_voxPresetII.vox2Foot' },
    { key: 'slotB_voxPresetII.vox2Foot.morphAfterTouch', name: 'slotB_voxPresetII.vox2Foot morph After Touch', id: 3, bit: 3070, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 3 · After Touch morph', deltaOf: 'slotB_voxPresetII.vox2Foot' },
    { key: 'slotB_voxPresetII.vox2Foot.morphCtrlPedal', name: 'slotB_voxPresetII.vox2Foot morph Ctrl Pedal', id: 3, bit: 3075, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 3 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.vox2Foot' },
    { key: 'slotB_voxPresetII.vox2Foot', name: 'slotB_voxPresetII.vox2Foot', id: 3, bit: 3080, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 3', cc: 16 },
    { key: 'slotB_voxPresetII.voxII.morphWheel', name: 'slotB_voxPresetII.voxII morph Wheel', id: 4, bit: 3084, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 4 · Wheel morph', deltaOf: 'slotB_voxPresetII.voxII' },
    { key: 'slotB_voxPresetII.voxII.morphAfterTouch', name: 'slotB_voxPresetII.voxII morph After Touch', id: 4, bit: 3089, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 4 · After Touch morph', deltaOf: 'slotB_voxPresetII.voxII' },
    { key: 'slotB_voxPresetII.voxII.morphCtrlPedal', name: 'slotB_voxPresetII.voxII morph Ctrl Pedal', id: 4, bit: 3094, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 4 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.voxII' },
    { key: 'slotB_voxPresetII.voxII', name: 'slotB_voxPresetII.voxII', id: 4, bit: 3099, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 4', cc: 17 },
    { key: 'slotB_voxPresetII.voxIII.morphWheel', name: 'slotB_voxPresetII.voxIII morph Wheel', id: 5, bit: 3103, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 5 · Wheel morph', deltaOf: 'slotB_voxPresetII.voxIII' },
    { key: 'slotB_voxPresetII.voxIII.morphAfterTouch', name: 'slotB_voxPresetII.voxIII morph After Touch', id: 5, bit: 3108, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 5 · After Touch morph', deltaOf: 'slotB_voxPresetII.voxIII' },
    { key: 'slotB_voxPresetII.voxIII.morphCtrlPedal', name: 'slotB_voxPresetII.voxIII morph Ctrl Pedal', id: 5, bit: 3113, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 5 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.voxIII' },
    { key: 'slotB_voxPresetII.voxIII', name: 'slotB_voxPresetII.voxIII', id: 5, bit: 3118, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 5', cc: 18 },
    { key: 'slotB_voxPresetII.voxIV.morphWheel', name: 'slotB_voxPresetII.voxIV morph Wheel', id: 6, bit: 3122, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 6 · Wheel morph', deltaOf: 'slotB_voxPresetII.voxIV' },
    { key: 'slotB_voxPresetII.voxIV.morphAfterTouch', name: 'slotB_voxPresetII.voxIV morph After Touch', id: 6, bit: 3127, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 6 · After Touch morph', deltaOf: 'slotB_voxPresetII.voxIV' },
    { key: 'slotB_voxPresetII.voxIV.morphCtrlPedal', name: 'slotB_voxPresetII.voxIV morph Ctrl Pedal', id: 6, bit: 3132, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 6 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.voxIV' },
    { key: 'slotB_voxPresetII.voxIV', name: 'slotB_voxPresetII.voxIV', id: 6, bit: 3137, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 6', cc: 19 },
    { key: 'slotB_voxPresetII.voxSin.morphWheel', name: 'slotB_voxPresetII.voxSin morph Wheel', id: 7, bit: 3141, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 7 · Wheel morph', deltaOf: 'slotB_voxPresetII.voxSin' },
    { key: 'slotB_voxPresetII.voxSin.morphAfterTouch', name: 'slotB_voxPresetII.voxSin morph After Touch', id: 7, bit: 3146, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 7 · After Touch morph', deltaOf: 'slotB_voxPresetII.voxSin' },
    { key: 'slotB_voxPresetII.voxSin.morphCtrlPedal', name: 'slotB_voxPresetII.voxSin morph Ctrl Pedal', id: 7, bit: 3151, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 7 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.voxSin' },
    { key: 'slotB_voxPresetII.voxSin', name: 'slotB_voxPresetII.voxSin', id: 7, bit: 3156, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 7', cc: 20 },
    { key: 'slotB_voxPresetII.voxTri.morphWheel', name: 'slotB_voxPresetII.voxTri morph Wheel', id: 8, bit: 3160, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 8 · Wheel morph', deltaOf: 'slotB_voxPresetII.voxTri' },
    { key: 'slotB_voxPresetII.voxTri.morphAfterTouch', name: 'slotB_voxPresetII.voxTri morph After Touch', id: 8, bit: 3165, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 8 · After Touch morph', deltaOf: 'slotB_voxPresetII.voxTri' },
    { key: 'slotB_voxPresetII.voxTri.morphCtrlPedal', name: 'slotB_voxPresetII.voxTri morph Ctrl Pedal', id: 8, bit: 3170, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 8 · Ctrl Pedal morph', deltaOf: 'slotB_voxPresetII.voxTri' },
    { key: 'slotB_voxPresetII.voxTri', name: 'slotB_voxPresetII.voxTri', id: 8, bit: 3175, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_voxPresetII 8', cc: 21 },
    { key: 'slotB_farfPresetII.farfisaBass16.morphWheel', name: 'slotB_farfPresetII.farfisaBass16 morph Wheel', id: 0, bit: 3192, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 0 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaBass16' },
    { key: 'slotB_farfPresetII.farfisaBass16.morphAfterTouch', name: 'slotB_farfPresetII.farfisaBass16 morph After Touch', id: 0, bit: 3194, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 0 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaBass16' },
    { key: 'slotB_farfPresetII.farfisaBass16.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaBass16 morph Ctrl Pedal', id: 0, bit: 3196, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 0 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaBass16' },
    { key: 'slotB_farfPresetII.farfisaBass16', name: 'slotB_farfPresetII.farfisaBass16', id: 0, bit: 3198, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 0', cc: 9 },
    { key: 'slotB_farfPresetII.farfisaString16.morphWheel', name: 'slotB_farfPresetII.farfisaString16 morph Wheel', id: 1, bit: 3199, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 1 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaString16' },
    { key: 'slotB_farfPresetII.farfisaString16.morphAfterTouch', name: 'slotB_farfPresetII.farfisaString16 morph After Touch', id: 1, bit: 3201, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 1 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaString16' },
    { key: 'slotB_farfPresetII.farfisaString16.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaString16 morph Ctrl Pedal', id: 1, bit: 3203, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 1 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaString16' },
    { key: 'slotB_farfPresetII.farfisaString16', name: 'slotB_farfPresetII.farfisaString16', id: 1, bit: 3205, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 1', cc: 14 },
    { key: 'slotB_farfPresetII.farfisaFlute8.morphWheel', name: 'slotB_farfPresetII.farfisaFlute8 morph Wheel', id: 2, bit: 3206, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 2 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaFlute8' },
    { key: 'slotB_farfPresetII.farfisaFlute8.morphAfterTouch', name: 'slotB_farfPresetII.farfisaFlute8 morph After Touch', id: 2, bit: 3208, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 2 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaFlute8' },
    { key: 'slotB_farfPresetII.farfisaFlute8.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaFlute8 morph Ctrl Pedal', id: 2, bit: 3210, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 2 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaFlute8' },
    { key: 'slotB_farfPresetII.farfisaFlute8', name: 'slotB_farfPresetII.farfisaFlute8', id: 2, bit: 3212, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 2', cc: 15 },
    { key: 'slotB_farfPresetII.farfisaOboe8.morphWheel', name: 'slotB_farfPresetII.farfisaOboe8 morph Wheel', id: 3, bit: 3213, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 3 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaOboe8' },
    { key: 'slotB_farfPresetII.farfisaOboe8.morphAfterTouch', name: 'slotB_farfPresetII.farfisaOboe8 morph After Touch', id: 3, bit: 3215, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 3 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaOboe8' },
    { key: 'slotB_farfPresetII.farfisaOboe8.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaOboe8 morph Ctrl Pedal', id: 3, bit: 3217, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 3 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaOboe8' },
    { key: 'slotB_farfPresetII.farfisaOboe8', name: 'slotB_farfPresetII.farfisaOboe8', id: 3, bit: 3219, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 3', cc: 16 },
    { key: 'slotB_farfPresetII.farfisaTrumpet8.morphWheel', name: 'slotB_farfPresetII.farfisaTrumpet8 morph Wheel', id: 4, bit: 3220, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 4 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaTrumpet8' },
    { key: 'slotB_farfPresetII.farfisaTrumpet8.morphAfterTouch', name: 'slotB_farfPresetII.farfisaTrumpet8 morph After Touch', id: 4, bit: 3222, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 4 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaTrumpet8' },
    { key: 'slotB_farfPresetII.farfisaTrumpet8.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaTrumpet8 morph Ctrl Pedal', id: 4, bit: 3224, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 4 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaTrumpet8' },
    { key: 'slotB_farfPresetII.farfisaTrumpet8', name: 'slotB_farfPresetII.farfisaTrumpet8', id: 4, bit: 3226, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 4', cc: 17 },
    { key: 'slotB_farfPresetII.farfisaString8.morphWheel', name: 'slotB_farfPresetII.farfisaString8 morph Wheel', id: 5, bit: 3227, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 5 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaString8' },
    { key: 'slotB_farfPresetII.farfisaString8.morphAfterTouch', name: 'slotB_farfPresetII.farfisaString8 morph After Touch', id: 5, bit: 3229, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 5 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaString8' },
    { key: 'slotB_farfPresetII.farfisaString8.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaString8 morph Ctrl Pedal', id: 5, bit: 3231, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 5 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaString8' },
    { key: 'slotB_farfPresetII.farfisaString8', name: 'slotB_farfPresetII.farfisaString8', id: 5, bit: 3233, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 5', cc: 18 },
    { key: 'slotB_farfPresetII.farfisaFlute4.morphWheel', name: 'slotB_farfPresetII.farfisaFlute4 morph Wheel', id: 6, bit: 3234, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 6 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaFlute4' },
    { key: 'slotB_farfPresetII.farfisaFlute4.morphAfterTouch', name: 'slotB_farfPresetII.farfisaFlute4 morph After Touch', id: 6, bit: 3236, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 6 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaFlute4' },
    { key: 'slotB_farfPresetII.farfisaFlute4.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaFlute4 morph Ctrl Pedal', id: 6, bit: 3238, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 6 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaFlute4' },
    { key: 'slotB_farfPresetII.farfisaFlute4', name: 'slotB_farfPresetII.farfisaFlute4', id: 6, bit: 3240, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 6', cc: 19 },
    { key: 'slotB_farfPresetII.farfisaString4.morphWheel', name: 'slotB_farfPresetII.farfisaString4 morph Wheel', id: 7, bit: 3241, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 7 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisaString4' },
    { key: 'slotB_farfPresetII.farfisaString4.morphAfterTouch', name: 'slotB_farfPresetII.farfisaString4 morph After Touch', id: 7, bit: 3243, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 7 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisaString4' },
    { key: 'slotB_farfPresetII.farfisaString4.morphCtrlPedal', name: 'slotB_farfPresetII.farfisaString4 morph Ctrl Pedal', id: 7, bit: 3245, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 7 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisaString4' },
    { key: 'slotB_farfPresetII.farfisaString4', name: 'slotB_farfPresetII.farfisaString4', id: 7, bit: 3247, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 7', cc: 20 },
    { key: 'slotB_farfPresetII.farfisa223.morphWheel', name: 'slotB_farfPresetII.farfisa223 morph Wheel', id: 8, bit: 3248, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 8 · Wheel morph', deltaOf: 'slotB_farfPresetII.farfisa223' },
    { key: 'slotB_farfPresetII.farfisa223.morphAfterTouch', name: 'slotB_farfPresetII.farfisa223 morph After Touch', id: 8, bit: 3250, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 8 · After Touch morph', deltaOf: 'slotB_farfPresetII.farfisa223' },
    { key: 'slotB_farfPresetII.farfisa223.morphCtrlPedal', name: 'slotB_farfPresetII.farfisa223 morph Ctrl Pedal', id: 8, bit: 3252, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 8 · Ctrl Pedal morph', deltaOf: 'slotB_farfPresetII.farfisa223' },
    { key: 'slotB_farfPresetII.farfisa223', name: 'slotB_farfPresetII.farfisa223', id: 8, bit: 3254, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_farfPresetII 8', cc: 21 },
    { key: 'slotB_piano.param0', name: 'slotB_piano.param0', id: 0, bit: 3264, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 0', cc: 8 },
    { key: 'slotB_piano.param2', name: 'slotB_piano.param2', id: 2, bit: 3267, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 2' },
    { key: 'slotB_piano.param3', name: 'slotB_piano.param3', id: 3, bit: 3274, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 3', cc: 65 },
    { key: 'slotB_piano.pianoAcoustic', name: 'slotB_piano.pianoAcoustic', id: 4, bit: 3281, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 4', cc: 98 },
    { key: 'slotB_piano.pianoPedalNoise', name: 'slotB_piano.pianoPedalNoise', id: 5, bit: 3283, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 5', cc: 108 },
    { key: 'slotB_piano.pianoDynamics', name: 'slotB_piano.pianoDynamics', id: 6, bit: 3284, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 6', cc: 33 },
    { key: 'slotB_piano.clavinetEQMode', name: 'slotB_piano.clavinetEQMode', id: 7, bit: 3286, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 7', cc: 30 },
    { key: 'slotB_piano.clavinetEQMode8', name: 'slotB_piano.clavinetEQMode8', id: 8, bit: 3288, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 8', cc: 31 },
    { key: 'slotB_piano.param9', name: 'slotB_piano.param9', id: 9, bit: 3290, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 9' },
    { key: 'slotB_piano.param10', name: 'slotB_piano.param10', id: 10, bit: 3305, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 10' },
    { key: 'slotB_piano.param11', name: 'slotB_piano.param11', id: 11, bit: 3320, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_piano 11' },
    { key: 'slotB_arpLfo.arpeggiatorRun', name: 'slotB_arpLfo.arpeggiatorRun', id: 1, bit: 3367, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 1', cc: 109 },
    { key: 'slotB_arpLfo.arpeggiatorMstClk', name: 'slotB_arpLfo.arpeggiatorMstClk', id: 2, bit: 3368, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 2', cc: 12 },
    { key: 'slotB_arpLfo.arpeggiatorMstClkDiv', name: 'slotB_arpLfo.arpeggiatorMstClkDiv', id: 3, bit: 3369, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 3', cc: 102 },
    { key: 'slotB_arpLfo.arpeggiatorRate', name: 'slotB_arpLfo.arpeggiatorRate', id: 4, bit: 3373, width: 8, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 4', cc: 102 },
    { key: 'slotB_arpLfo.arpeggiatorPattern', name: 'slotB_arpLfo.arpeggiatorPattern', id: 5, bit: 3381, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 5', cc: 103 },
    { key: 'slotB_arpLfo.arpeggiatorRange', name: 'slotB_arpLfo.arpeggiatorRange', id: 6, bit: 3383, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 6', cc: 104 },
    { key: 'slotB_arpLfo.lFOMstClk', name: 'slotB_arpLfo.lFOMstClk', id: 7, bit: 3385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 7', cc: 13 },
    { key: 'slotB_arpLfo.lFOMstClkDiv', name: 'slotB_arpLfo.lFOMstClkDiv', id: 8, bit: 3386, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 8', cc: 115 },
    { key: 'slotB_arpLfo.holdState', name: 'slotB_arpLfo.holdState', id: 9, bit: 3390, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_arpLfo 9', cc: 110 },
    { key: 'slotB_synth.modEnvelopeAttack', name: 'slotB_synth.modEnvelopeAttack', id: 0, bit: 3408, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 0', cc: 39 },
    { key: 'slotB_synth.modEnvelopeDecay', name: 'slotB_synth.modEnvelopeDecay', id: 1, bit: 3415, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 1', cc: 40 },
    { key: 'slotB_synth.modEnvelopeRelease', name: 'slotB_synth.modEnvelopeRelease', id: 2, bit: 3422, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 2', cc: 41 },
    { key: 'slotB_synth.modEnvelopeVelocity', name: 'slotB_synth.modEnvelopeVelocity', id: 3, bit: 3429, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 3', cc: 42 },
    { key: 'slotB_synth.param4', name: 'slotB_synth.param4', id: 4, bit: 3430, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 4', cc: 43 },
    { key: 'slotB_synth.param5', name: 'slotB_synth.param5', id: 5, bit: 3433, width: 10, min: 0, max: 999, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 5', cc: 44 },
    { key: 'slotB_synth.oscShape.morphWheel', name: 'slotB_synth.oscShape morph Wheel', id: 6, bit: 3443, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 6 · Wheel morph', deltaOf: 'slotB_synth.oscShape' },
    { key: 'slotB_synth.oscShape.morphAfterTouch', name: 'slotB_synth.oscShape morph After Touch', id: 6, bit: 3451, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 6 · After Touch morph', deltaOf: 'slotB_synth.oscShape' },
    { key: 'slotB_synth.oscShape.morphCtrlPedal', name: 'slotB_synth.oscShape morph Ctrl Pedal', id: 6, bit: 3459, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 6 · Ctrl Pedal morph', deltaOf: 'slotB_synth.oscShape' },
    { key: 'slotB_synth.oscShape', name: 'slotB_synth.oscShape', id: 6, bit: 3467, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 6', cc: 45 },
    { key: 'slotB_synth.shapeModAmount', name: 'slotB_synth.shapeModAmount', id: 7, bit: 3474, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 7', cc: 46 },
    { key: 'slotB_synth.oscDetune.morphWheel', name: 'slotB_synth.oscDetune morph Wheel', id: 8, bit: 3481, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 8 · Wheel morph', deltaOf: 'slotB_synth.oscDetune' },
    { key: 'slotB_synth.oscDetune.morphAfterTouch', name: 'slotB_synth.oscDetune morph After Touch', id: 8, bit: 3489, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 8 · After Touch morph', deltaOf: 'slotB_synth.oscDetune' },
    { key: 'slotB_synth.oscDetune.morphCtrlPedal', name: 'slotB_synth.oscDetune morph Ctrl Pedal', id: 8, bit: 3497, width: 8, min: -24, max: 24, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 8 · Ctrl Pedal morph', deltaOf: 'slotB_synth.oscDetune' },
    { key: 'slotB_synth.oscDetune', name: 'slotB_synth.oscDetune', id: 8, bit: 3505, width: 7, min: 0, max: 24, def: 12, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 8', cc: 45 },
    { key: 'slotB_synth.sampSkipAttack.morphWheel', name: 'slotB_synth.sampSkipAttack morph Wheel', id: 9, bit: 3512, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 9 · Wheel morph', deltaOf: 'slotB_synth.sampSkipAttack' },
    { key: 'slotB_synth.sampSkipAttack.morphAfterTouch', name: 'slotB_synth.sampSkipAttack morph After Touch', id: 9, bit: 3514, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 9 · After Touch morph', deltaOf: 'slotB_synth.sampSkipAttack' },
    { key: 'slotB_synth.sampSkipAttack.morphCtrlPedal', name: 'slotB_synth.sampSkipAttack morph Ctrl Pedal', id: 9, bit: 3516, width: 2, min: -1, max: 1, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 9 · Ctrl Pedal morph', deltaOf: 'slotB_synth.sampSkipAttack' },
    { key: 'slotB_synth.sampSkipAttack', name: 'slotB_synth.sampSkipAttack', id: 9, bit: 3518, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 9', cc: 45 },
    { key: 'slotB_synth.filterFrequency.morphWheel', name: 'slotB_synth.filterFrequency morph Wheel', id: 10, bit: 3519, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 10 · Wheel morph', deltaOf: 'slotB_synth.filterFrequency' },
    { key: 'slotB_synth.filterFrequency.morphAfterTouch', name: 'slotB_synth.filterFrequency morph After Touch', id: 10, bit: 3527, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 10 · After Touch morph', deltaOf: 'slotB_synth.filterFrequency' },
    { key: 'slotB_synth.filterFrequency.morphCtrlPedal', name: 'slotB_synth.filterFrequency morph Ctrl Pedal', id: 10, bit: 3535, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 10 · Ctrl Pedal morph', deltaOf: 'slotB_synth.filterFrequency' },
    { key: 'slotB_synth.filterFrequency', name: 'slotB_synth.filterFrequency', id: 10, bit: 3543, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 10', cc: 48 },
    { key: 'slotB_synth.filterResonance', name: 'slotB_synth.filterResonance', id: 11, bit: 3550, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 11', cc: 49 },
    { key: 'slotB_synth.fltFreqMod2Amount', name: 'slotB_synth.fltFreqMod2Amount', id: 12, bit: 3557, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 12', cc: 2 },
    { key: 'slotB_synth.fltFreqMod1Amount', name: 'slotB_synth.fltFreqMod1Amount', id: 13, bit: 3564, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 13', cc: 51 },
    { key: 'slotB_synth.fltKBTTrack', name: 'slotB_synth.fltKBTTrack', id: 14, bit: 3571, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 14', cc: 52 },
    { key: 'slotB_synth.filterMode', name: 'slotB_synth.filterMode', id: 15, bit: 3572, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 15', cc: 53 },
    { key: 'slotB_synth.ampEnvelopeAttack', name: 'slotB_synth.ampEnvelopeAttack', id: 16, bit: 3575, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 16', cc: 54 },
    { key: 'slotB_synth.ampEnvelopeDecay', name: 'slotB_synth.ampEnvelopeDecay', id: 17, bit: 3582, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 17', cc: 55 },
    { key: 'slotB_synth.ampEnvelopeRelease', name: 'slotB_synth.ampEnvelopeRelease', id: 18, bit: 3589, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 18', cc: 56 },
    { key: 'slotB_synth.ampEnvelopeVelocity', name: 'slotB_synth.ampEnvelopeVelocity', id: 19, bit: 3596, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 19', cc: 57 },
    { key: 'slotB_synth.lFORate', name: 'slotB_synth.lFORate', id: 20, bit: 3597, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 20', cc: 115 },
    { key: 'slotB_synth.lFOWave', name: 'slotB_synth.lFOWave', id: 21, bit: 3604, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 21', cc: 116 },
    { key: 'slotB_synth.param22', name: 'slotB_synth.param22', id: 22, bit: 3606, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 22' },
    { key: 'slotB_synth.param23', name: 'slotB_synth.param23', id: 23, bit: 3621, width: 15, min: 0, max: 32767, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 23' },
    { key: 'slotB_synth.param24', name: 'slotB_synth.param24', id: 24, bit: 3636, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 24' },
    { key: 'slotB_synth.glideRate', name: 'slotB_synth.glideRate', id: 25, bit: 3638, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 25', cc: 34 },
    { key: 'slotB_synth.voiceMode', name: 'slotB_synth.voiceMode', id: 26, bit: 3645, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 26', cc: 36 },
    { key: 'slotB_synth.unisonMode', name: 'slotB_synth.unisonMode', id: 27, bit: 3647, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 27', cc: 37 },
    { key: 'slotB_synth.vibratoMode', name: 'slotB_synth.vibratoMode', id: 28, bit: 3650, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_synth 28', cc: 38 },
    { key: 'slotB_extern.param0', name: 'slotB_extern.param0', id: 0, bit: 3664, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 0' },
    { key: 'slotB_extern.param1', name: 'slotB_extern.param1', id: 1, bit: 3666, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 1' },
    { key: 'slotB_extern.externCCValue.morphWheel', name: 'slotB_extern.externCCValue morph Wheel', id: 2, bit: 3673, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 2 · Wheel morph', deltaOf: 'slotB_extern.externCCValue' },
    { key: 'slotB_extern.externCCValue.morphAfterTouch', name: 'slotB_extern.externCCValue morph After Touch', id: 2, bit: 3681, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 2 · After Touch morph', deltaOf: 'slotB_extern.externCCValue' },
    { key: 'slotB_extern.externCCValue.morphCtrlPedal', name: 'slotB_extern.externCCValue morph Ctrl Pedal', id: 2, bit: 3689, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 2 · Ctrl Pedal morph', deltaOf: 'slotB_extern.externCCValue' },
    { key: 'slotB_extern.externCCValue', name: 'slotB_extern.externCCValue', id: 2, bit: 3697, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 2' },
    { key: 'slotB_extern.param3', name: 'slotB_extern.param3', id: 3, bit: 3704, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 3' },
    { key: 'slotB_extern.param4', name: 'slotB_extern.param4', id: 4, bit: 3705, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 4' },
    { key: 'slotB_extern.param5', name: 'slotB_extern.param5', id: 5, bit: 3712, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 5' },
    { key: 'slotB_extern.param6', name: 'slotB_extern.param6', id: 6, bit: 3713, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 6' },
    { key: 'slotB_extern.param7', name: 'slotB_extern.param7', id: 7, bit: 3720, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 7' },
    { key: 'slotB_extern.externProgChange', name: 'slotB_extern.externProgChange', id: 8, bit: 3721, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 8' },
    { key: 'slotB_extern.param9', name: 'slotB_extern.param9', id: 9, bit: 3728, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 9' },
    { key: 'slotB_extern.param10', name: 'slotB_extern.param10', id: 10, bit: 3729, width: 4, min: 0, max: 15, def: 13, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 10' },
    { key: 'slotB_extern.param11', name: 'slotB_extern.param11', id: 11, bit: 3733, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 11' },
    { key: 'slotB_extern.externVolume.morphWheel', name: 'slotB_extern.externVolume morph Wheel', id: 12, bit: 3735, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 12 · Wheel morph', deltaOf: 'slotB_extern.externVolume' },
    { key: 'slotB_extern.externVolume.morphAfterTouch', name: 'slotB_extern.externVolume morph After Touch', id: 12, bit: 3743, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 12 · After Touch morph', deltaOf: 'slotB_extern.externVolume' },
    { key: 'slotB_extern.externVolume.morphCtrlPedal', name: 'slotB_extern.externVolume morph Ctrl Pedal', id: 12, bit: 3751, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 12 · Ctrl Pedal morph', deltaOf: 'slotB_extern.externVolume' },
    { key: 'slotB_extern.externVolume', name: 'slotB_extern.externVolume', id: 12, bit: 3759, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 12' },
    { key: 'slotB_extern.param13', name: 'slotB_extern.param13', id: 13, bit: 3766, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 13' },
    { key: 'slotB_extern.param14', name: 'slotB_extern.param14', id: 14, bit: 3767, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 14' },
    { key: 'slotB_extern.param15', name: 'slotB_extern.param15', id: 15, bit: 3768, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 15' },
    { key: 'slotB_extern.param16', name: 'slotB_extern.param16', id: 16, bit: 3769, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 16' },
    { key: 'slotB_extern.param17', name: 'slotB_extern.param17', id: 17, bit: 3770, width: 3, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 17' },
    { key: 'slotB_extern.param18', name: 'slotB_extern.param18', id: 18, bit: 3773, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_extern 18' },
    { key: 'slotB_effects.param0', name: 'slotB_effects.param0', id: 0, bit: 3792, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 0' },
    { key: 'slotB_effects.effect1Enable', name: 'slotB_effects.effect1Enable', id: 1, bit: 3794, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 1', cc: 69 },
    { key: 'slotB_effects.effect1Source', name: 'slotB_effects.effect1Source', id: 2, bit: 3795, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 2', cc: 61 },
    { key: 'slotB_effects.effect1Type', name: 'slotB_effects.effect1Type', id: 3, bit: 3797, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 3', cc: 60 },
    { key: 'slotB_effects.effect1MstClk', name: 'slotB_effects.effect1MstClk', id: 4, bit: 3800, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 4', cc: 117 },
    { key: 'slotB_effects.effect1MstClkDiv.morphWheel', name: 'slotB_effects.effect1MstClkDiv morph Wheel', id: 5, bit: 3801, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 5 · Wheel morph', deltaOf: 'slotB_effects.effect1MstClkDiv' },
    { key: 'slotB_effects.effect1MstClkDiv.morphAfterTouch', name: 'slotB_effects.effect1MstClkDiv morph After Touch', id: 5, bit: 3806, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 5 · After Touch morph', deltaOf: 'slotB_effects.effect1MstClkDiv' },
    { key: 'slotB_effects.effect1MstClkDiv.morphCtrlPedal', name: 'slotB_effects.effect1MstClkDiv morph Ctrl Pedal', id: 5, bit: 3811, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 5 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect1MstClkDiv' },
    { key: 'slotB_effects.effect1MstClkDiv', name: 'slotB_effects.effect1MstClkDiv', id: 5, bit: 3816, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 5', cc: 63 },
    { key: 'slotB_effects.effect1Rate.morphWheel', name: 'slotB_effects.effect1Rate morph Wheel', id: 6, bit: 3820, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 6 · Wheel morph', deltaOf: 'slotB_effects.effect1Rate' },
    { key: 'slotB_effects.effect1Rate.morphAfterTouch', name: 'slotB_effects.effect1Rate morph After Touch', id: 6, bit: 3828, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 6 · After Touch morph', deltaOf: 'slotB_effects.effect1Rate' },
    { key: 'slotB_effects.effect1Rate.morphCtrlPedal', name: 'slotB_effects.effect1Rate morph Ctrl Pedal', id: 6, bit: 3836, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 6 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect1Rate' },
    { key: 'slotB_effects.effect1Rate', name: 'slotB_effects.effect1Rate', id: 6, bit: 3844, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 6', cc: 63 },
    { key: 'slotB_effects.effect1Amount.morphWheel', name: 'slotB_effects.effect1Amount morph Wheel', id: 7, bit: 3851, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 7 · Wheel morph', deltaOf: 'slotB_effects.effect1Amount' },
    { key: 'slotB_effects.effect1Amount.morphAfterTouch', name: 'slotB_effects.effect1Amount morph After Touch', id: 7, bit: 3859, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 7 · After Touch morph', deltaOf: 'slotB_effects.effect1Amount' },
    { key: 'slotB_effects.effect1Amount.morphCtrlPedal', name: 'slotB_effects.effect1Amount morph Ctrl Pedal', id: 7, bit: 3867, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 7 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect1Amount' },
    { key: 'slotB_effects.effect1Amount', name: 'slotB_effects.effect1Amount', id: 7, bit: 3875, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 7', cc: 62 },
    { key: 'slotB_effects.effect2Enable', name: 'slotB_effects.effect2Enable', id: 8, bit: 3882, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 8', cc: 74 },
    { key: 'slotB_effects.effect2Source', name: 'slotB_effects.effect2Source', id: 9, bit: 3883, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 9', cc: 71 },
    { key: 'slotB_effects.effect2Type', name: 'slotB_effects.effect2Type', id: 10, bit: 3885, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 10', cc: 70 },
    { key: 'slotB_effects.effect2MstClk', name: 'slotB_effects.effect2MstClk', id: 11, bit: 3888, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 11', cc: 118 },
    { key: 'slotB_effects.effect2MstClkDiv.morphWheel', name: 'slotB_effects.effect2MstClkDiv morph Wheel', id: 12, bit: 3889, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 12 · Wheel morph', deltaOf: 'slotB_effects.effect2MstClkDiv' },
    { key: 'slotB_effects.effect2MstClkDiv.morphAfterTouch', name: 'slotB_effects.effect2MstClkDiv morph After Touch', id: 12, bit: 3894, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 12 · After Touch morph', deltaOf: 'slotB_effects.effect2MstClkDiv' },
    { key: 'slotB_effects.effect2MstClkDiv.morphCtrlPedal', name: 'slotB_effects.effect2MstClkDiv morph Ctrl Pedal', id: 12, bit: 3899, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 12 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect2MstClkDiv' },
    { key: 'slotB_effects.effect2MstClkDiv', name: 'slotB_effects.effect2MstClkDiv', id: 12, bit: 3904, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 12', cc: 73 },
    { key: 'slotB_effects.effect2Rate.morphWheel', name: 'slotB_effects.effect2Rate morph Wheel', id: 13, bit: 3908, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 13 · Wheel morph', deltaOf: 'slotB_effects.effect2Rate' },
    { key: 'slotB_effects.effect2Rate.morphAfterTouch', name: 'slotB_effects.effect2Rate morph After Touch', id: 13, bit: 3916, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 13 · After Touch morph', deltaOf: 'slotB_effects.effect2Rate' },
    { key: 'slotB_effects.effect2Rate.morphCtrlPedal', name: 'slotB_effects.effect2Rate morph Ctrl Pedal', id: 13, bit: 3924, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 13 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect2Rate' },
    { key: 'slotB_effects.effect2Rate', name: 'slotB_effects.effect2Rate', id: 13, bit: 3932, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 13', cc: 73 },
    { key: 'slotB_effects.effect2Amount.morphWheel', name: 'slotB_effects.effect2Amount morph Wheel', id: 14, bit: 3939, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 14 · Wheel morph', deltaOf: 'slotB_effects.effect2Amount' },
    { key: 'slotB_effects.effect2Amount.morphAfterTouch', name: 'slotB_effects.effect2Amount morph After Touch', id: 14, bit: 3947, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 14 · After Touch morph', deltaOf: 'slotB_effects.effect2Amount' },
    { key: 'slotB_effects.effect2Amount.morphCtrlPedal', name: 'slotB_effects.effect2Amount morph Ctrl Pedal', id: 14, bit: 3955, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 14 · Ctrl Pedal morph', deltaOf: 'slotB_effects.effect2Amount' },
    { key: 'slotB_effects.effect2Amount', name: 'slotB_effects.effect2Amount', id: 14, bit: 3963, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 14', cc: 72 },
    { key: 'slotB_effects.delayEnable', name: 'slotB_effects.delayEnable', id: 15, bit: 3970, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 15', cc: 80 },
    { key: 'slotB_effects.delaySource', name: 'slotB_effects.delaySource', id: 16, bit: 3971, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 16', cc: 75 },
    { key: 'slotB_effects.delayMode', name: 'slotB_effects.delayMode', id: 17, bit: 3973, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 17', cc: 79 },
    { key: 'slotB_effects.delayMstClk', name: 'slotB_effects.delayMstClk', id: 18, bit: 3974, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 18', cc: 119 },
    { key: 'slotB_effects.delayMstClkDiv.morphWheel', name: 'slotB_effects.delayMstClkDiv morph Wheel', id: 19, bit: 3975, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 19 · Wheel morph', deltaOf: 'slotB_effects.delayMstClkDiv' },
    { key: 'slotB_effects.delayMstClkDiv.morphAfterTouch', name: 'slotB_effects.delayMstClkDiv morph After Touch', id: 19, bit: 3980, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 19 · After Touch morph', deltaOf: 'slotB_effects.delayMstClkDiv' },
    { key: 'slotB_effects.delayMstClkDiv.morphCtrlPedal', name: 'slotB_effects.delayMstClkDiv morph Ctrl Pedal', id: 19, bit: 3985, width: 5, min: -14, max: 14, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 19 · Ctrl Pedal morph', deltaOf: 'slotB_effects.delayMstClkDiv' },
    { key: 'slotB_effects.delayMstClkDiv', name: 'slotB_effects.delayMstClkDiv', id: 19, bit: 3990, width: 4, min: 0, max: 14, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 19', cc: 77 },
    { key: 'slotB_effects.delayRate.morphWheel', name: 'slotB_effects.delayRate morph Wheel', id: 20, bit: 3994, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 20 · Wheel morph', deltaOf: 'slotB_effects.delayRate' },
    { key: 'slotB_effects.delayRate.morphAfterTouch', name: 'slotB_effects.delayRate morph After Touch', id: 20, bit: 4007, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 20 · After Touch morph', deltaOf: 'slotB_effects.delayRate' },
    { key: 'slotB_effects.delayRate.morphCtrlPedal', name: 'slotB_effects.delayRate morph Ctrl Pedal', id: 20, bit: 4020, width: 13, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 20 · Ctrl Pedal morph', deltaOf: 'slotB_effects.delayRate' },
    { key: 'slotB_effects.delayRate', name: 'slotB_effects.delayRate', id: 20, bit: 4033, width: 12, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 20', cc: 77 },
    { key: 'slotB_effects.delayAmount.morphWheel', name: 'slotB_effects.delayAmount morph Wheel', id: 21, bit: 4045, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 21 · Wheel morph', deltaOf: 'slotB_effects.delayAmount' },
    { key: 'slotB_effects.delayAmount.morphAfterTouch', name: 'slotB_effects.delayAmount morph After Touch', id: 21, bit: 4053, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 21 · After Touch morph', deltaOf: 'slotB_effects.delayAmount' },
    { key: 'slotB_effects.delayAmount.morphCtrlPedal', name: 'slotB_effects.delayAmount morph Ctrl Pedal', id: 21, bit: 4061, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 21 · Ctrl Pedal morph', deltaOf: 'slotB_effects.delayAmount' },
    { key: 'slotB_effects.delayAmount', name: 'slotB_effects.delayAmount', id: 21, bit: 4069, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 21', cc: 76 },
    { key: 'slotB_effects.delayFeedback', name: 'slotB_effects.delayFeedback', id: 22, bit: 4076, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 22', cc: 78 },
    { key: 'slotB_effects.ampSimEqEnable', name: 'slotB_effects.ampSimEqEnable', id: 23, bit: 4083, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 23', cc: 87 },
    { key: 'slotB_effects.ampSimEqSource', name: 'slotB_effects.ampSimEqSource', id: 24, bit: 4084, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 24', cc: 90 },
    { key: 'slotB_effects.ampSimEqType', name: 'slotB_effects.ampSimEqType', id: 25, bit: 4086, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 25', cc: 81 },
    { key: 'slotB_effects.ampSimEqDrive', name: 'slotB_effects.ampSimEqDrive', id: 26, bit: 4088, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 26', cc: 83 },
    { key: 'slotB_effects.ampSimEqTreble', name: 'slotB_effects.ampSimEqTreble', id: 27, bit: 4095, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 27', cc: 86 },
    { key: 'slotB_effects.ampSimEqMid', name: 'slotB_effects.ampSimEqMid', id: 28, bit: 4102, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 28', cc: 85 },
    { key: 'slotB_effects.ampSimEqBass', name: 'slotB_effects.ampSimEqBass', id: 29, bit: 4109, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 29', cc: 84 },
    { key: 'slotB_effects.ampSimEqMidFreq', name: 'slotB_effects.ampSimEqMidFreq', id: 30, bit: 4116, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage 2 OS 3.00 parameter containers · slotB_effects 30', cc: 6 },
  ],
  sets: {
    slotA_common: 'slot_common',
    slotA_b3Select: 'slot_b3Select',
    slotA_voxSelect: 'slot_voxSelect',
    slotA_farfSelect: 'slot_farfSelect',
    slotA_b3PresetI: 'slot_b3PresetI',
    slotA_voxPresetI: 'slot_voxPresetI',
    slotA_farfPresetI: 'slot_farfPresetI',
    slotA_b3PresetII: 'slot_b3PresetII',
    slotA_voxPresetII: 'slot_voxPresetII',
    slotA_farfPresetII: 'slot_farfPresetII',
    slotA_piano: 'slot_piano',
    slotA_arpLfo: 'slot_arpLfo',
    slotA_synth: 'slot_synth',
    slotA_extern: 'slot_extern',
    slotA_effects: 'slot_effects',
    slotB_common: 'slot_common',
    slotB_b3Select: 'slot_b3Select',
    slotB_voxSelect: 'slot_voxSelect',
    slotB_farfSelect: 'slot_farfSelect',
    slotB_b3PresetI: 'slot_b3PresetI',
    slotB_voxPresetI: 'slot_voxPresetI',
    slotB_farfPresetI: 'slot_farfPresetI',
    slotB_b3PresetII: 'slot_b3PresetII',
    slotB_voxPresetII: 'slot_voxPresetII',
    slotB_farfPresetII: 'slot_farfPresetII',
    slotB_piano: 'slot_piano',
    slotB_arpLfo: 'slot_arpLfo',
    slotB_synth: 'slot_synth',
    slotB_extern: 'slot_extern',
    slotB_effects: 'slot_effects',
  },
};
