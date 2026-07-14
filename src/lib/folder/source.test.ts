// Runs under the default node env: Node's File implements .stream() (jsdom's does not).
import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { locateNordFiles, type Located, type FolderSource } from './source';

async function collect(source: FolderSource): Promise<Located[]> {
  const out: Located[] = [];
  for await (const loc of locateNordFiles(source)) out.push(loc);
  return out;
}

// --- FSA fakes ---
function fileHandle(name: string, bytes: Uint8Array) {
  return {
    kind: 'file' as const,
    name,
    async getFile() { return new File([bytes.buffer as ArrayBuffer], name); },
  };
}
function dirHandle(name: string, children: unknown[]) {
  return { kind: 'directory' as const, name, async *values() { for (const c of children) yield c; } };
}

describe('locateNordFiles (FSA handle)', () => {
  it('yields loose Nord files with folder-relative paths, skipping non-Nord', async () => {
    const root = dirHandle('root', [
      fileHandle('a.ns4p', new Uint8Array([1])),
      fileHandle('photo.jpg', new Uint8Array([9])),
      dirHandle('Bank 1', [fileHandle('b.ns4p', new Uint8Array([2, 3]))]),
    ]);
    const locs = await collect(root as unknown as FileSystemDirectoryHandle);
    const files = locs.filter((l): l is Extract<Located, { kind: 'file' }> => l.kind === 'file');
    expect(files.map((f) => f.path).sort()).toEqual(['Bank 1/b.ns4p', 'a.ns4p']);
    const a = files.find((f) => f.path === 'a.ns4p')!;
    expect(a.size).toBe(1);
    expect(Array.from(await a.bytes())).toEqual([1]);
  });

  it('yields a .ns4b as a bundle (not expanded), exposing a stream', async () => {
    const zip = zipSync({ 'Bank 1/Lead.ns4p': new Uint8Array([1, 2, 3]) });
    const root = dirHandle('root', [fileHandle('Backup.ns4b', zip)]);
    const locs = await collect(root as unknown as FileSystemDirectoryHandle);
    expect(locs).toHaveLength(1);
    expect(locs[0].kind).toBe('bundle');
    expect(locs[0].path).toBe('Backup.ns4b');
    expect(locs[0].size).toBe(zip.length);
    const bundle = locs[0] as Extract<Located, { kind: 'bundle' }>;
    const reader = bundle.stream().getReader();
    const chunks: number[] = [];
    for (;;) { const { value, done } = await reader.read(); if (done) break; chunks.push(...value); }
    expect(chunks).toEqual(Array.from(zip));
  });
});

describe('locateNordFiles (File[])', () => {
  function f(relPath: string, bytes: Uint8Array): File {
    const file = new File([bytes.buffer as ArrayBuffer], relPath.split('/').pop() ?? relPath);
    Object.defineProperty(file, 'webkitRelativePath', { value: relPath });
    return file;
  }
  it('strips the top folder segment and classifies files vs bundles', async () => {
    const zip = zipSync({ 'X.ns4p': new Uint8Array([7]) });
    const locs = await collect([
      f('MyPatches/a.ns4p', new Uint8Array([1])),
      f('MyPatches/skip.txt', new Uint8Array([9])),
      f('MyPatches/Backup.ns4b', zip),
    ]);
    expect(locs.map((l) => `${l.kind}:${l.path}`).sort()).toEqual(['bundle:Backup.ns4b', 'file:a.ns4p']);
  });
});
