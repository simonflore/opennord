/** Nord USB FileTransfer protocol constants + opcodes. See docs/PROTOCOL-RE.md. */

export const PROTOCOL_ID = 0x0c;
export const PROTOCOL_VERSION = 0x0a;

/** Partition index of user Programs (CQryPartList order). */
export const PARTITION_PROGRAM = 6;
/** Partition index of the synth Sample Library (CQryPartList order). */
export const PARTITION_SAMP_LIB = 5;
/** Partition index of the Native (instrument) Sample Library. */
export const PARTITION_SAMP_LIB_NATIVE = 4;

// Request opcodes (replies are request | 1).
export const CReqBegin = 0x04;
export const CReqEnd = 0x06;
export const CReqFileOpen = 0x0c;
export const CReqFileCreate = 0x0a;
export const CReqFileClose = 0x0e;
export const CReqFileRead = 0x12;
export const CReqFileWrite = 0x10;
export const CReqFileDelete = 0x14;
export const CQryFileInfo = 0x1e;
export const CQryFileIterate = 0x20;
export const CQryFileGetDependency = 0x28; // → 0x29 reply: a file's sample dependency list

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
