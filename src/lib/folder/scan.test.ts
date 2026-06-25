import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { scanFiles, type RawFile } from './scan';
import { buildCbinHeader } from '../clavia/cbin';

const cbinFileWithTag = (tag: string) =>
  buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 100 });

const ns4p = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/BreakFreeSolo.ns4p', import.meta.url))),
);

describe('scanFiles', () => {
  it('routes a program file to programs with a path-derived id', () => {
    const files: RawFile[] = [{ path: 'Bank 1/BreakFree Solo.ns4p', bytes: ns4p }];
    const r = scanFiles(files);
    expect(r.programs).toHaveLength(1);
    expect(r.samples).toHaveLength(0);
    expect(r.programs[0].id).toBe('folder:Bank 1/BreakFree Solo.ns4p');
    expect(r.programs[0].name).toBe('BreakFree Solo');
    expect(r.programs[0].program.parsed).toBe(true);
  });

  it('expands a .ns4b bundle into its contained programs', () => {
    const zip = zipSync({ 'Lead.ns4p': ns4p, 'Pad.ns4p': ns4p });
    const files: RawFile[] = [{ path: 'backup.ns4b', bytes: zip }];
    const r = scanFiles(files);
    expect(r.programs).toHaveLength(2);
    expect(r.programs.map((p) => p.id).sort()).toEqual([
      'folder:backup.ns4b!Lead.ns4p',
      'folder:backup.ns4b!Pad.ns4p',
    ]);
  });

  it('routes samples and ignores unrelated files', () => {
    const files: RawFile[] = [
      { path: 'kick.nsmp3', bytes: new Uint8Array([1, 2, 3]) },
      { path: 'readme.txt', bytes: new Uint8Array([0]) },
    ];
    const r = scanFiles(files);
    expect(r.samples).toHaveLength(1);
    expect(r.samples[0].id).toBe('folder:kick.nsmp3');
    expect(r.programs).toHaveLength(0);
  });

  it('routes preset files to result.presets with tag+kind, not to programs', () => {
    const bytes = cbinFileWithTag('ns4o'); // 44-byte CBIN header, tag ns4o (test helper)
    const r = scanFiles([{ path: 'Bank A/My Organ.ns4o', bytes }]);
    expect(r.programs).toHaveLength(0);
    expect(r.presets).toHaveLength(1);
    expect(r.presets[0]).toMatchObject({ kind: 'organ-preset', tag: 'ns4o', path: 'Bank A/My Organ.ns4o' });
    expect(r.presets[0].name).toBeTruthy();
  });

  it('collects per-file errors without aborting the scan', () => {
    const badZip = new Uint8Array([0, 1, 2, 3]);
    const files: RawFile[] = [
      { path: 'good.ns4p', bytes: ns4p },
      { path: 'broken.ns4b', bytes: badZip },
    ];
    const r = scanFiles(files);
    expect(r.programs).toHaveLength(1);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].path).toBe('broken.ns4b');
  });
});
