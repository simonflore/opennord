import { describe, it, expect } from 'vitest';
import { addClip, emptyProject, type SampleProject } from '../model';
import { autoMap, keyGaps, placeTakes, type Candidate } from './automap';

function withClip(): { p: SampleProject; clipId: string } {
  const c = addClip(emptyProject('x'), { label: 'rec', source: { kind: 'recording', recordedAt: 'now' }, audioRef: 'r', sampleRate: 44100, channels: 1, frames: 44100 * 10 });
  return { p: c.project, clipId: c.clipId };
}
const cand = (clipId: string, root: number | null, k: number): Candidate => ({ clipId, start: k * 44100, end: (k + 1) * 44100, root, label: `note ${k + 1}` });

describe('placeTakes', () => {
  it('makes a zone per new root, a take where the root has a zone, and flags unclear ones', () => {
    const { p, clipId } = withClip();
    const { project, report } = placeTakes(p, [cand(clipId, 36, 0), cand(clipId, 48, 1), cand(clipId, 48, 2), cand(clipId, null, 3)]);
    expect(project.zones.map((z) => [z.rootKey, z.takes.length])).toEqual([[36, 1], [48, 2]]);
    expect(report).toEqual({ newZones: 2, addedTakes: 1, unclear: ['note 4'], outcomes: ['zone', 'zone', 'take', 'unclear'] });
    expect(project.zones[1].layers).toHaveLength(1); // the newer take waits
  });

  it('leaves out a candidate that is already its zone’s take, within 10 ms at each end', () => {
    const { p, clipId } = withClip();
    const first = placeTakes(p, [cand(clipId, 48, 0)]).project;
    const near = { ...cand(clipId, 48, 0), start: 300, end: 44100 - 300 }; // about 7 ms in from each end
    const { project, report } = placeTakes(first, [near, { ...cand(clipId, 48, 0), start: 2000 }]);
    expect(report.outcomes).toEqual(['same', 'take']);
    expect(report.addedTakes).toBe(1);
    expect(project.zones[0].takes).toHaveLength(2);
  });
});

describe('autoMap', () => {
  it('splits halfway between roots, from the bottom key, and reaches at most 24 above the top root', () => {
    const { p, clipId } = withClip();
    const placed = placeTakes(p, [36, 48, 60, 72].map((r, k) => cand(clipId, r, k))).project;
    const mapped = autoMap(placed);
    expect(mapped.zones.map((z) => [z.keyLow, z.keyHigh])).toEqual([[0, 42], [43, 54], [55, 66], [67, 96]]);
    expect(keyGaps(mapped)).toEqual([]);
  });

  it('leaves a gap where a zone cannot reach the next, and reports it', () => {
    const { p, clipId } = withClip();
    const mapped = autoMap(placeTakes(p, [cand(clipId, 30, 0), cand(clipId, 100, 1)]).project);
    expect(mapped.zones.map((z) => [z.keyLow, z.keyHigh])).toEqual([[0, 54], [65, 124]]);
    expect(keyGaps(mapped)).toEqual([{ low: 55, high: 64 }]);
  });
});
