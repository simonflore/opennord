import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { summarizeFile, guessModelByTag } from './identify-summary';

const ns4p = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/BreakFreeSolo.ns4p', import.meta.url))));

describe('identify-summary', () => {
  it('guessModelByTag maps a program tag to a model', () => {
    expect(guessModelByTag('ns4p')).toBe('stage-4');
    expect(guessModelByTag('zzzz')).toBeUndefined();
    expect(guessModelByTag(undefined)).toBeUndefined();
  });
  it('summarizeFile identifies + cross-checks a real ns4p', () => {
    const s = summarizeFile('BreakFreeSolo.ns4p', ns4p);
    expect(s.finding.tag).toBe('ns4p');
    expect(s.modelGuess).toBe('stage-4');
    expect(s.cross?.ok).toBe(true);
  });
  it('summarizeFile leaves cross undefined for an unrecognized file', () => {
    const s = summarizeFile('junk.bin', new Uint8Array([1, 2, 3]));
    expect(s.modelGuess).toBeUndefined();
    expect(s.cross).toBeUndefined();
  });
});
