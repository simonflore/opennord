/**
 * Vibrato / chorus — an approximation of the tonewheel organ's scanner.
 *
 * The real circuit is a ~1 ms, nine-stage LC delay line whose taps a rotating
 * capacitive scanner sweeps 1→9→1 at about 7 Hz: a triangle-wave modulation of
 * delay time. Vibrato (V1–V3) hears only the swept signal; chorus (C1–C3) mixes
 * it with the dry signal. Depth 1–3 sweeps a growing share of the line.
 *
 * Modelled here as a single modulated fractional delay. Not modelled: the LC
 * line's frequency-dependent delay and its gentle high-frequency loss, and the
 * stepwise tap-to-tap crossfades. Public description: Electric Druid,
 * "Technical aspects of the Hammond organ".
 */
import type { VibChorusType } from './types';

/** Peak-to-peak delay sweep (ms) for depth 1, 2, 3. */
export const SCANNER_DEPTH_MS = [0.35, 0.65, 1.0] as const;
const BASE_DELAY_MS = 0.05;
const BUF = 1024; // power of two; ≥ 1.05 ms even at 192 kHz
const MASK = BUF - 1;

export class Scanner {
  private buf = new Float32Array(BUF);
  private w = 0;
  private lfo = 0; // phase 0..1
  private on = false;
  private chorus = false;
  private depthSamples = 0;
  private baseSamples: number;
  private inc = 0;
  private shape: 'triangle' | 'sine' = 'triangle';

  constructor(private readonly sampleRate: number) {
    this.baseSamples = (BASE_DELAY_MS * sampleRate) / 1000;
  }

  set(on: boolean, type: VibChorusType, rateHz: number, shape: 'triangle' | 'sine'): void {
    this.on = on;
    this.chorus = type[0] === 'C';
    const depth = Number(type[1]) as 1 | 2 | 3;
    this.depthSamples = (SCANNER_DEPTH_MS[depth - 1] * this.sampleRate) / 1000;
    this.inc = rateHz / this.sampleRate;
    this.shape = shape;
  }

  /** Current delay in samples (exposed for tests). */
  delaySamples(): number {
    const l = this.lfo;
    const u = this.shape === 'triangle' ? (l < 0.5 ? 2 * l : 2 - 2 * l) : 0.5 - 0.5 * Math.cos(2 * Math.PI * l);
    return this.baseSamples + this.depthSamples * u;
  }

  process(x: number): number {
    this.buf[this.w] = x;
    if (!this.on) { this.w = (this.w + 1) & MASK; return x; }
    const d = this.delaySamples();
    const r = this.w - d;
    const i = Math.floor(r);
    const f = r - i;
    const a = this.buf[i & MASK];
    const b = this.buf[(i + 1) & MASK];
    const wet = a + (b - a) * f;
    this.w = (this.w + 1) & MASK;
    this.lfo += this.inc;
    if (this.lfo >= 1) this.lfo -= 1;
    return this.chorus ? 0.6 * (x + wet) : wet;
  }
}
