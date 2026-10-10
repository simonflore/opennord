import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from '../../ns4/parse';
import { drawbarPosition, organParamsFromLayer, parseDb, parseVibChorus, toOrganModel } from './params';
import { renderOffline } from './core';
import { VOLUME_OFF_DB } from './types';
import type { NS4Layer } from '../../ns4/types';

const program = parseNs4Program(new Uint8Array(
  readFileSync(fileURLToPath(new URL('../../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
));
const organs = (program.layers ?? []).filter((l) => l.kind === 'organ');
const vox = organs.find((l) => l.id === 'A')!;
const b3 = organs.find((l) => l.id === 'B')!;

describe('display-string parsing', () => {
  it('reads drawbar positions, Farfisa tabs and the Vox selector', () => {
    expect(drawbarPosition('4')).toBe(4);
    expect(drawbarPosition('0')).toBe(0);
    expect(drawbarPosition('5+6+7+8')).toBe(8);
    expect(drawbarPosition('1+2+3+4')).toBe(0);
    expect(drawbarPosition('4+5')).toBe(5);
    expect(drawbarPosition(undefined)).toBe(0);
    expect(drawbarPosition('none')).toBe(0);
  });

  it('reads dB volumes', () => {
    expect(parseDb('-4.7 dB')).toBeCloseTo(-4.7, 9);
    expect(parseDb('+1.0 dB')).toBe(1);
    expect(parseDb('-oo dB')).toBe(-Infinity);
    expect(parseDb('volume off')).toBe(-Infinity); // the Stage 4 table's raw 0
    expect(parseDb(undefined)).toBe(0);
  });

  it('reads vib/chorus types and models', () => {
    expect(parseVibChorus('C1')).toBe('C1');
    expect(parseVibChorus('v3')).toBe('V3');
    expect(parseVibChorus('X')).toBeUndefined();
    expect(toOrganModel('pipe2')).toBe('PIPE2');
    expect(toOrganModel('B3 BASS')).toBe('B3 BASS');
    expect(toOrganModel('???')).toBe('B3');
  });
});

describe('organParamsFromLayer (regression fixture)', () => {
  it('maps the B3 layer', () => {
    const p = organParamsFromLayer(b3, program.organFx);
    expect(p.model).toBe('B3');
    expect(p.drawbars).toEqual([1, 3, 4, 5, 6, 4, 2, 1, 7]);
    expect(p.percussion).toEqual({ on: true, harm3rd: false, decayFast: true, volSoft: true });
    expect(p.vibrato).toEqual({ on: false, type: 'C1' });
    expect(p.volumeDb).toBeCloseTo(-16.2, 9);
    expect(p.octaveShift).toBe(0);
  });

  it('maps the Vox layer', () => {
    const p = organParamsFromLayer(vox, program.organFx);
    expect(p.model).toBe('VOX');
    expect(p.drawbars.slice(0, 8)).toEqual([4, 2, 2, 1, 1, 2, 2, 1]);
    expect(p.vibrato).toEqual({ on: true, type: 'V2' });
    expect(p.octaveShift).toBe(1);
    expect(p.volumeDb).toBeCloseTo(-4.7, 9);
  });

  it('applies morphs toward their targets', () => {
    // B3 drawbar 3 (8′) is 4 with an aftertouch target of 5; drawbar 9 is 7 → wheel 3.
    const half = organParamsFromLayer(b3, program.organFx, { aftertouch: 0.5, wheel: 1 });
    expect(half.drawbars[2]).toBeCloseTo(4.5, 9);
    expect(half.drawbars[8]).toBe(3);
    expect(half.drawbars[4]).toBe(3); // drawbar 5: 6 → wheel 3
    // Volume morphs in knob position (dB = 40·log10(raw/127)): −16.2 dB, wheel
    // target −11.6 dB (full), A.T. target −7.6 dB (half).
    const pos = (db: number) => 10 ** (db / 40);
    const v = pos(-16.2) + (pos(-11.6) - pos(-16.2)) + 0.5 * (pos(-7.6) - pos(-16.2));
    expect(half.volumeDb).toBeCloseTo(40 * Math.log10(v), 9);
    expect(organParamsFromLayer(b3, program.organFx, { wheel: 1 }).volumeDb).toBeCloseTo(-11.6, 9);
  });

  it('swells from "volume off" without NaN or −Infinity', () => {
    const swell: NS4Layer = { ...b3, volume: { value: 'volume off', pedal: '0.0 dB' } };
    const steps = [0, 0.01, 0.25, 0.5, 0.75, 1].map((pedal) => organParamsFromLayer(swell, program.organFx, { pedal }).volumeDb);
    for (const db of steps) {
      expect(Number.isFinite(db)).toBe(true);
      expect(db).toBeGreaterThanOrEqual(VOLUME_OFF_DB);
    }
    expect(steps[0]).toBe(VOLUME_OFF_DB);
    expect(steps[3]).toBeCloseTo(40 * Math.log10(0.5), 9); // half pedal = half the knob ≈ −12 dB
    expect(steps[5]).toBeCloseTo(0, 9);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    // ...and the same the other way: a fade to off.
    const fade: NS4Layer = { ...b3, volume: { value: '-6.0 dB', pedal: '-oo dB' } };
    expect(organParamsFromLayer(fade, program.organFx, { pedal: 1 }).volumeDb).toBe(VOLUME_OFF_DB);
    expect(Number.isFinite(organParamsFromLayer(fade, program.organFx, { pedal: 0.5 }).volumeDb)).toBe(true);
    // The engine is silent at the floor and sounds once the pedal moves.
    const play = (pedal: number) => renderOffline(organParamsFromLayer(swell, program.organFx, { pedal }), [[0, 'on', 60]], 0.05);
    expect(play(0).every((s) => s === 0)).toBe(true);
    expect(play(0.5).some((s) => s !== 0)).toBe(true);
    expect(play(0.5).some(Number.isNaN)).toBe(false);
  });

  it('switches Farfisa tabs rather than fading them', () => {
    const farf: NS4Layer = {
      id: 'A', kind: 'organ', organModel: 'FARF',
      drawbars: [{ value: '5+6+7+8' }, { value: '1+2+3+4', wheel: '5+6+7+8' }],
    };
    expect(organParamsFromLayer(farf).drawbars.slice(0, 2)).toEqual([8, 0]);
    expect(organParamsFromLayer(farf, undefined, { wheel: 0.6 }).drawbars[1]).toBe(8);
  });

  it('renders both fixture organ layers', () => {
    for (const l of [vox, b3]) {
      const out = renderOffline(organParamsFromLayer(l, program.organFx), [[0, 'on', 60], [0, 'on', 64]], 0.1);
      expect(out.some((s) => s !== 0)).toBe(true);
    }
  });
});
