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
