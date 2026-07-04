/**
 * Lift a decoded Stage 2 program (ns2/decode.ts, oracle: ns2-program.js and
 * friends) into CommonProgram. Pure model→model; every mapping cites its
 * source field.
 */
import type { Ns2Program, Ns2Slot, Ns2Fx } from '../ns2/decode';
import type { CommonProgram, CommonFxUnit, LiftResult } from './common';
import { timeStringToMs } from './units';

export type { LiftResult } from './common';

// Ns2Fx.name values, per ns2/decode.ts `readFx` (readEffect1/readEffect2/
// readAmpSimEq/readDelay/readRotary, decode.ts:943-1050): 'Effect 1',
// 'Effect 2', 'Amp/EQ', 'Delay', 'Rotary'. Unlike ns3, reverb/comp are never
// pushed into a slot's `fx` array — they live on `program.reverb` /
// `program.compressor` and are lifted separately below.
function liftSlotFx(fx: Ns2Fx[], dropped: string[]): CommonFxUnit[] {
  const out: CommonFxUnit[] = [];
  for (const f of fx) {
    const name = f.name.toLowerCase();
    const amount = f.params?.amount;
    const rate = f.params?.rate;
    const amountMidi = typeof amount === 'number' ? amount : undefined;
    const rateMidi = typeof rate === 'number' ? rate : undefined;
    if (name === 'delay') {
      out.push({ slot: 'delay', on: true, type: f.type, amountMidi, rateMidi });
    } else if (name === 'effect 1') {
      out.push({ slot: 'mod1', on: true, type: f.type, amountMidi, rateMidi });
    } else if (name === 'effect 2') {
      out.push({ slot: 'mod2', on: true, type: f.type, amountMidi, rateMidi });
    } else if (name === 'amp/eq') {
      out.push({ slot: 'ampsim', on: true, type: f.type, amountMidi, rateMidi });
    } else if (name === 'rotary') {
      dropped.push('rotary speaker'); // no CommonFxSlot maps to rotary yet
    } else {
      dropped.push(`effect "${f.name}"`);
    }
  }
  return out;
}

export function fromNs2(
  program: Ns2Program,
  opts: { sampleName?: (id: number) => string | undefined } = {},
): LiftResult {
  const dropped: string[] = [];
  const activeSlots = program.slots.filter((s) => s.active);
  const slot: Ns2Slot | undefined = activeSlots[0] ?? program.slots[0];
  if (!slot) return { common: { sourceModel: 'ns2' }, dropped };
  if (activeSlots.length > 1) dropped.push('second slot (Slot B)');
  if (slot.synth.arpEnabled) dropped.push('arpeggiator');

  const o = slot.organ;
  const p = slot.piano;
  const y = slot.synth;

  const fx: CommonFxUnit[] = [];
  // Global reverb/compressor — decode.ts:1306-1319 (ns2-fx-reverb.js,
  // ns2-fx-compressor.js); program.reverb.amountMidi / .compressor.amountMidi
  // are already 0-127 MIDI values.
  if (program.reverb.on) {
    fx.push({ slot: 'reverb', on: true, type: program.reverb.type, amountMidi: program.reverb.amountMidi });
  }
  if (program.compressor.on) {
    fx.push({ slot: 'comp', on: true, amountMidi: program.compressor.amountMidi });
  }
  fx.push(...liftSlotFx(slot.fx, dropped));

  // Synth mode: ns2's osc field is one of TRI/SAW/SQR/SAMPLE/FM/WAVE
  // (ns2/decode.ts SYNTH_OSC table, decode.ts:24, read at decode.ts:1253).
  // Only 'sample' (case-insensitive — decoder emits the LUT string verbatim)
  // means the slot plays back a factory sample; sampleId is the ns2->ns3
  // hash translation (decode.ts:761) which is 0 exactly when the raw 64-bit
  // hash field is 0 (program init / never written for analog oscillators).
  const isSample = y.osc.toLowerCase() === 'sample' && y.sampleId !== 0;

  const common: CommonProgram = {
    sourceModel: 'ns2',
    organ: {
      on: o.on,
      type: o.type,
      drawbars: o.drawbars.slice(0, 9),
      // Second manual only meaningful when preset2 is active (decode.ts:820-822,
      // Ns2OrganSlot.preset2 / .drawbars2).
      drawbars2: o.preset2 ? o.drawbars2.slice(0, 9) : undefined,
      vibChorus: o.vibChorus,
      percussion: o.percussion,
      volumeMidi: o.volumeMidi, // decode.ts:812 — already MIDI, no dB-string parse
      octaveShift: o.octaveShift,
    },
    piano: {
      on: p.on,
      typeName: p.type,
      soundName: opts.sampleName?.(p.sampleId),
      volumeMidi: p.volumeMidi, // decode.ts:831 — already MIDI
      octaveShift: p.octaveShift,
      dynamics: p.dynamics,
    },
    synth: {
      on: y.on,
      mode: isSample ? 'sample' : 'analog',
      sampleName: isSample ? opts.sampleName?.(y.sampleId) : undefined,
      waveform: isSample ? undefined : y.osc,
      filter: {
        type: y.filter.type,
        cutoffMidi: y.filter.freqMidi,
        resonanceMidi: y.filter.resonanceMidi,
      },
      ampEnv: {
        attackMs: timeStringToMs(y.ampEnv.attack) ?? undefined,
        decayMs: timeStringToMs(y.ampEnv.decay) ?? undefined,
        releaseMs: timeStringToMs(y.ampEnv.release) ?? undefined,
        velocity: y.ampEnv.velocity,
      },
      modEnv: {
        attackMs: timeStringToMs(y.modEnv.attack) ?? undefined,
        decayMs: timeStringToMs(y.modEnv.decay) ?? undefined,
        releaseMs: timeStringToMs(y.modEnv.release) ?? undefined,
        velocity: y.modEnv.velocity,
      },
      lfo: { wave: y.lfoWave, rateMidi: y.lfoRateMidi },
      unison: y.unison,
      volumeMidi: y.volumeMidi, // decode.ts:875 — already MIDI
      octaveShift: y.octaveShift,
    },
    fx,
  };

  return { common, dropped };
}
