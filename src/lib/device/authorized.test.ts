import { describe, it, expect } from 'vitest';
import { findAuthorizedDevice } from './authorized';

const NORD: USBDeviceFilter = { vendorId: 0x0ffc };
const dev = (vendorId: number, productId: number) => ({ vendorId, productId }) as USBDevice;

describe('findAuthorizedDevice', () => {
  it('returns a previously-authorized Nord so repeat connects skip the chooser', () => {
    const nord = dev(0x0ffc, 0x002e);
    expect(findAuthorizedDevice([dev(0x1234, 0x0001), nord], NORD)).toBe(nord);
  });

  it('matches any Clavia device (vendor 0x0ffc), not just the Stage 4', () => {
    const ns3 = dev(0x0ffc, 0x0030);
    expect(findAuthorizedDevice([dev(0x1234, 0x0001), ns3], NORD)).toBe(ns3);
  });

  it('still respects productId when the filter sets one', () => {
    const stage4: USBDeviceFilter = { vendorId: 0x0ffc, productId: 0x002e };
    expect(findAuthorizedDevice([dev(0x0ffc, 0x0030)], stage4)).toBeUndefined();
  });

  it('returns undefined when no Clavia device is present (chooser needed)', () => {
    expect(findAuthorizedDevice([dev(0x1234, 0x0001)], NORD)).toBeUndefined();
    expect(findAuthorizedDevice([], NORD)).toBeUndefined();
  });
});
