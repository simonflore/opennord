/**
 * OpenNord's side of a recording comparison (the maintainers’ notes, "Comparing a
 * recording"): render the note the user played with OpenNord's own engines, measure both
 * with `analysis.ts`, and lay the deltas out in a compact table.
 *
 * - **Organ:** `renderOffline` from the program's organ layer or from drawbar flags.
 * - **Piano:** the stroke the instrument would pick, decoded from the user's own local
 *   `.npno` (key-map root + 4 semitones, touch → attenuation → layer, level word, loop decay,
 *   damper), resampled to the recording's rate. The factory audio is decoded in memory on
 *   the user's machine and never written anywhere unless they ask for the render
 *   (`docs/LEGAL.md`).
 * - **Synth:** the synth preview of a program's synth layer (ANALOG Pure waves only).
 */
import {
  centsBetween, estimateF0, measure, noteName, pickChannel, segmentNotes, levels, spectralCentroid,
  type ChannelPick, type Measurement, type MeasureOptions,
} from './analysis';
import { renderOffline } from '../engine/organ/core';
import { DEFAULT_ORGAN_PARAMS, ORGAN_ENGINE_MODELS, type OrganModel, type OrganParams } from '../engine/organ/types';
import { parseVibChorus } from '../engine/organ/params';
import { renderSynthPreview, type SynthPreviewParams } from '../ns4/synth-preview';
import {
  decodeNspStroke, findCnsp, NSP_ENVELOPE_RATE, NSP_SAMPLE_RATE, readLayerTable, readNspDirectory, strokeFor, touchAttenuation,
} from '../ns4/nsp-audio';
import { NSP_ROOT_OFFSET } from '../ns4/nsp';

/** OpenNord's render of the note, at the recording's sample rate. */
export interface Reference {
  label: string;
  sampleRate: number;
  channels: Float32Array[];
  /** What the render assumes, for the report. */
  notes: string[];
}

/** The L/R average of a render (as `pickChannel(…, 'mix')` does for a recording). */
export const referenceMono = (r: Reference): Float32Array => (r.channels.length === 1 ? r.channels[0] : pickChannel(r));

// ── Organ ────────────────────────────────────────────────────────────────────────────────

export interface OrganFlags {
  /** Nine digits 0–8, e.g. "888000000". */
  drawbars?: string;
  /** "off", or comma-separated: 2nd|3rd, fast|slow, normal|soft (e.g. "2nd,fast,normal"). */
  perc?: string;
  /** "off" or V1–V3 / C1–C3. */
  vib?: string;
  /** Key click 0–1 (OpenNord's own scale; the instrument's Click Level is a system setting). */
  click?: number;
  model?: string;
}

/** Organ parameters from command-line flags (B3 888000000, no percussion, no vibrato by default). */
export function organParamsFromFlags(f: OrganFlags): OrganParams {
  const p: OrganParams = {
    ...DEFAULT_ORGAN_PARAMS,
    percussion: { ...DEFAULT_ORGAN_PARAMS.percussion },
    vibrato: { on: false, type: 'C3' },
  };
  if (f.model) {
    const m = ORGAN_ENGINE_MODELS.find((x) => x.toLowerCase() === f.model!.toLowerCase());
    if (!m) throw new Error(`Unknown organ model "${f.model}" (use ${ORGAN_ENGINE_MODELS.join(', ')}).`);
    p.model = m as OrganModel;
  }
  if (f.drawbars !== undefined) {
    if (!/^[0-8]{9}$/.test(f.drawbars)) throw new Error('Drawbars are nine digits 0–8, e.g. 888000000.');
    p.drawbars = [...f.drawbars].map(Number);
  }
  if (f.perc && f.perc.toLowerCase() !== 'off') {
    const words = f.perc.toLowerCase().split(/[,\s]+/);
    p.percussion = {
      on: true,
      harm3rd: words.includes('3rd'),
      decayFast: !words.includes('slow'),
      volSoft: words.includes('soft'),
    };
  }
  if (f.vib && f.vib.toLowerCase() !== 'off') {
    const t = parseVibChorus(f.vib);
    if (!t) throw new Error(`Vibrato/chorus is V1–V3 or C1–C3 (got "${f.vib}").`);
    p.vibrato = { on: true, type: t };
  }
  if (f.click !== undefined) p.keyClick = Math.max(0, Math.min(1, f.click));
  return p;
}

export function describeOrgan(p: OrganParams): string {
  const perc = p.percussion.on
    ? `perc ${p.percussion.harm3rd ? '3rd' : '2nd'} ${p.percussion.decayFast ? 'fast' : 'slow'} ${p.percussion.volSoft ? 'soft' : 'normal'}`
    : 'perc off';
  return `${p.model} ${p.drawbars.map((d) => Math.round(d)).join('')}, ${perc}, ${p.vibrato.on ? p.vibrato.type : 'vib off'}, click ${p.keyClick}`;
}

/** The organ engine's render: key down at 0, up at `holdS`. No rotary or effects. */
export function organReference(p: OrganParams, key: number, holdS: number, totalS: number, sampleRate: number): Reference {
  const out = renderOffline(p, [[0, 'on', key], [holdS, 'off', key]], totalS, sampleRate);
  return {
    label: 'OpenNord organ', sampleRate, channels: [out],
    notes: [`${describeOrgan(p)}; no rotary or effects (switch them off on the Nord for this comparison)`],
  };
}

// ── Synth ────────────────────────────────────────────────────────────────────────────────

/** The synth preview's render of one held note, padded to `totalS`. */
export function synthReference(p: SynthPreviewParams, key: number, holdS: number, totalS: number, sampleRate: number): Reference {
  const r = renderSynthPreview(p, { note: key, sampleRate, holdSeconds: holdS, maxSeconds: totalS });
  const out = new Float32Array(Math.round(totalS * sampleRate));
  out.set(r.subarray(0, out.length));
  const f = p.filter;
  return {
    label: 'OpenNord synth preview', sampleRate, channels: [out],
    notes: [
      `${p.wave}, amp env A ${p.ampEnv.attack}s D ${p.ampEnv.decay}s R ${p.ampEnv.release}s` +
        (f ? `; ${f.type} ${Math.round(f.cutoffHz)} Hz, res ${f.resonance.toFixed(2)}, env ${f.envOctaves} oct (assumed octaves)` : '; filter off'),
      'no LFO, unison, velocity or effects in the preview: switch them off on the Nord for this comparison',
    ],
  };
}

// ── Piano ────────────────────────────────────────────────────────────────────────────────

/** The pitch hypotheses the piano test separates. */
export interface PitchHypothesis {
  id: 'A' | 'B' | 'C';
  label: string;
  hz: number;
}

export interface PianoStrokeInfo {
  zone: number;
  /** Layer within the zone, 0 = loudest. */
  layer: number;
  layers: number;
  /** Key-map root (the recording sounds 4 semitones above it). */
  storedRoot: number;
  /** f0 of the decoded stroke at 44.1 kHz. */
  recordedHz?: number;
  /** Attenuation the velocity maps to (0.2 dB steps, OpenNord's approximate Touch curve). */
  att: number;
  floorDb: number;
  levelWord: number;
  /** Output gain the level formula predicts (dB, before the instrument's master volume). */
  predictedGainDb: number;
  /** Loop sustain decay (dB/s), when the stroke loops. */
  loopDecayDbPerS?: number;
  /** Damper index (record +0x72) and its T60. */
  damperIndex: number;
  damperT60S: number;
  releaseMode: number;
}

export interface PianoReference extends Reference {
  stroke: PianoStrokeInfo;
  pitch: PitchHypothesis[];
}

export interface PianoOptions {
  key: number;
  /** MIDI velocity 1–127 (default 100). */
  velocity?: number;
  /** Force a layer (0 = loudest) instead of picking it by velocity. */
  layer?: number;
  /** Selection offset added to the attenuation (0.2 dB steps); the note-on path adds 20. */
  selectOffset?: number;
  holdS: number;
  totalS: number;
  sampleRate: number;
  /** Which pitch hypothesis to render (default A, the plain formula without +27 c). */
  pitchModel?: 'A' | 'B' | 'C';
}

/** Effects/converter clock the effects DSP designs for. */
export const CLOCK_43K = 43402.34375;
/** Damper T60 for index i. */
const damperT60 = (i: number) => 0.0015 * 10 ** (i / 20);
const int8 = (b: number) => (b > 127 ? b - 256 : b);

/**
 * Render the stroke a key plays, the way the maintainers’ notes describes the instrument:
 * key map → zone, velocity → attenuation (+20) → layer, pitch = 100·(key − root − 4) cents plus
 * the key's stretch tuning (never above the recording), level word + attenuation + header
 * trims → gain, loop decay (+0x2E) inside the loop, damper (+0x72) after key-up.
 */
export function pianoReference(npno: Uint8Array, o: PianoOptions): PianoReference {
  const cnsp = findCnsp(npno);
  const dir = readNspDirectory(npno);
  if (cnsp < 0 || !dir) throw new Error('This file is not a Nord Piano (.npno) the decoder can read.');
  const v6 = dir.version >= 0x464;
  const u16 = (o2: number) => (npno[o2] << 8) | npno[o2 + 1];
  const u32 = (o2: number) => ((npno[o2] << 24) | (npno[o2 + 1] << 16) | (npno[o2 + 2] << 8) | npno[o2 + 3]) >>> 0;

  const root = npno[cnsp + 0x8c + o.key];
  if (root === 0 || root === 0xff) throw new Error(`Key ${noteName(o.key)} plays nothing in this piano.`);
  // Zones run in root order: the n-th root with strokes in the layers-per-root table.
  const roots = readLayerTable(npno, cnsp).flatMap((c, r) => (c > 0 ? [r] : []));
  const zone = roots.indexOf(root);
  if (zone < 0) throw new Error(`Key ${noteName(o.key)} points at a zone with no recordings.`);
  const layers = dir.strokes.filter((s) => s.zone === zone && s.flags === 0);
  const velocity = o.velocity ?? 100;
  const att = touchAttenuation(velocity);
  if (o.layer !== undefined && (o.layer < 0 || o.layer >= layers.length)) {
    throw new Error(`This zone has ${layers.length} layer(s); pick 0–${layers.length - 1}.`);
  }
  const stroke = o.layer !== undefined ? layers[o.layer] : strokeFor(dir, zone, velocity, o.selectOffset ?? 20)!;
  const pick = layers.indexOf(stroke);
  const rec = cnsp + 0x732 + stroke.index * 0x76;
  const floorRaw = npno[rec + 0x05];
  const levelRaw = u16(rec + 0x34);
  const level = v6 ? levelRaw : 10 * levelRaw - 2 * 5 * floorRaw;
  const trims = int8(npno[cnsp + 0x10c + o.key]) + int8(npno[cnsp + 0x38c + o.key]) + int8(npno[cnsp + 0x40c]);
  const lvl = level + 2 * att + 60 - trims;
  const predictedGainDb = -lvl * (20 * Math.log10(2)) / 60;
  const decayCoef = u32(rec + 0x2e) / 2 ** 23;
  const damperIndex = npno[rec + 0x72];
  const modeByte = npno[cnsp + 0x49c];
  const releaseMode = modeByte === 0 ? 1 : modeByte === 2 ? 3 : modeByte === 0xff ? 0 : 2;

  const pcm = decodeNspStroke(npno, dir, stroke).map((c) => Float32Array.from(c, (v) => v / 32768));
  const native = pickChannel({ sampleRate: NSP_SAMPLE_RATE, channels: pcm });
  const f0 = estimateF0(native.subarray(Math.min(native.length, 4410), Math.min(native.length, 22050)), NSP_SAMPLE_RATE);
  // §2.3: plus the header's per-key tuning correction (+0x18C, signed cents) and minus the
  // stroke's fine tune (+0x32, cents). Both 0 in the test pianos. The table cancels the
  // recording's own deviation: added in a v6 file it brings every zone into tune. In a v5
  // file it is taken with the opposite sign (measured on the CP80 5.3, and found the same
  // way in an independent measurement; the v5 loader path itself is not traced).
  const stretchCents = (v6 ? 1 : -1) * int8(npno[cnsp + 0x18c + o.key]) - npno[rec + 0x32];
  const c0 = 100 * (o.key - root - NSP_ROOT_OFFSET) + stretchCents;
  const ratioFor = (cents: number) => Math.min(2 ** (cents / 1200), 1);
  const pitch: PitchHypothesis[] = f0 ? [
    { id: 'A', label: '44.1 kHz, no +27 c', hz: f0.hz * ratioFor(c0) },
    { id: 'B', label: '44.1 kHz, +27 c', hz: f0.hz * ratioFor(c0 + 27) },
    { id: 'C', label: '43.4 kHz clock, +27 c', hz: f0.hz * ratioFor(c0 + 27) * (CLOCK_43K / NSP_SAMPLE_RATE) },
  ] : [];
  const model = o.pitchModel ?? 'A';
  const ratio = ratioFor(c0 + (model === 'A' ? 0 : 27)) * (model === 'C' ? CLOCK_43K / NSP_SAMPLE_RATE : 1);

  // Play the stroke: cubic interpolation at `ratio`, loop jump, envelope.
  const sr = o.sampleRate;
  const total = Math.round(o.totalS * sr);
  const holdAt = Math.round(o.holdS * sr);
  const step = (ratio * NSP_SAMPLE_RATE) / sr;
  const gain = 10 ** (predictedGainDb / 20);
  const loopEnd = stroke.loop ? stroke.loop.start + stroke.loop.length : Infinity;
  const loopDecay = decayCoef ** (NSP_ENVELOPE_RATE / sr);
  const t60 = damperT60(damperIndex);
  const damp = 10 ** (-3 / (t60 * sr));
  const cutoff = 0.001 * 2 ** (damperIndex / 4); // mode 3: silent after t0 ≈ 1 ms·2^(p/4)
  const out = pcm.map(() => new Float32Array(total));
  const last = stroke.frames - 1;
  let pos = 0;
  let env = 1;
  let inLoop = false;
  for (let n = 0; n < total; n++) {
    const i = Math.floor(pos);
    if (i + 2 >= stroke.frames && !stroke.loop) break;
    const t = pos - i;
    let rel = 1;
    if (n >= holdAt) {
      if (releaseMode === 3) { const u = (n - holdAt) / sr / cutoff; rel = u >= 1 ? 0 : (1 - u) * (1 - u); }
      else if (releaseMode !== 0) { env *= damp; }
    }
    const km1 = Math.max(0, i - 1), k1 = Math.min(last, i + 1), k2 = Math.min(last, i + 2);
    for (let c = 0; c < pcm.length; c++) {
      const x = pcm[c];
      const xm1 = x[km1], x0 = x[Math.min(last, i)], x1 = x[k1], x2 = x[k2];
      const v = x0 + 0.5 * t * (x1 - xm1 + t * (2 * xm1 - 5 * x0 + 4 * x1 - x2 + t * (3 * (x0 - x1) + x2 - xm1)));
      out[c][n] = v * gain * env * rel;
    }
    pos += step;
    if (stroke.loop && pos > stroke.loop.start) inLoop = true;
    if (inLoop) env *= loopDecay;
    if (pos >= loopEnd) pos -= stroke.loop!.length;
  }
  const info: PianoStrokeInfo = {
    zone, layer: pick, layers: layers.length, storedRoot: root, recordedHz: f0?.hz, att,
    floorDb: stroke.velocityFrom / 5, levelWord: level, predictedGainDb,
    loopDecayDbPerS: stroke.loop ? 20 * Math.log10(decayCoef) * NSP_ENVELOPE_RATE : undefined,
    damperIndex, damperT60S: t60, releaseMode,
  };
  return {
    label: 'OpenNord piano', sampleRate: sr, channels: out, stroke: info, pitch,
    notes: [
      `zone ${zone + 1}, layer ${pick + 1} of ${layers.length} (1 = loudest), recorded at ${f0 ? `${f0.hz.toFixed(2)} Hz` : '?'}; key tuning ${stretchCents >= 0 ? '+' : ''}${stretchCents} c; pitch model ${model}`,
      `velocity ${velocity} → ${(att / 5).toFixed(1)} dB (OpenNord's approximate Touch curve); level word ${level}; predicted gain ${predictedGainDb.toFixed(1)} dB`,
      `release: damper index ${damperIndex} (T60 ${(t60 * 1000).toFixed(0)} ms), mode ${releaseMode}${releaseMode === 2 ? ' (its linear fade rendered as the exponential damper)' : ''}; no string resonance, unison or effects`,
    ],
  };
}

// ── Comparison table ─────────────────────────────────────────────────────────────────────

export interface Row {
  label: string;
  nord: string;
  ref: string;
  delta: string;
}

const fmt = (v: number | undefined, digits: number, unit: string) => (v === undefined || !Number.isFinite(v) ? '—' : `${v.toFixed(digits)} ${unit}`);
const signed = (v: number | undefined, digits: number, unit: string) =>
  v === undefined || !Number.isFinite(v) ? '' : `${v >= 0 ? '+' : ''}${v.toFixed(digits)} ${unit}`;
const diff = (a?: number, b?: number) => (a === undefined || b === undefined ? undefined : a - b);

/** Rows of measurements, with deltas (Nord − OpenNord) when a reference is given. */
export function compareRows(nord: Measurement, ref?: Measurement, noteHz?: number): Row[] {
  const rows: Row[] = [];
  const r = (label: string, a: string, b: string, d: string) => rows.push({ label, nord: a, ref: ref ? b : '', delta: ref ? d : '' });
  const nf = nord.f0?.hz;
  const rf = ref?.f0?.hz;
  r('Pitch (f0)', fmt(nf, 2, 'Hz'), fmt(rf, 2, 'Hz'), nf && rf ? signed(centsBetween(nf, rf), 1, 'cents') : '');
  if (noteHz) {
    // Against the played note, folded to the nearest octave (a 16′ drawbar sounds an octave down).
    const vsNote = (hz?: number) => {
      if (!hz) return '—';
      const c = centsBetween(hz, noteHz);
      const oct = Math.round(c / 1200);
      return `${signed(c - 1200 * oct, 1, 'cents')}${oct ? ` (${Math.abs(oct)} oct ${oct < 0 ? 'down' : 'up'})` : ''}`;
    };
    r('  vs equal temperament', vsNote(nf), vsNote(rf), '');
  }
  r('Peak level', fmt(nord.peakDb, 1, 'dBFS'), fmt(ref?.peakDb, 1, 'dBFS'), signed(diff(nord.peakDb, ref?.peakDb), 1, 'dB'));
  r('RMS level', fmt(nord.rmsDb, 1, 'dBFS'), fmt(ref?.rmsDb, 1, 'dBFS'), signed(diff(nord.rmsDb, ref?.rmsDb), 1, 'dB'));
  const nc = nord.centroidHz;
  const rc = ref?.centroidHz;
  r('Brightness (centroid)', fmt(nc, 0, 'Hz'), fmt(rc, 0, 'Hz'),
    nc && rc ? `${signed(nc - rc, 0, 'Hz')} (${signed((100 * (nc - rc)) / rc, 0, '%')})` : '');
  r('Attack 10→90 %', fmt(nord.env.attackMs, 1, 'ms'), fmt(ref?.env.attackMs, 1, 'ms'), signed(diff(nord.env.attackMs, ref?.env.attackMs), 1, 'ms'));
  r('Time to peak', fmt(nord.env.peakAtMs, 0, 'ms'), fmt(ref?.env.peakAtMs, 0, 'ms'), signed(diff(nord.env.peakAtMs, ref?.env.peakAtMs), 0, 'ms'));
  r('Fall of 20 dB after peak', fmt(nord.env.decay20Ms, 0, 'ms'), fmt(ref?.env.decay20Ms, 0, 'ms'), signed(diff(nord.env.decay20Ms, ref?.env.decay20Ms), 0, 'ms'));
  const t60 = (m?: Measurement) => (m?.env.sustained ? 'sustained' : fmt(m?.env.t60S, 2, 's'));
  const dt60 = diff(nord.env.t60S, ref?.env.t60S);
  r('T60 (decay rate)', t60(nord), t60(ref), dt60 === undefined ? '' : `${signed(dt60 * 1000, 0, 'ms')} (${signed((100 * dt60) / ref!.env.t60S!, 1, '%')})`);
  if (nord.tremolo || ref?.tremolo) {
    r('Tremolo / rotor rate', fmt(nord.tremolo?.rateHz, 2, 'Hz'), fmt(ref?.tremolo?.rateHz, 2, 'Hz'), signed(diff(nord.tremolo?.rateHz, ref?.tremolo?.rateHz), 2, 'Hz'));
    r('Tremolo depth (±)', fmt(nord.tremolo?.depth, 1, 'dB'), fmt(ref?.tremolo?.depth, 1, 'dB'), signed(diff(nord.tremolo?.depth, ref?.tremolo?.depth), 1, 'dB'));
  }
  if (nord.vibrato || ref?.vibrato) {
    r('Vibrato rate', fmt(nord.vibrato?.rateHz, 2, 'Hz'), fmt(ref?.vibrato?.rateHz, 2, 'Hz'), signed(diff(nord.vibrato?.rateHz, ref?.vibrato?.rateHz), 2, 'Hz'));
    r('Vibrato depth (±)', fmt(nord.vibrato?.depth, 1, 'cents'), fmt(ref?.vibrato?.depth, 1, 'cents'), signed(diff(nord.vibrato?.depth, ref?.vibrato?.depth), 1, 'cents'));
  }
  return rows;
}

/** A plain-text table; the header names the two columns. */
export function formatRows(rows: Row[], nordLabel = 'Nord', refLabel = 'OpenNord'): string {
  const showRef = rows.some((x) => x.ref !== '');
  const head: Row = { label: '', nord: nordLabel, ref: showRef ? refLabel : '', delta: showRef ? 'Delta' : '' };
  const all = [head, ...rows];
  const w = (k: keyof Row) => Math.max(...all.map((x) => x[k].length));
  const [a, b, c] = [w('label'), w('nord'), w('ref')];
  return all.map((x) => `${x.label.padEnd(a)}  ${x.nord.padEnd(b)}  ${showRef ? `${x.ref.padEnd(c)}  ${x.delta}` : ''}`.trimEnd()).join('\n');
}

// ── Velocity sweep ───────────────────────────────────────────────────────────────────────

export interface SweepNote {
  velocity?: number;
  onsetS: number;
  peakDb: number;
  /** RMS over the first 0.3 s. */
  rmsDb: number;
  centroidHz?: number;
  f0Hz?: number;
  /** Brightness jumped by 30 % or more from the previous note: probably a layer change. */
  layerChange: boolean;
}

/** Split a velocity-sweep take into notes and measure each one. */
export function analyzeSweep(x: Float32Array, sr: number, velocities?: readonly number[]): SweepNote[] {
  const starts = segmentNotes(x, sr, { minGapS: 0.8 });
  const out: SweepNote[] = [];
  starts.forEach((s, i) => {
    const end = Math.min(x.length, starts[i + 1] ?? x.length, s + Math.round(1.2 * sr));
    const note = x.subarray(s, end);
    const head = note.subarray(0, Math.round(0.3 * sr));
    const steady = note.subarray(Math.round(0.02 * sr), Math.round(0.3 * sr));
    const lv = levels(note);
    const centroidHz = spectralCentroid(steady, sr);
    const prev = out[out.length - 1]?.centroidHz;
    out.push({
      velocity: velocities?.[i], onsetS: s / sr, peakDb: lv.peakDb, rmsDb: levels(head).rmsDb, centroidHz,
      f0Hz: estimateF0(steady, sr)?.hz,
      layerChange: !!(prev && centroidHz && (centroidHz / prev >= 1.3 || prev / centroidHz >= 1.3)),
    });
  });
  return out;
}

export function formatSweep(notes: SweepNote[]): string {
  const rows = notes.map((n, i) => [
    String(i + 1), n.velocity === undefined ? '?' : String(n.velocity), `${n.onsetS.toFixed(2)} s`,
    `${n.peakDb.toFixed(1)} dBFS`, `${n.rmsDb.toFixed(1)} dBFS`, n.centroidHz ? `${n.centroidHz.toFixed(0)} Hz` : '—',
    n.f0Hz ? `${n.f0Hz.toFixed(1)} Hz` : '—', n.layerChange ? '← brightness jump (layer change?)' : '',
  ]);
  const head = ['#', 'Velocity', 'Start', 'Peak', 'RMS 0–0.3 s', 'Brightness', 'Pitch', ''];
  const all = [head, ...rows];
  const widths = head.map((_, c) => Math.max(...all.map((r) => r[c].length)));
  return all.map((r) => r.map((v, c) => v.padEnd(widths[c])).join('  ').trimEnd()).join('\n');
}

/** Measure a reference render the same way as the recording (same channel; onset found in the render). */
export function measureReference(r: Reference, opts: MeasureOptions, channel: ChannelPick = 'mix'): Measurement {
  return measure(channel === 'mix' ? referenceMono(r) : pickChannel(r, channel), r.sampleRate, { ...opts, onset: undefined });
}
