/**
 * Encode normalized PCM (per-channel Float32 in [-1, 1]) as a canonical
 * 16-bit little-endian PCM WAV. Used to export `.nsmp` stroke audio so users
 * can audit or re-use it outside the Nord toolchain.
 *
 * Note: the exact decoded sample rate isn't recovered yet (see nsmp-audio.ts),
 * so callers pass the same audition rate used for playback — pitch matches what
 * you hear in-app even if it differs from the original capture rate.
 */
import { resampleForExport } from './nse-resample';
import { normalizeChannels } from './nsmp-audio';

/** Loop metadata to embed as a `smpl` chunk so tools (e.g. Nord Sample Editor)
 *  can recover the loop points and pitch from an exported WAV. */
export interface WavLoop {
  /** Loop in/out, in sample frames from the start of the audio. */
  start: number;
  end: number;
  /** MIDI note the sample is pitched for (`dwMIDIUnityNote`). Default 60 (C4). */
  unityNote?: number;
}

export function encodeWav(channels: Float32Array[], sampleRate: number, loop?: WavLoop): Uint8Array {
  const numChannels = Math.max(1, channels.length);
  const numFrames = channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = numFrames * blockAlign;

  // A `smpl` chunk is 8 (id+size) + 36 (fields) + 24 (one loop) = 68 bytes.
  const smplBytes = loop ? 68 : 0;
  const buf = new ArrayBuffer(44 + dataBytes + smplBytes);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes + smplBytes, true);
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

  if (loop) {
    writeStr(off, 'smpl'); off += 4;
    view.setUint32(off, 36 + 24, true); off += 4;                        // chunk size (fields + 1 loop)
    view.setUint32(off, 0, true); off += 4;                              // manufacturer
    view.setUint32(off, 0, true); off += 4;                              // product
    view.setUint32(off, Math.round(1e9 / sampleRate), true); off += 4;   // sample period (ns)
    view.setUint32(off, loop.unityNote ?? 60, true); off += 4;           // MIDI unity note
    view.setUint32(off, 0, true); off += 4;                              // MIDI pitch fraction
    view.setUint32(off, 0, true); off += 4;                              // SMPTE format
    view.setUint32(off, 0, true); off += 4;                              // SMPTE offset
    view.setUint32(off, 1, true); off += 4;                              // number of sample loops
    view.setUint32(off, 0, true); off += 4;                              // sampler-specific data bytes
    view.setUint32(off, 0, true); off += 4;                              // loop id
    view.setUint32(off, 0, true); off += 4;                              // loop type: 0 = forward
    view.setUint32(off, loop.start, true); off += 4;                     // loop start (frame)
    view.setUint32(off, loop.end, true); off += 4;                       // loop end (frame)
    view.setUint32(off, 0, true); off += 4;                              // fraction
    view.setUint32(off, 0, true); off += 4;                              // play count: 0 = infinite
  }
  return new Uint8Array(buf);
}

/**
 * Sample rates the Nord Sample Editor (NSE) accepts on WAV import. A stroke's
 * native storage rate — the `stk` pitch base, ~35 kHz (`nsmp.ts`
 * `NSMP_SAMPLE_RATE`) — is *not* one of them: a WAV written at that rate is
 * pitch-correct but NSE refuses to re-import it, so a stroke can't round-trip
 * back into a Sample Editor project. Exports meant for NSE must land on one of
 * these. (Reported on the forum, 2026-08.)
 */
export const NSE_SAMPLE_RATES: readonly number[] = [44100, 48000, 96000];

/**
 * Default rate for an NSE-re-importable stroke export — NSE's lowest accepted
 * rate. The storage domain is ~35 kHz so this upsamples; 44.1 kHz is what the
 * forum request asked for and keeps the file small.
 */
export const NSE_EXPORT_SAMPLE_RATE = 44100;

/** The export rate for PCM stored at `srcRate`: keep it when NSE already accepts
 *  it (no needless resample), else fall back to the 44.1 kHz default. */
export function nseExportRate(srcRate: number): number {
  return NSE_SAMPLE_RATES.includes(srcRate) ? srcRate : NSE_EXPORT_SAMPLE_RATE;
}

/**
 * Encode one decoded stroke as a WAV the Nord Sample Editor will re-import.
 *
 * The decoded PCM is clocked at the stroke's own ~35 kHz rate (`srcRate`), which
 * NSE rejects. The fix is **not** to relabel the header to 44.1 kHz — that would
 * detune the sample (the historical "+4 semitones" bug; see `nsmp.ts`
 * `NSMP_SAMPLE_RATE`). Instead this **resamples** the PCM to an NSE-legal rate
 * ({@link resampleForExport}, a ratio-aware Kaiser sinc that preserves the whole
 * source band — *not* the import kernel, whose fixed cutoff would drop the top
 * octave on upsample) and writes that rate, so pitch and duration are preserved.
 * Loop points are rescaled by the same ratio so the embedded `smpl` chunk still
 * lands on the right frames. Peak auto-gain (via {@link normalizeChannels}) matches
 * the audition path. Returns the bytes and the rate actually written.
 *
 * A stroke already at an NSE rate is encoded as-is (no resample).
 */
export function encodeStrokeWav(
  channels: Int32Array[],
  srcRate: number,
  loop?: WavLoop,
): { bytes: Uint8Array; sampleRate: number } {
  const dstRate = nseExportRate(srcRate);
  if (dstRate === srcRate) {
    return { bytes: encodeWav(normalizeChannels(channels), srcRate, loop), sampleRate: srcRate };
  }
  const resampled = resampleForExport(channels, srcRate, dstRate);
  const scale = dstRate / srcRate;
  const scaledLoop: WavLoop | undefined = loop
    ? { ...loop, start: Math.round(loop.start * scale), end: Math.round(loop.end * scale) }
    : undefined;
  return { bytes: encodeWav(normalizeChannels(resampled), dstRate, scaledLoop), sampleRate: dstRate };
}

/**
 * Parsed WAV audio as per-channel signed integers (the form the resampler /
 * encoders consume). 32-bit float input is scaled to the 24-bit integer range.
 */
export interface WavAudio {
  sampleRate: number;
  channelCount: number;
  /** Source bits per sample (8/16/24/32). */
  bitDepth: number;
  /** IEEE float source (`channels` then hold the value × 0x7FFFFF). */
  float: boolean;
  channels: Int32Array[];
}

const fourCC = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/**
 * Parse a RIFF/WAVE PCM file → per-channel signed integer PCM. Reads 8/16/24/32-bit
 * integer and 32-bit IEEE-float, mono or multi-channel; skips unknown chunks.
 * Throws on a non-PCM/float or malformed file. The front of WAV import.
 */
export function parseWav(bytes: Uint8Array): WavAudio {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (fourCC(bytes, 0) !== 'RIFF' || fourCC(bytes, 8) !== 'WAVE') throw new Error('parseWav: not a RIFF/WAVE file');

  let fmtTag = 0, channelCount = 0, sampleRate = 0, bitDepth = 0, dataOff = -1, dataLen = 0;
  let o = 12;
  while (o + 8 <= bytes.length) {
    const id = fourCC(bytes, o);
    const sz = dv.getUint32(o + 4, true);
    const body = o + 8;
    if (id === 'fmt ') {
      fmtTag = dv.getUint16(body, true);
      channelCount = dv.getUint16(body + 2, true);
      sampleRate = dv.getUint32(body + 4, true);
      bitDepth = dv.getUint16(body + 14, true);
      if (fmtTag === 0xfffe && sz >= 26) fmtTag = dv.getUint16(body + 24, true); // EXTENSIBLE → real tag
    } else if (id === 'data') {
      dataOff = body; dataLen = Math.min(sz, bytes.length - body);
    }
    o = body + sz + (sz & 1); // chunks are word-aligned
  }
  if (dataOff < 0 || channelCount < 1 || bitDepth === 0) throw new Error('parseWav: missing fmt/data chunk');
  const isFloat = fmtTag === 3;
  if (fmtTag !== 1 && !isFloat) throw new Error(`parseWav: unsupported format ${fmtTag} (PCM/float only)`);
  if (isFloat && bitDepth !== 32) throw new Error(`parseWav: unsupported ${bitDepth}-bit float (32-bit float only)`);

  const bytesPer = bitDepth >> 3;
  const stride = bytesPer * channelCount;
  const frames = Math.floor(dataLen / stride);
  const channels = Array.from({ length: channelCount }, () => new Int32Array(frames));
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < channelCount; c++) {
      const p = dataOff + f * stride + c * bytesPer;
      let v: number;
      if (isFloat) v = Math.round(dv.getFloat32(p, true) * 0x7fffff);
      else if (bitDepth === 8) v = bytes[p] - 128; // 8-bit WAV is unsigned
      else if (bitDepth === 16) v = dv.getInt16(p, true);
      else if (bitDepth === 24) { v = bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16); if (v & 0x800000) v -= 0x1000000; }
      else v = dv.getInt32(p, true);
      channels[c][f] = v;
    }
  }
  return { sampleRate, channelCount, bitDepth, float: isFloat, channels };
}
