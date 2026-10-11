// AUTO-GENERATED (lead-4) — DO NOT EDIT MANUALLY.
//
// Provenance: Lead 4 OS 1.32 parameter descriptors; Lead 4 OS 1.32 serialiser →, record sizes.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Nl4FieldKey =
  | 'slot.octaveShift'
  | 'slot.monoSelector'
  | 'slot.glideRate'
  | 'slot.vibSelect'
  | 'slot.lfo1Waveform'
  | 'slot.lfo1Destination'
  | 'slot.lfo1Kbs'
  | 'slot.lfo1Impsync'
  | 'slot.lfo1Rate'
  | 'slot.lfo1Amount'
  | 'slot.lfo1MstClk'
  | 'slot.lfo1ClkDivisions'
  | 'slot.lfo2Waveform'
  | 'slot.lfo2Destination'
  | 'slot.lfo2Kbs'
  | 'slot.lfo2Impsync'
  | 'slot.lfo2Rate'
  | 'slot.lfo2Amount'
  | 'slot.lfo2MstClk'
  | 'slot.lfo2ClkDivisions'
  | 'slot.modEnvAttack'
  | 'slot.modEnvDecay'
  | 'slot.modEnvAmount'
  | 'slot.modEnvDestination'
  | 'slot.modEnvRelMode'
  | 'slot.modEnvImpsync'
  | 'slot.osc1Waveform'
  | 'slot.osc1WavetableSelection'
  | 'slot.osc2Kbt'
  | 'slot.osc2Waveform'
  | 'slot.osc2SemiTones'
  | 'slot.osc2FineTune'
  | 'slot.oscModSelect'
  | 'slot.oscModAmount'
  | 'slot.oscMix'
  | 'slot.ampEnvAttack'
  | 'slot.ampEnvDecay'
  | 'slot.ampEnvSustain'
  | 'slot.ampEnvRelease'
  | 'slot.ampVelocity'
  | 'slot.filtEnvAttack'
  | 'slot.filtEnvDecay'
  | 'slot.filtEnvSustain'
  | 'slot.filtEnvRelease'
  | 'slot.filterType'
  | 'slot.filtKeybTracking'
  | 'slot.filtVelocity'
  | 'slot.filterDrive'
  | 'slot.filterFrequency'
  | 'slot.filterResonance'
  | 'slot.filterEnvelopeAmount'
  | 'slot.outputLevel'
  | 'slot.voiceModeUnison'
  | 'slot.chordEnable'
  | 'slot.param56'
  | 'slot.param57'
  | 'slot.param58'
  | 'slot.param59'
  | 'slot.lfo1ArpOnOff'
  | 'slot.arpRun'
  | 'slot.arpRange'
  | 'slot.arpDirection'
  | 'slot.arpKbs'
  | 'slot.arpImpsync'
  | 'slot.arpTempo'
  | 'slot.arpMstClk'
  | 'slot.arpClkDivision'
  | 'slot.holdEnable'
  | 'slot.param70'
  | 'slot.pitchBendRange'
  | 'slot.patternSelection'
  | 'slot.param73'
  | 'slot.osc2NoiseRes'
  | 'slot.osc2NoiseFreq'
  | 'fx.delayReverbOnOff'
  | 'fx.delayMstClk'
  | 'fx.delayClkDivision'
  | 'fx.delayReverbAmount'
  | 'fx.delayFeedback'
  | 'fx.reverbModel'
  | 'fx.fxOnOff'
  | 'fx.fxSelection'
  | 'fx.fxAmount'
  | 'fx.delayReverbSelection'
  | 'fx.reverbBright'
  | 'fx.delayTempo';

export const NL4_LAYOUT: LegacyLayout<Nl4FieldKey> = {
  model: 'Nord Lead 4',
  source: 'Lead 4 OS 1.32 parameter descriptors',
  container: 'Lead 4 OS 1.32 serialiser →, record sizes',
  recordVersion: 8,
  dataBytes: 315,
  fields: [
    { key: 'slot.octaveShift', name: 'Octave Shift', id: 0, bit: 0, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 0', cc: 17 },
    { key: 'slot.monoSelector', name: 'Mono Selector', id: 1, bit: 3, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 1', cc: 15 },
    { key: 'slot.glideRate', name: 'Glide Rate', id: 2, bit: 5, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 2', cc: 5 },
    { key: 'slot.vibSelect', name: 'Vib Select', id: 3, bit: 12, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 3', cc: 56 },
    { key: 'slot.lfo1Waveform', name: 'LFO 1 Waveform', id: 4, bit: 14, width: 3, min: 0, max: 5, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 4', cc: 20 },
    { key: 'slot.lfo1Destination', name: 'LFO 1 Destination', id: 5, bit: 17, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 5', cc: 21 },
    { key: 'slot.lfo1Kbs', name: 'LFO 1 KBS', id: 6, bit: 20, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 6', cc: 83 },
    { key: 'slot.lfo1Impsync', name: 'LFO 1 Impsync', id: 7, bit: 21, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 7', cc: 59 },
    { key: 'slot.lfo1Rate', name: 'LFO 1 Rate', id: 8, bit: 22, width: 7, min: 0, max: 127, def: 50, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 8', cc: 19 },
    { key: 'slot.lfo1Amount', name: 'LFO 1 Amount', id: 9, bit: 29, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 9', cc: 22 },
    { key: 'slot.lfo1MstClk', name: 'LFO 1 Mst Clk', id: 10, bit: 36, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 10', cc: 2 },
    { key: 'slot.lfo1ClkDivisions', name: 'LFO 1 Clk Divisions', id: 11, bit: 37, width: 5, min: 0, max: 17, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 11', cc: 3 },
    { key: 'slot.lfo2Waveform', name: 'LFO 2 Waveform', id: 12, bit: 42, width: 3, min: 0, max: 5, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 12', cc: 85 },
    { key: 'slot.lfo2Destination', name: 'LFO 2 Destination', id: 13, bit: 45, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 13', cc: 24 },
    { key: 'slot.lfo2Kbs', name: 'LFO 2 KBS', id: 14, bit: 48, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 14', cc: 12 },
    { key: 'slot.lfo2Impsync', name: 'LFO 2 Impsync', id: 15, bit: 49, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 15', cc: 13 },
    { key: 'slot.lfo2Rate', name: 'LFO 2 Rate', id: 16, bit: 50, width: 7, min: 0, max: 127, def: 50, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 16', cc: 23 },
    { key: 'slot.lfo2Amount', name: 'LFO 2 Amount', id: 17, bit: 57, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 17', cc: 25 },
    { key: 'slot.lfo2MstClk', name: 'LFO 2 Mst Clk', id: 18, bit: 64, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 18', cc: 18 },
    { key: 'slot.lfo2ClkDivisions', name: 'LFO 2 Clk Divisions', id: 19, bit: 65, width: 5, min: 0, max: 17, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 19', cc: 14 },
    { key: 'slot.modEnvAttack', name: 'Mod Env Attack', id: 20, bit: 70, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 20', cc: 26 },
    { key: 'slot.modEnvDecay', name: 'Mod Env Decay', id: 21, bit: 77, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 21', cc: 27 },
    { key: 'slot.modEnvAmount', name: 'Mod Env Amount', id: 22, bit: 84, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 22', cc: 29 },
    { key: 'slot.modEnvDestination', name: 'Mod Env Destination', id: 23, bit: 91, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 23', cc: 28 },
    { key: 'slot.modEnvRelMode', name: 'Mod Env Rel Mode', id: 24, bit: 94, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 24', cc: 109 },
    { key: 'slot.modEnvImpsync', name: 'Mod Env Impsync', id: 25, bit: 95, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 25', cc: 6 },
    { key: 'slot.osc1Waveform', name: 'Osc 1 Waveform', id: 26, bit: 96, width: 3, min: 0, max: 6, def: 1, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 26', cc: 30 },
    { key: 'slot.osc1WavetableSelection', name: 'Osc 1 Wavetable Selection', id: 28, bit: 102, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 28', cc: 49 },
    { key: 'slot.osc2Kbt', name: 'Osc 2 KBT', id: 29, bit: 109, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 29', cc: 34 },
    { key: 'slot.osc2Waveform', name: 'Osc 2 Waveform', id: 30, bit: 110, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 30', cc: 31 },
    { key: 'slot.osc2SemiTones', name: 'Osc 2 Semi Tones', id: 31, bit: 113, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 31', cc: 78 },
    { key: 'slot.osc2FineTune', name: 'Osc 2 Fine Tune', id: 32, bit: 120, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 32', cc: 33 },
    { key: 'slot.oscModSelect', name: 'Osc Mod Select', id: 33, bit: 127, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 33', cc: 105 },
    { key: 'slot.oscModAmount', name: 'Osc Mod Amount', id: 34, bit: 130, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 34', cc: 69 },
    { key: 'slot.oscMix', name: 'Osc Mix', id: 35, bit: 137, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 35', cc: 8 },
    { key: 'slot.ampEnvAttack', name: 'Amp Env Attack', id: 36, bit: 144, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 36', cc: 73 },
    { key: 'slot.ampEnvDecay', name: 'Amp Env Decay', id: 37, bit: 151, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 37', cc: 36 },
    { key: 'slot.ampEnvSustain', name: 'Amp Env Sustain', id: 38, bit: 158, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 38', cc: 37 },
    { key: 'slot.ampEnvRelease', name: 'Amp Env Release', id: 39, bit: 165, width: 7, min: 0, max: 127, def: 5, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 39', cc: 72 },
    { key: 'slot.ampVelocity', name: 'Amp Velocity', id: 40, bit: 172, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 40', cc: 35 },
    { key: 'slot.filtEnvAttack', name: 'Filt Env Attack', id: 41, bit: 173, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 41', cc: 38 },
    { key: 'slot.filtEnvDecay', name: 'Filt Env Decay', id: 42, bit: 180, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 42', cc: 39 },
    { key: 'slot.filtEnvSustain', name: 'Filt Env Sustain', id: 43, bit: 187, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 43', cc: 40 },
    { key: 'slot.filtEnvRelease', name: 'Filt Env Release', id: 44, bit: 194, width: 7, min: 0, max: 127, def: 16, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 44', cc: 41 },
    { key: 'slot.filterType', name: 'Filter Type', id: 45, bit: 201, width: 3, min: 0, max: 6, def: 1, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 45', cc: 44 },
    { key: 'slot.filtKeybTracking', name: 'Filt Keyb Tracking', id: 46, bit: 204, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 46', cc: 46 },
    { key: 'slot.filtVelocity', name: 'Filt Velocity', id: 47, bit: 206, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 47', cc: 45 },
    { key: 'slot.filterDrive', name: 'Filter Drive', id: 49, bit: 208, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 49', cc: 47 },
    { key: 'slot.filterFrequency', name: 'Filter Frequency', id: 50, bit: 215, width: 7, min: 0, max: 127, def: 84, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 50', cc: 74 },
    { key: 'slot.filterResonance', name: 'Filter Resonance', id: 51, bit: 222, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 51', cc: 42 },
    { key: 'slot.filterEnvelopeAmount', name: 'Filter Envelope Amount', id: 52, bit: 229, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 52', cc: 43 },
    { key: 'slot.outputLevel', name: 'Output Level', id: 53, bit: 236, width: 7, min: 0, max: 127, def: 89, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 53', cc: 71 },
    { key: 'slot.voiceModeUnison', name: 'Voice Mode Unison', id: 54, bit: 243, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 54', cc: 16 },
    { key: 'slot.chordEnable', name: 'Chord Enable', id: 55, bit: 245, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 55', cc: 112 },
    { key: 'slot.param56', name: 'param 56 (no CC)', id: 56, bit: 246, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 56' },
    { key: 'slot.param57', name: 'param 57 (no CC)', id: 57, bit: 258, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 57' },
    { key: 'slot.param58', name: 'param 58 (no CC)', id: 58, bit: 270, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 58' },
    { key: 'slot.param59', name: 'param 59 (no CC)', id: 59, bit: 282, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 59' },
    { key: 'slot.lfo1ArpOnOff', name: 'LFO1/Arp On/Off', id: 60, bit: 294, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 60', cc: 91 },
    { key: 'slot.arpRun', name: 'Arp Run', id: 61, bit: 295, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 61', cc: 90 },
    { key: 'slot.arpRange', name: 'Arp Range', id: 62, bit: 296, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 62', cc: 88 },
    { key: 'slot.arpDirection', name: 'Arp Direction', id: 63, bit: 298, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 63', cc: 89 },
    { key: 'slot.arpKbs', name: 'Arp KBS', id: 64, bit: 301, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 64', cc: 92 },
    { key: 'slot.arpImpsync', name: 'Arp Impsync', id: 65, bit: 302, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 65', cc: 93 },
    { key: 'slot.arpTempo', name: 'Arp Tempo', id: 66, bit: 303, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 66', cc: 9 },
    { key: 'slot.arpMstClk', name: 'Arp Mst Clk', id: 67, bit: 310, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 67', cc: 86 },
    { key: 'slot.arpClkDivision', name: 'Arp Clk Division', id: 68, bit: 311, width: 5, min: 0, max: 9, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 68', cc: 87 },
    { key: 'slot.holdEnable', name: 'Hold Enable', id: 69, bit: 316, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 69', cc: 54 },
    { key: 'slot.param70', name: 'param 70 (no CC)', id: 70, bit: 317, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 70' },
    { key: 'slot.pitchBendRange', name: 'Pitch Bend Range', id: 71, bit: 318, width: 4, min: 0, max: 12, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 71', cc: 118 },
    { key: 'slot.patternSelection', name: 'Pattern selection', id: 72, bit: 322, width: 7, min: 0, max: 59, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 72', cc: 117 },
    { key: 'slot.param73', name: 'param 73', id: 73, bit: 329, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 73', cc: 60 },
    { key: 'slot.osc2NoiseRes', name: 'Osc 2 Noise Res', id: 74, bit: 330, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 74', cc: 61 },
    { key: 'slot.osc2NoiseFreq', name: 'Osc 2 Noise Freq', id: 75, bit: 337, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot 75', cc: 62 },
    { key: 'fx.delayReverbOnOff', name: 'Delay/Reverb On Off', id: 0, bit: 2048, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 0', cc: 97 },
    { key: 'fx.delayMstClk', name: 'Delay Mst Clk', id: 1, bit: 2049, width: 2, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 1', cc: 51 },
    { key: 'fx.delayClkDivision', name: 'Delay Clk Division', id: 2, bit: 2051, width: 5, min: 0, max: 16, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 2', cc: 57 },
    { key: 'fx.delayReverbAmount', name: 'Delay/Reverb Amount', id: 4, bit: 2063, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 4', cc: 76 },
    { key: 'fx.delayFeedback', name: 'Delay Feedback', id: 5, bit: 2070, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 5', cc: 79 },
    { key: 'fx.reverbModel', name: 'Reverb Model', id: 6, bit: 2072, width: 3, min: 0, max: 3, def: 1, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 6', cc: 96 },
    { key: 'fx.fxOnOff', name: 'FX On/Off', id: 8, bit: 2082, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 8', cc: 52 },
    { key: 'fx.fxSelection', name: 'FX Selection', id: 9, bit: 2083, width: 4, min: 0, max: 5, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 9', cc: 53 },
    { key: 'fx.fxAmount', name: 'FX Amount', id: 10, bit: 2087, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 10', cc: 55 },
    { key: 'fx.delayReverbSelection', name: 'Delay / Reverb selection', id: 11, bit: 2094, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 11', cc: 50 },
    { key: 'fx.reverbBright', name: 'Reverb Bright', id: 12, bit: 2095, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 12', cc: 94 },
    { key: 'fx.delayTempo', name: 'Delay Tempo', id: 13, bit: 2102, width: 14, min: 0, max: 127, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Slot FX 13', cc: 77 },
  ],
  morphLists: [
    { set: 'slot', countBit: 388, countWidth: 7, maxEntries: 87, entryBit: 395, paramBits: 7, sourceBits: 4, deltaBits: 8 },
    { set: 'fx', countBit: 2131, countWidth: 5, maxEntries: 24, entryBit: 2136, paramBits: 4, sourceBits: 4, deltaBits: 8 },
  ],
};

export type Nl4PerfFieldKey =
  | 'perf.slotFocus'
  | 'perf.slotEnable'
  | 'perf.param2'
  | 'perf.param3'
  | 'perf.param4'
  | 'perf.hold'
  | 'perf.param11'
  | 'perf.param12'
  | 'perf.param13';

export const NL4_PERF_LAYOUT: LegacyLayout<Nl4PerfFieldKey> = {
  model: 'Nord Lead 4',
  source: 'Lead 4 OS 1.32 parameter descriptors',
  container: 'Lead 4 OS 1.32 serialiser →, record sizes',
  recordVersion: 9,
  dataBytes: 7,
  fields: [
    { key: 'perf.slotFocus', name: 'Slot Focus', id: 0, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 0', cc: 119 },
    { key: 'perf.slotEnable', name: 'Slot Enable (bitmask A-D)', id: 1, bit: 2, width: 4, min: 0, max: 15, def: 1, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 1', cc: 115 },
    { key: 'perf.param2', name: 'perf param 2', id: 2, bit: 6, width: 9, min: 0, max: 270, def: 90, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 2' },
    { key: 'perf.param3', name: 'perf param 3', id: 3, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 3' },
    { key: 'perf.param4', name: 'perf param 4', id: 4, bit: 16, width: 7, min: 0, max: 127, def: 60, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 4' },
    { key: 'perf.hold', name: 'Hold', id: 5, bit: 23, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 5', cc: 58 },
    { key: 'perf.param11', name: 'perf param 11', id: 11, bit: 24, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 11' },
    { key: 'perf.param12', name: 'perf param 12', id: 12, bit: 27, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 12' },
    { key: 'perf.param13', name: 'perf param 13', id: 13, bit: 28, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'high', src: 'Lead 4 OS 1.32 parameter descriptors · Performance common 13' },
  ],
};
