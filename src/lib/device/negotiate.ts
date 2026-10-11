/**
 * Pre-FileTransfer protocol-version negotiation. Before opening a FileTransfer
 * session, Nord Sound Manager asks the instrument which protocol versions it
 * supports and selects the right FileTransfer version per model — the NS4 speaks
 * FileTransfer `0x0a`, the NS2 speaks `0x08`, and a frame sent with the wrong
 * version is silently ignored. Reading the device's advertised versions lets us
 * auto-select instead of hard-coding. See docs/PROTOCOL-RE.md (community issue #31).
 *
 * Across the line the firmware speaks versions 3, 4, 6, 7, 8 and 10 and drops any
 * frame above its own version (docs/FIRMWARE-LINE.md). The registry records
 * each model's version (`ModelInfo.fileTransferVersion`); connect starts from it
 * ({@link initialFileTransferVersion}) and the handshake, when answered, wins.
 */
import { PROTOCOL_VERSION } from './opcodes';
import type { ModelInfo } from '../clavia/partitions';

/**
 * FileTransfer versions Nord Sound Manager 9.22 speaks: 3 (Stage Classic) to 10
 * (the Stage 3 / 4 generation). An advertised version outside this range is not
 * one any instrument uses, so it is never adopted.
 */
export const FILE_TRANSFER_VERSION_MIN = 3;
export const FILE_TRANSFER_VERSION_MAX = 10;

/** True when `version` is a FileTransfer version NSM accepts (3–10). */
export function isKnownFileTransferVersion(version: number): boolean {
  return Number.isInteger(version) && version >= FILE_TRANSFER_VERSION_MIN && version <= FILE_TRANSFER_VERSION_MAX;
}

/**
 * Whether a device of this FileTransfer version answers dependency queries
 * (`CQryFileGetDependency`): only above version 5 — NSM 9.22's
 * `CFileTransfer::Hack_IsDepsSupported` @0x100079dcc also wants the partition's
 * flag, which needs the newer partition list.
 */
export function supportsDependencies(version: number): boolean {
  return version > 5;
}

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
 * use. Connect bounds the reply read (`withReplyTimeout`), but a transport that
 * can't cancel a read (the iPad bridge) ignores that bound, so a device that
 * silently ignores `0x07` would pend the connect forever. Not issuing the query
 * for the validated NS4 path removes that risk entirely; other models (e.g. NS2,
 * which answers `0x07` and needs `0x08`) still negotiate.
 */
export function shouldNegotiateVersion(productId: number): boolean {
  return productId !== NS4_PRODUCT_ID;
}

/**
 * The FileTransfer version a session frames requests with before negotiation —
 * and keeps when the device doesn't advertise FileTransfer: the identified
 * model's firmware version, else the Stage 4 default (`0x0a`). The firmware
 * drops frames outside 3..its version without a reply, so a v3–v8 model (Stage
 * Classic/EX, Electro 3/4, Piano 1/2, C2, C2D, Wave, Stage 2, Lead 4/A1) left
 * on `0x0a` would never answer anything.
 */
export function initialFileTransferVersion(model: ModelInfo | undefined): number {
  return model?.fileTransferVersion ?? PROTOCOL_VERSION;
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
