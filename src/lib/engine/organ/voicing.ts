/**
 * Per-model voicing: which tone generators a key feeds, at what level, and how
 * the model's keying behaves (attack, release, contact scatter, click/chiff).
 *
 * Every model is expressed as a fixed bank of always-running tone generators
 * that keys switch onto shared mix buses — the way the real instruments work:
 * a tonewheel organ's 91 wheels, a transistor organ's divider chain, a pipe
 * rank's one pipe per pitch. Two keys that need the same generator share it, so
 * the per-sample cost depends on how many distinct pitches sound, never on the
 * number of keys held.
 *
 * Only the B3 tonewheel voicing follows the real instrument closely (see
 * tonewheel.ts). Vox, Farfisa and pipe voicings are clearly labelled
 * approximations built from general organ knowledge (stop names, footages,
 * waveform families); they are NOT measurements of Nord's models.
 */
import {
  COMPLEX_WHEELS, DRAWBAR_1FT, MANUAL_LOWEST_WHEEL, drawbarGain, equalTempered,
  tonewheelFrequency, wheelFor,
} from './tonewheel';
import type { OrganModel, OrganParams } from './types';

/** A generator's frequency and harmonic recipe (amplitude of harmonic 1, 2, 3…). */
export interface Tone { freq: number; timbre: string; harmonics: readonly number[] }

export interface ModelVoicing {
  model: OrganModel;
  /** Contact buses per key (one per drawbar / tab / stop group). */
  buses: number;
  /** Generator spec for a generator id produced by {@link route}. */
  tone(gen: number): Tone;
  /** Append [gen, gain, gen, gain, …] for one closed bus of one sounding key. */
  route(midi: number, bus: number, p: OrganParams, out: number[]): void;
  attackMs: number;
  releaseMs: number;
  /** Release with the organ Sustain switch on. */
  sustainReleaseMs: number;
  /** Max random spread of the per-bus key contacts (0 = all buses switch together). */
  contactScatterMs: number;
  /** Tonewheel key click on each contact (scaled by the keyClick param). */
  keyClick: boolean;
  /** Pipe "chiff": a short breathy noise at note start, 0 = none. */
  chiff: number;
  /** Supports B3-style single-trigger percussion. */
  percussion: boolean;
  /** Lowest tonewheel the model reaches (13 on manuals, 1 for true bass). */
  lowestWheel: number;
  /** Vibrato rate (Hz) and LFO shape for the vib/chorus section. */
  vibRateHz: number;
  vibShape: 'triangle' | 'sine';
  /**
   * Output level (linear, at 0 dB volume). Set with {@link HEADROOM} so a
   * ten-note chord on every drawbar peaks below the soft clip's 0.6 knee, before
   * the clip, on every model; fewer keys or drawbars are quieter, as on the
   * real instruments.
   */
  level: number;
}

// ── Timbres (harmonic amplitude recipes) ───────────────────────────────────
/*
 * Tonewheel waveforms, as harmonic amplitudes relative to the fundamental. They
 * follow the Stage 4's own wheel shapes (docs/ORGAN-ENGINE.md, "The Stage 4's own
 * organ"), summarized as a few rounded harmonic levels:
 *   wheels 1–12   strong odd harmonics: h2 −16.5, h3 −5.6, h4 −24, h5 −12.3,
 *                 h7 −19, h9 −26 dB (the pedal-range wheels);
 *   wheels 13–16  h2 −15.7, h3 −31.5, h4 −44 dB;
 *   wheels 17–24  h2 −19, h3 −37, h4 −45 dB;
 *   wheels 25–91  close to a sine: h2 −35, h3 −55 dB.
 */
const COMPLEX_WHEEL = [1, 0.15, 0.525, 0.061, 0.243, 0.009, 0.11, 0.013, 0.05, 0.014, 0.021] as const;
const LOW_WHEEL = [1, 0.164, 0.027, 0.006] as const;
const LOW_MID_WHEEL = [1, 0.112, 0.014, 0.006] as const;
const UPPER_WHEEL = [1, 0.018, 0.0018] as const;

/** Waveform (timbre name + harmonics) of tonewheel `wheel` (1..91). */
function wheelTone(wheel: number): { timbre: string; harmonics: readonly number[] } {
  if (wheel <= COMPLEX_WHEELS) return { timbre: 'wheel-complex', harmonics: COMPLEX_WHEEL };
  if (wheel <= 16) return { timbre: 'wheel-low', harmonics: LOW_WHEEL };
  if (wheel <= 24) return { timbre: 'wheel-low-mid', harmonics: LOW_MID_WHEEL };
  return { timbre: 'wheel-upper', harmonics: UPPER_WHEEL };
}

function series(n: number, f: (h: number) => number): number[] {
  return Array.from({ length: n }, (_, i) => f(i + 1));
}
const FLUTE = [1, 0.12, 0.05, 0.02];
const STOPPED = [1, 0, 0.3, 0, 0.12, 0, 0.05];           // stopped pipe / bourdon: odd harmonics
const PRINCIPAL = [1, 0.55, 0.35, 0.22, 0.14, 0.09, 0.06, 0.04];
const REED = series(24, (h) => 1 / h);                    // bright, sawtooth-like
const MELLOW = series(12, (h) => (h % 2 ? 1 / (h * h) : 0)); // soft, triangle-like
const OBOE = series(16, (h) => (h >= 2 && h <= 4 ? 0.9 : 1 / h) * (h === 1 ? 0.6 : 1));
const TRUMPET = series(20, (h) => (h <= 6 ? 0.8 + 0.05 * h : 3 / h));
const STRINGS = series(32, (h) => (h === 1 ? 0.35 : 1 / Math.sqrt(h)) * 0.6);

/*
 * Output headroom: one fixed trim on every model's level (keeping the balance
 * between models). Measured pre-clip with renderOffline at 48 kHz, 0 dB volume,
 * vibrato/chorus C3 on, a ten-note chord with all nine drawbars out: B3 peaks at
 * about 6–7× its level step (summed shared wheels), the other models at about
 * 2.4–4.8×. −22 dB brings the B3 to about 0.5–0.56 and the rest to ≤ 0.4, so
 * the soft clip only catches transients (core.test.ts pins this). A single key
 * on 888000000 then peaks about −33 dBFS.
 */
const HEADROOM = 10 ** (-22 / 20);

/** Generator id layout for non-tonewheel banks: timbre × 128 + MIDI pitch. */
const id = (timbre: number, midi: number) => timbre * 128 + midi;
const idTimbre = (gen: number) => Math.floor(gen / 128);
const idMidi = (gen: number) => gen % 128;

/** Fold a pitch into [lo, hi] an octave at a time (divider / rank breaks). */
function foldMidi(midi: number, lo: number, hi: number): number {
  let m = midi;
  while (m > hi) m -= 12;
  while (m < lo) m += 12;
  return m;
}

// ── B3 tonewheel ────────────────────────────────────────────────────────────
function tonewheelVoicing(model: 'B3' | 'B3 BASS'): ModelVoicing {
  const lowestWheel = model === 'B3 BASS' ? 1 : MANUAL_LOWEST_WHEEL;
  return {
    model,
    buses: 9,
    tone: (wheel) => ({ freq: tonewheelFrequency(wheel), ...wheelTone(wheel) }),
    route(midi, bus, p, out) {
      // Percussion borrows the 1′ key contact: the 1′ drawbar falls silent while it is on.
      if (bus === DRAWBAR_1FT && p.percussion.on && model === 'B3') return;
      const g = drawbarGain(p.drawbars[bus] ?? 0);
      if (g > 0) out.push(wheelFor(midi, bus, lowestWheel), g);
    },
    attackMs: 0.15,
    releaseMs: 0.3,
    sustainReleaseMs: 500,
    contactScatterMs: 3,
    keyClick: true,
    chiff: 0,
    percussion: model === 'B3',
    lowestWheel,
    vibRateHz: 6.9, // scanner: ~7 Hz, triangle sweep of a ~1 ms delay line
    vibShape: 'triangle',
    level: 0.11 * HEADROOM,
  };
}

// ── Vox-style transistor organ (approximation) ─────────────────────────────
// Footage drawbars 16′, 8′, 4′ and a IV mixture (2⅔′+2′+1⅗′+1′), shaped by two
// tone-colour drawbars: a mellow "flute" path and a bright "reed" path. Drawbars
// 7–9 are not voiced (see docs/ORGAN-ENGINE.md, open questions).
const VOX_FOOTAGES: readonly (readonly number[])[] = [[-12], [0], [12], [19, 24, 28, 36]];
const VOX_TIMBRES = [{ name: 'vox-flute', h: MELLOW }, { name: 'vox-reed', h: REED }] as const;

const voxVoicing: ModelVoicing = {
  model: 'VOX',
  buses: VOX_FOOTAGES.length,
  tone: (gen) => {
    const t = VOX_TIMBRES[idTimbre(gen)];
    return { freq: equalTempered(idMidi(gen)), timbre: t.name, harmonics: t.h };
  },
  route(midi, bus, p, out) {
    const foot = drawbarGain(p.drawbars[bus] ?? 0);
    if (foot <= 0) return;
    // Tone colours (timbre 0 = flute, 1 = reed); no per-call arrays — this runs on the audio thread.
    const flute = drawbarGain(p.drawbars[4] ?? 0);
    const reed = drawbarGain(p.drawbars[5] ?? 0) * 0.6;
    const parts = VOX_FOOTAGES[bus];
    for (const semis of parts) {
      const m = foldMidi(midi + semis, 24, 120);
      if (flute > 0) out.push(id(0, m), (foot * flute) / Math.sqrt(parts.length));
      if (reed > 0) out.push(id(1, m), (foot * reed) / Math.sqrt(parts.length));
    }
  },
  attackMs: 2,
  releaseMs: 8,
  sustainReleaseMs: 500,
  contactScatterMs: 0,
  keyClick: false,
  chiff: 0,
  percussion: false,
  lowestWheel: MANUAL_LOWEST_WHEEL,
  // The Stage 4's Vox vibrato is a ~6.1 Hz triangle (docs/ORGAN-ENGINE.md).
  vibRateHz: 6.1,
  vibShape: 'triangle',
  level: 0.1 * HEADROOM,
};

// ── Farfisa-style transistor organ (approximation) ─────────────────────────
// Nine on/off tabs in the classic compact-organ order.
const FARF_TABS: readonly { semis: number; timbre: number; gain: number }[] = [
  { semis: -12, timbre: 0, gain: 0.8 }, // Bass 16′
  { semis: -12, timbre: 3, gain: 0.7 }, // Strings 16′
  { semis: 0, timbre: 0, gain: 0.8 },   // Flute 8′
  { semis: 0, timbre: 1, gain: 0.7 },   // Oboe 8′
  { semis: 0, timbre: 2, gain: 0.7 },   // Trumpet 8′
  { semis: 0, timbre: 3, gain: 0.7 },   // Strings 8′
  { semis: 12, timbre: 0, gain: 0.7 },  // Flute 4′
  { semis: 12, timbre: 3, gain: 0.6 },  // Strings 4′
  { semis: 19, timbre: 0, gain: 0.6 },  // 2⅔′
];
const FARF_TIMBRES = [
  { name: 'farf-flute', h: FLUTE }, { name: 'farf-oboe', h: OBOE },
  { name: 'farf-trumpet', h: TRUMPET }, { name: 'farf-strings', h: STRINGS },
] as const;

const farfVoicing: ModelVoicing = {
  model: 'FARF',
  buses: FARF_TABS.length,
  tone: (gen) => {
    const t = FARF_TIMBRES[idTimbre(gen)];
    return { freq: equalTempered(idMidi(gen)), timbre: t.name, harmonics: t.h };
  },
  route(midi, bus, p, out) {
    if ((p.drawbars[bus] ?? 0) < 4) return; // a tab is either down or up
    const tab = FARF_TABS[bus];
    out.push(id(tab.timbre, foldMidi(midi + tab.semis, 24, 120)), tab.gain);
  },
  attackMs: 1.5,
  releaseMs: 6,
  sustainReleaseMs: 500,
  contactScatterMs: 0,
  keyClick: false,
  chiff: 0,
  percussion: false,
  lowestWheel: MANUAL_LOWEST_WHEEL,
  vibRateHz: 6.2,
  vibShape: 'sine',
  level: 0.1 * HEADROOM,
};

// ── Pipe organ (approximation) ─────────────────────────────────────────────
// Each drawbar is a stop at the B3 footages; mutations sound at pure ratios
// (3:2, 3, 5, 6) as real pipe ranks do. Ranks break back an octave rather than
// run off the top. Pipe 1 leans on principals, Pipe 2 on flutes.
const PIPE_RATIO = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8];
const PIPE1_RANKS = [STOPPED, FLUTE, PRINCIPAL, PRINCIPAL, FLUTE, PRINCIPAL, FLUTE, FLUTE, PRINCIPAL];
const PIPE2_RANKS = [STOPPED, STOPPED, FLUTE, FLUTE, FLUTE, FLUTE, FLUTE, FLUTE, FLUTE];

function pipeVoicing(model: 'PIPE1' | 'PIPE2'): ModelVoicing {
  const ranks = model === 'PIPE1' ? PIPE1_RANKS : PIPE2_RANKS;
  return {
    model,
    buses: 9,
    tone: (gen) => {
      const rank = idTimbre(gen);
      return {
        freq: equalTempered(idMidi(gen)) * PIPE_RATIO[rank],
        timbre: `${model.toLowerCase()}-rank${rank}`,
        harmonics: ranks[rank],
      };
    },
    route(midi, bus, p, out) {
      const g = drawbarGain(p.drawbars[bus] ?? 0);
      if (g <= 0) return;
      // Keep every rank between ~30 Hz and ~8 kHz by breaking back an octave.
      let m = midi;
      while (equalTempered(m) * PIPE_RATIO[bus] > 8000) m -= 12;
      while (equalTempered(m) * PIPE_RATIO[bus] < 30) m += 12;
      // A ±2 octave shift can still push m out of the id's 0..127 pitch field
      // (PIPE1 at −2 octaves on A0 gives −3); fold it back in by octaves.
      out.push(id(bus, foldMidi(m, 0, 127)), g);
    },
    attackMs: model === 'PIPE1' ? 35 : 55,
    releaseMs: 90,
    sustainReleaseMs: 900,
    contactScatterMs: 0,
    keyClick: false,
    chiff: model === 'PIPE1' ? 0.05 : 0.03,
    percussion: false,
    lowestWheel: MANUAL_LOWEST_WHEEL,
    vibRateHz: 5.2, // tremulant-like
    vibShape: 'sine',
    level: 0.09 * HEADROOM,
  };
}

const VOICINGS: Record<OrganModel, ModelVoicing> = {
  B3: tonewheelVoicing('B3'),
  'B3 BASS': tonewheelVoicing('B3 BASS'),
  VOX: voxVoicing,
  FARF: farfVoicing,
  PIPE1: pipeVoicing('PIPE1'),
  PIPE2: pipeVoicing('PIPE2'),
};

export function voicingFor(model: OrganModel): ModelVoicing {
  return VOICINGS[model] ?? VOICINGS.B3;
}
