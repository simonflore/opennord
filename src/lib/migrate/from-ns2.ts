/**
 * Lift a decoded Stage 2 program (ns2/decode.ts, read through the Stage 2
 * firmware layout) into CommonProgram. Pure model→model; every mapping cites its
 * source field.
 */
import type { Ns2Program, Ns2Slot, Ns2Fx } from '../ns2/decode';
import type { CommonProgram, CommonFxUnit, LiftResult } from './common';
import { freqStringToHz, timeStringToMs } from './units';
import { settingOf } from '../clavia/fx-block';

export type { LiftResult } from './common';

// Ns2Fx.name values of a slot's `fx`, per ns2/decode.ts `slotFx`: 'Effect 1',
// 'Effect 2', 'Delay', 'Amp/EQ', each listed on or off ('Rotary' is still handled
// for older shapes). Reverb, comp and the rotary are program-wide: they are in
// `program.globalFx` and, as plain values, on `program.reverb` / `.compressor` /
// `.rotary`, which is what is lifted below.
// ns2 per-effect source select (Ns2Fx.source, EFFECT_SRC = ['Organ','Piano',
// 'Synth'], ns2/decode.ts) tells us which engine the effect was routed through.
// Carry it as CommonFxUnit.host so the ns4 emitter can host the FX on that
// engine rather than the default synth→piano→organ priority.
function fxHost(source: string | undefined): CommonFxUnit['host'] {
  switch (source) {
    case 'Organ': return 'organ';
    case 'Piano': return 'piano';
    case 'Synth': return 'synth';
    default: return undefined;
  }
}

function liftSlotFx(fx: Ns2Fx[], dropped: string[]): CommonFxUnit[] {
  const out: CommonFxUnit[] = [];
  for (const f of fx) {
    if (!f.on) continue; // a slot lists every block; only the ones switched on carry over
    const name = f.name.toLowerCase();
    // A setting's midi is the stored 0–127 knob position; a clocked rate has none.
    const amountMidi = settingOf(f, 'amount')?.midi;
    const rateMidi = settingOf(f, 'rate')?.midi;
    const host = fxHost(f.source);
    if (name === 'delay') {
      out.push({ slot: 'delay', on: true, type: f.type, host, amountMidi, rateMidi });
    } else if (name === 'effect 1') {
      out.push({ slot: 'mod1', on: true, type: f.type, host, amountMidi, rateMidi });
    } else if (name === 'effect 2') {
      out.push({ slot: 'mod2', on: true, type: f.type, host, amountMidi, rateMidi });
    } else if (name === 'amp/eq') {
      out.push({ slot: 'ampsim', on: true, type: f.type, host, amountMidi, rateMidi });
    } else if (name === 'rotary') {
      dropped.push('rotary speaker'); // no CommonFxSlot maps to rotary yet
    } else {
      dropped.push('an effect from the original program');
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
  // Global reverb/compressor — decodeNs2's globalFx container (Reverb Dry/Wet,
  // Compressor Amount); program.reverb.amountMidi / .compressor.amountMidi
  // are already 0-127 MIDI values.
  if (program.reverb.on) {
    fx.push({ slot: 'reverb', on: true, type: program.reverb.type, amountMidi: program.reverb.amountMidi });
  }
  if (program.compressor.on) {
    fx.push({ slot: 'comp', on: true, amountMidi: program.compressor.amountMidi });
  }
  fx.push(...liftSlotFx(slot.fx, dropped));
  // The rotary speaker is program-wide on the Stage 2 (globalFx container,
  // Ns2Program.rotary); no CommonFxSlot maps to it yet.
  if (program.rotary?.on && !dropped.includes('rotary speaker')) dropped.push('rotary speaker');

  // Synth mode: ns2's osc field is one of TRI/SAW/SQR/SAMPLE/FM/WAVE
  // (ns2/decode.ts SYNTH_OSC table, read in `synth()`).
  // Only 'sample' (case-insensitive — decoder emits the LUT string verbatim)
  // means the slot plays back a factory sample; sampleId is the ns2->ns3
  // hash translation (ns2ToNs3Id) which is 0 exactly when the raw 32-bit
  // hash field is 0 (program init / never written for analog oscillators).
  const isSample = y.osc.toLowerCase() === 'sample' && y.sampleId !== 0;

  const common: CommonProgram = {
    sourceModel: 'ns2',
    organ: {
      on: o.on,
      type: o.type,
      drawbars: o.drawbars.slice(0, 9),
      // Second manual only meaningful when preset2 is active
      // (Ns2OrganSlot.preset2 / .drawbars2).
      drawbars2: o.preset2 ? o.drawbars2.slice(0, 9) : undefined,
      vibChorus: o.vibChorus,
      percussion: o.percussion,
      volumeMidi: o.volumeMidi, // Organ / Level — already MIDI, no dB-string parse
      octaveShift: o.octaveShift,
    },
    piano: {
      on: p.on,
      typeName: p.type,
      soundName: opts.sampleName?.(p.sampleId),
      volumeMidi: p.volumeMidi, // Piano / Level — already MIDI
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
      // Cutoff: carry the display string's Hz for the emitter's nearest-match
      // (source: Ns2SynthFilter.freq, e.g. '1 kHz').
      cutoffHz: freqStringToHz(y.filter.freq) ?? undefined,
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
      // LFO: carry wave, MIDI rate, and the display string's Hz for the emitter's
      // nearest-match (source: Ns2SynthSlot.lfoRate, e.g. '2.0 Hz').
      lfo: { wave: y.lfoWave, rateMidi: y.lfoRateMidi, rateHz: freqStringToHz(y.lfoRate) ?? undefined },
      unison: y.unison,
      volumeMidi: y.volumeMidi, // Synth / Level — already MIDI
      octaveShift: y.octaveShift,
    },
    fx,
  };

  return { common, dropped };
}
