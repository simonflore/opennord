/**
 * Nord Wave 2 (`.nw2p`) body reader — read-only.
 *
 * Applies the Wave 2 OS 1.24 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader
 * (clavia/block-chain.ts): the u32 version, MultiCommon, then four 244-byte
 * slots of ten blocks each at body 68 + 244k — 41 blocks, a 1044-byte body.
 * The version word and the length-prefixed chain must end exactly at EOF;
 * anything else returns the header-only result with a warning. Never throws.
 *
 * Morphs are read with the base values, as `<field>.morph<Source>` (see
 * types.ts for how the firmware stores and applies them).
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NW2_LAYOUT } from './layout.generated';
import type { Nw2FieldKey, Nw2MorphSource, Nw2Program, Nw2Slot, Nw2SlotSource } from './types';

export const NW2_SLOTS: readonly Nw2Slot[] = ['A', 'B', 'C', 'D'];

/** Edt_Syn_kOscBank value that selects a Sample Library sample. */
export const NW2_OSC_BANK_SAMPLES = 4;

export function decodeNw2(bytes: Uint8Array): Nw2Program {
  return { format: 'nw2p', ...decodeFwProgram(bytes, NW2_LAYOUT) };
}

/**
 * Whether a slot is on: bit k of MultiCommon Edt_Com_kSlotEnable (a 1–15 mask,
 * bit 0 = slot A; medium — read from its default 1 and its range). Undefined
 * when the layout did not match.
 */
export function nw2SlotEnabled(p: Nw2Program, slot: Nw2Slot): boolean | undefined {
  const mask = p.values['common.slotEnable'];
  return mask === undefined ? undefined : ((mask >> NW2_SLOTS.indexOf(slot)) & 1) === 1;
}

/** A slot's sound source, or undefined when the layout did not match. */
export function nw2SlotSource(p: Nw2Program, slot: Nw2Slot): Nw2SlotSource | undefined {
  const bank = p.values[`slot${slot}Common.oscBank`];
  const wave = p.values[`slot${slot}Common.oscWave`];
  if (bank === undefined || wave === undefined) return undefined;
  return { bank, kind: bank === NW2_OSC_BANK_SAMPLES ? 'sample' : 'oscillator', wave };
}

/** The morph sources in buffer order (buffers 1-5), with the key suffix each is read under. */
export const NW2_MORPH_SOURCES: readonly { readonly source: Nw2MorphSource; readonly suffix: string }[] = [
  { source: 'Impulse', suffix: 'morphImpulse' },
  { source: 'Wheel', suffix: 'morphWheel' },
  { source: 'Pedal', suffix: 'morphPedal' },
  { source: 'After Touch', suffix: 'morphAfterTouch' },
  { source: 'Velocity', suffix: 'morphVelocity' },
];

/** Base field key → its range minimum (the Impulse buffer stores its target relative to it). */
const BASE_MIN = new Map<string, number>(NW2_LAYOUT.fields.map((f) => [f.key, f.min]));

/** Base field keys that carry morph buffers, in layout order. */
const MORPHABLE: readonly Nw2FieldKey[] = NW2_LAYOUT.fields
  .filter((f) => f.key.endsWith('.morphImpulse'))
  .map((f) => f.key.slice(0, -'.morphImpulse'.length) as Nw2FieldKey);

/**
 * The Impulse morph target a parameter jumps to while the Impulse button is held,
 * or undefined when it has no Impulse morph (stored 0). Stored as target − min + 1.
 */
export function nw2ImpulseTarget(p: Nw2Program, key: Nw2FieldKey): number | undefined {
  const raw = p.values[`${key}.morphImpulse` as Nw2FieldKey];
  if (!raw) return undefined;
  return raw + (BASE_MIN.get(key) ?? 0) - 1;
}

/**
 * The morph sources a parameter responds to: Impulse when it has a target,
 * Wheel / Pedal / After Touch / Velocity when their delta is non-zero.
 */
export function nw2MorphSources(p: Nw2Program, key: Nw2FieldKey): Nw2MorphSource[] {
  return NW2_MORPH_SOURCES
    .filter(({ source, suffix }) => (source === 'Impulse'
      ? nw2ImpulseTarget(p, key) !== undefined
      : !!p.values[`${key}.${suffix}` as Nw2FieldKey]))
    .map(({ source }) => source);
}

/**
 * A slot's morphed parameters (base key → the sources that move it): the slot's
 * own blocks plus its level and pan in MultiCommon.
 */
export function nw2SlotMorphs(p: Nw2Program, slot: Nw2Slot): Map<Nw2FieldKey, Nw2MorphSource[]> {
  const out = new Map<Nw2FieldKey, Nw2MorphSource[]>();
  for (const key of MORPHABLE) {
    const mine = key.startsWith(`slot${slot}`) || key === `common.slotLevel${slot}` || key === `common.slotPan${slot}`;
    if (!mine) continue;
    const sources = nw2MorphSources(p, key);
    if (sources.length > 0) out.set(key, sources);
  }
  return out;
}

/**
 * A continuous morph's effect at the given controller positions (0–127 each):
 * the firmware adds round(Σ delta·position / 128) to the base value and clamps
 * it to the parameter's range. The Impulse buffer is not a delta (see
 * {@link nw2ImpulseTarget}).
 */
export function nw2MorphedValue(
  p: Nw2Program, key: Nw2FieldKey, positions: Partial<Record<Exclude<Nw2MorphSource, 'Impulse'>, number>>,
): number | undefined {
  const base = p.values[key];
  const field = NW2_LAYOUT.fields.find((f) => f.key === key);
  if (base === undefined || !field) return undefined;
  let sum = 0;
  for (const { source, suffix } of NW2_MORPH_SOURCES) {
    if (source === 'Impulse') continue;
    sum += (p.values[`${key}.${suffix}` as Nw2FieldKey] ?? 0) * (positions[source] ?? 0);
  }
  return Math.min(field.max, Math.max(field.min, base + ((sum + 64) >> 7)));
}
