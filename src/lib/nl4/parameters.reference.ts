/**
 * Nord Lead 4 / 4R parameter reference — the complete MIDI-CC parameter
 * inventory transcribed from the official manual. This is an ORACLE for
 * reverse-engineering the bit-packed `.nl4s`/`.nl4p` body, NOT a decode map:
 * it lists every parameter that must be present, its CC number, and its value
 * range or ordered enumeration. It is not yet aligned to body bit-offsets (the
 * body is a 7-bit-packed bitstream, so a parameter's byte value is not its raw
 * enum index — differential RE still has to place each field).
 *
 * How to use it: when a differential pass isolates a field, match its
 * cardinality/range and behaviour against this list to name it, and cite the
 * manual page. Enum orders are printed exactly as the manual lists them, so the
 * index → label mapping is authoritative once the field's offset is found.
 *
 * Source: Nord Lead 4 English User Manual v1.3x, Edition H — MIDI Controller
 * list (p.48) for CC numbers + value convention; panel-reference sections
 * (pp.25, 27-33) for the enum orderings. Fetched from nordkeyboards.com.
 * Value convention: on/off = 0/127; stepped selectors start at 0 and increment
 * evenly across the knob range.
 */

/** One documented Nord Lead 4 parameter. Either `values` (enum) or `range`. */
export interface Nl4ParameterRef {
  /** Parameter name as printed on the panel / in the manual. */
  readonly name: string;
  /** MIDI CC number (manual p.48). */
  readonly cc: number;
  /** Front-panel section the parameter belongs to. */
  readonly section:
    | 'osc' | 'filter' | 'env' | 'lfo' | 'arp' | 'fx' | 'voice' | 'morph' | 'global';
  /** Ordered enumeration — index = value, label authoritative once offset is known. */
  readonly values?: readonly string[];
  /** Continuous range [min, max] for knob parameters. */
  readonly range?: readonly [number, number];
}

/**
 * All 92 documented parameters. No duplicate CC numbers (validated on import).
 */
export const NL4_PARAMETERS: readonly Nl4ParameterRef[] = [
  { name: "Voice Mode Unison", cc: 16, section: "voice", values: ["Off", "Unison 1", "Unison 2", "Unison 3"] },
  { name: "Pitch Bend Range", cc: 118, section: "voice", values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "24", "48", "-12", "-24"] },
  { name: "Vib Select", cc: 56, section: "voice", values: ["Off", "Dly Vib 1", "Dly Vib 2", "Whl"] },
  { name: "Glide Rate", cc: 5, section: "voice", range: [0, 127] },
  { name: "Mono Selector", cc: 15, section: "voice", values: ["Poly", "Mono", "Legato"] },
  { name: "Hold", cc: 58, section: "voice", values: ["Off", "On"] },
  { name: "Hold Enable", cc: 54, section: "voice", values: ["Off", "On"] },
  { name: "Chord Enable", cc: 112, section: "voice", values: ["Off", "On"] },
  { name: "Octave Shift", cc: 17, section: "voice", values: ["-24", "-12", "0", "+12", "+24"] },
  { name: "Impulse Morph Buttons", cc: 70, section: "morph", range: [0, 7] },
  { name: "Mod Wheel", cc: 1, section: "morph", range: [0, 127] },
  { name: "LFO 1 Rate", cc: 19, section: "lfo", range: [0, 127] },
  { name: "LFO 1 Waveform", cc: 20, section: "lfo", values: ["Square", "Nonlinear Sawtooth 1", "Nonlinear Inverted Sawtooth", "Nonlinear Sawtooth 2", "Inverted Nonlinear Sawtooth 2", "Triangle"] },
  { name: "LFO 1 Destination", cc: 21, section: "lfo", values: ["Filter", "Osc Mod", "Osc Mix", "Osc 2", "AM", "PW"] },
  { name: "LFO 1 Amount", cc: 22, section: "lfo", range: [0, 127] },
  { name: "LFO 1 Mst Clk", cc: 2, section: "lfo", values: ["Off", "On"] },
  { name: "LFO 1 Clk Divisions", cc: 3, section: "lfo", values: ["4b", "2b", "1", "2", "4", "8", "16", "32", "64", "4bt", "2bt", "1t", "2t", "4t", "8t", "16t", "32t", "Pat"] },
  { name: "LFO 1 KBS", cc: 83, section: "lfo", values: ["Off", "On"] },
  { name: "LFO 1 Impsync", cc: 59, section: "lfo", values: ["Off", "On"] },
  { name: "LFO1/Arp On/Off", cc: 91, section: "arp", values: ["LFO 1", "Arp"] },
  { name: "Arp Tempo", cc: 9, section: "arp", range: [0, 127] },
  { name: "Arp Mst Clk", cc: 86, section: "arp", values: ["Off", "On"] },
  { name: "Arp Clk Division", cc: 87, section: "arp", values: ["2", "4", "8", "16", "32", "2t", "4t", "8t", "16t", "Pat"] },
  { name: "Arp Direction", cc: 89, section: "arp", values: ["Up", "Down", "Up/Down", "Rnd", "Poly"] },
  { name: "Arp Run", cc: 90, section: "arp", values: ["Stopped", "Run"] },
  { name: "Arp Range", cc: 88, section: "arp", values: ["1", "2", "3", "4"] },
  { name: "Arp KBS", cc: 92, section: "arp", values: ["Off", "On"] },
  { name: "Arp Impsync", cc: 93, section: "arp", values: ["Off", "On"] },
  { name: "LFO 2 Rate", cc: 23, section: "lfo", range: [0, 127] },
  { name: "LFO 2 Waveform", cc: 85, section: "lfo", values: ["Square", "Sawtooth", "Inverted Sawtooth", "Triangle", "Stepped Random", "Smooth Random"] },
  { name: "LFO 2 Destination", cc: 24, section: "lfo", values: ["Filter", "Osc Mod", "Osc 1", "Osc 2", "Osc 1 & 2", "Pan", "FX"] },
  { name: "LFO 2 Amount", cc: 25, section: "lfo", range: [0, 127] },
  { name: "LFO 2 Mst Clk", cc: 18, section: "lfo", values: ["Off", "On"] },
  { name: "LFO 2 Clk Divisions", cc: 14, section: "lfo", values: ["4b", "2b", "1", "2", "4", "8", "16", "32", "64", "4bt", "2bt", "1t", "2t", "4t", "8t", "16t", "32t", "Pat"] },
  { name: "LFO 2 KBS", cc: 12, section: "lfo", values: ["Off", "On"] },
  { name: "LFO 2 Impsync", cc: 13, section: "lfo", values: ["Off", "On"] },
  { name: "Mod Env Attack", cc: 26, section: "env", range: [0, 127] },
  { name: "Mod Env Decay", cc: 27, section: "env", range: [0, 127] },
  { name: "Mod Env Destination", cc: 28, section: "env", values: ["Osc Mix", "Osc Mod", "Osc 1", "Osc 2", "Osc 1 + Osc 2", "FX", "LFO2"] },
  { name: "Mod Env Amount", cc: 29, section: "env", range: [0, 127] },
  { name: "Mod Env Rel Mode", cc: 109, section: "env", values: ["AD", "AR"] },
  { name: "Mod Env Impsync", cc: 6, section: "env", values: ["Off", "On"] },
  { name: "Osc 1 Waveform", cc: 30, section: "osc", values: ["Triangle", "Sawtooth", "Pulse (PWM 50%)", "Pulse 10%", "Pulse 33%", "Wave (wavetable)", "Sine"] },
  { name: "Osc 1 Wavetable Selection", cc: 49, section: "osc", range: [0, 127] },
  { name: "Osc 2 Waveform", cc: 31, section: "osc", values: ["Triangle", "Sawtooth", "Pulse", "Sine", "Noise"] },
  { name: "Osc 2 Semi Tones", cc: 78, section: "osc", range: [0, 127] },
  { name: "Osc 2 Fine Tune", cc: 33, section: "osc", range: [0, 127] },
  { name: "Osc 2 KBT", cc: 34, section: "osc", values: ["Off", "On"] },
  { name: "Osc 2 Noise Res", cc: 61, section: "osc", range: [0, 127] },
  { name: "Osc 2 Noise Freq", cc: 62, section: "osc", range: [0, 127] },
  { name: "Osc 2 Noise KBT", cc: 63, section: "osc", values: ["Off", "On"] },
  { name: "Osc Mod Amount", cc: 69, section: "osc", range: [0, 127] },
  { name: "Osc Mod Select", cc: 105, section: "osc", values: ["Off", "FM 1", "FM 2", "FM 3", "H Sync", "S Sync"] },
  { name: "Osc Mix", cc: 8, section: "osc", range: [0, 127] },
  { name: "Amp Env Attack", cc: 73, section: "env", range: [0, 127] },
  { name: "Amp Env Decay", cc: 36, section: "env", range: [0, 127] },
  { name: "Amp Env Sustain", cc: 37, section: "env", range: [0, 127] },
  { name: "Amp Env Release", cc: 72, section: "env", range: [0, 127] },
  { name: "Amp Velocity", cc: 35, section: "env", values: ["Off", "On"] },
  { name: "Filt Env Attack", cc: 38, section: "env", range: [0, 127] },
  { name: "Filt Env Decay", cc: 39, section: "env", range: [0, 127] },
  { name: "Filt Env Sustain", cc: 40, section: "env", range: [0, 127] },
  { name: "Filt Env Release", cc: 41, section: "env", range: [0, 127] },
  { name: "Filt Keyb Tracking", cc: 46, section: "filter", values: ["Off", "1/3", "2/3", "1"] },
  { name: "Filter Type", cc: 44, section: "filter", values: ["LP 12", "LP 24", "LP 48", "BP", "HP", "Ladder M", "Ladder TB"] },
  { name: "Filt Velocity", cc: 45, section: "filter", values: ["Off", "On"] },
  { name: "Filter Frequency", cc: 74, section: "filter", range: [0, 127] },
  { name: "Filter Resonance", cc: 42, section: "filter", range: [0, 127] },
  { name: "Filter Drive", cc: 47, section: "filter", range: [0, 127] },
  { name: "Filter Envelope Amount", cc: 43, section: "filter", range: [0, 127] },
  { name: "Output Level", cc: 71, section: "global", range: [0, 127] },
  { name: "FX Selection", cc: 53, section: "fx", values: ["Crush", "Compressor", "Drive", "Talk 1", "Talk 2", "Comb"] },
  { name: "FX On/Off", cc: 52, section: "fx", values: ["Off", "On"] },
  { name: "FX Amount", cc: 55, section: "fx", range: [0, 127] },
  { name: "Delay Tempo", cc: 77, section: "fx", range: [0, 127] },
  { name: "Delay Clk Division", cc: 57, section: "fx", values: ["2", "4", "8", "16", "32", "64", "4d", "8d", "16d", "2t", "4t", "8t", "16t", "32t", "4s", "8s", "16s"] },
  { name: "Delay Feedback", cc: 79, section: "fx", range: [0, 3] },
  { name: "Delay/Reverb Amount", cc: 76, section: "fx", range: [0, 127] },
  { name: "Delay Mst Clk", cc: 51, section: "fx", values: ["Off", "On"] },
  { name: "Delay / Reverb selection", cc: 50, section: "fx", values: ["Delay", "Reverb"] },
  { name: "Reverb Bright", cc: 94, section: "fx", range: [0, 127] },
  { name: "Reverb Model", cc: 96, section: "fx", values: ["Room", "Stage", "Hall"] },
  { name: "Delay/Reverb On Off", cc: 97, section: "fx", values: ["Off", "On"] },
  { name: "Pattern selection", cc: 117, section: "global", range: [0, 127] },
  { name: "Slot Focus", cc: 119, section: "global", values: ["Slot A", "Slot B", "Slot C", "Slot D"] },
  { name: "Slot Enable", cc: 115, section: "global", range: [0, 127] },
  { name: "Pan", cc: 10, section: "global", range: [0, 127] },
  { name: "Volume Pedal (if set in System menu)", cc: 7, section: "global", range: [0, 127] },
  { name: "Ctrl Pedal (if set in System menu)", cc: 11, section: "global", range: [0, 127] },
  { name: "Sustain Pedal", cc: 64, section: "global", values: ["Off", "On"] },
  { name: "Bank Select MSB", cc: 0, section: "global", range: [0, 127] },
  { name: "Bank Select LSB", cc: 32, section: "global", range: [0, 127] },];
