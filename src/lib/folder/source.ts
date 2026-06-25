import { classifyFile } from './classify';
import { readFileBytes } from '../file';

/** Where folder files come from: an FSA directory handle, or a webkitdirectory FileList. */
export type FolderSource = FileSystemDirectoryHandle | File[];

/** A loose Nord file located in the folder — read lazily via `bytes()`. */
export interface LocatedFile {
  kind: 'file';
  path: string;
  size: number;
  bytes(): Promise<Uint8Array>;
}

/** A `.ns4b` bundle located but NOT expanded — streamed lazily via `stream()`. */
export interface LocatedBundle {
  kind: 'bundle';
  path: string;
  size: number;
  stream(): ReadableStream<Uint8Array>;
}

export type Located = LocatedFile | LocatedBundle;

interface AsyncDir { values(): AsyncIterable<FileSystemHandle>; }

function locatedForFile(path: string, file: File, isBundle: boolean): Located {
  if (isBundle) return { kind: 'bundle', path, size: file.size, stream: () => file.stream() };
  return { kind: 'file', path, size: file.size, bytes: () => readFileBytes(file) };
}

async function* fromHandle(dir: FileSystemDirectoryHandle, prefix: string): AsyncGenerator<Located> {
  for await (const handle of (dir as unknown as AsyncDir).values()) {
    const path = prefix ? `${prefix}/${handle.name}` : handle.name;
    if (handle.kind === 'file') {
      const kind = classifyFile(path);
      if (!kind) continue;
      const file = await (handle as FileSystemFileHandle).getFile();
      yield locatedForFile(path, file, kind === 'bundle');
    } else if (handle.kind === 'directory') {
      yield* fromHandle(handle as FileSystemDirectoryHandle, path);
    }
  }
}

async function* fromFiles(files: File[]): AsyncGenerator<Located> {
  for (const file of files) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const slash = rel.indexOf('/');
    const path = slash === -1 ? rel : rel.slice(slash + 1); // drop top folder segment
    const kind = classifyFile(path);
    if (!kind) continue;
    yield locatedForFile(path, file, kind === 'bundle');
  }
}

/**
 * Walk a folder source and yield each Nord file as it is found — loose files
 * lazily readable, `.ns4b` bundles lazily streamable but NOT expanded. The
 * single traversal both `scanLoose` and `expandBundles` build on, so FSA and
 * webkitdirectory behave identically. Non-Nord files are skipped without
 * reading. The size cap (MAX_READ_BYTES) is applied by the pipeline, not here.
 */
export function locateNordFiles(source: FolderSource): AsyncGenerator<Located> {
  return Array.isArray(source) ? fromFiles(source) : fromHandle(source, '');
}
