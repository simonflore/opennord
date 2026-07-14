/**
 * Pre-FileTransfer protocol-version negotiation. Before opening a FileTransfer
 * session, Nord Sound Manager asks the instrument which protocol versions it
 * supports and selects the right FileTransfer version per model — the NS4 speaks
 * FileTransfer `0x0a`, the NS2 speaks `0x08`, and a frame sent with the wrong
 * version is silently ignored. Reading the device's advertised versions lets us
 * auto-select instead of hard-coding. See docs/PROTOCOL-RE.md (community issue #31).
 */

/** protocolId of the version-negotiation family (distinct from FileTransfer `0x0c`). */
export const PROTOCOL_NEGOTIATE = 0x07;
/** msgId of the "list your supported versions" query; the device replies `0x03`. */
export const MSG_QRY_VERSIONS = 0x02;

/** Nord Stage 4 USB product id (Clavia vendor `0x0ffc`). */
export const NS4_PRODUCT_ID = 0x002e;

/**
 * Whether to run the pre-FileTransfer version handshake for a device, by product id.
 *
 * Skip it for the Stage 4: its FileTransfer version *is* the `0x0a` default
 * (negotiation's own fallback), so the handshake can only confirm what we already
 * use — while the `0x07` query's reply read is unbounded ({@link ./session
 * negotiateVersion} → transport `bulkIn`, no timeout). A device that silently
 * ignores `0x07` would pend the connect forever, and a dropped read can't be
 * rescued by a `.catch` nor abandoned without desyncing the shared IN endpoint.
 * Not issuing the query for the validated NS4 path removes that risk entirely;
 * other models (e.g. NS2, which answers `0x07` and needs `0x08`) still negotiate.
 */
export function shouldNegotiateVersion(productId: number): boolean {
  return productId !== NS4_PRODUCT_ID;
}

/**
 * Decode a `0x03` negotiation reply payload into `protocolId → version`.
 * Payload is byte-packed (not u32 words): `[u8 count][(u8 protocolId, u8 version) × count]`.
 * Captured NS2 reply: `05 06 01 07 00 0a 02 0c 08 0d 00`
 *   → (0x06,1) (0x07,0) (0x0a,2) (0x0c,8) (0x0d,0).
 */
export function parseVersionReply(payload: Uint8Array): Map<number, number> {
  const versions = new Map<number, number>();
  const count = payload[0] ?? 0;
  for (let i = 0; i < count; i++) {
    const off = 1 + i * 2;
    if (off + 1 >= payload.length) break; // truncated reply — stop at what we can read
    versions.set(payload[off], payload[off + 1]);
  }
  return versions;
}
