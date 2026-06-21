import { describe, it, expect } from 'vitest';
import { ContributionSession } from './session';
import type { Capture } from './types';
import { identifyNordFile } from '../clavia/nord-file';
import { buildCbinHeader } from '../clavia/cbin';

function cap(body: number[]): Capture {
  const file = buildCbinHeader({ formatType: 1, tag: 'ns4p', bank: 0, location: 0, category: 0, versionRaw: 400 });
  return { model: identifyNordFile(file), body: new Uint8Array(body) };
}

describe('ContributionSession', () => {
  it('records a single-range diff against the baseline', () => {
    const s = new ContributionSession();
    s.setBaseline(cap([1, 2, 3, 4]));
    const e = s.addEntry(cap([1, 9, 3, 4]), 'Filter cutoff', 'min -> max', 'flt.cutoff');
    expect(e.ranges).toEqual([{ start: 1, end: 1 }]);
    expect(e.multiRegion).toBe(false);
    expect(e.vocabId).toBe('flt.cutoff');
    expect(s.entries).toHaveLength(1);
  });

  it('flags multi-region diffs as not trusted', () => {
    const s = new ContributionSession();
    s.setBaseline(cap([1, 2, 3, 4, 5]));
    const e = s.addEntry(cap([1, 9, 3, 8, 5]), 'two things', '');
    expect(e.ranges).toEqual([{ start: 1, end: 1 }, { start: 3, end: 3 }]);
    expect(e.multiRegion).toBe(true);
  });

  it('diffs each change against the previous capture, not the fixed baseline', () => {
    // Mirrors real hardware use: the musician keeps prior edits in place, so a
    // fixed-baseline diff would accumulate; diffing vs the previous capture keeps
    // each entry a clean single-parameter delta.
    const s = new ContributionSession();
    s.setBaseline(cap([1, 2, 3, 4]));
    const e1 = s.addEntry(cap([1, 9, 3, 4]), 'a', '');   // vs baseline → byte 1
    const e2 = s.addEntry(cap([1, 9, 3, 8]), 'b', '');   // byte 1 still changed, but vs after1 → byte 3 only
    expect(e1.ranges).toEqual([{ start: 1, end: 1 }]);
    expect(e2.ranges).toEqual([{ start: 3, end: 3 }]);
    expect(e2.multiRegion).toBe(false);
    expect([...s.baseline!.body]).toEqual([1, 2, 3, 4]); // baseline stays the original (for the bundle)
  });

  it('pendingRanges previews without advancing the cursor', () => {
    const s = new ContributionSession();
    s.setBaseline(cap([1, 2, 3, 4]));
    expect(s.pendingRanges(cap([1, 9, 3, 4]))).toEqual([{ start: 1, end: 1 }]);
    // unchanged after a preview: still diffs from the original baseline
    expect(s.pendingRanges(cap([1, 9, 3, 4]))).toEqual([{ start: 1, end: 1 }]);
  });

  it('throws if no baseline is set', () => {
    expect(() => new ContributionSession().addEntry(cap([1]), 'x', '')).toThrow();
  });
});
