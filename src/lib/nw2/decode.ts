/**
 * Nord Wave 2 (`.nw2p`) body reader — read-only.
 *
 * Applies the Wave 2 OS 1.24 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader
 * (clavia/block-chain.ts): the u32 version, MultiCommon, then four 244-byte
 * slots of ten blocks each at body 68 + 244k — 41 blocks, a 1044-byte body.
 * The version word and the length-prefixed chain must end exactly at EOF;
 * anything else returns the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NW2_LAYOUT } from './layout.generated';
import type { Nw2Program, Nw2Slot, Nw2SlotSource } from './types';

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
