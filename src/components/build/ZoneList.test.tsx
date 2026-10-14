// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, addZone, emptyProject, type SampleProject } from '@/lib/sample-build/model';
import { autoMap } from '@/lib/sample-build/analysis/automap';
import { keyRange } from '@/lib/ns4/sample-view';
import { ZoneList } from './ZoneList';

afterEach(cleanup);
function project(roots: number[]): SampleProject {
  const c = addClip(emptyProject('x'), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'r', sampleRate: 44100, channels: 1, frames: 100 });
  let p = c.project;
  for (const r of roots) p = addZone(p, r, { clipId: c.clipId, start: 0, end: 100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
  return autoMap(p);
}

describe('keyRange', () => {
  it('says a run of keys as a player does, including past the ends of an 88-key keyboard', () => {
    expect(keyRange(54, 65)).toBe('F#3–F4');
    expect(keyRange(60, 60)).toBe('C4');
    expect(keyRange(0, 42)).toBe('up to F#2');
    expect(keyRange(79, 127)).toBe('G5 and up');
    expect(keyRange(0, 127)).toBe('every key');
  });
});

describe('ZoneList', () => {
  it('lists the zones low to high, and selecting one hands back its id', () => {
    const p = project([60, 48]);
    const byRoot = (r: number) => p.zones.find((z) => z.rootKey === r)!.id;
    const onSelect = vi.fn();
    render(<ZoneList project={p} selectedZoneId={byRoot(60)} onSelect={onSelect} />);
    const rows = screen.getAllByRole('button');
    expect(rows.map((r) => r.textContent)).toEqual(['C3up to F#31 take', 'C4G3–C61 take']);
    expect(rows[1]).toHaveAttribute('aria-current', 'true'); // the C4 zone, selected
    fireEvent.click(rows[0]);
    expect(onSelect).toHaveBeenCalledWith(byRoot(48));
  });
});
