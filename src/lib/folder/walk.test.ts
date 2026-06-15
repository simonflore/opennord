import { describe, it, expect } from 'vitest';
import { walkDirectory } from './walk';
import { MAX_READ_BYTES } from './scan';

// Minimal fakes shaped like the File System Access API.
function fileHandle(
  name: string,
  bytes: Uint8Array,
  opts: { size?: number; throwOnRead?: boolean } = {},
) {
  return {
    kind: 'file' as const,
    name,
    async getFile() {
      return {
        size: opts.size ?? bytes.length,
        async arrayBuffer() {
          if (opts.throwOnRead) throw new Error('read failed');
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
      };
    },
  };
}
function dirHandle(name: string, children: unknown[]) {
  return {
    kind: 'directory' as const,
    name,
    async *values() { for (const c of children) yield c; },
  };
}

describe('walkDirectory', () => {
  it('recurses and returns folder-relative paths for Nord files', async () => {
    const root = dirHandle('root', [
      fileHandle('a.ns4p', new Uint8Array([1])),
      dirHandle('Bank 1', [fileHandle('b.ns4p', new Uint8Array([2, 3]))]),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    const byPath = Object.fromEntries(files.map((f) => [f.path, Array.from(f.bytes)]));
    expect(Object.keys(byPath).sort()).toEqual(['Bank 1/b.ns4p', 'a.ns4p']);
    expect(byPath['a.ns4p']).toEqual([1]);
    expect(byPath['Bank 1/b.ns4p']).toEqual([2, 3]);
    expect(errors).toHaveLength(0);
  });

  it('skips non-Nord files without reading them', async () => {
    let read = false;
    const jpg = {
      kind: 'file' as const,
      name: 'photo.jpg',
      async getFile() { return { size: 10, async arrayBuffer() { read = true; return new ArrayBuffer(0); } }; },
    };
    const root = dirHandle('root', [jpg, fileHandle('a.ns4p', new Uint8Array([1]))]);
    const { files } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    expect(files.map((f) => f.path)).toEqual(['a.ns4p']);
    expect(read).toBe(false);
  });

  it('skips an oversized file and records an error, still returning the rest', async () => {
    const root = dirHandle('root', [
      fileHandle('Backup.ns4b', new Uint8Array([0]), { size: MAX_READ_BYTES + 1 }),
      fileHandle('ok.ns4p', new Uint8Array([1])),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    expect(files.map((f) => f.path)).toEqual(['ok.ns4p']);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('Backup.ns4b');
    expect(errors[0].reason).toMatch(/too large/i);
  });

  it('tolerates a file that fails to read — records an error and continues', async () => {
    const root = dirHandle('root', [
      fileHandle('bad.nsmp', new Uint8Array([9]), { throwOnRead: true }),
      fileHandle('ok.ns4p', new Uint8Array([1])),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    expect(files.map((f) => f.path)).toEqual(['ok.ns4p']);
    expect(errors.map((e) => e.path)).toEqual(['bad.nsmp']);
  });
});
