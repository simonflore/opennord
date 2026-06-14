import { describe, it, expect } from 'vitest';
import { filesToRawFiles } from './access';

function fakeFile(relPath: string, bytes: Uint8Array): File {
  const f = new File([bytes.buffer as ArrayBuffer], relPath.split('/').pop() ?? relPath);
  Object.defineProperty(f, 'webkitRelativePath', { value: relPath });
  return f;
}

describe('filesToRawFiles', () => {
  it('maps webkitRelativePath and strips the top folder name', async () => {
    const list = [
      fakeFile('MyPatches/a.ns4p', new Uint8Array([1])),
      fakeFile('MyPatches/Bank 1/b.ns4p', new Uint8Array([2])),
    ];
    const raw = await filesToRawFiles(list);
    expect(raw.map((r) => r.path).sort()).toEqual(['Bank 1/b.ns4p', 'a.ns4p']);
    expect(Array.from(raw[0].bytes)).toEqual([1]);
  });
});
