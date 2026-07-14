/** Trigger a browser download of `bytes` as `filename`, releasing the object URL after. */
export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // appended so the click reliably fires across browsers
  try {
    a.click();
  } finally {
    a.remove();
    URL.revokeObjectURL(url);
  }
}
