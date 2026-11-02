import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { buildCbinHeader } from '../clavia/cbin';
import { compareBackups } from './compare-backups';

const file = (slot: number, body: number[]) =>
  new Uint8Array([...buildCbinHeader({ formatType: 1, tag: 'nsmp', bank: 0, location: slot, category: 0, versionRaw: 400 }), ...body]);
const zip = (files: Record<string, Uint8Array>) => new Blob([zipSync(files, { level: 0 }) as unknown as BlobPart]);

describe('compareBackups', () => {
  it('sorts entries into same, moved, changed and one-sided', async () => {
    const a = zip({ 'meta.xml': new Uint8Array([1]), 'S/A.nsmp4': file(1, [1, 2]), 'S/B.nsmp4': file(2, [3]), 'S/C.nsmp4': file(3, [4]), 'S/D.nsmp4': file(4, [5]) });
    const b = zip({ 'meta.xml': new Uint8Array([2]), 'S/A.nsmp4': file(1, [1, 2]), 'S/B.nsmp4': file(9, [3]), 'S/C.nsmp4': file(3, [7]), 'S/E.nsmp4': file(5, [6]) });
    expect(await compareBackups(a, b)).toEqual({
      same: 1, moved: ['S/B.nsmp4'], changed: ['S/C.nsmp4'], onlyInFirst: ['S/D.nsmp4'], onlyInSecond: ['S/E.nsmp4'],
    });
  });

  it('reads an entry whose CRC matches as the same without comparing more', async () => {
    const a = zip({ 'P/x.ns4p': file(1, [9, 9, 9]) });
    expect(await compareBackups(a, a)).toEqual({ same: 1, moved: [], changed: [], onlyInFirst: [], onlyInSecond: [] });
  });

  it('calls a non-CBIN entry with other bytes changed, never moved', async () => {
    const a = zip({ 'notes.txt': new Uint8Array([1, 2]) });
    const b = zip({ 'notes.txt': new Uint8Array([1, 3]) });
    expect((await compareBackups(a, b)).changed).toEqual(['notes.txt']);
  });
});
