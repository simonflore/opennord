/**
 * ns4ToProgram — maps a parsed NS4Program onto the unified NordProgram model.
 *
 * NS4 is the superset generation: morph fields, layered engines (up to 2 organ +
 * 2 piano + 3 synth), and per-layer FX are all populated where parse.ts has data.
 * Unmapped optionals stay `undefined` — the parse layer is partial by design.
 *
 * See docs/superpowers/specs/2026-06-21-unified-nordprogram-model.md §per-generation.
 */
import type { NS4Program, NS4Layer, Morphable } from './types';
import type {
  NordProgram, NordEngine, OrganEngine, PianoEngine, SynthEngine,
  NordFx, NordMaster, NordMeta, Param, SampleRef,
} from '../clavia/program';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert NS4's Morphable<T> to the unified Param<T>.
 * Morphable stores deltas on value; Param stores them on morph.{wheel,aftertouch,pedal}.
 * Only populate morph when at least one modulation is assigned (non-undefined).
 */
function fromMorphable<T>(m: Morphable<T>): Param<T> {
  const p: Param<T> = { value: m.value };
  if (m.wheel !== undefined || m.aftertouch !== undefined || m.pedal !== undefined) {
    p.morph = {};
    if (m.wheel !== undefined) p.morph.wheel = m.wheel;
    if (m.aftertouch !== undefined) p.morph.aftertouch = m.aftertouch;
    if (m.pedal !== undefined) p.morph.pedal = m.pedal;
  }
  return p;
}

/** Parse a string like "-2.2 dB" or "0.0" into a number, returning undefined on failure. */
function parseDbVolume(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = parseFloat(s);
  return Number.isNaN(v) ? undefined : v;
}

/** Convert Morphable<string> volume (e.g. "-2.2 dB") to Param<number>. */
function volumeParam(m: Morphable<string> | undefined): Param<number> | undefined {
  if (!m) return undefined;
  const val = parseDbVolume(m.value);
  if (val === undefined) return undefined;
  const p: Param<number> = { value: val };
  if (m.wheel !== undefined || m.aftertouch !== undefined || m.pedal !== undefined) {
    p.morph = {};
    if (m.wheel !== undefined) {
      const w = parseDbVolume(m.wheel);
      if (w !== undefined) p.morph.wheel = w;
    }
    if (m.aftertouch !== undefined) {
      const a = parseDbVolume(m.aftertouch);
      if (a !== undefined) p.morph.aftertouch = a;
    }
    if (m.pedal !== undefined) {
      const pe = parseDbVolume(m.pedal);
      if (pe !== undefined) p.morph.pedal = pe;
    }
    if (Object.keys(p.morph).length === 0) delete p.morph;
  }
  return p;
}

/** Map Ns4SampleRef → SampleRef (id/name/categoryName/slot). */
function mapSampleRef(s: NS4Layer['sample']): SampleRef | undefined {
  if (!s || (!s.id && !s.name)) return undefined;
  return {
    id: s.id,
    name: s.name,
    categoryName: s.categoryName,
    slot: s.slot,
  };
}

// ── Per-kind engine mappers ───────────────────────────────────────────────────

function mapOrganLayer(layer: NS4Layer): OrganEngine {
  // Drawbars: take the numeric position from the string value if parseable
  const drawbars = layer.drawbars
    ? layer.drawbars.map((db) => {
        if (!db) return 0;
        const n = parseInt(db.value, 10);
        return Number.isNaN(n) ? 0 : n;
      })
    : undefined;

  // vibChorus: the NS4Layer has a boolean `vibChorus` and no mode field at this
  // decode level — use a placeholder mode string so the union type is satisfied.
  const vibChorus = layer.vibChorus !== undefined
    ? { on: layer.vibChorus, mode: '' }
    : undefined;

  const percussion = layer.percussion
    ? {
        on: layer.percussion.on ?? false,
        third: layer.percussion.harm3rd ?? false,
        fast: layer.percussion.decayFast ?? false,
        soft: layer.percussion.volSoft ?? false,
      }
    : undefined;

  return {
    kind: 'organ',
    id: layer.id,
    enabled: layer.enabled ?? false,
    volume: volumeParam(layer.volume),
    octaveShift: layer.octaveShift,
    model: layer.organModel ?? '',
    drawbars,
    vibChorus,
    percussion,
  };
}

function mapPianoLayer(layer: NS4Layer): PianoEngine {
  // Piano samples are referenced by model id/name (not a SampleRef-style slot).
  // Map what's available; `sample` field left undefined unless there's an id.
  const sample: SampleRef | undefined = layer.pianoModelId
    ? {
        id: layer.pianoModelId,
        name: layer.pianoModelName ?? '',
        categoryName: layer.pianoType ?? '',
        slot: layer.pianoModelSlot,
      }
    : undefined;

  return {
    kind: 'piano',
    id: layer.id,
    enabled: layer.enabled ?? false,
    volume: volumeParam(layer.volume),
    octaveShift: layer.octaveShift,
    type: layer.pianoType ?? '',
    sample,
    timbre: layer.timbre,
    dynamics: layer.touch,
  };
}

function mapSynthLayer(layer: NS4Layer): SynthEngine {
  // osc: use oscType as the required `type` field; oscWave → wave; oscCategory → config
  const osc: SynthEngine['osc'] = {
    type: layer.oscType ?? layer.source ?? 'analog',
    wave: layer.oscWave,
    config: layer.oscCategory,
    // pitchCoarse/pitchFine are strings — leave numeric pitch undefined (partial parse)
  };

  // filter: cutoff from filter.freq (Morphable<string>), resonance from filter.resonance
  const filterFreqStr = layer.filter?.freq;
  const cutoffVal = filterFreqStr ? (parseFloat(filterFreqStr.value) || 0) : 0;
  const cutoffParam: Param<number> = { value: cutoffVal };
  if (filterFreqStr?.wheel !== undefined || filterFreqStr?.aftertouch !== undefined || filterFreqStr?.pedal !== undefined) {
    cutoffParam.morph = {};
    if (filterFreqStr?.wheel !== undefined) cutoffParam.morph.wheel = parseFloat(filterFreqStr.wheel) || 0;
    if (filterFreqStr?.aftertouch !== undefined) cutoffParam.morph.aftertouch = parseFloat(filterFreqStr.aftertouch) || 0;
    if (filterFreqStr?.pedal !== undefined) cutoffParam.morph.pedal = parseFloat(filterFreqStr.pedal) || 0;
  }

  const resStr = layer.filter?.resonance;
  const resonanceParam: Param<number> | undefined = resStr
    ? { value: parseFloat(resStr.value) || 0 }
    : undefined;
  if (resonanceParam && resStr && (resStr.wheel !== undefined || resStr.aftertouch !== undefined || resStr.pedal !== undefined)) {
    resonanceParam.morph = {};
    if (resStr.wheel !== undefined) resonanceParam.morph.wheel = parseFloat(resStr.wheel) || 0;
    if (resStr.aftertouch !== undefined) resonanceParam.morph.aftertouch = parseFloat(resStr.aftertouch) || 0;
    if (resStr.pedal !== undefined) resonanceParam.morph.pedal = parseFloat(resStr.pedal) || 0;
  }

  const filter: SynthEngine['filter'] = {
    type: layer.filter?.type ?? 'LP24',
    cutoff: cutoffParam,
    resonance: resonanceParam,
    drive: layer.filter?.drive,
    kbTrack: layer.filter?.track,
  };

  // ampEnv: sustain not decoded yet — leave as placeholder string
  const ampEnv: SynthEngine['ampEnv'] = layer.ampEnv
    ? {
        attack: layer.ampEnv.attack ?? '0',
        decay: layer.ampEnv.decay ?? '0',
        sustain: '0',  // not yet decoded in parse.ts
        release: layer.ampEnv.release ?? '0',
      }
    : undefined;

  // lfo: shape from layer.lfo.shape, rate from the Morphable<string>
  const lfo: SynthEngine['lfo'] = layer.lfo?.shape && layer.lfo.rate
    ? { wave: layer.lfo.shape, rate: fromMorphable(layer.lfo.rate) }
    : undefined;

  // arp
  const arp: SynthEngine['arp'] = layer.arp
    ? {
        on: layer.arp.run ?? false,
        range: layer.arp.range?.value,
        pattern: layer.arp.direction,
        rate: layer.arp.rate ? fromMorphable(layer.arp.rate) : undefined,
      }
    : undefined;

  return {
    kind: 'synth',
    id: layer.id,
    enabled: layer.enabled ?? false,
    volume: volumeParam(layer.volume),
    octaveShift: layer.octaveShift,
    osc,
    filter,
    ampEnv,
    lfo,
    unison: layer.unison,
    glide: layer.glide !== undefined ? { value: layer.glide } : undefined,
    arp,
    sample: mapSampleRef(layer.sample),
  };
}

// ── FX extraction ─────────────────────────────────────────────────────────────

/**
 * Extract program-level FX from the organFx (shared organ effects) and
 * representative per-layer effects from the first populated synth/piano layer.
 * Only emits entries whose `on` field is explicitly true.
 */
function extractFx(p: NS4Program): NordFx[] {
  const fx: NordFx[] = [];

  const oFx = p.organFx;
  if (oFx) {
    if (oFx.rotary) fx.push({ name: 'Rotary Speaker', on: oFx.rotary.on ?? false, type: oFx.rotary.vibChorusType });
    if (oFx.mod1) fx.push({ name: 'Organ FX Mod 1', on: oFx.mod1.on ?? false, type: oFx.mod1.mode });
    if (oFx.mod2) fx.push({ name: 'Organ FX Mod 2', on: oFx.mod2.on ?? false, type: oFx.mod2.mode });
    if (oFx.delay) fx.push({ name: 'Organ Delay', on: oFx.delay.on ?? false });
    if (oFx.reverb) fx.push({ name: 'Organ Reverb', on: oFx.reverb.on ?? false, type: oFx.reverb.type });
  }

  // Per-layer FX from the first populated layer
  for (const layer of p.layers ?? []) {
    if (layer.delay) fx.push({ name: `Delay [${layer.id}/${layer.kind ?? '?'}]`, on: layer.delay.on ?? false });
    if (layer.reverb) fx.push({ name: `Reverb [${layer.id}/${layer.kind ?? '?'}]`, on: layer.reverb.on ?? false, type: layer.reverb.type });
    if (layer.fxMod1) fx.push({ name: `FX Mod 1 [${layer.id}/${layer.kind ?? '?'}]`, on: layer.fxMod1.on ?? false, type: layer.fxMod1.mode });
    if (layer.fxMod2) fx.push({ name: `FX Mod 2 [${layer.id}/${layer.kind ?? '?'}]`, on: layer.fxMod2.on ?? false, type: layer.fxMod2.mode });
    if (layer.comp) fx.push({ name: `Comp [${layer.id}/${layer.kind ?? '?'}]`, on: layer.comp.on ?? false });
  }

  return fx;
}

// ── Main mapper ───────────────────────────────────────────────────────────────

/**
 * Map a parsed Stage 4 program onto the unified NordProgram.
 *
 * Only maps what NS4Program actually populates; leaves unmapped optionals
 * undefined — parse.ts is incremental by design. Morph assignments are
 * preserved on the `Param.morph` field wherever present.
 */
export function ns4ToProgram(p: NS4Program): NordProgram {
  const meta: NordMeta = {
    model: 'stage-4',
    generation: 'v4',
    name: p.name ?? '',
    category: p.category,
    slot: p.slot,
    version: p.programVersion,
  };

  const engines: NordEngine[] = (p.layers ?? []).map((layer) => {
    switch (layer.kind) {
      case 'organ': return mapOrganLayer(layer);
      case 'piano': return mapPianoLayer(layer);
      case 'synth':
      default:      return mapSynthLayer(layer);
    }
  });

  const master: NordMaster | undefined = undefined; // not yet decoded in parse.ts

  return {
    meta,
    engines,
    fx: extractFx(p),
    master,
  };
}
