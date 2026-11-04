import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  LIBRARY_READ_ONLY_REASON, LIBRARY_WRITES_VERIFIED, NOT_YET_TRIED, UNTESTED_WRITES_KEY,
  libraryWritesOn, setUntestedWrites, untestedWritesAllowed,
} from './write-guard';

function store(initial?: string) {
  const m = new Map<string, string>(initial === undefined ? [] : [[UNTESTED_WRITES_KEY, initial]]);
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('the sample and piano hardware gate', () => {
  it('is open for samples (tried on a Stage 4) and closed for pianos', () => {
    expect(LIBRARY_WRITES_VERIFIED).toEqual({ sample: true, piano: false });
    expect(libraryWritesOn('sample', LIBRARY_WRITES_VERIFIED, [])).toBe(true);
    expect(libraryWritesOn('piano', LIBRARY_WRITES_VERIFIED, [])).toBe(false);
  });

  it('opens per kind once verified, independently', () => {
    expect(libraryWritesOn('sample', { sample: true, piano: false }, [])).toBe(true);
    expect(libraryWritesOn('piano', { sample: true, piano: false }, [])).toBe(false);
  });

  it('honours the untested-writes switch only in a development build', () => {
    expect(untestedWritesAllowed(true, store('["sample"]'))).toEqual(['sample']);
    expect(untestedWritesAllowed(false, store('["sample","piano"]'))).toEqual([]);
    expect(untestedWritesAllowed(true, store('not json'))).toEqual([]);
    expect(untestedWritesAllowed(true, store('["sample","drums"]'))).toEqual(['sample']);
    expect(untestedWritesAllowed(true, store('{"sample":true}'))).toEqual([]);
    expect(untestedWritesAllowed(true, null)).toEqual([]);
    expect(libraryWritesOn('piano', LIBRARY_WRITES_VERIFIED, ['piano'])).toBe(true);
  });

  it('never reads the stored switch in a production build', () => {
    const s = store('["sample","piano"]');
    const getItem = vi.spyOn(s, 'getItem');
    expect(untestedWritesAllowed(false, s)).toEqual([]);
    expect(getItem).not.toHaveBeenCalled();
  });

  it('stays closed through the default arguments of a production build, whatever is stored', () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('localStorage', store('["sample","piano"]'));
    expect(untestedWritesAllowed()).toEqual([]);
    // Samples are verified on a Stage 4: on in every build. Pianos are not, whatever is stored.
    expect(libraryWritesOn('sample')).toBe(true);
    expect(libraryWritesOn('piano')).toBe(false);
  });

  it('opens through the default arguments in a development build with the switch stored', () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('localStorage', store('["piano"]'));
    expect(libraryWritesOn('piano')).toBe(true);
    expect(libraryWritesOn('sample')).toBe(true);
    vi.stubGlobal('localStorage', store('[]'));
    expect(libraryWritesOn('piano')).toBe(false);
  });

  it('fails closed when localStorage is missing or throws', () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('localStorage', undefined);
    expect(untestedWritesAllowed()).toEqual([]);
    expect(() => setUntestedWrites(['sample'])).not.toThrow();
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    });
    expect(untestedWritesAllowed()).toEqual([]);
    expect(() => setUntestedWrites(['sample'])).not.toThrow();
    expect(libraryWritesOn('piano')).toBe(false);
  });

  it('fails closed when reading the storage global itself throws', () => {
    vi.stubEnv('DEV', true);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('denied'); } });
    try {
      expect(untestedWritesAllowed()).toEqual([]);
      expect(() => setUntestedWrites(['sample'])).not.toThrow();
    } finally {
      // vitest's unstubAllGlobals restores a stubbed value; remove the throwing getter ourselves
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('stores the switch', () => {
    const s = store();
    setUntestedWrites(['piano'], s);
    expect(s.m.get(UNTESTED_WRITES_KEY)).toBe('["piano"]');
    setUntestedWrites(['piano'], null);
  });

  it('says "not yet tried on a Nord" in plain words', () => {
    expect(NOT_YET_TRIED.sample).toMatch(/^Not yet tried on a Nord/);
    expect(NOT_YET_TRIED.piano).toBe('Pianos can’t be sent yet: not yet tried on a Nord. Save it to your folder or download it.');
    for (const text of [...Object.values(NOT_YET_TRIED), ...Object.values(LIBRARY_READ_ONLY_REASON)]) {
      expect(text).not.toMatch(/partition|byte|0x/i);
    }
  });
});
