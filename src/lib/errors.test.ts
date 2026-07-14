import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('returns an Error instance message', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies non-Error throws', () => {
    expect(getErrorMessage('nope')).toBe('nope');
    expect(getErrorMessage(42)).toBe('42');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage(undefined)).toBe('undefined');
  });
});
