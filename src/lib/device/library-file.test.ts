import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { writeNsmp } from '../ns4/nsmp-write';
import { buildCbinHeader, cbinFraming, readCbinHeader } from '../clavia/cbin';
import { LIBRARY_PARTITION, LIBRARY_PARTITION_NAME, NSMP4_ONLY, libraryFileRefusal } from './library-file';

const tone = Array.from({ length: 2000 }, (_, i) => Math.round(6000 * Math.sin(i / 8)));
const nsmp4 = writeNsmp({ name: 'Test Pad', channels: [tone], codec: 4 });
const nsmp3 = writeNsmp({ name: 'Test Pad', channels: [tone], codec: 3 });
const program = new Uint8Array(readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))));
const piano = (() => {
  const h = buildCbinHeader({ formatType: 1, tag: 'npno', bank: 0xffff, location: 0xffff, category: 0xffffffff, versionRaw: 630 });
  const f = new Uint8Array(h.length + 64);
  f.set(h);
  return f;
})();

describe('where samples and pianos live', () => {
  it('names the Stage 4 partitions as NSM backups do', () => {
    expect(LIBRARY_PARTITION).toEqual({ sample: 5, piano: 1 });
    expect(LIBRARY_PARTITION_NAME).toEqual({ sample: 'Samp Lib', piano: 'Piano' });
  });
});

describe('a generated .nsmp4 is what FileCreate needs', () => {
  it('has an NSM-era header, no trailer, tag nsmp, version 4.00, no place, and its category word', () => {
    const h = readCbinHeader(nsmp4);
    expect(h).toMatchObject({ formatType: 1, tag: 'nsmp', bank: 0xffff, location: 0xffff, versionRaw: 400, category: 0x000f0000 });
    expect(cbinFraming(nsmp4)).toMatchObject({ recordOffset: 0x2c, trailerBytes: 0, recordBytes: nsmp4.length - 44 });
  });
});

describe('libraryFileRefusal', () => {
  it('accepts a .nsmp4 sample and a .npno piano', () => {
    expect(libraryFileRefusal('sample', nsmp4)).toBeUndefined();
    expect(libraryFileRefusal('piano', piano)).toBeUndefined();
  });

  it('sends only .nsmp4 samples', () => {
    expect(libraryFileRefusal('sample', nsmp3)).toBe(NSMP4_ONLY);
  });

  it('takes the whole 4.xx range and nothing outside it', () => {
    const withVersion = (v: number) => {
      const b = nsmp4.slice();
      new DataView(b.buffer).setUint32(0x14, v, true);
      return b;
    };
    expect(libraryFileRefusal('sample', withVersion(499))).toBeUndefined();
    expect(libraryFileRefusal('sample', withVersion(399))).toBe(NSMP4_ONLY);
    expect(libraryFileRefusal('sample', withVersion(500))).toBe(NSMP4_ONLY);
  });

  it('refuses the wrong kind of file', () => {
    expect(libraryFileRefusal('sample', program)).toBe('This isn’t a sample, so it wasn’t sent.');
    expect(libraryFileRefusal('piano', nsmp4)).toBe('This isn’t a piano, so it wasn’t sent.');
    expect(libraryFileRefusal('sample', new Uint8Array([1, 2, 3]))).toBe('This is not a Nord file, so it was not sent.');
  });

  it('refuses a file with nothing behind its header', () => {
    expect(libraryFileRefusal('sample', nsmp4.slice(0, 44))).toBe('This file is empty, so it wasn’t sent.');
  });
});
