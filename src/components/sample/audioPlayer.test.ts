import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let state = 'running';
const resume = vi.fn(async () => {});
class FakeAudioContext {
  get state() { return state; }
  resume = resume;
  destination = {};
  createBuffer(channels: number, length: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (i: number) => data[i] };
  }
  createBufferSource() {
    return { buffer: null, connect: () => {}, start: () => {}, stop: () => {}, onended: null };
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('AudioContext', FakeAudioContext);
  resume.mockClear();
  resume.mockImplementation(async () => {});
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('getSharedCtx', () => {
  it('returns one shared context and leaves a running one alone', async () => {
    const { getSharedCtx } = await import('./audioPlayer');
    state = 'running';
    expect(getSharedCtx()).toBe(getSharedCtx());
    expect(resume).not.toHaveBeenCalled();
  });

  it.each(['suspended', 'interrupted'])('resumes a %s context (autoplay policy, WebKit interruption)', async (s) => {
    const { getSharedCtx } = await import('./audioPlayer');
    state = s;
    getSharedCtx();
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('swallows a refused resume so the next call can try again', async () => {
    const { getSharedCtx } = await import('./audioPlayer');
    state = 'interrupted';
    resume.mockImplementation(async () => { throw new Error('InvalidStateError'); });
    getSharedCtx();
    getSharedCtx();
    await Promise.resolve();
    expect(resume).toHaveBeenCalledTimes(2);
  });

  it('resumes an interrupted context when a sample is auditioned (every playPcm caller is a tap)', async () => {
    const { playPcm } = await import('./audioPlayer');
    state = 'interrupted';
    playPcm([new Int32Array([0, 1000, -1000, 0])]);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('does not try to resume a closed context', async () => {
    const { getSharedCtx } = await import('./audioPlayer');
    state = 'closed';
    getSharedCtx();
    expect(resume).not.toHaveBeenCalled();
  });
});
