import { describe, it, expect } from 'vitest';
import { estimatePitch } from './pitch';

const tone = (hz: number, seconds = 1, rate = 44100) => ({
  sampleRate: rate,
  channels: [Float32Array.from({ length: seconds * rate }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / rate) + 0.2 * Math.sin((4 * Math.PI * hz * i) / rate))],
});

describe('estimatePitch', () => {
  it.each([[220, 57], [440, 69], [65.41, 36], [1046.5, 84]])('%f Hz is MIDI %i', (hz, midi) => {
    const a = tone(hz);
    const p = estimatePitch(a, 0, a.channels[0].length)!;
    expect(p.midi).toBe(midi);
    expect(Math.abs(p.cents)).toBeLessThan(3);
  });

  it('reports cents', () => {
    const a = tone(440 * 2 ** (7 / 1200));
    expect(estimatePitch(a, 0, a.channels[0].length)!.cents).toBeCloseTo(7, 0);
  });

  it('gives up on noise rather than guessing', () => {
    let x = 1;
    const noise = { sampleRate: 44100, channels: [Float32Array.from({ length: 44100 }, () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return (x / 0x7fffffff - 0.5) * 0.6; })] };
    expect(estimatePitch(noise, 0, 44100)).toBeNull();
  });

  it('reads past the attack, within the take', () => {
    const a = tone(440, 2);
    expect(estimatePitch(a, 44100, 88200)!.midi).toBe(69);
  });
});
