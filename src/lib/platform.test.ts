// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getCapacitorPlatform, isCapacitorPlatform, isIpadAppOnMac, isWebPlatform } from './platform';

/** jsdom's navigator has no maxTouchPoints; define it as an own property per test. */
function setTouchPoints(n: number) {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: n, configurable: true });
}
function setCapacitor(value: unknown) {
  (window as unknown as { Capacitor?: unknown }).Capacitor = value;
}

afterEach(() => {
  delete (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints;
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

  it('tells the iPad app in a Mac window (no touch) from one on an iPad', () => {
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    setTouchPoints(0);
    expect(isIpadAppOnMac()).toBe(true);
    setTouchPoints(5);
    expect(isIpadAppOnMac()).toBe(false);
  });

  it('never calls a plain browser the iPad app on a Mac', () => {
    setTouchPoints(0);
    expect(isIpadAppOnMac()).toBe(false);
  });
});
