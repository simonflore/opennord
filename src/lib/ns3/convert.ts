/**
 * Stage 3 format 3.00–3.03 → 3.04, as the OS 2.64 load path fixes up an older
 * 3.x body (version fix-ups; delay rate). The block
 * layout is the same; a few values change meaning:
 *
 * - below 3.02: Dual-KB style 0 becomes 1;
 * - below 3.03: Pitch Stick Range is set to 1, and below 3.04 the Extern
 *   volume-pedal switches to on — both their defaults, which block-chain reading
 *   already gives a field the older format doesn't store (decode.ts);
 * - 3.00: the delay rate was a 0–127 value, its morph deltas stored as
 *   delta + 127 in the 15-bit delta field (so delta = decoded value + 16256).
 *   With the delay synced to the master clock the firmware maps a rate x to
 *   N(x) = 16383 for 127, else 128·x, and each delta to N(target) − N(rate),
 *   where target = rate + delta (a target below 0 or above 16383 maps to
 *   128·target). A rate above 127, or a target in 128–16383, makes it refuse
 *   the program, clock on or off. With the clock off it maps the rate and
 *   targets through a 128-point curve held in the firmware, which OpenNord does
 *   not copy: such a rate is kept as the file stores it, on the 3.00 scale
 *   (0–127, deltas in the same units), and flagged.
 *
 * Pure; never throws.
 */
import type { Ns3FieldKey } from './layout.generated';

type Values = Partial<Record<Ns3FieldKey, number>>;
type Slot = 'A' | 'B';

/** The 15-bit delay-rate delta field's decoded value for a 3.00 delta of 0 (raw 127 − 16383). */
const OS300_DELTA_ZERO = 127 - 16383;
const DELAY_MAX = 16383;
const MORPHS = ['morphWheel', 'morphAfterTouch', 'morphCtrlPedal'] as const;
const OS300_REFUSED = 'This program comes from Stage 3 OS 3.00 and has a delay time the Stage 3 can’t update, ' +
  'so the instrument won’t load it. Showing the file header only.';

export interface Ns3Conversion {
  readonly values: Values;
  /** Panels whose free-running delay rate is kept on the OS 3.00 scale (0–127). */
  readonly os300DelayRate: readonly Slot[];
  /** Why the instrument refuses this program, when it does. */
  readonly refused?: string;
}

/** Fields whose stored value the firmware converts when it loads a body of `formatVersion`. */
export function ns3FieldsConverted(formatVersion: number): Ns3FieldKey[] {
  const keys: Ns3FieldKey[] = [];
  if (formatVersion < 302) keys.push('common.dualKbdStyle');
  if (formatVersion === 300) {
    for (const s of ['A', 'B'] as const) {
      keys.push(`effects${s}.dlyRateClkDiv`, ...MORPHS.map((m) => `effects${s}.dlyRateClkDiv.${m}` as Ns3FieldKey));
    }
  }
  return keys;
}

/** Bring the values of a 3.00–3.03 body to what the instrument plays (see the module comment). */
export function convertNs3Values(values: Values, formatVersion: number): Ns3Conversion {
  if (formatVersion >= 302) return { values, os300DelayRate: [] };
  const out: Values = { ...values };
  if (out['common.dualKbdStyle'] === 0) out['common.dualKbdStyle'] = 1;
  const os300DelayRate: Slot[] = [];
  if (formatVersion === 300) {
    for (const s of ['A', 'B'] as const) {
      const rateKey = `effects${s}.dlyRateClkDiv` as const;
      const rate = out[rateKey] ?? 0;
      const deltaKeys = MORPHS.map((m) => `${rateKey}.${m}` as Ns3FieldKey);
      const deltas = deltaKeys.map((k) => (out[k] ?? OS300_DELTA_ZERO) - OS300_DELTA_ZERO);
      // The firmware refuses a rate above 127 and a target in 128–16383, clock on or off.
      const outside = (t: number) => t < 0 || t > DELAY_MAX;
      if (rate > 127 || deltas.some((d) => !outside(rate + d) && rate + d > 127)) {
        return { values, os300DelayRate: [], refused: OS300_REFUSED };
      }
      if (out[`effects${s}.dlyClkEnable`] !== 1) {
        // Free-running: OpenNord doesn't reproduce the instrument's curve, so keep the 3.00 scale.
        deltaKeys.forEach((k, i) => { out[k] = deltas[i]; });
        os300DelayRate.push(s);
        continue;
      }
      const synced = (x: number) => (x === 127 ? DELAY_MAX : 128 * x);
      const targets = deltas.map((d) => (outside(rate + d) ? 128 * (rate + d) : synced(rate + d)));
      const now = synced(rate);
      out[rateKey] = now;
      // Kept within the delta field's range (how the registry stores an overshoot is not known; medium).
      deltaKeys.forEach((k, i) => { out[k] = Math.max(-DELAY_MAX, Math.min(DELAY_MAX, targets[i] - now)); });
    }
  }
  return { values: out, os300DelayRate };
}
