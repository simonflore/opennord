/** Nord USB FileTransfer protocol constants + opcodes. See docs/PROTOCOL-RE.md. */

export const PROTOCOL_ID = 0x0c;
export const PROTOCOL_VERSION = 0x0a;

/** Partition index of user Programs (CQryPartList order). */
export const PARTITION_PROGRAM = 6;

// Request opcodes (replies are request | 1).
export const CReqBegin = 0x04;
export const CReqEnd = 0x06;
export const CReqFileOpen = 0x0c;
export const CReqFileClose = 0x0e;
export const CReqFileRead = 0x12;
export const CQryFileInfo = 0x1e;
export const CQryFileIterate = 0x20;

/**
 * Pack a 4-char extension into a big-endian fourcc, e.g. "ns4p" → 0x6E733470.
 * For `ext` shorter than 4 chars, `charCodeAt` returns NaN and `NaN & 0xff` is 0,
 * so the missing positions are zero-padded.
 */
export function ext2Type(ext: string): number {
  let v = 0;
  for (let i = 0; i < 4; i++) v = (v << 8) | (ext.charCodeAt(i) & 0xff);
  return v >>> 0;
}

/** Inverse of ext2Type: 0x6E733470 → "ns4p". */
export function type2Ext(type: number): string {
  return String.fromCharCode((type >>> 24) & 0xff, (type >>> 16) & 0xff, (type >>> 8) & 0xff, type & 0xff);
}
