import type { RawFile } from './scan';

/**
 * Recursively read every file under a directory handle into a flat list,
 * with folder-relative paths (`"Bank 1/Lead.ns4p"`). Order is not guaranteed.
 *
 * Note: `FileSystemDirectoryHandle.values()` is an async iterator in the File
 * System Access API; the type lib may not declare it, hence the local cast.
 */
export async function walkDirectory(dir: FileSystemDirectoryHandle): Promise<RawFile[]> {
  const out: RawFile[] = [];
  await walkInto(dir, '', out);
  return out;
}

interface AsyncDir {
  values(): AsyncIterable<FileSystemHandle>;
}

async function walkInto(dir: FileSystemDirectoryHandle, prefix: string, out: RawFile[]): Promise<void> {
  for await (const handle of (dir as unknown as AsyncDir).values()) {
    const path = prefix ? `${prefix}/${handle.name}` : handle.name;
    if (handle.kind === 'file') {
      const file = await (handle as FileSystemFileHandle).getFile();
      out.push({ path, bytes: new Uint8Array(await file.arrayBuffer()) });
    } else if (handle.kind === 'directory') {
      await walkInto(handle as FileSystemDirectoryHandle, path, out);
    }
  }
}
