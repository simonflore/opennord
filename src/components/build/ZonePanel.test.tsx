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
    expect(screen.getByText('Layers, loudest first')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add as layer' }));
    expect(zone().layers).toHaveLength(2);
    fireEvent.change(screen.getAllByLabelText(/Takes over at/)[1], { target: { value: '18' } });
    fireEvent.blur(screen.getAllByLabelText(/Takes over at/)[1]);
    expect(zone().layers[1].floorDb).toBe(18);
  });

  it('for a piano: removes a layer again, keeping the last one', () => {
    const { p, zoneId } = setup('npno');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add as layer' }));
    const removes = screen.getAllByRole('button', { name: 'Remove layer' });
    expect(removes).toHaveLength(2);
    fireEvent.click(removes[1]);
    expect(zone().layers).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Remove layer' })).toBeNull();
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
    fireEvent.change(screen.getByLabelText('Root'), { target: { value: '200' } });
    fireEvent.blur(screen.getByLabelText('Root'));
    expect(screen.getByRole('alert')).toHaveTextContent(/keys|root/);
    expect(screen.getByLabelText('Root')).toHaveValue(60);
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

  it('trims the take with the Start handle', () => {
    const { p, zoneId } = setup('nsmp4');
    render(<Harness initial={p} zoneId={zoneId} />);
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '441' } });
    expect(zone().takes[0].start).toBe(441);
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
