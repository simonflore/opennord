/**
 * AIFF and AIFF-C audio (the format many sample libraries ship in, `.aif`/`.aiff`): PCM of 8 to
 * 32 bits, big-endian (`NONE`, `twos`) or little-endian (`sowt`), and 32/64-bit float
 * (`fl32`, `fl64`). The `INST` chunk's base note and sustain loop come along when the file has
 * them, as a WAV's `smpl` chunk does (`readWav`).
 */
import type { ClipAudio } from './render';

export interface AiffAudio {
  audio: ClipAudio;
  /** The `INST` chunk's base note, when it names one (MIDI). */
  unityNote?: number;
  /** The `INST` chunk's sustain loop, in frames, end inclusive (as a WAV's `loop`). */
  loop?: { start: number; end: number };
}

const id = (b: Uint8Array, at: number) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);

export const isAiff = (b: Uint8Array): boolean =>
  b.length >= 12 && id(b, 0) === 'FORM' && (id(b, 8) === 'AIFF' || id(b, 8) === 'AIFC');

/** An 80-bit IEEE extended float (the COMM chunk's sample rate). */
function extended(v: DataView, at: number): number {
  const exp = v.getUint16(at) & 0x7fff;
  const sign = v.getUint16(at) & 0x8000 ? -1 : 1;
  const hi = v.getUint32(at + 2), lo = v.getUint32(at + 6);
  if (exp === 0 && hi === 0 && lo === 0) return 0;
  return sign * (hi * 2 ** 32 + lo) * 2 ** (exp - 16383 - 63);
}

export function parseAiff(bytes: Uint8Array): AiffAudio {
  if (!isAiff(bytes)) throw new Error('This isn’t an AIFF file.');
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const aifc = id(bytes, 8) === 'AIFC';
  let comm: { channels: number; frames: number; bits: number; rate: number; codec: string } | undefined;
  let ssnd: { at: number; size: number } | undefined;
  const markers = new Map<number, number>();
  let inst: { base: number; mode: number; begin: number; end: number } | undefined;

  for (let at = 12; at + 8 <= bytes.length;) {
    const name = id(bytes, at);
    const size = v.getUint32(at + 4);
    const body = at + 8;
    const end = Math.min(bytes.length, body + size);
    if (name === 'COMM' && end - body >= 18) {
      comm = {
        channels: v.getInt16(body), frames: v.getUint32(body + 2), bits: v.getInt16(body + 6),
        rate: extended(v, body + 8), codec: aifc && end - body >= 22 ? id(bytes, body + 18) : 'NONE',
      };
    } else if (name === 'SSND' && end - body >= 8) {
      const offset = v.getUint32(body);
      ssnd = { at: body + 8 + offset, size: Math.max(0, end - body - 8 - offset) };
    } else if (name === 'MARK' && end - body >= 2) {
      const count = v.getUint16(body);
      let m = body + 2;
      for (let k = 0; k < count && m + 7 <= end; k++) {
        markers.set(v.getInt16(m), v.getUint32(m + 2));
        const len = bytes[m + 6];
        m += 6 + 1 + len + ((len + 1) % 2); // the name is a Pascal string padded to an even length
      }
    } else if (name === 'INST' && end - body >= 20) {
      inst = { base: v.getInt8(body), mode: v.getInt16(body + 8), begin: v.getInt16(body + 10), end: v.getInt16(body + 12) };
    }
    at = body + size + (size % 2);
  }

  if (!comm) throw new Error('This AIFF file has no format chunk (COMM).');
  if (!ssnd) throw new Error('This AIFF file has no audio in it.');
  if (!(comm.rate > 0)) throw new Error('This AIFF file doesn’t say its sample rate, so it can’t be played.');
  if (comm.channels < 1) throw new Error('This AIFF file has no channels.');
  const codec = comm.codec.toLowerCase();
  const float = codec === 'fl32' || codec === 'fl64';
  const little = codec === 'sowt';
  if (!float && !little && codec !== 'none' && codec !== 'twos') {
    throw new Error(`This AIFF-C file is compressed (${comm.codec.trim()}); OpenNord reads uncompressed AIFF. Convert it to WAV.`);
  }
  const bytesPer = codec === 'fl64' ? 8 : codec === 'fl32' ? 4 : Math.ceil(comm.bits / 8);
  if (!float && (bytesPer < 1 || bytesPer > 4)) throw new Error(`OpenNord can’t read ${comm.bits}-bit AIFF audio.`);
  const stride = bytesPer * comm.channels;
  const frames = Math.min(comm.frames, Math.floor(ssnd.size / stride));
  if (!frames) throw new Error('This AIFF file has no audio in it.');

  const kept = Math.min(2, comm.channels);
  const channels = Array.from({ length: kept }, () => new Float32Array(frames));
  const scale = 1 / 2 ** (bytesPer * 8 - 1);
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < kept; c++) {
      const p = ssnd.at + f * stride + c * bytesPer;
      let x: number;
      if (codec === 'fl32') x = v.getFloat32(p);
      else if (codec === 'fl64') x = v.getFloat64(p);
      else {
        let n = 0;
        for (let k = 0; k < bytesPer; k++) n = n * 256 + bytes[p + (little ? bytesPer - 1 - k : k)];
        if (n >= 2 ** (bytesPer * 8 - 1)) n -= 2 ** (bytesPer * 8);
        x = n * scale;
      }
      channels[c][f] = x;
    }
  }

  const out: AiffAudio = { audio: { sampleRate: comm.rate, channels } };
  if (inst) {
    if (inst.base > 0 && inst.base < 128) out.unityNote = inst.base;
    // Play mode 1 is a forward loop (0 none; 2 forward/backward, which a Nord can't play, is left out).
    // A marker sits between frames, so the loop's last frame is the one before its end marker.
    const b = markers.get(inst.begin), e = markers.get(inst.end);
    if (inst.mode === 1 && b !== undefined && e !== undefined && e - 1 > b && e <= frames) out.loop = { start: b, end: e - 1 };
  }
  return out;
}
