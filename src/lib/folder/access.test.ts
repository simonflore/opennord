// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { supportsPersistentFolders, fileFromHandle } from './access';

describe('access layer', () => {
  it('reports persistent-folder support based on showDirectoryPicker presence', () => {
    // jsdom has no showDirectoryPicker by default → fallback (webkitdirectory) path.
    expect(supportsPersistentFolders()).toBe(false);
  });
});

// Minimal fake FSA dir tree. getDirectoryHandle/getFileHandle resolve by name.
function fakeDir(tree: Record<string, unknown>): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    async getDirectoryHandle(name: string) {
      const child = tree[name];
      if (!child || child instanceof Uint8Array) throw new DOMException('not found', 'NotFoundError');
      return fakeDir(child as Record<string, unknown>);
    },
    async getFileHandle(name: string) {
      const bytes = tree[name];
      if (!(bytes instanceof Uint8Array)) throw new DOMException('not found', 'NotFoundError');
      return { kind: 'file', async getFile() { return new File([new Uint8Array(bytes as Uint8Array)], name); } };
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe('fileFromHandle', () => {
  it('resolves a nested path to a File with the right bytes', async () => {
    const dir = fakeDir({ Backups: { 'TBM.ns4b': new Uint8Array([1, 2, 3]) } });
    const file = await fileFromHandle(dir, 'Backups/TBM.ns4b');
    expect(file.name).toBe('TBM.ns4b');
    expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([1, 2, 3]);
  });
});
