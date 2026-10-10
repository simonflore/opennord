import { describe, it, expect } from 'vitest';
import {
  amplitudeModulation, centsBetween, envelopeStats, estimateF0, findOnset, levels, measure, noteName,
  noteToHz, nthNote, parseNote, pickChannel, pitchModulation, readRecording, segmentNotes, spectralCentroid, timeline,
} from './analysis';
import { encodeWav } from '../ns4/wav';

const SR = 48000;

/** Sum of harmonics of `hz` (amplitudes `amps`), `seconds` long, with an amplitude envelope. */
function tone(hz: number, seconds: number, amps: number[] = [1], env: (t: number) => number = () => 1, sr = SR): Float32Array {
  const n = Math.round(seconds * sr);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / sr;
    let v = 0;
    amps.forEach((a, h) => { v += a * Math.sin(2 * Math.PI * (h + 1) * hz * t); });
    return v * env(t);
  });
}

/** Deterministic white noise in [-a, a]. */
function noise(n: number, a: number, seed = 1): Float32Array {
  let s = seed;
  return Float32Array.from({ length: n }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return a * ((s / 0x7fffffff) * 2 - 1);
  });
}

const concat = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

describe('note names', () => {
  it('parses names and numbers', () => {
    expect(parseNote('A4')).toBe(69);
    expect(parseNote('G#4')).toBe(68);
    expect(parseNote('Ab4')).toBe(68);
    expect(parseNote('C4')).toBe(60);
    expect(parseNote('A0')).toBe(21);
    expect(parseNote('60')).toBe(60);
    expect(() => parseNote('H2')).toThrow();
    expect(noteName(69)).toBe('A4');
    expect(noteName(61)).toBe('C#4');
    expect(noteToHz(69)).toBe(440);
    expect(noteToHz(57)).toBeCloseTo(220, 9);
    expect(centsBetween(440 * 2 ** (27 / 1200), 440)).toBeCloseTo(27, 9);
  });
});

describe('estimateF0', () => {
  for (const hz of [55, 110, 220, 261.63, 440, 1000, 2093]) {
    it(`finds ${hz} Hz within 0.2 cent (harmonic-rich tone)`, () => {
      const x = tone(hz, 0.4, [1, 0.6, 0.4, 0.3, 0.2]);
      const f = estimateF0(x, SR)!;
      expect(Math.abs(centsBetween(f.hz, hz))).toBeLessThan(0.2);
      expect(f.clarity).toBeGreaterThan(0.95);
    });
  }

  it('does not jump an octave on a weak fundamental', () => {
    const f = estimateF0(tone(220, 0.4, [0.3, 1, 0.8, 0.5]), SR)!;
    expect(Math.abs(centsBetween(f.hz, 220))).toBeLessThan(0.5);
  });

  it('separates the +27-cent hypotheses (a 27-cent shift reads as 27 cents)', () => {
    const a = estimateF0(tone(440, 0.4, [1, 0.4]), SR)!.hz;
    const b = estimateF0(tone(440 * 2 ** (27 / 1200), 0.4, [1, 0.4]), SR)!.hz;
    expect(centsBetween(b, a)).toBeCloseTo(27, 1);
  });

  it('reaches C8 and a stretch-tuned A0 at 44.1, 48 and 96 kHz (no octave error at the range edges)', () => {
    for (const sr of [44100, 48000, 96000]) {
      for (const hz of [4186.01, 4237, 27.5, 27.14]) {
        const f = estimateF0(tone(hz, 0.4, [1], undefined, sr), sr);
        expect(Math.abs(centsBetween(f!.hz, hz))).toBeLessThan(1);
      }
    }
  });

  it('holds up with noise 40 dB down, and gives up on pure noise', () => {
    const x = tone(440, 0.4, [1, 0.5]);
    const nz = noise(x.length, 0.01);
    const f = estimateF0(x.map((v, i) => v + nz[i]), SR)!;
    expect(Math.abs(centsBetween(f.hz, 440))).toBeLessThan(0.5);
    expect(estimateF0(noise(SR / 2, 0.5, 7), SR)).toBeUndefined();
  });
});

describe('levels', () => {
  it('reads peak and RMS of a sine', () => {
    const lv = levels(tone(1000, 1, [0.5]));
    expect(lv.peakDb).toBeCloseTo(-6.02, 1);
    expect(lv.rmsDb).toBeCloseTo(-9.03, 1);
  });
  it('reads a 20 dB step between two takes', () => {
    expect(levels(tone(440, 1, [0.5])).rmsDb - levels(tone(440, 1, [0.05])).rmsDb).toBeCloseTo(20, 2);
  });
});

describe('spectralCentroid', () => {
  it('reads a sine at its own frequency', () => {
    expect(spectralCentroid(tone(1000, 0.5), SR)!).toBeCloseTo(1000, -1);
  });
  it('reads the mean of two equal sines', () => {
    const x = tone(500, 0.5).map((v, i) => v + Math.sin((2 * Math.PI * 1500 * i) / SR));
    expect(spectralCentroid(x, SR)!).toBeCloseTo(1000, -1);
  });
  it('rises with brightness', () => {
    const dull = spectralCentroid(tone(440, 0.5, [1, 0.03]), SR)!;
    const bright = spectralCentroid(tone(440, 0.5, Array.from({ length: 16 }, (_, h) => 1 / (h + 1))), SR)!;
    expect(bright / dull).toBeGreaterThan(2);
  });
});

describe('envelopeStats', () => {
  it('measures a linear 50 ms attack as 40 ms (10 → 90 %)', () => {
    const x = tone(440, 1, [1], (t) => Math.min(1, t / 0.05));
    const e = envelopeStats(x, SR);
    expect(e.attackMs!).toBeGreaterThan(37);
    expect(e.attackMs!).toBeLessThan(43);
    expect(e.sustained).toBe(true);
    expect(e.t60S).toBeUndefined();
  });

  it('measures the T60 and 20 dB fall of an exponential decay', () => {
    const t60 = 1.5;
    const x = tone(440, 3, [1, 0.3], (t) => 10 ** ((-60 * t) / t60 / 20));
    const e = envelopeStats(x, SR);
    expect(e.t60S!).toBeCloseTo(1.5, 1);
    expect(Math.abs(e.t60S! - 1.5) / 1.5).toBeLessThan(0.02);
    expect(e.decay20Ms!).toBeGreaterThan(480);
    expect(e.decay20Ms!).toBeLessThan(520);
  });

  it('measures a fast damper (T60 50 ms) after a held part', () => {
    const x = tone(440, 1, [1], (t) => (t < 0.5 ? 1 : 10 ** ((-60 * (t - 0.5)) / 0.05 / 20)));
    const e = envelopeStats(x.subarray(Math.round(0.45 * SR)), SR);
    expect(Math.abs(e.t60S! - 0.05) / 0.05).toBeLessThan(0.15);
  });

  it('stops the fit at the noise floor', () => {
    const x = tone(440, 3, [1], (t) => 10 ** ((-60 * t) / 1 / 20));
    const nz = noise(x.length, 10 ** (-50 / 20));
    const e = envelopeStats(x.map((v, i) => v + nz[i]), SR, -55);
    expect(Math.abs(e.t60S! - 1) / 1).toBeLessThan(0.05);
  });
});

describe('findOnset and measure', () => {
  it('finds a note after a silent lead-in and measures it from there', () => {
    const lead = noise(Math.round(0.3 * SR), 1e-4);
    const note = tone(220, 1.5, [1, 0.5, 0.25], (t) => 0.5 * 10 ** ((-60 * t) / 2 / 20));
    const x = concat(lead, note);
    const on = findOnset(x, SR);
    expect(Math.abs(on / SR - 0.3)).toBeLessThan(0.003);
    const m = measure(x, SR);
    expect(Math.abs(centsBetween(m.f0!.hz, 220))).toBeLessThan(0.3);
    expect(m.noiseDb).toBeLessThan(-75);
    expect(Math.abs(m.env.t60S! - 2) / 2).toBeLessThan(0.03);
    expect(m.lengthS).toBeCloseTo(1.5, 1);
  });

  it('finds a soft note above a hum floor less than 40 dB below it', () => {
    const hum = (n: number) => tone(50, n / SR, [1], () => 0.003); // ≈ −53 dBFS
    const note = tone(440, 1, [1], () => 0.08); // ≈ −25 dBFS
    const h = hum(Math.round(0.4 * SR) + note.length);
    const x = concat(h.subarray(0, Math.round(0.4 * SR)), note.map((v, i) => v + h[Math.round(0.4 * SR) + i]));
    expect(Math.abs(findOnset(x, SR) / SR - 0.4)).toBeLessThan(0.005);
  });

  it('honours a window after the onset', () => {
    const x = concat(tone(440, 1, [0.5]), tone(440, 1, [0.05]));
    const m = measure(x, SR, { window: [1.1, 1.9] });
    expect(m.rmsDb).toBeCloseTo(-29.03, 1);
  });
});

describe('modulation', () => {
  it('reads a 6.5 Hz, ±3 dB tremolo', () => {
    const x = tone(440, 3, [1], (t) => 10 ** ((3 * Math.sin(2 * Math.PI * 6.5 * t)) / 20));
    const m = amplitudeModulation(x, SR)!;
    expect(m.rateHz).toBeCloseTo(6.5, 1);
    expect(m.depth).toBeGreaterThan(2.6);
    expect(m.depth).toBeLessThan(3.2);
  });

  it('reads a fast 16 Hz tremolo at its own rate, not half of it', () => {
    const x = tone(440, 3, [1], (t) => 10 ** ((3 * Math.sin(2 * Math.PI * 16 * t)) / 20));
    expect(amplitudeModulation(x, SR)!.rateHz).toBeCloseTo(16, 0);
  });

  it('reads a slow 0.8 Hz rotor', () => {
    const x = tone(440, 6, [1], (t) => 1 + 0.5 * Math.sin(2 * Math.PI * 0.8 * t));
    expect(amplitudeModulation(x, SR)!.rateHz).toBeCloseTo(0.8, 1);
  });

  it('reads a 6 Hz, ±20 cent vibrato', () => {
    const n = 2 * SR;
    const x = new Float32Array(n);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const hz = 440 * 2 ** ((20 * Math.sin((2 * Math.PI * 6 * i) / SR)) / 1200);
      phase += (2 * Math.PI * hz) / SR;
      x[i] = Math.sin(phase) + 0.3 * Math.sin(2 * phase);
    }
    const m = pitchModulation(x, SR, 440)!;
    expect(m.rateHz).toBeCloseTo(6, 1);
    expect(Math.abs(m.depth - 20)).toBeLessThan(2);
  });

  it('ignores the attack, the release and the silence around a modulated note', () => {
    const vib = new Float32Array(2 * SR);
    let phase = 0;
    for (let i = 0; i < vib.length; i++) {
      const hz = 440 * 2 ** ((15 * Math.sin((2 * Math.PI * 7 * i) / SR)) / 1200);
      phase += (2 * Math.PI * hz) / SR;
      vib[i] = (0.5 + 0.1 * Math.sin((2 * Math.PI * 5 * i) / SR)) * Math.sin(phase) * Math.min(1, i / (0.01 * SR));
    }
    const release = Float32Array.from({ length: SR / 2 }, (_, i) => vib[vib.length - 1] * 0 + 0.5 * Math.sin(phase + (2 * Math.PI * 440 * i) / SR) * 10 ** ((-60 * i) / (0.1 * SR) / 20));
    const x = concat(new Float32Array(SR / 4), vib, release, new Float32Array(SR / 4));
    const p = pitchModulation(x, SR, 440)!;
    expect(p.rateHz).toBeCloseTo(7, 1);
    expect(Math.abs(p.depth - 15)).toBeLessThan(1.5);
    const t = amplitudeModulation(x, SR)!;
    expect(t.rateHz).toBeCloseTo(5, 1);
  });

  it('finds no modulation in a steady tone', () => {
    expect(amplitudeModulation(tone(440, 2), SR)).toBeUndefined();
  });
});

describe('timeline', () => {
  it('follows level and brightness over time', () => {
    const x = concat(tone(440, 0.5, [0.5]), tone(440, 0.5, [0.05, 0.05, 0.05, 0.05]));
    const rows = timeline(x, SR);
    expect(rows).toHaveLength(10);
    expect(rows[0].atS).toBe(0);
    expect(rows[2].rmsDb).toBeCloseTo(-9.03, 1);
    expect(rows[7].rmsDb).toBeCloseTo(-23.0, 0);
    expect(rows[2].centroidHz!).toBeCloseTo(440, -1);
    expect(rows[7].centroidHz!).toBeGreaterThan(1000);
  });
});

describe('segmentNotes', () => {
  it('splits a take into its notes', () => {
    const gap = new Float32Array(Math.round(0.6 * SR));
    const note = (a: number) => tone(440, 1, [a], (t) => 10 ** ((-60 * t) / 0.8 / 20));
    const x = concat(gap, note(0.8), gap, note(0.2), gap, note(0.05));
    const starts = segmentNotes(x, SR).map((s) => s / SR);
    expect(starts).toHaveLength(3);
    expect(starts[0]).toBeCloseTo(0.6, 2);
    expect(starts[1]).toBeCloseTo(2.2, 2);
    expect(starts[2]).toBeCloseTo(3.8, 2);
    // the second note on its own: from just before it starts to just before the third
    const second = nthNote(x, SR, 2);
    expect(second.length / SR).toBeCloseTo(1.6 - 0.02 + 0.05, 2);
    expect(levels(second).peakDb).toBeCloseTo(20 * Math.log10(0.2), 1);
    expect(() => nthNote(x, SR, 4)).toThrow(/3 note/);
  });
});

describe('readRecording', () => {
  it('reads a 16-bit stereo WAV back to [-1, 1] and picks channels', () => {
    const l = tone(440, 0.1, [0.5]);
    const r = tone(440, 0.1, [0.25]);
    const rec = readRecording(encodeWav([l, r], SR));
    expect(rec.sampleRate).toBe(SR);
    expect(rec.channels).toHaveLength(2);
    expect(levels(rec.channels[0]).peakDb).toBeCloseTo(-6.02, 1);
    expect(levels(pickChannel(rec, 'right')).peakDb).toBeCloseTo(-12.04, 1);
    expect(levels(pickChannel(rec, 'mix')).peakDb).toBeCloseTo(20 * Math.log10(0.375), 1);
    expect(levels(pickChannel(rec, 'side')).peakDb).toBeCloseTo(20 * Math.log10(0.125), 1);
  });

  it('scales a 32-bit float WAV correctly', () => {
    const n = 1000;
    const bytes = new Uint8Array(44 + n * 4);
    const dv = new DataView(bytes.buffer);
    const put = (o: number, s: string) => { for (let i = 0; i < 4; i++) bytes[o + i] = s.charCodeAt(i); };
    put(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); put(8, 'WAVE'); put(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 32, true);
    put(36, 'data'); dv.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) dv.setFloat32(44 + i * 4, 0.25 * Math.sin((2 * Math.PI * 440 * i) / SR), true);
    expect(levels(readRecording(bytes).channels[0]).peakDb).toBeCloseTo(-12.04, 1);
  });

  it('refuses a 64-bit float WAV instead of misreading it', () => {
    const bytes = new Uint8Array(44 + 80);
    const dv = new DataView(bytes.buffer);
    const put = (o: number, s: string) => { for (let i = 0; i < 4; i++) bytes[o + i] = s.charCodeAt(i); };
    put(0, 'RIFF'); dv.setUint32(4, 36 + 80, true); put(8, 'WAVE'); put(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 8, true); dv.setUint16(32, 8, true); dv.setUint16(34, 64, true);
    put(36, 'data'); dv.setUint32(40, 80, true);
    expect(() => readRecording(bytes)).toThrow(/64-bit float/);
  });
});
