// AUTO-GENERATED (stage-classic) — DO NOT EDIT MANUALLY.
//
// Provenance: Stage Classic OS 5.08 parameter descriptors; Stage Classic OS 5.08 program record: u8 version 10 (0–9 converted), common, panel A, panel B = 400 bytes; Stage EX OS 6.08 identical.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record start (its u8 version is bit 0); where the record starts in a .nspg file is not confirmed.
import type { LegacyLayout } from '../clavia/legacy-record';

export type Ns1FieldKey =
  | 'common.param0'
  | 'common.param1'
  | 'common.param2'
  | 'common.param3'
  | 'common.param4'
  | 'common.param5'
  | 'common.param6'
  | 'common.param7'
  | 'common.param8'
  | 'common.param9'
  | 'common.param10'
  | 'common.param11'
  | 'common.param12'
  | 'common.param13'
  | 'common.param14'
  | 'common.param15'
  | 'common.param16'
  | 'common.organModel'
  | 'common.b3VibratoType'
  | 'common.fTypeVibratoType'
  | 'common.fTypeVibratoMode'
  | 'common.vTypeVibratoMode'
  | 'common.b3PercussionHarmonic'
  | 'common.b3PercussionDecay'
  | 'common.b3PercussionVolume'
  | 'common.param25'
  | 'common.organPitchStick'
  | 'common.leslieSource'
  | 'common.leslieDrive'
  | 'common.leslieSpeed.morph1'
  | 'common.leslieSpeed.morph2'
  | 'common.leslieSpeed.morph3'
  | 'common.leslieSpeed'
  | 'common.leslieStop'
  | 'common.leslieMode'
  | 'common.compressorAmount'
  | 'common.compressorMode'
  | 'common.reverbDryWet'
  | 'common.param36'
  | 'common.reverbMode'
  | 'common.reverbSize'
  | 'panelA.organPreset'
  | 'panelA.fTypeBas16'
  | 'panelA.fTypeStr16'
  | 'panelA.fTypeFlute8'
  | 'panelA.fTypeOboe8'
  | 'panelA.fTypeTrmp8'
  | 'panelA.fTypeStr8'
  | 'panelA.fTypeFlute4'
  | 'panelA.fTypeStr4'
  | 'panelA.fType223'
  | 'panelA.fTypeBas1610'
  | 'panelA.fTypeStr1611'
  | 'panelA.fTypeFlute812'
  | 'panelA.fTypeOboe813'
  | 'panelA.fTypeTrmp814'
  | 'panelA.fTypeStr815'
  | 'panelA.fTypeFlute416'
  | 'panelA.fTypeStr417'
  | 'panelA.fType22318'
  | 'panelA.vTypeSub.morph1'
  | 'panelA.vTypeSub.morph2'
  | 'panelA.vTypeSub.morph3'
  | 'panelA.vTypeSub'
  | 'panelA.vTypeSub3.morph1'
  | 'panelA.vTypeSub3.morph2'
  | 'panelA.vTypeSub3.morph3'
  | 'panelA.vTypeSub3'
  | 'panelA.vTypeFund.morph1'
  | 'panelA.vTypeFund.morph2'
  | 'panelA.vTypeFund.morph3'
  | 'panelA.vTypeFund'
  | 'panelA.vType2nd.morph1'
  | 'panelA.vType2nd.morph2'
  | 'panelA.vType2nd.morph3'
  | 'panelA.vType2nd'
  | 'panelA.vType5th.morph1'
  | 'panelA.vType5th.morph2'
  | 'panelA.vType5th.morph3'
  | 'panelA.vType5th'
  | 'panelA.vType348th.morph1'
  | 'panelA.vType348th.morph2'
  | 'panelA.vType348th.morph3'
  | 'panelA.vType348th'
  | 'panelA.param25.morph1'
  | 'panelA.param25.morph2'
  | 'panelA.param25.morph3'
  | 'panelA.param25'
  | 'panelA.vTypeMix1.morph1'
  | 'panelA.vTypeMix1.morph2'
  | 'panelA.vTypeMix1.morph3'
  | 'panelA.vTypeMix1'
  | 'panelA.vTypeMix2.morph1'
  | 'panelA.vTypeMix2.morph2'
  | 'panelA.vTypeMix2.morph3'
  | 'panelA.vTypeMix2'
  | 'panelA.vTypeSub28.morph1'
  | 'panelA.vTypeSub28.morph2'
  | 'panelA.vTypeSub28.morph3'
  | 'panelA.vTypeSub28'
  | 'panelA.vTypeSub329.morph1'
  | 'panelA.vTypeSub329.morph2'
  | 'panelA.vTypeSub329.morph3'
  | 'panelA.vTypeSub329'
  | 'panelA.vTypeFund30.morph1'
  | 'panelA.vTypeFund30.morph2'
  | 'panelA.vTypeFund30.morph3'
  | 'panelA.vTypeFund30'
  | 'panelA.vType2nd31.morph1'
  | 'panelA.vType2nd31.morph2'
  | 'panelA.vType2nd31.morph3'
  | 'panelA.vType2nd31'
  | 'panelA.vType5th32.morph1'
  | 'panelA.vType5th32.morph2'
  | 'panelA.vType5th32.morph3'
  | 'panelA.vType5th32'
  | 'panelA.vType348th33.morph1'
  | 'panelA.vType348th33.morph2'
  | 'panelA.vType348th33.morph3'
  | 'panelA.vType348th33'
  | 'panelA.param34.morph1'
  | 'panelA.param34.morph2'
  | 'panelA.param34.morph3'
  | 'panelA.param34'
  | 'panelA.vTypeMix135.morph1'
  | 'panelA.vTypeMix135.morph2'
  | 'panelA.vTypeMix135.morph3'
  | 'panelA.vTypeMix135'
  | 'panelA.vTypeMix236.morph1'
  | 'panelA.vTypeMix236.morph2'
  | 'panelA.vTypeMix236.morph3'
  | 'panelA.vTypeMix236'
  | 'panelA.b3Sub.morph1'
  | 'panelA.b3Sub.morph2'
  | 'panelA.b3Sub.morph3'
  | 'panelA.b3Sub'
  | 'panelA.b3Sub3.morph1'
  | 'panelA.b3Sub3.morph2'
  | 'panelA.b3Sub3.morph3'
  | 'panelA.b3Sub3'
  | 'panelA.b3Fund.morph1'
  | 'panelA.b3Fund.morph2'
  | 'panelA.b3Fund.morph3'
  | 'panelA.b3Fund'
  | 'panelA.b32nd.morph1'
  | 'panelA.b32nd.morph2'
  | 'panelA.b32nd.morph3'
  | 'panelA.b32nd'
  | 'panelA.b33rd.morph1'
  | 'panelA.b33rd.morph2'
  | 'panelA.b33rd.morph3'
  | 'panelA.b33rd'
  | 'panelA.b34th.morph1'
  | 'panelA.b34th.morph2'
  | 'panelA.b34th.morph3'
  | 'panelA.b34th'
  | 'panelA.b35th.morph1'
  | 'panelA.b35th.morph2'
  | 'panelA.b35th.morph3'
  | 'panelA.b35th'
  | 'panelA.b36th.morph1'
  | 'panelA.b36th.morph2'
  | 'panelA.b36th.morph3'
  | 'panelA.b36th'
  | 'panelA.b38th.morph1'
  | 'panelA.b38th.morph2'
  | 'panelA.b38th.morph3'
  | 'panelA.b38th'
  | 'panelA.b3Sub46.morph1'
  | 'panelA.b3Sub46.morph2'
  | 'panelA.b3Sub46.morph3'
  | 'panelA.b3Sub46'
  | 'panelA.b3Sub347.morph1'
  | 'panelA.b3Sub347.morph2'
  | 'panelA.b3Sub347.morph3'
  | 'panelA.b3Sub347'
  | 'panelA.b3Fund48.morph1'
  | 'panelA.b3Fund48.morph2'
  | 'panelA.b3Fund48.morph3'
  | 'panelA.b3Fund48'
  | 'panelA.b32nd49.morph1'
  | 'panelA.b32nd49.morph2'
  | 'panelA.b32nd49.morph3'
  | 'panelA.b32nd49'
  | 'panelA.b33rd50.morph1'
  | 'panelA.b33rd50.morph2'
  | 'panelA.b33rd50.morph3'
  | 'panelA.b33rd50'
  | 'panelA.b34th51.morph1'
  | 'panelA.b34th51.morph2'
  | 'panelA.b34th51.morph3'
  | 'panelA.b34th51'
  | 'panelA.b35th52.morph1'
  | 'panelA.b35th52.morph2'
  | 'panelA.b35th52.morph3'
  | 'panelA.b35th52'
  | 'panelA.b36th53.morph1'
  | 'panelA.b36th53.morph2'
  | 'panelA.b36th53.morph3'
  | 'panelA.b36th53'
  | 'panelA.b38th54.morph1'
  | 'panelA.b38th54.morph2'
  | 'panelA.b38th54.morph3'
  | 'panelA.b38th54'
  | 'panelA.b3VibratoMode'
  | 'panelA.b3VibratoMode56'
  | 'panelA.b3PercussionMode'
  | 'panelA.b3PercussionMode58'
  | 'panelA.pianoUnisonAmount'
  | 'panelA.clavinetEqMode'
  | 'panelA.clavinetEqMode62'
  | 'panelA.param63'
  | 'panelA.param64'
  | 'panelA.param65'
  | 'panelA.pianoDynamics'
  | 'panelA.pianoMonoMode'
  | 'panelA.param68'
  | 'panelA.pianoStringRes'
  | 'panelA.param70'
  | 'panelA.glideRate'
  | 'panelA.glideMode'
  | 'panelA.voicesMode'
  | 'panelA.unisonAmount'
  | 'panelA.vibratoMode'
  | 'panelA.modEnvelopeAttack'
  | 'panelA.modEnvelopeRelDecay'
  | 'panelA.modEnvelopeMode'
  | 'panelA.modEnvelopeVelocity'
  | 'panelA.param80'
  | 'panelA.param81'
  | 'panelA.oscillatorGroupTimbre.morph1'
  | 'panelA.oscillatorGroupTimbre.morph2'
  | 'panelA.oscillatorGroupTimbre.morph3'
  | 'panelA.oscillatorGroupTimbre'
  | 'panelA.param83'
  | 'panelA.oscillatorGroupTimbreCtrl'
  | 'panelA.oscillatorGroupModEnvelope'
  | 'panelA.filterFrequency.morph1'
  | 'panelA.filterFrequency.morph2'
  | 'panelA.filterFrequency.morph3'
  | 'panelA.filterFrequency'
  | 'panelA.filterResonance'
  | 'panelA.filterFreqCtrl'
  | 'panelA.filterModEnvelope'
  | 'panelA.filterKbTrack'
  | 'panelA.filterSlope'
  | 'panelA.ampEnvelopeAttack'
  | 'panelA.ampEnvelopeRelDecay'
  | 'panelA.ampEnvelopeMode'
  | 'panelA.ampEnvelopeVelocity'
  | 'panelA.equalizerBass'
  | 'panelA.equalizerTreble'
  | 'panelA.vibratoRate'
  | 'panelA.vibratoAmount'
  | 'panelA.param100'
  | 'panelA.param102'
  | 'panelA.param103'
  | 'panelA.param104.morph1'
  | 'panelA.param104.morph2'
  | 'panelA.param104.morph3'
  | 'panelA.param104'
  | 'panelA.param105'
  | 'panelA.param106'
  | 'panelA.param107'
  | 'panelA.param108'
  | 'panelA.param110.morph1'
  | 'panelA.param110.morph2'
  | 'panelA.param110.morph3'
  | 'panelA.param110'
  | 'panelA.param111'
  | 'panelA.param112'
  | 'panelA.param113'
  | 'panelA.param114'
  | 'panelA.param116'
  | 'panelA.effect1Type'
  | 'panelA.effect1Source'
  | 'panelA.effect1Amount.morph1'
  | 'panelA.effect1Amount.morph2'
  | 'panelA.effect1Amount.morph3'
  | 'panelA.effect1Amount'
  | 'panelA.effect1Rate.morph1'
  | 'panelA.effect1Rate.morph2'
  | 'panelA.effect1Rate.morph3'
  | 'panelA.effect1Rate'
  | 'panelA.effect1Mode'
  | 'panelA.effect2Type'
  | 'panelA.effect2Source'
  | 'panelA.effect2Amount.morph1'
  | 'panelA.effect2Amount.morph2'
  | 'panelA.effect2Amount.morph3'
  | 'panelA.effect2Amount'
  | 'panelA.effect2Rate.morph1'
  | 'panelA.effect2Rate.morph2'
  | 'panelA.effect2Rate.morph3'
  | 'panelA.effect2Rate'
  | 'panelA.effect2Mode'
  | 'panelA.delaySource'
  | 'panelA.delayAmount.morph1'
  | 'panelA.delayAmount.morph2'
  | 'panelA.delayAmount.morph3'
  | 'panelA.delayAmount'
  | 'panelA.param129.morph1'
  | 'panelA.param129.morph2'
  | 'panelA.param129.morph3'
  | 'panelA.param129'
  | 'panelA.delayFeedback'
  | 'panelA.delayPingPong'
  | 'panelA.delayMode'
  | 'panelA.ampSimEqModel'
  | 'panelA.ampSimEqSource'
  | 'panelA.ampSimEqDrive'
  | 'panelA.ampSimEqBass'
  | 'panelA.ampSimEqMid'
  | 'panelA.ampSimEqTreble'
  | 'panelA.ampSimEqMode'
  | 'panelA.param140'
  | 'panelA.param142'
  | 'panelA.organSustainPedal'
  | 'panelA.organOctaveShift'
  | 'panelA.organLevel.morph1'
  | 'panelA.organLevel.morph2'
  | 'panelA.organLevel.morph3'
  | 'panelA.organLevel'
  | 'panelA.organMode'
  | 'panelA.param147'
  | 'panelA.pianoPitchStick'
  | 'panelA.pianoSustainPedal'
  | 'panelA.pianoOctaveShift'
  | 'panelA.pianoLevel.morph1'
  | 'panelA.pianoLevel.morph2'
  | 'panelA.pianoLevel.morph3'
  | 'panelA.pianoLevel'
  | 'panelA.pianoMode'
  | 'panelA.param153'
  | 'panelA.synthPitchStick'
  | 'panelA.synthSustainPedal'
  | 'panelA.synthOctaveShift'
  | 'panelA.synthLevel.morph1'
  | 'panelA.synthLevel.morph2'
  | 'panelA.synthLevel.morph3'
  | 'panelA.synthLevel'
  | 'panelA.synthMode'
  | 'panelA.param159'
  | 'panelA.externPitchStick'
  | 'panelA.externSustainPedal'
  | 'panelA.externOctaveShift'
  | 'panelA.externLevel.morph1'
  | 'panelA.externLevel.morph2'
  | 'panelA.externLevel.morph3'
  | 'panelA.externLevel'
  | 'panelA.externMode'
  | 'panelA.param165'
  | 'panelB.organPreset'
  | 'panelB.fTypeBas16'
  | 'panelB.fTypeStr16'
  | 'panelB.fTypeFlute8'
  | 'panelB.fTypeOboe8'
  | 'panelB.fTypeTrmp8'
  | 'panelB.fTypeStr8'
  | 'panelB.fTypeFlute4'
  | 'panelB.fTypeStr4'
  | 'panelB.fType223'
  | 'panelB.fTypeBas1610'
  | 'panelB.fTypeStr1611'
  | 'panelB.fTypeFlute812'
  | 'panelB.fTypeOboe813'
  | 'panelB.fTypeTrmp814'
  | 'panelB.fTypeStr815'
  | 'panelB.fTypeFlute416'
  | 'panelB.fTypeStr417'
  | 'panelB.fType22318'
  | 'panelB.vTypeSub.morph1'
  | 'panelB.vTypeSub.morph2'
  | 'panelB.vTypeSub.morph3'
  | 'panelB.vTypeSub'
  | 'panelB.vTypeSub3.morph1'
  | 'panelB.vTypeSub3.morph2'
  | 'panelB.vTypeSub3.morph3'
  | 'panelB.vTypeSub3'
  | 'panelB.vTypeFund.morph1'
  | 'panelB.vTypeFund.morph2'
  | 'panelB.vTypeFund.morph3'
  | 'panelB.vTypeFund'
  | 'panelB.vType2nd.morph1'
  | 'panelB.vType2nd.morph2'
  | 'panelB.vType2nd.morph3'
  | 'panelB.vType2nd'
  | 'panelB.vType5th.morph1'
  | 'panelB.vType5th.morph2'
  | 'panelB.vType5th.morph3'
  | 'panelB.vType5th'
  | 'panelB.vType348th.morph1'
  | 'panelB.vType348th.morph2'
  | 'panelB.vType348th.morph3'
  | 'panelB.vType348th'
  | 'panelB.param25.morph1'
  | 'panelB.param25.morph2'
  | 'panelB.param25.morph3'
  | 'panelB.param25'
  | 'panelB.vTypeMix1.morph1'
  | 'panelB.vTypeMix1.morph2'
  | 'panelB.vTypeMix1.morph3'
  | 'panelB.vTypeMix1'
  | 'panelB.vTypeMix2.morph1'
  | 'panelB.vTypeMix2.morph2'
  | 'panelB.vTypeMix2.morph3'
  | 'panelB.vTypeMix2'
  | 'panelB.vTypeSub28.morph1'
  | 'panelB.vTypeSub28.morph2'
  | 'panelB.vTypeSub28.morph3'
  | 'panelB.vTypeSub28'
  | 'panelB.vTypeSub329.morph1'
  | 'panelB.vTypeSub329.morph2'
  | 'panelB.vTypeSub329.morph3'
  | 'panelB.vTypeSub329'
  | 'panelB.vTypeFund30.morph1'
  | 'panelB.vTypeFund30.morph2'
  | 'panelB.vTypeFund30.morph3'
  | 'panelB.vTypeFund30'
  | 'panelB.vType2nd31.morph1'
  | 'panelB.vType2nd31.morph2'
  | 'panelB.vType2nd31.morph3'
  | 'panelB.vType2nd31'
  | 'panelB.vType5th32.morph1'
  | 'panelB.vType5th32.morph2'
  | 'panelB.vType5th32.morph3'
  | 'panelB.vType5th32'
  | 'panelB.vType348th33.morph1'
  | 'panelB.vType348th33.morph2'
  | 'panelB.vType348th33.morph3'
  | 'panelB.vType348th33'
  | 'panelB.param34.morph1'
  | 'panelB.param34.morph2'
  | 'panelB.param34.morph3'
  | 'panelB.param34'
  | 'panelB.vTypeMix135.morph1'
  | 'panelB.vTypeMix135.morph2'
  | 'panelB.vTypeMix135.morph3'
  | 'panelB.vTypeMix135'
  | 'panelB.vTypeMix236.morph1'
  | 'panelB.vTypeMix236.morph2'
  | 'panelB.vTypeMix236.morph3'
  | 'panelB.vTypeMix236'
  | 'panelB.b3Sub.morph1'
  | 'panelB.b3Sub.morph2'
  | 'panelB.b3Sub.morph3'
  | 'panelB.b3Sub'
  | 'panelB.b3Sub3.morph1'
  | 'panelB.b3Sub3.morph2'
  | 'panelB.b3Sub3.morph3'
  | 'panelB.b3Sub3'
  | 'panelB.b3Fund.morph1'
  | 'panelB.b3Fund.morph2'
  | 'panelB.b3Fund.morph3'
  | 'panelB.b3Fund'
  | 'panelB.b32nd.morph1'
  | 'panelB.b32nd.morph2'
  | 'panelB.b32nd.morph3'
  | 'panelB.b32nd'
  | 'panelB.b33rd.morph1'
  | 'panelB.b33rd.morph2'
  | 'panelB.b33rd.morph3'
  | 'panelB.b33rd'
  | 'panelB.b34th.morph1'
  | 'panelB.b34th.morph2'
  | 'panelB.b34th.morph3'
  | 'panelB.b34th'
  | 'panelB.b35th.morph1'
  | 'panelB.b35th.morph2'
  | 'panelB.b35th.morph3'
  | 'panelB.b35th'
  | 'panelB.b36th.morph1'
  | 'panelB.b36th.morph2'
  | 'panelB.b36th.morph3'
  | 'panelB.b36th'
  | 'panelB.b38th.morph1'
  | 'panelB.b38th.morph2'
  | 'panelB.b38th.morph3'
  | 'panelB.b38th'
  | 'panelB.b3Sub46.morph1'
  | 'panelB.b3Sub46.morph2'
  | 'panelB.b3Sub46.morph3'
  | 'panelB.b3Sub46'
  | 'panelB.b3Sub347.morph1'
  | 'panelB.b3Sub347.morph2'
  | 'panelB.b3Sub347.morph3'
  | 'panelB.b3Sub347'
  | 'panelB.b3Fund48.morph1'
  | 'panelB.b3Fund48.morph2'
  | 'panelB.b3Fund48.morph3'
  | 'panelB.b3Fund48'
  | 'panelB.b32nd49.morph1'
  | 'panelB.b32nd49.morph2'
  | 'panelB.b32nd49.morph3'
  | 'panelB.b32nd49'
  | 'panelB.b33rd50.morph1'
  | 'panelB.b33rd50.morph2'
  | 'panelB.b33rd50.morph3'
  | 'panelB.b33rd50'
  | 'panelB.b34th51.morph1'
  | 'panelB.b34th51.morph2'
  | 'panelB.b34th51.morph3'
  | 'panelB.b34th51'
  | 'panelB.b35th52.morph1'
  | 'panelB.b35th52.morph2'
  | 'panelB.b35th52.morph3'
  | 'panelB.b35th52'
  | 'panelB.b36th53.morph1'
  | 'panelB.b36th53.morph2'
  | 'panelB.b36th53.morph3'
  | 'panelB.b36th53'
  | 'panelB.b38th54.morph1'
  | 'panelB.b38th54.morph2'
  | 'panelB.b38th54.morph3'
  | 'panelB.b38th54'
  | 'panelB.b3VibratoMode'
  | 'panelB.b3VibratoMode56'
  | 'panelB.b3PercussionMode'
  | 'panelB.b3PercussionMode58'
  | 'panelB.pianoUnisonAmount'
  | 'panelB.clavinetEqMode'
  | 'panelB.clavinetEqMode62'
  | 'panelB.param63'
  | 'panelB.param64'
  | 'panelB.param65'
  | 'panelB.pianoDynamics'
  | 'panelB.pianoMonoMode'
  | 'panelB.param68'
  | 'panelB.pianoStringRes'
  | 'panelB.param70'
  | 'panelB.glideRate'
  | 'panelB.glideMode'
  | 'panelB.voicesMode'
  | 'panelB.unisonAmount'
  | 'panelB.vibratoMode'
  | 'panelB.modEnvelopeAttack'
  | 'panelB.modEnvelopeRelDecay'
  | 'panelB.modEnvelopeMode'
  | 'panelB.modEnvelopeVelocity'
  | 'panelB.param80'
  | 'panelB.param81'
  | 'panelB.oscillatorGroupTimbre.morph1'
  | 'panelB.oscillatorGroupTimbre.morph2'
  | 'panelB.oscillatorGroupTimbre.morph3'
  | 'panelB.oscillatorGroupTimbre'
  | 'panelB.param83'
  | 'panelB.oscillatorGroupTimbreCtrl'
  | 'panelB.oscillatorGroupModEnvelope'
  | 'panelB.filterFrequency.morph1'
  | 'panelB.filterFrequency.morph2'
  | 'panelB.filterFrequency.morph3'
  | 'panelB.filterFrequency'
  | 'panelB.filterResonance'
  | 'panelB.filterFreqCtrl'
  | 'panelB.filterModEnvelope'
  | 'panelB.filterKbTrack'
  | 'panelB.filterSlope'
  | 'panelB.ampEnvelopeAttack'
  | 'panelB.ampEnvelopeRelDecay'
  | 'panelB.ampEnvelopeMode'
  | 'panelB.ampEnvelopeVelocity'
  | 'panelB.equalizerBass'
  | 'panelB.equalizerTreble'
  | 'panelB.vibratoRate'
  | 'panelB.vibratoAmount'
  | 'panelB.param100'
  | 'panelB.param102'
  | 'panelB.param103'
  | 'panelB.param104.morph1'
  | 'panelB.param104.morph2'
  | 'panelB.param104.morph3'
  | 'panelB.param104'
  | 'panelB.param105'
  | 'panelB.param106'
  | 'panelB.param107'
  | 'panelB.param108'
  | 'panelB.param110.morph1'
  | 'panelB.param110.morph2'
  | 'panelB.param110.morph3'
  | 'panelB.param110'
  | 'panelB.param111'
  | 'panelB.param112'
  | 'panelB.param113'
  | 'panelB.param114'
  | 'panelB.param116'
  | 'panelB.effect1Type'
  | 'panelB.effect1Source'
  | 'panelB.effect1Amount.morph1'
  | 'panelB.effect1Amount.morph2'
  | 'panelB.effect1Amount.morph3'
  | 'panelB.effect1Amount'
  | 'panelB.effect1Rate.morph1'
  | 'panelB.effect1Rate.morph2'
  | 'panelB.effect1Rate.morph3'
  | 'panelB.effect1Rate'
  | 'panelB.effect1Mode'
  | 'panelB.effect2Type'
  | 'panelB.effect2Source'
  | 'panelB.effect2Amount.morph1'
  | 'panelB.effect2Amount.morph2'
  | 'panelB.effect2Amount.morph3'
  | 'panelB.effect2Amount'
  | 'panelB.effect2Rate.morph1'
  | 'panelB.effect2Rate.morph2'
  | 'panelB.effect2Rate.morph3'
  | 'panelB.effect2Rate'
  | 'panelB.effect2Mode'
  | 'panelB.delaySource'
  | 'panelB.delayAmount.morph1'
  | 'panelB.delayAmount.morph2'
  | 'panelB.delayAmount.morph3'
  | 'panelB.delayAmount'
  | 'panelB.param129.morph1'
  | 'panelB.param129.morph2'
  | 'panelB.param129.morph3'
  | 'panelB.param129'
  | 'panelB.delayFeedback'
  | 'panelB.delayPingPong'
  | 'panelB.delayMode'
  | 'panelB.ampSimEqModel'
  | 'panelB.ampSimEqSource'
  | 'panelB.ampSimEqDrive'
  | 'panelB.ampSimEqBass'
  | 'panelB.ampSimEqMid'
  | 'panelB.ampSimEqTreble'
  | 'panelB.ampSimEqMode'
  | 'panelB.param140'
  | 'panelB.param142'
  | 'panelB.organSustainPedal'
  | 'panelB.organOctaveShift'
  | 'panelB.organLevel.morph1'
  | 'panelB.organLevel.morph2'
  | 'panelB.organLevel.morph3'
  | 'panelB.organLevel'
  | 'panelB.organMode'
  | 'panelB.param147'
  | 'panelB.pianoPitchStick'
  | 'panelB.pianoSustainPedal'
  | 'panelB.pianoOctaveShift'
  | 'panelB.pianoLevel.morph1'
  | 'panelB.pianoLevel.morph2'
  | 'panelB.pianoLevel.morph3'
  | 'panelB.pianoLevel'
  | 'panelB.pianoMode'
  | 'panelB.param153'
  | 'panelB.synthPitchStick'
  | 'panelB.synthSustainPedal'
  | 'panelB.synthOctaveShift'
  | 'panelB.synthLevel.morph1'
  | 'panelB.synthLevel.morph2'
  | 'panelB.synthLevel.morph3'
  | 'panelB.synthLevel'
  | 'panelB.synthMode'
  | 'panelB.param159'
  | 'panelB.externPitchStick'
  | 'panelB.externSustainPedal'
  | 'panelB.externOctaveShift'
  | 'panelB.externLevel.morph1'
  | 'panelB.externLevel.morph2'
  | 'panelB.externLevel.morph3'
  | 'panelB.externLevel'
  | 'panelB.externMode'
  | 'panelB.param165';

export const NS1_LAYOUT: LegacyLayout<Ns1FieldKey> = {
  model: 'Nord Stage Classic / Stage EX',
  source: 'Stage Classic OS 5.08 parameter descriptors',
  container: 'Stage Classic OS 5.08 program record: u8 version 10 (0–9 converted), common, panel A, panel B = 400 bytes; Stage EX OS 6.08 identical',
  recordVersion: 10,
  dataBytes: 400,
  fields: [
    { key: 'common.param0', name: 'common.param0', id: 0, bit: 8, width: 3, min: 0, max: 7, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 0' },
    { key: 'common.param1', name: 'common.param1', id: 1, bit: 11, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 1' },
    { key: 'common.param2', name: 'common.param2', id: 2, bit: 12, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 2' },
    { key: 'common.param3', name: 'common.param3', id: 3, bit: 13, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 3' },
    { key: 'common.param4', name: 'common.param4', id: 4, bit: 14, width: 4, min: 0, max: 9, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 4' },
    { key: 'common.param5', name: 'common.param5', id: 5, bit: 18, width: 4, min: 0, max: 9, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 5' },
    { key: 'common.param6', name: 'common.param6', id: 6, bit: 22, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 6' },
    { key: 'common.param7', name: 'common.param7', id: 7, bit: 24, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 7' },
    { key: 'common.param8', name: 'common.param8', id: 8, bit: 26, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 8' },
    { key: 'common.param9', name: 'common.param9', id: 9, bit: 33, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 9' },
    { key: 'common.param10', name: 'common.param10', id: 10, bit: 35, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 10' },
    { key: 'common.param11', name: 'common.param11', id: 11, bit: 42, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 11' },
    { key: 'common.param12', name: 'common.param12', id: 12, bit: 45, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 12' },
    { key: 'common.param13', name: 'common.param13', id: 13, bit: 48, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 13' },
    { key: 'common.param14', name: 'common.param14', id: 14, bit: 51, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 14' },
    { key: 'common.param15', name: 'common.param15', id: 15, bit: 54, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 15' },
    { key: 'common.param16', name: 'common.param16', id: 16, bit: 57, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 16' },
    { key: 'common.organModel', name: 'Organ Model', id: 17, bit: 60, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 17' },
    { key: 'common.b3VibratoType', name: 'B3 Vibrato Type', id: 18, bit: 62, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 18' },
    { key: 'common.fTypeVibratoType', name: 'F-Type Vibrato Type', id: 19, bit: 65, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 19' },
    { key: 'common.fTypeVibratoMode', name: 'F-Type Vibrato Mode', id: 20, bit: 67, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 20' },
    { key: 'common.vTypeVibratoMode', name: 'V-Type Vibrato Mode', id: 21, bit: 68, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 21' },
    { key: 'common.b3PercussionHarmonic', name: 'B3 Percussion Harmonic', id: 22, bit: 69, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 22' },
    { key: 'common.b3PercussionDecay', name: 'B3 Percussion Decay', id: 23, bit: 70, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 23' },
    { key: 'common.b3PercussionVolume', name: 'B3 Percussion Volume', id: 24, bit: 71, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 24' },
    { key: 'common.param25', name: 'common.param25', id: 25, bit: 72, width: 7, min: 0, max: 100, def: 50, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 25' },
    { key: 'common.organPitchStick', name: 'Organ PitchStick', id: 26, bit: 79, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 26' },
    { key: 'common.leslieSource', name: 'Leslie Source', id: 28, bit: 94, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 28' },
    { key: 'common.leslieDrive', name: 'Leslie Drive', id: 29, bit: 96, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 29' },
    { key: 'common.leslieSpeed.morph1', name: 'Leslie Speed', id: 30, bit: 103, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · common 30', deltaOf: 'common.leslieSpeed' },
    { key: 'common.leslieSpeed.morph2', name: 'Leslie Speed', id: 30, bit: 111, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · common 30', deltaOf: 'common.leslieSpeed' },
    { key: 'common.leslieSpeed.morph3', name: 'Leslie Speed', id: 30, bit: 119, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · common 30', deltaOf: 'common.leslieSpeed' },
    { key: 'common.leslieSpeed', name: 'Leslie Speed', id: 30, bit: 127, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 30' },
    { key: 'common.leslieStop', name: 'Leslie Stop', id: 31, bit: 134, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 31' },
    { key: 'common.leslieMode', name: 'Leslie Mode', id: 32, bit: 135, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 32' },
    { key: 'common.compressorAmount', name: 'Compressor Amount', id: 33, bit: 136, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 33' },
    { key: 'common.compressorMode', name: 'Compressor Mode', id: 34, bit: 143, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 34' },
    { key: 'common.reverbDryWet', name: 'Reverb Dry/Wet', id: 35, bit: 144, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 35' },
    { key: 'common.param36', name: 'common.param36', id: 36, bit: 151, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 36' },
    { key: 'common.reverbMode', name: 'Reverb Mode', id: 37, bit: 153, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 37' },
    { key: 'common.reverbSize', name: 'Reverb Size', id: 38, bit: 154, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · common 38' },
    { key: 'panelA.organPreset', name: 'Organ Preset', id: 0, bit: 176, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 0' },
    { key: 'panelA.fTypeBas16', name: 'F-Type Bas16', id: 1, bit: 177, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 1' },
    { key: 'panelA.fTypeStr16', name: 'F-Type Str16', id: 2, bit: 178, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 2' },
    { key: 'panelA.fTypeFlute8', name: 'F-Type Flute8', id: 3, bit: 179, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 3' },
    { key: 'panelA.fTypeOboe8', name: 'F-Type Oboe8', id: 4, bit: 180, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 4' },
    { key: 'panelA.fTypeTrmp8', name: 'F-Type Trmp8', id: 5, bit: 181, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 5' },
    { key: 'panelA.fTypeStr8', name: 'F-Type Str8', id: 6, bit: 182, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 6' },
    { key: 'panelA.fTypeFlute4', name: 'F-Type Flute4', id: 7, bit: 183, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 7' },
    { key: 'panelA.fTypeStr4', name: 'F-Type Str4', id: 8, bit: 184, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 8' },
    { key: 'panelA.fType223', name: 'F-Type 2 2/3', id: 9, bit: 185, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 9' },
    { key: 'panelA.fTypeBas1610', name: 'F-Type Bas16', id: 10, bit: 186, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 10' },
    { key: 'panelA.fTypeStr1611', name: 'F-Type Str16', id: 11, bit: 187, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 11' },
    { key: 'panelA.fTypeFlute812', name: 'F-Type Flute8', id: 12, bit: 188, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 12' },
    { key: 'panelA.fTypeOboe813', name: 'F-Type Oboe8', id: 13, bit: 189, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 13' },
    { key: 'panelA.fTypeTrmp814', name: 'F-Type Trmp8', id: 14, bit: 190, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 14' },
    { key: 'panelA.fTypeStr815', name: 'F-Type Str8', id: 15, bit: 191, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 15' },
    { key: 'panelA.fTypeFlute416', name: 'F-Type Flute4', id: 16, bit: 192, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 16' },
    { key: 'panelA.fTypeStr417', name: 'F-Type Str4', id: 17, bit: 193, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 17' },
    { key: 'panelA.fType22318', name: 'F-Type 2 2/3', id: 18, bit: 194, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 18' },
    { key: 'panelA.vTypeSub.morph1', name: 'V-Type Sub', id: 19, bit: 195, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 19', deltaOf: 'panelA.vTypeSub' },
    { key: 'panelA.vTypeSub.morph2', name: 'V-Type Sub', id: 19, bit: 200, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 19', deltaOf: 'panelA.vTypeSub' },
    { key: 'panelA.vTypeSub.morph3', name: 'V-Type Sub', id: 19, bit: 205, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 19', deltaOf: 'panelA.vTypeSub' },
    { key: 'panelA.vTypeSub', name: 'V-Type Sub', id: 19, bit: 210, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 19' },
    { key: 'panelA.vTypeSub3.morph1', name: 'V-Type Sub3', id: 20, bit: 214, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 20', deltaOf: 'panelA.vTypeSub3' },
    { key: 'panelA.vTypeSub3.morph2', name: 'V-Type Sub3', id: 20, bit: 219, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 20', deltaOf: 'panelA.vTypeSub3' },
    { key: 'panelA.vTypeSub3.morph3', name: 'V-Type Sub3', id: 20, bit: 224, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 20', deltaOf: 'panelA.vTypeSub3' },
    { key: 'panelA.vTypeSub3', name: 'V-Type Sub3', id: 20, bit: 229, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 20' },
    { key: 'panelA.vTypeFund.morph1', name: 'V-Type Fund', id: 21, bit: 233, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 21', deltaOf: 'panelA.vTypeFund' },
    { key: 'panelA.vTypeFund.morph2', name: 'V-Type Fund', id: 21, bit: 238, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 21', deltaOf: 'panelA.vTypeFund' },
    { key: 'panelA.vTypeFund.morph3', name: 'V-Type Fund', id: 21, bit: 243, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 21', deltaOf: 'panelA.vTypeFund' },
    { key: 'panelA.vTypeFund', name: 'V-Type Fund', id: 21, bit: 248, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 21' },
    { key: 'panelA.vType2nd.morph1', name: 'V-Type 2nd', id: 22, bit: 252, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 22', deltaOf: 'panelA.vType2nd' },
    { key: 'panelA.vType2nd.morph2', name: 'V-Type 2nd', id: 22, bit: 257, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 22', deltaOf: 'panelA.vType2nd' },
    { key: 'panelA.vType2nd.morph3', name: 'V-Type 2nd', id: 22, bit: 262, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 22', deltaOf: 'panelA.vType2nd' },
    { key: 'panelA.vType2nd', name: 'V-Type 2nd', id: 22, bit: 267, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 22' },
    { key: 'panelA.vType5th.morph1', name: 'V-Type 5th', id: 23, bit: 271, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 23', deltaOf: 'panelA.vType5th' },
    { key: 'panelA.vType5th.morph2', name: 'V-Type 5th', id: 23, bit: 276, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 23', deltaOf: 'panelA.vType5th' },
    { key: 'panelA.vType5th.morph3', name: 'V-Type 5th', id: 23, bit: 281, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 23', deltaOf: 'panelA.vType5th' },
    { key: 'panelA.vType5th', name: 'V-Type 5th', id: 23, bit: 286, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 23' },
    { key: 'panelA.vType348th.morph1', name: 'V-Type 3-4-8th', id: 24, bit: 290, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 24', deltaOf: 'panelA.vType348th' },
    { key: 'panelA.vType348th.morph2', name: 'V-Type 3-4-8th', id: 24, bit: 295, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 24', deltaOf: 'panelA.vType348th' },
    { key: 'panelA.vType348th.morph3', name: 'V-Type 3-4-8th', id: 24, bit: 300, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 24', deltaOf: 'panelA.vType348th' },
    { key: 'panelA.vType348th', name: 'V-Type 3-4-8th', id: 24, bit: 305, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 24' },
    { key: 'panelA.param25.morph1', name: 'panelA.param25.morph1', id: 25, bit: 309, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 25', deltaOf: 'panelA.param25' },
    { key: 'panelA.param25.morph2', name: 'panelA.param25.morph2', id: 25, bit: 314, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 25', deltaOf: 'panelA.param25' },
    { key: 'panelA.param25.morph3', name: 'panelA.param25.morph3', id: 25, bit: 319, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 25', deltaOf: 'panelA.param25' },
    { key: 'panelA.param25', name: 'panelA.param25', id: 25, bit: 324, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 25' },
    { key: 'panelA.vTypeMix1.morph1', name: 'V-Type Mix 1', id: 26, bit: 328, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 26', deltaOf: 'panelA.vTypeMix1' },
    { key: 'panelA.vTypeMix1.morph2', name: 'V-Type Mix 1', id: 26, bit: 333, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 26', deltaOf: 'panelA.vTypeMix1' },
    { key: 'panelA.vTypeMix1.morph3', name: 'V-Type Mix 1', id: 26, bit: 338, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 26', deltaOf: 'panelA.vTypeMix1' },
    { key: 'panelA.vTypeMix1', name: 'V-Type Mix 1', id: 26, bit: 343, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 26' },
    { key: 'panelA.vTypeMix2.morph1', name: 'V-Type Mix 2', id: 27, bit: 347, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 27', deltaOf: 'panelA.vTypeMix2' },
    { key: 'panelA.vTypeMix2.morph2', name: 'V-Type Mix 2', id: 27, bit: 352, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 27', deltaOf: 'panelA.vTypeMix2' },
    { key: 'panelA.vTypeMix2.morph3', name: 'V-Type Mix 2', id: 27, bit: 357, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 27', deltaOf: 'panelA.vTypeMix2' },
    { key: 'panelA.vTypeMix2', name: 'V-Type Mix 2', id: 27, bit: 362, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 27' },
    { key: 'panelA.vTypeSub28.morph1', name: 'V-Type Sub', id: 28, bit: 366, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 28', deltaOf: 'panelA.vTypeSub28' },
    { key: 'panelA.vTypeSub28.morph2', name: 'V-Type Sub', id: 28, bit: 371, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 28', deltaOf: 'panelA.vTypeSub28' },
    { key: 'panelA.vTypeSub28.morph3', name: 'V-Type Sub', id: 28, bit: 376, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 28', deltaOf: 'panelA.vTypeSub28' },
    { key: 'panelA.vTypeSub28', name: 'V-Type Sub', id: 28, bit: 381, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 28' },
    { key: 'panelA.vTypeSub329.morph1', name: 'V-Type Sub3', id: 29, bit: 385, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 29', deltaOf: 'panelA.vTypeSub329' },
    { key: 'panelA.vTypeSub329.morph2', name: 'V-Type Sub3', id: 29, bit: 390, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 29', deltaOf: 'panelA.vTypeSub329' },
    { key: 'panelA.vTypeSub329.morph3', name: 'V-Type Sub3', id: 29, bit: 395, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 29', deltaOf: 'panelA.vTypeSub329' },
    { key: 'panelA.vTypeSub329', name: 'V-Type Sub3', id: 29, bit: 400, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 29' },
    { key: 'panelA.vTypeFund30.morph1', name: 'V-Type Fund', id: 30, bit: 404, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 30', deltaOf: 'panelA.vTypeFund30' },
    { key: 'panelA.vTypeFund30.morph2', name: 'V-Type Fund', id: 30, bit: 409, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 30', deltaOf: 'panelA.vTypeFund30' },
    { key: 'panelA.vTypeFund30.morph3', name: 'V-Type Fund', id: 30, bit: 414, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 30', deltaOf: 'panelA.vTypeFund30' },
    { key: 'panelA.vTypeFund30', name: 'V-Type Fund', id: 30, bit: 419, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 30' },
    { key: 'panelA.vType2nd31.morph1', name: 'V-Type 2nd', id: 31, bit: 423, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 31', deltaOf: 'panelA.vType2nd31' },
    { key: 'panelA.vType2nd31.morph2', name: 'V-Type 2nd', id: 31, bit: 428, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 31', deltaOf: 'panelA.vType2nd31' },
    { key: 'panelA.vType2nd31.morph3', name: 'V-Type 2nd', id: 31, bit: 433, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 31', deltaOf: 'panelA.vType2nd31' },
    { key: 'panelA.vType2nd31', name: 'V-Type 2nd', id: 31, bit: 438, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 31' },
    { key: 'panelA.vType5th32.morph1', name: 'V-Type 5th', id: 32, bit: 442, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 32', deltaOf: 'panelA.vType5th32' },
    { key: 'panelA.vType5th32.morph2', name: 'V-Type 5th', id: 32, bit: 447, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 32', deltaOf: 'panelA.vType5th32' },
    { key: 'panelA.vType5th32.morph3', name: 'V-Type 5th', id: 32, bit: 452, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 32', deltaOf: 'panelA.vType5th32' },
    { key: 'panelA.vType5th32', name: 'V-Type 5th', id: 32, bit: 457, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 32' },
    { key: 'panelA.vType348th33.morph1', name: 'V-Type 3-4-8th', id: 33, bit: 461, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 33', deltaOf: 'panelA.vType348th33' },
    { key: 'panelA.vType348th33.morph2', name: 'V-Type 3-4-8th', id: 33, bit: 466, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 33', deltaOf: 'panelA.vType348th33' },
    { key: 'panelA.vType348th33.morph3', name: 'V-Type 3-4-8th', id: 33, bit: 471, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 33', deltaOf: 'panelA.vType348th33' },
    { key: 'panelA.vType348th33', name: 'V-Type 3-4-8th', id: 33, bit: 476, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 33' },
    { key: 'panelA.param34.morph1', name: 'panelA.param34.morph1', id: 34, bit: 480, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 34', deltaOf: 'panelA.param34' },
    { key: 'panelA.param34.morph2', name: 'panelA.param34.morph2', id: 34, bit: 485, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 34', deltaOf: 'panelA.param34' },
    { key: 'panelA.param34.morph3', name: 'panelA.param34.morph3', id: 34, bit: 490, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 34', deltaOf: 'panelA.param34' },
    { key: 'panelA.param34', name: 'panelA.param34', id: 34, bit: 495, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 34' },
    { key: 'panelA.vTypeMix135.morph1', name: 'V-Type Mix 1', id: 35, bit: 499, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 35', deltaOf: 'panelA.vTypeMix135' },
    { key: 'panelA.vTypeMix135.morph2', name: 'V-Type Mix 1', id: 35, bit: 504, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 35', deltaOf: 'panelA.vTypeMix135' },
    { key: 'panelA.vTypeMix135.morph3', name: 'V-Type Mix 1', id: 35, bit: 509, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 35', deltaOf: 'panelA.vTypeMix135' },
    { key: 'panelA.vTypeMix135', name: 'V-Type Mix 1', id: 35, bit: 514, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 35' },
    { key: 'panelA.vTypeMix236.morph1', name: 'V-Type Mix 2', id: 36, bit: 518, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 36', deltaOf: 'panelA.vTypeMix236' },
    { key: 'panelA.vTypeMix236.morph2', name: 'V-Type Mix 2', id: 36, bit: 523, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 36', deltaOf: 'panelA.vTypeMix236' },
    { key: 'panelA.vTypeMix236.morph3', name: 'V-Type Mix 2', id: 36, bit: 528, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 36', deltaOf: 'panelA.vTypeMix236' },
    { key: 'panelA.vTypeMix236', name: 'V-Type Mix 2', id: 36, bit: 533, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 36' },
    { key: 'panelA.b3Sub.morph1', name: 'B3 Sub', id: 37, bit: 537, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 37', deltaOf: 'panelA.b3Sub' },
    { key: 'panelA.b3Sub.morph2', name: 'B3 Sub', id: 37, bit: 542, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 37', deltaOf: 'panelA.b3Sub' },
    { key: 'panelA.b3Sub.morph3', name: 'B3 Sub', id: 37, bit: 547, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 37', deltaOf: 'panelA.b3Sub' },
    { key: 'panelA.b3Sub', name: 'B3 Sub', id: 37, bit: 552, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 37' },
    { key: 'panelA.b3Sub3.morph1', name: 'B3 Sub3', id: 38, bit: 556, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 38', deltaOf: 'panelA.b3Sub3' },
    { key: 'panelA.b3Sub3.morph2', name: 'B3 Sub3', id: 38, bit: 561, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 38', deltaOf: 'panelA.b3Sub3' },
    { key: 'panelA.b3Sub3.morph3', name: 'B3 Sub3', id: 38, bit: 566, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 38', deltaOf: 'panelA.b3Sub3' },
    { key: 'panelA.b3Sub3', name: 'B3 Sub3', id: 38, bit: 571, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 38' },
    { key: 'panelA.b3Fund.morph1', name: 'B3 Fund', id: 39, bit: 575, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 39', deltaOf: 'panelA.b3Fund' },
    { key: 'panelA.b3Fund.morph2', name: 'B3 Fund', id: 39, bit: 580, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 39', deltaOf: 'panelA.b3Fund' },
    { key: 'panelA.b3Fund.morph3', name: 'B3 Fund', id: 39, bit: 585, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 39', deltaOf: 'panelA.b3Fund' },
    { key: 'panelA.b3Fund', name: 'B3 Fund', id: 39, bit: 590, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 39' },
    { key: 'panelA.b32nd.morph1', name: 'B3 2nd', id: 40, bit: 594, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 40', deltaOf: 'panelA.b32nd' },
    { key: 'panelA.b32nd.morph2', name: 'B3 2nd', id: 40, bit: 599, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 40', deltaOf: 'panelA.b32nd' },
    { key: 'panelA.b32nd.morph3', name: 'B3 2nd', id: 40, bit: 604, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 40', deltaOf: 'panelA.b32nd' },
    { key: 'panelA.b32nd', name: 'B3 2nd', id: 40, bit: 609, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 40' },
    { key: 'panelA.b33rd.morph1', name: 'B3 3rd', id: 41, bit: 613, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 41', deltaOf: 'panelA.b33rd' },
    { key: 'panelA.b33rd.morph2', name: 'B3 3rd', id: 41, bit: 618, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 41', deltaOf: 'panelA.b33rd' },
    { key: 'panelA.b33rd.morph3', name: 'B3 3rd', id: 41, bit: 623, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 41', deltaOf: 'panelA.b33rd' },
    { key: 'panelA.b33rd', name: 'B3 3rd', id: 41, bit: 628, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 41' },
    { key: 'panelA.b34th.morph1', name: 'B3 4th', id: 42, bit: 632, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 42', deltaOf: 'panelA.b34th' },
    { key: 'panelA.b34th.morph2', name: 'B3 4th', id: 42, bit: 637, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 42', deltaOf: 'panelA.b34th' },
    { key: 'panelA.b34th.morph3', name: 'B3 4th', id: 42, bit: 642, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 42', deltaOf: 'panelA.b34th' },
    { key: 'panelA.b34th', name: 'B3 4th', id: 42, bit: 647, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 42' },
    { key: 'panelA.b35th.morph1', name: 'B3 5th', id: 43, bit: 651, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 43', deltaOf: 'panelA.b35th' },
    { key: 'panelA.b35th.morph2', name: 'B3 5th', id: 43, bit: 656, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 43', deltaOf: 'panelA.b35th' },
    { key: 'panelA.b35th.morph3', name: 'B3 5th', id: 43, bit: 661, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 43', deltaOf: 'panelA.b35th' },
    { key: 'panelA.b35th', name: 'B3 5th', id: 43, bit: 666, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 43' },
    { key: 'panelA.b36th.morph1', name: 'B3 6th', id: 44, bit: 670, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 44', deltaOf: 'panelA.b36th' },
    { key: 'panelA.b36th.morph2', name: 'B3 6th', id: 44, bit: 675, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 44', deltaOf: 'panelA.b36th' },
    { key: 'panelA.b36th.morph3', name: 'B3 6th', id: 44, bit: 680, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 44', deltaOf: 'panelA.b36th' },
    { key: 'panelA.b36th', name: 'B3 6th', id: 44, bit: 685, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 44' },
    { key: 'panelA.b38th.morph1', name: 'B3 8th', id: 45, bit: 689, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 45', deltaOf: 'panelA.b38th' },
    { key: 'panelA.b38th.morph2', name: 'B3 8th', id: 45, bit: 694, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 45', deltaOf: 'panelA.b38th' },
    { key: 'panelA.b38th.morph3', name: 'B3 8th', id: 45, bit: 699, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 45', deltaOf: 'panelA.b38th' },
    { key: 'panelA.b38th', name: 'B3 8th', id: 45, bit: 704, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 45' },
    { key: 'panelA.b3Sub46.morph1', name: 'B3 Sub', id: 46, bit: 708, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 46', deltaOf: 'panelA.b3Sub46' },
    { key: 'panelA.b3Sub46.morph2', name: 'B3 Sub', id: 46, bit: 713, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 46', deltaOf: 'panelA.b3Sub46' },
    { key: 'panelA.b3Sub46.morph3', name: 'B3 Sub', id: 46, bit: 718, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 46', deltaOf: 'panelA.b3Sub46' },
    { key: 'panelA.b3Sub46', name: 'B3 Sub', id: 46, bit: 723, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 46' },
    { key: 'panelA.b3Sub347.morph1', name: 'B3 Sub3', id: 47, bit: 727, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 47', deltaOf: 'panelA.b3Sub347' },
    { key: 'panelA.b3Sub347.morph2', name: 'B3 Sub3', id: 47, bit: 732, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 47', deltaOf: 'panelA.b3Sub347' },
    { key: 'panelA.b3Sub347.morph3', name: 'B3 Sub3', id: 47, bit: 737, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 47', deltaOf: 'panelA.b3Sub347' },
    { key: 'panelA.b3Sub347', name: 'B3 Sub3', id: 47, bit: 742, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 47' },
    { key: 'panelA.b3Fund48.morph1', name: 'B3 Fund', id: 48, bit: 746, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 48', deltaOf: 'panelA.b3Fund48' },
    { key: 'panelA.b3Fund48.morph2', name: 'B3 Fund', id: 48, bit: 751, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 48', deltaOf: 'panelA.b3Fund48' },
    { key: 'panelA.b3Fund48.morph3', name: 'B3 Fund', id: 48, bit: 756, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 48', deltaOf: 'panelA.b3Fund48' },
    { key: 'panelA.b3Fund48', name: 'B3 Fund', id: 48, bit: 761, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 48' },
    { key: 'panelA.b32nd49.morph1', name: 'B3 2nd', id: 49, bit: 765, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 49', deltaOf: 'panelA.b32nd49' },
    { key: 'panelA.b32nd49.morph2', name: 'B3 2nd', id: 49, bit: 770, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 49', deltaOf: 'panelA.b32nd49' },
    { key: 'panelA.b32nd49.morph3', name: 'B3 2nd', id: 49, bit: 775, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 49', deltaOf: 'panelA.b32nd49' },
    { key: 'panelA.b32nd49', name: 'B3 2nd', id: 49, bit: 780, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 49' },
    { key: 'panelA.b33rd50.morph1', name: 'B3 3rd', id: 50, bit: 784, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 50', deltaOf: 'panelA.b33rd50' },
    { key: 'panelA.b33rd50.morph2', name: 'B3 3rd', id: 50, bit: 789, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 50', deltaOf: 'panelA.b33rd50' },
    { key: 'panelA.b33rd50.morph3', name: 'B3 3rd', id: 50, bit: 794, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 50', deltaOf: 'panelA.b33rd50' },
    { key: 'panelA.b33rd50', name: 'B3 3rd', id: 50, bit: 799, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 50' },
    { key: 'panelA.b34th51.morph1', name: 'B3 4th', id: 51, bit: 803, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 51', deltaOf: 'panelA.b34th51' },
    { key: 'panelA.b34th51.morph2', name: 'B3 4th', id: 51, bit: 808, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 51', deltaOf: 'panelA.b34th51' },
    { key: 'panelA.b34th51.morph3', name: 'B3 4th', id: 51, bit: 813, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 51', deltaOf: 'panelA.b34th51' },
    { key: 'panelA.b34th51', name: 'B3 4th', id: 51, bit: 818, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 51' },
    { key: 'panelA.b35th52.morph1', name: 'B3 5th', id: 52, bit: 822, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 52', deltaOf: 'panelA.b35th52' },
    { key: 'panelA.b35th52.morph2', name: 'B3 5th', id: 52, bit: 827, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 52', deltaOf: 'panelA.b35th52' },
    { key: 'panelA.b35th52.morph3', name: 'B3 5th', id: 52, bit: 832, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 52', deltaOf: 'panelA.b35th52' },
    { key: 'panelA.b35th52', name: 'B3 5th', id: 52, bit: 837, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 52' },
    { key: 'panelA.b36th53.morph1', name: 'B3 6th', id: 53, bit: 841, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 53', deltaOf: 'panelA.b36th53' },
    { key: 'panelA.b36th53.morph2', name: 'B3 6th', id: 53, bit: 846, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 53', deltaOf: 'panelA.b36th53' },
    { key: 'panelA.b36th53.morph3', name: 'B3 6th', id: 53, bit: 851, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 53', deltaOf: 'panelA.b36th53' },
    { key: 'panelA.b36th53', name: 'B3 6th', id: 53, bit: 856, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 53' },
    { key: 'panelA.b38th54.morph1', name: 'B3 8th', id: 54, bit: 860, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 54', deltaOf: 'panelA.b38th54' },
    { key: 'panelA.b38th54.morph2', name: 'B3 8th', id: 54, bit: 865, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 54', deltaOf: 'panelA.b38th54' },
    { key: 'panelA.b38th54.morph3', name: 'B3 8th', id: 54, bit: 870, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 54', deltaOf: 'panelA.b38th54' },
    { key: 'panelA.b38th54', name: 'B3 8th', id: 54, bit: 875, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 54' },
    { key: 'panelA.b3VibratoMode', name: 'B3 Vibrato Mode', id: 55, bit: 879, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 55' },
    { key: 'panelA.b3VibratoMode56', name: 'B3 Vibrato Mode', id: 56, bit: 880, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 56' },
    { key: 'panelA.b3PercussionMode', name: 'B3 Percussion Mode', id: 57, bit: 881, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 57' },
    { key: 'panelA.b3PercussionMode58', name: 'B3 Percussion Mode', id: 58, bit: 882, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 58' },
    { key: 'panelA.pianoUnisonAmount', name: 'Piano Unison Amount', id: 60, bit: 897, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 60' },
    { key: 'panelA.clavinetEqMode', name: 'Clavinet Eq Mode', id: 61, bit: 899, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 61' },
    { key: 'panelA.clavinetEqMode62', name: 'Clavinet Eq Mode', id: 62, bit: 901, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 62' },
    { key: 'panelA.param63', name: 'panelA.param63', id: 63, bit: 903, width: 3, min: 0, max: 7, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 63' },
    { key: 'panelA.param64', name: 'panelA.param64', id: 64, bit: 906, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 64' },
    { key: 'panelA.param65', name: 'panelA.param65', id: 65, bit: 910, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 65' },
    { key: 'panelA.pianoDynamics', name: 'Piano Dynamics', id: 66, bit: 914, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 66' },
    { key: 'panelA.pianoMonoMode', name: 'Piano Mono Mode', id: 67, bit: 917, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 67' },
    { key: 'panelA.param68', name: 'panelA.param68', id: 68, bit: 918, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 68' },
    { key: 'panelA.pianoStringRes', name: 'Piano String Res', id: 69, bit: 921, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 69' },
    { key: 'panelA.param70', name: 'panelA.param70', id: 70, bit: 922, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 70' },
    { key: 'panelA.glideRate', name: 'Glide Rate', id: 71, bit: 923, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 71' },
    { key: 'panelA.glideMode', name: 'Glide Mode', id: 72, bit: 930, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 72' },
    { key: 'panelA.voicesMode', name: 'Voices Mode', id: 73, bit: 931, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 73' },
    { key: 'panelA.unisonAmount', name: 'Unison Amount', id: 74, bit: 933, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 74' },
    { key: 'panelA.vibratoMode', name: 'Vibrato Mode', id: 75, bit: 940, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 75' },
    { key: 'panelA.modEnvelopeAttack', name: 'Mod Envelope Attack', id: 76, bit: 943, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 76' },
    { key: 'panelA.modEnvelopeRelDecay', name: 'Mod Envelope Rel/Decay', id: 77, bit: 950, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 77' },
    { key: 'panelA.modEnvelopeMode', name: 'Mod Envelope Mode', id: 78, bit: 957, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 78' },
    { key: 'panelA.modEnvelopeVelocity', name: 'Mod Envelope Velocity', id: 79, bit: 959, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 79' },
    { key: 'panelA.param80', name: 'panelA.param80', id: 80, bit: 960, width: 2, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 80' },
    { key: 'panelA.param81', name: 'panelA.param81', id: 81, bit: 962, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 81' },
    { key: 'panelA.oscillatorGroupTimbre.morph1', name: 'Oscillator Group Timbre', id: 82, bit: 969, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 82', deltaOf: 'panelA.oscillatorGroupTimbre' },
    { key: 'panelA.oscillatorGroupTimbre.morph2', name: 'Oscillator Group Timbre', id: 82, bit: 977, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 82', deltaOf: 'panelA.oscillatorGroupTimbre' },
    { key: 'panelA.oscillatorGroupTimbre.morph3', name: 'Oscillator Group Timbre', id: 82, bit: 985, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 82', deltaOf: 'panelA.oscillatorGroupTimbre' },
    { key: 'panelA.oscillatorGroupTimbre', name: 'Oscillator Group Timbre', id: 82, bit: 993, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 82' },
    { key: 'panelA.param83', name: 'panelA.param83', id: 83, bit: 1000, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 83' },
    { key: 'panelA.oscillatorGroupTimbreCtrl', name: 'Oscillator Group Timbre Ctrl', id: 84, bit: 1001, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 84' },
    { key: 'panelA.oscillatorGroupModEnvelope', name: 'Oscillator Group Mod Envelope', id: 85, bit: 1008, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 85' },
    { key: 'panelA.filterFrequency.morph1', name: 'Filter Frequency', id: 86, bit: 1009, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 86', deltaOf: 'panelA.filterFrequency' },
    { key: 'panelA.filterFrequency.morph2', name: 'Filter Frequency', id: 86, bit: 1017, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 86', deltaOf: 'panelA.filterFrequency' },
    { key: 'panelA.filterFrequency.morph3', name: 'Filter Frequency', id: 86, bit: 1025, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 86', deltaOf: 'panelA.filterFrequency' },
    { key: 'panelA.filterFrequency', name: 'Filter Frequency', id: 86, bit: 1033, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 86' },
    { key: 'panelA.filterResonance', name: 'Filter Resonance', id: 87, bit: 1040, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 87' },
    { key: 'panelA.filterFreqCtrl', name: 'Filter Freq Ctrl', id: 88, bit: 1047, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 88' },
    { key: 'panelA.filterModEnvelope', name: 'Filter Mod Envelope', id: 89, bit: 1054, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 89' },
    { key: 'panelA.filterKbTrack', name: 'Filter Kb Track', id: 90, bit: 1055, width: 2, min: 0, max: 3, def: 3, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 90' },
    { key: 'panelA.filterSlope', name: 'Filter Slope', id: 91, bit: 1057, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 91' },
    { key: 'panelA.ampEnvelopeAttack', name: 'Amp Envelope Attack', id: 92, bit: 1059, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 92' },
    { key: 'panelA.ampEnvelopeRelDecay', name: 'Amp Envelope Rel/Decay', id: 93, bit: 1066, width: 7, min: 0, max: 127, def: 15, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 93' },
    { key: 'panelA.ampEnvelopeMode', name: 'Amp Envelope Mode', id: 94, bit: 1073, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 94' },
    { key: 'panelA.ampEnvelopeVelocity', name: 'Amp Envelope Velocity', id: 95, bit: 1075, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 95' },
    { key: 'panelA.equalizerBass', name: 'Equalizer Bass', id: 96, bit: 1076, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 96' },
    { key: 'panelA.equalizerTreble', name: 'Equalizer Treble', id: 97, bit: 1083, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 97' },
    { key: 'panelA.vibratoRate', name: 'Vibrato Rate', id: 98, bit: 1090, width: 7, min: 0, max: 100, def: 50, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 98' },
    { key: 'panelA.vibratoAmount', name: 'Vibrato Amount', id: 99, bit: 1097, width: 7, min: 0, max: 100, def: 50, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 99' },
    { key: 'panelA.param100', name: 'panelA.param100', id: 100, bit: 1104, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 100' },
    { key: 'panelA.param102', name: 'panelA.param102', id: 102, bit: 1131, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 102' },
    { key: 'panelA.param103', name: 'panelA.param103', id: 103, bit: 1133, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 103' },
    { key: 'panelA.param104.morph1', name: 'panelA.param104.morph1', id: 104, bit: 1140, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 104', deltaOf: 'panelA.param104' },
    { key: 'panelA.param104.morph2', name: 'panelA.param104.morph2', id: 104, bit: 1149, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 104', deltaOf: 'panelA.param104' },
    { key: 'panelA.param104.morph3', name: 'panelA.param104.morph3', id: 104, bit: 1158, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 104', deltaOf: 'panelA.param104' },
    { key: 'panelA.param104', name: 'panelA.param104', id: 104, bit: 1167, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 104' },
    { key: 'panelA.param105', name: 'panelA.param105', id: 105, bit: 1175, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 105' },
    { key: 'panelA.param106', name: 'panelA.param106', id: 106, bit: 1183, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 106' },
    { key: 'panelA.param107', name: 'panelA.param107', id: 107, bit: 1191, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 107' },
    { key: 'panelA.param108', name: 'panelA.param108', id: 108, bit: 1199, width: 4, min: 0, max: 15, def: 13, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 108' },
    { key: 'panelA.param110.morph1', name: 'panelA.param110.morph1', id: 110, bit: 1218, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 110', deltaOf: 'panelA.param110' },
    { key: 'panelA.param110.morph2', name: 'panelA.param110.morph2', id: 110, bit: 1227, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 110', deltaOf: 'panelA.param110' },
    { key: 'panelA.param110.morph3', name: 'panelA.param110.morph3', id: 110, bit: 1236, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 110', deltaOf: 'panelA.param110' },
    { key: 'panelA.param110', name: 'panelA.param110', id: 110, bit: 1245, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 110' },
    { key: 'panelA.param111', name: 'panelA.param111', id: 111, bit: 1253, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 111' },
    { key: 'panelA.param112', name: 'panelA.param112', id: 112, bit: 1254, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 112' },
    { key: 'panelA.param113', name: 'panelA.param113', id: 113, bit: 1255, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 113' },
    { key: 'panelA.param114', name: 'panelA.param114', id: 114, bit: 1256, width: 3, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 114' },
    { key: 'panelA.param116', name: 'panelA.param116', id: 116, bit: 1269, width: 3, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 116' },
    { key: 'panelA.effect1Type', name: 'Effect 1 Type', id: 117, bit: 1272, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 117' },
    { key: 'panelA.effect1Source', name: 'Effect 1 Source', id: 118, bit: 1275, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 118' },
    { key: 'panelA.effect1Amount.morph1', name: 'Effect 1 Amount', id: 119, bit: 1277, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 119', deltaOf: 'panelA.effect1Amount' },
    { key: 'panelA.effect1Amount.morph2', name: 'Effect 1 Amount', id: 119, bit: 1285, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 119', deltaOf: 'panelA.effect1Amount' },
    { key: 'panelA.effect1Amount.morph3', name: 'Effect 1 Amount', id: 119, bit: 1293, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 119', deltaOf: 'panelA.effect1Amount' },
    { key: 'panelA.effect1Amount', name: 'Effect 1 Amount', id: 119, bit: 1301, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 119' },
    { key: 'panelA.effect1Rate.morph1', name: 'Effect 1 Rate', id: 120, bit: 1308, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 120', deltaOf: 'panelA.effect1Rate' },
    { key: 'panelA.effect1Rate.morph2', name: 'Effect 1 Rate', id: 120, bit: 1316, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 120', deltaOf: 'panelA.effect1Rate' },
    { key: 'panelA.effect1Rate.morph3', name: 'Effect 1 Rate', id: 120, bit: 1324, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 120', deltaOf: 'panelA.effect1Rate' },
    { key: 'panelA.effect1Rate', name: 'Effect 1 Rate', id: 120, bit: 1332, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 120' },
    { key: 'panelA.effect1Mode', name: 'Effect 1 Mode', id: 121, bit: 1339, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 121' },
    { key: 'panelA.effect2Type', name: 'Effect 2 Type', id: 122, bit: 1340, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 122' },
    { key: 'panelA.effect2Source', name: 'Effect 2 Source', id: 123, bit: 1343, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 123' },
    { key: 'panelA.effect2Amount.morph1', name: 'Effect 2 Amount', id: 124, bit: 1345, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 124', deltaOf: 'panelA.effect2Amount' },
    { key: 'panelA.effect2Amount.morph2', name: 'Effect 2 Amount', id: 124, bit: 1353, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 124', deltaOf: 'panelA.effect2Amount' },
    { key: 'panelA.effect2Amount.morph3', name: 'Effect 2 Amount', id: 124, bit: 1361, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 124', deltaOf: 'panelA.effect2Amount' },
    { key: 'panelA.effect2Amount', name: 'Effect 2 Amount', id: 124, bit: 1369, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 124' },
    { key: 'panelA.effect2Rate.morph1', name: 'Effect 2 Rate', id: 125, bit: 1376, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 125', deltaOf: 'panelA.effect2Rate' },
    { key: 'panelA.effect2Rate.morph2', name: 'Effect 2 Rate', id: 125, bit: 1384, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 125', deltaOf: 'panelA.effect2Rate' },
    { key: 'panelA.effect2Rate.morph3', name: 'Effect 2 Rate', id: 125, bit: 1392, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 125', deltaOf: 'panelA.effect2Rate' },
    { key: 'panelA.effect2Rate', name: 'Effect 2 Rate', id: 125, bit: 1400, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 125' },
    { key: 'panelA.effect2Mode', name: 'Effect 2 Mode', id: 126, bit: 1407, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 126' },
    { key: 'panelA.delaySource', name: 'Delay Source', id: 127, bit: 1408, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 127' },
    { key: 'panelA.delayAmount.morph1', name: 'Delay Amount', id: 128, bit: 1410, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 128', deltaOf: 'panelA.delayAmount' },
    { key: 'panelA.delayAmount.morph2', name: 'Delay Amount', id: 128, bit: 1418, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 128', deltaOf: 'panelA.delayAmount' },
    { key: 'panelA.delayAmount.morph3', name: 'Delay Amount', id: 128, bit: 1426, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 128', deltaOf: 'panelA.delayAmount' },
    { key: 'panelA.delayAmount', name: 'Delay Amount', id: 128, bit: 1434, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 128' },
    { key: 'panelA.param129.morph1', name: 'panelA.param129.morph1', id: 129, bit: 1441, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 129', deltaOf: 'panelA.param129' },
    { key: 'panelA.param129.morph2', name: 'panelA.param129.morph2', id: 129, bit: 1449, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 129', deltaOf: 'panelA.param129' },
    { key: 'panelA.param129.morph3', name: 'panelA.param129.morph3', id: 129, bit: 1457, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 129', deltaOf: 'panelA.param129' },
    { key: 'panelA.param129', name: 'panelA.param129', id: 129, bit: 1465, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 129' },
    { key: 'panelA.delayFeedback', name: 'Delay Feedback', id: 130, bit: 1472, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 130' },
    { key: 'panelA.delayPingPong', name: 'Delay Ping Pong', id: 131, bit: 1479, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 131' },
    { key: 'panelA.delayMode', name: 'Delay Mode', id: 132, bit: 1480, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 132' },
    { key: 'panelA.ampSimEqModel', name: 'AmpSim/Eq Model', id: 133, bit: 1481, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 133' },
    { key: 'panelA.ampSimEqSource', name: 'AmpSim/Eq Source', id: 134, bit: 1483, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 134' },
    { key: 'panelA.ampSimEqDrive', name: 'AmpSim/Eq Drive', id: 135, bit: 1485, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 135' },
    { key: 'panelA.ampSimEqBass', name: 'AmpSim/Eq Bass', id: 136, bit: 1492, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 136' },
    { key: 'panelA.ampSimEqMid', name: 'AmpSim/Eq Mid', id: 137, bit: 1499, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 137' },
    { key: 'panelA.ampSimEqTreble', name: 'AmpSim/Eq Treble', id: 138, bit: 1506, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 138' },
    { key: 'panelA.ampSimEqMode', name: 'AmpSim/Eq Mode', id: 139, bit: 1513, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 139' },
    { key: 'panelA.param140', name: 'panelA.param140', id: 140, bit: 1514, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 140' },
    { key: 'panelA.param142', name: 'panelA.param142', id: 142, bit: 1524, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 142' },
    { key: 'panelA.organSustainPedal', name: 'Organ SustainPedal', id: 143, bit: 1525, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 143' },
    { key: 'panelA.organOctaveShift', name: 'Organ Octave Shift', id: 144, bit: 1526, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 144' },
    { key: 'panelA.organLevel.morph1', name: 'Organ Level', id: 145, bit: 1530, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 145', deltaOf: 'panelA.organLevel' },
    { key: 'panelA.organLevel.morph2', name: 'Organ Level', id: 145, bit: 1538, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 145', deltaOf: 'panelA.organLevel' },
    { key: 'panelA.organLevel.morph3', name: 'Organ Level', id: 145, bit: 1546, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 145', deltaOf: 'panelA.organLevel' },
    { key: 'panelA.organLevel', name: 'Organ Level', id: 145, bit: 1554, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 145' },
    { key: 'panelA.organMode', name: 'Organ Mode', id: 146, bit: 1561, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 146' },
    { key: 'panelA.param147', name: 'panelA.param147', id: 147, bit: 1562, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 147' },
    { key: 'panelA.pianoPitchStick', name: 'Piano PitchStick', id: 148, bit: 1565, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 148' },
    { key: 'panelA.pianoSustainPedal', name: 'Piano SustainPedal', id: 149, bit: 1566, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 149' },
    { key: 'panelA.pianoOctaveShift', name: 'Piano Octave Shift', id: 150, bit: 1567, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 150' },
    { key: 'panelA.pianoLevel.morph1', name: 'Piano Level', id: 151, bit: 1571, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 151', deltaOf: 'panelA.pianoLevel' },
    { key: 'panelA.pianoLevel.morph2', name: 'Piano Level', id: 151, bit: 1579, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 151', deltaOf: 'panelA.pianoLevel' },
    { key: 'panelA.pianoLevel.morph3', name: 'Piano Level', id: 151, bit: 1587, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 151', deltaOf: 'panelA.pianoLevel' },
    { key: 'panelA.pianoLevel', name: 'Piano Level', id: 151, bit: 1595, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 151' },
    { key: 'panelA.pianoMode', name: 'Piano Mode', id: 152, bit: 1602, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 152' },
    { key: 'panelA.param153', name: 'panelA.param153', id: 153, bit: 1603, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 153' },
    { key: 'panelA.synthPitchStick', name: 'Synth PitchStick', id: 154, bit: 1606, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 154' },
    { key: 'panelA.synthSustainPedal', name: 'Synth SustainPedal', id: 155, bit: 1607, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 155' },
    { key: 'panelA.synthOctaveShift', name: 'Synth Octave Shift', id: 156, bit: 1608, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 156' },
    { key: 'panelA.synthLevel.morph1', name: 'Synth Level', id: 157, bit: 1612, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 157', deltaOf: 'panelA.synthLevel' },
    { key: 'panelA.synthLevel.morph2', name: 'Synth Level', id: 157, bit: 1620, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 157', deltaOf: 'panelA.synthLevel' },
    { key: 'panelA.synthLevel.morph3', name: 'Synth Level', id: 157, bit: 1628, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 157', deltaOf: 'panelA.synthLevel' },
    { key: 'panelA.synthLevel', name: 'Synth Level', id: 157, bit: 1636, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 157' },
    { key: 'panelA.synthMode', name: 'Synth Mode', id: 158, bit: 1643, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 158' },
    { key: 'panelA.param159', name: 'panelA.param159', id: 159, bit: 1644, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 159' },
    { key: 'panelA.externPitchStick', name: 'Extern PitchStick', id: 160, bit: 1647, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 160' },
    { key: 'panelA.externSustainPedal', name: 'Extern SustainPedal', id: 161, bit: 1648, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 161' },
    { key: 'panelA.externOctaveShift', name: 'Extern Octave Shift', id: 162, bit: 1649, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 162' },
    { key: 'panelA.externLevel.morph1', name: 'Extern Level', id: 163, bit: 1653, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 163', deltaOf: 'panelA.externLevel' },
    { key: 'panelA.externLevel.morph2', name: 'Extern Level', id: 163, bit: 1661, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 163', deltaOf: 'panelA.externLevel' },
    { key: 'panelA.externLevel.morph3', name: 'Extern Level', id: 163, bit: 1669, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 163', deltaOf: 'panelA.externLevel' },
    { key: 'panelA.externLevel', name: 'Extern Level', id: 163, bit: 1677, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 163' },
    { key: 'panelA.externMode', name: 'Extern Mode', id: 164, bit: 1684, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 164' },
    { key: 'panelA.param165', name: 'panelA.param165', id: 165, bit: 1685, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelA 165' },
    { key: 'panelB.organPreset', name: 'Organ Preset', id: 0, bit: 1688, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 0' },
    { key: 'panelB.fTypeBas16', name: 'F-Type Bas16', id: 1, bit: 1689, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 1' },
    { key: 'panelB.fTypeStr16', name: 'F-Type Str16', id: 2, bit: 1690, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 2' },
    { key: 'panelB.fTypeFlute8', name: 'F-Type Flute8', id: 3, bit: 1691, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 3' },
    { key: 'panelB.fTypeOboe8', name: 'F-Type Oboe8', id: 4, bit: 1692, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 4' },
    { key: 'panelB.fTypeTrmp8', name: 'F-Type Trmp8', id: 5, bit: 1693, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 5' },
    { key: 'panelB.fTypeStr8', name: 'F-Type Str8', id: 6, bit: 1694, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 6' },
    { key: 'panelB.fTypeFlute4', name: 'F-Type Flute4', id: 7, bit: 1695, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 7' },
    { key: 'panelB.fTypeStr4', name: 'F-Type Str4', id: 8, bit: 1696, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 8' },
    { key: 'panelB.fType223', name: 'F-Type 2 2/3', id: 9, bit: 1697, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 9' },
    { key: 'panelB.fTypeBas1610', name: 'F-Type Bas16', id: 10, bit: 1698, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 10' },
    { key: 'panelB.fTypeStr1611', name: 'F-Type Str16', id: 11, bit: 1699, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 11' },
    { key: 'panelB.fTypeFlute812', name: 'F-Type Flute8', id: 12, bit: 1700, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 12' },
    { key: 'panelB.fTypeOboe813', name: 'F-Type Oboe8', id: 13, bit: 1701, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 13' },
    { key: 'panelB.fTypeTrmp814', name: 'F-Type Trmp8', id: 14, bit: 1702, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 14' },
    { key: 'panelB.fTypeStr815', name: 'F-Type Str8', id: 15, bit: 1703, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 15' },
    { key: 'panelB.fTypeFlute416', name: 'F-Type Flute4', id: 16, bit: 1704, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 16' },
    { key: 'panelB.fTypeStr417', name: 'F-Type Str4', id: 17, bit: 1705, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 17' },
    { key: 'panelB.fType22318', name: 'F-Type 2 2/3', id: 18, bit: 1706, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 18' },
    { key: 'panelB.vTypeSub.morph1', name: 'V-Type Sub', id: 19, bit: 1707, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 19', deltaOf: 'panelB.vTypeSub' },
    { key: 'panelB.vTypeSub.morph2', name: 'V-Type Sub', id: 19, bit: 1712, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 19', deltaOf: 'panelB.vTypeSub' },
    { key: 'panelB.vTypeSub.morph3', name: 'V-Type Sub', id: 19, bit: 1717, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 19', deltaOf: 'panelB.vTypeSub' },
    { key: 'panelB.vTypeSub', name: 'V-Type Sub', id: 19, bit: 1722, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 19' },
    { key: 'panelB.vTypeSub3.morph1', name: 'V-Type Sub3', id: 20, bit: 1726, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 20', deltaOf: 'panelB.vTypeSub3' },
    { key: 'panelB.vTypeSub3.morph2', name: 'V-Type Sub3', id: 20, bit: 1731, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 20', deltaOf: 'panelB.vTypeSub3' },
    { key: 'panelB.vTypeSub3.morph3', name: 'V-Type Sub3', id: 20, bit: 1736, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 20', deltaOf: 'panelB.vTypeSub3' },
    { key: 'panelB.vTypeSub3', name: 'V-Type Sub3', id: 20, bit: 1741, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 20' },
    { key: 'panelB.vTypeFund.morph1', name: 'V-Type Fund', id: 21, bit: 1745, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 21', deltaOf: 'panelB.vTypeFund' },
    { key: 'panelB.vTypeFund.morph2', name: 'V-Type Fund', id: 21, bit: 1750, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 21', deltaOf: 'panelB.vTypeFund' },
    { key: 'panelB.vTypeFund.morph3', name: 'V-Type Fund', id: 21, bit: 1755, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 21', deltaOf: 'panelB.vTypeFund' },
    { key: 'panelB.vTypeFund', name: 'V-Type Fund', id: 21, bit: 1760, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 21' },
    { key: 'panelB.vType2nd.morph1', name: 'V-Type 2nd', id: 22, bit: 1764, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 22', deltaOf: 'panelB.vType2nd' },
    { key: 'panelB.vType2nd.morph2', name: 'V-Type 2nd', id: 22, bit: 1769, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 22', deltaOf: 'panelB.vType2nd' },
    { key: 'panelB.vType2nd.morph3', name: 'V-Type 2nd', id: 22, bit: 1774, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 22', deltaOf: 'panelB.vType2nd' },
    { key: 'panelB.vType2nd', name: 'V-Type 2nd', id: 22, bit: 1779, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 22' },
    { key: 'panelB.vType5th.morph1', name: 'V-Type 5th', id: 23, bit: 1783, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 23', deltaOf: 'panelB.vType5th' },
    { key: 'panelB.vType5th.morph2', name: 'V-Type 5th', id: 23, bit: 1788, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 23', deltaOf: 'panelB.vType5th' },
    { key: 'panelB.vType5th.morph3', name: 'V-Type 5th', id: 23, bit: 1793, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 23', deltaOf: 'panelB.vType5th' },
    { key: 'panelB.vType5th', name: 'V-Type 5th', id: 23, bit: 1798, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 23' },
    { key: 'panelB.vType348th.morph1', name: 'V-Type 3-4-8th', id: 24, bit: 1802, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 24', deltaOf: 'panelB.vType348th' },
    { key: 'panelB.vType348th.morph2', name: 'V-Type 3-4-8th', id: 24, bit: 1807, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 24', deltaOf: 'panelB.vType348th' },
    { key: 'panelB.vType348th.morph3', name: 'V-Type 3-4-8th', id: 24, bit: 1812, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 24', deltaOf: 'panelB.vType348th' },
    { key: 'panelB.vType348th', name: 'V-Type 3-4-8th', id: 24, bit: 1817, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 24' },
    { key: 'panelB.param25.morph1', name: 'panelB.param25.morph1', id: 25, bit: 1821, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 25', deltaOf: 'panelB.param25' },
    { key: 'panelB.param25.morph2', name: 'panelB.param25.morph2', id: 25, bit: 1826, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 25', deltaOf: 'panelB.param25' },
    { key: 'panelB.param25.morph3', name: 'panelB.param25.morph3', id: 25, bit: 1831, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 25', deltaOf: 'panelB.param25' },
    { key: 'panelB.param25', name: 'panelB.param25', id: 25, bit: 1836, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 25' },
    { key: 'panelB.vTypeMix1.morph1', name: 'V-Type Mix 1', id: 26, bit: 1840, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 26', deltaOf: 'panelB.vTypeMix1' },
    { key: 'panelB.vTypeMix1.morph2', name: 'V-Type Mix 1', id: 26, bit: 1845, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 26', deltaOf: 'panelB.vTypeMix1' },
    { key: 'panelB.vTypeMix1.morph3', name: 'V-Type Mix 1', id: 26, bit: 1850, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 26', deltaOf: 'panelB.vTypeMix1' },
    { key: 'panelB.vTypeMix1', name: 'V-Type Mix 1', id: 26, bit: 1855, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 26' },
    { key: 'panelB.vTypeMix2.morph1', name: 'V-Type Mix 2', id: 27, bit: 1859, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 27', deltaOf: 'panelB.vTypeMix2' },
    { key: 'panelB.vTypeMix2.morph2', name: 'V-Type Mix 2', id: 27, bit: 1864, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 27', deltaOf: 'panelB.vTypeMix2' },
    { key: 'panelB.vTypeMix2.morph3', name: 'V-Type Mix 2', id: 27, bit: 1869, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 27', deltaOf: 'panelB.vTypeMix2' },
    { key: 'panelB.vTypeMix2', name: 'V-Type Mix 2', id: 27, bit: 1874, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 27' },
    { key: 'panelB.vTypeSub28.morph1', name: 'V-Type Sub', id: 28, bit: 1878, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 28', deltaOf: 'panelB.vTypeSub28' },
    { key: 'panelB.vTypeSub28.morph2', name: 'V-Type Sub', id: 28, bit: 1883, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 28', deltaOf: 'panelB.vTypeSub28' },
    { key: 'panelB.vTypeSub28.morph3', name: 'V-Type Sub', id: 28, bit: 1888, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 28', deltaOf: 'panelB.vTypeSub28' },
    { key: 'panelB.vTypeSub28', name: 'V-Type Sub', id: 28, bit: 1893, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 28' },
    { key: 'panelB.vTypeSub329.morph1', name: 'V-Type Sub3', id: 29, bit: 1897, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 29', deltaOf: 'panelB.vTypeSub329' },
    { key: 'panelB.vTypeSub329.morph2', name: 'V-Type Sub3', id: 29, bit: 1902, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 29', deltaOf: 'panelB.vTypeSub329' },
    { key: 'panelB.vTypeSub329.morph3', name: 'V-Type Sub3', id: 29, bit: 1907, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 29', deltaOf: 'panelB.vTypeSub329' },
    { key: 'panelB.vTypeSub329', name: 'V-Type Sub3', id: 29, bit: 1912, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 29' },
    { key: 'panelB.vTypeFund30.morph1', name: 'V-Type Fund', id: 30, bit: 1916, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 30', deltaOf: 'panelB.vTypeFund30' },
    { key: 'panelB.vTypeFund30.morph2', name: 'V-Type Fund', id: 30, bit: 1921, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 30', deltaOf: 'panelB.vTypeFund30' },
    { key: 'panelB.vTypeFund30.morph3', name: 'V-Type Fund', id: 30, bit: 1926, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 30', deltaOf: 'panelB.vTypeFund30' },
    { key: 'panelB.vTypeFund30', name: 'V-Type Fund', id: 30, bit: 1931, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 30' },
    { key: 'panelB.vType2nd31.morph1', name: 'V-Type 2nd', id: 31, bit: 1935, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 31', deltaOf: 'panelB.vType2nd31' },
    { key: 'panelB.vType2nd31.morph2', name: 'V-Type 2nd', id: 31, bit: 1940, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 31', deltaOf: 'panelB.vType2nd31' },
    { key: 'panelB.vType2nd31.morph3', name: 'V-Type 2nd', id: 31, bit: 1945, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 31', deltaOf: 'panelB.vType2nd31' },
    { key: 'panelB.vType2nd31', name: 'V-Type 2nd', id: 31, bit: 1950, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 31' },
    { key: 'panelB.vType5th32.morph1', name: 'V-Type 5th', id: 32, bit: 1954, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 32', deltaOf: 'panelB.vType5th32' },
    { key: 'panelB.vType5th32.morph2', name: 'V-Type 5th', id: 32, bit: 1959, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 32', deltaOf: 'panelB.vType5th32' },
    { key: 'panelB.vType5th32.morph3', name: 'V-Type 5th', id: 32, bit: 1964, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 32', deltaOf: 'panelB.vType5th32' },
    { key: 'panelB.vType5th32', name: 'V-Type 5th', id: 32, bit: 1969, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 32' },
    { key: 'panelB.vType348th33.morph1', name: 'V-Type 3-4-8th', id: 33, bit: 1973, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 33', deltaOf: 'panelB.vType348th33' },
    { key: 'panelB.vType348th33.morph2', name: 'V-Type 3-4-8th', id: 33, bit: 1978, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 33', deltaOf: 'panelB.vType348th33' },
    { key: 'panelB.vType348th33.morph3', name: 'V-Type 3-4-8th', id: 33, bit: 1983, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 33', deltaOf: 'panelB.vType348th33' },
    { key: 'panelB.vType348th33', name: 'V-Type 3-4-8th', id: 33, bit: 1988, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 33' },
    { key: 'panelB.param34.morph1', name: 'panelB.param34.morph1', id: 34, bit: 1992, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 34', deltaOf: 'panelB.param34' },
    { key: 'panelB.param34.morph2', name: 'panelB.param34.morph2', id: 34, bit: 1997, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 34', deltaOf: 'panelB.param34' },
    { key: 'panelB.param34.morph3', name: 'panelB.param34.morph3', id: 34, bit: 2002, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 34', deltaOf: 'panelB.param34' },
    { key: 'panelB.param34', name: 'panelB.param34', id: 34, bit: 2007, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 34' },
    { key: 'panelB.vTypeMix135.morph1', name: 'V-Type Mix 1', id: 35, bit: 2011, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 35', deltaOf: 'panelB.vTypeMix135' },
    { key: 'panelB.vTypeMix135.morph2', name: 'V-Type Mix 1', id: 35, bit: 2016, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 35', deltaOf: 'panelB.vTypeMix135' },
    { key: 'panelB.vTypeMix135.morph3', name: 'V-Type Mix 1', id: 35, bit: 2021, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 35', deltaOf: 'panelB.vTypeMix135' },
    { key: 'panelB.vTypeMix135', name: 'V-Type Mix 1', id: 35, bit: 2026, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 35' },
    { key: 'panelB.vTypeMix236.morph1', name: 'V-Type Mix 2', id: 36, bit: 2030, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 36', deltaOf: 'panelB.vTypeMix236' },
    { key: 'panelB.vTypeMix236.morph2', name: 'V-Type Mix 2', id: 36, bit: 2035, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 36', deltaOf: 'panelB.vTypeMix236' },
    { key: 'panelB.vTypeMix236.morph3', name: 'V-Type Mix 2', id: 36, bit: 2040, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 36', deltaOf: 'panelB.vTypeMix236' },
    { key: 'panelB.vTypeMix236', name: 'V-Type Mix 2', id: 36, bit: 2045, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 36' },
    { key: 'panelB.b3Sub.morph1', name: 'B3 Sub', id: 37, bit: 2049, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 37', deltaOf: 'panelB.b3Sub' },
    { key: 'panelB.b3Sub.morph2', name: 'B3 Sub', id: 37, bit: 2054, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 37', deltaOf: 'panelB.b3Sub' },
    { key: 'panelB.b3Sub.morph3', name: 'B3 Sub', id: 37, bit: 2059, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 37', deltaOf: 'panelB.b3Sub' },
    { key: 'panelB.b3Sub', name: 'B3 Sub', id: 37, bit: 2064, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 37' },
    { key: 'panelB.b3Sub3.morph1', name: 'B3 Sub3', id: 38, bit: 2068, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 38', deltaOf: 'panelB.b3Sub3' },
    { key: 'panelB.b3Sub3.morph2', name: 'B3 Sub3', id: 38, bit: 2073, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 38', deltaOf: 'panelB.b3Sub3' },
    { key: 'panelB.b3Sub3.morph3', name: 'B3 Sub3', id: 38, bit: 2078, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 38', deltaOf: 'panelB.b3Sub3' },
    { key: 'panelB.b3Sub3', name: 'B3 Sub3', id: 38, bit: 2083, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 38' },
    { key: 'panelB.b3Fund.morph1', name: 'B3 Fund', id: 39, bit: 2087, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 39', deltaOf: 'panelB.b3Fund' },
    { key: 'panelB.b3Fund.morph2', name: 'B3 Fund', id: 39, bit: 2092, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 39', deltaOf: 'panelB.b3Fund' },
    { key: 'panelB.b3Fund.morph3', name: 'B3 Fund', id: 39, bit: 2097, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 39', deltaOf: 'panelB.b3Fund' },
    { key: 'panelB.b3Fund', name: 'B3 Fund', id: 39, bit: 2102, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 39' },
    { key: 'panelB.b32nd.morph1', name: 'B3 2nd', id: 40, bit: 2106, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 40', deltaOf: 'panelB.b32nd' },
    { key: 'panelB.b32nd.morph2', name: 'B3 2nd', id: 40, bit: 2111, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 40', deltaOf: 'panelB.b32nd' },
    { key: 'panelB.b32nd.morph3', name: 'B3 2nd', id: 40, bit: 2116, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 40', deltaOf: 'panelB.b32nd' },
    { key: 'panelB.b32nd', name: 'B3 2nd', id: 40, bit: 2121, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 40' },
    { key: 'panelB.b33rd.morph1', name: 'B3 3rd', id: 41, bit: 2125, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 41', deltaOf: 'panelB.b33rd' },
    { key: 'panelB.b33rd.morph2', name: 'B3 3rd', id: 41, bit: 2130, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 41', deltaOf: 'panelB.b33rd' },
    { key: 'panelB.b33rd.morph3', name: 'B3 3rd', id: 41, bit: 2135, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 41', deltaOf: 'panelB.b33rd' },
    { key: 'panelB.b33rd', name: 'B3 3rd', id: 41, bit: 2140, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 41' },
    { key: 'panelB.b34th.morph1', name: 'B3 4th', id: 42, bit: 2144, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 42', deltaOf: 'panelB.b34th' },
    { key: 'panelB.b34th.morph2', name: 'B3 4th', id: 42, bit: 2149, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 42', deltaOf: 'panelB.b34th' },
    { key: 'panelB.b34th.morph3', name: 'B3 4th', id: 42, bit: 2154, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 42', deltaOf: 'panelB.b34th' },
    { key: 'panelB.b34th', name: 'B3 4th', id: 42, bit: 2159, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 42' },
    { key: 'panelB.b35th.morph1', name: 'B3 5th', id: 43, bit: 2163, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 43', deltaOf: 'panelB.b35th' },
    { key: 'panelB.b35th.morph2', name: 'B3 5th', id: 43, bit: 2168, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 43', deltaOf: 'panelB.b35th' },
    { key: 'panelB.b35th.morph3', name: 'B3 5th', id: 43, bit: 2173, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 43', deltaOf: 'panelB.b35th' },
    { key: 'panelB.b35th', name: 'B3 5th', id: 43, bit: 2178, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 43' },
    { key: 'panelB.b36th.morph1', name: 'B3 6th', id: 44, bit: 2182, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 44', deltaOf: 'panelB.b36th' },
    { key: 'panelB.b36th.morph2', name: 'B3 6th', id: 44, bit: 2187, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 44', deltaOf: 'panelB.b36th' },
    { key: 'panelB.b36th.morph3', name: 'B3 6th', id: 44, bit: 2192, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 44', deltaOf: 'panelB.b36th' },
    { key: 'panelB.b36th', name: 'B3 6th', id: 44, bit: 2197, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 44' },
    { key: 'panelB.b38th.morph1', name: 'B3 8th', id: 45, bit: 2201, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 45', deltaOf: 'panelB.b38th' },
    { key: 'panelB.b38th.morph2', name: 'B3 8th', id: 45, bit: 2206, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 45', deltaOf: 'panelB.b38th' },
    { key: 'panelB.b38th.morph3', name: 'B3 8th', id: 45, bit: 2211, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 45', deltaOf: 'panelB.b38th' },
    { key: 'panelB.b38th', name: 'B3 8th', id: 45, bit: 2216, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 45' },
    { key: 'panelB.b3Sub46.morph1', name: 'B3 Sub', id: 46, bit: 2220, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 46', deltaOf: 'panelB.b3Sub46' },
    { key: 'panelB.b3Sub46.morph2', name: 'B3 Sub', id: 46, bit: 2225, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 46', deltaOf: 'panelB.b3Sub46' },
    { key: 'panelB.b3Sub46.morph3', name: 'B3 Sub', id: 46, bit: 2230, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 46', deltaOf: 'panelB.b3Sub46' },
    { key: 'panelB.b3Sub46', name: 'B3 Sub', id: 46, bit: 2235, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 46' },
    { key: 'panelB.b3Sub347.morph1', name: 'B3 Sub3', id: 47, bit: 2239, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 47', deltaOf: 'panelB.b3Sub347' },
    { key: 'panelB.b3Sub347.morph2', name: 'B3 Sub3', id: 47, bit: 2244, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 47', deltaOf: 'panelB.b3Sub347' },
    { key: 'panelB.b3Sub347.morph3', name: 'B3 Sub3', id: 47, bit: 2249, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 47', deltaOf: 'panelB.b3Sub347' },
    { key: 'panelB.b3Sub347', name: 'B3 Sub3', id: 47, bit: 2254, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 47' },
    { key: 'panelB.b3Fund48.morph1', name: 'B3 Fund', id: 48, bit: 2258, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 48', deltaOf: 'panelB.b3Fund48' },
    { key: 'panelB.b3Fund48.morph2', name: 'B3 Fund', id: 48, bit: 2263, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 48', deltaOf: 'panelB.b3Fund48' },
    { key: 'panelB.b3Fund48.morph3', name: 'B3 Fund', id: 48, bit: 2268, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 48', deltaOf: 'panelB.b3Fund48' },
    { key: 'panelB.b3Fund48', name: 'B3 Fund', id: 48, bit: 2273, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 48' },
    { key: 'panelB.b32nd49.morph1', name: 'B3 2nd', id: 49, bit: 2277, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 49', deltaOf: 'panelB.b32nd49' },
    { key: 'panelB.b32nd49.morph2', name: 'B3 2nd', id: 49, bit: 2282, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 49', deltaOf: 'panelB.b32nd49' },
    { key: 'panelB.b32nd49.morph3', name: 'B3 2nd', id: 49, bit: 2287, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 49', deltaOf: 'panelB.b32nd49' },
    { key: 'panelB.b32nd49', name: 'B3 2nd', id: 49, bit: 2292, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 49' },
    { key: 'panelB.b33rd50.morph1', name: 'B3 3rd', id: 50, bit: 2296, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 50', deltaOf: 'panelB.b33rd50' },
    { key: 'panelB.b33rd50.morph2', name: 'B3 3rd', id: 50, bit: 2301, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 50', deltaOf: 'panelB.b33rd50' },
    { key: 'panelB.b33rd50.morph3', name: 'B3 3rd', id: 50, bit: 2306, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 50', deltaOf: 'panelB.b33rd50' },
    { key: 'panelB.b33rd50', name: 'B3 3rd', id: 50, bit: 2311, width: 4, min: 0, max: 8, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 50' },
    { key: 'panelB.b34th51.morph1', name: 'B3 4th', id: 51, bit: 2315, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 51', deltaOf: 'panelB.b34th51' },
    { key: 'panelB.b34th51.morph2', name: 'B3 4th', id: 51, bit: 2320, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 51', deltaOf: 'panelB.b34th51' },
    { key: 'panelB.b34th51.morph3', name: 'B3 4th', id: 51, bit: 2325, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 51', deltaOf: 'panelB.b34th51' },
    { key: 'panelB.b34th51', name: 'B3 4th', id: 51, bit: 2330, width: 4, min: 0, max: 8, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 51' },
    { key: 'panelB.b35th52.morph1', name: 'B3 5th', id: 52, bit: 2334, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 52', deltaOf: 'panelB.b35th52' },
    { key: 'panelB.b35th52.morph2', name: 'B3 5th', id: 52, bit: 2339, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 52', deltaOf: 'panelB.b35th52' },
    { key: 'panelB.b35th52.morph3', name: 'B3 5th', id: 52, bit: 2344, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 52', deltaOf: 'panelB.b35th52' },
    { key: 'panelB.b35th52', name: 'B3 5th', id: 52, bit: 2349, width: 4, min: 0, max: 8, def: 4, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 52' },
    { key: 'panelB.b36th53.morph1', name: 'B3 6th', id: 53, bit: 2353, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 53', deltaOf: 'panelB.b36th53' },
    { key: 'panelB.b36th53.morph2', name: 'B3 6th', id: 53, bit: 2358, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 53', deltaOf: 'panelB.b36th53' },
    { key: 'panelB.b36th53.morph3', name: 'B3 6th', id: 53, bit: 2363, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 53', deltaOf: 'panelB.b36th53' },
    { key: 'panelB.b36th53', name: 'B3 6th', id: 53, bit: 2368, width: 4, min: 0, max: 8, def: 6, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 53' },
    { key: 'panelB.b38th54.morph1', name: 'B3 8th', id: 54, bit: 2372, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 54', deltaOf: 'panelB.b38th54' },
    { key: 'panelB.b38th54.morph2', name: 'B3 8th', id: 54, bit: 2377, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 54', deltaOf: 'panelB.b38th54' },
    { key: 'panelB.b38th54.morph3', name: 'B3 8th', id: 54, bit: 2382, width: 5, min: -8, max: 8, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 54', deltaOf: 'panelB.b38th54' },
    { key: 'panelB.b38th54', name: 'B3 8th', id: 54, bit: 2387, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 54' },
    { key: 'panelB.b3VibratoMode', name: 'B3 Vibrato Mode', id: 55, bit: 2391, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 55' },
    { key: 'panelB.b3VibratoMode56', name: 'B3 Vibrato Mode', id: 56, bit: 2392, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 56' },
    { key: 'panelB.b3PercussionMode', name: 'B3 Percussion Mode', id: 57, bit: 2393, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 57' },
    { key: 'panelB.b3PercussionMode58', name: 'B3 Percussion Mode', id: 58, bit: 2394, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 58' },
    { key: 'panelB.pianoUnisonAmount', name: 'Piano Unison Amount', id: 60, bit: 2409, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 60' },
    { key: 'panelB.clavinetEqMode', name: 'Clavinet Eq Mode', id: 61, bit: 2411, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 61' },
    { key: 'panelB.clavinetEqMode62', name: 'Clavinet Eq Mode', id: 62, bit: 2413, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 62' },
    { key: 'panelB.param63', name: 'panelB.param63', id: 63, bit: 2415, width: 3, min: 0, max: 7, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 63' },
    { key: 'panelB.param64', name: 'panelB.param64', id: 64, bit: 2418, width: 4, min: 0, max: 15, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 64' },
    { key: 'panelB.param65', name: 'panelB.param65', id: 65, bit: 2422, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 65' },
    { key: 'panelB.pianoDynamics', name: 'Piano Dynamics', id: 66, bit: 2426, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 66' },
    { key: 'panelB.pianoMonoMode', name: 'Piano Mono Mode', id: 67, bit: 2429, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 67' },
    { key: 'panelB.param68', name: 'panelB.param68', id: 68, bit: 2430, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 68' },
    { key: 'panelB.pianoStringRes', name: 'Piano String Res', id: 69, bit: 2433, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 69' },
    { key: 'panelB.param70', name: 'panelB.param70', id: 70, bit: 2434, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 70' },
    { key: 'panelB.glideRate', name: 'Glide Rate', id: 71, bit: 2435, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 71' },
    { key: 'panelB.glideMode', name: 'Glide Mode', id: 72, bit: 2442, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 72' },
    { key: 'panelB.voicesMode', name: 'Voices Mode', id: 73, bit: 2443, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 73' },
    { key: 'panelB.unisonAmount', name: 'Unison Amount', id: 74, bit: 2445, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 74' },
    { key: 'panelB.vibratoMode', name: 'Vibrato Mode', id: 75, bit: 2452, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 75' },
    { key: 'panelB.modEnvelopeAttack', name: 'Mod Envelope Attack', id: 76, bit: 2455, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 76' },
    { key: 'panelB.modEnvelopeRelDecay', name: 'Mod Envelope Rel/Decay', id: 77, bit: 2462, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 77' },
    { key: 'panelB.modEnvelopeMode', name: 'Mod Envelope Mode', id: 78, bit: 2469, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 78' },
    { key: 'panelB.modEnvelopeVelocity', name: 'Mod Envelope Velocity', id: 79, bit: 2471, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 79' },
    { key: 'panelB.param80', name: 'panelB.param80', id: 80, bit: 2472, width: 2, min: 0, max: 2, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 80' },
    { key: 'panelB.param81', name: 'panelB.param81', id: 81, bit: 2474, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 81' },
    { key: 'panelB.oscillatorGroupTimbre.morph1', name: 'Oscillator Group Timbre', id: 82, bit: 2481, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 82', deltaOf: 'panelB.oscillatorGroupTimbre' },
    { key: 'panelB.oscillatorGroupTimbre.morph2', name: 'Oscillator Group Timbre', id: 82, bit: 2489, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 82', deltaOf: 'panelB.oscillatorGroupTimbre' },
    { key: 'panelB.oscillatorGroupTimbre.morph3', name: 'Oscillator Group Timbre', id: 82, bit: 2497, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 82', deltaOf: 'panelB.oscillatorGroupTimbre' },
    { key: 'panelB.oscillatorGroupTimbre', name: 'Oscillator Group Timbre', id: 82, bit: 2505, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 82' },
    { key: 'panelB.param83', name: 'panelB.param83', id: 83, bit: 2512, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 83' },
    { key: 'panelB.oscillatorGroupTimbreCtrl', name: 'Oscillator Group Timbre Ctrl', id: 84, bit: 2513, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 84' },
    { key: 'panelB.oscillatorGroupModEnvelope', name: 'Oscillator Group Mod Envelope', id: 85, bit: 2520, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 85' },
    { key: 'panelB.filterFrequency.morph1', name: 'Filter Frequency', id: 86, bit: 2521, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 86', deltaOf: 'panelB.filterFrequency' },
    { key: 'panelB.filterFrequency.morph2', name: 'Filter Frequency', id: 86, bit: 2529, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 86', deltaOf: 'panelB.filterFrequency' },
    { key: 'panelB.filterFrequency.morph3', name: 'Filter Frequency', id: 86, bit: 2537, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 86', deltaOf: 'panelB.filterFrequency' },
    { key: 'panelB.filterFrequency', name: 'Filter Frequency', id: 86, bit: 2545, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 86' },
    { key: 'panelB.filterResonance', name: 'Filter Resonance', id: 87, bit: 2552, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 87' },
    { key: 'panelB.filterFreqCtrl', name: 'Filter Freq Ctrl', id: 88, bit: 2559, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 88' },
    { key: 'panelB.filterModEnvelope', name: 'Filter Mod Envelope', id: 89, bit: 2566, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 89' },
    { key: 'panelB.filterKbTrack', name: 'Filter Kb Track', id: 90, bit: 2567, width: 2, min: 0, max: 3, def: 3, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 90' },
    { key: 'panelB.filterSlope', name: 'Filter Slope', id: 91, bit: 2569, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 91' },
    { key: 'panelB.ampEnvelopeAttack', name: 'Amp Envelope Attack', id: 92, bit: 2571, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 92' },
    { key: 'panelB.ampEnvelopeRelDecay', name: 'Amp Envelope Rel/Decay', id: 93, bit: 2578, width: 7, min: 0, max: 127, def: 15, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 93' },
    { key: 'panelB.ampEnvelopeMode', name: 'Amp Envelope Mode', id: 94, bit: 2585, width: 2, min: 0, max: 2, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 94' },
    { key: 'panelB.ampEnvelopeVelocity', name: 'Amp Envelope Velocity', id: 95, bit: 2587, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 95' },
    { key: 'panelB.equalizerBass', name: 'Equalizer Bass', id: 96, bit: 2588, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 96' },
    { key: 'panelB.equalizerTreble', name: 'Equalizer Treble', id: 97, bit: 2595, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 97' },
    { key: 'panelB.vibratoRate', name: 'Vibrato Rate', id: 98, bit: 2602, width: 7, min: 0, max: 100, def: 50, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 98' },
    { key: 'panelB.vibratoAmount', name: 'Vibrato Amount', id: 99, bit: 2609, width: 7, min: 0, max: 100, def: 50, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 99' },
    { key: 'panelB.param100', name: 'panelB.param100', id: 100, bit: 2616, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 100' },
    { key: 'panelB.param102', name: 'panelB.param102', id: 102, bit: 2643, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 102' },
    { key: 'panelB.param103', name: 'panelB.param103', id: 103, bit: 2645, width: 7, min: 0, max: 119, def: 2, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 103' },
    { key: 'panelB.param104.morph1', name: 'panelB.param104.morph1', id: 104, bit: 2652, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 104', deltaOf: 'panelB.param104' },
    { key: 'panelB.param104.morph2', name: 'panelB.param104.morph2', id: 104, bit: 2661, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 104', deltaOf: 'panelB.param104' },
    { key: 'panelB.param104.morph3', name: 'panelB.param104.morph3', id: 104, bit: 2670, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 104', deltaOf: 'panelB.param104' },
    { key: 'panelB.param104', name: 'panelB.param104', id: 104, bit: 2679, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 104' },
    { key: 'panelB.param105', name: 'panelB.param105', id: 105, bit: 2687, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 105' },
    { key: 'panelB.param106', name: 'panelB.param106', id: 106, bit: 2695, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 106' },
    { key: 'panelB.param107', name: 'panelB.param107', id: 107, bit: 2703, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 107' },
    { key: 'panelB.param108', name: 'panelB.param108', id: 108, bit: 2711, width: 4, min: 0, max: 15, def: 13, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 108' },
    { key: 'panelB.param110.morph1', name: 'panelB.param110.morph1', id: 110, bit: 2730, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 110', deltaOf: 'panelB.param110' },
    { key: 'panelB.param110.morph2', name: 'panelB.param110.morph2', id: 110, bit: 2739, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 110', deltaOf: 'panelB.param110' },
    { key: 'panelB.param110.morph3', name: 'panelB.param110.morph3', id: 110, bit: 2748, width: 9, min: -128, max: 128, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 110', deltaOf: 'panelB.param110' },
    { key: 'panelB.param110', name: 'panelB.param110', id: 110, bit: 2757, width: 8, min: 0, max: 128, def: 128, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 110' },
    { key: 'panelB.param111', name: 'panelB.param111', id: 111, bit: 2765, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 111' },
    { key: 'panelB.param112', name: 'panelB.param112', id: 112, bit: 2766, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 112' },
    { key: 'panelB.param113', name: 'panelB.param113', id: 113, bit: 2767, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 113' },
    { key: 'panelB.param114', name: 'panelB.param114', id: 114, bit: 2768, width: 3, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 114' },
    { key: 'panelB.param116', name: 'panelB.param116', id: 116, bit: 2781, width: 3, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 116' },
    { key: 'panelB.effect1Type', name: 'Effect 1 Type', id: 117, bit: 2784, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 117' },
    { key: 'panelB.effect1Source', name: 'Effect 1 Source', id: 118, bit: 2787, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 118' },
    { key: 'panelB.effect1Amount.morph1', name: 'Effect 1 Amount', id: 119, bit: 2789, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 119', deltaOf: 'panelB.effect1Amount' },
    { key: 'panelB.effect1Amount.morph2', name: 'Effect 1 Amount', id: 119, bit: 2797, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 119', deltaOf: 'panelB.effect1Amount' },
    { key: 'panelB.effect1Amount.morph3', name: 'Effect 1 Amount', id: 119, bit: 2805, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 119', deltaOf: 'panelB.effect1Amount' },
    { key: 'panelB.effect1Amount', name: 'Effect 1 Amount', id: 119, bit: 2813, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 119' },
    { key: 'panelB.effect1Rate.morph1', name: 'Effect 1 Rate', id: 120, bit: 2820, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 120', deltaOf: 'panelB.effect1Rate' },
    { key: 'panelB.effect1Rate.morph2', name: 'Effect 1 Rate', id: 120, bit: 2828, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 120', deltaOf: 'panelB.effect1Rate' },
    { key: 'panelB.effect1Rate.morph3', name: 'Effect 1 Rate', id: 120, bit: 2836, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 120', deltaOf: 'panelB.effect1Rate' },
    { key: 'panelB.effect1Rate', name: 'Effect 1 Rate', id: 120, bit: 2844, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 120' },
    { key: 'panelB.effect1Mode', name: 'Effect 1 Mode', id: 121, bit: 2851, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 121' },
    { key: 'panelB.effect2Type', name: 'Effect 2 Type', id: 122, bit: 2852, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 122' },
    { key: 'panelB.effect2Source', name: 'Effect 2 Source', id: 123, bit: 2855, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 123' },
    { key: 'panelB.effect2Amount.morph1', name: 'Effect 2 Amount', id: 124, bit: 2857, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 124', deltaOf: 'panelB.effect2Amount' },
    { key: 'panelB.effect2Amount.morph2', name: 'Effect 2 Amount', id: 124, bit: 2865, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 124', deltaOf: 'panelB.effect2Amount' },
    { key: 'panelB.effect2Amount.morph3', name: 'Effect 2 Amount', id: 124, bit: 2873, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 124', deltaOf: 'panelB.effect2Amount' },
    { key: 'panelB.effect2Amount', name: 'Effect 2 Amount', id: 124, bit: 2881, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 124' },
    { key: 'panelB.effect2Rate.morph1', name: 'Effect 2 Rate', id: 125, bit: 2888, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 125', deltaOf: 'panelB.effect2Rate' },
    { key: 'panelB.effect2Rate.morph2', name: 'Effect 2 Rate', id: 125, bit: 2896, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 125', deltaOf: 'panelB.effect2Rate' },
    { key: 'panelB.effect2Rate.morph3', name: 'Effect 2 Rate', id: 125, bit: 2904, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 125', deltaOf: 'panelB.effect2Rate' },
    { key: 'panelB.effect2Rate', name: 'Effect 2 Rate', id: 125, bit: 2912, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 125' },
    { key: 'panelB.effect2Mode', name: 'Effect 2 Mode', id: 126, bit: 2919, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 126' },
    { key: 'panelB.delaySource', name: 'Delay Source', id: 127, bit: 2920, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 127' },
    { key: 'panelB.delayAmount.morph1', name: 'Delay Amount', id: 128, bit: 2922, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 128', deltaOf: 'panelB.delayAmount' },
    { key: 'panelB.delayAmount.morph2', name: 'Delay Amount', id: 128, bit: 2930, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 128', deltaOf: 'panelB.delayAmount' },
    { key: 'panelB.delayAmount.morph3', name: 'Delay Amount', id: 128, bit: 2938, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 128', deltaOf: 'panelB.delayAmount' },
    { key: 'panelB.delayAmount', name: 'Delay Amount', id: 128, bit: 2946, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 128' },
    { key: 'panelB.param129.morph1', name: 'panelB.param129.morph1', id: 129, bit: 2953, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 129', deltaOf: 'panelB.param129' },
    { key: 'panelB.param129.morph2', name: 'panelB.param129.morph2', id: 129, bit: 2961, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 129', deltaOf: 'panelB.param129' },
    { key: 'panelB.param129.morph3', name: 'panelB.param129.morph3', id: 129, bit: 2969, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 129', deltaOf: 'panelB.param129' },
    { key: 'panelB.param129', name: 'panelB.param129', id: 129, bit: 2977, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 129' },
    { key: 'panelB.delayFeedback', name: 'Delay Feedback', id: 130, bit: 2984, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 130' },
    { key: 'panelB.delayPingPong', name: 'Delay Ping Pong', id: 131, bit: 2991, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 131' },
    { key: 'panelB.delayMode', name: 'Delay Mode', id: 132, bit: 2992, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 132' },
    { key: 'panelB.ampSimEqModel', name: 'AmpSim/Eq Model', id: 133, bit: 2993, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 133' },
    { key: 'panelB.ampSimEqSource', name: 'AmpSim/Eq Source', id: 134, bit: 2995, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 134' },
    { key: 'panelB.ampSimEqDrive', name: 'AmpSim/Eq Drive', id: 135, bit: 2997, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 135' },
    { key: 'panelB.ampSimEqBass', name: 'AmpSim/Eq Bass', id: 136, bit: 3004, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 136' },
    { key: 'panelB.ampSimEqMid', name: 'AmpSim/Eq Mid', id: 137, bit: 3011, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 137' },
    { key: 'panelB.ampSimEqTreble', name: 'AmpSim/Eq Treble', id: 138, bit: 3018, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 138' },
    { key: 'panelB.ampSimEqMode', name: 'AmpSim/Eq Mode', id: 139, bit: 3025, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 139' },
    { key: 'panelB.param140', name: 'panelB.param140', id: 140, bit: 3026, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 140' },
    { key: 'panelB.param142', name: 'panelB.param142', id: 142, bit: 3036, width: 1, min: 0, max: 0, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 142' },
    { key: 'panelB.organSustainPedal', name: 'Organ SustainPedal', id: 143, bit: 3037, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 143' },
    { key: 'panelB.organOctaveShift', name: 'Organ Octave Shift', id: 144, bit: 3038, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 144' },
    { key: 'panelB.organLevel.morph1', name: 'Organ Level', id: 145, bit: 3042, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 145', deltaOf: 'panelB.organLevel' },
    { key: 'panelB.organLevel.morph2', name: 'Organ Level', id: 145, bit: 3050, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 145', deltaOf: 'panelB.organLevel' },
    { key: 'panelB.organLevel.morph3', name: 'Organ Level', id: 145, bit: 3058, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 145', deltaOf: 'panelB.organLevel' },
    { key: 'panelB.organLevel', name: 'Organ Level', id: 145, bit: 3066, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 145' },
    { key: 'panelB.organMode', name: 'Organ Mode', id: 146, bit: 3073, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 146' },
    { key: 'panelB.param147', name: 'panelB.param147', id: 147, bit: 3074, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 147' },
    { key: 'panelB.pianoPitchStick', name: 'Piano PitchStick', id: 148, bit: 3077, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 148' },
    { key: 'panelB.pianoSustainPedal', name: 'Piano SustainPedal', id: 149, bit: 3078, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 149' },
    { key: 'panelB.pianoOctaveShift', name: 'Piano Octave Shift', id: 150, bit: 3079, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 150' },
    { key: 'panelB.pianoLevel.morph1', name: 'Piano Level', id: 151, bit: 3083, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 151', deltaOf: 'panelB.pianoLevel' },
    { key: 'panelB.pianoLevel.morph2', name: 'Piano Level', id: 151, bit: 3091, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 151', deltaOf: 'panelB.pianoLevel' },
    { key: 'panelB.pianoLevel.morph3', name: 'Piano Level', id: 151, bit: 3099, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 151', deltaOf: 'panelB.pianoLevel' },
    { key: 'panelB.pianoLevel', name: 'Piano Level', id: 151, bit: 3107, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 151' },
    { key: 'panelB.pianoMode', name: 'Piano Mode', id: 152, bit: 3114, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 152' },
    { key: 'panelB.param153', name: 'panelB.param153', id: 153, bit: 3115, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 153' },
    { key: 'panelB.synthPitchStick', name: 'Synth PitchStick', id: 154, bit: 3118, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 154' },
    { key: 'panelB.synthSustainPedal', name: 'Synth SustainPedal', id: 155, bit: 3119, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 155' },
    { key: 'panelB.synthOctaveShift', name: 'Synth Octave Shift', id: 156, bit: 3120, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 156' },
    { key: 'panelB.synthLevel.morph1', name: 'Synth Level', id: 157, bit: 3124, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 157', deltaOf: 'panelB.synthLevel' },
    { key: 'panelB.synthLevel.morph2', name: 'Synth Level', id: 157, bit: 3132, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 157', deltaOf: 'panelB.synthLevel' },
    { key: 'panelB.synthLevel.morph3', name: 'Synth Level', id: 157, bit: 3140, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 157', deltaOf: 'panelB.synthLevel' },
    { key: 'panelB.synthLevel', name: 'Synth Level', id: 157, bit: 3148, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 157' },
    { key: 'panelB.synthMode', name: 'Synth Mode', id: 158, bit: 3155, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 158' },
    { key: 'panelB.param159', name: 'panelB.param159', id: 159, bit: 3156, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 159' },
    { key: 'panelB.externPitchStick', name: 'Extern PitchStick', id: 160, bit: 3159, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 160' },
    { key: 'panelB.externSustainPedal', name: 'Extern SustainPedal', id: 161, bit: 3160, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 161' },
    { key: 'panelB.externOctaveShift', name: 'Extern Octave Shift', id: 162, bit: 3161, width: 4, min: 0, max: 13, def: 7, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 162' },
    { key: 'panelB.externLevel.morph1', name: 'Extern Level', id: 163, bit: 3165, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 163', deltaOf: 'panelB.externLevel' },
    { key: 'panelB.externLevel.morph2', name: 'Extern Level', id: 163, bit: 3173, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 163', deltaOf: 'panelB.externLevel' },
    { key: 'panelB.externLevel.morph3', name: 'Extern Level', id: 163, bit: 3181, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 163', deltaOf: 'panelB.externLevel' },
    { key: 'panelB.externLevel', name: 'Extern Level', id: 163, bit: 3189, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 163' },
    { key: 'panelB.externMode', name: 'Extern Mode', id: 164, bit: 3196, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 164' },
    { key: 'panelB.param165', name: 'panelB.param165', id: 165, bit: 3197, width: 3, min: 0, max: 6, def: 5, enc: 'u', confidence: 'high', src: 'Stage Classic OS 5.08 parameter descriptors · panelB 165' },
  ],
  sets: {
    panelA: 'panel',
    panelB: 'panel',
  },
};
