// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { addClip, addTake, addZone, emptyProject, setKeys, setTarget, updateTake, type SampleProject } from '@/lib/sample-build/model';
import type { ClipAudio } from '@/lib/sample-build/render';
import { ZonePanel } from './ZonePanel';

afterEach(cleanup);
const audio: ClipAudio = { sampleRate: 44100, channels: [Float32Array.from({ length: 44100 }, (_, i) => 0.3 * Math.sin(i / 20))] };

function setup(target: 'nsmp4' | 'npno') {
  let p = emptyProject('x', target);
  const c = addClip(p, { label: 'C4.wav', source: { kind: 'file', fileName: 'C4.wav' }, audioRef: 'r', sampleRate: 44100, channels: 1, frames: 44100 });
  const take = { clipId: c.clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };
  const z = addZone(c.project, 60, take);
  p = addTake(z.project, z.zoneId, take).project;
  return { p: target === 'npno' ? setTarget(p, 'npno') : p, zoneId: z.zoneId };
}

function Harness({ initial, zoneId }: { initial: SampleProject; zoneId: string }) {
  const [p, setP] = useState(initial);
  const apply = (edit: (x: SampleProject) => SampleProject) => { try { setP(edit(p)); return null; } catch (e) { return (e as Error).message; } };
  return (
    <>
      {p.zones.some((z) => z.id === zoneId) && <ZonePanel project={p} zoneId={zoneId} read={() => audio} apply={apply} />}
      <output data-testid="state">{JSON.stringify(p.zones[0] ?? null)}</output>
    </>
  );
}
const zone = () => JSON.parse(screen.getByTestId('state').textContent!);

describe('ZonePanel', () => {
  it('for a sample: picks the take that plays', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    expect(screen.getByRole('heading', { name: 'Zone C4' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    fireEvent.click(radios[1]);
    expect(zone().layers[0].takeId).toBe(zone().takes[1].id);
  });

  it('for a piano: adds a take as a softer layer with its floor', () => {
    const { p, zoneId } = setup('npno');
    render(<Harness initial={p} zoneId={zoneId} />);
    expect(screen.getByText('Layers, soft to hard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add as layer' }));
    expect(zone().layers).toHaveLength(2);
    // Soft first; only the soft layer has a floor to set (the hard one plays the hardest hits).
    expect(screen.getAllByText(/^(Soft|Hard)$/).map((e) => e.textContent)).toEqual(['Soft', 'Hard', 'Soft', 'Hard']);
    const floor = screen.getByLabelText(/Takes over at/);
    fireEvent.change(floor, { target: { value: '18' } });
    fireEvent.blur(floor);
    expect(zone().layers[1].floorDb).toBe(18);
    expect(screen.getByText('−18 dB')).toBeInTheDocument(); // under the boundary in the touch strip
  });

  it('for a piano: removes a layer again, keeping the last one', () => {
    const { p, zoneId } = setup('npno');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add as layer' }));
    expect(screen.getAllByRole('button', { name: /^Remove layer/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remove layer Soft' }));
    expect(zone().layers).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^Remove layer/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add as layer' })).toBeInTheDocument(); // the take waits again
  });

  it('edits the root, tune and loop, and shows a refused edit', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.change(screen.getByLabelText('Tune (cents)'), { target: { value: '7' } });
    fireEvent.keyDown(screen.getByLabelText('Tune (cents)'), { key: 'Enter' });
    expect(zone().takes[0].tuneCents).toBe(7);
    fireEvent.click(screen.getByLabelText('Loop'));
    expect(zone().takes[0].loop).not.toBeNull();
    expect(screen.getByLabelText('Loop start')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Root'), { target: { value: 'H9' } });
    fireEvent.blur(screen.getByLabelText('Root'));
    expect(screen.getByRole('alert')).toHaveTextContent('“H9” isn’t a key');
    expect(screen.getByLabelText('Root')).toHaveValue('C4');
  });

  it('takes the root as a note name, and steps it with the arrow keys', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={setKeys(p, zoneId, 55, 70)} zoneId={zoneId} />);
    const root = screen.getByLabelText('Root');
    expect(root).toHaveValue('C4');
    fireEvent.change(root, { target: { value: 'D4' } });
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(zone().rootKey).toBe(62);
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(zone().rootKey).toBe(61);
    expect(root).toHaveValue('C#4');
  });

  it('says a root the zone’s keys don’t include is refused', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={setKeys(p, zoneId, 55, 70)} zoneId={zoneId} />);
    fireEvent.change(screen.getByLabelText('Root'), { target: { value: 'C6' } });
    fireEvent.blur(screen.getByLabelText('Root'));
    expect(screen.getByRole('alert')).toHaveTextContent(/keys|root/);
    expect(zone().rootKey).toBe(60);
  });

  it('commits a root typed digit by digit only when done, without refusing the first digit', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={setKeys(p, zoneId, 55, 70)} zoneId={zoneId} />);
    const root = screen.getByLabelText('Root');
    fireEvent.change(root, { target: { value: '6' } });
    fireEvent.change(root, { target: { value: '62' } });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.blur(root);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(zone().rootKey).toBe(62);
  });

  it('an emptied loop decay holds', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={updateTake(p, zoneId, p.zones[0].takes[0].id, { loop: { start: 100 }, loopDecaySeconds: 3 })} zoneId={zoneId} />);
    fireEvent.change(screen.getByLabelText('Loop decay (s)'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Loop decay (s)'));
    expect(zone().takes[0].loopDecaySeconds).toBeNull();
  });

  it('moves Start with the arrow keys: 1 ms, or 10 ms with Shift, and names it in time', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    const start = screen.getByRole('slider', { name: 'Start' });
    fireEvent.keyDown(start, { key: 'ArrowRight', shiftKey: true });
    expect(zone().takes[0].start).toBe(441);
    fireEvent.keyDown(start, { key: 'ArrowLeft' });
    expect(zone().takes[0].start).toBe(397);
    expect(start).toHaveAttribute('aria-valuetext', '9 ms');
    expect(start).toHaveTextContent('START 9 ms');
  });

  it('offers the loop seam view only once the take loops', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    expect(screen.getByRole('button', { name: 'Loop seam' })).toBeDisabled();
    fireEvent.click(screen.getByRole('switch', { name: 'Loop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Loop seam' }));
    expect(screen.getByRole('button', { name: 'Loop seam' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('loop start …')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull(); // the seam shows the turn; points are moved in the other views
  });

  it('offers to correct the pitch heard only when the root is the note that was heard', () => {
    const { p, zoneId } = setup('nsmp4');
    const heard = (midi: number) => updateTake(p, zoneId, p.zones[0].takes[0].id, { pitchEstimate: { midi, cents: -32, confidence: 0.9 } });
    render(<Harness initial={heard(60)} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'set +32 to correct what was heard' }));
    expect(zone().takes[0].tuneCents).toBe(32);
    cleanup();
    render(<Harness initial={heard(62)} zoneId={zoneId} />); // heard D4, root C4: 32 cents wouldn't correct it
    expect(screen.queryByRole('button', { name: /to correct what was heard/ })).toBeNull();
  });

  it('picks a point up by its flag, wherever on the flag it is pressed', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    const wave = screen.getByRole('slider', { name: 'End' }).closest('.relative')!.parentElement!.querySelector('.touch-none') as HTMLElement;
    wave.setPointerCapture = () => {};
    wave.getBoundingClientRect = () => ({ left: 0, width: 1000, top: 0, height: 190, right: 1000, bottom: 190, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(screen.getByRole('slider', { name: 'End' }), { pointerId: 1, clientX: 990 });
    fireEvent.pointerMove(wave, { pointerId: 1, clientX: 500 });
    expect(zone().takes[0].end).toBe(22050);
  });

  it('removes a take, but not the last one', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove take 1' }));
    expect(zone().takes).toHaveLength(1);
    expect(zone().layers).toEqual([{ takeId: zone().takes[0].id, floorDb: 0 }]);
    expect(screen.queryByRole('button', { name: /Remove take/ })).toBeNull();
  });

  it('for a piano: removing a layer’s take removes its layer', () => {
    const { p, zoneId } = setup('npno');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add as layer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove take 1' }));
    expect(zone().layers).toEqual([{ takeId: zone().takes[0].id, floorDb: 0 }]);
  });

  it('removes the zone', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove zone' }));
    expect(zone()).toBeNull();
  });
});
