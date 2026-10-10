/**
 * Shared single-voice sample player. Both the stroke list and the keyboard zone
 * map play through this, so starting any sample anywhere stops whatever was
 * playing (one voice across the whole inspector). Browser-only (Web Audio).
 */
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import { NSMP_SAMPLE_RATE } from '../../lib/ns4/nsmp';

/** Fallback replay rate when a caller has no per-stroke rate. The real rate rides
 *  each stroke ({@link DecodedStrokeResult.sampleRate}); this is the storage-domain
 *  default (35002 Hz). The old 44100 placeholder detuned every sample +4 semitones. */
export const SAMPLE_RATE = NSMP_SAMPLE_RATE;

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
export function playPcm(channels: Int32Array[], onEnded?: () => void, sampleRate: number = SAMPLE_RATE): () => void {
  activeStop?.(); // single voice — stop whatever else is playing
  const ctx = getSharedCtx(); // every audition is a tap: resume a suspended/interrupted context
  const src = ctx.createBufferSource();
  src.buffer = toAudioBuffer(ctx, normalizeChannels(channels), sampleRate);
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

/** The shared AudioContext (one across the inspector). Resumes it if it is
 *  suspended (autoplay policy, or iOS after backgrounding) or 'interrupted'
 *  (WebKit's non-standard state after a phone call, Siri or another app taking
 *  the audio session) — call from a user gesture. Cheap enough to call on every
 *  note. A resume the browser refuses (no gesture yet, interruption still on) is
 *  ignored; the next call tries again. */
export function getSharedCtx(): AudioContext {
  const ctx = getCtx();
  const state = ctx.state as string; // 'interrupted' is not in the DOM typings
  if (state === 'suspended' || state === 'interrupted') ctx.resume().catch(() => { /* retried on the next call */ });
  return ctx;
}
