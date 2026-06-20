import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { identifyFixture, crossCheckFixture } from './fixture-report';

const ns4p = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/BreakFreeSolo.ns4p', import.meta.url))),
);

describe('identifyFixture', () => {
  it('identifies a real .ns4p program', () => {
    const f = identifyFixture('BreakFreeSolo.ns4p', ns4p);
    expect(f.kind).toBe('program');
    expect(f.tag).toBe('ns4p');
    expect(f.headerOk).toBe(true);
  });
  it('reports a malformed file without throwing', () => {
    const f = identifyFixture('junk.ns4p', new Uint8Array([1, 2, 3]));
    expect(f.headerOk).toBe(false);
    expect(typeof f.error).toBe('string');
  });
});

describe('crossCheckFixture', () => {
  it('passes when the program tag matches the model', () => {
    const f = identifyFixture('BreakFreeSolo.ns4p', ns4p);
    expect(crossCheckFixture(f, 'stage-4').ok).toBe(true);
  });
  it('flags a tag/model mismatch', () => {
    const f = identifyFixture('BreakFreeSolo.ns4p', ns4p);
    const cc = crossCheckFixture(f, 'electro-6');
    expect(cc.ok).toBe(false);
    expect(cc.issues.join(' ')).toContain('ne6p');
  });
});
