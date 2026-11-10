import { describe, expect, it } from 'vitest';
import { isAiff, parseAiff } from './aiff';
import { importAudioFiles, readAudioFile } from './import-files';
import { emptyProject } from './model';

/** An 80-bit extended float, as the COMM chunk stores the sample rate. */
function extended(n: number): number[] {
  const exp = Math.floor(Math.log2(n));
  const mant = n / 2 ** exp; // 1 ≤ mant < 2
  const hi = Math.floor(mant * 2 ** 31) >>> 0;
  const lo = Math.round((mant * 2 ** 31 - hi) * 2 ** 32) >>> 0;
  const e = exp + 16383;
  return [e >> 8, e & 255, hi >>> 24, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, lo >>> 24, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255];
}

const u16 = (n: number) => [(n >> 8) & 255, n & 255];
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const text = (s: string) => [...s].map((c) => c.charCodeAt(0));
const chunk = (id: string, body: number[]) => [...text(id), ...u32(body.length), ...body, ...(body.length % 2 ? [0] : [])];

/** A small AIFF (or AIFF-C) file: `frames` per channel, big-endian 16-bit unless the codec says otherwise. */
function aiff(opts: {
  rate?: number; channels: number[][]; bits?: number; codec?: string;
  loop?: { start: number; end: number }; base?: number;
}): Uint8Array {
  const { rate = 44100, channels, bits = 16, codec } = opts;
  const frames = channels[0].length;
  const bytesPer = codec === 'fl32' ? 4 : Math.ceil(bits / 8);
  const data: number[] = [];
  for (let f = 0; f < frames; f++) {
    for (const ch of channels) {
      if (codec === 'fl32') {
        const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, ch[f]); data.push(...b);
        continue;
      }
      let n = Math.round(ch[f] * (2 ** (bytesPer * 8 - 1) - 1));
      if (n < 0) n += 2 ** (bytesPer * 8);
      const be = Array.from({ length: bytesPer }, (_, k) => Math.floor(n / 2 ** (8 * (bytesPer - 1 - k))) & 255);
      data.push(...(codec === 'sowt' ? be.reverse() : be));
    }
  }
  const comm = [...u16(channels.length), ...u32(frames), ...u16(bits), ...extended(rate), ...(codec ? [...text(codec), 0, 0] : [])];
  const chunks = [...chunk('COMM', comm), ...chunk('SSND', [...u32(0), ...u32(0), ...data])];
  if (opts.loop) {
    const marker = (id: number, pos: number, name: string) => [...u16(id), ...u32(pos), name.length, ...text(name), ...((name.length + 1) % 2 ? [0] : [])];
    chunks.push(...chunk('MARK', [...u16(2), ...marker(1, opts.loop.start, 'beg loop'), ...marker(2, opts.loop.end, 'end')]));
    chunks.push(...chunk('INST', [opts.base ?? 60, 0, 0, 127, 1, 127, ...u16(0), ...u16(1), ...u16(1), ...u16(2), ...u16(0), ...u16(0), ...u16(0)]));
  }
  const form = codec ? 'AIFC' : 'AIFF';
  return Uint8Array.from([...text('FORM'), ...u32(4 + chunks.length), ...text(form), ...chunks]);
}

const ramp = (n: number) => Array.from({ length: n }, (_, i) => (i / n) * 1.6 - 0.8);

describe('parseAiff', () => {
  it('reads 16-bit big-endian PCM at its rate', () => {
    const a = parseAiff(aiff({ rate: 48000, channels: [ramp(100), ramp(100).map((x) => -x)] }));
    expect(a.audio.sampleRate).toBe(48000);
    expect(a.audio.channels).toHaveLength(2);
    expect(a.audio.channels[0][0]).toBeCloseTo(-0.8, 3);
    expect(a.audio.channels[1][0]).toBeCloseTo(0.8, 3);
    expect(a.loop).toBeUndefined();
  });

  it('reads 24-bit, little-endian (sowt) and float AIFF-C', () => {
    for (const o of [{ bits: 24 }, { codec: 'sowt' }, { codec: 'fl32', bits: 32 }, { codec: 'NONE' }]) {
      const a = parseAiff(aiff({ channels: [ramp(64)], ...o }));
      expect(a.audio.sampleRate).toBe(44100);
      expect(a.audio.channels[0][63]).toBeCloseTo(ramp(64)[63], 3);
    }
  });

  it('brings the base note and the sustain loop (end inclusive, as a WAV loop)', () => {
    const a = parseAiff(aiff({ channels: [ramp(1000)], loop: { start: 200, end: 900 }, base: 36 }));
    expect(a.unityNote).toBe(36);
    expect(a.loop).toEqual({ start: 200, end: 899 });
  });

  it('refuses compressed AIFF-C and what isn’t AIFF', () => {
    expect(() => parseAiff(aiff({ channels: [ramp(10)], codec: 'ima4' }))).toThrow(/compressed/);
    expect(isAiff(new TextEncoder().encode('RIFF....WAVE'))).toBe(false);
  });
});

describe('AIFF on import', () => {
  it('reads like a WAV, and the file’s loop and note come along on the take', () => {
    const sine = Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * 220 * i) / 44100));
    const bytes = aiff({ channels: [sine], loop: { start: 5000, end: 20000 }, base: 57 });
    expect(readAudioFile(bytes).loop).toEqual({ start: 5000, end: 19999 });
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'Strings.aif', bytes }]);
    expect(r.project.zones).toHaveLength(1);
    const z = r.project.zones[0];
    expect(z.rootKey).toBe(57); // no note in the name: the file's own note
    // On the Nord the loop ends the sample, so the take ends where the loop does.
    expect(z.takes[0]).toMatchObject({ start: 0, end: 20000, loop: { start: 5000 } });
  });

  it('a note in the name still wins over the file’s note', () => {
    const bytes = aiff({ channels: [ramp(4410)], loop: { start: 100, end: 4000 }, base: 57 });
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'Disco Strings-C2-V127.aif', bytes }]);
    expect(r.project.zones[0].rootKey).toBe(36);
  });
});
