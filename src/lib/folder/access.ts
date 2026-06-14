import type { RawFile } from './scan';
import { walkDirectory } from './walk';
import { saveHandle, loadHandle, clearHandle } from './idbStore';

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
  /** The scanned files. */
  files: RawFile[];
}

interface DirPicker {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

/** Map a webkitdirectory FileList → RawFile[], stripping the chosen folder's own name. */
export async function filesToRawFiles(files: ArrayLike<File>): Promise<RawFile[]> {
  const out: RawFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const slash = rel.indexOf('/');
    const path = slash === -1 ? rel : rel.slice(slash + 1); // drop top folder segment
    out.push({ path, bytes: new Uint8Array(await f.arrayBuffer()) });
  }
  return out;
}

/** FSA path: prompt for a folder, persist the handle, return its files. */
async function pickFolderFsa(): Promise<FolderHandleResult> {
  const handle = await (window as unknown as DirPicker).showDirectoryPicker();
  await saveHandle(handle);
  return { name: handle.name, handle, files: await walkDirectory(handle) };
}

/** Fallback path: a one-shot <input webkitdirectory> picker, no persistence. */
function pickFolderInput(): Promise<FolderHandleResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    input.style.display = 'none';
    document.body.appendChild(input); // WKWebView needs it in the DOM (see App.tsx)
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const list = input.files;
      cleanup();
      if (!list || list.length === 0) return reject(new Error('No folder chosen'));
      const top = (list[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ?? 'Folder';
      resolve({ name: top, files: await filesToRawFiles(list) });
    };
    input.oncancel = () => { cleanup(); reject(new Error('Cancelled')); };
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
  | { status: 'granted'; name: string; files: RawFile[] }
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
    return { status: 'granted', name: handle.name, files: await walkDirectory(handle) };
  }
  return { status: 'needs-permission', name: handle.name, handle };
}

/** Re-request permission (needs a user gesture) and scan, or signal denial. */
export async function grantAndScan(handle: FileSystemDirectoryHandle): Promise<RawFile[] | null> {
  const perm = await (handle as unknown as Permissioned).requestPermission({ mode: 'read' });
  if (perm !== 'granted') return null;
  return walkDirectory(handle);
}

/** Re-scan a live handle (manual refresh). */
export function rescan(handle: FileSystemDirectoryHandle): Promise<RawFile[]> {
  return walkDirectory(handle);
}

/** Forget the saved folder. */
export function forgetFolder(): Promise<unknown> {
  return clearHandle();
}
