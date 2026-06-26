import { saveHandle, loadHandle, clearHandle } from './idbStore';
import type { FolderSource } from './source';

/** True when this browser can pick a folder and persist the handle (Chromium desktop). */
export function supportsPersistentFolders(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/**
 * What a folder access attempt yields. The access layer no longer reads or
 * scans — it only resolves a {@link FolderSource} (an FSA handle or a `File[]`).
 * Reading + parsing is the pipeline's job (see {@link ./pipeline}).
 */
export interface FolderHandleResult {
  /** Display name of the chosen folder. */
  name: string;
  /** The live handle when the FSA path was used (enables silent re-scan later). */
  handle?: FileSystemDirectoryHandle;
  /** Where the pipeline reads files from. */
  source: FolderSource;
}

interface DirPicker {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

/** FSA path: prompt for a folder, persist the handle, return it as the source. */
async function pickFolderFsa(): Promise<FolderHandleResult> {
  const handle = await (window as unknown as DirPicker).showDirectoryPicker();
  await saveHandle(handle);
  return { name: handle.name, handle, source: handle };
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
    input.onchange = () => {
      const list = input.files;
      cleanup();
      if (!list || list.length === 0) return reject(new Error('No folder chosen'));
      const top = (list[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ?? 'Folder';
      resolve({ name: top, source: Array.from(list) });
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
  | { status: 'granted'; name: string; handle: FileSystemDirectoryHandle; source: FolderSource }
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
  if (perm === 'granted') return { status: 'granted', name: handle.name, handle, source: handle };
  return { status: 'needs-permission', name: handle.name, handle };
}

/** Re-request permission (needs a user gesture); return the source, or null if denied. */
export async function grantAndScan(handle: FileSystemDirectoryHandle): Promise<FolderSource | null> {
  const perm = await (handle as unknown as Permissioned).requestPermission({ mode: 'read' });
  if (perm !== 'granted') return null;
  return handle;
}

/** Re-scan a live handle (manual refresh) — the handle is itself the source. */
export function rescan(handle: FileSystemDirectoryHandle): FolderSource {
  return handle;
}

/** Forget the saved folder. */
export function forgetFolder(): Promise<unknown> {
  return clearHandle();
}

/** Resolve a folder-relative, `/`-separated path to a File via the directory handle. */
export async function fileFromHandle(dir: FileSystemDirectoryHandle, path: string): Promise<File> {
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error(`Not a file path: "${path}"`);
  let cur = dir;
  for (const seg of parts) cur = await cur.getDirectoryHandle(seg);
  return (await cur.getFileHandle(fileName)).getFile();
}
