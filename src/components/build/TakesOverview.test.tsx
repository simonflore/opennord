// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, addZone, emptyProject, setKeys, type SampleProject } from '@/lib/sample-build/model';
import type { ClipAudio } from '@/lib/sample-build/render';
import { findLoop } from '@/lib/sample-build/analysis/loop';
import { TakesOverview } from './TakesOverview';

afterEach(cleanup);
const SR = 44100;
const audio: ClipAudio = { sampleRate: SR, channels: [Float32Array.from({ length: SR * 2 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / SR))] };

/** Three zones: a clean loop, a careless one, and a one-shot. */
function project(): SampleProject {
  const clean = findLoop(audio, { start: 0, end: SR * 2 })!;
  let p = emptyProject('x');
  const c = addClip(p, { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'a', sampleRate: SR, channels: 1, frames: SR * 2 });
  p = c.project;
  const base = { clipId: c.clipId, start: 0, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };
  const zones: [number, Parameters<typeof addZone>[2]][] = [
    [48, { ...base, end: clean.end, loop: { start: clean.start } }],
    [60, { ...base, end: clean.end, loop: { start: clean.start + 37 } }],
    [72, { ...base, end: SR, loop: null, gainDb: -3 }],
  ];
  for (const [root, take] of zones) { const z = addZone(p, root, take); p = setKeys(z.project, z.zoneId, root - 5, root + 6); }
  return p;
}

describe('TakesOverview', () => {
  it('shows every zone with its loop and join, marks the one to check, and opens a zone when chosen', () => {
    const p = project();
    const onSelect = vi.fn();
    render(<TakesOverview project={p} read={() => audio} selectedZoneId={p.zones[0].id} onSelect={onSelect} />);
    const region = screen.getByRole('region', { name: 'Takes overview' });
    expect(within(region).getByText(/3 zones · one loop to check/)).toBeInTheDocument();
    const rows = within(region).getAllByRole('button', { name: /^(C3|C4|C5)/ });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('clean join');
    expect(rows[1]).toHaveTextContent(/may click|rough join/);
    expect(rows[2]).toHaveTextContent('plays once');
    expect(rows[2]).toHaveTextContent('−3.0 dB');
    expect(rows[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Next loop to check' }));
    expect(onSelect).toHaveBeenCalledWith(p.zones[1].id);
    fireEvent.click(rows[2]);
    expect(onSelect).toHaveBeenLastCalledWith(p.zones[2].id);
  });

  it('shows nothing for a build with no zones', () => {
    const { container } = render(<TakesOverview project={emptyProject('x')} read={() => audio} selectedZoneId={null} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('a crossfade that smooths a weak join clears its mark; no Next when the open zone is the only one', () => {
    const p = project();
    const weakZone = p.zones[1];
    const { rerender } = render(<TakesOverview project={p} read={() => audio} selectedZoneId={weakZone.id} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Next loop to check' })).toBeNull();
    const t = weakZone.takes[0];
    const faded = { ...p, zones: p.zones.map((z) => (z.id === weakZone.id ? { ...z, takes: [{ ...t, loopCrossfadeMs: 50 }] } : z)) };
    rerender(<TakesOverview project={faded} read={() => audio} selectedZoneId={weakZone.id} onSelect={vi.fn()} />);
    expect(screen.getByText('3 zones')).toBeInTheDocument();
    expect(screen.queryByText(/may click|rough join/)).toBeNull();
  });
});
