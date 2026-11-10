import { describe, it, expect } from 'vitest';
import { encodeWav } from '../ns4/wav';
import { emptyProject } from './model';
import { importAudioFiles, wavToClipAudio } from './import-files';

const sineWav = (hz: number, seconds = 0.6, rate = 44100, channels = 1) => {
  const ch = Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / rate));
  return encodeWav(Array.from({ length: channels }, () => ch), rate);
};
let n = 0;
const ref = () => `ref-${++n}`;

describe('wavToClipAudio', () => {
  it('reads 16-bit PCM into −1…1 at its own rate', () => {
    const a = wavToClipAudio(sineWav(440, 0.1, 48000, 2));
    expect(a.sampleRate).toBe(48000);
    expect(a.channels).toHaveLength(2);
    expect(Math.max(...Array.from(a.channels[0]))).toBeCloseTo(0.4, 2);
  });

  it('refuses a WAV file with no sample rate', () => {
    const zero = encodeWav([new Float32Array(4410).fill(0.1)], 0);
    expect(() => wavToClipAudio(zero)).toThrow(/sample rate/);
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'zero.wav', bytes: zero }]);
    expect(r.report.unreadable.map((u) => u.fileName)).toEqual(['zero.wav']);
    expect(r.project.clips).toEqual([]);
  });

  it('says plainly when a file is not a WAV it can read', () => {
    expect(() => wavToClipAudio(new TextEncoder().encode('ID3 not a wav'))).toThrow(/WAV/);
  });
});

describe('importAudioFiles', () => {
  it('makes a zone per root from file names, then maps the keys', () => {
    const r = importAudioFiles(emptyProject('x'), [
      { fileName: 'Rhodes_C3.wav', bytes: sineWav(130.81) },
      { fileName: 'Rhodes_C4.wav', bytes: sineWav(261.63) },
    ], ref);
    expect(r.project.zones.map((z) => [z.rootKey, z.keyLow, z.keyHigh])).toEqual([[48, 0, 54], [60, 55, 84]]);
    expect(r.project.clips).toHaveLength(2);
    expect(r.audio.size).toBe(2);
    expect(r.report).toMatchObject({ newZones: 2, addedTakes: 0, unclear: [], unreadable: [] });
  });

  it('falls back to the detected pitch when the name has no note', () => {
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'take one.wav', bytes: sineWav(440) }], ref);
    expect(r.project.zones[0].rootKey).toBe(69);
    expect(r.project.zones[0].takes[0].pitchEstimate?.midi).toBe(69);
  });

  it('adds what it can read and lists the rest by name', () => {
    const r = importAudioFiles(emptyProject('x'), [
      { fileName: 'Pad_A3.wav', bytes: sineWav(220) },
      { fileName: 'song.mp3.wav', bytes: new TextEncoder().encode('ID3') },
      { fileName: 'empty.wav', bytes: new Uint8Array(0) },
    ], ref);
    expect(r.project.zones).toHaveLength(1);
    expect(r.report.unreadable.map((u) => u.fileName)).toEqual(['song.mp3.wav', 'empty.wav']);
    expect(r.report.unreadable.every((u) => u.reason.length > 0)).toBe(true);
  });

  it('puts a second recording of a note in as a waiting take', () => {
    const r = importAudioFiles(emptyProject('x'), [
      { fileName: 'A3_hard.wav', bytes: sineWav(220) },
      { fileName: 'A3_soft.wav', bytes: sineWav(220) },
    ], ref);
    expect(r.project.zones).toHaveLength(1);
    expect(r.project.zones[0].takes).toHaveLength(2);
    expect(r.report.addedTakes).toBe(1);
  });

  it('a stored C4 (many tools’ default) gives way to the pitch heard; another stored note wins', () => {
    const tone = (hz: number) => Float32Array.from({ length: 26460 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100));
    const at = (unityNote: number) => encodeWav([tone(65.41)], 44100, { start: 1000, end: 20000, unityNote });
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'Strings.wav', bytes: at(60) }]);
    expect(r.project.zones[0].rootKey).toBe(36); // C2, as heard
    expect(r.project.zones[0].takes[0].loop).toEqual({ start: 1000 }); // a forward loop comes along
    const s = importAudioFiles(emptyProject('x'), [{ fileName: 'Strings.wav', bytes: at(38) }]);
    expect(s.project.zones[0].rootKey).toBe(38);
  });

  it('leaves out a loop that isn’t forward (a Nord loops forward only)', () => {
    const wav = encodeWav([Float32Array.from({ length: 4410 }, (_, i) => Math.sin(i / 10) * 0.4)], 44100, { start: 100, end: 4000 });
    new DataView(wav.buffer).setUint32(wav.length - 68 + 8 + 40, 1, true); // smpl loop type: 1 = ping-pong
    const r = importAudioFiles(emptyProject('x'), [{ fileName: 'Pad_C3.wav', bytes: wav }]);
    expect(r.project.zones[0].takes[0].loop).toBeNull();
  });
});
