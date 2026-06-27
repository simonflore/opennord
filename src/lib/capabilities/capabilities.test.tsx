// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { localCapabilities } from './defaults';
import { CapabilitiesProvider, useCapabilities } from './CapabilitiesContext';

describe('localCapabilities', () => {
  it('is logged out by default', () => {
    expect(localCapabilities.auth.getUser()).toBeNull();
  });
  it('marks cloud and community unavailable in the local build', () => {
    expect(localCapabilities.cloud.available).toBe(false);
    expect(localCapabilities.community.available).toBe(false);
  });
  it('ships a ranker', () => {
    expect(typeof localCapabilities.ranker.rank).toBe('function');
  });
});

describe('CapabilitiesProvider', () => {
  it('returns local defaults with no provider', () => {
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.cloud.available).toBe(false);
  });
  it('merges a partial override over the defaults', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CapabilitiesProvider value={{ cloud: { available: true } }}>{children}</CapabilitiesProvider>
    );
    const { result } = renderHook(() => useCapabilities(), { wrapper });
    expect(result.current.cloud.available).toBe(true);
    expect(result.current.community.available).toBe(false); // untouched default
  });
});
