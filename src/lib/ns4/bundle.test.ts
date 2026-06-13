import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { readNs4Bundle, writeNs4Bundle } from './bundle';
import { verifyNs4Checksum } from './checksum';

function loadFixture(filename: string): Uint8Array {
  return new Uint8Array(
    readFileSync(fileURLToPath(new URL(`./__fixtures__/${filename}`, import.meta.url))),
  );
}

const solo = loadFixture('BreakFreeSolo.ns4p');
const chords = loadFixture('BreakFree_chords.ns4p');

describe('readNs4Bundle', () => {
  it('decodes every program entry in a zip, with names from paths', () => {
    const zip = zipSync({
      'Bank 1/BreakFree Solo.ns4p': solo,
      'Bank 1/BreakFree Chords.ns4p': chords,
    });
    const entries = readNs4Bundle(zip);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.name).sort()).toEqual(['BreakFree Chords', 'BreakFree Solo']);
    for (const e of entries) {
      expect(e.program.parsed).toBe(true);
      expect(e.program.kind).toBe('program');
      expect(e.program.layers).toHaveLength(7);
    }
  });

  it('ignores non-program entries, directories and macOS resource forks', () => {
    const zip = zipSync({
      'readme.txt': new Uint8Array([1, 2, 3]),
      'folder/': new Uint8Array(),
      '__MACOSX/._BreakFree Solo.ns4p': new Uint8Array([0]),
      'BreakFree Solo.ns4p': solo,
    });
    const entries = readNs4Bundle(zip);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('BreakFree Solo');
  });

  it('accepts the .ns4l (bundle-extracted) extension', () => {
    const zip = zipSync({ 'Lead.ns4l': solo });
    const entries = readNs4Bundle(zip);
    expect(entries).toHaveLength(1);
    expect(entries[0].program.parsed).toBe(true);
  });
});

describe('writeNs4Bundle', () => {
  it('round-trips programs through write → read with checksums intact', () => {
    const zip = writeNs4Bundle([
      { name: 'BreakFree Solo', bytes: solo },
      { name: 'BreakFree Chords', bytes: chords },
    ]);
    const entries = readNs4Bundle(zip);
    expect(entries).toHaveLength(2);
    for (const e of entries) {
      expect(verifyNs4Checksum(e.bytes)).toBe(true);
      expect(e.program.parsed).toBe(true);
    }
    const solost = entries.find((e) => e.name === 'BreakFree Solo')!;
    expect(solost.bytes).toEqual(solo);
  });

  it('disambiguates duplicate names instead of dropping entries', () => {
    const zip = writeNs4Bundle([
      { name: 'Same', bytes: solo },
      { name: 'Same', bytes: chords },
    ]);
    const entries = readNs4Bundle(zip);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.path).sort()).toEqual(['Same (2).ns4p', 'Same.ns4p']);
  });

  it('honors an explicit path', () => {
    const zip = writeNs4Bundle([{ name: 'X', bytes: solo, path: 'Bank 2/Custom.ns4p' }]);
    const entries = readNs4Bundle(zip);
    expect(entries[0].path).toBe('Bank 2/Custom.ns4p');
  });
});
