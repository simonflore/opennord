/**
 * `Ymer::Codec::NW1` DSP helpers — the fixed-point level/normalize/decay
 * conversions the editor uses to build a stroke header's gain fields. Ported
 * verbatim from the Nord Sample Editor arm64 slice (`nse_decomp/arm64/`):
 * `Level2DSP` `@1002de888`, `DSP2Level` `@1002de8b8`, `Get0dB` `@1002de77c`,
 * `Decay2DSP` `@1002de790`, `GetDSPNormalize` `@1002de8e4`.
 *
 * These feed the OG (`NWS`/codec-1) `stk` stroke header (`normGain` @0x09, the
 * `0x0c` exponent byte, the decay fields) — see {@link writeOgStrokeHeader} and
 * `docs/NSMP-CODEC.md`. They are pure integer/float math with no proprietary
 * tables.
 */

/** Bit-depth constants (`SMetric` statics) used by the header math. */
export const SMETRIC = {
  kNomTgtBitDepth: 14,
  kMaxTgtBitDepth: 16,
  kMaxSrcBitDepth: 24,
  kPlayerBitDepth: 24,
  /** Envelope tick rate for `Decay2DSP` (`SMetric::kEnvelopeUpdateRate`). */
  kEnvelopeUpdateRate: 172,
} as const;

/** `Level2DSP(dB)` = `round(10^(dB/20) · 2^20)`. A linear gain in Q20. */
export function level2DSP(dB: number): number {
  return Math.trunc(Math.pow(10, dB / 20) * 1048576 + 0.5);
}

/** `DSP2Level(x)` = `20·log10(x · 2^-20)` — inverse of {@link level2DSP}. */
export function dsp2Level(x: number): number {
  return 20 * Math.log10(x * 9.5367431640625e-7);
}

/** `Get0dB(bits)` = `2^(bits-1)` — full-scale amplitude for a bit depth. */
export function get0dB(bits: number): number {
  return Math.pow(2, (bits - 1) & 0x1f);
}

/**
 * `Decay2DSP(d, rate)` = `d>0 ? -round(0.99^(1/(d·rate)) · 2^23) : -2^23`.
 * `0.99` is the per-tick coefficient (`0x3f847ae147ae147b`). A one-shot (no
 * decay) yields `-2^23` → the `80 00 00` decay marker in the header.
 */
export function decay2DSP(d: number, rate: number = SMETRIC.kEnvelopeUpdateRate): number {
  if (d > 0) return -Math.trunc(Math.pow(0.99, 1 / (d * rate)) * 8388608);
  return -0x800000;
}

/**
 * `GetDSPNormalize(x)` — frexp-style split of `x` into a 24-bit mantissa and a
 * power-of-2 exponent: scales `|x|` into `[0.5, 1)`, `mant = trunc(scaled·2^23)`,
 * `exp` = the applied shift (±). Matches the binary's loop exactly.
 */
export function getDSPNormalize(x: number): { mant: number; exp: number } {
  let exp = 0;
  let v = x;
  if (x !== 0) {
    let abs = Math.abs(v);
    if (abs >= 1) {
      do {
        v = v * 0.5;
        exp += 1;
        abs = Math.abs(v);
      } while (abs >= 1);
    }
    if (abs < 0.5) {
      do {
        v = v + v;
        exp -= 1;
        abs = Math.abs(v);
      } while (abs < 0.5);
    }
  }
  return { mant: Math.trunc(v * 8388608), exp };
}
