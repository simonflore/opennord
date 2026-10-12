/**
 * Lift a decoded Stage 3 program (ns3/decode.ts, read with the Stage 3 firmware's
 * program layout) into CommonProgram. Pure model→model; every mapping cites its source field.
 */
import type { Ns3Program, Ns3Panel } from '../ns3/decode';
import type { CommonProgram, CommonFxUnit, CommonFxSlot, CommonSplit, LiftResult } from './common';
import { dbStringToMidi, timeStringToMs, freqStringToHz } from './units';

export type { LiftResult } from './common';

// Ns3Fx.name values, per ns3/decode.ts `effects`: 'Rotary',
// 'Effect 1', 'Effect 2', 'Amp/EQ', 'Comp', 'Delay', 'Reverb'.
const FX_SLOT_BY_NAME: Record<string, CommonFxSlot> = {
  'effect 1': 'mod1',
  'effect 2': 'mod2',
  delay: 'delay',
  reverb: 'reverb',
  comp: 'comp',
  'amp/eq': 'ampsim',
};

function env(e: { attack: string; decay: string; release: string }, velocity?: boolean) {
  return {
    attackMs: timeStringToMs(e.attack) ?? undefined,
    decayMs: timeStringToMs(e.decay) ?? undefined,
    releaseMs: timeStringToMs(e.release) ?? undefined,
    velocity,
  };
}

function liftFx(fx: Ns3Panel['fx'], dropped: string[]): CommonFxUnit[] {
  const out: CommonFxUnit[] = [];
  for (const f of fx) {
    const slot = FX_SLOT_BY_NAME[f.name.toLowerCase()];
    if (!slot) {
      dropped.push(
        f.name.toLowerCase() === 'rotary' ? 'rotary speaker' : 'an effect from the original program',
      );
      continue;
    }
    const amount = f.params?.amount;
    const rate = f.params?.rate;
    out.push({
      slot,
      on: true, // decodeNs3's `effects` lists only the units switched on
      type: f.type,
      amountMidi: typeof amount === 'number' ? amount : undefined,
      rateMidi: typeof rate === 'number' ? rate : undefined,
    });
  }
  return out;
}

/** Ns3Split's crossfade labels (ns3/decode.ts SPLIT_XFADE) → semitones either side. */
const XFADE_SEMITONES: Record<string, 0 | 6 | 12> = { '+/- 6 semitones': 6, '+/- 12 semitones': 12 };
const zoneFlags = (kbZones: string): boolean[] => [...kbZones].map((c) => c === '1');

/** The program's split, when it is switched on and at least one point is. */
function liftSplit(program: Ns3Program, panel: Ns3Panel): CommonSplit | undefined {
  const s = program.split;
  if (!s?.on || !s.points.some((pt) => pt.on)) return undefined;
  return {
    points: s.points.map((pt) => ({ on: pt.on, note: pt.note, xfadeSemitones: XFADE_SEMITONES[pt.xfade] ?? 0 })),
    zones: {
      organ: zoneFlags(panel.organ.kbZones),
      piano: zoneFlags(panel.piano.kbZones),
      synth: zoneFlags(panel.synth.kbZones),
    },
  };
}

export function fromNs3(
  program: Ns3Program,
  opts: { sampleName?: (id: number, variation?: number) => string | undefined } = {},
): LiftResult {
  const dropped: string[] = [];
  const panel = program.panels[0];
  if (!panel) return { common: { sourceModel: 'ns3', name: program.name }, dropped };
  if (program.panels.length > 1) dropped.push('second panel (Panel B)');

  const o = panel.organ;
  const p = panel.piano;
  const y = panel.synth;

  if (y.arp?.on) dropped.push('arpeggiator');

  // Synth mode: ns3's oscillator.type is one of Classic/Wave/Formant/Super/Sample
  // (ns3/decode.ts SYNTH_OSC table, Edt_Syn_kOscBank). Only 'Sample'
  // means the panel is playing back a factory sample; everything else is one of
  // the four analog-modeled oscillator families. sampleId is only meaningful
  // when type === 'Sample' (decode.ts comment on Ns3Synth.sampleId); a 0 id
  // (the firmware default) is treated as "no sample".
  const isSample = y.oscillator.type === 'Sample' && y.sampleId !== 0;

  const common: CommonProgram = {
    sourceModel: 'ns3',
    name: program.name,
    organ: {
      on: o.on,
      type: o.type,
      drawbars: o.drawbars.slice(0, 9),
      vibChorus: o.vibChorus,
      percussion: o.percussion,
      volumeMidi: dbStringToMidi(o.volume) ?? undefined,
      octaveShift: o.octaveShift,
    },
    piano: {
      on: p.on,
      typeName: p.type,
      soundName: opts.sampleName?.(p.sampleId, p.sampleVariation),
      volumeMidi: dbStringToMidi(p.volume) ?? undefined,
      octaveShift: p.octaveShift,
    },
    synth: {
      on: y.on,
      mode: isSample ? 'sample' : 'analog',
      sampleName: isSample ? opts.sampleName?.(y.sampleId) : undefined,
      waveform: isSample ? undefined : y.oscillator.waveform,
      filter: {
        type: y.filter.type,
        cutoffMidi: undefined, // carried as Hz below via cutoffHz for the emitter's nearest-match
        resonanceMidi: undefined,
      },
      ampEnv: env(y.envAmp, y.envAmp.velocity !== 'Off'),
      modEnv: env(y.envMod),
      lfo: { wave: y.lfo.wave, rateHz: freqStringToHz(y.lfo.rate) ?? undefined },
      unison: y.unison,
      volumeMidi: dbStringToMidi(y.volume) ?? undefined,
    },
    fx: liftFx(panel.fx, dropped),
    split: liftSplit(program, panel),
  };

  // Cutoff: keep the display string's Hz for the emitter's nearest-match.
  const hz = freqStringToHz(y.filter.cutoff);
  if (common.synth && hz != null) common.synth.cutoffHz = hz;

  // Resonance: ns3 emits a "0.0".."10.0" 0-10 display string (lin10() in
  // ns3/decode.ts); normalize to 0-1. When filter.type === 'LP+HP', the
  // resonance field carries the HP cutoff frequency label instead (see
  // ns3/decode.ts `synth`), so leave resonance01 undefined in that case.
  if (common.synth && y.filter.type !== 'LP+HP') {
    const resonanceRaw = parseFloat(y.filter.resonance);
    if (!Number.isNaN(resonanceRaw)) {
      common.synth.resonance01 = resonanceRaw / 10;
    }
  }

  return { common, dropped };
}
