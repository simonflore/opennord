import { MAX_READ_BYTES, tooLargeReason, type RawFile, type ScanError } from './scan';
import { classifyFile } from './classify';

/** What a folder walk yields: the readable Nord files plus any per-file errors. */
export interface WalkResult {
  files: RawFile[];
  errors: ScanError[];
}

/**
 * Recursively read every Nord file under a directory handle into a flat list,
 * with folder-relative paths (`"Bank 1/Lead.ns4p"`). Order is not guaranteed.
 *
 * Tolerant by design: non-Nord files are skipped without reading; an oversized
 * file (> {@link MAX_READ_BYTES}) or one that fails to read is recorded in
 * `errors` and the walk continues — one bad file never aborts the whole scan.
 *
 * Note: `FileSystemDirectoryHandle.values()` is an async iterator in the File
 * System Access API; the type lib may not declare it, hence the local cast.
 */
export async function walkDirectory(dir: FileSystemDirectoryHandle): Promise<WalkResult> {
  const files: RawFile[] = [];
  const errors: ScanError[] = [];
  await walkInto(dir, '', files, errors);
  return { files, errors };
}

interface AsyncDir {
  values(): AsyncIterable<FileSystemHandle>;
}

async function walkInto(
  dir: FileSystemDirectoryHandle, prefix: string, files: RawFile[], errors: ScanError[],
): Promise<void> {
  for await (const handle of (dir as unknown as AsyncDir).values()) {
    const path = prefix ? `${prefix}/${handle.name}` : handle.name;
    if (handle.kind === 'file') {
      if (!classifyFile(path)) continue; // skip non-Nord files without reading them
      try {
        const file = await (handle as FileSystemFileHandle).getFile();
        if (file.size > MAX_READ_BYTES) { errors.push({ path, reason: tooLargeReason(file.size) }); continue; }
        files.push({ path, bytes: new Uint8Array(await file.arrayBuffer()) });
      } catch (err) {
        errors.push({ path, reason: err instanceof Error ? err.message : String(err) });
      }
    } else if (handle.kind === 'directory') {
      await walkInto(handle as FileSystemDirectoryHandle, path, files, errors);
    }
  }
}
