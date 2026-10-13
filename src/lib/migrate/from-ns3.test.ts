import { describe, expect, it } from 'vitest';
import { fromNs3 } from './from-ns3';
import { decodeNs3, type Ns3Program } from '../ns3/decode';
import { ns3SynthFile, ns3ZeroFile } from '../ns3/file.synth';
import { emitNs4 } from './to-ns4';
import { naiveAdvisor } from './advisor';
import { setting } from '../clavia/fx-block';

const prog: Ns3Program = {
  name: 'Boston Organ',
  split: null,
  panels: [
    {
      id: 'A',
      organ: {
        on: true, type: 'B3', kbZones: '1111', volume: '0.0 dB',
        drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], octaveShift: 1,
        vibChorus: { on: true, mode: 'C3' },
        percussion: { on: true, third: false, fast: true, soft: false },
      },
      piano: {
        on: false, type: 'Grand', kbZones: '1111', volume: 'Off',
        sampleId: 12345, sampleVariation: 0, timbre: 'None', octaveShift: 0,
      },
      synth: {
        on: true, kbZones: '1111', volume: '-6.2 dB', voice: 'Poly', glide: '0.0', unison: 'Off',
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
        { name: 'Reverb', on: true, type: 'Hall 1', settings: [setting('amount', '5.0', 64)] },
        { name: 'Delay', on: true, settings: [setting('mix', '3.0'), setting('feedback', '2.0')] },
        { name: 'Comp', on: false, settings: [setting('amount', '9.0', 114)] },
      ],
    },
  ],
};

/** Same shape as `prog` but with the arp switched on, for the drop-reporting test. */
const progWithArpOn: Ns3Program = {
  ...prog,
  split: null,
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

  it('carries an effect amount as its stored 0–127 position', () => {
    expect(common.fx?.find((f) => f.slot === 'reverb')?.amountMidi).toBe(64);
  });

  it('leaves out a block that is switched off', () => {
    expect(common.fx?.find((f) => f.slot === 'comp')).toBeUndefined();
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

describe('fromNs3 — LP+HP filter mode', () => {
  it('leaves resonance01 undefined when filter type is LP+HP', () => {
    const progLpHp: Ns3Program = {
      name: 'LP+HP Test',
      split: null,
      panels: [
        {
          id: 'A',
          organ: {
            on: false, type: 'B3', kbZones: '1111', volume: 'Off',
            drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0], octaveShift: 0,
            vibChorus: { on: false, mode: 'C1' },
            percussion: { on: false, third: false, fast: false, soft: false },
          },
          piano: {
            on: false, type: 'Grand', kbZones: '1111', volume: 'Off',
            sampleId: 0, sampleVariation: 0, timbre: 'None', octaveShift: 0,
          },
          synth: {
            on: true, kbZones: '1111', volume: '-6.2 dB', voice: 'Poly', glide: '0.0', unison: 'Off',
            vibrato: 'Off',
            oscillator: { type: 'Classic', waveform: 'Saw', config: 'None', pitch: '0 semi' },
            filter: { type: 'LP+HP', cutoff: '1 kHz', resonance: '14 Hz', kbTrack: 'Off', drive: 'Off' },
            lfo: { wave: 'Triangle', rate: '2.0 Hz', masterClock: false },
            envMod: { attack: '0.5 ms', decay: '3.0 ms', release: '3.0 ms' },
            envAmp: { attack: '0.5 ms', decay: '45 s', release: '3.0 ms', velocity: 'Off' },
            arp: { on: false, range: '1 Octave', pattern: 'Up', rate: '120 bpm', masterClock: false },
            sampleId: 0,
            osc: '', cutoff: '', filter_type: '',
          },
          fx: [],
        },
      ],
    };

    const { common } = fromNs3(progLpHp);
    expect(common.synth?.filter?.type).toBe('LP+HP');
    expect(common.synth?.resonance01).toBeUndefined();
  });
});

describe('fromNs3 on a decoded buffer (firmware-registry field fixes)', () => {
  it('carries the corrected effect rates + amp type, and still drops the rotary', () => {
    const b = ns3ZeroFile();     // NSM-era file, every field zero
    b[0x10b] = 0x80 | 0x10;      // rotary on + Effect 1 on (type Panning)
    b[0x10c] = 0x32; b[0x10d] = 0x80; // Effect 1 rate 101
    b[0x114] = 0x80 | 0x03; b[0x115] = 0xf8; // Effect 2 on, rate 127
    b[0x129] = 0x04; b[0x12a] = 1 << 5;     // Amp/EQ on, type 1 → Twin
    b[0x34] = 0x01;              // rotary speed Fast (program-wide)
    const { common, dropped } = fromNs3(decodeNs3(b));
    expect(common.fx?.find((f) => f.slot === 'mod1')?.rateMidi).toBe(101);
    expect(common.fx?.find((f) => f.slot === 'mod2')?.rateMidi).toBe(127);
    expect(common.fx?.find((f) => f.slot === 'ampsim')?.type).toBe('Twin');
    expect(dropped).toContain('rotary speaker');
  });
});

describe('Stage 3 → Stage 4: effect amounts carry over', () => {
  it('writes a decoded file\'s reverb and Effect 1 amounts into the Stage 4 program', async () => {
    const file = ns3SynthFile({
      'synthCommonA.enable': 1,
      'effectsA.rvbEnable': 1, 'effectsA.rvbAmt': 100,
      'effectsA.fx1Enable': 1, 'effectsA.fx1Amt': 42,
      'effectsA.cmpAmt': 90, // the compressor is off: its amount must not be written
    });
    const { common } = fromNs3(decodeNs3(file));
    expect(common.fx?.find((f) => f.slot === 'reverb')?.amountMidi).toBe(100);
    expect(common.fx?.find((f) => f.slot === 'mod1')?.amountMidi).toBe(42);
    const { edits, report } = await emitNs4(common, [], { advisor: naiveAdvisor, sounds: [] });
    const value = (name: string) => edits.find((e) => e.name === name)?.value;
    expect(value('FX reverb amount')).toBe(100);
    expect(value('FX mod 1 amount')).toBe(42);
    expect(value('FX comp amount')).toBeUndefined();
    expect(report.notes.map((n) => n.note).join(' ')).not.toMatch(/depth left at a sensible default/);
  });
});
