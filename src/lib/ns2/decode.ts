/**
 * Nord Stage 2 / 2 EX (`.ns2p`) program reader.
 *
 * The program is the Stage 2 OS 3.00 firmware's descriptor-container record
 *: a u16 record version, then 519 bytes of
 * MSB-first parameter data — 7 global containers (21 bytes: program common,
 * organ model, B3 / Vox / Farfisa common, piano slot detune, reverb /
 * compressor / rotary), then the same 15 containers for slot A and for slot B
 * (249 bytes each: levels and keyboard settings, organ preset selects, B3 /
 * Vox / Farfisa Preset I and II, piano, arpeggiator + LFO, synth, extern,
 * effects). Container list, record write, read
 *. `layout.generated.ts` (the maintainers’ tools
 * `stage-2`) lists every stored parameter with its descriptor id, and the
 * shared legacy-record reader (clavia/legacy-record.ts) reads them all into
 * `values`, the inline morph deltas included.
 *
 * Framing (high; every file of ns3-program-viewer's test corpus agrees):
 * behind the NSM-era header (formatType 1) the record version is the BE u16
 * at 0x2C, the data runs from 0x2E to the end of the file (565 bytes); behind
 * the 20-byte shorter legacy header (formatType 0) the version is at 0x18 and
 * the data at 0x1A, followed by the 2-byte trailer (547 bytes). Both headers
 * also carry the record version in the CBIN version field (0x14, LE), which
 * is what's read here. Version 7 is current; the Nord converts 1-6 up to 7 in
 * place when it loads them (same size), which isn't applied here.
 *
 * Morphs: every morphable parameter is preceded by one delta per morph source
 * (Wheel, After Touch, Ctrl Pedal), one bit wider than the parameter, two's
 * complement, within ±max. They are read as `<key>.morphWheel` /
 * `.morphAfterTouch` / `.morphCtrlPedal` and grouped in `morphDeltas`.
 *
 * On top of those values this module builds the typed slot shape the rest of
 * the app uses (`Ns2Slot`): every number comes from the layout; the display
 * labels and curves are ns3-program-viewer's ns2-mapping.js tables (Chris55,
 * GPLv3, ATTRIBUTION.md), which agree with the firmware's label strings where
 * those were read (amp type 0 = "Clean"). The earlier decoder transcribed that
 * viewer's offsets; the layout reproduces every whole-field read it made, so
 * real files read the same, except for the fixes below.
 *
 * Program-wide parameters (the firmware stores them once, in the global
 * containers): organ model, B3 / Vox / Farfisa vibrato and percussion
 * settings, organ pitch stick, piano slot detune, reverb, compressor and the
 * rotary speaker. Every slot shows the program-wide value; the rotary is a
 * program effect (`globalFx`, `rotary`), not a slot effect.
 *
 * Never throws.
 */
import { NORD_DB } from '../clavia/volume';
import { LEGACY_DATA_OFFSET, legacyData, legacyRecordVersion, readLegacyRecord } from '../clavia/legacy-record';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';

export type { Ns2FieldKey };

/** Record data start behind the NSM-era header: 0x2C bytes of header, then the u16 record version. */
export const NS2_NSM_DATA_OFFSET = 0x2e;

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
// Amp/EQ model labels, raw 0-3. Value 0 is "Clean" (not "Off"; enable is a
// separate bit) — Stage 2 OS 3.00 firmware amp-type strings Clean/Small/JC/Twin.
const AMP_TYPE = ['Clean', 'Small', 'JC', 'Twin'];
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

const lutStr = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Engine volume: a 7-bit MIDI value through the shared Nord dB curve (ns2VolumeEx)
const db = (midi: number): string => NORD_DB[midi] ?? '?';

// NS2 sampleId hashes are stored one step off the NS3 catalog form: b31 inverted,
// then decremented (per the oracle's getSampleIdNs2ToNs3). 0 stays 0 (program init).
const ns2ToNs3Id = (raw: number): number => (raw === 0 ? 0 : ((raw ^ 0x80000000) >>> 0) - 1);

// Octave shift: raw 4-bit field, center=7 → shift = raw - 7 (ns2OctaveShift oracle)
const octShift = (raw: number): number => raw - 7;

// 7-bit linear value 0→10 (midi2LinearStringValue(0,10,v,1,""))
const lin10 = (midi: number): string => (Math.round((midi / 127) * 100) / 10).toFixed(1);

// Output routing labels (ns2-mapping.js). The firmware field is 3 bits, 0-3.
const OUTPUT = ['1', '1+2', '2', 'Off'];

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
  clavVariation: number; // raw index used by resolveSample(); clavinetModel is the string label
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
  /** This slot's effects that are switched on, in signal order (Effect 1, Effect 2, Amp/EQ, Delay). */
  fx: Ns2Fx[];
}

/** The program-wide rotary speaker (globalFx container). */
export interface Ns2Rotary {
  on: boolean;
  /** Which engine feeds it: Organ / Piano / Synth. */
  source: string;
  driveMidi: number;
  stopMode: boolean;
  speed: string;
}

export interface Ns2Program {
  slots: Ns2Slot[];
  /** Program-wide effects that are switched on: Rotary, Reverb, Comp. */
  globalFx: Ns2Fx[];
  reverb: { on: boolean; type: string; amountMidi: number };
  compressor: { on: boolean; amountMidi: number };
  /** The program-wide rotary speaker, on or off. */
  rotary?: Ns2Rotary;
}

/**
 * What {@link decodeNs2} returns: the slot shape plus the firmware-layout read
 * it was built from.
 */
export interface Ns2File extends Ns2Program {
  readonly format: 'ns2p';
  rotary: Ns2Rotary;
  /** File offset of the record data: 0x2E (NSM-era header) or 0x1A (legacy header). */
  readonly dataOffset: number;
  /** The record version the file carries (7 is current; 0 when the header holds none). */
  readonly recordVersion: number;
  /** Every layout field by generated key, morph deltas included. */
  readonly values: Partial<Record<Ns2FieldKey, number>>;
  /** Inline morph deltas grouped under the parameter they modulate: Wheel, After Touch, Ctrl Pedal. */
  readonly morphDeltas: Partial<Record<Ns2FieldKey, readonly number[]>>;
  /** Keys whose stored value is outside the descriptor range (the Nord loads its default instead). */
  readonly outOfRange: Ns2FieldKey[];
  readonly warnings: string[];
}

// ── Layout access ───────────────────────────────────────────────────────────

type Slot = 'A' | 'B';
/** A slot field, named as in slot A: `common.organEnable`, `synth.filterMode`, … */
type SlotField = Ns2FieldKey extends infer K ? (K extends `slotA_${infer F}` ? F : never) : never;
type Values = Partial<Record<Ns2FieldKey, number>>;

function reader(values: Values) {
  const get = (key: Ns2FieldKey): number => values[key] ?? 0;
  const slot = (id: Slot) => (f: SlotField): number => get(`slot${id}_${f}` as Ns2FieldKey);
  return { get, slot };
}
type Get = (key: Ns2FieldKey) => number;
type SlotGet = (f: SlotField) => number;

/** A 32-bit sample-name hash the firmware stores as three descriptors (15 + 15 + 2 bits). */
const hash32 = (hi: number, mid: number, lo: number): number => hi * 2 ** 17 + mid * 4 + lo;

const B3_DRAWBARS = ['b3Sub', 'b3Sub3', 'b3Fund', 'b32nd', 'b33rd', 'b34th', 'b35th', 'b36th', 'b38th'] as const;
const VOX_DRAWBARS = ['vox16Foot', 'vox8Foot', 'vox4Foot', 'vox2Foot', 'voxII', 'voxIII', 'voxIV', 'voxSin', 'voxTri'] as const;
const FARFISA_TABS = [
  'farfisaBass16', 'farfisaString16', 'farfisaFlute8', 'farfisaOboe8', 'farfisaTrumpet8',
  'farfisaString8', 'farfisaFlute4', 'farfisaString4', 'farfisa223',
] as const;

/** One organ preset's nine drawbars (B3 / Vox 0-8) or tabs (Farfisa 0/1). */
function drawbars(s: SlotGet, type: string, preset: 'I' | 'II'): number[] {
  if (type === 'Farfisa') return FARFISA_TABS.map((k) => s(`farfPreset${preset}.${k}`));
  if (type === 'Vox') return VOX_DRAWBARS.map((k) => s(`voxPreset${preset}.${k}`));
  return B3_DRAWBARS.map((k) => s(`b3Preset${preset}.${k}`));
}

// ── Engines ─────────────────────────────────────────────────────────────────

function organ(get: Get, s: SlotGet): Ns2OrganSlot {
  // The organ model and the model settings live in the global containers.
  const type = lutStr(ORGAN_TYPE, get('organCommon.organModel'));
  const isB3 = type === 'B3';
  const preset2 = (type === 'Vox' ? s('voxSelect.voxPreset') : type === 'Farfisa' ? s('farfSelect.farfisaPreset') : s('b3Select.b3Preset')) === 1;
  const presetI = drawbars(s, type, 'I');
  const presetII = drawbars(s, type, 'II');
  const active = preset2 ? 'II' : 'I';

  let vibChorus: Ns2OrganSlot['vibChorus'];
  if (isB3) {
    vibChorus = { on: s(`b3Preset${active}.b3Vibrato`) === 1, mode: lutStr(VIB_CHORUS, get('b3Common.b3VibratoType')) };
  } else if (type === 'Vox') {
    vibChorus = { on: get('voxCommon.voxVibrato') === 1, mode: lutStr(VOX_VIB_MODE, get('voxCommon.voxVibratoType')) };
  } else {
    vibChorus = { on: get('farfCommon.farfisaVibrato') === 1, mode: lutStr(FARFISA_VIB_MODE, get('farfCommon.farfisaVibratoType')) };
  }
  const volumeMidi = s('common.organLevel');
  return {
    on: s('common.organEnable') === 1,
    type,
    volume: db(volumeMidi),
    volumeMidi,
    octaveShift: octShift(s('common.organOctaveShift')),
    kbZone: lutStr(KB_ZONE, s('common.organZone')),
    pitchStick: get('programCommon.param8') === 1, // program-wide
    sustainPedal: s('common.param4') === 1,
    latchPedal: s('common.param28') === 1,
    kbGate: s('common.param29') === 1,
    output: lutStr(OUTPUT, s('common.param27')),
    preset2,
    drawbars: preset2 ? presetII : presetI,
    drawbars2: preset2 ? presetI : presetII,
    vibChorus,
    percussion: {
      on: isB3 && s(`b3Preset${active}.b3Percussion`) === 1,
      third: isB3 && get('b3Common.b3PercussionHarmonic') === 1,
      fast: isB3 && get('b3Common.b3PercussionDecay') === 1,
      soft: isB3 && get('b3Common.b3PercussionVolume') === 0,
    },
  };
}

function piano(get: Get, s: SlotGet): Ns2PianoSlot {
  const volumeMidi = s('common.pianoLevel');
  // Descriptor 3 of the piano container (7 bits, 0-49): the Clavinet model the
  // earlier decoder read as its low 2 bits; whole field now.
  const clavVariation = s('piano.param3');
  // "Piano / Acoustic" (2 bits): long release is its high bit, string resonance its low bit.
  const acoustic = s('piano.pianoAcoustic');
  return {
    on: s('common.pianoEnable') === 1,
    type: lutStr(PIANO_TYPE, s('piano.param0')),
    volume: db(volumeMidi),
    volumeMidi,
    octaveShift: octShift(s('common.pianoOctaveShift')),
    kbZone: lutStr(KB_ZONE, s('common.pianoZone')),
    pitchStick: s('common.param9') === 1,
    sustainPedal: s('common.param10') === 1,
    latchPedal: s('common.param30') === 1,
    kbGate: s('common.param31') === 1,
    output: lutStr(OUTPUT, s('common.param25')),
    sampleId: ns2ToNs3Id(hash32(s('piano.param9'), s('piano.param10'), s('piano.param11'))),
    clavVariation,
    slotDetune: lutStr(PIANO_DETUNE, get('pianoCommon.pianoSlotDetune')), // program-wide
    dynamics: lutStr(PIANO_DYNAMICS, s('piano.pianoDynamics')),
    longRelease: (acoustic & 2) !== 0,
    stringResonance: (acoustic & 1) !== 0,
    pedalNoise: s('piano.pianoPedalNoise') === 1,
    clavinetModel: lutStr(CLAV_MODEL, clavVariation),
    clavinetEqHi: lutStr(CLAV_EQ_HI, s('piano.clavinetEQMode')),
    clavinetEq: lutStr(CLAV_EQ, s('piano.clavinetEQMode8')),
  };
}

function synth(s: SlotGet): Ns2SynthSlot {
  const volumeMidi = s('common.synthLevel');
  const lfoMasterClock = s('arpLfo.lFOMstClk') === 1;
  const lfoRateMidi = lfoMasterClock ? s('arpLfo.lFOMstClkDiv') : s('synth.lFORate');
  const arpMasterClock = s('arpLfo.arpeggiatorMstClk') === 1;
  const arpRateMidi = arpMasterClock ? s('arpLfo.arpeggiatorMstClkDiv') : s('arpLfo.arpeggiatorRate');
  const freqMidi = s('synth.filterFrequency');
  const modAtk = s('synth.modEnvelopeAttack');
  const modDec = s('synth.modEnvelopeDecay');
  const modRel = s('synth.modEnvelopeRelease');
  const ampAtk = s('synth.ampEnvelopeAttack');
  const ampDec = s('synth.ampEnvelopeDecay');
  const ampRel = s('synth.ampEnvelopeRelease');
  return {
    on: s('common.synthEnable') === 1,
    osc: lutStr(SYNTH_OSC, s('synth.param4')),
    volume: db(volumeMidi),
    volumeMidi,
    octaveShift: octShift(s('common.synthOctaveShift')),
    kbZone: lutStr(KB_ZONE, s('common.synthZone')),
    pitchStick: s('common.param15') === 1,
    sustainPedal: s('common.param16') === 1,
    latchPedal: s('common.param32') === 1,
    kbGate: s('common.param33') === 1,
    kbHold: s('arpLfo.holdState') === 1,
    output: lutStr(OUTPUT, s('common.param26')),
    sampleId: ns2ToNs3Id(hash32(s('synth.param22'), s('synth.param23'), s('synth.param24'))),
    voice: lutStr(SYNTH_VOICE, s('synth.voiceMode')),
    glide: s('synth.glideRate'),
    unison: lutStr(SYNTH_UNISON, s('synth.unisonMode')),
    vibrato: lutStr(SYNTH_VIBRATO, s('synth.vibratoMode')),
    arpEnabled: s('arpLfo.arpeggiatorRun') === 1,
    arpRateMidi,
    arpRate: arpMasterClock ? (ARP_MC[arpRateMidi] ?? `#${arpRateMidi}`) : lin10(arpRateMidi),
    arpMasterClock,
    arpRange: lutStr(ARP_RANGE, s('arpLfo.arpeggiatorRange')),
    arpPattern: lutStr(ARP_PATTERN, s('arpLfo.arpeggiatorPattern')),
    filter: {
      type: lutStr(FILTER_TYPE, s('synth.filterMode')),
      freqMidi,
      freq: FILTER_FREQ[freqMidi] ?? '?',
      resonanceMidi: s('synth.filterResonance'),
      mod1Midi: s('synth.fltFreqMod1Amount'),
      mod2Midi: s('synth.fltFreqMod2Amount'),
      kbTrack: s('synth.fltKBTTrack') === 1,
    },
    modEnv: {
      attackMidi: modAtk,
      attack: ENV_ATTACK[modAtk] ?? '?',
      decayMidi: modDec,
      decay: ENV_DECAY[modDec] ?? '?',
      releaseMidi: modRel,
      release: ENV_DECAY[modRel] ?? '?', // mod release uses the decay map (oracle)
      velocity: s('synth.modEnvelopeVelocity') === 1,
    },
    ampEnv: {
      attackMidi: ampAtk,
      attack: ENV_ATTACK[ampAtk] ?? '?',
      decayMidi: ampDec,
      decay: ENV_DECAY[ampDec] ?? '?',
      releaseMidi: ampRel,
      release: ENV_RELEASE[ampRel] ?? '?', // amp release uses the release map (oracle)
      velocity: s('synth.ampEnvelopeVelocity') === 1,
    },
    lfoWave: lutStr(LFO_WAVE, s('synth.lFOWave')),
    lfoRateMidi,
    lfoRate: lfoMasterClock
      ? (LFO_RATE_MC[lfoRateMidi] ?? `#${lfoRateMidi}`)
      : (LFO_RATE[lfoRateMidi] ?? `#${lfoRateMidi}`),
    lfoMasterClock,
  };
}

// ── Effects ─────────────────────────────────────────────────────────────────

/** The slot's effects container: Effect 1, Effect 2, Amp/EQ and Delay, when switched on. */
function slotFx(s: SlotGet): Ns2Fx[] {
  const fx: Ns2Fx[] = [];
  for (const n of [1, 2] as const) {
    if (s(`effects.effect${n}Enable`) !== 1) continue;
    const masterClock = s(`effects.effect${n}MstClk`) === 1;
    const rate = masterClock ? s(`effects.effect${n}MstClkDiv`) : s(`effects.effect${n}Rate`);
    fx.push({
      name: `Effect ${n}`,
      type: lutStr(n === 1 ? EFFECT1_TYPE : EFFECT2_TYPE, s(`effects.effect${n}Type`)),
      source: lutStr(EFFECT_SRC, s(`effects.effect${n}Source`)),
      params: {
        amount: lin10(s(`effects.effect${n}Amount`)),
        rate: masterClock ? (LFO_RATE_MC[rate] ?? `#${rate}`) : lin10(rate),
        masterClock,
      },
    });
  }
  if (s('effects.ampSimEqEnable') === 1) {
    fx.push({
      name: 'Amp/EQ',
      type: lutStr(AMP_TYPE, s('effects.ampSimEqType')),
      source: lutStr(EFFECT_SRC, s('effects.ampSimEqSource')),
      params: {
        drive: lin10(s('effects.ampSimEqDrive')),
        treble: String(s('effects.ampSimEqTreble')),
        mid: String(s('effects.ampSimEqMid')),
        bass: String(s('effects.ampSimEqBass')),
        midFreq: String(s('effects.ampSimEqMidFreq')),
      },
    });
  }
  if (s('effects.delayEnable') === 1) {
    const masterClock = s('effects.delayMstClk') === 1;
    fx.push({
      name: 'Delay',
      source: lutStr(EFFECT_SRC, s('effects.delaySource')),
      params: {
        masterClock,
        pingPong: s('effects.delayMode') === 1,
        tempo: masterClock ? `mc:${s('effects.delayMstClkDiv')}` : String(s('effects.delayRate')),
        feedback: lin10(s('effects.delayFeedback')),
        amount: lin10(s('effects.delayAmount')),
      },
    });
  }
  return fx;
}

function rotary(get: Get): Ns2Rotary {
  return {
    on: get('globalFx.rotarySpeakerEnable') === 1,
    source: lutStr(EFFECT_SRC, get('globalFx.rotarySpeakerSource')),
    driveMidi: get('globalFx.rotarySpeakerDrive'),
    stopMode: get('globalFx.rotarySpeakerStopMode') === 1,
    speed: lutStr(ROTARY_SPEED, get('globalFx.param9')),
  };
}

// ── Program ─────────────────────────────────────────────────────────────────

const LAYOUT_VERSION = NS2_LAYOUT.recordVersion ?? 7;

/** Decode a Stage 2 / 2 EX `.ns2p` into its active slot(s), plus every layout field in `values`. */
export function decodeNs2(bytes: Uint8Array): Ns2File {
  const warnings: string[] = [];
  // Header type byte 0x04: 1 = NSM-era header (data at 0x2E), else legacy (data at 0x1A).
  const nsm = (bytes[0x04] ?? 0) === 1;
  const dataOffset = nsm ? NS2_NSM_DATA_OFFSET : LEGACY_DATA_OFFSET;
  // An NSM-era file ends with the record (565 bytes); a legacy one adds the 2-byte trailer (547).
  const trailerBytes = nsm ? 0 : 2;
  // The u16 record version also sits in the CBIN version field (0x14, LE) on both headers.
  const recordVersion = legacyRecordVersion(bytes);
  const data = legacyData(bytes, dataOffset, trailerBytes);
  if (data.length < NS2_LAYOUT.dataBytes) {
    warnings.push(
      `This file is shorter than a Stage 2 program (${bytes.length} bytes, expected ` +
      `${dataOffset + NS2_LAYOUT.dataBytes + trailerBytes}); settings past the end show as 0.`,
    );
  }
  if (recordVersion > LAYOUT_VERSION) {
    warnings.push('This program was saved in a newer Stage 2 format than OpenNord knows; some settings may show wrong.');
  } else if (recordVersion > 0 && recordVersion < LAYOUT_VERSION) {
    warnings.push(
      'This program was saved by an older Stage 2 OS. The Nord updates it when it loads it; ' +
      'OpenNord shows the settings as stored.',
    );
  }

  const { values, outOfRange } = readLegacyRecord(data, NS2_LAYOUT);
  const morphDeltas: Partial<Record<Ns2FieldKey, number[]>> = {};
  for (const f of NS2_LAYOUT.fields) {
    if (f.deltaOf) (morphDeltas[f.deltaOf] ??= []).push(values[f.key] ?? 0);
  }

  const { get, slot } = reader(values);
  // Program common descriptors 0-2: slot select (2 bits, read as one value) and
  // the dual flag. 0 = A, 1 = B, 2/3 or dual = both (ns2-program.js).
  const flag = get('programCommon.param0') * 2 + get('programCommon.param1');
  const dual = get('programCommon.param2') === 1;
  const active: Record<Slot, boolean> = { A: dual || flag !== 1, B: dual || flag !== 0 };
  const slots = (['A', 'B'] as const).map((id): Ns2Slot => {
    const s = slot(id);
    return { id, active: active[id], organ: organ(get, s), piano: piano(get, s), synth: synth(s), fx: slotFx(s) };
  });

  const reverb = {
    on: get('globalFx.reverbEnable') === 1,
    type: lutStr(REVERB_TYPE, get('globalFx.reverbType')),
    amountMidi: get('globalFx.reverbDryWet'),
  };
  const compressor = { on: get('globalFx.compressorEnable') === 1, amountMidi: get('globalFx.compressorAmount') };
  const rot = rotary(get);
  const globalFx: Ns2Fx[] = [];
  if (rot.on) {
    globalFx.push({
      name: 'Rotary',
      source: rot.source,
      params: { drive: lin10(rot.driveMidi), stopMode: rot.stopMode, speed: rot.speed },
    });
  }
  if (reverb.on) globalFx.push({ name: 'Reverb', type: reverb.type, params: { amount: lin10(reverb.amountMidi) } });
  if (compressor.on) globalFx.push({ name: 'Comp', params: { amount: lin10(compressor.amountMidi) } });

  return {
    format: 'ns2p',
    slots: slots.filter((s) => s.active),
    globalFx,
    reverb,
    compressor,
    rotary: rot,
    dataOffset,
    recordVersion,
    values,
    morphDeltas,
    outOfRange,
    warnings,
  };
}
