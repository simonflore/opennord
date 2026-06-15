import { describe, it, expect } from 'vitest';
import { tileZones, clampKeyHigh, keyFraction, keyFromFraction, isBlackKey, KEY_MIN, KEY_MAX } from './keyboard-view';
import type { EditZone } from './sample-edit';

const z = (rootKey: number, keyHigh: number, velTop = 127): EditZone => ({ rootKey, keyHigh, velTop });

describe('tileZones', () => {
  it('lays zones out by ascending top key and derives bottom keys, keeping original index', () => {
    // given out of order (as the OG map stores them, descending)
    const tiled = tileZones([z(60, 108), z(48, 60), z(36, 40)]);
    expect(tiled.map((t) => t.keyHigh)).toEqual([40, 60, 108]);
    expect(tiled.map((t) => t.keyLow)).toEqual([KEY_MIN, 41, 61]);
    expect(tiled.map((t) => t.index)).toEqual([2, 1, 0]); // original positions preserved
  });
});

describe('clampKeyHigh', () => {
  const tiled = tileZones([z(0, 40), z(0, 60), z(0, 108)]);
  it('keeps a split above its own floor and below the next zone', () => {
    expect(clampKeyHigh(tiled, 0, 55)).toBe(55);           // within range
    expect(clampKeyHigh(tiled, 0, 10)).toBe(tiled[0].keyLow); // not below own floor
    expect(clampKeyHigh(tiled, 0, 999)).toBe(59);          // next zone keyHigh(60) - 1
    expect(clampKeyHigh(tiled, 2, 999)).toBe(KEY_MAX);     // last zone caps at KEY_MAX
  });
});

describe('key geometry', () => {
  it('maps the ends to 0 and 1 and round-trips', () => {
    expect(keyFraction(KEY_MIN)).toBe(0);
    expect(keyFraction(KEY_MAX)).toBe(1);
    expect(keyFromFraction(0)).toBe(KEY_MIN);
    expect(keyFromFraction(1)).toBe(KEY_MAX);
    expect(keyFromFraction(keyFraction(60))).toBe(60);
  });
  it('knows the black keys', () => {
    expect(isBlackKey(61)).toBe(true);  // C#4
    expect(isBlackKey(60)).toBe(false); // C4
  });
});
