import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { filesToRawFiles } from './access';
import { MAX_READ_BYTES } from './scan';

function fakeFile(relPath: string, bytes: Uint8Array, size?: number): File {
  const f = new File([bytes.buffer as ArrayBuffer], relPath.split('/').pop() ?? relPath);
  Object.defineProperty(f, 'webkitRelativePath', { value: relPath });
  if (size !== undefined) Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('filesToRawFiles', () => {
  it('maps webkitRelativePath and strips the top folder name', async () => {
    const list = [
      fakeFile('MyPatches/a.ns4p', new Uint8Array([1])),
      fakeFile('MyPatches/Bank 1/b.ns4p', new Uint8Array([2])),
    ];
    const { files } = await filesToRawFiles(list);
    expect(files.map((r) => r.path).sort()).toEqual(['Bank 1/b.ns4p', 'a.ns4p']);
    expect(Array.from(files[0].bytes)).toEqual([1]);
  });

  it('skips non-Nord files without reading them', async () => {
    const list = [
      fakeFile('MyPatches/photo.jpg', new Uint8Array([1])),
      fakeFile('MyPatches/a.ns4p', new Uint8Array([2])),
    ];
    const { files } = await filesToRawFiles(list);
    expect(files.map((r) => r.path)).toEqual(['a.ns4p']);
  });

  it('skips an oversized non-bundle file and records an error', async () => {
    const list = [
      fakeFile('MyPatches/Huge.ns4p', new Uint8Array([0]), MAX_READ_BYTES + 1),
      fakeFile('MyPatches/ok.ns4p', new Uint8Array([1])),
    ];
    const { files, errors } = await filesToRawFiles(list);
    expect(files.map((r) => r.path)).toEqual(['ok.ns4p']);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('Huge.ns4p');
    expect(errors[0].reason).toMatch(/too large/i);
  });

  it('streams a .ns4b bundle into its inner programs, keyed <bundle>!<inner>', async () => {
    const zip = zipSync({
      'meta.xml': new Uint8Array([0]),               // skipped (not a program)
      'Bank 1/Lead.ns4p': new Uint8Array([1, 2, 3]), // kept
      'Bank 2/Pad.ns4l': new Uint8Array([4, 5]),     // kept
      'Samples/Hit.nsmp4': new Uint8Array([9]),      // skipped (not a program)
    });
    const list = [
      fakeFile('MyPatches/Backup.ns4b', zip, MAX_READ_BYTES + 1), // size cap must NOT apply
      fakeFile('MyPatches/loose.ns4p', new Uint8Array([7])),
    ];
    const { files, errors } = await filesToRawFiles(list);
    const byPath = Object.fromEntries(files.map((f) => [f.path, Array.from(f.bytes)]));
    expect(Object.keys(byPath).sort()).toEqual([
      'Backup.ns4b!Bank 1/Lead.ns4p',
      'Backup.ns4b!Bank 2/Pad.ns4l',
      'loose.ns4p',
    ]);
    expect(byPath['Backup.ns4b!Bank 1/Lead.ns4p']).toEqual([1, 2, 3]);
    expect(byPath['Backup.ns4b!Bank 2/Pad.ns4l']).toEqual([4, 5]);
    expect(errors).toHaveLength(0);
  });
});
