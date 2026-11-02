import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { buildCbinHeader } from '../clavia/cbin';
import { readZipDirectory } from '../clavia/backup/zip-directory';
import type { ProgramEntry } from './transfer';
import { planLibraryRestore, readBackupLibraryFile, type BackupLibraryFile } from './library-restore';

const onNord = (name: string, sizeBytes: number, slot = 0): ProgramEntry =>
  ({ bank: 0, slot, name, sizeBytes, categoryId: 0, version: 400, fourcc: 'nsmp' });
const inBackup = (name: string, recordBytes: number): BackupLibraryFile =>
  ({ path: `Samp Lib/Bank 1/${name}.nsmp4`, name, recordBytes, bank: 0, slot: 3 });

describe('planLibraryRestore', () => {
  it('leaves same-name, same-size files alone', () => {
    const plan = planLibraryRestore([onNord('Pad', 100)], [inBackup('Pad', 100)]);
    expect(plan).toMatchObject({ remove: [], write: [], duplicates: [], aborted: false });
    expect(plan.unchanged.map((f) => f.name)).toEqual(['Pad']);
  });

  it('replaces a same-name file of another size, removing it first', () => {
    const plan = planLibraryRestore([onNord('Pad', 90)], [inBackup('Pad', 100)]);
    expect(plan.remove.map((d) => d.name)).toEqual(['Pad']);
    expect(plan.write.map((f) => f.name)).toEqual(['Pad']);
  });

  it('removes what the backup doesn’t have and writes what the Nord lacks', () => {
    const plan = planLibraryRestore([onNord('Old', 10, 0), onNord('Keep', 20, 1)], [inBackup('Keep', 20), inBackup('New', 30)]);
    expect(plan.remove.map((d) => d.name)).toEqual(['Old']);
    expect(plan.write.map((f) => f.name)).toEqual(['New']);
    expect(plan.unchanged.map((f) => f.name)).toEqual(['Keep']);
  });

  it('keeps the first of two backup files with one name', () => {
    const second = { ...inBackup('Pad', 50), path: 'Samp Lib/Bank 2/Pad.nsmp4' };
    const plan = planLibraryRestore([], [inBackup('Pad', 40), second]);
    expect(plan.write.map((f) => f.path)).toEqual(['Samp Lib/Bank 1/Pad.nsmp4']);
    expect(plan.duplicates.map((f) => f.path)).toEqual(['Samp Lib/Bank 2/Pad.nsmp4']);
  });

  it('says which places the removals free, for the write-place search', () => {
    const plan = planLibraryRestore(
      [{ ...onNord('Old', 10, 4), bank: 1 }, onNord('Pad', 90, 2), onNord('Keep', 20, 1)],
      [inBackup('Pad', 100), inBackup('Keep', 20)],
    );
    expect(plan.freed).toEqual([{ bank: 0, slot: 2 }, { bank: 1, slot: 4 }]);
  });

  it('aborts the partition, removing nothing, when a backup file is refused', () => {
    const bad = { ...inBackup('Bad', 5), refusal: 'Not a sample the Stage 4 takes.' };
    const plan = planLibraryRestore([onNord('Old', 10)], [inBackup('Good', 7), bad]);
    expect(plan).toMatchObject({ aborted: true, remove: [], write: [], unchanged: [], freed: [] });
    expect(plan.refused.map((f) => f.name)).toEqual(['Bad']);
  });

  it('ignores a refused file that is only a later duplicate', () => {
    const dup = { ...inBackup('Pad', 5), path: 'Samp Lib/Bank 2/Pad.nsmp4', refusal: 'no' };
    const plan = planLibraryRestore([], [inBackup('Pad', 7), dup]);
    expect(plan.aborted).toBe(false);
    expect(plan.write.map((f) => f.name)).toEqual(['Pad']);
  });
});

describe('readBackupLibraryFile', () => {
  it('reads the place and record size from the header only', async () => {
    const nsm = buildCbinHeader({ formatType: 1, tag: 'nsmp', bank: 2, location: 7, category: 0, versionRaw: 400 });
    const legacy = buildCbinHeader({ formatType: 0, tag: 'npno', bank: 0, location: 1, category: 0, versionRaw: 530 }).slice(0, 0x18);
    const blob = new Blob([zipSync({
      'Samp Lib/Bank 3/Pad.nsmp4': new Uint8Array([...nsm, ...new Uint8Array(100)]),
      'Piano/Bank 1/EP 5.3.npno': new Uint8Array([...legacy, ...new Uint8Array(200), 0, 0]),
    }, { level: 0 }) as unknown as BlobPart]);
    const entries = await readZipDirectory(blob);
    const pad = await readBackupLibraryFile(blob, entries[0].path, entries[0]);
    expect(pad).toEqual({ path: 'Samp Lib/Bank 3/Pad.nsmp4', name: 'Pad', recordBytes: 100, bank: 2, slot: 7 });
    const ep = await readBackupLibraryFile(blob, entries[1].path, entries[1]);
    expect(ep).toMatchObject({ name: 'EP 5.3', recordBytes: 200, bank: 0, slot: 1 });
  });
});
