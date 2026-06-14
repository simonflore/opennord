import { describe, it, expect } from 'vitest';
import { findAuthorizedDevice } from './authorized';

const NORD: USBDeviceFilter = { vendorId: 0x0ffc, productId: 0x002e };
const dev = (vendorId: number, productId: number) => ({ vendorId, productId }) as USBDevice;

describe('findAuthorizedDevice', () => {
  it('returns a previously-authorized Nord so repeat connects skip the chooser', () => {
    const nord = dev(0x0ffc, 0x002e);
    expect(findAuthorizedDevice([dev(0x1234, 0x0001), nord], NORD)).toBe(nord);
  });

  it('returns undefined when no authorized Nord is present (chooser needed)', () => {
    expect(findAuthorizedDevice([dev(0x1234, 0x0001)], NORD)).toBeUndefined();
    expect(findAuthorizedDevice([], NORD)).toBeUndefined();
  });
});
