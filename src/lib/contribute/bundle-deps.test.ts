import { describe, it, expect } from 'vitest';
import { parseBundleDeps } from './bundle-deps';

describe('parseBundleDeps', () => {
  it('extracts a single program → dependency', () => {
    const xml = `<?xml version="1.0"?><bundle version="1" product="44">
      <file name="Program/Bank O/Choir.nw2p" depCnt="1" dep0="Samp Lib/Choir/Men+Women Mm_SI stereo 3.0.nsmp3"/>
    </bundle>`;
    expect(parseBundleDeps(xml)).toEqual([
      { program: 'Program/Bank O/Choir.nw2p', deps: ['Samp Lib/Choir/Men+Women Mm_SI stereo 3.0.nsmp3'] },
    ]);
  });

  it('extracts multiple deps in dep-index order', () => {
    const xml = `<bundle>
      <file name="Program/Bank I/Utility Stage.np4p" depCnt="2" dep0="Piano/Electric/EP1 Deep Timbre Lrg 6.0.npno" dep1="Samp Lib/Samp Lib/StudioStrings Leg Vib_KH 3.0.nsmp3"/>
    </bundle>`;
    expect(parseBundleDeps(xml)).toEqual([
      {
        program: 'Program/Bank I/Utility Stage.np4p',
        deps: [
          'Piano/Electric/EP1 Deep Timbre Lrg 6.0.npno',
          'Samp Lib/Samp Lib/StudioStrings Leg Vib_KH 3.0.nsmp3',
        ],
      },
    ]);
  });

  it('records dependency-free programs with an empty deps array', () => {
    const xml = `<bundle><file name="Program/Bank A/basswormJD73.nl4p" depCnt="0"/></bundle>`;
    expect(parseBundleDeps(xml)).toEqual([{ program: 'Program/Bank A/basswormJD73.nl4p', deps: [] }]);
  });

  it('reads deps by their dep-index, not source order', () => {
    // Nord sometimes emits dep attributes out of order; index is authoritative.
    const xml = `<bundle><file name="p.nw2p" depCnt="2" dep1="second" dep0="first"/></bundle>`;
    expect(parseBundleDeps(xml)[0].deps).toEqual(['first', 'second']);
  });

  it('ignores non-file bundle content and returns [] for an empty bundle', () => {
    expect(parseBundleDeps('<bundle version="1" product="36" source="0"></bundle>')).toEqual([]);
  });

  it('tolerates attribute order (name after depCnt)', () => {
    const xml = `<bundle><file depCnt="1" name="a.ne4p" dep0="Samp Lib/x.nsmp"/></bundle>`;
    expect(parseBundleDeps(xml)).toEqual([{ program: 'a.ne4p', deps: ['Samp Lib/x.nsmp'] }]);
  });
});
