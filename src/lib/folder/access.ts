import { MAX_READ_BYTES, tooLargeReason, type RawFile, type ScanError } from './scan';
import { walkDirectory, type WalkResult } from './walk';
import { saveHandle, loadHandle, clearHandle } from './idbStore';
import { classifyFile } from './classify';
import { streamUnzip } from './unzip-stream';
import { isBundleProgramEntry } from '../ns4/bundle';

/** True when this browser can pick a folder and persist the handle (Chromium desktop). */
export function supportsPersistentFolders(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/** What a folder access attempt yields. */
export interface FolderHandleResult {
  /** Display name of the chosen folder. */
  name: string;
  /** The live handle when the FSA path was used (enables silent re-scan later). */
  handle?: FileSystemDirectoryHandle;
  /** The readable Nord files. */
  files: RawFile[];
  /** Files we couldn't read (oversized / read failure) — surfaced to the user. */
  errors: ScanError[];
}

interface DirPicker {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

/**
 * Map a webkitdirectory FileList → Nord {@link RawFile}s, stripping the chosen
 * folder's own name. Mirrors {@link walkDirectory}: non-Nord files are skipped
 * unread, `.ns4b` bundles are streamed into their inner programs (not size-capped),
 * oversized non-bundle files are recorded in `errors`, and a read failure on one
 * file never aborts the rest.
 */
export async function filesToRawFiles(files: ArrayLike<File>): Promise<WalkResult> {
  const out: RawFile[] = [];
  const errors: ScanError[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const slash = rel.indexOf('/');
    const path = slash === -1 ? rel : rel.slice(slash + 1); // drop top folder segment
    const kind = classifyFile(path);
    if (!kind) continue; // skip non-Nord files without reading them
    try {
      if (kind === 'bundle') {
        // Mirror walkDirectory: stream the `.ns4b` entry-by-entry (no size cap,
        // no whole-archive in memory), emitting each inner program keyed
        // `<bundle>!<inner>` to match scanFiles' bundle id scheme.
        await streamUnzip(
          f.stream(),
          (entry) => out.push({ path: `${path}!${entry.path}`, bytes: entry.bytes }),
          isBundleProgramEntry,
        );
        continue;
      }
      if (f.size > MAX_READ_BYTES) { errors.push({ path, reason: tooLargeReason(f.size) }); continue; }
      out.push({ path, bytes: new Uint8Array(await f.arrayBuffer()) });
    } catch (err) {
      errors.push({ path, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return { files: out, errors };
}

/** FSA path: prompt for a folder, persist the handle, return its files. */
async function pickFolderFsa(): Promise<FolderHandleResult> {
  const handle = await (window as unknown as DirPicker).showDirectoryPicker();
  await saveHandle(handle);
  const { files, errors } = await walkDirectory(handle);
  return { name: handle.name, handle, files, errors };
}

/** Fallback path: a one-shot <input webkitdirectory> picker, no persistence. */
function pickFolderInput(): Promise<FolderHandleResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    input.style.display = 'none';
    document.body.appendChild(input); // WKWebView needs it in the DOM (see App.tsx)
    let settled = false;
    const cleanup = () => { settled = true; input.remove(); window.removeEventListener('focus', onFocus); };
    // Window regains focus when the picker closes. If a selection was made,
    // onchange fires and settles first; otherwise treat it as a cancel.
    const onFocus = () => { setTimeout(() => { if (!settled) { cleanup(); reject(new Error('Cancelled')); } }, 400); };
    input.onchange = async () => {
      const list = input.files;
      cleanup();
      if (!list || list.length === 0) return reject(new Error('No folder chosen'));
      const top = (list[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ?? 'Folder';
      const { files, errors } = await filesToRawFiles(list);
      resolve({ name: top, files, errors });
    };
    input.oncancel = () => { cleanup(); reject(new Error('Cancelled')); };
    window.addEventListener('focus', onFocus, { once: true });
    input.click();
  });
}

/** Prompt the user to choose a folder, using the best available API. */
export function pickFolder(): Promise<FolderHandleResult> {
  return supportsPersistentFolders() ? pickFolderFsa() : pickFolderInput();
}

/** Permission state for a restored handle, if any. */
export type RestoreState =
  | { status: 'none' }
  | { status: 'granted'; name: string; files: RawFile[]; errors: ScanError[] }
  | { status: 'needs-permission'; name: string; handle: FileSystemDirectoryHandle };

interface Permissioned {
  queryPermission(d: { mode: 'read' }): Promise<PermissionState>;
  requestPermission(d: { mode: 'read' }): Promise<PermissionState>;
}

/** On launch: re-load the saved handle and check whether we can still read it. */
export async function restoreFolder(): Promise<RestoreState> {
  if (!supportsPersistentFolders()) return { status: 'none' };
  const handle = await loadHandle();
  if (!handle) return { status: 'none' };
  const perm = await (handle as unknown as Permissioned).queryPermission({ mode: 'read' });
  if (perm === 'granted') {
    const { files, errors } = await walkDirectory(handle);
    return { status: 'granted', name: handle.name, files, errors };
  }
  return { status: 'needs-permission', name: handle.name, handle };
}

/** Re-request permission (needs a user gesture) and scan, or signal denial. */
export async function grantAndScan(handle: FileSystemDirectoryHandle): Promise<WalkResult | null> {
  const perm = await (handle as unknown as Permissioned).requestPermission({ mode: 'read' });
  if (perm !== 'granted') return null;
  return walkDirectory(handle);
}

/** Re-scan a live handle (manual refresh). */
export function rescan(handle: FileSystemDirectoryHandle): Promise<WalkResult> {
  return walkDirectory(handle);
}

/** Forget the saved folder. */
export function forgetFolder(): Promise<unknown> {
  return clearHandle();
}
