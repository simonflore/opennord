import { describe, expect, it } from 'vitest';
import { decodeNs2 } from './decode';
import { ns2SynthFile, ns2SynthPresetFile } from './file.synth';
import type { Ns2FieldKey } from './layout.generated';
import { decodeNs2SynthPreset } from './preset';

const SOUND: Partial<Record<Ns2FieldKey, number>> = {
  'slotA_common.synthEnable': 1,
  'slotA_synth.param4': 3, 'slotA_synth.param5': 113,
  'slotA_synth.param22': 31142, 'slotA_synth.param23': 32643, 'slotA_synth.param24': 3,
  'slotA_synth.filterMode': 2, 'slotA_synth.filterFrequency': 26, 'slotA_synth.filterResonance': 12,
  'slotA_synth.ampEnvelopeRelease': 61, 'slotA_synth.ampEnvelopeVelocity': 1, 'slotA_synth.unisonMode': 2,
  'slotA_synth.lFOWave': 2, 'slotA_synth.lFORate': 64,
};
const PROGRAM = ns2SynthFile(SOUND);

describe('decodeNs2SynthPreset', () => {
  it('is the 78-byte file the Nord saves', () => {
    expect(ns2SynthPresetFile(PROGRAM)).toHaveLength(78);
  });

  it('reads the same synth as the program the container came from', () => {
    const fromProgram = decodeNs2(PROGRAM).slots[0].synth;
    const preset = decodeNs2SynthPreset(ns2SynthPresetFile(PROGRAM));
    expect(preset.recordVersion).toBe(6);
    expect(preset.warnings).toEqual([]);
    // Level, zone, octave and the on switch are the slot's common settings, not in a preset.
    const { on: _on, volume: _v, volumeMidi: _m, ...rest } = fromProgram;
    expect(preset.synth).toMatchObject(rest);
    expect(preset.synth.osc).toBe('SAMPLE');
    expect(preset.synth.sampleId).toBe(fromProgram.sampleId);
    expect(preset.synth.sampleId).not.toBe(0);
    expect(Object.keys(preset.values).every((k) => k.startsWith('slotA_synth.'))).toBe(true);
  });

  it('warns on a version it has not seen, and on a short file', () => {
    expect(decodeNs2SynthPreset(ns2SynthPresetFile(PROGRAM, 5)).warnings[0]).toMatch(/version 5; OpenNord has only read version 6/);
    expect(decodeNs2SynthPreset(ns2SynthPresetFile(PROGRAM).subarray(0, 60)).warnings[0])
      .toMatch(/File too short: 60 bytes, the synth preset record makes 78/);
  });
});
