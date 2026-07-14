/**
 * Nord Stage 2 / 2EX (`.ns2p`) program decoder — Tier 2 of multi-model support (#22).
 *
 * NS2 stores two **slots** (A then B); slot B repeats slot A's fields shifted by
 * `SLOT_STRIDE` (the 0xf9 = 249 magic). A header-type byte at 0x04 distinguishes
 * the NSM-era layout (1) from the older **legacy** layout (anything else), which
 * lacks a 20-byte CRC block — so every body offset shifts back by `versionOffset`
 * (-20). All offsets/masks are transcribed **field-for-field from ns3-program-viewer**
 * (the oracle — https://github.com/Chris55/ns3-program-viewer, GPLv3).
 * Oracle modules: `src/server/ns2/program/ns2-{program,organ,piano,synth,
 * synth-filter,fx-multi-effect-1,fx-multi-effect-2,fx-amp-sim-eq,fx-delay,
 * fx-reverb,fx-compressor,fx-rotary-speaker}.js`.
 * Credit: Chris55 (ATTRIBUTION.md, AGPL-compatible).
 *
 * Oracle cross-check: 0 mismatches on 2 Stage-2 fixture files (see decode.test.ts).
 */
const SLOT_STRIDE = 249; // slot B = slot A + 0xf9 (oracle: ns2-program.js)

// ── Type tables — identical to ns3-program-viewer's ns2-mapping.js ────────────

const PIANO_TYPE = ['Grand', 'Upright', 'E Piano 1', 'E Piano 2', 'Clavinet', 'Harpsi'];
/** Organ models, in decode order — also reused by ns2/view.ts for the model selector. */
export const ORGAN_TYPE = ['B3', 'Vox', 'Farfisa'];
const SYNTH_OSC = ['TRI', 'SAW', 'SQR', 'SAMPLE', 'FM', 'WAVE'];
const SYNTH_VOICE = ['Off', 'Legato', 'Mono'];
const SYNTH_UNISON = ['Off', '1', '2', '3', 'Multi 1', 'Multi 2', 'Multi 3'];
const SYNTH_VIBRATO = ['Off', 'Delay 1', 'Delay 2', 'Delay 3', 'AT', 'Wheel'];
const LFO_WAVE = ['SQUARE', 'SAW', 'TRI', 'S/H'];
const FILTER_TYPE = ['LP12', 'LP24', 'HP', 'NOTCH', 'BP'];
const VIB_CHORUS = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'];
const VOX_VIB_MODE = ['Less (V1)', 'More (V2)', 'Original (V3)'];
const FARFISA_VIB_MODE = [
  'Light/Slow (V1)',
  'Light/Fast (V2)',
  'Heavy/Slow (C2)',
  'Heavy/Fast (C3)',
];
const REVERB_TYPE = ['Room 1', 'Room 2', 'Stage 1', 'Stage 2', 'Hall 1', 'Hall 2'];
const AMP_TYPE = ['Off', 'Small', 'JC', 'Twin'];
const EFFECT1_TYPE = ['Panning', 'Tremolo', 'Ring Mod', 'Wah-Wah', 'Auto-Wah 1', 'Auto-Wah 2'];
const EFFECT2_TYPE = ['Phaser 1', 'Phaser 2', 'Flanger', 'Vibe', 'Chorus 1', 'Chorus 2'];
const EFFECT_SRC = ['Organ', 'Piano', 'Synth'];
const ROTARY_SPEED = ['Slow/Stop', 'Fast'];
const ARP_RANGE = ['1 Octave', '2 Octaves', '3 Octaves', '4 Octaves'];
const ARP_PATTERN = ['UP', 'DN', 'UP/DN', 'RANDOM'];
const PIANO_DETUNE = ['Off', '1', '2', '3', '4'];
const CLAV_MODEL = ['A', 'B', 'C', 'D'];
const CLAV_EQ = ['Off', 'Soft', 'Medium', 'Soft+Medium'];
const CLAV_EQ_HI = ['Off', 'Treble', 'Brilliant', 'Treble+Brilliant'];
const PIANO_DYNAMICS = ['0', '1', '2', '3'];
const KB_ZONE = ['LO', 'LO UP', 'UP', 'UP HI', 'HI', 'LO UP HI'];

// ── Envelope / LFO lookup tables (ns2-mapping.js) ─────────────────────────

const ENV_ATTACK: readonly string[] = [
  '0.5 ms',
  '0.6 ms',
  '0.7 ms',
  '0.9 ms',
  '1.1 ms',
  '1.3 ms',
  '1.5 ms',
  '1.8 ms',
  '2.1 ms',
  '2.5 ms',
  '3 ms',
  '3.5 ms',
  '4 ms',
  '4.7 ms',
  '5.5 ms',
  '6.3 ms',
  '7.3 ms',
  '8.4 ms',
  '9.7 ms',
  '11 ms',
  '13 ms',
  '14 ms',
  '16 ms',
  '19 ms',
  '21 ms',
  '24 ms',
  '27 ms',
  '31 ms',
  '34 ms',
  '39 ms',
  '43 ms',
  '49 ms',
  '54 ms',
  '61 ms',
  '68 ms',
  '75 ms',
  '84 ms',
  '93 ms',
  '103 ms',
  '114 ms',
  '126 ms',
  '139 ms',
  '153 ms',
  '169 ms',
  '186 ms',
  '204 ms',
  '224 ms',
  '246 ms',
  '269 ms',
  '295 ms',
  '322 ms',
  '352 ms',
  '384 ms',
  '419 ms',
  '456 ms',
  '496 ms',
  '540 ms',
  '586 ms',
  '636 ms',
  '690 ms',
  '748 ms',
  '810 ms',
  '876 ms',
  '947 ms',
  '1.02 s',
  '1.1 s',
  '1.19 s',
  '1.28 s',
  '1.38 s',
  '1.49 s',
  '1.6 s',
  '1.72 s',
  '1.85 s',
  '1.99 s',
  '2.13 s',
  '2.28 s',
  '2.45 s',
  '2.62 s',
  '2.81 s',
  '3 s',
  '3.21 s',
  '3.43 s',
  '3.66 s',
  '3.91 s',
  '4.17 s',
  '4.45 s',
  '4.74 s',
  '5.05 s',
  '5.37 s',
  '5.72 s',
  '6.08 s',
  '6.47 s',
  '6.87 s',
  '7.3 s',
  '7.75 s',
  '8.22 s',
  '8.72 s',
  '9.25 s',
  '9.8 s',
  '10 s',
  '11 s',
  '12 s',
  '12 s',
  '13 s',
  '14 s',
  '15 s',
  '15 s',
  '16 s',
  '17 s',
  '18 s',
  '19 s',
  '20 s',
  '21 s',
  '22 s',
  '24 s',
  '25 s',
  '26 s',
  '27 s',
  '29 s',
  '30 s',
  '32 s',
  '34 s',
  '35 s',
  '37 s',
  '39 s',
  '41 s',
  '43 s',
  '45 s',
];

// ns2SynthEnvDecayMap — used for mod.decay + mod.release AND amp.attack + amp.decay
const ENV_DECAY: readonly string[] = [
  '3.0 ms',
  '3.5 ms',
  '4.0 ms',
  '4.6 ms',
  '5.3 ms',
  '6.0 ms',
  '6.9 ms',
  '7.9 ms',
  '9.0 ms',
  '10 ms',
  '12 ms',
  '13 ms',
  '15 ms',
  '17 ms',
  '19 ms',
  '21 ms',
  '23 ms',
  '26 ms',
  '29 ms',
  '33 ms',
  '36 ms',
  '41 ms',
  '45 ms',
  '50 ms',
  '55 ms',
  '61 ms',
  '68 ms',
  '75 ms',
  '82 ms',
  '91 ms',
  '100 ms',
  '110 ms',
  '120 ms',
  '132 ms',
  '144 ms',
  '158 ms',
  '173 ms',
  '188 ms',
  '206 ms',
  '224 ms',
  '244 ms',
  '265 ms',
  '288 ms',
  '313 ms',
  '340 ms',
  '368 ms',
  '399 ms',
  '432 ms',
  '467 ms',
  '505 ms',
  '545 ms',
  '588 ms',
  '634 ms',
  '683 ms',
  '736 ms',
  '792 ms',
  '851 ms',
  '915 ms',
  '983 ms',
  '1050 s',
  '1.13 s',
  '1.21 s',
  '1.3 s',
  '1.39 s',
  '1.49 s',
  '1.59 s',
  '1.7 s',
  '1.82 s',
  '1.94 s',
  '2.07 s',
  '2.21 s',
  '2.35 s',
  '2.51 s',
  '2.67 s',
  '2.84 s',
  '3.02 s',
  '3.21 s',
  '3.41 s',
  '3.62 s',
  '3.85 s',
  '4.09 s',
  '4.34 s',
  '4.61 s',
  '4.89 s',
  '5.19 s',
  '5.51 s',
  '5.84 s',
  '6.19 s',
  '6.57 s',
  '6.96 s',
  '7.38 s',
  '7.82 s',
  '8.29 s',
  '8.78 s',
  '9.3 s',
  '9.85 s',
  '10 s',
  '11 s',
  '11 s',
  '12 s',
  '13 s',
  '14 s',
  '14 s',
  '15 s',
  '16 s',
  '17 s',
  '18 s',
  '19 s',
  '20 s',
  '21 s',
  '22 s',
  '24 s',
  '25 s',
  '27 s',
  '28 s',
  '30 s',
  '31 s',
  '33 s',
  '35 s',
  '37 s',
  '39 s',
  '41 s',
  '44 s',
  '46 s',
  '49 s',
  '52 s',
  '55 s',
  '58 s',
];

// ns2SynthEnvReleaseMap — used ONLY for amp.release
const ENV_RELEASE: readonly string[] = [
  '3.0 ms',
  '3.5 ms',
  '4.0 ms',
  '4.6 ms',
  '5.3 ms',
  '6.0 ms',
  '6.9 ms',
  '7.9 ms',
  '9.0 ms',
  '10 ms',
  '12 ms',
  '13 ms',
  '15 ms',
  '17 ms',
  '19 ms',
  '21 ms',
  '23 ms',
  '26 ms',
  '29 ms',
  '33 ms',
  '36 ms',
  '41 ms',
  '45 ms',
  '50 ms',
  '55 ms',
  '61 ms',
  '68 ms',
  '75 ms',
  '82 ms',
  '91 ms',
  '100 ms',
  '110 ms',
  '120 ms',
  '132 ms',
  '144 ms',
  '158 ms',
  '173 ms',
  '188 ms',
  '206 ms',
  '224 ms',
  '244 ms',
  '265 ms',
  '288 ms',
  '313 ms',
  '340 ms',
  '368 ms',
  '399 ms',
  '432 ms',
  '467 ms',
  '505 ms',
  '545 ms',
  '588 ms',
  '634 ms',
  '683 ms',
  '736 ms',
  '792 ms',
  '851 ms',
  '915 ms',
  '983 ms',
  '1050 s',
  '1.13 s',
  '1.21 s',
  '1.3 s',
  '1.39 s',
  '1.49 s',
  '1.59 s',
  '1.7 s',
  '1.82 s',
  '1.94 s',
  '2.07 s',
  '2.21 s',
  '2.35 s',
  '2.51 s',
  '2.67 s',
  '2.84 s',
  '3.02 s',
  '3.21 s',
  '3.41 s',
  '3.62 s',
  '3.85 s',
  '4.09 s',
  '4.34 s',
  '4.61 s',
  '4.89 s',
  '5.19 s',
  '5.51 s',
  '5.84 s',
  '6.19 s',
  '6.57 s',
  '6.96 s',
  '7.38 s',
  '7.82 s',
  '8.29 s',
  '8.78 s',
  '9.3 s',
  '9.85 s',
  '10 s',
  '11 s',
  '11 s',
  '12 s',
  '13 s',
  '14 s',
  '14 s',
  '15 s',
  '16 s',
  '17 s',
  '18 s',
  '19 s',
  '20 s',
  '21 s',
  '22 s',
  '24 s',
  '25 s',
  '27 s',
  '28 s',
  '30 s',
  '31 s',
  '33 s',
  '35 s',
  '37 s',
  '39 s',
  '41 s',
  '44 s',
  '46 s',
  '49 s',
  '52 s',
  '55 s',
  '58 s',
];

// ns2SynthLfoRateMap (128 entries)
const LFO_RATE: readonly string[] = [
  '0.03 Hz',
  '0.03 Hz',
  '0.03 Hz',
  '0.04 Hz',
  '0.04 Hz',
  '0.04 Hz',
  '0.05 Hz',
  '0.05 Hz',
  '0.05 Hz',
  '0.06 Hz',
  '0.06 Hz',
  '0.07 Hz',
  '0.07 Hz',
  '0.08 Hz',
  '0.09 Hz',
  '0.09 Hz',
  '0.1 Hz',
  '0.11 Hz',
  '0.12 Hz',
  '0.13 Hz',
  '0.14 Hz',
  '0.15 Hz',
  '0.16 Hz',
  '0.17 Hz',
  '0.19 Hz',
  '0.20 Hz',
  '0.22 Hz',
  '0.24 Hz',
  '0.26 Hz',
  '0.28 Hz',
  '0.30 Hz',
  '0.32 Hz',
  '0.35 Hz',
  '0.38 Hz',
  '0.41 Hz',
  '0.44 Hz',
  '0.47 Hz',
  '0.51 Hz',
  '0.55 Hz',
  '0.6 Hz',
  '0.64 Hz',
  '0.7 Hz',
  '0.75 Hz',
  '0.81 Hz',
  '0.88 Hz',
  '0.95 Hz',
  '1.0 Hz',
  '1.1 Hz',
  '1.2 Hz',
  '1.3 Hz',
  '1.4 Hz',
  '1.5 Hz',
  '1.6 Hz',
  '1.8 Hz',
  '1.9 Hz',
  '2.0 Hz',
  '2.2 Hz',
  '2.4 Hz',
  '2.6 Hz',
  '2.8 Hz',
  '3.0 Hz',
  '3.2 Hz',
  '3.5 Hz',
  '3.8 Hz',
  '4.1 Hz',
  '4.4 Hz',
  '4.8 Hz',
  '5.2 Hz',
  '5.6 Hz',
  '6.0 Hz',
  '6.5 Hz',
  '7.0 Hz',
  '7.6 Hz',
  '8.2 Hz',
  '8.8 Hz',
  '9.5 Hz',
  '10 Hz',
  '11 Hz',
  '12 Hz',
  '13 Hz',
  '14 Hz',
  '15 Hz',
  '16 Hz',
  '18 Hz',
  '19 Hz',
  '21 Hz',
  '22 Hz',
  '24 Hz',
  '26 Hz',
  '28 Hz',
  '30 Hz',
  '33 Hz',
  '35 Hz',
  '38 Hz',
  '41 Hz',
  '45 Hz',
  '48 Hz',
  '52 Hz',
  '56 Hz',
  '61 Hz',
  '65 Hz',
  '71 Hz',
  '76 Hz',
  '82 Hz',
  '89 Hz',
  '96 Hz',
  '104 Hz',
  '112 Hz',
  '121 Hz',
  '131 Hz',
  '141 Hz',
  '153 Hz',
  '165 Hz',
  '178 Hz',
  '192 Hz',
  '208 Hz',
  '224 Hz',
  '242 Hz',
  '262 Hz',
  '283 Hz',
  '305 Hz',
  '330 Hz',
  '356 Hz',
  '385 Hz',
  '415 Hz',
  '449 Hz',
  '484 Hz',
  '523 Hz',
];

// ns2SynthLfoRateMasterClockDivisionMap
const LFO_RATE_MC: readonly string[] = [
  '4/1',
  '4/1T',
  '2/1',
  '2/1T',
  '1/1',
  '1/1T',
  '1/2',
  '1/2T',
  '1/4',
  '1/4T',
  '1/8',
  '1/8T',
  '1/16',
  '1/16T',
  '1/32',
];

// ns2SynthArpMasterClockDivisionMap
const ARP_MC: readonly string[] = [
  '1/2',
  '1/2T',
  '1/4',
  '1/4T',
  '1/8',
  '1/8T',
  '1/16',
  '1/16T',
  '1/32',
];

// ns2SynthFilterFrequencyMap (128 entries)
const FILTER_FREQ: readonly string[] = [
  '20 Hz',
  '21 Hz',
  '22 Hz',
  '24 Hz',
  '25 Hz',
  '26 Hz',
  '28 Hz',
  '29 Hz',
  '31 Hz',
  '33 Hz',
  '35 Hz',
  '37 Hz',
  '39 Hz',
  '41 Hz',
  '43 Hz',
  '45 Hz',
  '48 Hz',
  '51 Hz',
  '54 Hz',
  '57 Hz',
  '60 Hz',
  '63 Hz',
  '67 Hz',
  '70 Hz',
  '74 Hz',
  '79 Hz',
  '83 Hz',
  '88 Hz',
  '93 Hz',
  '98 Hz',
  '103 Hz',
  '109 Hz',
  '115 Hz',
  '122 Hz',
  '129 Hz',
  '136 Hz',
  '144 Hz',
  '152 Hz',
  '160 Hz',
  '169 Hz',
  '179 Hz',
  '189 Hz',
  '200 Hz',
  '211 Hz',
  '223 Hz',
  '235 Hz',
  '248 Hz',
  '262 Hz',
  '277 Hz',
  '293 Hz',
  '309 Hz',
  '327 Hz',
  '345 Hz',
  '365 Hz',
  '385 Hz',
  '407 Hz',
  '430 Hz',
  '454 Hz',
  '479 Hz',
  '506 Hz',
  '535 Hz',
  '565 Hz',
  '597 Hz',
  '631 Hz',
  '666 Hz',
  '704 Hz',
  '743 Hz',
  '785 Hz',
  '829 Hz',
  '876 Hz',
  '925 Hz',
  '977 Hz',
  '1 kHz',
  '1.1 kHz',
  '1.2 kHz',
  '1.2 kHz',
  '1.3 kHz',
  '1.4 kHz',
  '1.4 kHz',
  '1.5 kHz',
  '1.6 kHz',
  '1.7 kHz',
  '1.8 kHz',
  '1.9 kHz',
  '2.0 kHz',
  '2.1 kHz',
  '2.2 kHz',
  '2.3 kHz',
  '2.5 kHz',
  '2.6 kHz',
  '2.8 kHz',
  '2.9 kHz',
  '3.1 kHz',
  '3.3 kHz',
  '3.4 kHz',
  '3.6 kHz',
  '3.8 kHz',
  '4.1 kHz',
  '4.3 kHz',
  '4.5 kHz',
  '4.8 kHz',
  '5.1 kHz',
  '5.3 kHz',
  '5.6 kHz',
  '6.0 kHz',
  '6.3 kHz',
  '6.6 kHz',
  '7.0 kHz',
  '7.4 kHz',
  '7.8 kHz',
  '8.3 kHz',
  '8.7 kHz',
  '9.2 kHz',
  '10 kHz',
  '10 kHz',
  '11 kHz',
  '11 kHz',
  '12 kHz',
  '13 kHz',
  '14 kHz',
  '14 kHz',
  '15 kHz',
  '16 kHz',
  '17 kHz',
  '18 kHz',
  '19 kHz',
  '20 kHz',
  '21 kHz',
];

import { NORD_DB } from '../clavia/volume';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number): number => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
const lutStr = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Engine volume: a 7-bit MIDI value through the shared Nord dB curve (ns2VolumeEx)
const db = (midi: number): string => NORD_DB[midi] ?? '?';
// 64-bit big-endian read as BigInt — sampleId hashes span a 64-bit field.
const u64 = (b: Uint8Array, o: number): bigint => {
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[o + i] ?? 0);
  return v;
};
// NS2 sampleId hashes are stored one step off the NS3 catalog form: b31 inverted,
// then decremented (per the oracle's getSampleIdNs2ToNs3). 0 stays 0 (program init).
const ns2ToNs3Id = (ns2: bigint): number => (ns2 === 0n ? 0 : Number(ns2 ^ 0x80000000n) - 1);

// Octave shift: raw 4-bit field, center=7 → shift = raw - 7 (ns2OctaveShift oracle)
const octShift = (raw: number): number => raw - 7;

// 7-bit linear value 0→10 (midi2LinearStringValue(0,10,v,1,""))
const lin10 = (midi: number): string => (Math.round((midi / 127) * 100) / 10).toFixed(1);

/**
 * Organ drawbars (each 0-8) for B3/Vox (4-bit), Farfisa (1-bit 0/1).
 * Oracle: ns2-organ.js `getDrawbars()`.
 * B3 preset1 base: 0x5F, preset2: 0x96; Vox preset1: 0x76, preset2: 0xAD.
 * Farfisa preset1: 0x8D, preset2: 0xC4 (1-bit, separate extraction).
 */
function readDrawbars(b: Uint8Array, o: number, type: string, preset2: boolean): number[] {
  if (type === 'Farfisa') {
    // 1-bit drawbars — oracle: ns2-organ.js Farfisa branch
    const base = o + (preset2 ? 0xc4 : 0x8d);
    return [
      (u16(b, base - 1) & 0x0002) >>> 1,
      (u16(b, base) & 0x0004) >>> 2,
      (u16(b, base + 1) & 0x0008) >>> 3,
      (u16(b, base + 2) & 0x0010) >>> 4,
      (u16(b, base + 3) & 0x0020) >>> 5,
      (u16(b, base + 4) & 0x0040) >>> 6,
      (u16(b, base + 5) & 0x0080) >>> 7,
      (u16(b, base + 6) & 0x0100) >>> 8,
      (u16(b, base + 7) & 0x0200) >>> 9,
    ];
  }
  // B3 / Vox 4-bit drawbars — oracle: ns2-organ.js lines 27-45
  const base = o + (type === 'Vox' ? (preset2 ? 0xad : 0x76) : preset2 ? 0x96 : 0x5f);
  return [
    (u16(b, base + 1) & 0x01e0) >>> 5,
    (u16(b, base + 3) & 0x003c) >>> 2,
    (u16(b, base + 6) & 0x0780) >>> 7,
    (u16(b, base + 8) & 0x00f0) >>> 4,
    (u16(b, base + 10) & 0x001e) >>> 1,
    (u16(b, base + 13) & 0x03c0) >>> 6,
    (u16(b, base + 15) & 0x0078) >>> 3,
    u16(b, base + 17) & 0x000f,
    (u16(b, base + 20) & 0x01e0) >>> 5,
  ];
}

// ── Type definitions ────────────────────────────────────────────────────────

export interface Ns2OrganSlot {
  on: boolean;
  type: string;
  volume: string;
  volumeMidi: number;
  octaveShift: number;
  kbZone: string;
  pitchStick: boolean;
  sustainPedal: boolean;
  latchPedal: boolean;
  kbGate: boolean;
  output: string;
  preset2: boolean;
  drawbars: number[];
  drawbars2: number[];
  vibChorus: { on: boolean; mode: string };
  percussion: { on: boolean; third: boolean; fast: boolean; soft: boolean };
}

export interface Ns2PianoSlot {
  on: boolean;
  type: string;
  volume: string;
  volumeMidi: number;
  octaveShift: number;
  kbZone: string;
  pitchStick: boolean;
  sustainPedal: boolean;
  latchPedal: boolean;
  kbGate: boolean;
  output: string;
  sampleId: number;
  clavVariation: number; // raw 0-3 index used by resolveSample(); clavinetModel is the string label
  slotDetune: string;
  dynamics: string;
  longRelease: boolean;
  stringResonance: boolean;
  pedalNoise: boolean;
  clavinetModel: string;
  clavinetEq: string;
  clavinetEqHi: string;
}

export interface Ns2SynthFilter {
  type: string;
  freqMidi: number;
  freq: string;
  resonanceMidi: number;
  mod1Midi: number;
  mod2Midi: number;
  kbTrack: boolean;
}

export interface Ns2SynthEnv {
  attackMidi: number;
  attack: string;
  decayMidi: number;
  decay: string;
  releaseMidi: number;
  release: string;
  velocity: boolean;
}

export interface Ns2SynthSlot {
  on: boolean;
  osc: string;
  volume: string;
  volumeMidi: number;
  octaveShift: number;
  kbZone: string;
  pitchStick: boolean;
  sustainPedal: boolean;
  latchPedal: boolean;
  kbGate: boolean;
  kbHold: boolean;
  output: string;
  sampleId: number;
  voice: string;
  glide: number;
  unison: string;
  vibrato: string;
  arpEnabled: boolean;
  arpRateMidi: number;
  arpRate: string;
  arpMasterClock: boolean;
  arpRange: string;
  arpPattern: string;
  filter: Ns2SynthFilter;
  modEnv: Ns2SynthEnv;
  ampEnv: Ns2SynthEnv;
  lfoWave: string;
  lfoRateMidi: number;
  lfoRate: string;
  lfoMasterClock: boolean;
}

export interface Ns2FxParam {
  [key: string]: string | number | boolean | undefined;
}

export interface Ns2Fx {
  name: string;
  type?: string;
  source?: string;
  params?: Ns2FxParam;
}

export interface Ns2Slot {
  id: 'A' | 'B';
  active: boolean;
  organ: Ns2OrganSlot;
  piano: Ns2PianoSlot;
  synth: Ns2SynthSlot;
  fx: Ns2Fx[];
}

export interface Ns2Program {
  slots: Ns2Slot[];
  globalFx: Ns2Fx[];
  reverb: { on: boolean; type: string; amountMidi: number };
  compressor: { on: boolean; amountMidi: number };
}

// ── FX readers ──────────────────────────────────────────────────────────────

/** Effect 1 — oracle: ns2-fx-multi-effect-1.js */
function readEffect1(b: Uint8Array, o: number): Ns2Fx | null {
  if ((u8(b, o + 0x10f) & 0x20) === 0) return null;
  const typeIdx = u8(b, o + 0x10f) & 0x07;
  const src = (u8(b, o + 0x10f) & 0x18) >>> 3;
  const masterClock = (u8(b, o + 0x110) & 0x80) !== 0;
  const typeName = lutStr(EFFECT1_TYPE, typeIdx);
  const rateMcOff = (u16(b, o + 0x115) & 0x0fe0) >>> 5;
  const rateMcOn = (u8(b, o + 0x112) & 0xf0) >>> 4;
  const rateMidi = masterClock ? rateMcOn : rateMcOff;
  const amountMidi = (u16(b, o + 0x119) & 0x1fc0) >>> 6;
  return {
    name: 'Effect 1',
    type: typeName,
    source: lutStr(EFFECT_SRC, src),
    params: {
      amount: lin10(amountMidi),
      rate: masterClock ? (LFO_RATE_MC[rateMidi] ?? `#${rateMidi}`) : lin10(rateMidi),
      masterClock,
    },
  };
}

/** Effect 2 — oracle: ns2-fx-multi-effect-2.js */
function readEffect2(b: Uint8Array, o: number): Ns2Fx | null {
  if ((u8(b, o + 0x11a) & 0x20) === 0) return null;
  const typeIdx = u8(b, o + 0x11a) & 0x07;
  const src = (u8(b, o + 0x11a) & 0x18) >>> 3;
  const masterClock = (u8(b, o + 0x11b) & 0x80) !== 0;
  const rateMcOff = (u16(b, o + 0x120) & 0x0fe0) >>> 5;
  const rateMcOn = (u8(b, o + 0x11d) & 0xf0) >>> 4;
  const rateMidi = masterClock ? rateMcOn : rateMcOff;
  const amountMidi = (u16(b, o + 0x124) & 0x1fc0) >>> 6;
  return {
    name: 'Effect 2',
    type: lutStr(EFFECT2_TYPE, typeIdx),
    source: lutStr(EFFECT_SRC, src),
    params: {
      amount: lin10(amountMidi),
      rate: masterClock ? (LFO_RATE_MC[rateMidi] ?? `#${rateMidi}`) : lin10(rateMidi),
      masterClock,
    },
  };
}

/** Amp Sim / EQ — oracle: ns2-fx-amp-sim-eq.js */
function readAmpSimEq(b: Uint8Array, o: number): Ns2Fx | null {
  if ((u8(b, o + 0x133) & 0x10) === 0) return null;
  const src = (u8(b, o + 0x133) & 0x0c) >>> 2;
  const ampTypeIdx = u8(b, o + 0x133) & 0x03;
  const trebleMidi = (u16(b, o + 0x134) & 0x01fc) >>> 2;
  const midMidi = (u16(b, o + 0x135) & 0x03f8) >>> 3;
  const bassMidi = (u16(b, o + 0x136) & 0x07f0) >>> 4;
  const midFreqMidi = (u16(b, o + 0x137) & 0x0fe0) >>> 5;
  const driveMidi = (u8(b, o + 0x134) & 0xfe) >>> 1;
  return {
    name: 'Amp/EQ',
    type: lutStr(AMP_TYPE, ampTypeIdx),
    source: lutStr(EFFECT_SRC, src),
    params: {
      drive: lin10(driveMidi),
      treble: String(trebleMidi),
      mid: String(midMidi),
      bass: String(bassMidi),
      midFreq: String(midFreqMidi),
    },
  };
}

/** Delay — oracle: ns2-fx-delay.js */
function readDelay(b: Uint8Array, o: number): Ns2Fx | null {
  if ((u8(b, o + 0x125) & 0x20) === 0) return null;
  const src = (u8(b, o + 0x125) & 0x18) >>> 3;
  const masterClock = (u8(b, o + 0x125) & 0x02) !== 0;
  const pingPong = (u8(b, o + 0x125) & 0x04) !== 0;
  const tempoMcOff = (u16(b, o + 0x12d) & 0x7ff8) >>> 3;
  const tempoMcOn = (u16(b, o + 0x127) & 0x03c0) >>> 6;
  const feedbackMidi = (u16(b, o + 0x132) & 0x0fe0) >>> 5;
  const amountMidi = (u16(b, o + 0x131) & 0x07f0) >>> 4;
  return {
    name: 'Delay',
    source: lutStr(EFFECT_SRC, src),
    params: {
      masterClock,
      pingPong,
      tempo: masterClock ? `mc:${tempoMcOn}` : String(tempoMcOff),
      feedback: lin10(feedbackMidi),
      amount: lin10(amountMidi),
    },
  };
}

/** Rotary Speaker — oracle: ns2-fx-rotary-speaker.js */
function readRotary(b: Uint8Array, o: number): Ns2Fx | null {
  if ((u8(b, o + 0x3f) & 0x10) === 0) return null;
  const src = (u8(b, o + 0x3f) & 0x0c) >>> 2;
  const drive = (u16(b, o + 0x3f) & 0x03f8) >>> 3;
  const stopMode = (u8(b, o + 0x40) & 0x04) !== 0;
  const speed = (u8(b, o + 0x40) & 0x02) >>> 1;
  return {
    name: 'Rotary',
    source: lutStr(EFFECT_SRC, src),
    params: {
      drive: lin10(drive),
      stopMode,
      speed: lutStr(ROTARY_SPEED, speed),
    },
  };
}

function readFx(b: Uint8Array, o: number): Ns2Fx[] {
  return [
    readEffect1(b, o),
    readEffect2(b, o),
    readAmpSimEq(b, o),
    readDelay(b, o),
    readRotary(b, o),
  ].filter((fx): fx is Ns2Fx => fx !== null);
}

// ── Synth sub-decoders ──────────────────────────────────────────────────────

function readFilter(b: Uint8Array, o: number): Ns2SynthFilter {
  const f3 = u8(b, o + 0xf3);
  const efW = u16(b, o + 0xef);
  const f0W = u16(b, o + 0xf0);
  const f1W = u16(b, o + 0xf1);
  const f2W = u16(b, o + 0xf2);
  const freqMidi = (efW & 0x01fc) >>> 2;
  return {
    type: lutStr(FILTER_TYPE, (f3 & 0x0e) >>> 1),
    freqMidi,
    freq: FILTER_FREQ[freqMidi] ?? '?',
    resonanceMidi: (f0W & 0x03f8) >>> 3,
    mod1Midi: (f2W & 0x0fe0) >>> 5,
    mod2Midi: (f1W & 0x07f0) >>> 4,
    kbTrack: (f3 & 0x10) !== 0,
  };
}

function readModEnv(b: Uint8Array, o: number): Ns2SynthEnv {
  const dfW = u16(b, o + 0xdf);
  const e0W = u16(b, o + 0xe0);
  const e1W = u16(b, o + 0xe1);
  const atkM = (dfW & 0xfe00) >>> 9;
  const decM = (dfW & 0x01fc) >>> 2;
  const relM = (e0W & 0x03f8) >>> 3;
  return {
    attackMidi: atkM,
    attack: ENV_ATTACK[atkM] ?? '?',
    decayMidi: decM,
    decay: ENV_DECAY[decM] ?? '?',
    releaseMidi: relM,
    release: ENV_DECAY[relM] ?? '?', // mod release uses decay map (oracle line 46-47)
    velocity: (e1W & 0x0400) !== 0,
  };
}

function readAmpEnv(b: Uint8Array, o: number): Ns2SynthEnv {
  const f3W = u16(b, o + 0xf3);
  const f4W = u16(b, o + 0xf4);
  const f5W = u16(b, o + 0xf5);
  const f6W = u16(b, o + 0xf6);
  const atkM = (f3W & 0x01fc) >>> 2;
  const decM = (f4W & 0x03f8) >>> 3;
  const relM = (f5W & 0x07f0) >>> 4;
  return {
    attackMidi: atkM,
    attack: ENV_ATTACK[atkM] ?? '?',
    decayMidi: decM,
    decay: ENV_DECAY[decM] ?? '?',
    releaseMidi: relM,
    release: ENV_RELEASE[relM] ?? '?', // amp release uses release map (oracle line 54)
    velocity: (f6W & 0x0800) !== 0,
  };
}

// ── Main slot decoder ───────────────────────────────────────────────────────

function readSlot(b: Uint8Array, id: 'A' | 'B', vo: number, active: boolean): Ns2Slot {
  const o = (id === 'B' ? SLOT_STRIDE : 0) + vo;
  // "common" organ fields are NOT slot-shifted — they live at the program level
  // (oracle ns2-organ.js: commonOffset = versionOffset, not id*249+versionOffset).
  const co = vo; // common offset — no SLOT_STRIDE

  // ── ORGAN — oracle: ns2-organ.js ──────────────────────────────────────────
  // organType, pitchStick, vibMode, perc mode: from commonOffset (co)
  const organType = lutStr(ORGAN_TYPE, (u8(b, co + 0x34) & 0xc0) >>> 6);
  const organTypeIsB3 = organType === 'B3';

  const p2Off = organType === 'Vox' ? 0x5d : organType === 'Farfisa' ? 0x5e : 0x5c;
  const preset2 = (u8(b, o + p2Off) & 0x80) !== 0;

  const org30 = u8(b, co + 0x30); // common
  const org35 = u8(b, co + 0x35); // common
  const org37 = u8(b, co + 0x37); // common
  const org39 = u8(b, co + 0x39); // common
  const org43 = u8(b, o + 0x43);
  const org46 = u8(b, o + 0x46);
  const org47 = u8(b, o + 0x47);
  const org59 = u8(b, o + 0x59);
  const org74 = u8(b, o + 0x74);
  const orgAb = u8(b, o + 0xab);

  let vibOn: boolean, vibMode: string, percOn: boolean;
  if (organTypeIsB3) {
    const vpByte = preset2 ? orgAb : org74;
    vibOn = (vpByte & 0x10) !== 0;
    percOn = (vpByte & 0x08) !== 0;
    vibMode = lutStr(VIB_CHORUS, (org35 & 0xe0) >>> 5);
  } else if (organType === 'Vox') {
    vibOn = (org37 & 0x10) !== 0;
    percOn = false;
    vibMode = lutStr(VOX_VIB_MODE, (org37 & 0x60) >>> 5);
  } else {
    vibOn = (org39 & 0x10) !== 0;
    percOn = false;
    vibMode = lutStr(FARFISA_VIB_MODE, (org39 & 0x60) >>> 5);
  }

  const percThird = organTypeIsB3 && (org35 & 0x10) !== 0;
  const percFast = organTypeIsB3 && (org35 & 0x08) !== 0;
  const percSoft = organTypeIsB3 && (org35 & 0x04) === 0;

  const drawbars1 = readDrawbars(b, o, organType, false);
  const drawbars2 = readDrawbars(b, o, organType, true);
  const organVolMidi = org46 & 0x7f;
  const organOut = (['1', '1+2', '2', 'Off'] as const)[(org59 & 0x0c) >>> 2] ?? 'Off';

  const organ: Ns2OrganSlot = {
    on: (org43 & 0x80) !== 0,
    type: organType,
    volume: db(organVolMidi),
    volumeMidi: organVolMidi,
    octaveShift: octShift((org47 & 0x1e) >>> 1),
    kbZone: lutStr(KB_ZONE, (org47 & 0xe0) >>> 5),
    pitchStick: (org30 & 0x40) !== 0,
    sustainPedal: (org47 & 0x01) !== 0,
    latchPedal: (org59 & 0x02) !== 0,
    kbGate: (org59 & 0x01) !== 0,
    output: organOut,
    preset2,
    drawbars: preset2 ? drawbars2 : drawbars1,
    drawbars2: preset2 ? drawbars1 : drawbars2,
    vibChorus: { on: vibOn, mode: vibMode },
    percussion: { on: percOn, third: percThird, fast: percFast, soft: percSoft },
  };

  // ── PIANO — oracle: ns2-piano.js ──────────────────────────────────────────
  const pia3b = u8(b, o + 0x3b);
  const pia48 = u8(b, o + 0x48);
  const pia4b = u8(b, o + 0x4b);
  const pia4c = u8(b, o + 0x4c);
  const pia4d = u8(b, o + 0x4d);
  const pia58 = u8(b, o + 0x58);
  const pia5a = u8(b, o + 0x5a);
  const piaCd = u8(b, o + 0xcd);
  const piaCeW = u16(b, o + 0xce);
  const piaCf = u8(b, o + 0xcf);
  const piaD0 = u8(b, o + 0xd0);
  const piaCdWide = u64(b, o + 0xcd);

  const pianoTypeIdx = (piaCd & 0xe0) >>> 5;
  const ns2PianoSampleId = (piaCdWide & 0x0000003fffffffc0n) >> 6n;
  const pianoVolMidi = pia4b & 0x7f;
  const pianoOut = (['1', '1+2', '2', 'Off'] as const)[pia58 & 0x03] ?? 'Off';
  const clavVariation = (piaCeW & 0x0180) >>> 7;

  const piano: Ns2PianoSlot = {
    on: (pia48 & 0x80) !== 0,
    type: lutStr(PIANO_TYPE, pianoTypeIdx),
    volume: db(pianoVolMidi),
    volumeMidi: pianoVolMidi,
    octaveShift: octShift((pia4c & 0x1e) >>> 1),
    kbZone: lutStr(KB_ZONE, (pia4c & 0xe0) >>> 5),
    pitchStick: (pia4c & 0x01) !== 0,
    sustainPedal: (pia4d & 0x80) !== 0,
    latchPedal: (pia5a & 0x80) !== 0,
    kbGate: (pia5a & 0x40) !== 0,
    output: pianoOut,
    sampleId: ns2ToNs3Id(ns2PianoSampleId),
    clavVariation,
    slotDetune: lutStr(PIANO_DETUNE, (pia3b & 0xe0) >>> 5),
    dynamics: lutStr(PIANO_DYNAMICS, (piaCf & 0x0c) >>> 2),
    longRelease: (piaCf & 0x40) !== 0,
    stringResonance: (piaCf & 0x20) !== 0,
    pedalNoise: (piaCf & 0x10) !== 0,
    clavinetModel: lutStr(CLAV_MODEL, clavVariation),
    clavinetEqHi: lutStr(CLAV_EQ_HI, piaCf & 0x03),
    clavinetEq: lutStr(CLAV_EQ, (piaD0 & 0xc0) >>> 6),
  };

  // ── SYNTH — oracle: ns2-synth.js ──────────────────────────────────────────
  const syn4d = u8(b, o + 0x4d);
  const syn50W = u16(b, o + 0x50);
  const syn51 = u8(b, o + 0x51);
  const syn52 = u8(b, o + 0x52);
  const syn59 = u8(b, o + 0x59);
  const syn5a = u8(b, o + 0x5a);
  const synD9 = u8(b, o + 0xd9);
  const synDaW = u16(b, o + 0xda);
  const synDbW = u16(b, o + 0xdb);
  const synDc = u8(b, o + 0xdc);
  const synE1W = u16(b, o + 0xe1);
  const synF6W = u16(b, o + 0xf6);
  const synF7 = u8(b, o + 0xf7);
  const synFbW = u16(b, o + 0xfb);
  const synFcW = u16(b, o + 0xfc);
  const synF4Wide = u64(b, o + 0xf4);

  const synthNs2SampleId = (synF4Wide & 0x03fffffffcn) >> 2n;
  const lfoMasterClock = (synDc & 0x40) !== 0;
  const lfoRateMidi = lfoMasterClock ? (synDc & 0x3c) >>> 2 : (synF6W & 0x07f0) >>> 4;
  const arpMasterClock = (synDaW & 0x8000) !== 0;
  const arpRateMidi = arpMasterClock ? (synDaW & 0x7800) >>> 11 : (synDaW & 0x03f8) >>> 3;
  const synthVolMidi = (syn50W & 0x3f80) >>> 7;
  const synthOut = (['1', '1+2', '2', 'Off'] as const)[(syn59 & 0x60) >>> 5] ?? 'Off';

  const synth: Ns2SynthSlot = {
    on: (syn4d & 0x40) !== 0,
    osc: lutStr(SYNTH_OSC, (synE1W & 0x0380) >>> 7),
    volume: db(synthVolMidi),
    volumeMidi: synthVolMidi,
    octaveShift: octShift(syn51 & 0x0f),
    kbZone: lutStr(KB_ZONE, (syn51 & 0x70) >>> 4),
    pitchStick: (syn52 & 0x80) !== 0,
    sustainPedal: (syn52 & 0x40) !== 0,
    latchPedal: (syn5a & 0x20) !== 0,
    kbGate: (syn5a & 0x10) !== 0,
    kbHold: (synDc & 0x02) !== 0,
    output: synthOut,
    sampleId: ns2ToNs3Id(synthNs2SampleId),
    voice: lutStr(SYNTH_VOICE, (synFcW & 0x0600) >>> 9),
    glide: (synFbW & 0x03f8) >>> 3,
    unison: lutStr(SYNTH_UNISON, (synFcW & 0x01c0) >>> 6),
    vibrato: lutStr(SYNTH_VIBRATO, (synFcW & 0x0038) >>> 3),
    arpEnabled: (synD9 & 0x01) !== 0,
    arpRateMidi,
    arpRate: arpMasterClock ? (ARP_MC[arpRateMidi] ?? `#${arpRateMidi}`) : lin10(arpRateMidi),
    arpMasterClock,
    arpRange: lutStr(ARP_RANGE, (synDbW & 0x0180) >>> 7),
    arpPattern: lutStr(ARP_PATTERN, (synDbW & 0x0600) >>> 9),
    filter: readFilter(b, o),
    modEnv: readModEnv(b, o),
    ampEnv: readAmpEnv(b, o),
    lfoWave: lutStr(LFO_WAVE, (synF7 & 0x0c) >>> 2),
    lfoRateMidi,
    lfoRate: lfoMasterClock
      ? (LFO_RATE_MC[lfoRateMidi] ?? `#${lfoRateMidi}`)
      : (LFO_RATE[lfoRateMidi] ?? `#${lfoRateMidi}`),
    lfoMasterClock,
  };

  return { id, active, organ, piano, synth, fx: readFx(b, o) };
}

/**
 * Decode a Stage 2 `.ns2p` into its active slot(s).
 * Oracle: ns2-program.js.
 */
export function decodeNs2(bytes: Uint8Array): Ns2Program {
  const versionOffset = u8(bytes, 0x04) === 1 ? 0 : -20;

  const flag = (u8(bytes, 0x2e + versionOffset) & 0xc0) >>> 6;
  const dual = (u8(bytes, 0x2e + versionOffset) & 0x20) !== 0;
  const aActive = dual || flag !== 1;
  const bActive = dual || flag !== 0;

  const a = readSlot(bytes, 'A', versionOffset, aActive);
  const b = readSlot(bytes, 'B', versionOffset, bActive);
  // Organ type is hardware-global — mirror slot A type to slot B (oracle note)
  b.organ.type = a.organ.type;

  // Program-global FX — oracle: ns2-fx-reverb.js, ns2-fx-compressor.js
  const rvW = u16(bytes, 0x3d + versionOffset);
  const cpW = u16(bytes, 0x3e + versionOffset);

  const reverbOn = (rvW & 0x8000) !== 0;
  const reverbType = lutStr(REVERB_TYPE, (rvW & 0x7000) >>> 12);
  const reverbAmtMidi = (rvW & 0x0fe0) >>> 5;

  const compOn = (cpW & 0x1000) !== 0;
  const compAmtMidi = (cpW & 0x0fe0) >>> 5;

  const globalFx: Ns2Fx[] = [];
  if (reverbOn) globalFx.push({ name: 'Reverb', type: reverbType, params: { amount: lin10(reverbAmtMidi) } });
  if (compOn) globalFx.push({ name: 'Comp', params: { amount: lin10(compAmtMidi) } });

  return {
    slots: [a, b].filter((s) => s.active),
    globalFx,
    reverb: { on: reverbOn, type: reverbType, amountMidi: reverbAmtMidi },
    compressor: { on: compOn, amountMidi: compAmtMidi },
  };
}
