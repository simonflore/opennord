import { describe, it, expect } from 'vitest';
import { PRO_ROUTES } from './router-pro';

describe('PRO_ROUTES', () => {
  it('is empty in the open/local build (the slot the product build aliases)', () => {
    expect(Array.isArray(PRO_ROUTES)).toBe(true);
    expect(PRO_ROUTES).toHaveLength(0);
  });
});
