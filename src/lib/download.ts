/** Trigger a browser download of `blob` as `filename`, releasing the object URL after. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
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

/** Trigger a browser download of `bytes` as `filename`, releasing the object URL after. */
export function downloadBytes(bytes: Uint8Array, filename: string): void {
  downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' }), filename);
}
