import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { walkDirectory } from './walk';
import { MAX_READ_BYTES } from './scan';

/** A ReadableStream that emits `bytes` in small chunks (exercises the streaming path). */
function streamOf(bytes: Uint8Array, chunkSize = 16): ReadableStream<Uint8Array> {
  let pos = 0;
  return new ReadableStream({
    pull(controller) {
      if (pos >= bytes.length) return controller.close();
      controller.enqueue(bytes.slice(pos, pos + chunkSize));
      pos += chunkSize;
    },
  });
}

// Minimal fakes shaped like the File System Access API. A bundle file is read
// via `stream()`; everything else via `arrayBuffer()`.
function fileHandle(
  name: string,
  bytes: Uint8Array,
  opts: { size?: number; throwOnRead?: boolean; errorStream?: boolean } = {},
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
        stream() {
          if (opts.errorStream) {
            return new ReadableStream({ pull(c) { c.error(new Error('stream failed')); } });
          }
          return streamOf(bytes);
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

  it('skips an oversized non-bundle file and records an error, still returning the rest', async () => {
    const root = dirHandle('root', [
      fileHandle('Huge.ns4p', new Uint8Array([0]), { size: MAX_READ_BYTES + 1 }),
      fileHandle('ok.ns4p', new Uint8Array([1])),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    expect(files.map((f) => f.path)).toEqual(['ok.ns4p']);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('Huge.ns4p');
    expect(errors[0].reason).toMatch(/too large/i);
  });

  it('streams a .ns4b bundle into its inner programs, keyed <bundle>!<inner>', async () => {
    const zip = zipSync({
      'meta.xml': new Uint8Array([0]),                    // skipped (not a program)
      'Bank 1/Lead.ns4p': new Uint8Array([1, 2, 3]),      // kept
      'Bank 2/Pad.ns4l': new Uint8Array([4, 5]),          // kept
      'Samples/Hit.nsmp4': new Uint8Array([9]),           // skipped (not a program)
      '__MACOSX/._Lead.ns4p': new Uint8Array([0]),        // skipped (resource fork)
    });
    const root = dirHandle('root', [
      fileHandle('Backup.ns4b', zip, { size: MAX_READ_BYTES + 1 }), // size cap must NOT apply
      fileHandle('loose.ns4p', new Uint8Array([7])),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
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

  it('tolerates a bundle that fails to read — records an error and continues', async () => {
    const root = dirHandle('root', [
      fileHandle('Broken.ns4b', new Uint8Array([0]), { errorStream: true }),
      fileHandle('ok.ns4p', new Uint8Array([1])),
    ]);
    const { files, errors } = await walkDirectory(root as unknown as FileSystemDirectoryHandle);
    expect(files.map((f) => f.path)).toEqual(['ok.ns4p']);
    expect(errors.map((e) => e.path)).toEqual(['Broken.ns4b']);
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
