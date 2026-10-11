import { describe, it, expect } from 'vitest';
import { readBits, writeBits } from '../clavia/bitstream';
import { synthLegacyFile } from '../clavia/block-chain.synth';
import { NL4_LAYOUT } from './layout.generated';
import { convertNl4Performance, convertNl4Program } from './convert';
import { decodeNl4 } from './decode';

const f = (key: string) => NL4_LAYOUT.fields.find((x) => x.key === key)!;
const slotList = NL4_LAYOUT.morphLists!.find((l) => l.set === 'slot')!;
const fxList = NL4_LAYOUT.morphLists!.find((l) => l.set === 'fx')!;
type List = typeof slotList;

const set = (d: Uint8Array, key: string, v: number, base = 0) => writeBits(d, base + f(key).bit, f(key).width, v);
const get = (d: Uint8Array, key: string, base = 0) => readBits(d, base + f(key).bit, f(key).width);

function writeMorphs(d: Uint8Array, list: List, entries: [number, number, number][], base = 0) {
  const stride = list.paramBits + list.sourceBits + list.deltaBits;
  writeBits(d, base + list.countBit, list.countWidth, entries.length);
  entries.forEach(([param, source, delta], i) => {
    const e = base + list.entryBit + i * stride;
    writeBits(d, e, list.paramBits, param);
    writeBits(d, e + list.paramBits, list.sourceBits, source);
    writeBits(d, e + list.paramBits + list.sourceBits, list.deltaBits, (delta + 256) % 256);
  });
}
function readMorphs(d: Uint8Array, list: List, base = 0): [number, number, number][] {
  const stride = list.paramBits + list.sourceBits + list.deltaBits;
  const n = readBits(d, base + list.countBit, list.countWidth);
  return Array.from({ length: n }, (_, i) => {
    const e = base + list.entryBit + i * stride;
    const raw = readBits(d, e + list.paramBits + list.sourceBits, list.deltaBits);
    return [readBits(d, e, list.paramBits), readBits(d, e + list.paramBits, list.sourceBits), raw >= 128 ? raw - 256 : raw];
  });
}

const record = () => new Uint8Array(NL4_LAYOUT.dataBytes);
const ATTACK = f('slot.ampEnvAttack').id;
const TEMPO = f('slot.arpTempo').id;
const AMOUNT = f('fx.delayReverbAmount');
const OLD_REVERB_BIT = f('fx.reverbModel').bit + f('fx.reverbModel').width;

describe('Lead 4 record conversion (OS versions 6-7 → 8)', () => {
  it('6 → 7: switches Arp Impsync off when the arp is on without master clock', () => {
    const d = record();
    set(d, 'slot.lfo1ArpOnOff', 1); set(d, 'slot.arpImpsync', 1);
    convertNl4Program(d, 6);
    expect(get(d, 'slot.arpImpsync')).toBe(0);
    const clocked = record();
    set(clocked, 'slot.lfo1ArpOnOff', 1); set(clocked, 'slot.arpImpsync', 1); set(clocked, 'slot.arpMstClk', 1);
    convertNl4Program(clocked, 6);
    expect(get(clocked, 'slot.arpImpsync')).toBe(1);
  });

  it('7 → 8: moves Amp Env Attack and Arp Tempo to the new curves, their morphs with them', () => {
    const d = record();
    set(d, 'slot.ampEnvAttack', 0); set(d, 'slot.arpTempo', 127);
    writeMorphs(d, slotList, [[ATTACK, 0, 127], [TEMPO, 1, -127], [ATTACK, 3, 127], [5, 0, 10]]);
    convertNl4Program(d, 7);
    const attack = get(d, 'slot.ampEnvAttack'), tempo = get(d, 'slot.arpTempo');
    expect(attack).toBe(0); // the attack curve starts flat at 0
    expect(tempo).toBe(108); // the tempo curve's top
    expect(readMorphs(d, slotList)).toEqual([
      [ATTACK, 0, 101 - attack], // target 127 → the curve's top, relative to the new base
      [TEMPO, 1, 11 - tempo], // target 0 → the curve's bottom
      [ATTACK, 3, 101], // an absolute morph maps itself
      [5, 0, 10], // other parameters stay
    ]);
  });

  it('7 → 8: merges the old reverb amount into the shared Delay/Reverb Amount when reverb is selected', () => {
    const d = record();
    set(d, 'fx.delayReverbSelection', 1); set(d, 'fx.delayReverbAmount', 20);
    writeBits(d, OLD_REVERB_BIT, 7, 90);
    writeMorphs(d, fxList, [[AMOUNT.id, 0, 5], [7, 1, -3], [10, 0, 2]]);
    convertNl4Program(d, 7);
    expect(get(d, 'fx.delayReverbAmount')).toBe(90);
    expect(readBits(d, OLD_REVERB_BIT, 7)).toBe(0);
    expect(readMorphs(d, fxList)).toEqual([[AMOUNT.id, 1, -3], [10, 0, 2]]);
  });

  it('7 → 8: with delay selected, keeps the amount and drops the old reverb morphs', () => {
    const d = record();
    set(d, 'fx.delayReverbAmount', 20);
    writeBits(d, OLD_REVERB_BIT, 7, 90);
    writeMorphs(d, fxList, [[AMOUNT.id, 0, 5], [7, 1, -3]]);
    convertNl4Program(d, 7);
    expect(get(d, 'fx.delayReverbAmount')).toBe(20);
    expect(readBits(d, OLD_REVERB_BIT, 7)).toBe(0);
    expect(readMorphs(d, fxList)).toEqual([[AMOUNT.id, 0, 5]]);
  });

  it('leaves a version-8 program untouched', () => {
    const d = record();
    set(d, 'slot.arpTempo', 64);
    const before = d.slice();
    convertNl4Program(d, 8);
    expect(d).toEqual(before);
  });

  it('converts each performance slot, and sets common setting 11 from version 8 on', () => {
    const d = new Uint8Array(7 + 4 * NL4_LAYOUT.dataBytes);
    for (let k = 0; k < 4; k++) set(d, 'slot.arpTempo', 127, (7 + NL4_LAYOUT.dataBytes * k) * 8);
    convertNl4Performance(d, 7);
    for (let k = 0; k < 4; k++) expect(get(d, 'slot.arpTempo', (7 + NL4_LAYOUT.dataBytes * k) * 8)).toBe(108);
    expect(readBits(d, 24, 3)).toBe(2);
    const v8 = new Uint8Array(d.length);
    set(v8, 'slot.arpTempo', 127, 56);
    convertNl4Performance(v8, 8);
    expect(get(v8, 'slot.arpTempo', 56)).toBe(127); // slots are already version 8
    expect(readBits(v8, 24, 3)).toBe(2);
  });

  it('the reader converts an older file and says so', () => {
    const d = record();
    set(d, 'slot.arpTempo', 127);
    const p = decodeNl4(synthLegacyFile('nl4s', 7, d));
    expect(p.program?.values['slot.arpTempo']).toBe(108);
    expect(p.warnings).toEqual(['Record version 7: the Lead 4 converts it to version 8 on load, and OpenNord converts it the same way']);
    const ancient = decodeNl4(synthLegacyFile('nl4s', 5, d));
    expect(ancient.program?.values['slot.arpTempo']).toBe(127);
    expect(ancient.warnings[0]).toMatch(/doesn't load programs this old/);
  });
});
