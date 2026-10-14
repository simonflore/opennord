// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, emptyProject } from '@/lib/sample-build/model';
import type { ClipAudio } from '@/lib/sample-build/render';
import { placeTakes, type Candidate } from '@/lib/sample-build/analysis/automap';
import { SplitDialog } from './SplitDialog';

afterEach(cleanup);
const RATE = 44100;
/** Three notes (A3, C4, E4), 0.6 s each, with 0.5 s pauses. */
function recording(): ClipAudio {
  const ch = new Float32Array(RATE * 4);
  [[0.2, 220], [1.3, 261.63], [2.4, 329.63]].forEach(([s, hz]) => {
    for (let i = 0; i < 0.6 * RATE; i++) ch[Math.round(s * RATE) + i] = 0.4 * Math.sin((2 * Math.PI * hz * i) / RATE);
  });
  return { sampleRate: RATE, channels: [ch] };
}
function setup() {
  const c = addClip(emptyProject('x'), { label: 'Recording 14:02', source: { kind: 'recording', recordedAt: 'now' }, audioRef: 'r', sampleRate: RATE, channels: 1, frames: RATE * 4 });
  return { p: c.project, clipId: c.clipId };
}

describe('SplitDialog', () => {
  it('finds the notes, detects their keys, and hands them over as candidates', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    render(<SplitDialog project={p} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 notes
    expect(screen.getByLabelText('Key for note 1')).toHaveValue('A3');
    fireEvent.click(screen.getByRole('button', { name: 'Add 3 zones and 0 takes' }));
    const candidates: Candidate[] = onApply.mock.calls[0][0];
    expect(candidates.map((c) => c.root)).toEqual([57, 60, 64]);
    expect(placeTakes(p, candidates).project.zones.map((z) => z.rootKey)).toEqual([57, 60, 64]);
  });

  it('maps by start key and interval instead', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    render(<SplitDialog project={p} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByLabelText('From a start key'));
    fireEvent.change(screen.getByLabelText('Start key'), { target: { value: '36' } });
    fireEvent.blur(screen.getByLabelText('Start key'));
    fireEvent.change(screen.getByLabelText('Every (semitones)'), { target: { value: '12' } });
    fireEvent.blur(screen.getByLabelText('Every (semitones)'));
    fireEvent.click(screen.getByRole('button', { name: /Add 3 zones/ }));
    expect(onApply.mock.calls[0][0].map((c: Candidate) => c.root)).toEqual([36, 48, 60]);
  });

  it('flags a key that already has a zone and counts it as a take', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    const first = placeTakes(p, [{ clipId, start: 0, end: 1000, root: 57, label: 'x' }]).project;
    render(<SplitDialog project={first} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    expect(screen.getByText('a take on zone A3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 2 zones and 1 take' })).toBeInTheDocument();
  });

  it('leaves out notes that are already a zone’s take, instead of adding them again', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    render(<SplitDialog project={p} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add 3 zones and 0 takes' }));
    const split = placeTakes(p, onApply.mock.calls[0][0]).project;
    cleanup();
    render(<SplitDialog project={split} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText('already zone A3’s take')).toBeInTheDocument();
    expect(screen.getAllByText(/^already zone/)).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Add 0 zones and 0 takes' })).toBeDisabled();
  });

  it('shows a repeated key inside the split as a take, matching the button', () => {
    const { p, clipId } = setup();
    const ch = new Float32Array(RATE * 3);
    [0.2, 1.3].forEach((s) => {
      for (let i = 0; i < 0.6 * RATE; i++) ch[Math.round(s * RATE) + i] = 0.4 * Math.sin((2 * Math.PI * 220 * i) / RATE);
    });
    render(<SplitDialog project={p} clipId={clipId} audio={{ sampleRate: RATE, channels: [ch] }} onClose={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText('new zone A3')).toBeInTheDocument();
    expect(screen.getByText('a take on zone A3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 1 zone and 1 take' })).toBeEnabled();
  });

  it('disables the button when nothing would be added', () => {
    const { p, clipId } = setup();
    render(<SplitDialog project={p} clipId={clipId} audio={{ sampleRate: RATE, channels: [new Float32Array(RATE)] }} onClose={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add 0 zones and 0 takes' })).toBeDisabled();
  });

  it('keeps the last Every when the field is emptied, and clamps what is typed', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    render(<SplitDialog project={p} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByLabelText('From a start key'));
    const every = screen.getByLabelText('Every (semitones)');
    fireEvent.change(every, { target: { value: '' } });
    fireEvent.blur(every);
    expect(every).toHaveValue(3);
    fireEvent.change(screen.getByLabelText('Start key'), { target: { value: '500' } });
    fireEvent.keyDown(screen.getByLabelText('Start key'), { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent('“500” isn’t a key');
    fireEvent.change(screen.getByLabelText('Start key'), { target: { value: 'G9' } });
    fireEvent.keyDown(screen.getByLabelText('Start key'), { key: 'Enter' });
    expect(screen.getByLabelText('Start key')).toHaveValue('G9');
    fireEvent.click(screen.getByRole('button', { name: /Add/ }));
    expect(onApply.mock.calls[0][0].map((c: Candidate) => c.root)).toEqual([127, 127, 127]);
  });

  it('takes a key set by hand for one note over the one it heard', () => {
    const { p, clipId } = setup();
    const onApply = vi.fn();
    render(<SplitDialog project={p} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={onApply} />);
    fireEvent.change(screen.getByLabelText('Key for note 2'), { target: { value: 'D3' } });
    fireEvent.keyDown(screen.getByLabelText('Key for note 2'), { key: 'Enter' });
    expect(screen.getByText('new zone D3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add/ }));
    expect(onApply.mock.calls[0][0].map((c: Candidate) => c.root)).toEqual([57, 50, 64]);
  });

  it('says what needs checking', () => {
    const { p, clipId } = setup();
    const first = placeTakes(p, [{ clipId, start: 0, end: 1000, root: 57, label: 'x' }]).project;
    render(<SplitDialog project={first} clipId={clipId} audio={recording()} onClose={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText('1 to check: 1 key that already has a zone.')).toBeInTheDocument();
  });
});
