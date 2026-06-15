import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { activeLayers, organPanel } from './view';

const bytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const program = parseNs4Program(bytes);
const organs = activeLayers(program).filter((l) => l.kind === 'organ');
const vox = organs.find((l) => l.id === 'A')!;   // VOX
const b3 = organs.find((l) => l.id === 'B')!;     // B3

describe('organPanel — VOX layer (generic, first organ)', () => {
  const m = organPanel(vox, program.organFx, true);

  it('reports the model and that it is not a B3', () => {
    expect(m.model).toBe('VOX');
    expect(m.isB3).toBe(false);
  });

  it('renders 9 generic drawbars with no footage/special color', () => {
    expect(m.drawbars).toHaveLength(9);
    expect(m.drawbars[0].level).toBe(4);
    expect(m.drawbars[0].footage).toBeUndefined();
    expect(m.drawbars[0].color).toBe('default');
  });

  it('flags morph only on the assigned drawbar', () => {
    expect(m.drawbars[0].morph?.wheel).toBe('1');   // drawbar 1, wheel→1
    expect(m.drawbars[1].morph).toBeUndefined();
  });

  it('resolves vib/chorus on + the VOX type from the global map', () => {
    expect(m.vibChorus.on).toBe(true);
    expect(m.vibChorus.type).toBe('V2');
  });

  it('marks percussion not applicable (non-B3)', () => {
    expect(m.percussion.applicable).toBe(false);
  });

  it('reports octave and sustain', () => {
    expect(m.octave).toBe(1);
    expect(m.sustain).toBe(false);
  });

  it('includes the shared rotary because it is the first organ', () => {
    expect(m.rotary).toBeDefined();
    expect(m.rotary!.on).toBe(false);
    expect(m.rotary!.drive).toBe('2.9');
  });
});

describe('organPanel — B3 layer (model-accurate, not first organ)', () => {
  const m = organPanel(b3, program.organFx, false);

  it('marks it a B3 with Hammond footages + colors', () => {
    expect(m.isB3).toBe(true);
    expect(m.drawbars[0].footage).toBe('16′');
    expect(m.drawbars[0].color).toBe('brown');
    expect(m.drawbars[2].color).toBe('white');
  });

  it('resolves the B3 vib/chorus type and off state', () => {
    expect(m.vibChorus.on).toBe(false);
    expect(m.vibChorus.type).toBe('C1');
  });

  it('exposes applicable percussion detail', () => {
    expect(m.percussion.applicable).toBe(true);
    expect(m.percussion.on).toBe(true);
    expect(m.percussion.harm3rd).toBe(false);  // → 2nd
    expect(m.percussion.decayFast).toBe(true);
    expect(m.percussion.volSoft).toBe(true);
  });

  it('omits rotary because it is not the first organ', () => {
    expect(m.rotary).toBeUndefined();
  });
});
