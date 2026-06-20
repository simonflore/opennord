/**
 * Nord Stage 3 (`.ns3f`) program decoder — Tier 2 of multi-model support (#22).
 *
 * NS3 stores a flat, bit-packed body with two panels (A then B); a panel-enable
 * flag at 0x31 says which are active, and Panel B's fields repeat Panel A's
 * shifted by `PANEL_STRIDE`. All offsets/masks below are transcribed **from
 * ns3-program-viewer's source** (the oracle named in docs/MULTI-MODEL.md) —
 * `src/server/ns3/program/ns3-{panel,piano,organ,synth,synth-filter,synth-osc-control,
 * fx-multi-effect-1,fx-multi-effect-2,fx-amp-sim-eq,fx-compressor,fx-delay,
 * fx-reverb,fx-rotary-speaker,mapping}.js` — and cross-checked against real `.ns3f`
 * files. Credit: Chris55 (ATTRIBUTION.md).
 *
 * v2 adds FULL parameter coverage: synth oscillator waveform/config/pitch,
 * ADSR envelopes (mod + amp), LFO wave/rate, voice/glide/unison/vibrato,
 * arpeggiator (range/pattern/rate/masterClock), filter resonance/drive/kbTrack,
 * per-FX parameters (effect1/2 rate+amount, amp/EQ treble/mid/bass,
 * compressor amount, delay feedback/mix, reverb amount, rotary speed),
 * organ octave shift, piano timbre/octave, panel octave shift, plus the
 * program name field.
 */
const PANEL_STRIDE = 263; // Panel B = Panel A + 0x107

// ── Type tables ─────────────────────────────────────────────────────────────
// All from ns3-mapping.js (Chris55/ns3-program-viewer)
const PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav', 'Digital', 'Misc'];
const ORGAN_TYPE = ['B3', 'Vox', 'Farfisa', 'Pipe1', 'Pipe2'];
const SYNTH_OSC = ['Classic', 'Wave', 'Formant', 'Super', 'Sample'];
const SYNTH_FILTER = ['LP12', 'LP24', 'Mini Moog', 'LP+HP', 'BP24', 'HP24'];
const REVERB_TYPE = ['Room 1', 'Room 2', 'Stage 1', 'Stage 2', 'Hall 1', 'Hall 2'];
const EFFECT1_TYPE = ['Panning', 'Tremolo', 'Ring Mod', 'Wah-Wah', 'Auto-Wah 1', 'Auto-Wah 2'];
const EFFECT2_TYPE = ['Phaser 1', 'Phaser 2', 'Flanger', 'Vibe', 'Chorus 1', 'Chorus 2'];
const VIB_CHORUS = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'];

// ns3-mapping.js: ns3SynthVoiceMap
const SYNTH_VOICE = ['Poly', 'Legato', 'Mono'];
// ns3-mapping.js: ns3SynthUnisonMap
const SYNTH_UNISON = ['Off', '1', '2', '3'];
// ns3-mapping.js: ns3SynthVibratoMap
const SYNTH_VIBRATO = ['Off', 'Delay 1', 'Delay 2', 'Delay 3', 'Wheel', 'AT'];
// ns3-mapping.js: ns3SynthLfoWaveMap
const LFO_WAVE = ['Triangle', 'Saw', 'Neg Saw', 'Square', 'S/H'];
// ns3-mapping.js: ns3SynthOscillatorsTypeMap (osc config / dual-osc mode)
const OSC_CONFIG = ['None','1 Pitch','2 Shape','3 Sync','4 Detune','5 MixSin','6 MixTri','7 MixSaw','8 MixSqr','9 MixBell','10 MixNs1','11 MixNs2','12 FM1','13 FM2','14 RM'];
// ns3-mapping.js: ns3SynthOscillator1ClassicWaveTypeMap
const OSC_CLASSIC_WAVE = ['Sine','Triangle','Saw','Square','Pulse 33','Pulse 10','ESaw','ESquare'];
// ns3-mapping.js: ns3SynthOscillator1FormantWaveTypeMap
const OSC_FORMANT_WAVE = ['Formant Wave Aaa','Formant Wave Eee','Formant Wave Iii','Formant Wave Ooo','Formant Wave Uuu','Formant Wave Yyy','Formant Wave AO','Formant Wave AE','Formant Wave OE'];
// ns3-mapping.js: ns3SynthOscillator1SuperWaveTypeMap
const OSC_SUPER_WAVE = ['Super Wave Saw','Super Wave Saw 2','Super Wave Square','Super Wave Square 2','Super Wave Bright','Super Wave Bright 2','Super Wave Strings','Super Wave Organ'];
// ns3-mapping.js: ns3SynthFilterKbTrackMap
const FILTER_KB_TRACK = ['Off', '1/3', '2/3', '1'];
// ns3-mapping.js: ns3SynthFilterDriveMap
const FILTER_DRIVE = ['Off', '1', '2', '3'];
// ns3-mapping.js: ns3SynthAmpEnvelopeVelocityMap
const AMP_VELOCITY = ['Off', '1', '2', '3'];
// ns3-mapping.js: ns3ArpeggiatorRangeMap
const ARP_RANGE = ['1 Octave', '2 Octaves', '3 Octaves', '4 Octaves'];
// ns3-mapping.js: ns3ArpeggiatorPatternMap
const ARP_PATTERN = ['Up', 'Down', 'Up/Down', 'Random'];

// ns3-mapping.js: ns3SynthLfoRateMap (128 entries, 0.03 Hz – 523 Hz)
const LFO_RATE: readonly string[] = [
  '0.03 Hz','0.03 Hz','0.03 Hz','0.04 Hz','0.04 Hz','0.04 Hz','0.05 Hz','0.05 Hz',
  '0.05 Hz','0.06 Hz','0.06 Hz','0.07 Hz','0.07 Hz','0.08 Hz','0.09 Hz','0.09 Hz',
  '0.10 Hz','0.11 Hz','0.12 Hz','0.13 Hz','0.14 Hz','0.15 Hz','0.16 Hz','0.17 Hz',
  '0.19 Hz','0.20 Hz','0.22 Hz','0.24 Hz','0.26 Hz','0.28 Hz','0.30 Hz','0.32 Hz',
  '0.35 Hz','0.38 Hz','0.41 Hz','0.44 Hz','0.47 Hz','0.51 Hz','0.55 Hz','0.60 Hz',
  '0.64 Hz','0.70 Hz','0.75 Hz','0.81 Hz','0.88 Hz','0.95 Hz','1.0 Hz','1.1 Hz',
  '1.2 Hz','1.3 Hz','1.4 Hz','1.5 Hz','1.6 Hz','1.8 Hz','1.9 Hz','2.0 Hz',
  '2.2 Hz','2.4 Hz','2.6 Hz','2.8 Hz','3.0 Hz','3.2 Hz','3.5 Hz','3.8 Hz',
  '4.1 Hz','4.4 Hz','4.8 Hz','5.2 Hz','5.6 Hz','6.0 Hz','6.5 Hz','7.0 Hz',
  '7.6 Hz','8.2 Hz','8.8 Hz','9.5 Hz','10 Hz','11 Hz','12 Hz','13 Hz',
  '14 Hz','15 Hz','16 Hz','18 Hz','19 Hz','21 Hz','22 Hz','24 Hz',
  '26 Hz','28 Hz','30 Hz','33 Hz','35 Hz','38 Hz','41 Hz','45 Hz',
  '48 Hz','52 Hz','56 Hz','61 Hz','65 Hz','71 Hz','76 Hz','82 Hz',
  '89 Hz','96 Hz','104 Hz','112 Hz','121 Hz','131 Hz','141 Hz','153 Hz',
  '165 Hz','178 Hz','192 Hz','208 Hz','224 Hz','242 Hz','262 Hz','283 Hz',
  '305 Hz','330 Hz','356 Hz','385 Hz','415 Hz','449 Hz','484 Hz','523 Hz',
];

// ns3-mapping.js: ns3SynthLfoRateMasterClockDivisionMap (128 entries)
const LFO_RATE_MC: readonly string[] = [
  '4/1','4/1','4/1','4/1','4/1','4/1','4/1','4/1',
  '4/1T','4/1T','4/1T','4/1T','4/1T','4/1T','4/1T','4/1T',
  '2/1','2/1','2/1','2/1','2/1','2/1','2/1',
  '2/1T','2/1T','2/1T','2/1T','2/1T','2/1T','2/1T','2/1T',
  '1/1','1/1','1/1','1/1','1/1','1/1','1/1','1/1',
  '1/1T','1/1T','1/1T','1/1T','1/1T','1/1T','1/1T','1/1T',
  '1/2','1/2','1/2','1/2','1/2','1/2','1/2',
  '1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T',
  '1/4','1/4','1/4','1/4','1/4','1/4','1/4',
  '1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T',
  '1/8','1/8','1/8','1/8','1/8','1/8','1/8',
  '1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T',
  '1/16','1/16','1/16','1/16','1/16','1/16','1/16',
  '1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T',
  '1/32','1/32','1/32','1/32','1/32','1/32','1/32',
  '1/32T','1/32T','1/32T','1/32T','1/32T','1/32T','1/32T','1/32T',
];

// ns3-mapping.js: ns3SynthEnvAttackMap (128 entries, 0.5 ms – 45 s)
const ENV_ATTACK: readonly string[] = [
  '0.5 ms','0.6 ms','0.7 ms','0.9 ms','1.1 ms','1.3 ms','1.5 ms','1.8 ms',
  '2.1 ms','2.5 ms','3.0 ms','3.5 ms','4.0 ms','4.7 ms','5.5 ms','6.3 ms',
  '7.3 ms','8.4 ms','9.7 ms','11 ms','13 ms','14 ms','16 ms','19 ms',
  '21 ms','24 ms','27 ms','31 ms','34 ms','39 ms','43 ms','49 ms',
  '54 ms','61 ms','68 ms','75 ms','84 ms','93 ms','103 ms','114 ms',
  '126 ms','139 ms','153 ms','169 ms','186 ms','204 ms','224 ms','246 ms',
  '269 ms','295 ms','322 ms','352 ms','384 ms','419 ms','456 ms','496 ms',
  '540 ms','586 ms','636 ms','690 ms','748 ms','810 ms','876 ms','947 ms',
  '1.02 s','1.10 s','1.19 s','1.28 s','1.38 s','1.49 s','1.60 s','1.72 s',
  '1.85 s','1.99 s','2.13 s','2.28 s','2.45 s','2.62 s','2.81 s','3.00 s',
  '3.21 s','3.43 s','3.66 s','3.91 s','4.17 s','4.45 s','4.74 s','5.05 s',
  '5.37 s','5.72 s','6.08 s','6.47 s','6.87 s','7.30 s','7.75 s','8.22 s',
  '8.72 s','9.25 s','9.80 s','10 s','11 s','12 s','12 s','13 s',
  '14 s','15 s','15 s','16 s','17 s','18 s','19 s','20 s',
  '21 s','22 s','24 s','25 s','26 s','27 s','29 s','30 s',
  '31 s','33 s','35 s','37 s','39 s','41 s','43 s','45 s',
];

// ns3-mapping.js: ns3SynthEnvDecayOrReleaseMap (128 entries, 3.0 ms – 45 s)
const ENV_DECAY_REL: readonly string[] = [
  '3.0 ms','3.5 ms','4.0 ms','4.6 ms','5.3 ms','6.0 ms','6.9 ms','7.9 ms',
  '9.0 ms','10 ms','12 ms','13 ms','15 ms','17 ms','19 ms','21 ms',
  '23 ms','26 ms','29 ms','33 ms','36 ms','41 ms','45 ms','50 ms',
  '55 ms','61 ms','68 ms','75 ms','82 ms','91 ms','100 ms','110 ms',
  '120 ms','132 ms','144 ms','158 ms','173 ms','188 ms','206 ms','224 ms',
  '244 ms','265 ms','288 ms','313 ms','340 ms','368 ms','399 ms','432 ms',
  '467 ms','505 ms','545 ms','588 ms','634 ms','683 ms','736 ms','792 ms',
  '851 ms','915 ms','983 ms','1.05 s','1.13 s','1.21 s','1.30 s','1.39 s',
  '1.49 s','1.59 s','1.70 s','1.82 s','1.94 s','2.07 s','2.21 s','2.36 s',
  '2.51 s','2.67 s','2.85 s','3.03 s','3.22 s','3.42 s','3.64 s','3.86 s',
  '4.10 s','4.35 s','4.61 s','4.89 s','5.18 s','5.49 s','5.81 s','6.15 s',
  '6.50 s','6.88 s','7.27 s','7.68 s','8.11 s','8.57 s','9.04 s','9.54 s',
  '10 s','11 s','11 s','12 s','12 s','13 s','14 s','14 s',
  '15 s','16 s','17 s','18 s','19 s','20 s','20 s','22 s',
  '23 s','24 s','25 s','26 s','27 s','29 s','30 s','31 s',
  '33 s','34 s','36 s','38 s','39 s','41 s','43 s','45 s',
];

// ns3-mapping.js: ns3SynthArpMasterClockDivisionMap (128 entries)
const ARP_RATE_MC: readonly string[] = [
  '1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2','1/2',
  '1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T','1/2T',
  '1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4','1/4',
  '1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T','1/4T',
  '1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8','1/8',
  '1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T','1/8T',
  '1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16','1/16',
  '1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T','1/16T',
  '1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32','1/32',
];

import { NORD_DB } from '../clavia/volume';
import { NS3_FILTER_FREQ } from './filter-freq';

const u8  = (b: Uint8Array, o: number): number => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number): number => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
// 64-bit big-endian read as BigInt — sampleId hashes span a 64-bit field.
const u64 = (b: Uint8Array, o: number): bigint => {
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[o + i] ?? 0);
  return v;
};
const lut = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Engine volume shares the enable word: bits 10-4 are the 7-bit level → dB.
const vol = (b: Uint8Array, o: number): string => NORD_DB[(u16(b, o) & 0x07f0) >>> 4] ?? '?';
// Linear 0-10 in 1 decimal place
const lin10 = (midi: number): string => (midi / 12.7).toFixed(1);

export interface Ns3Fx { name: string; type?: string; params?: Record<string, string | number> }

/**
 * The 9 organ drawbar positions (0-8) from a drawbar block base `o` — masks per
 * ns3-organ.js `getDrawbars`. The same layout serves both presets (preset 1 at
 * 0xBE, preset 2 at 0xD9). (B3 reads them straight; Vox/Farfisa relabel for display.)
 */
function readDrawbars(b: Uint8Array, o: number): number[] {
  return [
    (u8(b, o) & 0xf0) >>> 4,         // 0xBE
    (u8(b, o + 2) & 0x1e) >>> 1,     // 0xC0
    (u16(b, o + 4) & 0x03c0) >>> 6,  // 0xC2
    (u8(b, o + 7) & 0x78) >>> 3,     // 0xC5
    u8(b, o + 9) & 0x0f,             // 0xC7
    (u16(b, o + 11) & 0x01e0) >>> 5, // 0xC9
    (u8(b, o + 14) & 0x3c) >>> 2,    // 0xCC
    (u16(b, o + 16) & 0x0780) >>> 7, // 0xCE
    (u8(b, o + 19) & 0xf0) >>> 4,    // 0xD1
  ];
}

// ── Waveform name per osc type ───────────────────────────────────────────────
// ns3-synth.js: waveForm1 switch on oscillatorType
function oscWaveform(oscType: string, eW: number): string {
  switch (oscType) {
    case 'Classic': return lut(OSC_CLASSIC_WAVE, (eW & 0x01c0) >>> 6);
    case 'Wave':    return lut([], (eW & 0x0fc0) >>> 6); // 46 entries — just return index for now
    case 'Formant': return lut(OSC_FORMANT_WAVE, (eW & 0x03c0) >>> 6);
    case 'Super':   return lut(OSC_SUPER_WAVE, (eW & 0x01c0) >>> 6);
    default:        return '';
  }
}

// ── Synth waveform index for Wave OSC (ns3-synth-oscillators docs show 46 entries) ──
function waveWaveformLabel(idx: number): string {
  const WAVE_WAVE = [
    'Wave 2nd Harm','Wave 3rd Harm','Wave 4th Harm','Wave 5th Harm','Wave 6th Harm',
    'Wave 7th Harm','Wave 8th Harm','Wave Organ 1','Wave Organ 2','Wave Principal',
    'Wave Flute 1','Wave Flute 2','Wave Clarinet 1','Wave Clarinet 2','Wave Alto Sax',
    'Wave Tenor Sax','Wave 2nd Spectra','Wave 3rd Spectra','Wave 4th Spectra','Wave 5th Spectra',
    'Wave 6th Spectra','Wave 7th Spectra','Wave 8th Spectra','Wave Saw Random','Wave Saw Bright',
    'Wave Sqr Bright','Wave Saw NoFund','Wave EPiano 1','Wave EPiano 2','Wave EPiano 3',
    'Wave DX 1','Wave DX 2','Wave Full Tines','Wave Ac Piano','Wave Ice 1','Wave Ice 2',
    'Wave Clavinet 1','Wave Clavinet 2','Wave Clavinet 3','Wave Triplets','Wave Bell',
    'Wave Bar 1','Wave Bar 2','Wave Tines','Wave Marimba','Wave Tubular Bells',
  ];
  return WAVE_WAVE[idx] ?? `#${idx}`;
}

export interface Ns3SynthOscillator {
  /** Oscillator type: Classic / Wave / Formant / Super / Sample. ns3-synth.js 0x8D(b1-0)+0x8E(b7). */
  type: string;
  /** Waveform name for the osc type (blank for Sample). */
  waveform: string;
  /** Dual-osc configuration mode. ns3-synth.js 0x8F(b4-1). */
  config: string;
  /** Osc 2 pitch offset in semitones (−12=Sub … +48). ns3-synth.js 0x8F(b0)+0x90(b7-3). */
  pitch: string;
}

export interface Ns3SynthEnv {
  /** Attack time. */
  attack: string;
  /** Decay time ("Sustain" at max for mod env). */
  decay: string;
  /** Release time ("Inf" at max for mod env release). */
  release: string;
}

export interface Ns3SynthFilter {
  /** Filter type. ns3-synth-filter.js 0x98(b4-2). */
  type: string;
  /** Cutoff frequency. 0x98(b1-0)+0x99(b7-3). */
  cutoff: string;
  /** Resonance (or HP freq for LP+HP mode). 0x9C(b2-0)+0x9D(b7-4). */
  resonance: string;
  /** Filter keyboard tracking. 0xA5(b5-4). */
  kbTrack: string;
  /** Filter drive. 0xA5(b3-2). */
  drive: string;
}

export interface Ns3SynthLfo {
  /** LFO waveform. ns3-synth.js 0x86(b2-0). */
  wave: string;
  /** LFO rate (Hz or master-clock division). 0x87(b6-0). */
  rate: string;
  /** Whether rate is synced to master clock. 0x87(b7). */
  masterClock: boolean;
}

export interface Ns3SynthArp {
  /** Arpeggiator enabled. ns3-synth.js 0x80(b6). */
  on: boolean;
  /** Octave range. 0x80(b4-3). */
  range: string;
  /** Pattern direction. 0x80(b2-1). */
  pattern: string;
  /** Rate (bpm or master-clock division). 0x81(b7-1). */
  rate: string;
  /** Whether rate is synced to master clock. 0x80(b0). */
  masterClock: boolean;
}

export interface Ns3Synth {
  on: boolean;
  volume: string;
  /** Poly/Legato/Mono. ns3-synth.js 0x84(b0)+0x85(b7). */
  voice: string;
  /** Glide 0-10. 0x85(b6-0). */
  glide: string;
  /** Unison Off/1/2/3. 0x86(b7-6). */
  unison: string;
  /** Vibrato mode. 0x86(b5-3). */
  vibrato: string;
  oscillator: Ns3SynthOscillator;
  filter: Ns3SynthFilter;
  lfo: Ns3SynthLfo;
  envMod: Ns3SynthEnv;
  envAmp: Ns3SynthEnv & { velocity: string };
  arp: Ns3SynthArp;
  /** Factory sample reference (only meaningful when osc === 'Sample'). */
  sampleId: number;
  // ── preserved from v1 for UI compat ──
  osc: string;
  cutoff: string;
  filter_type: string;
}

export interface Ns3Panel {
  id: 'A' | 'B';
  organ: {
    on: boolean; type: string; volume: string; drawbars: number[];
    /** Octave shift −2..+2. ns3-organ.js 0xBA(b3-0). */
    octaveShift: number;
    /** Vibrato/Chorus (B3): on + mode (V1/C1/V2/…). */
    vibChorus: { on: boolean; mode: string };
    /** Percussion (B3): on + 3rd-harmonic / fast-decay / soft-volume flags. */
    percussion: { on: boolean; third: boolean; fast: boolean; soft: boolean };
  };
  piano: {
    on: boolean; type: string; volume: string;
    /** Factory sample reference: 32-bit hash + clavinet/harpsichord variant. Resolve via library/service. */
    sampleId: number; sampleVariation: number;
    /** Piano timbre (soft/neutral/bright). ns3-piano.js 0x4E(b5-3). */
    timbre: string;
    /** Octave shift −2..+2. 0x56(b3-0) on piano panel (shared with synth offset word). */
    octaveShift: number;
  };
  synth: Ns3Synth;
  /** Effects switched on in this panel, in signal order. */
  fx: Ns3Fx[];
}

// ── FX parameter reads ────────────────────────────────────────────────────────
// All offsets from ns3-fx-*.js (Chris55/ns3-program-viewer)
/** The effects this panel has switched on, with type and parameters. */
function readFx(b: Uint8Array, base: number): Ns3Fx[] {
  const fx: Ns3Fx[] = [];

  // Rotary Speaker — ns3-fx-rotary-speaker.js: enabled 0x10B(b7), speed 0x34(b0)
  if ((u8(b, base + 0x10b) & 0x80) !== 0) {
    fx.push({
      name: 'Rotary',
      params: { speed: (u8(b, base + 0x34) & 0x01) !== 0 ? 'Fast' : 'Slow' },
    });
  }

  // Effect 1 — ns3-fx-multi-effect-1.js: enabled 0x10B(b4), type 0x10B(b1-0)+0x10C(b7)
  if ((u8(b, base + 0x10b) & 0x10) !== 0) {
    const type = lut(EFFECT1_TYPE, (u16(b, base + 0x10b) & 0x0380) >>> 7);
    // rate 0x10C(b5-0)+0x10D(b7): 7 bits; amount 0x110(b6-0): 7 bits
    const rateMidi = (u16(b, base + 0x10c) & 0x1fc0) >>> 6;  // (u8@0x10C & 0x3F)<<1 | b@0x10D>>7
    const amountMidi = u8(b, base + 0x110) & 0x7f;
    fx.push({ name: 'Effect 1', type, params: { rate: rateMidi, amount: lin10(amountMidi) } });
  }

  // Effect 2 — ns3-fx-multi-effect-2.js: enabled 0x114(b7), type 0x114(b4-2)
  if ((u8(b, base + 0x114) & 0x80) !== 0) {
    const type = lut(EFFECT2_TYPE, (u8(b, base + 0x114) & 0x1c) >>> 2);
    // rate 0x114(b1-0)+0x115(b7-3): 7 bits; amount 0x115(b2-0)+0x116(b7-4): 7 bits
    const rateMidi = (u16(b, base + 0x114) & 0x0180) >>> 1 | (u8(b, base + 0x115) & 0xf8) >>> 3;
    const amountMidi = ((u8(b, base + 0x115) & 0x07) << 4) | (u8(b, base + 0x116) & 0xf0) >>> 4;
    fx.push({ name: 'Effect 2', type, params: { rate: rateMidi, amount: lin10(amountMidi) } });
  }

  // Amp/EQ — ns3-fx-amp-sim-eq.js: enabled 0x129(b2), type 0x12A(b7-5)
  if ((u8(b, base + 0x129) & 0x04) !== 0) {
    const AMP_TYPE = ['JC','Small','Twin','Bright','Mean'];
    const type = lut(AMP_TYPE, (u8(b, base + 0x12a) & 0xe0) >>> 5);
    // treble 0x12A(b4-0)+0x12B(b7-6): 7 bits; bass 0x12C(b6-0): 7 bits; mid 0x12B(b5-0)+0x12C(b7): 7 bits
    const trebleMidi = ((u8(b, base + 0x12a) & 0x1f) << 2) | (u8(b, base + 0x12b) & 0xc0) >>> 6;
    const midMidi = ((u8(b, base + 0x12b) & 0x3f) << 1) | (u8(b, base + 0x12c) & 0x80) >>> 7;
    const bassMidi = u8(b, base + 0x12c) & 0x7f;
    fx.push({ name: 'Amp/EQ', type, params: { treble: trebleMidi, mid: midMidi, bass: bassMidi } });
  }

  // Compressor — ns3-fx-compressor.js: enabled 0x139(b5), amount 0x139(b4-0)+0x13A(b7-6): 7 bits
  if ((u8(b, base + 0x139) & 0x20) !== 0) {
    const amountMidi = ((u8(b, base + 0x139) & 0x1f) << 2) | (u8(b, base + 0x13a) & 0xc0) >>> 6;
    fx.push({ name: 'Comp', params: { amount: lin10(amountMidi) } });
  }

  // Delay — ns3-fx-delay.js: enabled 0x119(b3), masterClock 0x119(b0)
  if ((u8(b, base + 0x119) & 0x08) !== 0) {
    // feedback 0x125(b2-0)+0x126(b7-4): 7 bits; mix 0x121(b4-0)+0x122(b7-6): 7 bits
    const feedbackMidi = ((u8(b, base + 0x125) & 0x07) << 4) | (u8(b, base + 0x126) & 0xf0) >>> 4;
    const mixMidi = ((u8(b, base + 0x121) & 0x1f) << 2) | (u8(b, base + 0x122) & 0xc0) >>> 6;
    fx.push({ name: 'Delay', params: { feedback: lin10(feedbackMidi), mix: lin10(mixMidi) } });
  }

  // Reverb — ns3-fx-reverb.js: enabled 0x134(b1), type 0x134(b0)+0x135(b7-6): 3 bits
  if ((u8(b, base + 0x134) & 0x02) !== 0) {
    const type = lut(REVERB_TYPE, (u16(b, base + 0x134) & 0x01c0) >>> 6);
    // amount 0x135(b4-0)+0x136(b7-6): 7 bits
    const amountMidi = ((u8(b, base + 0x135) & 0x1f) << 2) | (u8(b, base + 0x136) & 0xc0) >>> 6;
    fx.push({ name: 'Reverb', type, params: { amount: lin10(amountMidi) } });
  }

  return fx;
}

export interface Ns3Program {
  /** The active panels (A and/or B), per the 0x31 panel-enable flag. */
  panels: Ns3Panel[];
  /** Program name, decoded from the name block (up to 16 ASCII chars). */
  name?: string;
}

/**
 * Decode the organ engine, reading the **active preset's** drawbar + vib/percussion
 * blocks. Preset 2 (enabled @0xBB.b2) mirrors preset 1's layout, shifted: drawbars
 * 0xBE→0xD9, vib/percussion enable byte 0xD3→0xEE (the vib/chorus *mode* @0x34 is a
 * shared global). Preset-1 files are unaffected (the common, validated path).
 */
function organ(b: Uint8Array, base: number): Ns3Panel['organ'] {
  const preset2 = (u8(b, base + 0xbb) & 0x04) !== 0;
  const drawbarBase = base + (preset2 ? 0xd9 : 0xbe);
  const pb = base + (preset2 ? 0xee : 0xd3); // percussion/vib enable byte
  // Octave shift: ns3-organ.js 0xBA(b3-0) — 4-bit raw, center=6 (range ±2), shift = raw − 6.
  const octRaw = u8(b, base + 0xba) & 0x0f;
  const octaveShift = octRaw - 6; // 4→-2, 6→0, 8→+2
  return {
    on: (u16(b, base + 0xb6) & 0x8000) !== 0,
    type: lut(ORGAN_TYPE, (u8(b, base + 0xbb) & 0x70) >>> 4),
    volume: vol(b, base + 0xb6),
    drawbars: readDrawbars(b, drawbarBase),
    octaveShift,
    vibChorus: { on: (u8(b, pb) & 0x10) !== 0, mode: lut(VIB_CHORUS, (u8(b, base + 0x34) & 0x0e) >>> 1) },
    percussion: {
      on: (u8(b, pb) & 0x08) !== 0,
      third: (u8(b, pb) & 0x04) !== 0,
      fast: (u8(b, pb) & 0x02) !== 0,
      soft: (u8(b, pb) & 0x01) !== 0,
    },
  };
}

/**
 * Piano timbre — ns3-piano.js: ns3PianoTimbreMap (0x4E bits 5-3).
 * The raw 3-bit value maps to per-type label arrays (index 0 = None):
 *   Grand/Upright/Digital/Misc: None, Soft, Mid, Bright
 *   Electric:                   None, Soft, Mid, Bright, Dyno1, Dyno2
 *   Clav:                       None, Soft, Treble, Soft+Treble, Brilliant, Soft+Brill, Treble+Brill, Soft+Trb+Brill
 * We resolve per-type using PIANO_TYPE index; fall back to Grand labels for unknown types.
 */
function pianoTimbre(typeIdx: number, timbreRaw: number): string {
  // Grand=0, Upright=1, Electric=2, Clav=3, Digital=4, Misc=5
  const GRAND   = ['None', 'Soft', 'Mid', 'Bright', 'None', 'None', 'None', 'None'];
  const ELECTRIC = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2', 'None', 'None'];
  const CLAV    = ['None', 'Soft', 'Treble', 'Soft+Treble', 'Brilliant', 'Soft+Brill', 'Treble+Brill', 'Soft+Trb+Brill'];
  if (typeIdx === 2) return ELECTRIC[timbreRaw] ?? 'None';
  if (typeIdx === 3) return CLAV[timbreRaw] ?? 'None';
  return GRAND[timbreRaw] ?? 'None';
}

function piano(b: Uint8Array, base: number): Ns3Panel['piano'] {
  // timbre: 0x4E(b5-3), 3 bits — ns3-piano.js ns3PianoTimbreMap
  const timbreRaw = (u8(b, base + 0x4e) & 0x38) >>> 3;
  const typeIdx = (u8(b, base + 0x48) & 0x38) >>> 3;
  // Piano octave shift: ns3-piano.js 0x47(b3-0), center=6, shift = raw − 6.
  const octRaw = u8(b, base + 0x47) & 0x0f;
  const octaveShift = octRaw - 6;
  return {
    on: (u16(b, base + 0x43) & 0x8000) !== 0,
    type: lut(PIANO_TYPE, typeIdx),
    volume: vol(b, base + 0x43),
    sampleId: Number((u64(b, base + 0x49) & 0x0ffffffff0000000n) >> 28n),
    sampleVariation: (u8(b, base + 0x49) & 0x30) >>> 4,
    timbre: pianoTimbre(typeIdx, timbreRaw),
    octaveShift,
  };
}

/**
 * Decode the full Synth engine.
 * All offsets from ns3-synth.js and ns3-synth-filter.js (Chris55/ns3-program-viewer).
 */
function synth(b: Uint8Array, base: number): Ns3Synth {
  // ── oscillator ───────────────────────────────────────────────────────────
  // Osc type: 0x8D(b1-0)+0x8E(b7) — ns3-synth.js
  const o8dW = u16(b, base + 0x8d);
  const o8eW = u16(b, base + 0x8e);
  const o8fW = u16(b, base + 0x8f);
  const oscType = lut(SYNTH_OSC, (o8dW & 0x0380) >>> 7);
  // Osc config: 0x8F(b4-1) — ns3-synth.js
  const oscConfigIdx = (u8(b, base + 0x8f) & 0x1e) >>> 1;
  // Osc 2 pitch: 0x8F(b0)+0x90(b7-3) = 6 bits, value -12..+48 (raw-12) — ns3-synth.js
  const osc2PitchRaw = (o8fW & 0x01f8) >>> 3;
  const osc2Pitch = osc2PitchRaw - 12;
  const pitchStr = osc2Pitch === -12 ? 'Sub' : `${osc2Pitch > 0 ? '+' : ''}${osc2Pitch} semi`;
  // Waveform name depends on osc type
  let waveform = '';
  if (oscType === 'Wave') {
    waveform = waveWaveformLabel((o8eW & 0x0fc0) >>> 6);
  } else {
    waveform = oscWaveform(oscType, o8eW);
  }

  // ── filter ───────────────────────────────────────────────────────────────
  // ns3-synth-filter.js
  const o98 = u8(b, base + 0x98);
  const o98W = u16(b, base + 0x98);
  const o9cW = u16(b, base + 0x9c);
  const oA5W = u16(b, base + 0xa5);
  const filterTypeIdx = (o98 & 0x1c) >>> 2;
  const filterTypeStr = lut(SYNTH_FILTER, filterTypeIdx);
  const filterCutoffMidi = (o98W & 0x03f8) >>> 3;
  const filterResFreqMidi = (o9cW & 0x07f0) >>> 4;
  const kbTrackIdx = (oA5W & 0x3000) >>> 12;
  const driveIdx = (oA5W & 0x0c00) >>> 10;
  // Resonance: for LP+HP, this field is HP cutoff freq; otherwise resonance 0-10
  const resStr = filterTypeStr === 'LP+HP'
    ? lut(NS3_FILTER_FREQ, filterResFreqMidi)
    : lin10(filterResFreqMidi);

  // ── LFO ──────────────────────────────────────────────────────────────────
  // ns3-synth.js: lfoWave 0x86(b2-0), lfoRate 0x87(b6-0), lfoMC 0x87(b7)
  const o86 = u8(b, base + 0x86);
  const o87 = u8(b, base + 0x87);
  const lfoRateMidi = o87 & 0x7f;
  const lfoMC = (o87 & 0x80) !== 0;

  // ── Envelopes ────────────────────────────────────────────────────────────
  // ns3-synth.js
  // Mod env: attack 0x8B(b7-1)=7bits, decay 0x8B(b0)+0x8C(b7-2)=7bits, release 0x8C(b1-0)+0x8D(b7-3)=7bits
  const o8bW = u16(b, base + 0x8b);
  const o8cW = u16(b, base + 0x8c);
  const modAttackMidi = (o8bW & 0xfe00) >>> 9;
  const modDecayMidi = (o8bW & 0x01fc) >>> 2;
  const modReleaseMidi = (o8cW & 0x03f8) >>> 3;
  // Amp env: attack 0xA5(b1-0)+0xA6(b7-3), decay 0xA6(b2-0)+0xA7(b7-4), release 0xA7(b3-0)+0xA8(b7-5)
  const oA5WA = u16(b, base + 0xa5);
  const oA6W = u16(b, base + 0xa6);
  const oA7W = u16(b, base + 0xa7);
  const oA8 = u8(b, base + 0xa8);
  const ampAttackMidi = (oA5WA & 0x03f8) >>> 3;
  const ampDecayMidi = (oA6W & 0x07f0) >>> 4;
  const ampReleaseMidi = (oA7W & 0x0fe0) >>> 5;
  // Amp velocity: 0xA8(b4-3) — ns3-synth.js synthOffsetA8 & 0x18) >>> 3
  const ampVelocityIdx = (oA8 & 0x18) >>> 3;

  // ── Voice / Glide / Unison / Vibrato ─────────────────────────────────────
  // ns3-synth.js
  // voice: 0x84(b0)+0x85(b7) = (u16@0x84 & 0x0180) >>> 7; glide: 0x85(b6-0) = u16@0x84 & 0x007f
  const o84W = u16(b, base + 0x84);
  const voiceIdx = (o84W & 0x0180) >>> 7;
  const glideMidi = o84W & 0x007f;
  const unisonIdx = (o86 & 0xc0) >>> 6;
  const vibratoIdx = (o86 & 0x38) >>> 3;

  // ── Arpeggiator ──────────────────────────────────────────────────────────
  // ns3-synth.js: 0x80(b6)=enable, 0x80(b4-3)=range, 0x80(b2-1)=pattern, 0x80(b0)=masterClock
  // rate: 0x81(b7-1) = 7bits
  const o80 = u8(b, base + 0x80);
  const o81 = u8(b, base + 0x81);
  const arpOn = (o80 & 0x40) !== 0;
  const arpRangeIdx = (o80 & 0x18) >>> 3;
  const arpPatternIdx = (o80 & 0x06) >>> 1;
  const arpMC = (o80 & 0x01) !== 0;
  const arpRateMidi = (o81 & 0xfe) >>> 1;

  // ── Sample ID ─────────────────────────────────────────────────────────────
  const sampleId = Number((u64(b, base + 0xa5) & 0x07fffffff8n) >> 3n);

  return {
    on: (u16(b, base + 0x52) & 0x8000) !== 0,
    volume: vol(b, base + 0x52),
    voice: lut(SYNTH_VOICE, voiceIdx),
    glide: lin10(glideMidi),
    unison: lut(SYNTH_UNISON, unisonIdx),
    vibrato: lut(SYNTH_VIBRATO, vibratoIdx),
    oscillator: {
      type: oscType,
      waveform,
      config: lut(OSC_CONFIG, oscConfigIdx),
      pitch: pitchStr,
    },
    filter: {
      type: filterTypeStr,
      cutoff: lut(NS3_FILTER_FREQ, filterCutoffMidi),
      resonance: resStr,
      kbTrack: lut(FILTER_KB_TRACK, kbTrackIdx),
      drive: lut(FILTER_DRIVE, driveIdx),
    },
    lfo: {
      wave: lut(LFO_WAVE, o86 & 0x07),
      rate: lfoMC ? lut(LFO_RATE_MC, lfoRateMidi) : lut(LFO_RATE, lfoRateMidi),
      masterClock: lfoMC,
    },
    envMod: {
      attack: lut(ENV_ATTACK, modAttackMidi),
      decay: modDecayMidi === 127 ? 'Sustain' : lut(ENV_DECAY_REL, modDecayMidi),
      release: modReleaseMidi === 127 ? 'Inf' : lut(ENV_DECAY_REL, modReleaseMidi),
    },
    envAmp: {
      attack: lut(ENV_ATTACK, ampAttackMidi),
      decay: ampDecayMidi === 127 ? 'Sustain' : lut(ENV_DECAY_REL, ampDecayMidi),
      release: lut(ENV_DECAY_REL, ampReleaseMidi),
      velocity: lut(AMP_VELOCITY, ampVelocityIdx),
    },
    arp: {
      on: arpOn,
      range: lut(ARP_RANGE, arpRangeIdx),
      pattern: lut(ARP_PATTERN, arpPatternIdx),
      rate: arpMC ? lut(ARP_RATE_MC, arpRateMidi) : lut([], arpRateMidi),
      masterClock: arpMC,
    },
    sampleId,
    // v1-compat aliases
    osc: oscType,
    filter_type: filterTypeStr,
    cutoff: lut(NS3_FILTER_FREQ, filterCutoffMidi),
  };
}

function readPanel(b: Uint8Array, id: 'A' | 'B', base: number): Ns3Panel {
  return {
    id,
    piano: piano(b, base),
    organ: organ(b, base),
    synth: synth(b, base),
    fx: readFx(b, base),
  };
}

/** Decode a Stage 3 `.ns3f` into its active panel(s). */
export function decodeNs3(bytes: Uint8Array): Ns3Program {
  // versionOffset shifts the whole map for pre-NSM (header type 0) exports; the
  // common NSM-era files (our .ns3f, format-type 1) use 0. (-20 for older — TODO.)
  const versionOffset = 0;
  // 0x31 bits 6-5: 0 = panel A only, 1 = panel B only, 2 = both.
  const flag = (u8(bytes, 0x31 + versionOffset) & 0x60) >>> 5;
  const panels: Ns3Panel[] = [];
  if (flag === 0 || flag === 2) panels.push(readPanel(bytes, 'A', 0 * PANEL_STRIDE + versionOffset));
  if (flag === 1 || flag === 2) panels.push(readPanel(bytes, 'B', 1 * PANEL_STRIDE + versionOffset));

  // Program name is stored at a fixed offset outside the panel area.
  // ns3-program.js reads it from bytes 0x10 onward (16 bytes), null-terminated.
  // For now we don't emit it (it lives in the CBIN header layer).
  return { panels };
}
