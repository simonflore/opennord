/**
 * The audio-thread processor and the voice's dispose(), against minimal Web Audio
 * stand-ins: disposing fades the organ out, the processor then returns false
 * from process() (so the browser can release it and its core), and the node is
 * only disconnected after the fade.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DISPOSE_DISCONNECT_MS, DISPOSE_FADE_MS, ORGAN_PROCESSOR, type OrganMessage } from './messages';
import { DEFAULT_ORGAN_PARAMS } from './types';

vi.mock('./organ.worklet.ts?worker&url', () => ({ default: 'organ.worklet.js' }));

const SR = 48000;
const BLOCK = 128;

interface Processor {
  port: { onmessage: ((e: { data: OrganMessage }) => void) | null };
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}
type ProcessorCtor = new (options?: unknown) => Processor;

describe('organ AudioWorklet processor', () => {
  let Ctor: ProcessorCtor;

  beforeAll(async () => {
    vi.stubGlobal('sampleRate', SR);
    vi.stubGlobal('AudioWorkletProcessor', class { port = { onmessage: null, postMessage() {}, close() {} }; });
    vi.stubGlobal('registerProcessor', (name: string, ctor: ProcessorCtor) => {
      if (name === ORGAN_PROCESSOR) Ctor = ctor;
    });
    await import('./organ.worklet');
  });
  afterAll(() => { vi.unstubAllGlobals(); });

  const block = () => [new Float32Array(BLOCK), new Float32Array(BLOCK)];
  const peak = (x: Float32Array) => x.reduce((m, s) => Math.max(m, Math.abs(s)), 0);

  it('keeps running until disposed, then fades out and returns false', () => {
    const proc = new Ctor({ processorOptions: { params: DEFAULT_ORGAN_PARAMS, seed: 1 } });
    proc.port.onmessage!({ data: { type: 'noteOn', note: 60, velocity: 100 } });
    for (let i = 0; i < 40; i++) expect(proc.process([], [block()])).toBe(true);
    const sounding = block();
    proc.process([], [sounding]);
    expect(peak(sounding[0])).toBeGreaterThan(0);

    proc.port.onmessage!({ data: { type: 'dispose' } });
    const fadeBlocks = Math.ceil((DISPOSE_FADE_MS * SR) / 1000 / BLOCK);
    let blocks = 0;
    let last = block();
    while (proc.process([], [last])) {
      blocks++;
      expect(blocks).toBeLessThanOrEqual(fadeBlocks);
      last = block();
    }
    expect(blocks).toBeGreaterThanOrEqual(fadeBlocks - 1);
    // The block that returned false ends in silence, on both channels.
    expect(last[0][BLOCK - 1]).toBe(0);
    expect(last[1]).toEqual(last[0]);
  });
});

describe('createOrganVoice dispose()', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('worklet: posts dispose, and disconnects only after the fade', async () => {
    vi.useFakeTimers();
    const posted: OrganMessage[] = [];
    const node = {
      port: { postMessage: (m: OrganMessage) => posted.push(m), close: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(),
    };
    vi.stubGlobal('AudioWorkletNode', function AudioWorkletNode() { return node; });
    const ctx = { sampleRate: SR, destination: {}, audioWorklet: { addModule: vi.fn(async () => {}) } };
    const { createOrganVoice } = await import('./organ-voice');
    const voice = await createOrganVoice(ctx as unknown as BaseAudioContext);
    expect(voice.backend).toBe('worklet');

    voice.dispose();
    expect(posted.at(-1)).toEqual({ type: 'dispose' });
    expect(node.disconnect).not.toHaveBeenCalled();
    voice.noteOn(60); // ignored after dispose
    voice.dispose();  // idempotent
    expect(posted.filter((m) => m.type !== 'dispose')).toEqual([]);
    expect(posted).toHaveLength(1);

    vi.advanceTimersByTime(DISPOSE_DISCONNECT_MS);
    expect(node.disconnect).toHaveBeenCalledTimes(1);
    expect(node.port.close).toHaveBeenCalledTimes(1);
  });

  it('ScriptProcessor fallback: fades, then drops the callback and disconnects', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('AudioWorkletNode', undefined);
    const node = {
      onaudioprocess: null as ((e: unknown) => void) | null,
      connect: vi.fn(), disconnect: vi.fn(),
    };
    const ctx = { sampleRate: SR, destination: {}, createScriptProcessor: () => node };
    const { createOrganVoice } = await import('./organ-voice');
    const voice = await createOrganVoice(ctx as unknown as BaseAudioContext);
    expect(voice.backend).toBe('script');

    const buffer = () => {
      const ch = [new Float32Array(1024), new Float32Array(1024)];
      node.onaudioprocess!({ outputBuffer: { getChannelData: (c: number) => ch[c] } });
      return ch[0];
    };
    voice.noteOn(60);
    buffer();
    voice.dispose();
    expect(node.onaudioprocess).not.toBeNull(); // still running the fade
    const fading = buffer();
    const fadeEnd = Math.ceil((DISPOSE_FADE_MS * SR) / 1000);
    expect(fading.subarray(fadeEnd).every((s) => s === 0)).toBe(true);
    expect(node.disconnect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DISPOSE_DISCONNECT_MS);
    expect(node.onaudioprocess).toBeNull();
    expect(node.disconnect).toHaveBeenCalledTimes(1);
  });
});
