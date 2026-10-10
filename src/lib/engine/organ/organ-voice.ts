/**
 * Web Audio realization of the organ: one {@link OrganCore} per voice layer,
 * running on the audio thread in an AudioWorklet (or, where AudioWorklet is
 * missing, on the main thread through a ScriptProcessorNode fallback).
 *
 * This is the integration point a "play this program" voice layer calls:
 * `noteOn` / `noteOff` / `setParams` / `allNotesOff`, plus `output` to patch
 * into an effects chain (a rotary speaker goes between `output` and the
 * destination). Browser-only; the synthesis itself is tested via core.ts.
 */
import { OrganCore } from './core';
import {
  DISPOSE_DISCONNECT_MS, DISPOSE_FADE_MS, ORGAN_PROCESSOR, applyOrganMessage, type OrganControl, type OrganMessage,
} from './messages';
import { DEFAULT_ORGAN_PARAMS, type OrganParams } from './types';
import workletUrl from './organ.worklet.ts?worker&url';

export interface OrganVoice extends OrganControl {
  /** The organ's mono-in-stereo output. Connect it to effects or the destination. */
  readonly output: AudioNode;
  /** Which engine host is running: audio-thread worklet or main-thread fallback. */
  readonly backend: 'worklet' | 'script';
  noteOn(note: number, velocity?: number): void;
  /**
   * Fade out (~10 ms), then disconnect and release the audio graph and the
   * engine. Further calls on the voice are ignored.
   */
  dispose(): void;
}

export interface OrganVoiceOptions {
  params?: OrganParams;
  /** Where to connect `output` (defaults to `ctx.destination`; pass null to leave unconnected). */
  destination?: AudioNode | null;
  seed?: number;
}

/** The voice's note/param controls, each sent as one {@link OrganMessage}. */
function controls(send: (m: OrganMessage) => void): Omit<OrganVoice, 'output' | 'backend' | 'dispose'> {
  return {
    noteOn: (note, velocity = 100) => send({ type: 'noteOn', note, velocity }),
    noteOff: (note) => send({ type: 'noteOff', note }),
    setParams: (params) => send({ type: 'params', params }),
    allNotesOff: () => send({ type: 'allNotesOff' }),
  };
}

const loaded = new WeakMap<BaseAudioContext, Promise<void>>();

function loadWorklet(ctx: BaseAudioContext): Promise<void> {
  let p = loaded.get(ctx);
  if (!p) {
    p = ctx.audioWorklet.addModule(workletUrl);
    loaded.set(ctx, p);
  }
  return p;
}

export async function createOrganVoice(ctx: BaseAudioContext, opts: OrganVoiceOptions = {}): Promise<OrganVoice> {
  const params = opts.params ?? DEFAULT_ORGAN_PARAMS;
  const destination = opts.destination === undefined ? ctx.destination : opts.destination;

  if (typeof AudioWorkletNode !== 'undefined' && ctx.audioWorklet) {
    try {
      await loadWorklet(ctx);
      const node = new AudioWorkletNode(ctx, ORGAN_PROCESSOR, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        processorOptions: { params, seed: opts.seed },
      });
      if (destination) node.connect(destination);
      let disposed = false;
      const post = (m: OrganMessage) => { if (!disposed) node.port.postMessage(m); };
      return {
        output: node,
        backend: 'worklet',
        ...controls(post),
        dispose: () => {
          if (disposed) return;
          // The processor fades out and then returns false from process(), which
          // releases it; disconnect once the fade has played.
          post({ type: 'dispose' });
          disposed = true;
          setTimeout(() => { node.disconnect(); node.port.close(); }, DISPOSE_DISCONNECT_MS);
        },
      };
    } catch {
      // fall through to the main-thread host
    }
  }
  return createScriptOrganVoice(ctx, params, destination, opts.seed);
}

/** Main-thread fallback for browsers without AudioWorklet. Same core, larger buffer. */
function createScriptOrganVoice(
  ctx: BaseAudioContext, params: OrganParams, destination: AudioNode | null, seed?: number,
): OrganVoice {
  const core = new OrganCore({ sampleRate: ctx.sampleRate, params, seed });
  const node = ctx.createScriptProcessor(1024, 0, 2);
  node.onaudioprocess = (e) => {
    const l = e.outputBuffer.getChannelData(0);
    core.render(l);
    e.outputBuffer.getChannelData(1).set(l);
  };
  if (destination) node.connect(destination);
  let disposed = false;
  return {
    output: node,
    backend: 'script',
    ...controls((m) => { if (!disposed) applyOrganMessage(core, m); }),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      // Let the next buffer or two carry the fade, then drop the callback (and with it the core).
      core.fadeOut(DISPOSE_FADE_MS);
      setTimeout(() => { node.onaudioprocess = null; node.disconnect(); }, DISPOSE_DISCONNECT_MS);
    },
  };
}
