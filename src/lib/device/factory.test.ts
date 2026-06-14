import { describe, it, expect } from 'vitest';
import { FACTORY_LIBS, FACTORY_LIBS_SOURCE } from './factory-libs.generated';
import { resolveFactory } from './factory';

describe('factory-libs snapshot', () => {
  it('is non-empty and well-formed', () => {
    expect(FACTORY_LIBS.length).toBeGreaterThan(50);
    for (const e of FACTORY_LIBS.slice(0, 10)) {
      expect(typeof e.filename).toBe('string');
      expect(e.filename.length).toBeGreaterThan(0);
      expect(e.url.startsWith('http')).toBe(true);
      expect(['piano', 'sample']).toContain(e.type);
    }
  });

  it('records its source for traceability', () => {
    expect(FACTORY_LIBS_SOURCE.url).toContain('clavia_sound_libraries.xml');
  });

  it('includes a known stable entry (White Grand XL 6.3)', () => {
    expect(FACTORY_LIBS.some((e) => e.filename === 'White_Grand_XL_6.3.npno')).toBe(true);
  });
});

describe('resolveFactory', () => {
  it('resolves a known factory piano by display name', () => {
    const m = resolveFactory('White Grand XL 6.3', 'npno');
    expect(m).not.toBeNull();
    expect(m!.url).toContain('White_Grand_XL_6.3.npno');
    expect(m!.type).toBe('piano');
  });

  it('normalizes spaces, case, and a trailing extension', () => {
    expect(resolveFactory('white grand xl 6.3.npno')).not.toBeNull();
  });

  it('returns null for an unknown / user-created name', () => {
    expect(resolveFactory('My Custom Loop 1.0', 'nsmp4')).toBeNull();
  });

  it('respects the ext filter (a piano name does not resolve as nsmp4)', () => {
    expect(resolveFactory('White Grand XL 6.3', 'nsmp4')).toBeNull();
  });
});
