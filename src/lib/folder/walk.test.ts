import { describe, it, expect } from 'vitest';
import { walkDirectory } from './walk';

// Minimal fakes shaped like the File System Access API.
function fileHandle(name: string, bytes: Uint8Array) {
  return {
    kind: 'file' as const,
    name,
    async getFile() {
      return { async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); } };
    },
  };
}
function dirHandle(name: string, children: any[]) {
  return {
    kind: 'directory' as const,
    name,
    async *values() { for (const c of children) yield c; },
  };
}

describe('walkDirectory', () => {
  it('recurses and returns folder-relative paths', async () => {
    const root = dirHandle('root', [
      fileHandle('a.ns4p', new Uint8Array([1])),
      dirHandle('Bank 1', [fileHandle('b.ns4p', new Uint8Array([2, 3]))]),
    ]);
    const files = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    const byPath = Object.fromEntries(files.map((f) => [f.path, Array.from(f.bytes)]));
    expect(Object.keys(byPath).sort()).toEqual(['Bank 1/b.ns4p', 'a.ns4p']);
    expect(byPath['a.ns4p']).toEqual([1]);
    expect(byPath['Bank 1/b.ns4p']).toEqual([2, 3]);
  });
});
