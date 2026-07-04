import { describe, expect, it } from 'vitest';
import { fromNs3 } from './from-ns3';
import type { Ns3Program } from '../ns3/decode';

const prog: Ns3Program = {
  name: 'Boston Organ',
  panels: [
    {
      id: 'A',
      organ: {
        on: true, type: 'B3', volume: '0.0 dB',
        drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], octaveShift: 1,
        vibChorus: { on: true, mode: 'C3' },
        percussion: { on: true, third: false, fast: true, soft: false },
      },
      piano: {
        on: false, type: 'Grand', volume: 'Off',
        sampleId: 12345, sampleVariation: 0, timbre: 'None', octaveShift: 0,
      },
      synth: {
        on: true, volume: '-6.2 dB', voice: 'Poly', glide: '0.0', unison: 'Off',
        vibrato: 'Off',
        oscillator: { type: 'Sample', waveform: '', config: 'None', pitch: '0 semi' },
        filter: { type: 'LP24', cutoff: '1 kHz', resonance: '2.0', kbTrack: 'Off', drive: 'Off' },
        lfo: { wave: 'Triangle', rate: '2.0 Hz', masterClock: false },
        envMod: { attack: '0.5 ms', decay: '3.0 ms', release: '3.0 ms' },
        envAmp: { attack: '0.5 ms', decay: '45 s', release: '3.0 ms', velocity: 'Off' },
        arp: { on: false, range: '1 Octave', pattern: 'Up', rate: '120 bpm', masterClock: false },
        sampleId: 999,
        osc: '', cutoff: '', filter_type: '',
      },
      fx: [
        { name: 'Reverb', type: 'Hall 1', params: { amount: '5.0' } },
        { name: 'Delay', params: { mix: '3.0', feedback: '2.0' } },
      ],
    },
  ],
};

/** Same shape as `prog` but with the arp switched on, for the drop-reporting test. */
const progWithArpOn: Ns3Program = {
  ...prog,
  panels: [{ ...prog.panels[0], synth: { ...prog.panels[0].synth, arp: { ...prog.panels[0].synth.arp, on: true } } }],
};

describe('fromNs3', () => {
  const { common, dropped } = fromNs3(prog, {
    sampleName: (id) => (id === 999 ? 'Strings Legato' : undefined),
  });

  it('lifts organ exactly', () => {
    expect(common.organ).toMatchObject({
      on: true, type: 'B3',
      drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
      octaveShift: 1,
      vibChorus: { on: true, mode: 'C3' },
      percussion: { on: true, third: false, fast: true, soft: false },
    });
    expect(common.organ?.volumeMidi).toBe(127); // "0.0 dB" is NORD_DB max index
  });

  it('keeps disabled engines off but carries their identity', () => {
    expect(common.piano?.on).toBe(false);
    expect(common.piano?.typeName).toBe('Grand');
  });

  it('normalizes synth values', () => {
    expect(common.synth?.mode).toBe('sample'); // ns3 oscillator.type === 'Sample'
    expect(common.synth?.filter?.type).toBe('LP24');
    expect(common.synth?.ampEnv?.decayMs).toBe(45000);
    expect(common.synth?.lfo?.rateHz).toBe(2);
    expect(common.synth?.sampleName).toBe('Strings Legato');
    expect(common.synth?.cutoffHz).toBe(1000);
    expect(common.synth?.resonance01).toBeCloseTo(0.2);
  });

  it('maps fx list to CommonFxUnit slots', () => {
    const reverb = common.fx?.find((f) => f.slot === 'reverb');
    expect(reverb?.type).toBe('Hall 1');
    const delay = common.fx?.find((f) => f.slot === 'delay');
    expect(delay?.on).toBe(true);
  });

  it('does not report the arpeggiator as dropped when it was off in the source', () => {
    expect(dropped).not.toContain('arpeggiator');
  });
});

describe('fromNs3 — dropped-feature reporting', () => {
  it('reports the arpeggiator as dropped when it was on in the source', () => {
    const { dropped } = fromNs3(progWithArpOn);
    expect(dropped).toContain('arpeggiator');
  });

  it('reports a second panel as dropped when present', () => {
    const twoPanel: Ns3Program = { ...prog, panels: [prog.panels[0], prog.panels[0]] };
    const { dropped } = fromNs3(twoPanel);
    expect(dropped.some((d) => d.toLowerCase().includes('panel'))).toBe(true);
  });
});
