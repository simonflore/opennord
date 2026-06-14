import { describe, it, expect } from 'vitest';
import { formatSlot } from './slot';

describe('formatSlot', () => {
  it('maps {bank, location} to the Nord X:YY display', () => {
    expect(formatSlot(7, 56)).toBe('H:81');
    expect(formatSlot(6, 0)).toBe('G:11');
    expect(formatSlot(2, 63)).toBe('C:88');
    expect(formatSlot(0, 0)).toBe('A:11');
  });
});
