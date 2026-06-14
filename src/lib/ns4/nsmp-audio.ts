/**
 * Small helpers to turn decoded `.nsmp` PCM into something the UI can draw and
 * play. `decodeStroke`/`decodeNsmp` return raw integer PCM (pre-normalization);
 * for preview we auto-gain to [-1, 1] by the stroke's own peak. (The exact
 * per-stroke normalization gain — `GetNormFactors` — is future work; auto-gain
 * is fine for waveform + audition.)
 */

/** Downsample PCM to `buckets` [min, max] pairs for a waveform. */
export function peaks(pcm: ArrayLike<number>, buckets: number): [number, number][] {
  const out: [number, number][] = [];
  const n = pcm.length;
  if (n === 0) return out;
  const step = Math.max(1, Math.floor(n / buckets));
  for (let i = 0; i < buckets; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    const from = i * step;
    const to = Math.min(from + step, n);
    if (from >= n) break;
    for (let j = from; j < to; j++) {
      const v = pcm[j];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    out.push([lo === Infinity ? 0 : lo, hi === -Infinity ? 0 : hi]);
  }
  return out;
}

/** Largest absolute sample across all channels (for auto-gain). */
export function peakAmplitude(channels: ArrayLike<number>[]): number {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = ch[i] < 0 ? -ch[i] : ch[i];
      if (a > peak) peak = a;
    }
  }
  return peak;
}

/** Auto-gain raw integer PCM to a Float32Array in [-1, 1] by a shared peak. */
export function normalizeChannels(channels: ArrayLike<number>[], peak = peakAmplitude(channels)): Float32Array[] {
  const g = peak > 0 ? 1 / peak : 0;
  return channels.map((ch) => {
    const out = new Float32Array(ch.length);
    for (let i = 0; i < ch.length; i++) out[i] = ch[i] * g;
    return out;
  });
}

/** Build a Web Audio AudioBuffer from normalized per-channel PCM (browser only). */
export function toAudioBuffer(ctx: AudioContext, channels: Float32Array[], sampleRate: number): AudioBuffer {
  const buf = ctx.createBuffer(channels.length, channels[0].length, sampleRate);
  channels.forEach((ch, i) => buf.getChannelData(i).set(ch));
  return buf;
}
