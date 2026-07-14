import { describe, it, expect } from 'vitest';
import { FACTORY_LIBS, FACTORY_LIBS_SOURCE } from './factory-libs.generated';
import { resolveFactory, resolveFactoryByFilename, factoryUrl } from './factory';

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

describe('factoryUrl (template)', () => {
  it('builds the official from_file_name endpoint', () => {
    expect(factoryUrl('White_Grand_XL_6.3.npno')).toBe(
      'https://www.nordkeyboards.com/wt/api/main/v1/file/from_file_name/White_Grand_XL_6.3.npno/',
    );
  });

  // The mirror-drop proof: the stored `url` column is fully derivable from the
  // filename. If a catalog regen ever changes the URL shape, this fails loudly.
  it('reproduces every catalog url exactly from its filename', () => {
    for (const e of FACTORY_LIBS) {
      expect(factoryUrl(e.filename)).toBe(e.url);
    }
  });
});

describe('resolveFactory (by display name)', () => {
  it('resolves a known factory piano by display name', () => {
    const m = resolveFactory('White Grand XL 6.3', 'npno');
    expect(m).not.toBeNull();
    expect(m!.filename).toBe('White_Grand_XL_6.3.npno');
    expect(m!.url).toContain('White_Grand_XL_6.3.npno');
    expect(m!.type).toBe('piano');
  });

  it('templates the url rather than passing through stored data', () => {
    const m = resolveFactory('White Grand XL 6.3');
    expect(m!.url).toBe(factoryUrl(m!.filename));
  });

  it('normalizes spaces, case, and a trailing extension', () => {
    expect(resolveFactory('white grand xl 6.3.npno')).not.toBeNull();
  });

  it('keeps a version-like suffix (no extension) in the key', () => {
    // Guards the normalize fix: ".3" must NOT be stripped as an extension.
    const m = resolveFactory('White Grand XL 6.3');
    expect(m).not.toBeNull();
    expect(m!.url).toContain('White_Grand_XL_6.3.npno');
  });

  it('returns null for an unknown / user-created name', () => {
    expect(resolveFactory('My Custom Loop 1.0', 'nsmp4')).toBeNull();
  });

  it('respects the ext filter (a piano name does not resolve as nsmp4)', () => {
    expect(resolveFactory('White Grand XL 6.3', 'nsmp4')).toBeNull();
  });
});

describe('resolveFactoryByFilename (exact, the manifest path)', () => {
  it('resolves by the exact catalog filename', () => {
    const m = resolveFactoryByFilename('White_Grand_XL_6.3.npno');
    expect(m).not.toBeNull();
    expect(m!.filename).toBe('White_Grand_XL_6.3.npno');
    expect(m!.url).toBe(factoryUrl('White_Grand_XL_6.3.npno'));
    expect(m!.type).toBe('piano');
  });

  it('respects the ext filter', () => {
    expect(resolveFactoryByFilename('White_Grand_XL_6.3.npno', 'nsmp4')).toBeNull();
  });

  it('returns null for a filename the offline snapshot does not list', () => {
    // Conservative: a delisted/newer version is confirmed factory only by the
    // backend HEAD check (#35), never mislabeled here.
    expect(resolveFactoryByFilename('Totally_Made_Up_9.9.npno')).toBeNull();
  });
});
