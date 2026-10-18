import { pickFolderInput } from './folder/access';
import { isPickerCancel } from './folder/picker-cancel';

/**
 * Ask for one file with the browser's own picker; null when the picker is closed without one.
 * The input is put in the DOM while it is open: a detached file input's click() is silently
 * ignored on some WebKit/iOS WKWebView builds (we wrap to iOS via Capacitor).
 */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = () => { const f = input.files?.[0] ?? null; input.remove(); resolve(f); };
    input.oncancel = () => { input.remove(); resolve(null); };
    input.click();
  });
}

/**
 * Ask for a folder once, without linking it as the library folder: every file in it, with its
 * path inside the picked folder (e.g. "Grand/Samples/C4.wav"); null when the picker is closed.
 * A folder that hands back no files (a cloud folder on Android) is an error, not a cancel.
 */
export async function pickFolderFiles(): Promise<{ path: string; file: File }[] | null> {
  try {
    const { source } = await pickFolderInput();
    return (source as File[]).map((file) => ({ path: file.webkitRelativePath || file.name, file }));
  } catch (e) {
    if (isPickerCancel(e)) return null;
    throw e;
  }
}
