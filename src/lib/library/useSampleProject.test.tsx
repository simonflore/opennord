// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { encodeWav } from '../ns4/wav';
import { setName, setRoot, setTarget, updateTake } from '../sample-build/model';
import { loadProject } from './sampleProjectStore';
import { describeFailure } from '../errors';
import { createProject, useSampleProject } from './useSampleProject';

const wavFile = (name: string, hz: number) => {
  const ch = Float32Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100));
  return new File([encodeWav([ch], 44100) as BlobPart], name, { type: 'audio/wav' });
};

describe('describeFailure', () => {
  it('makes one sentence, without doubled periods', () => {
    expect(describeFailure('Couldn’t save the project', new Error('Disk full.'))).toBe('Couldn’t save the project: Disk full.');
    expect(describeFailure('Couldn’t save the project', new Error(''))).toBe('Couldn’t save the project.');
    expect(describeFailure('Couldn’t save', undefined)).toBe('Couldn’t save.');
  });
});

describe('useSampleProject', () => {
  it('opens, adds files, edits with undo, and reopens exactly after a reload', async () => {
    const id = await createProject('Rhodes');
    const { result, unmount } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    await act(async () => { await result.current.addFiles([wavFile('Rhodes_C3.wav', 130.81), wavFile('Rhodes_C4.wav', 261.63)]); });
    const open = () => (result.current.state === 'open' ? result.current : null)!;
    expect(open().project.zones).toHaveLength(2);
    const zoneId = open().project.zones[0].id;

    act(() => { expect(result.current.apply((p) => setRoot(p, zoneId, 47))).toBeNull(); });
    expect(open().project.zones[0].rootKey).toBe(47);
    act(() => result.current.undo());
    expect(open().project.zones[0].rootKey).toBe(48);
    act(() => result.current.redo());
    expect(open().project.zones[0].rootKey).toBe(47);

    const take = open().project.zones[0].takes[0];
    act(() => {
      expect(result.current.apply((p) => updateTake(p, zoneId, take.id, { start: 1000, end: 20000, loop: { start: 5000 }, loopDecaySeconds: 3 }))).toBeNull();
      expect(result.current.apply((p) => setTarget(p, 'nsmp3'))).toBeNull();
    });

    await waitFor(() => expect(open().saved).toBe(true));
    expect(open().saveError).toBeNull();
    const stored = await loadProject(id);
    expect(stored).toEqual(open().project);
    expect(stored?.zones.map((z) => z.rootKey)).toEqual([47, 60]);
    expect(stored?.zones[0].takes[0]).toMatchObject({ start: 1000, end: 20000, loop: { start: 5000 }, loopDecaySeconds: 3 });
    expect(stored?.target).toBe('nsmp3');
    unmount();

    const again = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(again.result.current.state).toBe('open'));
    const reopened = again.result.current.state === 'open' ? again.result.current : null;
    expect(reopened!.project).toEqual(stored);
    expect(reopened!.read(reopened!.project.clips[0].id)?.channels[0].length).toBe(22050);
  });

  it('returns the error and changes nothing when an edit breaks the project', async () => {
    const id = await createProject('X');
    const { result } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    await act(async () => { await result.current.addFiles([wavFile('A3.wav', 220)]); });
    const before = result.current.state === 'open' ? result.current.project : null;
    let err: string | null = null;
    act(() => { err = result.current.apply((p) => setRoot(p, p.zones[0].id, 200)); });
    expect(err).toMatch(/keys|root/);
    expect(result.current.state === 'open' && result.current.project).toEqual(before);
  });

  it('says when a project is missing', async () => {
    const { result } = renderHook(() => useSampleProject('no-such-id'));
    await waitFor(() => expect(result.current.state).toBe('missing'));
  });

  it('keeps both edits when two apply calls run in one handler', async () => {
    const id = await createProject('Two');
    const { result } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    await act(async () => { await result.current.addFiles([wavFile('A3.wav', 220)]); });
    const zoneId = result.current.state === 'open' ? result.current.project.zones[0].id : '';
    act(() => {
      expect(result.current.apply((p) => setRoot(p, zoneId, 56))).toBeNull();
      expect(result.current.apply((p) => setTarget(p, 'nsmp3'))).toBeNull();
    });
    const p = result.current.state === 'open' ? result.current.project : null;
    expect(p?.zones[0].rootKey).toBe(56);
    expect(p?.target).toBe('nsmp3');
    act(() => result.current.undo());
    const u = result.current.state === 'open' ? result.current.project : null;
    expect(u?.zones[0].rootKey).toBe(56);
    expect(u?.target).toBe('nsmp4');
  });

  it('keeps an edit made while a file import is still reading', async () => {
    const id = await createProject('Race');
    const { result } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    await act(async () => { await result.current.addFiles([wavFile('A3.wav', 220)]); });
    await act(async () => {
      const pending = result.current.addFiles([wavFile('C4.wav', 261.63)]);
      expect(result.current.apply((p) => setTarget(p, 'nsmp3'))).toBeNull();
      await pending;
    });
    const p = result.current.state === 'open' ? result.current.project : null;
    expect(p?.zones).toHaveLength(2);
    expect(p?.target).toBe('nsmp3');
  });

  it('saves an edit made less than 500 ms before unmount', async () => {
    const id = await createProject('Flush');
    const { result, unmount } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    act(() => { expect(result.current.apply((p) => setTarget(p, 'nsmp3'))).toBeNull(); });
    unmount();
    await waitFor(async () => expect((await loadProject(id))?.target).toBe('nsmp3'));
  });

  it('saves the newest edit when it lands while an earlier save is in flight', async () => {
    const id = await createProject('Inflight');
    const { result } = renderHook(() => useSampleProject(id));
    await waitFor(() => expect(result.current.state).toBe('open'));
    act(() => { result.current.apply((p) => ({ ...p, name: 'one' })); });
    await new Promise((r) => setTimeout(r, 520)); // the first save has started
    act(() => { result.current.apply((p) => ({ ...p, name: 'two' })); });
    await waitFor(() => expect(result.current.state === 'open' && result.current.saved).toBe(true), { timeout: 3000 });
    expect((await loadProject(id))?.name).toBe('two');
  });

  describe('undo steps', () => {
    async function opened() {
      const id = await createProject('Steps');
      const hook = renderHook(() => useSampleProject(id));
      await waitFor(() => expect(hook.result.current.state).toBe('open'));
      const open = () => (hook.result.current.state === 'open' ? hook.result.current : null)!;
      return { result: hook.result, open };
    }

    it('undoes a series of applies with the same key in one step', async () => {
      const { result, open } = await opened();
      act(() => { result.current.apply((p) => setName(p, 'M'), 'name'); });
      act(() => { result.current.apply((p) => setName(p, 'Mk'), 'name'); });
      act(() => { result.current.apply((p) => setName(p, 'Mk I'), 'name'); });
      expect(open().project.name).toBe('Mk I');
      act(() => result.current.undo());
      expect(open().project.name).toBe('Steps');
      expect(open().canUndo).toBe(false);
      act(() => result.current.redo());
      expect(open().project.name).toBe('Mk I');
    });

    it('starts a new step for a different key or after an undo', async () => {
      const { result, open } = await opened();
      act(() => { result.current.apply((p) => setName(p, 'A'), 'name'); });
      act(() => { result.current.apply((p) => setTarget(p, 'nsmp3'), 'format'); });
      act(() => { result.current.apply((p) => setName(p, 'AB'), 'name'); });
      act(() => result.current.undo());
      expect(open().project.name).toBe('A');
      expect(open().project.target).toBe('nsmp3');
      act(() => { result.current.apply((p) => setName(p, 'AC'), 'name'); }); // after an undo: its own step
      act(() => result.current.undo());
      expect(open().project.name).toBe('A');
      act(() => result.current.undo());
      expect(open().project.target).toBe('nsmp4');
      act(() => result.current.undo());
      expect(open().project.name).toBe('Steps');
    });

    it('adds no step for an edit that changes nothing', async () => {
      const { result, open } = await opened();
      act(() => { expect(result.current.apply((p) => setName(p, p.name))).toBeNull(); });
      act(() => { expect(result.current.apply((p) => setTarget(p, p.target))).toBeNull(); });
      expect(open().canUndo).toBe(false);
      expect(open().saved).toBe(true);
    });
  });
});
