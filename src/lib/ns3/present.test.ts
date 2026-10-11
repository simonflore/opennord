import { describe, it, expect } from 'vitest';
import { ns3Decoded } from './present';
import { ns3SynthFile } from './file.synth';

describe('ns3Decoded', () => {
  it('shows both panels, the transpose and no warnings for a well-formed file', () => {
    const d = ns3Decoded(ns3SynthFile({
      'common.slotEnable': 3, 'common.transposeEnable': 1, 'common.transposeValue': -2,
      'organA.enable': 1, 'pianoB.enable': 1, 'effectsB.rvbEnable': 1, 'effectsB.rvbType': 4,
    }));
    expect(d.sections.map((s) => s.label)).toEqual(['PANEL A', 'PANEL B']);
    expect(d.header).toContainEqual(['Transpose', '−2 semitones']);
    expect(d.sections[0].engines.map((e) => e.label)).toEqual(['Organ']);
    expect(d.sections[1].chips).toEqual(['Reverb: Hall 1']);
    expect(d.warnings).toEqual([]);
    expect(d.note).toMatch(/Stage 3 firmware/);
  });

  it('a file the layout does not match shows the header only, with the reason', () => {
    const d = ns3Decoded(ns3SynthFile({}, 202));
    expect(d.sections).toEqual([]);
    expect(d.header).toContainEqual(['Version', 'v2.02']);
    expect(d.warnings?.join(' ')).toMatch(/format 2\.02/);
    expect(d.note).toMatch(/only the file header/);
  });
});
