import { describe, expect, it } from 'vitest';
import { decodeNs3 } from './decode';
import { ns3SynthFile, ns3SynthPresetFile } from './file.synth';
import type { Ns3FieldKey } from './layout.generated';
import { decodeNs3SynthPreset } from './preset';

const SOUND: Partial<Record<Ns3FieldKey, number>> = {
  'common.slotEnable': 1, 'synthCommonA.enable': 1,
  'synthA.oscBank': 4, 'synthA.smpNameHash': 0x6e3e77e4, 'synthA.fltType': 1, 'synthA.fltFreq': 62,
  'synthA.fltRes': 40, 'synthA.ampEnvRls': 30, 'synthA.ampEnvVel': 2, 'synthA.arpRun': 1, 'synthA.unison': 2,
};
// A 3.04 program: a 3.00 one with these effect defaults is one the Nord refuses. The Synth block is the same in 3.00–3.04.
const PROGRAM = ns3SynthFile(SOUND);

describe('decodeNs3SynthPreset', () => {
  it('is the 102-byte file the Nord saves: version, then one 53-byte Synth block', () => {
    expect(ns3SynthPresetFile(PROGRAM)).toHaveLength(102);
  });

  it('reads the same synth as the program the block came from', () => {
    const fromProgram = decodeNs3(PROGRAM).panels[0].synth;
    const preset = decodeNs3SynthPreset(ns3SynthPresetFile(PROGRAM));
    expect(preset.layoutMatched).toBe(true);
    expect(preset.warnings).toEqual([]);
    expect(preset.formatVersion).toBe(300);
    // Level, zone and the on switch are SynthCommon (program) settings, not in a preset.
    const { on: _on, volume: _v, kbZones: _z, ...rest } = fromProgram;
    expect(preset.synth).toMatchObject(rest);
    expect(preset.synth?.oscillator.type).toBe('Sample');
    expect(preset.synth?.sampleId).toBe(0x6e3e77e4);
    expect(preset.values['synthA.fltFreq']).toBe(62);
    expect(Object.keys(preset.values).every((k) => k.startsWith('synthA.'))).toBe(true);
  });

  it('says so, and gives no synth, when the body is not one Synth block', () => {
    const p = decodeNs3SynthPreset(PROGRAM);
    expect(p.layoutMatched).toBe(false);
    expect(p.synth).toBeNull();
    expect(p.warnings[0]).toMatch(/Expected 1 blocks for a Nord Stage 3 synth preset/);
  });
});
