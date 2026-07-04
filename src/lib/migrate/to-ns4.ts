/**
 * The ns4 emitter — turns a generation-neutral CommonProgram into a set of
 * raw Stage-4 parameter edits (RawEdit[]) plus a musician-facing migration
 * report. This is the "write" half of cross-generation migration; convert.ts
 * wires lift → emit → editNs4Program.
 *
 * Design (spec §emitter): one `emit<Section>` per engine, each returning
 * { edits, notes, calls }. All AI/heuristic judgment calls (sound matching,
 * ambiguous FX/waveform choices) are collected first and resolved in ONE
 * advisor.choose() batch, validated against their closed option menus
 * (validateAnswers), then finalized into edits. The advisor NEVER produces a
 * raw value directly — it only picks from menus the emitter built from real
 * options (ctx.sounds ids, enum labels).
 *
 * Every mapping row cites its traceability source (offset-map id or interpret
 * table name). Param names were confirmed against buildParamMap() — the
 * EMITTER_PARAMS existence test is the typo net.
 */
import type {
  CommonProgram,
  CommonOrgan,
  CommonPiano,
  CommonSynth,
  CommonFxUnit,
  MigrationNote,
  MigrationReport,
} from './common';
import { findParam, type RawEdit } from '../ns4/writer';
import { buildParamMap, type Ns4Group, type Param } from '../ns4/maps';
import { interpretValue } from '../ns4/interpret';
import {
  invertEnum,
  paramWidthBits,
  nearestRawByInterpretation,
} from './invert';
import { timeStringToMs, freqStringToHz } from './units';
import type { MigrationAdvisor, JudgmentCall, JudgmentOption } from './advisor';
import { validateAnswers } from './advisor';

export interface AvailableSound {
  id: number;
  name: string;
  kind: 'piano' | 'sample';
}
export interface EmitContext {
  advisor: MigrationAdvisor;
  sounds: AvailableSound[];
}

/**
 * Every (group, name) the emitter may write. The dedicated existence test in
 * to-ns4.test.ts asserts each resolves via findParam(buildParamMap(), …) — the
 * guard against param-name typos. Each entry's traceability is the interpret
 * table / offset-map id in the mapping comments below.
 */
export const EMITTER_PARAMS: ReadonlyArray<readonly [Ns4Group, string]> = [
  // organ (offset-map ids in emitOrgan)
  ['o', 'layer on/off'], // 095-3
  ['o', 'organ model'], // 114-2 (interpret label table; no PARAM_TABLE entry — inverted via interpretValue scan)
  ['o', 'volume'], // 095-7
  ['o', 'octave shift'], // 113-5 (OctaveShift table)
  ['o', 'drawbar 1'],
  ['o', 'drawbar 2'],
  ['o', 'drawbar 3'],
  ['o', 'drawbar 4'],
  ['o', 'drawbar 5'],
  ['o', 'drawbar 6'],
  ['o', 'drawbar 7'],
  ['o', 'drawbar 8'],
  ['o', 'drawbar 9'],
  ['o', 'vib/chorus on/off'], // OnOff
  ['o', 'percussion on/off'], // OnOff
  ['o', 'perc harm 3rd on/off'], // OnOff
  ['o', 'perc decay fast on/off'], // OnOff
  ['o', 'perc vol soft on/off'], // OnOff
  // piano (ids in emitPiano)
  ['p', 'layer on/off'], // 230-3
  ['p', 'volume'], // 230-7
  ['p', 'octave shift'], // OctaveShift
  ['p', 'piano type'], // 244-3 (PianoType table)
  ['p', 'piano model ID/name'], // 245-5 (32-bit id — set only from a matched sound)
  // synth (ids in emitSynth)
  ['y', 'layer on/off'], // 377-5
  ['y', 'volume'], // 378-3
  ['y', 'octave shift'], // OctaveShift
  ['y', 'samples/analog'], // SampleAnalog table
  ['y', 'sample ID/name'], // 410-3 (32-bit id — set only from a matched sound)
  ['y', 'filter type'], // 587-3 (FilterType table)
  ['y', 'filter freq'], // 587-6 (continuous, nearest by Hz)
  ['y', 'filter resonance / freq HP'], // 591-5 (continuous 7-bit)
  ['y', 'amp env attack'], // 584-4 (continuous, nearest by ms)
  ['y', 'amp env decay'], // 585-3
  ['y', 'amp env release'], // 586-2
  ['y', 'LFO shape'], // 576-2 (LFOshape table)
  ['y', 'LFO rate/time'], // 576-6 (continuous 7-bit)
  // fx (per-layer in p/y, organ FX master-scoped in m — see emitFx)
  ['y', 'FX mod 1 on/off'],
  ['y', 'FX mod 1 mode'], // FXmod1mode table
  ['y', 'FX mod 1 amount'],
  ['y', 'FX mod 1 rate'],
  ['y', 'FX mod 2 on/off'],
  ['y', 'FX mod 2 mode'], // FXmod2mode table
  ['y', 'FX mod 2 amount'],
  ['y', 'FX mod 2 rate'],
  ['y', 'FX delay on/off'],
  ['y', 'FX comp on/off'],
  ['y', 'FX reverb on/off'],
  ['y', 'FX reverb type'], // FXreverbType table
  ['p', 'FX mod 1 on/off'],
  ['p', 'FX mod 1 mode'],
  ['p', 'FX mod 1 amount'],
  ['p', 'FX mod 1 rate'],
  ['p', 'FX mod 2 on/off'],
  ['p', 'FX mod 2 mode'],
  ['p', 'FX mod 2 amount'],
  ['p', 'FX mod 2 rate'],
  ['p', 'FX delay on/off'],
  ['p', 'FX comp on/off'],
  ['p', 'FX reverb on/off'],
  ['p', 'FX reverb type'],
  // organ FX (master-scoped, single-layer — see emitFx/ORGAN_FX_PARAM)
  ['m', 'organ FX mod 1 on/off'],
  ['m', 'organ FX mod 1 mode'],
  ['m', 'organ FX mod 2 on/off'],
  ['m', 'organ FX mod 2 mode'],
  ['m', 'organ FX delay on/off'],
  ['m', 'organ FX comp on/off'],
  ['m', 'organ FX reverb on/off'],
  ['m', 'organ FX reverb type'],
] as const;

// ─── shared helpers ──────────────────────────────────────────────────────────

const MAP: Param[] = buildParamMap();

interface SectionOut {
  edits: RawEdit[];
  notes: MigrationNote[];
  /** Judgment calls this section wants resolved before it can finalize an edit. */
  calls: JudgmentCall[];
  /** Deferred finalizers, keyed by call id → produce edits/notes from the answer. */
  finalize?: Record<string, (optionId: string | null, rationale: string) => void>;
}

function mkOut(): SectionOut {
  return { edits: [], notes: [], calls: [], finalize: {} };
}

function param(group: Ns4Group, name: string): Param | undefined {
  return findParam(MAP, group, name);
}

/** Set an enum param by inverting a target label through its interpret table. */
function setEnum(
  out: SectionOut,
  group: Ns4Group,
  name: string,
  label: string | undefined,
  layer: number,
  field: string,
  humanTarget: string,
): void {
  if (!label) return;
  const raw = invertEnum(name, label);
  if (raw != null) {
    out.edits.push({ group, name, layer, value: raw });
    out.notes.push({ field, status: 'mapped', note: `${humanTarget} carried over.` });
  } else {
    out.notes.push({
      field,
      status: 'defaulted',
      note: `${humanTarget} has no direct match on Stage 4 and was left at a sensible default.`,
    });
  }
}

/**
 * Invert a label through the param's forward interpret table (interpretValue),
 * used where the enum labels exist for reading but aren't in invert.ts's
 * PARAM_TABLE (e.g. "organ model"). Scans the field's raw range for a
 * case-insensitive exact-or-prefix label match. Cap = field width.
 */
function invertByInterpret(p: Param, label: string): number | null {
  const width = paramWidthBits(p);
  if (width > 12) return null; // never brute-force wide id fields
  const want = label.trim().toLowerCase();
  const count = 1 << width;
  let prefixMatch: number | null = null;
  for (let raw = 0; raw < count; raw++) {
    const s = interpretValue(p.id, p.name, raw);
    if (s == null) continue;
    const lab = s.trim().toLowerCase();
    if (lab === want) return raw;
    if (prefixMatch == null && (lab.startsWith(want) || want.startsWith(lab))) prefixMatch = raw;
  }
  return prefixMatch;
}

/** Scale a 0–127 MIDI value into a field of `width` bits, if not exactly 7-bit. */
function scaleMidiToWidth(midi: number, width: number): number {
  if (width === 7) return Math.max(0, Math.min(127, Math.round(midi)));
  const max = (1 << width) - 1;
  return Math.max(0, Math.min(max, Math.round((midi * max) / 127)));
}

/** Emit a volume edit (7-bit direct, else scaled). */
function emitVolume(out: SectionOut, group: Ns4Group, layer: number, volumeMidi?: number): void {
  if (volumeMidi == null) return;
  const p = param(group, 'volume');
  if (!p) return;
  const w = paramWidthBits(p);
  out.edits.push({ group, name: 'volume', layer, value: scaleMidiToWidth(volumeMidi, w) });
}

/** OctaveShift table is {0:"0",1:"+1",2:"+2",14:"-2",15:"-1"} — signed, wraps. */
function octaveShiftRaw(n: number): { raw: number; clamped: boolean } {
  const clampedN = Math.max(-2, Math.min(2, n));
  const clamped = clampedN !== n;
  const label = clampedN > 0 ? `+${clampedN}` : `${clampedN}`; // "+1" / "0" / "-2"
  const raw = invertEnum('octave shift', label);
  return { raw: raw ?? 0, clamped };
}

function emitOctaveShift(
  out: SectionOut,
  group: Ns4Group,
  layer: number,
  n: number | undefined,
  field: string,
): void {
  if (n == null || n === 0) return;
  const { raw, clamped } = octaveShiftRaw(n);
  out.edits.push({ group, name: 'octave shift', layer, value: raw });
  if (clamped) {
    out.notes.push({
      field,
      status: 'approximated',
      note: `Octave shift was beyond Stage 4's range and was brought to the nearest setting.`,
    });
  }
}

// ─── organ ───────────────────────────────────────────────────────────────────

function emitOrgan(o: CommonOrgan | undefined, out: SectionOut): void {
  if (!o) return;
  if (!o.on) {
    out.edits.push({ group: 'o', name: 'layer on/off', layer: 0, value: 0 }); // 095-3
    out.notes.push({ field: 'Organ', status: 'mapped', note: 'The organ was off and was left off.' });
    return;
  }
  out.edits.push({ group: 'o', name: 'layer on/off', layer: 0, value: 1 }); // 095-3

  // organ model — 114-2: interpret labels B3/VOX/FARF/PIPE1… (no PARAM_TABLE entry).
  const modelParam = param('o', 'organ model');
  if (modelParam && o.type) {
    const raw =
      invertEnum('organ model', o.type) ?? invertByInterpret(modelParam, o.type);
    if (raw != null) {
      out.edits.push({ group: 'o', name: 'organ model', layer: 0, value: raw });
      out.notes.push({ field: 'Organ model', status: 'mapped', note: `Organ model (${o.type}) carried over.` });
    } else {
      out.notes.push({
        field: 'Organ model',
        status: 'defaulted',
        note: `Organ model "${o.type}" has no direct match on Stage 4 and was left at a sensible default.`,
      });
    }
  }

  // drawbars (manual 1 → layer A) — raw = drawbar-length digit 0–8.
  for (let i = 0; i < 9 && i < o.drawbars.length; i++) {
    out.edits.push({ group: 'o', name: `drawbar ${i + 1}`, layer: 0, value: o.drawbars[i] });
  }
  out.notes.push({ field: 'Organ drawbars', status: 'mapped', note: 'Drawbar registration carried over.' });

  // second manual → layer B (turn the layer on too).
  if (o.drawbars2 && o.drawbars2.length) {
    out.edits.push({ group: 'o', name: 'layer on/off', layer: 1, value: 1 }); // 095-3 [B]
    for (let i = 0; i < 9 && i < o.drawbars2.length; i++) {
      out.edits.push({ group: 'o', name: `drawbar ${i + 1}`, layer: 1, value: o.drawbars2[i] });
    }
    out.notes.push({ field: 'Organ second manual', status: 'mapped', note: 'Second manual carried over to the organ B layer.' });
  }

  // vib/chorus — on/off maps; the specific mode has no invertible table on
  // Stage 4 (organ vib/chorus type is a composite per-model field), so we
  // enable it and leave the mode at the donor default.
  if (o.vibChorus) {
    out.edits.push({ group: 'o', name: 'vib/chorus on/off', layer: 0, value: o.vibChorus.on ? 1 : 0 });
    if (o.vibChorus.on) {
      out.notes.push({
        field: 'Organ vibrato/chorus',
        status: 'approximated',
        note: 'Vibrato/chorus turned on; its exact mode was left at a sensible default.',
      });
    }
  }

  // percussion — four independent on/off flags.
  if (o.percussion) {
    out.edits.push({ group: 'o', name: 'percussion on/off', layer: 0, value: o.percussion.on ? 1 : 0 });
    out.edits.push({ group: 'o', name: 'perc harm 3rd on/off', layer: 0, value: o.percussion.third ? 1 : 0 });
    out.edits.push({ group: 'o', name: 'perc decay fast on/off', layer: 0, value: o.percussion.fast ? 1 : 0 });
    out.edits.push({ group: 'o', name: 'perc vol soft on/off', layer: 0, value: o.percussion.soft ? 1 : 0 });
    if (o.percussion.on) {
      out.notes.push({ field: 'Organ percussion', status: 'mapped', note: 'Percussion settings carried over.' });
    }
  }

  emitVolume(out, 'o', 0, o.volumeMidi);
  emitOctaveShift(out, 'o', 0, o.octaveShift, 'Organ octave shift');
}

// ─── piano ───────────────────────────────────────────────────────────────────

// typeName → ns4 PianoType label (heuristic keyword table; PianoType enum is
// {Grand,Upright,Electric,Clav,Digital,Misc}). CommonPiano.typeName can be an
// instrument-ish name ('Grand', 'E Piano 1', 'Wurl'), not a clean category.
function pianoTypeLabel(typeName: string): string | null {
  const t = typeName.toLowerCase();
  if (t.includes('grand')) return 'Grand';
  if (t.includes('upright')) return 'Upright';
  if (t.includes('e piano') || t.includes('wurl') || t.includes('rhodes') || t.includes('electric') || t.includes('epiano')) return 'Electric';
  if (t.includes('clav')) return 'Clav';
  if (t.includes('digital') || t.includes('dx')) return 'Digital';
  if (t.includes('harpsi') || t.includes('misc')) return 'Misc';
  return null;
}

function emitPiano(p: CommonPiano | undefined, out: SectionOut, ctx: EmitContext): void {
  if (!p) return;
  if (!p.on) {
    out.edits.push({ group: 'p', name: 'layer on/off', layer: 0, value: 0 }); // 230-3
    out.notes.push({ field: 'Piano', status: 'mapped', note: 'The piano was off and was left off.' });
    return;
  }
  out.edits.push({ group: 'p', name: 'layer on/off', layer: 0, value: 1 }); // 230-3

  // piano type — 244-3, PianoType table (via keyword heuristic).
  if (p.typeName) {
    const label = pianoTypeLabel(p.typeName);
    if (label) {
      setEnum(out, 'p', 'piano type', label, 0, 'Piano type', `Piano type (${p.typeName})`);
    } else {
      out.notes.push({
        field: 'Piano type',
        status: 'defaulted',
        note: `Piano type "${p.typeName}" didn't map cleanly and was left at a sensible default.`,
      });
    }
  }

  // piano sound — 245-5, 32-bit id. Picked from ctx.sounds via advisor; no
  // pick → leave the donor default + a re-pick note.
  const pianoSounds = ctx.sounds.filter((s) => s.kind === 'piano');
  if (p.soundName && pianoSounds.length) {
    const options: JudgmentOption[] = pianoSounds.map((s) => ({ id: String(s.id), label: s.name }));
    const callId = 'piano-sound';
    out.calls.push({
      id: callId,
      kind: 'piano-sound',
      description: p.soundName,
      options,
    });
    out.finalize![callId] = (optionId, rationale) => {
      if (optionId != null) {
        out.edits.push({ group: 'p', name: 'piano model ID/name', layer: 0, value: Number(optionId) });
        const picked = pianoSounds.find((s) => String(s.id) === optionId);
        out.notes.push({
          field: 'Piano sound',
          status: 'mapped',
          note: `Matched your source piano "${p.soundName}" to "${picked?.name ?? 'a Stage 4 piano'}".`,
          rationale,
        });
      } else {
        out.notes.push({
          field: 'Piano sound',
          status: 'defaulted',
          note: `Couldn't find a Stage 4 piano matching "${p.soundName}" — please re-pick this sound on the keyboard.`,
        });
      }
    };
  } else if (p.soundName) {
    out.notes.push({
      field: 'Piano sound',
      status: 'defaulted',
      note: `Couldn't find a Stage 4 piano matching "${p.soundName}" — please re-pick this sound on the keyboard.`,
    });
  }

  emitVolume(out, 'p', 0, p.volumeMidi);
  emitOctaveShift(out, 'p', 0, p.octaveShift, 'Piano octave shift');
}

// ─── synth ───────────────────────────────────────────────────────────────────

function emitSynth(y: CommonSynth | undefined, out: SectionOut, ctx: EmitContext): void {
  if (!y) return;
  if (!y.on) {
    out.edits.push({ group: 'y', name: 'layer on/off', layer: 0, value: 0 }); // 377-5
    out.notes.push({ field: 'Synth', status: 'mapped', note: 'The synth was off and was left off.' });
    return;
  }
  out.edits.push({ group: 'y', name: 'layer on/off', layer: 0, value: 1 }); // 377-5

  // samples/analog — SampleAnalog table {0:"samples",1:"analog"}.
  out.edits.push({ group: 'y', name: 'samples/analog', layer: 0, value: y.mode === 'analog' ? 1 : 0 });

  if (y.mode === 'sample') {
    // sample id — 410-3, 32-bit. Advisor pick from kind 'sample'.
    const sampleSounds = ctx.sounds.filter((s) => s.kind === 'sample');
    if (y.sampleName && sampleSounds.length) {
      const callId = 'sample-sound';
      out.calls.push({
        id: callId,
        kind: 'sample-sound',
        description: y.sampleName,
        options: sampleSounds.map((s) => ({ id: String(s.id), label: s.name })),
      });
      out.finalize![callId] = (optionId, rationale) => {
        if (optionId != null) {
          out.edits.push({ group: 'y', name: 'sample ID/name', layer: 0, value: Number(optionId) });
          const picked = sampleSounds.find((s) => String(s.id) === optionId);
          out.notes.push({
            field: 'Synth sample',
            status: 'mapped',
            note: `Matched your source sample "${y.sampleName}" to "${picked?.name ?? 'a Stage 4 sample'}".`,
            rationale,
          });
        } else {
          out.notes.push({
            field: 'Synth sample',
            status: 'defaulted',
            note: `Couldn't find a Stage 4 sample matching "${y.sampleName}" — please re-pick this sound on the keyboard.`,
          });
        }
      };
    } else if (y.sampleName) {
      out.notes.push({
        field: 'Synth sample',
        status: 'defaulted',
        note: `Couldn't find a Stage 4 sample matching "${y.sampleName}" — please re-pick this sound on the keyboard.`,
      });
    }
  } else {
    // analog waveform — the analog cat/wave params have no invertible label
    // table on Stage 4, so an analog oscillator's exact waveform can't be
    // reproduced; leave the donor default and note it.
    if (y.waveform) {
      out.notes.push({
        field: 'Synth waveform',
        status: 'defaulted',
        note: `The analog oscillator waveform ("${y.waveform}") couldn't be reproduced and was left at a sensible default.`,
      });
    }
  }

  // filter type — 587-3, FilterType table. ns2 emits 'LP' — alias to 'LP12'.
  if (y.filter?.type) {
    const label = y.filter.type === 'LP' ? 'LP12' : y.filter.type;
    setEnum(out, 'y', 'filter type', label, 0, 'Synth filter', `Filter type (${y.filter.type})`);
  }

  // filter cutoff — 587-6, continuous; nearest by Hz. Else 7-bit direct midi.
  const freqParam = param('y', 'filter freq');
  if (freqParam) {
    if (y.cutoffHz != null) {
      const raw = nearestRawByInterpretation(freqParam, y.cutoffHz, freqStringToHz, { log: true });
      if (raw != null) out.edits.push({ group: 'y', name: 'filter freq', layer: 0, value: raw });
    } else if (y.filter?.cutoffMidi != null && paramWidthBits(freqParam) === 7) {
      out.edits.push({ group: 'y', name: 'filter freq', layer: 0, value: Math.max(0, Math.min(127, y.filter.cutoffMidi)) });
    }
  }

  // filter resonance — 591-5, 7-bit. No interpret labels → direct midi or scaled.
  const resParam = param('y', 'filter resonance / freq HP');
  if (resParam) {
    const w = paramWidthBits(resParam);
    if (y.filter?.resonanceMidi != null) {
      out.edits.push({ group: 'y', name: 'filter resonance / freq HP', layer: 0, value: scaleMidiToWidth(y.filter.resonanceMidi, w) });
    } else if (y.resonance01 != null) {
      out.edits.push({ group: 'y', name: 'filter resonance / freq HP', layer: 0, value: scaleMidiToWidth(Math.round(y.resonance01 * 127), w) });
    }
  }

  // amp envelope — 584-4 / 585-3 / 586-2, continuous; nearest by ms.
  emitEnvTime(out, 'amp env attack', y.ampEnv?.attackMs);
  emitEnvTime(out, 'amp env decay', y.ampEnv?.decayMs);
  emitEnvTime(out, 'amp env release', y.ampEnv?.releaseMs);
  if (y.ampEnv && (y.ampEnv.attackMs != null || y.ampEnv.decayMs != null || y.ampEnv.releaseMs != null)) {
    out.notes.push({ field: 'Synth amp envelope', status: 'approximated', note: 'Amplitude envelope brought to the nearest Stage 4 settings.' });
  }

  // LFO — shape (576-2, LFOshape table); rate (576-6, continuous 7-bit).
  if (y.lfo?.wave) {
    setEnum(out, 'y', 'LFO shape', y.lfo.wave, 0, 'Synth LFO', `LFO shape (${y.lfo.wave})`);
  }
  const lfoParam = param('y', 'LFO rate/time');
  if (lfoParam) {
    const raw = y.lfo?.rateHz != null
      ? nearestRawByInterpretation(lfoParam, y.lfo.rateHz, freqStringToHz, { log: true })
      : null;
    if (raw != null) {
      out.edits.push({ group: 'y', name: 'LFO rate/time', layer: 0, value: raw });
    } else if (y.lfo?.rateMidi != null && paramWidthBits(lfoParam) === 7) {
      out.edits.push({ group: 'y', name: 'LFO rate/time', layer: 0, value: Math.max(0, Math.min(127, y.lfo.rateMidi)) });
    }
  }

  emitVolume(out, 'y', 0, y.volumeMidi);
  emitOctaveShift(out, 'y', 0, y.octaveShift, 'Synth octave shift');
}

function emitEnvTime(out: SectionOut, name: string, ms: number | undefined): void {
  if (ms == null) return;
  const p = param('y', name);
  if (!p) return;
  const raw = nearestRawByInterpretation(p, ms, timeStringToMs, { log: true });
  if (raw != null) out.edits.push({ group: 'y', name, layer: 0, value: raw });
}

// ─── fx ──────────────────────────────────────────────────────────────────────

// FX slot → its ns4 param names. The mod/reverb type enum tables (FXmod1mode /
// FXmod2mode / FXreverbType) are inverted deterministically via invertEnum;
// there is no advisor fallback for FX type — when a label doesn't match we
// enable the effect and leave its type at the donor default (an honest
// approximation, never an invented value).
interface FxSlotParams {
  on: string;
  /** Type/mode enum param (FX reverb type / FX mod N mode). */
  typeParam?: string;
  amount?: string;
  rate?: string;
}
const FX_TYPE_PARAM: Record<string, FxSlotParams> = {
  mod1: { on: 'FX mod 1 on/off', typeParam: 'FX mod 1 mode', amount: 'FX mod 1 amount', rate: 'FX mod 1 rate' },
  mod2: { on: 'FX mod 2 on/off', typeParam: 'FX mod 2 mode', amount: 'FX mod 2 amount', rate: 'FX mod 2 rate' },
  delay: { on: 'FX delay on/off' },
  reverb: { on: 'FX reverb on/off', typeParam: 'FX reverb type' },
  comp: { on: 'FX comp on/off' },
};

/**
 * Organ FX slot → its master-scoped ns4 param names (group 'm', single
 * layer — Task 3's discovery: organ FX is shared across the organ's A/B
 * layers, so a layer-1 edit throws). Only slots with a confirmed "organ FX
 * ... on/off" param are listed; slots absent here (e.g. ampsim) have no
 * organ-FX counterpart and fall through to an honest not-migratable note.
 * Type/mode params (`organ FX reverb type` / `organ FX mod N mode`) have no
 * PARAM_TABLE alias but share the same interpret ids as their engine-hosted
 * counterparts (224-6/183-1/191-4), so `invertByInterpret` — the same
 * fallback used for "organ model" — inverts their labels through the real
 * enum tables (FXreverbType/FXmod1mode/FXmod2mode).
 */
const ORGAN_FX_PARAM: Record<string, FxSlotParams> = {
  mod1: { on: 'organ FX mod 1 on/off', typeParam: 'organ FX mod 1 mode' },
  mod2: { on: 'organ FX mod 2 on/off', typeParam: 'organ FX mod 2 mode' },
  delay: { on: 'organ FX delay on/off' },
  reverb: { on: 'organ FX reverb on/off', typeParam: 'organ FX reverb type' },
  comp: { on: 'organ FX comp on/off' },
};

/**
 * Which ns4 group hosts an FX unit for this program.
 *
 * - Piano or synth on: route to that engine's own per-layer FX ('p'/'y') —
 *   unchanged from before.
 * - Organ-only (no piano/synth active): 'p'/'y' are disabled layers on
 *   Stage 4 — an FX edit there is silently inaudible on hardware, so we must
 *   NOT route there. Route to the organ's own master-scoped FX (group 'm')
 *   instead; see emitFx/ORGAN_FX_PARAM for the honest per-slot fallback when
 *   a unit has no organ-FX counterpart.
 */
function fxHostGroup(common: CommonProgram): Ns4Group {
  if (common.synth?.on) return 'y';
  if (common.piano?.on) return 'p';
  return 'm';
}

function emitFx(common: CommonProgram, out: SectionOut): void {
  const fx = common.fx;
  if (!fx || !fx.length) return;
  const group = fxHostGroup(common);
  for (const unit of fx) {
    if (group === 'm') {
      emitOrganFxUnit(unit, out);
    } else {
      emitFxUnit(unit, group, out);
    }
  }
}

/**
 * Organ-only FX routing (group 'm', layer 0 only). Every branch here either
 * emits a real edit against a param that actually reaches the organ engine,
 * or leaves a 'defaulted'/'not-migratable' note — never a 'mapped'/"carried
 * over" note without the corresponding edit, since that would claim an
 * inaudible effect succeeded.
 */
function emitOrganFxUnit(unit: CommonFxUnit, out: SectionOut): void {
  const spec = ORGAN_FX_PARAM[unit.slot];
  if (!spec) {
    out.notes.push({
      field: `Effect (${unit.slot})`,
      status: 'not-migratable',
      note: `The "${unit.slot}" effect couldn't be carried onto the organ — add it on your Stage 4.`,
    });
    return;
  }
  const onParam = param('m', spec.on);
  if (!onParam) {
    out.notes.push({
      field: `Effect (${unit.slot})`,
      status: 'not-migratable',
      note: `The "${unit.slot}" effect couldn't be carried onto the organ — add it on your Stage 4.`,
    });
    return;
  }
  out.edits.push({ group: 'm', name: spec.on, layer: 0, value: unit.on ? 1 : 0 });
  if (!unit.on) return;

  const typeParamName = spec.typeParam;
  const typeParam = typeParamName ? param('m', typeParamName) : undefined;
  if (typeParamName && typeParam && unit.type) {
    const raw = invertByInterpret(typeParam, unit.type);
    if (raw != null) {
      out.edits.push({ group: 'm', name: typeParamName, layer: 0, value: raw });
      out.notes.push({ field: `Effect (${unit.slot})`, status: 'mapped', note: `${unit.type} turned on for the organ.` });
    } else {
      out.notes.push({
        field: `Effect (${unit.slot})`,
        status: 'approximated',
        note: 'Effect turned on for the organ; check its character on the instrument.',
      });
    }
  } else {
    out.notes.push({
      field: `Effect (${unit.slot})`,
      status: 'approximated',
      note: 'Effect turned on for the organ; check its character on the instrument.',
    });
  }
}

function emitFxUnit(unit: CommonFxUnit, group: Ns4Group, out: SectionOut): void {
  const spec = FX_TYPE_PARAM[unit.slot];
  if (!spec) {
    // ampsim etc. — no clean host param here; note and move on.
    out.notes.push({ field: `Effect (${unit.slot})`, status: 'defaulted', note: `The "${unit.slot}" effect couldn't be placed and was left at a sensible default.` });
    return;
  }
  const onParam = param(group, spec.on);
  if (!onParam) return;
  out.edits.push({ group, name: spec.on, layer: 0, value: unit.on ? 1 : 0 });
  if (!unit.on) return;

  const typeParamName = spec.typeParam;
  if (typeParamName && unit.type) {
    // Deterministic invertEnum; note honestly when the label can't map rather
    // than inventing a value.
    const raw = invertEnum(typeParamName, unit.type);
    if (raw != null) {
      out.edits.push({ group, name: typeParamName, layer: 0, value: raw });
      out.notes.push({ field: `Effect (${unit.slot})`, status: 'mapped', note: `${unit.type} carried over.` });
    } else {
      out.notes.push({ field: `Effect (${unit.slot})`, status: 'approximated', note: `Effect enabled; its exact type ("${unit.type}") was left at a sensible default.` });
    }
  } else {
    out.notes.push({ field: `Effect (${unit.slot})`, status: 'mapped', note: 'Effect turned on.' });
  }

  // amount/rate — direct midi when the field is 7-bit; else leave the donor
  // default (amountMidi/rateMidi are often absent for ns2/ns3 FX).
  if (spec.amount && unit.amountMidi != null) {
    const p = param(group, spec.amount);
    if (p && paramWidthBits(p) === 7) out.edits.push({ group, name: spec.amount, layer: 0, value: Math.max(0, Math.min(127, unit.amountMidi)) });
  } else if (spec.amount && unit.amountMidi == null && unit.on) {
    out.notes.push({ field: `Effect (${unit.slot})`, status: 'approximated', note: 'Effect enabled; depth left at a sensible default.' });
  }
  if (spec.rate && unit.rateMidi != null) {
    const p = param(group, spec.rate);
    if (p && paramWidthBits(p) === 7) out.edits.push({ group, name: spec.rate, layer: 0, value: Math.max(0, Math.min(127, unit.rateMidi)) });
  }
}

// ─── top-level ───────────────────────────────────────────────────────────────

const UNMAPPED_DISCLAIMER =
  'A small part of Stage 4’s settings has no equivalent in this file and was left at sensible defaults.';
const MORPH_NOTE = 'Morph assignments don’t carry over between generations.';

export async function emitNs4(
  common: CommonProgram,
  dropped: string[],
  ctx: EmitContext,
): Promise<{ edits: RawEdit[]; report: MigrationReport }> {
  const sections: SectionOut[] = [];
  const oOut = mkOut();
  emitOrgan(common.organ, oOut);
  sections.push(oOut);
  const pOut = mkOut();
  emitPiano(common.piano, pOut, ctx);
  sections.push(pOut);
  const yOut = mkOut();
  emitSynth(common.synth, yOut, ctx);
  sections.push(yOut);
  const fxOut = mkOut();
  emitFx(common, fxOut);
  sections.push(fxOut);

  // Batch ALL judgment calls into ONE advisor.choose(), validate, finalize.
  const allCalls = sections.flatMap((s) => s.calls);
  if (allCalls.length) {
    const answers = validateAnswers(allCalls, await ctx.advisor.choose(allCalls));
    const byId = new Map(answers.map((a) => [a.id, a]));
    for (const s of sections) {
      for (const call of s.calls) {
        const a = byId.get(call.id);
        s.finalize?.[call.id]?.(a?.optionId ?? null, a?.rationale ?? '');
      }
    }
  }

  const edits = sections.flatMap((s) => s.edits);
  const notes: MigrationNote[] = sections.flatMap((s) => s.notes);

  // Not-migratable: each dropped feature + the fixed morph caveat.
  for (const d of dropped) {
    notes.push({ field: d, status: 'not-migratable', note: `${d} can’t be carried over to Stage 4.` });
  }
  notes.push({ field: 'Morphs', status: 'not-migratable', note: MORPH_NOTE });

  const report: MigrationReport = {
    source: common.sourceModel,
    notes,
    globalNotes: [UNMAPPED_DISCLAIMER],
  };

  return { edits, report };
}
