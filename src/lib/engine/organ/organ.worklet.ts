/**
 * AudioWorklet entry: runs the pure {@link OrganCore} on the audio thread.
 * Loaded by organ-voice.ts via Vite's `?worker&url`; never imported directly.
 * All synthesis lives in core.ts so it stays unit-tested off the audio thread.
 */
import { OrganCore } from './core';
import { DISPOSE_FADE_MS, ORGAN_PROCESSOR, applyOrganMessage, type OrganMessage } from './messages';
import type { OrganParams } from './types';

// AudioWorkletGlobalScope names (not in the DOM lib typings).
declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: unknown);
}

interface OrganProcessorOptions { processorOptions?: { params?: OrganParams; seed?: number } }

class OrganProcessor extends AudioWorkletProcessor {
  private core: OrganCore;
  private disposed = false;

  constructor(options?: OrganProcessorOptions) {
    super(options);
    const o = options?.processorOptions;
    this.core = new OrganCore({ sampleRate, params: o?.params, seed: o?.seed });
    this.port.onmessage = (e: MessageEvent<OrganMessage>) => {
      if (e.data.type === 'dispose') {
        // Fade out, then return false from process() so the processor (and its core) can be released.
        this.disposed = true;
        this.core.fadeOut(DISPOSE_FADE_MS);
      } else {
        applyOrganMessage(this.core, e.data);
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    if (!out || out.length === 0) return !this.disposed;
    this.core.render(out[0]);
    for (let c = 1; c < out.length; c++) out[c].set(out[0]);
    return !(this.disposed && this.core.faded());
  }
}

registerProcessor(ORGAN_PROCESSOR, OrganProcessor);
