// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, addZone, emptyProject, type SampleProject } from '@/lib/sample-build/model';
import { ClipsPanel } from './ClipsPanel';

afterEach(cleanup);
const clip = (label: string) => ({ label, source: { kind: 'file' as const, fileName: label }, audioRef: label, sampleRate: 44100, channels: 1 as const, frames: 100 });

function project(): SampleProject {
  const a = addClip(emptyProject('x'), clip('used.wav'));
  const take = { clipId: a.clipId, start: 0, end: 100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };
  let p = addZone(a.project, 48, take).project;
  p = addZone(p, 60, take).project;
  return addClip(p, clip('spare.wav')).project;
}

function Harness() {
  const [p, setP] = useState(project);
  const apply = (edit: (x: SampleProject) => SampleProject) => { try { setP(edit(p)); return null; } catch (e) { return (e as Error).message; } };
  return <ClipsPanel project={p} onAddFiles={vi.fn()} onSplit={vi.fn()} apply={apply} />;
}

describe('ClipsPanel', () => {
  it('names the zones a clip is used in, and removes a clip no take uses', () => {
    render(<Harness />);
    expect(screen.getByText(/zones C3, C4/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove used.wav' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove spare.wav' }));
    expect(screen.queryByText('spare.wav')).toBeNull();
    expect(screen.getByText('used.wav')).toBeInTheDocument();
  });

  it('offers to place a recording that is on no key, and to split one that is', () => {
    const onSplit = vi.fn();
    const p = project();
    render(<ClipsPanel project={p} onAddFiles={vi.fn()} onSplit={onSplit} apply={() => null} />);
    expect(screen.getByRole('button', { name: 'Split used.wav into notes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Place spare.wav on the keys' }));
    expect(onSplit).toHaveBeenCalledWith(p.clips.find((c) => c.label === 'spare.wav')!.id);
  });
});
