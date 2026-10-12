// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { freeFilename, pickCopyFolder, NO_CONFIRMED_SAVE_MESSAGE, NO_FOLDER_CHOSEN_MESSAGE } from './keep-copies';

/** A directory handle that keeps files in memory; `lose` drops that many bytes on write. */
function fakeDir(existing: string[] = [], lose = 0) {
  const files = new Map<string, Uint8Array>(existing.map((n) => [n, new Uint8Array()]));
  const dir = {
    async *entries() { for (const name of files.keys()) yield [name, {}] as [string, unknown]; },
    async getFileHandle(name: string) {
      return {
        async createWritable() {
          return {
            async write(b: Uint8Array) { files.set(name, b.subarray(0, b.length - lose)); },
            async close() {},
          };
        },
        async getFile() { return { size: files.get(name)!.length }; },
      };
    },
  };
  return { dir, files };
}
const setPicker = (pick: unknown) => { (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = pick; };

afterEach(() => { setPicker(undefined); });

describe('freeFilename', () => {
  it('keeps a free name, and numbers one that is taken', () => {
    expect(freeFilename('Pad.nsmp4', new Set())).toBe('Pad.nsmp4');
    expect(freeFilename('Pad.nsmp4', new Set(['pad.nsmp4', 'pad (2).nsmp4']))).toBe('Pad (3).nsmp4');
  });
  it('replaces characters a file name cannot hold', () => {
    expect(freeFilename('A/B: C?.npno', new Set())).toBe('A_B_ C_.npno');
  });
});

describe('pickCopyFolder', () => {
  it('refuses where the browser cannot write a folder (nothing is then removed)', async () => {
    await expect(pickCopyFolder()).rejects.toThrow(NO_CONFIRMED_SAVE_MESSAGE);
  });

  it('refuses when no folder is chosen', async () => {
    setPicker(vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError')));
    await expect(pickCopyFolder()).rejects.toThrow(NO_FOLDER_CHOSEN_MESSAGE);
  });

  it('saves each copy without overwriting a file already there', async () => {
    const { dir, files } = fakeDir(['Pad.nsmp4']);
    setPicker(vi.fn().mockResolvedValue(dir));
    const save = await pickCopyFolder();
    await save(new Uint8Array(8), 'Pad.nsmp4');
    expect(files.get('Pad.nsmp4')!.length).toBe(0); // the user's own file, untouched
    expect(files.get('Pad (2).nsmp4')!.length).toBe(8);
  });

  it('does not overwrite a file whose name differs only in case (macOS and Windows folders)', async () => {
    const { dir, files } = fakeDir(['pad.NSMP4']);
    setPicker(vi.fn().mockResolvedValue(dir));
    const save = await pickCopyFolder();
    await save(new Uint8Array(8), 'Pad.nsmp4');
    await save(new Uint8Array(9), 'PAD.nsmp4');
    expect(files.get('pad.NSMP4')!.length).toBe(0);
    expect(files.get('Pad (2).nsmp4')!.length).toBe(8);
    expect(files.get('PAD (3).nsmp4')!.length).toBe(9);
  });

  it('rejects a copy that did not land in full', async () => {
    const { dir } = fakeDir([], 3);
    setPicker(vi.fn().mockResolvedValue(dir));
    const save = await pickCopyFolder();
    await expect(save(new Uint8Array(8), 'Pad.nsmp4')).rejects.toThrow(/not saved in full/);
  });
});
