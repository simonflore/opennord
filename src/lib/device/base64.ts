/**
 * Byte <-> base64 for the Capacitor USB bridge. Capacitor marshals JSON, so raw
 * frames cross the JS<->native boundary as base64 strings. Uses btoa/atob over a
 * binary string (available in the browser, jsdom, and Node test env).
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
