/**
 * NP3 reader tests: synthetic records built from the program map (Piano 3
 * OS 2.04 containers, via layout.generated.ts). No real `.np3p` is in the corpus.
 */
import { describe, it, expect } from 'vitest';
import { decodeNp3 } from './decode';
import { np3Decoded } from './present';
import { NP3_LAYOUT, type Np3FieldKey } from './layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';

function np3p(values: Partial<Record<Np3FieldKey, number>> = {}, version = 4): Uint8Array {
  return synthLegacyLayoutFile('np3p', NP3_LAYOUT, values, { version: version });
}

describe('NP3 firmware layout', () => {
  it('is a 53-byte record (common 96, piano 96, synth 88, effects 144 bits), version 4, 76 parameters', () => {
    expect(NP3_LAYOUT).toMatchObject({ dataBytes: 53, recordVersion: 4 });
    expect(NP3_LAYOUT.fields).toHaveLength(76);
    expect(0x1a + NP3_LAYOUT.dataBytes + 2).toBe(81);
    const first = (block: string) => Math.min(...NP3_LAYOUT.fields.filter((f) => f.key.startsWith(`${block}.`)).map((f) => f.bit));
    expect([first('common'), first('piano'), first('synth'), first('effects')]).toEqual([0, 96, 192, 280]);
  });

  it('stores every value raw with minimum 0, without overlaps', () => {
    const used = new Set<number>();
    for (const f of NP3_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNp3 (synthetic)', () => {
  it('reads a default record without warnings', () => {
    const p = decodeNp3(np3p({ 'piano.pianoType': 1, 'common.pianoLevel': 100 }));
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ layoutMatched: true, recordVersion: 4, format: 'np3p' });
    expect(p.values['piano.pianoType']).toBe(1);
    expect(p.values['common.pianoLevel']).toBe(100);
    expect(p.values['common.outLevel']).toBe(127);
  });

  it('reads a version 3 record as version 4 (the firmware converter only touches bits past the record); refuses 2', () => {
    const v3 = decodeNp3(np3p({ 'piano.pianoType': 4 }, 3));
    expect(v3.layoutMatched).toBe(true);
    expect(v3.values['piano.pianoType']).toBe(4);
    expect(v3.warnings.join(' ')).toMatch(/version 3.*converts it the same way/);
    const p = decodeNp3(np3p({}, 2));
    expect(p.layoutMatched).toBe(false);
    expect(p.warnings.join(' ')).toMatch(/version 2/);
  });

  it('presents piano, sample synth and the effects that are on', () => {
    const d = np3Decoded(np3p({
      'piano.pianoType': 0, 'piano.pianoModel': 4, 'common.pianoLevel': 90, 'common.synthOn': 0,
      'synth.sampleSelect': 9, 'effects.reverb': 1, 'effects.reverbBright': 1, 'effects.effects1Fx1': 1,
    }));
    expect(d.title).toBe('Nord Piano 3 · Program');
    expect(d.sections.map((s) => s.id)).toEqual(['P', 'S', 'FX']);
    expect(d.sections[0].engines[0].parts).toEqual(['Grand', 'no. 5', 'level 90']);
    expect(d.sections[1].engines[0].parts).toContain('(off)');
    expect(d.sections[1].engines[0].parts[0]).toBe('sample 10');
    expect(d.sections[2].engines[0].parts).toEqual(['Tremolo 1', 'Reverb Room Bright']);
    expect(d.note).toMatch(/not yet checked on a real file/);
  });
});

describe('np3Decoded: keyboard split', () => {
  const split = (values: Partial<Record<Np3FieldKey, number>>) => np3Decoded(np3p(values)).header.find(([k]) => k === 'Split')?.[1];
  it('names the key the split point is stored as', () => {
    expect(split({ 'common.keyboardSplitKeybSplit': 0 })).toBe('off');
    expect(split({ 'common.keyboardSplitKeybSplit': 1, 'common.splitPoint': 44 })).toBe('Piano / Synth · at F4'); // the registry default
    expect(split({ 'common.keyboardSplitKeybSplit': 2, 'common.splitPoint': 27 })).toBe('Synth / Piano · at C3');
  });
  it('draws piano and synth on the sides the setting gives them', () => {
    const d = np3Decoded(np3p({ 'common.keyboardSplitKeybSplit': 2, 'common.splitPoint': 39, 'common.pianoOn': 1, 'common.synthOn': 1 }));
    expect(d.keyboard!.boundaries).toEqual([null, 'C4', null]);
    expect([d.keyboard!.zones[0].layers[0].kind, d.keyboard!.zones[3].layers[0].kind]).toEqual(['synth', 'piano']);
  });
});
