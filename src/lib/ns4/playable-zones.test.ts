import { describe, it, expect } from 'vitest';
import { buildPlayableZones, strokeKeyboardOrder } from './playable-zones';
import { KEY_MIN } from './keyboard-view';
import type { NsmpZone } from './nsmp';

const z = (globalID: number, rootKey: number, keyHigh: number, velLow = 0, velTop = 127): NsmpZone =>
  ({ globalID, rootKey, keyLow: 0, keyHigh, velLow, velTop } as NsmpZone);

describe('buildPlayableZones', () => {
  it('tiles gaplessly left→right by keyHigh, keeping globalID + velocity', () => {
    const out = buildPlayableZones([z(7, 60, 72), z(3, 48, 59)]);
    expect(out.map((p) => p.globalID)).toEqual([3, 7]);     // sorted by keyHigh
    expect(out[0].keyLow).toBe(KEY_MIN);
    expect(out[0].keyHigh).toBe(59);
    expect(out[1].keyLow).toBe(60);                          // prev.keyHigh + 1
    expect(out[1].keyHigh).toBe(72);
    expect(out[1].rootKey).toBe(60);
  });
});

describe('strokeKeyboardOrder', () => {
  it('maps each stroke globalID to its 0-based keyboard position', () => {
    const order = strokeKeyboardOrder([z(7, 60, 72), z(3, 48, 59)]);
    expect(order.get(3)).toBe(0);
    expect(order.get(7)).toBe(1);
  });
});
