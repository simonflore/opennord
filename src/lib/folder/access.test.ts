import { describe, it, expect } from 'vitest';
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

  it('skips an oversized file and records an error', async () => {
    const list = [
      fakeFile('MyPatches/Backup.ns4b', new Uint8Array([0]), MAX_READ_BYTES + 1),
      fakeFile('MyPatches/ok.ns4p', new Uint8Array([1])),
    ];
    const { files, errors } = await filesToRawFiles(list);
    expect(files.map((r) => r.path)).toEqual(['ok.ns4p']);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('Backup.ns4b');
    expect(errors[0].reason).toMatch(/too large/i);
  });
});
