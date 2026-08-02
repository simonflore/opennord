// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { supportsPersistentFolders, fileFromHandle, pickFolder } from './access';

describe('access layer', () => {
  it('reports persistent-folder support based on showDirectoryPicker presence', () => {
    // jsdom has no showDirectoryPicker by default → fallback (webkitdirectory) path.
    expect(supportsPersistentFolders()).toBe(false);
  });

  it('surfaces an empty webkitdirectory selection as a distinguishable error, not a silent cancel', async () => {
    // This is the exact shape Android hands back when the picked folder is
    // backed by Google Drive (or another cloud app): onchange fires (a real
    // selection was made) but with zero readable files. It must not be
    // mistaken for the user dismissing the picker.
    const promise = pickFolder();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    Object.defineProperty(input, 'files', { value: [], configurable: true });
    input.dispatchEvent(new Event('change'));
    await expect(promise).rejects.toThrow(/didn't return any files this browser could read/);
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

import { writeFileToDir, listDirNames } from './access';

it('writeFileToDir creates a file and streams bytes; listDirNames lists entries', async () => {
  const written: Record<string, Uint8Array> = {};
  const dir = {
    kind: 'directory',
    async *entries() { yield ['existing.ns4b', { kind: 'file' }]; },
    async getFileHandle(name: string, _o?: unknown) {
      return { async createWritable() {
        const chunks: Uint8Array[] = [];
        return { async write(c: Uint8Array) { chunks.push(c); }, async close() { written[name] = chunks[0]; } };
      } };
    },
  } as unknown as FileSystemDirectoryHandle;

  expect([...await listDirNames(dir)]).toEqual(['existing.ns4b']);
  await writeFileToDir(dir, 'out.nsmp', async (w) => { await w.write(new Uint8Array([9, 9])); });
  expect([...written['out.nsmp']]).toEqual([9, 9]);
});
