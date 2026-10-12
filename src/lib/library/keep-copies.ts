import { listDirNames, supportsPersistentFolders, writeFileToDir } from '@/lib/folder/access';
import { safeFilename } from '@/lib/ns4/bundle';

/** Shown when a copy was asked for but this browser can't report that a file was saved. */
export const NO_CONFIRMED_SAVE_MESSAGE =
  'OpenNord can’t confirm on this device that a copy was saved, so nothing was removed. ' +
  'Untick “Save a copy to a folder first” to delete without keeping a copy.';

/** Shown when the folder picker was closed without a choice. */
export const NO_FOLDER_CHOSEN_MESSAGE = 'No folder was chosen for the copies, so nothing was removed.';

/** Saves one file; resolves only once it is on disk with every byte. */
export type CopyWriter = (bytes: Uint8Array, filename: string) => Promise<void>;

interface WritableDirPicker {
  showDirectoryPicker(o: { mode: 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}

/** Folders on macOS and Windows don't tell `Pad` from `pad`: names are compared lowercased. */
const nameKey = (name: string) => name.toLowerCase();

/** A name the file system takes, that no file in the folder has yet. `taken` holds {@link nameKey}s. */
export function freeFilename(filename: string, taken: Set<string>): string {
  const safe = safeFilename(filename);
  const dot = safe.lastIndexOf('.');
  const stem = dot === -1 ? safe : safe.slice(0, dot);
  const ext = dot === -1 ? '' : safe.slice(dot);
  let name = safe;
  for (let n = 2; taken.has(nameKey(name)); n++) name = `${stem} (${n})${ext}`;
  return name;
}

/**
 * Ask where to keep copies of sounds about to be removed from the Nord, and
 * return a writer into that folder. A browser download can't be used for this:
 * it never says whether the file was saved, and the sound is deleted next.
 * Must be called from the click itself (the picker needs it). Rejects, with a
 * message for the user, when no folder is chosen or the browser has no way to
 * write one.
 */
export async function pickCopyFolder(): Promise<CopyWriter> {
  if (!supportsPersistentFolders()) throw new Error(NO_CONFIRMED_SAVE_MESSAGE);
  let dir: FileSystemDirectoryHandle;
  try {
    dir = await (window as unknown as WritableDirPicker).showDirectoryPicker({ mode: 'readwrite' });
  } catch {
    throw new Error(NO_FOLDER_CHOSEN_MESSAGE);
  }
  const taken = new Set([...await listDirNames(dir)].map(nameKey));
  return async (bytes, filename) => {
    const name = freeFilename(filename, taken);
    taken.add(nameKey(name));
    await writeFileToDir(dir, name, (w) => w.write(bytes as unknown as BufferSource));
    const saved = await (await dir.getFileHandle(name)).getFile();
    if (saved.size !== bytes.length) throw new Error(`“${name}” was not saved in full`);
  };
}

/** Save a copy of each item, one at a time. Returns the items whose copy could
 *  not be pulled or saved: those must stay on the Nord. */
export async function saveCopies<T>(
  items: T[], save: CopyWriter, pull: (item: T) => Promise<Uint8Array>, filenameOf: (item: T) => string,
): Promise<T[]> {
  const failed: T[] = [];
  for (const item of items) {
    try {
      await save(await pull(item), filenameOf(item));
    } catch {
      failed.push(item);
    }
  }
  return failed;
}

/** What a removal from the Nord did. */
export interface RemoveResult {
  removed: number;
  /** Still on the Nord: in use after all, a copy that failed, or a removal that failed. */
  failed: number;
  /** Set when a failed removal could not be undone: how many removed files were downloaded as a zip instead. */
  recovered?: number;
}
