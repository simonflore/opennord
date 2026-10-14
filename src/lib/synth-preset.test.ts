import { describe, expect, it } from 'vitest';
import { ns2SynthFile, ns2SynthPresetFile } from './ns2/file.synth';
import { ns3SynthFile, ns3SynthPresetFile } from './ns3/file.synth';
import { readSynthPreset } from './synth-preset';
import { presetFileExt } from './library/preset-entries';
import { checkPreset } from './contribute/fixture-validate';
import { sealFileChecksum } from './clavia/checksum';

const ns3y = () => ns3SynthPresetFile(ns3SynthFile({ 'synthA.oscBank': 0, 'synthA.oscWave': 1, 'synthA.fltType': 1 }));
const ns2s = (hash = { 'slotA_synth.param22': 31142, 'slotA_synth.param23': 32643, 'slotA_synth.param24': 3 }) =>
  ns2SynthPresetFile(ns2SynthFile({ 'slotA_synth.param4': 3, 'slotA_synth.filterMode': 2, ...hash }));

describe('readSynthPreset', () => {
  it('reads a Stage 3 synth preset with its own card, no level meter', () => {
    const r = readSynthPreset(ns3y())!;
    expect(r.model).toBe('Nord Stage 3');
    expect(r.sampleId).toBeUndefined();
    expect(r.card?.kind).toBe('synth');
    expect(r.card?.volume).toBeUndefined();
    expect(r.headline).toMatch(/ · /);
  });

  it('reads a Stage 2 synth preset; a sample oscillator carries its sample id', () => {
    const r = readSynthPreset(ns2s())!;
    expect(r.model).toBe('Nord Stage 2');
    expect(r.headline.startsWith('Sample · ')).toBe(true);
    expect(r.sampleId).toBeDefined();
  });

  it('keeps an unknown sample (name hash 0) out of the catalog lookup', () => {
    const r = readSynthPreset(ns2s({ 'slotA_synth.param22': 0, 'slotA_synth.param23': 0, 'slotA_synth.param24': 0 }))!;
    expect(r.headline.startsWith('Sample · ')).toBe(true);
    expect(r.sampleId).toBeUndefined();
  });

  it('returns a Stage 3 preset that does not fit the one-block layout without a card, its warnings saying why', () => {
    const bytes = ns3SynthFile().slice();
    bytes.set([0x6e, 0x73, 0x33, 0x79], 0x08); // a whole program body under the ns3y tag
    const r = readSynthPreset(bytes)!;
    expect(r.card).toBeNull();
    expect(r.headline).toBe('');
    expect(r.warnings[0]).toMatch(/Expected 1 blocks for a Nord Stage 3 synth preset/);
    expect(checkPreset(sealFileChecksum(bytes))).toMatchObject({ read: false, voices: 0, identified: false });
  });

  it('takes no other file', () => {
    expect(readSynthPreset(ns3SynthFile())).toBeNull();
  });
});

describe('presetFileExt', () => {
  it('keeps a Stage 3 / Stage 2 preset under its own extension', () => {
    expect(presetFileExt('synth-preset', ns3y())).toBe('ns3y');
    expect(presetFileExt('synth-preset', ns2s())).toBe('ns2s');
    expect(presetFileExt('synth-preset', new Uint8Array(4))).toBe('ns4y');
  });
});

describe('checkPreset (scan)', () => {
  it('reads Stage 3 and Stage 2 synth presets', () => {
    for (const bytes of [sealFileChecksum(ns3y()), sealFileChecksum(ns2s())]) {
      expect(checkPreset(bytes)).toEqual({ checksumOk: true, read: true, voices: 1, identified: true });
    }
  });
});
