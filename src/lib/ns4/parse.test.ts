import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program, readAsciiFixed } from './parse';

// Real Stage 4 program — the same regression fixture used by bits.test.ts.
const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);

describe('parseNs4Program', () => {
  it('never throws and preserves raw bytes for an unknown buffer', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const program = parseNs4Program(bytes);
    expect(program.bytes).toBe(bytes);
    expect(program.parsed).toBe(false);
    // Transparency: it tells you what it couldn't do rather than guessing.
    expect(program.warnings.length).toBeGreaterThan(0);
  });

  it('handles an empty buffer', () => {
    const program = parseNs4Program(new Uint8Array());
    expect(program.bytes.length).toBe(0);
    expect(program.parsed).toBe(false);
  });
});

// Expected values cross-checked against the ns4decode fixture CSVs.
describe('parseNs4Program — regression fixture', () => {
  const prog = parseNs4Program(fixtureBytes);

  it('recognises the file and returns parsed:true', () => {
    expect(prog.parsed).toBe(true);
    expect(prog.kind).toBe('program');
    expect(prog.warnings).toHaveLength(0);
  });

  it('produces 5 layers: 2 piano then 3 synth', () => {
    expect(prog.layers).toHaveLength(5);
    const kinds = prog.layers!.map((l) => l.kind);
    expect(kinds).toEqual(['piano', 'piano', 'synth', 'synth', 'synth']);
  });

  describe('piano layers', () => {
    it('layer A — Clavinet, enabled', () => {
      const la = prog.layers![0];
      expect(la.id).toBe('A');
      expect(la.enabled).toBe(true);
      expect(la.enabledSceneII).toBe(false);
      expect(la.pianoType).toBe('Clav');
      expect(la.pianoModelName).toBe('Clavinet D6 6.1');
      expect(la.pianoModelId).toBe(550238836);
      expect(la.timbre).toBeTruthy();
      expect(la.touch).toBe('heavy');
    });

    it('layer A — volume morphable with pedal assignment', () => {
      const vol = prog.layers![0].volume!;
      expect(vol.value).toBe('-2.2 dB');
      expect(vol.wheel).toBeUndefined();
      expect(vol.aftertouch).toBeUndefined();
      expect(vol.pedal).toBe('-19.2 dB'); // fixture: volume change with ctrlped = -19.2 dB
    });

    it('layer B — Grand piano, enabled', () => {
      const lb = prog.layers![1];
      expect(lb.id).toBe('B');
      expect(lb.enabled).toBe(true);
      expect(lb.pianoType).toBe('Grand');
      expect(lb.volume!.value).toBe('-5.2 dB');
      expect(lb.octaveShift).toBe(1); // fixture: +1
    });

    it('piano layers have KB zones and sustain pedal', () => {
      const la = prog.layers![0];
      expect(la.kbZones).toMatch(/^[1o]{4}$/);
      expect(la.sustainPedal).toBe(true);
    });
  });

  describe('synth layers', () => {
    it('layer A — disabled, samples mode, correct sample info', () => {
      const la = prog.layers![2];
      expect(la.id).toBe('A');
      expect(la.kind).toBe('synth');
      expect(la.enabled).toBe(false);
      expect(la.sample!.name).toBe('Strings Multi FastAtk_ST 4.1');
      expect(la.sample!.categoryName).toBe('Strings Solo');
      expect(la.sample!.id).toBe(2768936524);
      expect(la.sample!.slot).toBe(2);
      expect(la.sample!.bankSize).toBe(100);
      expect(la.sample!.options).toBe('FAST ATK');
      expect(la.sample!.bright).toBe(true);
    });

    it('layer A — vibrato mode A.T.', () => {
      const la = prog.layers![2];
      expect(la.vibrato).toBeDefined();
      expect(la.vibrato!.mode).toBe('A.T.');
    });

    it('layer B — enabled, analog, vibrato DLY with delay/rate/amount', () => {
      const lb = prog.layers![3];
      expect(lb.id).toBe('B');
      expect(lb.enabled).toBe(true);
      expect(lb.source).toBe('analog');
      expect(lb.vibrato!.mode).toBe('DLY');
      expect(lb.vibrato!.delay).toBeCloseTo(1.2);
      expect(lb.vibrato!.rate).toBeCloseTo(8.0);
      expect(lb.vibrato!.amount).toBeCloseTo(2.8);
    });

    it('layer B — volume with morphs, octave shift -2', () => {
      const lb = prog.layers![3];
      expect(lb.volume!.value).toBe('-11.9 dB');
      expect(lb.volume!.aftertouch).toBe('-4.3 dB');
      expect(lb.octaveShift).toBe(-2);
    });

    it('layer B — arp enabled, mode and direction set', () => {
      const lb = prog.layers![3];
      expect(lb.arp!.run).toBe(true);
      expect(lb.arp!.mode).toBeTruthy();
      expect(lb.arp!.direction).toBeTruthy();
    });

    it('layer C — enabled, no vibrato', () => {
      const lc = prog.layers![4];
      expect(lc.id).toBe('C');
      expect(lc.enabled).toBe(true);
      expect(lc.vibrato).toBeUndefined();
    });

    it('layer C — mono and voice priority set', () => {
      const lc = prog.layers![4];
      expect(lc.mono).toBe(true);
      expect(lc.voicePriority).toBe('LO');
      expect(lc.legato).toBe(false);
    });

    it('layer A — pan', () => {
      expect(prog.layers![2].pan!.value).toBe('L  4.7');
    });
  });
});

describe('readAsciiFixed', () => {
  it('reads a fixed-length ASCII field and trims trailing padding', () => {
    const bytes = new Uint8Array([...'Grand Piano '].map((c) => c.charCodeAt(0)));
    expect(readAsciiFixed(bytes, 0, bytes.length)).toBe('Grand Piano');
  });

  it('stops at a NUL terminator', () => {
    const bytes = new Uint8Array([0x41, 0x42, 0x00, 0x43]); // "AB\0C"
    expect(readAsciiFixed(bytes, 0, 4)).toBe('AB');
  });

  it('reads from an offset', () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x4e, 0x53, 0x34]); // ..NS4
    expect(readAsciiFixed(bytes, 2, 3)).toBe('NS4');
  });
});
