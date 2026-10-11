/**
 * C2 reader tests: synthetic records built from the program map (C2 OS
 * 2.00 containers, via layout.generated.ts). No real `.ncpg` is in the corpus.
 */
import { describe, it, expect } from 'vitest';
import { decodeNc } from './decode';
import { ncDecoded } from './present';
import { NCP_LAYOUT, type NcpFieldKey } from './layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';

function ncpg(values: Partial<Record<NcpFieldKey, number>> = {}, version = 100): Uint8Array {
  return synthLegacyLayoutFile('ncpg', NCP_LAYOUT, values, { version: version });
}

describe('C2 firmware layout', () => {
  it('is a 269-byte record, version 100, 385 fields over 66 containers, no repeats or morphs', () => {
    expect(NCP_LAYOUT).toMatchObject({ dataBytes: 269, recordVersion: 100 });
    expect(NCP_LAYOUT.fields).toHaveLength(385);
    // 66 containers; three hold only reserved bits, so 63 carry fields.
    expect(new Set(NCP_LAYOUT.fields.map((f) => f.key.split('.')[0])).size).toBe(63);
    expect(NCP_LAYOUT.fields.some((f) => f.deltaOf)).toBe(false);
    const used = new Set<number>();
    for (const f of NCP_LAYOUT.fields) {
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNc (synthetic)', () => {
  it('reads a default record without warnings; refuses other versions', () => {
    const p = decodeNc(ncpg());
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ layoutMatched: true, recordVersion: 100, format: 'ncpg' });
    expect([1, 2, 3].map((i) => p.values[`b3UpperDrawbar1.drawbar${i}` as NcpFieldKey])).toEqual([8, 8, 8]);
    const v101 = decodeNc(ncpg({}, 101));
    expect(v101.layoutMatched).toBe(false);
    expect(v101.warnings.join(' ')).toMatch(/version 101/);
  });

  it('presents the selected drawbar set of each manual (B3, with footage), bass and effect switches', () => {
    const d = ncDecoded(ncpg({
      'b3Upper.drawbarSet': 2, 'b3UpperDrawbar3.drawbar5': 7, 'b3Perc3.param0': 1, 'b3Lower.vibratoOn': 1,
      'effectsB3.param3': 1,
    }));
    expect(d.title).toBe('Nord C2 · Program');
    const upper = d.sections.find((s) => s.id === 'MU')!;
    expect(upper.engines[0].parts).toEqual(['B3', 'drawbar set 3']);
    expect(upper.drawbars![4]).toMatchObject({ level: 7, footage: '2⅔′' });
    expect(upper.chips).toEqual(['Percussion (1 switch)']);
    expect(d.sections.find((s) => s.id === 'ML')!.chips).toEqual(['Vibrato/Chorus']);
    expect(d.sections.find((s) => s.id === 'BS')!.drawbars!.map((b) => b.footage)).toEqual(['16′', '8′']);
    expect(d.sections.find((s) => s.id === 'FX')!.engines[0].parts).toEqual(['1 of 4 on']);
    expect(d.note).toMatch(/provisional/);
  });

  it('presents the pipe organ stops and the Farfisa tabs of the selected presets', () => {
    const pipe = ncDecoded(ncpg({ 'common.organModel': 3, 'pipeCommon.presetSelect': 1, 'pipeUpperPreset2.stop4': 1 }));
    expect(pipe.sections[0].engines).toEqual([
      { label: 'Organ', parts: ['Pipe', 'preset 2'] },
      { label: 'Stops', parts: ['stop 1', 'stop 2', 'stop 4', 'stop 8', 'stop 9'] },
    ]);
    const farf = ncDecoded(ncpg({ 'common.organModel': 2 }));
    expect(farf.sections[1].engines[1]).toEqual({ label: 'Tabs', parts: ['tab 1', 'tab 2', 'tab 3'] });
  });
});
