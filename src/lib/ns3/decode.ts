/**
 * Nord Stage 3 (`.ns3f`) program reader — firmware-derived layout. A Live
 * program (`.ns3l`) has the same body (firmware FUN_c00d2f9c → FUN_c007a51c).
 *
 * The body is the Stage 3 OS 2.64 firmware's own program format (registry
 * FUN_c0075058, Multi format FUN_c007a51c, serialiser FUN_c00e0108 — see
 * docs/STAGE2-3-FIRMWARE.md §3): a u32 format version (3.00–3.04), then 19
 * length-prefixed blocks — MultiCommon, then for slot (panel) A and B: Piano,
 * SynthCommon, Synth, Organ, Organ Preset I, Organ Preset II, Extern, Effects,
 * Mixer. `layout.generated.ts` (scripts/gen-fw-program-maps.py) lists every field
 * with its firmware parameter id, and the shared block-chain reader
 * (clavia/block-chain.ts) reads them all into `values`. Morph deltas (Wheel /
 * After Touch / Ctrl Pedal) are read too, as `<field>.morph<Source>`.
 *
 * On top of those values this module builds the typed panel shape the rest of
 * the app uses (`Ns3Panel`): engine on/off, levels in dB, sample ids, drawbars,
 * labels and the synth/FX display strings. Every number comes from the layout;
 * the labels come from the firmware's own label tables where it has one
 * (display registration FUN_c0088ec0) and from ns3-program-viewer's tables
 * (Chris55, ATTRIBUTION.md) for the display curves (LFO/arp rates, envelope
 * times, filter frequency) and the oscillator wave names.
 *
 * Versions: the firmware reads 3.00–3.04 natively (new parameters take reserved
 * bits, so block sizes don't change) and converts 2.01–2.03 on load. A 2.0x body
 * lays its slot blocks out differently, so it is returned header-only with a
 * warning, as is any file whose chain doesn't match the layout. A legacy
 * (formatType 0) file has a header 0x14 bytes shorter, so its body starts at
 * 0x18, and ends with a 2-byte CRC-16 trailer. Never throws.
 *
 * The framing matches every file of ns3-program-viewer's public test corpus
 * (842 NSM-era `.ns3f` of 592 bytes at format 3.03/3.04, five legacy ones of
 * 574 bytes at 3.00–3.02, one `.ns3l`). On those files the panels read the
 * same values as the earlier corpus-derived decoder; only the Vox/Farfisa/Pipe
 * vibrato and synth "After Touch" labels differ.
 */
import { decodeFwProgram, type FwProgram } from '../clavia/block-chain';
import { DRAWBAR_NUMBERS } from '../clavia/fw-present';
import { NORD_DB } from '../clavia/volume';
import { NS3_FILTER_FREQ } from './filter-freq';
import { NS3_LAYOUT, type Ns3FieldKey } from './layout.generated';

export type { Ns3FieldKey };

// ── Label tables ────────────────────────────────────────────────────────────
// "Firmware" = the Stage 3 OS 2.64 label table registered for that parameter
// (display registration FUN_c0088ec0). The rest come from ns3-mapping.js
// (Chris55/ns3-program-viewer) and agree with the firmware where it has a table.

// Param_Pno_kBank (firmware).
const PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav', 'Digital', 'Misc'];
/** Organ models, Param_Org_kModel 0-4 (firmware) — also the model selector in ns3/view.ts. */
export const ORGAN_TYPE = ['B3', 'Vox', 'Farfisa', 'Pipe1', 'Pipe2'];
// Edt_Syn_kOscBank 0-4.
const SYNTH_OSC = ['Classic', 'Wave', 'Formant', 'Super', 'Sample'];
// Param_Syn_kFltType (firmware).
const SYNTH_FILTER = ['LP12', 'LP24', 'Mini Moog', 'LP+HP', 'BP24', 'HP24'];
// Param_Effects_kRvbType (firmware); the Bright switch is a separate field (rvbBright).
const REVERB_TYPE = ['Room 1', 'Room 2', 'Stage 1', 'Stage 2', 'Hall 1', 'Hall 2'];
// Param_Effects_kFx1Type / kFx2Type (firmware).
const EFFECT1_TYPE = ['Panning', 'Tremolo', 'Ring Mod', 'Wah-Wah', 'Auto-Wah 1', 'Auto-Wah 2'];
const EFFECT2_TYPE = ['Phaser 1', 'Phaser 2', 'Flanger', 'Vibe', 'Chorus 1', 'Chorus 2'];
/**
 * Param_Com_kOrgVibratoType 0-5 is the selector position V1 C1 V2 C2 V3 C3, shared
 * by every organ model. Vox and Farfisa name the positions they use (firmware
 * label table; positions as in ns3-program-viewer's ns3-organ.js and the Stage 4's
 * per-model fields), and a position they don't use reads as the next one, as
 * ns3-organ.js reads it. The pipe organs have only C1.
 */
const VIB_POSITION = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'];
const VIB_NAMES: Partial<Record<number, Partial<Record<string, string>>>> = {
  1: { V1: 'Less', V2: 'More', V3: 'Original' },                                   // Vox
  2: { V1: 'Light/Slow', V2: 'Light/Fast', C2: 'Heavy/Slow', C3: 'Heavy/Fast' },   // Farfisa
};
function vibChorusLabel(model: number, mode: number): string {
  const pos = VIB_POSITION[mode];
  if (pos === undefined) return `#${mode}`;
  if (model === 3 || model === 4) return 'C1';
  const names = VIB_NAMES[model];
  return names ? names[pos] ?? names[VIB_POSITION[mode + 1]] ?? pos : pos;
}
// Param_Effects_kAmpType 0-5 (firmware). Real-file confirmation of the
// stored-value → label order is pending.
const AMP_TYPE = ['Clean', 'Twin', 'JC', 'Small', 'LP24', 'HP24'];
// Param_Effects_kLeslieSpeed 0-3 (2 bits, default 1): Stop / Slow / Fast (raw 3
// has no label and falls back to `#3`).
const ROTARY_SPEED = ['Stop', 'Slow', 'Fast'];

// Param_Syn_kVoiceMode (firmware).
const SYNTH_VOICE = ['Poly', 'Legato', 'Mono'];
// Param_Syn_kUnison (firmware).
const SYNTH_UNISON = ['Off', '1', '2', '3'];
// Param_Syn_kVibratoMode (firmware).
const SYNTH_VIBRATO = ['Off', 'Delay 1', 'Delay 2', 'Delay 3', 'Wheel', 'After Touch'];
// Param_Syn_kLFOWave (firmware).
const LFO_WAVE = ['Triangle', 'Saw', 'Neg Saw', 'Square', 'S/H'];
// ns3-mapping.js: ns3SynthOscillatorsTypeMap (Edt_Syn_kOscConf 0-14)
const OSC_CONFIG = ['None','1 Pitch','2 Shape','3 Sync','4 Detune','5 MixSin','6 MixTri','7 MixSaw','8 MixSqr','9 MixBell','10 MixNs1','11 MixNs2','12 FM1','13 FM2','14 RM'];
// ns3-mapping.js: ns3SynthOscillator1ClassicWaveTypeMap
const OSC_CLASSIC_WAVE = ['Sine','Triangle','Saw','Square','Pulse 33','Pulse 10','ESaw','ESquare'];
// ns3-mapping.js: ns3SynthOscillator1FormantWaveTypeMap
const OSC_FORMANT_WAVE = ['Formant Wave Aaa','Formant Wave Eee','Formant Wave Iii','Formant Wave Ooo','Formant Wave Uuu','Formant Wave Yyy','Formant Wave AO','Formant Wave AE','Formant Wave OE'];
// ns3-mapping.js: ns3SynthOscillator1SuperWaveTypeMap
const OSC_SUPER_WAVE = ['Super Wave Saw','Super Wave Saw 2','Super Wave Square','Super Wave Square 2','Super Wave Bright','Super Wave Bright 2','Super Wave Strings','Super Wave Organ'];
// Param_Syn_kFltKbdTrk (firmware).
const FILTER_KB_TRACK = ['Off', '1/3', '2/3', '1'];
// Param_Syn_kFltDrive (firmware).
const FILTER_DRIVE = ['Off', '1', '2', '3'];
// ns3-mapping.js: ns3SynthAmpEnvelopeVelocityMap (Param_Syn_kAmpEnvVel 0-3)
const AMP_VELOCITY = ['Off', '1', '2', '3'];
// Param_Syn_kArpRange (firmware).
const ARP_RANGE = ['1 Octave', '2 Octaves', '3 Octaves', '4 Octaves'];
// Param_Syn_kArpPattern (firmware).
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

// ns3-mapping.js: ns3SynthArpRateMap (128 entries) — free-run (non-master-clock) arp rate
const ARP_RATE: readonly string[] = [
  '16 bpm','16 bpm','18 bpm','20 bpm','24 bpm','26 bpm','28 bpm','30 bpm',
  '34 bpm','36 bpm','38 bpm','42 bpm','44 bpm','46 bpm','48 bpm','50 bpm',
  '54 bpm','56 bpm','58 bpm','60 bpm','62 bpm','64 bpm','66 bpm','68 bpm',
  '70 bpm','72 bpm','74 bpm','76 bpm','78 bpm','78 bpm','80 bpm','82 bpm',
  '84 bpm','86 bpm','86 bpm','88 bpm','90 bpm','92 bpm','94 bpm','94 bpm',
  '96 bpm','98 bpm','100 bpm','100 bpm','102 bpm','104 bpm','106 bpm','108 bpm',
  '108 bpm','110 bpm','112 bpm','114 bpm','116 bpm','118 bpm','120 bpm','122 bpm',
  '124 bpm','126 bpm','128 bpm','130 bpm','132 bpm','134 bpm','138 bpm','140 bpm',
  '142 bpm','146 bpm','148 bpm','152 bpm','154 bpm','158 bpm','162 bpm','166 bpm',
  '170 bpm','174 bpm','178 bpm','182 bpm','186 bpm','190 bpm','196 bpm','200 bpm',
  '204 bpm','210 bpm','216 bpm','220 bpm','226 bpm','232 bpm','238 bpm','244 bpm',
  '252 bpm','258 bpm','266 bpm','274 bpm','282 bpm','290 bpm','298 bpm','308 bpm',
  '318 bpm','328 bpm','338 bpm','350 bpm','362 bpm','376 bpm','392 bpm','410 bpm',
  '428 bpm','450 bpm','472 bpm','494 bpm','520 bpm','546 bpm','574 bpm','602 bpm',
  '632 bpm','662 bpm','696 bpm','728 bpm','762 bpm','798 bpm','834 bpm','872 bpm',
  '910 bpm','950 bpm','990 bpm','Fast 1','Fast 2','Fast 3','Fast 4','Fast 5',
];

const lut = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Linear 0-10 in 1 decimal place
const lin10 = (midi: number): string => (midi / 12.7).toFixed(1);

/**
 * Piano timbre (Pno_kEq, 4 bits). The firmware's label table holds three groups:
 * acoustic/digital (4 labels), Clav (8 combinations) and Electric (6, adding the
 * Dyno settings). The value is kept when the piano type changes, so real files
 * hold e.g. a Grand at 4; values 4-7 past a group read as None, as
 * ns3-program-viewer's ns3PianoTimbreMap reads them. Values past 7 fall back to `#n`.
 */
const TIMBRE_GRAND = ['None', 'Soft', 'Mid', 'Bright', 'None', 'None', 'None', 'None'];
const TIMBRE_CLAV = ['None', 'Soft', 'Treble', 'Soft+Treb', 'Brilliant', 'Soft+Brill', 'Treb+Brill', 'Soft+Trb+Brill'];
const TIMBRE_ELECTRIC = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2', 'None', 'None'];
const PIANO_ELECTRIC = 2;
const PIANO_CLAV = 3;

function pianoTimbre(bank: number, eq: number): string {
  if (bank === PIANO_ELECTRIC) return lut(TIMBRE_ELECTRIC, eq);
  if (bank === PIANO_CLAV) return lut(TIMBRE_CLAV, eq);
  return lut(TIMBRE_GRAND, eq);
}

// ── Waveform name per osc type ───────────────────────────────────────────────
// Labels per ns3-synth.js waveForm1 switch on oscillatorType. The index is ONE
// 9-bit field (Edt_Syn_kOscWave, 0-399) for every bank; indices past a bank's
// label table fall back to `#n`.
function oscWaveform(oscType: string, waveIdx: number): string {
  switch (oscType) {
    case 'Classic': return lut(OSC_CLASSIC_WAVE, waveIdx);
    case 'Wave':    return lut(OSC_WAVE_WAVE, waveIdx);
    case 'Formant': return lut(OSC_FORMANT_WAVE, waveIdx);
    case 'Super':   return lut(OSC_SUPER_WAVE, waveIdx);
    default:        return '';
  }
}

// Wave-bank waveform names (ns3-synth-oscillators docs show 46 entries).
const OSC_WAVE_WAVE = [
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

export interface Ns3Fx { name: string; type?: string; params?: Record<string, string | number> }

export interface Ns3SynthOscillator {
  /** Oscillator bank: Classic / Wave / Formant / Super / Sample (Edt_Syn_kOscBank). */
  type: string;
  /** Waveform name for the bank (blank for Sample); Edt_Syn_kOscWave, one 9-bit index. */
  waveform: string;
  /** Dual-osc configuration (Edt_Syn_kOscConf, 0-14). */
  config: string;
  /** Osc 2 pitch in semitones, −12 = Sub … +48 (Edt_Syn_kDualOscDetune 0-60, 12 = 0). */
  pitch: string;
}

export interface Ns3SynthEnv {
  /** Attack time. */
  attack: string;
  /** Decay time ("Sustain" at max for the decays). */
  decay: string;
  /** Release time ("Inf" at max for the mod env release). */
  release: string;
}

export interface Ns3SynthFilter {
  /** Filter type (Param_Syn_kFltType). */
  type: string;
  /** Cutoff frequency (Param_Syn_kFltFreq). */
  cutoff: string;
  /** Resonance 0-10, or the HP cutoff for LP+HP (Param_Syn_kFltRes). */
  resonance: string;
  /** Keyboard tracking (Param_Syn_kFltKbdTrk). */
  kbTrack: string;
  /** Drive (Param_Syn_kFltDrive). */
  drive: string;
}

export interface Ns3SynthLfo {
  /** LFO waveform (Param_Syn_kLFOWave). */
  wave: string;
  /** LFO rate, Hz or master-clock division (Param_Syn_kLFORateClkDiv). */
  rate: string;
  /** Rate synced to the master clock (Param_Syn_kLFOClkEnable). */
  masterClock: boolean;
}

export interface Ns3SynthArp {
  /** Arpeggiator running (Param_Syn_kArpRun). */
  on: boolean;
  /** Octave range (Param_Syn_kArpRange). */
  range: string;
  /** Pattern (Param_Syn_kArpPattern). */
  pattern: string;
  /** Rate, bpm or master-clock division (Param_Syn_kArpRateClkDiv). */
  rate: string;
  /** Rate synced to the master clock (Param_Syn_kArpClkEnable). */
  masterClock: boolean;
}

export interface Ns3Synth {
  on: boolean;
  volume: string;
  /** Poly / Legato / Mono (Param_Syn_kVoiceMode). */
  voice: string;
  /** Glide 0-10 (Param_Syn_kGlideRate). */
  glide: string;
  /** Unison Off/1/2/3 (Param_Syn_kUnison). */
  unison: string;
  /** Vibrato mode (Param_Syn_kVibratoMode). */
  vibrato: string;
  oscillator: Ns3SynthOscillator;
  filter: Ns3SynthFilter;
  lfo: Ns3SynthLfo;
  envMod: Ns3SynthEnv;
  envAmp: Ns3SynthEnv & { velocity: string };
  arp: Ns3SynthArp;
  /** Factory sample reference (only meaningful when osc === 'Sample'); Param_Syn_kSmpNameHash. */
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
    /** Octave shift (Param_Org_kOctaveShift). */
    octaveShift: number;
    /** Vibrato/Chorus: the active preset's switch + the program-wide mode, labelled per organ model. */
    vibChorus: { on: boolean; mode: string };
    /** Percussion (B3): on + 3rd-harmonic / fast-decay / soft-volume flags. */
    percussion: { on: boolean; third: boolean; fast: boolean; soft: boolean };
  };
  piano: {
    on: boolean; type: string; volume: string;
    /** Factory sample reference: 32-bit name hash + variation. Resolve via library/service. */
    sampleId: number; sampleVariation: number;
    /** Piano timbre (Param_Pno_kEq, 4 bits). */
    timbre: string;
    /** Octave shift (Param_Pno_kOctaveShift). */
    octaveShift: number;
  };
  synth: Ns3Synth;
  /** Effects switched on in this panel, in signal order. */
  fx: Ns3Fx[];
}

export interface Ns3Program {
  /** The active panels (A and/or B), per the program-wide slot enable. */
  panels: Ns3Panel[];
  /** Program name — not stored in the file; injected from the filename. */
  name?: string;
}

/**
 * What {@link decodeNs3} returns: the panel shape plus the firmware-layout read
 * it was built from (every field in `values`, the format version, warnings).
 */
export interface Ns3File extends FwProgram<Ns3FieldKey>, Ns3Program {
  readonly format: 'ns3f';
}

type Slot = 'A' | 'B';
/** The field names inside a slot block, e.g. FieldOf<'synth'> = 'oscBank' | … */
type FieldOf<B extends string> = Ns3FieldKey extends infer K ? (K extends `${B}A.${infer F}` ? F : never) : never;
type Values = Partial<Record<Ns3FieldKey, number>>;

const DEFAULTS = new Map<Ns3FieldKey, number>(NS3_LAYOUT.fields.map((f) => [f.key, f.def]));

/** A field's value; a field a shortened block left out reads as its firmware default. */
function reader(v: Values) {
  return (key: Ns3FieldKey): number => v[key] ?? DEFAULTS.get(key) ?? 0;
}
type Get = ReturnType<typeof reader>;

/** Engine level 0-127 → the Nord dB display. */
const db = (level: number): string => NORD_DB[level] ?? '?';

function organ(get: Get, s: Slot): Ns3Panel['organ'] {
  const model = get(`organ${s}.model`);
  // Org_kPresetFocus is 2 bits (0-3); its low bit selects Preset II, as the
  // corpus decoder read it (the meaning of 2/3 is not known).
  const preset = (get(`organ${s}.presetFocus`) & 1) === 1 ? `organPresetII${s}` as const : `organPresetI${s}` as const;
  return {
    on: get(`organ${s}.enable`) === 1,
    type: lut(ORGAN_TYPE, model),
    volume: db(get(`organ${s}.level`)),
    drawbars: DRAWBAR_NUMBERS.map((n) => get(`${preset}.db${n}`)),
    octaveShift: get(`organ${s}.octaveShift`),
    // The vibrato/chorus mode is program-wide (MultiCommon), its labels per organ model.
    vibChorus: { on: get(`${preset}.vibratoEnable`) === 1, mode: vibChorusLabel(model, get('common.orgVibratoType')) },
    percussion: {
      on: get(`${preset}.b3PercEnable`) === 1,
      third: get(`${preset}.b3PercHarmonic`) === 1,
      fast: get(`${preset}.b3PercSpeed`) === 1,
      soft: get(`${preset}.b3PercLevel`) === 1,
    },
  };
}

function piano(get: Get, s: Slot): Ns3Panel['piano'] {
  const bank = get(`piano${s}.bank`);
  return {
    on: get(`piano${s}.enable`) === 1,
    type: lut(PIANO_TYPE, bank),
    volume: db(get(`piano${s}.level`)),
    sampleId: get(`piano${s}.nameHash`),
    sampleVariation: get(`piano${s}.variation`),
    timbre: pianoTimbre(bank, get(`piano${s}.eq`)),
    octaveShift: get(`piano${s}.octaveShift`),
  };
}

function synth(get: Get, s: Slot): Ns3Synth {
  const y = (k: FieldOf<'synth'>) => get(`synth${s}.${k}`);
  const oscType = lut(SYNTH_OSC, y('oscBank'));
  // Osc 2 pitch: 0-60 stored, 12 = unison → −12 (Sub) … +48 semitones.
  const osc2Pitch = y('dualOscDetune') - 12;
  const pitch = osc2Pitch === -12 ? 'Sub' : `${osc2Pitch > 0 ? '+' : ''}${osc2Pitch} semi`;

  const filterType = lut(SYNTH_FILTER, y('fltType'));
  const cutoff = lut(NS3_FILTER_FREQ, y('fltFreq'));
  // For LP+HP the resonance knob sets the HP cutoff.
  const resonance = filterType === 'LP+HP' ? lut(NS3_FILTER_FREQ, y('fltRes')) : lin10(y('fltRes'));

  const lfoMC = y('lfoClkEnable') === 1;
  const arpMC = y('arpClkEnable') === 1;
  const modDecay = y('modEnvDcy');
  const modRelease = y('modEnvRls');
  const ampDecay = y('ampEnvDcy');

  return {
    on: get(`synthCommon${s}.enable`) === 1,
    volume: db(get(`synthCommon${s}.level`)),
    voice: lut(SYNTH_VOICE, y('voiceMode')),
    glide: lin10(y('glideRate')),
    unison: lut(SYNTH_UNISON, y('unison')),
    vibrato: lut(SYNTH_VIBRATO, y('vibratoMode')),
    oscillator: {
      type: oscType,
      waveform: oscWaveform(oscType, y('oscWave')),
      config: lut(OSC_CONFIG, y('oscConf')),
      pitch,
    },
    filter: {
      type: filterType,
      cutoff,
      resonance,
      kbTrack: lut(FILTER_KB_TRACK, y('fltKbdTrk')),
      drive: lut(FILTER_DRIVE, y('fltDrive')),
    },
    lfo: {
      wave: lut(LFO_WAVE, y('lfoWave')),
      rate: lut(lfoMC ? LFO_RATE_MC : LFO_RATE, y('lfoRateClkDiv')),
      masterClock: lfoMC,
    },
    envMod: {
      attack: lut(ENV_ATTACK, y('modEnvAtc')),
      decay: modDecay === 127 ? 'Sustain' : lut(ENV_DECAY_REL, modDecay),
      release: modRelease === 127 ? 'Inf' : lut(ENV_DECAY_REL, modRelease),
    },
    envAmp: {
      attack: lut(ENV_ATTACK, y('ampEnvAtc')),
      decay: ampDecay === 127 ? 'Sustain' : lut(ENV_DECAY_REL, ampDecay),
      release: lut(ENV_DECAY_REL, y('ampEnvRls')),
      velocity: lut(AMP_VELOCITY, y('ampEnvVel')),
    },
    arp: {
      on: y('arpRun') === 1,
      range: lut(ARP_RANGE, y('arpRange')),
      pattern: lut(ARP_PATTERN, y('arpPattern')),
      rate: lut(arpMC ? ARP_RATE_MC : ARP_RATE, y('arpRateClkDiv')),
      masterClock: arpMC,
    },
    sampleId: y('smpNameHash'),
    // v1-compat aliases
    osc: oscType,
    filter_type: filterType,
    cutoff,
  };
}

/** The effects this panel has switched on, in signal order, with type and parameters. */
function effects(get: Get, s: Slot): Ns3Fx[] {
  const e = (k: FieldOf<'effects'>) => get(`effects${s}.${k}`);
  const fx: Ns3Fx[] = [];
  // Rotary speed is program-wide (MultiCommon Param_Effects_kLeslieSpeed, 2 bits).
  if (e('leslieEnable')) fx.push({ name: 'Rotary', params: { speed: lut(ROTARY_SPEED, get('common.leslieSpeed')) } });
  if (e('fx1Enable')) {
    fx.push({ name: 'Effect 1', type: lut(EFFECT1_TYPE, e('fx1Type')), params: { rate: e('fx1RateClkDiv'), amount: lin10(e('fx1Amt')) } });
  }
  if (e('fx2Enable')) {
    fx.push({ name: 'Effect 2', type: lut(EFFECT2_TYPE, e('fx2Type')), params: { rate: e('fx2Rate'), amount: lin10(e('fx2Amt')) } });
  }
  // Amp EQ bands are −60…+60 (stored value − min, already applied by the layout).
  if (e('ampEnable')) {
    fx.push({ name: 'Amp/EQ', type: lut(AMP_TYPE, e('ampType')), params: { treble: e('ampTreble'), mid: e('ampMid'), bass: e('ampBass') } });
  }
  if (e('cmpEnable')) fx.push({ name: 'Comp', params: { amount: lin10(e('cmpAmt')) } });
  if (e('dlyEnable')) fx.push({ name: 'Delay', params: { feedback: lin10(e('dlyFeedback')), mix: lin10(e('dlyMix')) } });
  if (e('rvbEnable')) fx.push({ name: 'Reverb', type: lut(REVERB_TYPE, e('rvbType')), params: { amount: lin10(e('rvbAmt')) } });
  return fx;
}

function panel(get: Get, id: Slot): Ns3Panel {
  return { id, piano: piano(get, id), organ: organ(get, id), synth: synth(get, id), fx: effects(get, id) };
}

/**
 * Parameters added inside 3.x took reserved (zero) bits; on loading an older 3.x
 * file the firmware sets them to their defaults (version fix-ups, FUN_c007dd14).
 * Two more fix-ups are not applied here because what they compute isn't known:
 * the delay rate of a 3.00 file (rescaled to 14 bits) and the Dual-KB style
 * before 3.02.
 */
const ADDED_IN: readonly { before: number; keys: readonly Ns3FieldKey[] }[] = [
  { before: 303, keys: ['common.pitchStickRange'] },               // id 157
  { before: 304, keys: ['externA.volPedalEnable', 'externB.volPedalEnable'] }, // id 245
];

/** Fields a body of `formatVersion` does not store yet: the firmware loads them at their defaults. */
export function ns3FieldsAbsent(formatVersion: number): Ns3FieldKey[] {
  return ADDED_IN.filter((a) => formatVersion < a.before).flatMap((a) => a.keys);
}

function withVersionDefaults(values: Values, formatVersion: number): Values {
  const absent = ns3FieldsAbsent(formatVersion);
  if (absent.length === 0) return values;
  const out = { ...values };
  for (const k of absent) out[k] = DEFAULTS.get(k) ?? 0;
  return out;
}

/** Lowest body format the layout describes; 2.0x bodies (converted by the Nord on load) differ. */
const FIRST_LAYOUT_VERSION = NS3_LAYOUT.versionRange?.[0] ?? 300;

/** Decode a Stage 3 program into its active panel(s), plus every layout field in `values`. */
export function decodeNs3(bytes: Uint8Array): Ns3File {
  const fw = decodeFwProgram(bytes, NS3_LAYOUT);
  let { layoutMatched, values, warnings } = fw;
  const v = fw.formatVersion;
  if (layoutMatched && v !== null && v < FIRST_LAYOUT_VERSION) {
    // A 2.0x body: Piano, SynthCommon and Organ have other sizes and fields
    // (firmware "Multi v1" registry), so reading it with the 3.x layout would misplace values.
    layoutMatched = false;
    values = {};
    warnings = [
      `This program uses the Stage 3's format ${(v / 100).toFixed(2)} from an early OS, which the Nord converts ` +
      `when it loads it. OpenNord reads formats ${(FIRST_LAYOUT_VERSION / 100).toFixed(2)}–` +
      `${((NS3_LAYOUT.versionRange?.[1] ?? 304) / 100).toFixed(2)}; showing the file header only.`,
    ];
  }

  if (layoutMatched && v !== null) values = withVersionDefaults(values, v);

  const panels: Ns3Panel[] = [];
  if (layoutMatched) {
    const get = reader(values);
    // Param_Com_kSlotEnable 1-3: bit 0 = slot A, bit 1 = slot B.
    const slots = get('common.slotEnable');
    if (slots === 1 || slots === 3) panels.push(panel(get, 'A'));
    if (slots === 2 || slots === 3) panels.push(panel(get, 'B'));
  }
  return { ...fw, format: 'ns3f', layoutMatched, values, warnings, panels };
}
