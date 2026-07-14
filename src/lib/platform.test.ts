// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getCapacitorPlatform, isCapacitorPlatform, isWebPlatform } from './platform';

function setCapacitor(value: unknown) {
  (window as unknown as { Capacitor?: unknown }).Capacitor = value;
}

afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe('platform detection', () => {
  it('reports web when Capacitor is absent', () => {
    expect(isCapacitorPlatform()).toBe(false);
    expect(isWebPlatform()).toBe(true);
    expect(getCapacitorPlatform()).toBe('web');
  });

  it('reports native iOS when Capacitor says so', () => {
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    expect(isCapacitorPlatform()).toBe(true);
    expect(isWebPlatform()).toBe(false);
    expect(getCapacitorPlatform()).toBe('ios');
  });

  it('treats a Capacitor web shell as non-native', () => {
    setCapacitor({ isNativePlatform: () => false, getPlatform: () => 'web' });
    expect(isCapacitorPlatform()).toBe(false);
  });
});
