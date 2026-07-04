import { describe, expect, it } from 'vitest';
import { fromNs2 } from './from-ns2';
import type { Ns2Program, Ns2Slot } from '../ns2/decode';

/** Slot A: organ Vox + drawbars, piano Electric, synth analog saw. */
const slotA: Ns2Slot = {
  id: 'A',
  active: true,
  organ: {
    on: true,
    type: 'Vox',
    volume: '0.0 dB',
    volumeMidi: 127,
    octaveShift: 1,
    kbZone: 'All',
    pitchStick: false,
    sustainPedal: false,
    latchPedal: false,
    kbGate: false,
    output: '1+2',
    preset2: false,
    drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
    drawbars2: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    vibChorus: { on: true, mode: 'C3' },
    percussion: { on: false, third: false, fast: false, soft: false },
  },
  piano: {
    on: true,
    type: 'E Piano 1',
    volume: '-6.2 dB',
    volumeMidi: 100,
    octaveShift: 0,
    kbZone: 'All',
    pitchStick: false,
    sustainPedal: false,
    latchPedal: false,
    kbGate: false,
    output: '1+2',
    sampleId: 42,
    clavVariation: 0,
    slotDetune: 'Off',
    dynamics: '2',
    longRelease: false,
    stringResonance: false,
    pedalNoise: false,
    clavinetModel: 'A',
    clavinetEq: 'Off',
    clavinetEqHi: 'Off',
  },
  synth: {
    on: true,
    osc: 'saw',
    volume: '0.0 dB',
    volumeMidi: 127,
    octaveShift: 0,
    kbZone: 'All',
    pitchStick: false,
    sustainPedal: false,
    latchPedal: false,
    kbGate: false,
    kbHold: false,
    output: '1+2',
    sampleId: 0,
    voice: 'Poly',
    glide: 0,
    unison: 'Off',
    vibrato: 'Off',
    arpEnabled: false,
    arpRateMidi: 0,
    arpRate: '120 bpm',
    arpMasterClock: false,
    arpRange: '1 Octave',
    arpPattern: 'Up',
    filter: {
      type: 'LP24',
      freqMidi: 100,
      freq: '1 kHz',
      resonanceMidi: 20,
      mod1Midi: 0,
      mod2Midi: 0,
      kbTrack: false,
    },
    modEnv: {
      attackMidi: 4,
      attack: 'Attack: 0.5 ms',
      decayMidi: 10,
      decay: 'Decay: 3.0 ms',
      releaseMidi: 10,
      release: 'Release: 3.0 ms',
      velocity: false,
    },
    ampEnv: {
      attackMidi: 4,
      attack: 'Attack: 0.5 ms',
      decayMidi: 90,
      decay: 'Decay: 45 s',
      releaseMidi: 10,
      release: 'Release: 3.0 ms',
      velocity: true,
    },
    lfoWave: 'Triangle',
    lfoRateMidi: 20,
    lfoRate: '2.0 Hz',
    lfoMasterClock: false,
  },
  fx: [
    { name: 'Delay', source: 'Synth', params: { amount: '5.0', feedback: '2.0' } },
  ],
};

/** Slot B: inactive by default in the single-slot test program. */
const slotB: Ns2Slot = {
  ...slotA,
  id: 'B',
  active: false,
};

const prog: Ns2Program = {
  slots: [slotA, slotB],
  globalFx: [],
  reverb: { on: true, type: 'Hall', amountMidi: 80 },
  compressor: { on: false, amountMidi: 0 },
};

/** Same shape as `prog` but with Slot B also active, for the drop-reporting test. */
const progBothActive: Ns2Program = {
  ...prog,
  slots: [slotA, { ...slotB, active: true }],
};

/** Same shape as `prog` but with the arp switched on. */
const progWithArpOn: Ns2Program = {
  ...prog,
  slots: [{ ...slotA, synth: { ...slotA.synth, arpEnabled: true } }, slotB],
};

describe('fromNs2', () => {
  const { common, dropped } = fromNs2(prog, {
    sampleName: (id) => (id === 42 ? 'Grand Piano' : undefined),
  });

  it('lifts organ using volumeMidi directly (no dB-string parse)', () => {
    expect(common.organ).toMatchObject({
      on: true,
      type: 'Vox',
      drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
      octaveShift: 1,
      vibChorus: { on: true, mode: 'C3' },
    });
    expect(common.organ?.volumeMidi).toBe(127);
  });

  it('does not carry drawbars2 when preset2 is false', () => {
    expect(common.organ?.drawbars2).toBeUndefined();
  });

  it('lifts piano dynamics and volumeMidi', () => {
    expect(common.piano?.typeName).toBe('E Piano 1');
    expect(common.piano?.volumeMidi).toBe(100);
    expect(common.piano?.dynamics).toBe('2');
    expect(common.piano?.soundName).toBe('Grand Piano');
  });

  it('detects analog synth mode from osc when sampleId is 0', () => {
    expect(common.synth?.mode).toBe('analog');
    expect(common.synth?.waveform).toBe('saw');
  });

  it('normalizes synth env from midi + display string', () => {
    expect(common.synth?.ampEnv?.decayMs).toBe(45000);
    expect(common.synth?.ampEnv?.velocity).toBe(true);
  });

  it('lifts synth cutoffHz from the freq string (e.g. "1 kHz")', () => {
    expect(common.synth?.cutoffHz).toBe(1000);
  });

  it('lifts synth LFO rateHz from the lfoRate string (e.g. "2.0 Hz")', () => {
    expect(common.synth?.lfo?.rateHz).toBe(2);
  });

  it('lifts global reverb into a CommonFxUnit', () => {
    const reverb = common.fx?.find((f) => f.slot === 'reverb');
    expect(reverb).toMatchObject({ on: true, type: 'Hall', amountMidi: 80 });
  });

  it('does not lift the disabled compressor', () => {
    expect(common.fx?.find((f) => f.slot === 'comp')).toBeUndefined();
  });

  it('maps per-slot delay fx', () => {
    const delay = common.fx?.find((f) => f.slot === 'delay');
    expect(delay?.on).toBe(true);
  });

  it('does not report the arpeggiator as dropped when it was off', () => {
    expect(dropped).not.toContain('arpeggiator');
  });

  it('does not report a second slot as dropped when only Slot A is active', () => {
    expect(dropped).not.toContain('second slot (Slot B)');
  });
});

describe('fromNs2 — synth sample mode', () => {
  it('detects sample mode when osc is SAMPLE and sampleId is non-zero', () => {
    const sampleSlot: Ns2Slot = {
      ...slotA,
      synth: { ...slotA.synth, osc: 'sample', sampleId: 999 },
    };
    const { common } = fromNs2(
      { ...prog, slots: [sampleSlot, slotB] },
      { sampleName: (id) => (id === 999 ? 'Strings Legato' : undefined) },
    );
    expect(common.synth?.mode).toBe('sample');
    expect(common.synth?.sampleName).toBe('Strings Legato');
  });
});

describe('fromNs2 — organ drawbars2', () => {
  it('carries drawbars2 only when preset2 is true', () => {
    const preset2Slot: Ns2Slot = {
      ...slotA,
      organ: { ...slotA.organ, preset2: true, drawbars2: [1, 2, 3, 4, 5, 6, 7, 8, 0] },
    };
    const { common } = fromNs2({ ...prog, slots: [preset2Slot, slotB] });
    expect(common.organ?.drawbars2).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  });
});

describe('fromNs2 — dropped-feature reporting', () => {
  it('reports the arpeggiator as dropped when it was on in the source', () => {
    const { dropped } = fromNs2(progWithArpOn);
    expect(dropped).toContain('arpeggiator');
  });

  it('reports a second slot as dropped when both slots are active', () => {
    const { dropped } = fromNs2(progBothActive);
    expect(dropped).toContain('second slot (Slot B)');
  });
});
