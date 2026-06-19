/**
 * Shared single-voice sample player. Both the stroke list and the keyboard zone
 * map play through this, so starting any sample anywhere stops whatever was
 * playing (one voice across the whole inspector). Browser-only (Web Audio).
 */
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';

export const SAMPLE_RATE = 44100; // decoded rate not yet recovered — audition only

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

let activeStop: (() => void) | null = null;

/**
 * Play raw integer PCM (auto-gained for audition). Stops the previously-playing
 * sample first. `onEnded` fires when playback ends — whether naturally or because
 * it was interrupted by the next play — so callers can reset their UI. Returns a
 * stop function for explicit Stop buttons.
 */
export function playPcm(channels: Int32Array[], onEnded?: () => void): () => void {
  activeStop?.(); // single voice — stop whatever else is playing
  const ctx = getCtx();
  const src = ctx.createBufferSource();
  src.buffer = toAudioBuffer(ctx, normalizeChannels(channels), SAMPLE_RATE);
  src.connect(ctx.destination);
  const stop = () => { try { src.stop(); } catch { /* already stopped */ } };
  src.onended = () => { if (activeStop === stop) activeStop = null; onEnded?.(); };
  src.start();
  activeStop = stop;
  return stop;
}

/** Stop whatever is currently playing (no-op if nothing is). */
export function stopActive(): void {
  activeStop?.();
}
