// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, addZone, emptyProject, setKeys, setTarget, type SampleProject } from '@/lib/sample-build/model';
import { autoMap } from '@/lib/sample-build/analysis/automap';
import { MidiProvider } from '@/lib/midi/MidiContext';
import { BuildKeyboard as Keyboard } from './BuildKeyboard';
import { IssuesList } from './IssuesList';

afterEach(cleanup);
/** The keyboard plays from a MIDI keyboard too, so it lives inside the app's MIDI provider. */
const BuildKeyboard = (props: Parameters<typeof Keyboard>[0]) => <MidiProvider><Keyboard {...props} /></MidiProvider>;
function project(roots: number[]): SampleProject {
  let p = emptyProject('x');
  const c = addClip(p, { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'r', sampleRate: 44100, channels: 1, frames: 100 });
  p = c.project;
  for (const r of roots) p = addZone(p, r, { clipId: c.clipId, start: 0, end: 100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
  return p;
}

describe('BuildKeyboard', () => {
  it('maps the zones over the keys with Auto map', () => {
    const p = project([48, 60]);
    let next: SampleProject | null = null;
    render(<BuildKeyboard built={null} project={p} selectedZoneId={p.zones[0].id} onSelect={vi.fn()} apply={(edit) => { next = edit(p); return null; }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Auto map' }));
    expect(next!.zones.map((z) => [z.keyLow, z.keyHigh])).toEqual(autoMap(p).zones.map((z) => [z.keyLow, z.keyHigh]));
  });

  it('shows why Auto map was refused', () => {
    const p = project([48, 60]);
    render(<BuildKeyboard built={null} project={p} selectedZoneId={p.zones[0].id} onSelect={vi.fn()} apply={() => 'Not now.'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Auto map' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Not now.');
  });

  it('names keys no zone reaches', () => {
    const p = autoMap(project([30, 100]));
    render(<BuildKeyboard built={null} project={p} selectedZoneId={p.zones[0].id} onSelect={vi.fn()} apply={() => null} />);
    expect(screen.getByText(/G3 to E4 play nothing/)).toBeInTheDocument();
  });

  it('draws a sample’s zones only over the keys they cover', () => {
    const p = project([60]); // one zone on C4 alone
    const { container } = render(<BuildKeyboard built={null} project={p} selectedZoneId={p.zones[0].id} onSelect={vi.fn()} apply={() => null} />);
    const band = container.querySelector('svg g rect')!;
    expect(Number(band.getAttribute('x'))).toBeCloseTo((1000 * (60 - 21)) / 87 + 1);
    expect(Number(band.getAttribute('width'))).toBeCloseTo(1000 / 87 - 2);
  });
});

describe('IssuesList', () => {
  it('lists the target\'s problems and links them to their zone', () => {
    let p = project([60]);
    p = setKeys(p, p.zones[0].id, 40, 100);
    const onSelectZone = vi.fn();
    render(<IssuesList project={p} onSelectZone={onSelectZone} />);
    fireEvent.click(screen.getByRole('button', { name: /C#6 to E7 stay silent/ }));
    expect(onSelectZone).toHaveBeenCalledWith(p.zones[0].id);
  });
});

describe('BuildKeyboard: a build that fails', () => {
  it('says why, for a piano as for a sample', () => {
    const p = setTarget(project([48, 60]), 'npno');
    render(<BuildKeyboard built={{ error: 'This piano would not load on a Nord: too loud.' }} project={p} selectedZoneId={p.zones[0].id} onSelect={vi.fn()} apply={() => null} />);
    expect(screen.getByText('Fix this to listen: This piano would not load on a Nord: too loud.')).toBeInTheDocument();
  });
});
