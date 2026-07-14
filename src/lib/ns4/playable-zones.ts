/** Gapless, globalID-tagged keyboard layout shared by the sampler engine, the
 *  keyboard, and the stroke list — one source for key→zone and S# numbering. */
import type { NsmpZone } from './nsmp';
import { KEY_MIN } from './keyboard-view';

export interface PlayableZone {
  globalID: number;
  rootKey: number;
  keyLow: number;
  keyHigh: number;
  velLow: number;
  velTop: number;
}

/** Sort by split point and derive a gapless bottom key, so every key on the
 *  rendered keyboard maps to exactly one zone (matches the keyboard's bands). */
export function buildPlayableZones(zones: NsmpZone[]): PlayableZone[] {
  const ordered = [...zones].sort((a, b) => a.keyHigh - b.keyHigh);
  let low = KEY_MIN;
  return ordered.map((z) => {
    const pz: PlayableZone = {
      globalID: z.globalID, rootKey: z.rootKey, keyLow: low, keyHigh: z.keyHigh,
      velLow: z.velLow, velTop: z.velTop,
    };
    low = z.keyHigh + 1;
    return pz;
  });
}

/** globalID → 0-based keyboard position (lowest-keyHigh zone wins for a shared stroke). */
export function strokeKeyboardOrder(zones: NsmpZone[]): Map<number, number> {
  const ordered = [...zones].sort((a, b) => a.keyHigh - b.keyHigh);
  const order = new Map<number, number>();
  ordered.forEach((z, pos) => { if (!order.has(z.globalID)) order.set(z.globalID, pos); });
  return order;
}
