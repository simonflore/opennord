import { describe, it, expect } from 'vitest';
import { sanitizeBankPrefix } from './extract-banks.mjs';

describe('sanitizeBankPrefix', () => {
  it('collapses non-alphanumerics to single underscores', () => {
    expect(sanitizeBankPrefix('NL4 Factory sound banks /')).toBe('NL4_Factory_sound_banks');
  });

  it('strips leading and trailing underscores', () => {
    expect(sanitizeBankPrefix('  Bank A  ')).toBe('Bank_A');
    expect(sanitizeBankPrefix('///x///')).toBe('x');
  });

  it('truncates to 24 characters', () => {
    expect(sanitizeBankPrefix('a'.repeat(40))).toHaveLength(24);
  });
});
