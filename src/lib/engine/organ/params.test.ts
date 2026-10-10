import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from '../../ns4/parse';
import { drawbarPosition, organParamsFromLayer, parseDb, parseVibChorus, toOrganModel } from './params';
import { renderOffline } from './core';
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
    // Volume morphs too: −16.2 dB, wheel target −11.6 dB (full), A.T. target −7.6 dB (half).
    expect(half.volumeDb).toBeCloseTo(-16.2 + 4.6 + 0.5 * 8.6, 9);
    expect(organParamsFromLayer(b3, program.organFx, { wheel: 1 }).volumeDb).toBeCloseTo(-11.6, 9);
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
