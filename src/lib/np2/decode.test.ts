/**
 * NP2 reader tests: synthetic records built from the program map (Piano 2
 * OS 1.22 descriptors, via layout.generated.ts). No real `.np2p` is in the corpus.
 */
import { describe, it, expect } from 'vitest';
import { decodeNp2 } from './decode';
import { np2Decoded } from './present';
import { NP2_LAYOUT, type Np2FieldKey } from './layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';

function np2p(values: Partial<Record<Np2FieldKey, number>> = {}, version = 2): Uint8Array {
  return synthLegacyLayoutFile('np2p', NP2_LAYOUT, values, { version: version });
}

describe('NP2 firmware layout', () => {
  it('is a 42-byte record (common, piano, synth, effects = 336 bits), version 2, 52 parameters', () => {
    expect(NP2_LAYOUT).toMatchObject({ dataBytes: 42, recordVersion: 2 });
    expect(NP2_LAYOUT.fields).toHaveLength(52);
    expect(0x1a + NP2_LAYOUT.dataBytes + 2).toBe(70);
    const last = NP2_LAYOUT.fields.at(-1)!;
    expect(last.key).toBe('effects.reverbDryWet');
    const used = new Set<number>();
    for (const f of NP2_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNp2 (synthetic)', () => {
  it('reads a default record without warnings', () => {
    const p = decodeNp2(np2p({ 'piano.pianoModel': 12 }));
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ layoutMatched: true, recordVersion: 2, format: 'np2p' });
    expect(p.values['piano.pianoModel']).toBe(12);
    expect(p.values['piano.pianoLevel']).toBe(127);
  });

  it('converts version 0 and 1 records: Keyboard Touch 0, 1, 2, 3 → 0, 1, 1, 2', () => {
    const touch = (version: number, t: number) => decodeNp2(np2p({ 'common.param4': t }, version)).values['common.param4'];
    expect([0, 1, 2, 3].map((t) => touch(1, t))).toEqual([0, 1, 1, 2]);
    expect([0, 1, 2, 3].map((t) => touch(0, t))).toEqual([0, 1, 1, 2]);
    expect([0, 1, 2, 3].map((t) => touch(2, t))).toEqual([0, 1, 2, 3]);
    const p = decodeNp2(np2p({}, 1));
    expect(p.layoutMatched).toBe(true);
    expect(p.warnings.join(' ')).toMatch(/version 1.*converts it the same way/);
    expect(decodeNp2(np2p({}, 3)).layoutMatched).toBe(false);
  });

  it('presents piano, synth and effects', () => {
    const d = np2Decoded(np2p({
      'piano.pianoType': 2, 'effects.delayOn': 1, 'synth.synthOn': 1, 'synth.synthLevel': 80,
      'effects.effects2On': 1, 'effects.effects2Type': 5, 'effects.reverbOn': 1, 'effects.reverbType': 3,
      'common.param4': 2, 'common.param5': 1,
    }));
    expect(d.title).toBe('Nord Piano 2 · Program');
    expect(d.sections[0].engines[0].parts[0]).toBe('EPiano1');
    expect(d.sections[1].engines[0].parts).toContain('level 80');
    expect(d.sections[1].engines[0].parts).not.toContain('(off)');
        const fx = d.sections[2].fx!.groups[0].units;
        expect(fx.map((u) => u.label)).toEqual(['Effect 1', 'Effect 2', 'Delay', 'Amp/Comp', 'EQ', 'Reverb']);
        expect(fx.filter((u) => u.on).map((u) => [u.label, u.type])).toEqual([['Effect 2', 'Flanger 3'], ['Delay', undefined], ['Reverb', 'Stage 2']]);
        // The source values (0–1) have no names in this model's tables: shown as stored.
        expect(fx[0].source).toBeUndefined();
        expect(fx[0].params.at(-1)).toEqual({ label: 'Source', value: '0' });
    expect(d.header).toEqual(expect.arrayContaining([['Keyboard touch', '2'], ['Sustain pedal', 'Piano Off']]));
  });
});
