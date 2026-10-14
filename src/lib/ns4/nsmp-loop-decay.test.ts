import { describe, it, expect } from 'vitest';
import { loopDecayDbPerSecond, loopDecayRaw } from './nsmp';

describe('loopDecayRaw', () => {
  it('holds when there is no decay', () => {
    expect(loopDecayRaw(null)).toBe(0x800000);
    expect(loopDecayRaw(0)).toBe(0x800000);
    expect(loopDecayDbPerSecond(loopDecayRaw(null))).toBe(0);
  });
  it.each([0.5, 4, 20])('falls 40 dB in %s seconds, as the editor counts Decay', (s) => {
    expect(loopDecayDbPerSecond(loopDecayRaw(s))).toBeCloseTo(40 / s, 1);
  });
  it('stays a 24-bit field', () => {
    const raw = loopDecayRaw(0.05);
    expect(raw).toBeGreaterThan(0);
    expect(raw).toBeLessThanOrEqual(0xffffff);
  });
});
