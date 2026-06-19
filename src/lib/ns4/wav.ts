/**
 * Encode normalized PCM (per-channel Float32 in [-1, 1]) as a canonical
 * 16-bit little-endian PCM WAV. Used to export `.nsmp` stroke audio so users
 * can audit or re-use it outside the Nord toolchain.
 *
 * Note: the exact decoded sample rate isn't recovered yet (see nsmp-audio.ts),
 * so callers pass the same audition rate used for playback — pitch matches what
 * you hear in-app even if it differs from the original capture rate.
 */
export function encodeWav(channels: Float32Array[], sampleRate: number): Uint8Array {
  const numChannels = Math.max(1, channels.length);
  const numFrames = channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = numFrames * blockAlign;

  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);              // PCM fmt chunk size
  view.setUint16(20, 1, true);               // audio format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);      // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let off = 44;
  for (let f = 0; f < numFrames; f++) {
    for (let c = 0; c < numChannels; c++) {
      const s = channels[c]?.[f] ?? 0;
      const clamped = s < -1 ? -1 : s > 1 ? 1 : s;
      // Asymmetric scaling so +1 → 32767 and -1 → -32768 (full int16 range).
      view.setInt16(off, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      off += 2;
    }
  }
  return new Uint8Array(buf);
}
