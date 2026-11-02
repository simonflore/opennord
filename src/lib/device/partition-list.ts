/**
 * The device's partition list (`CQryPartList` 0x00 → 0x01), with the per-partition
 * words and flags NSM uses to size writes. Reply: `u32 status`, `u8 count`, then per
 * partition `u32 nameLen` (NSM clamps it to 0x7f), the name, four `u32` words and the
 * flag bytes (10; 12 from FileTransfer version 5; 13 from version 10).
 *
 * Layout as NSM 9.22 reads it: its partition-list reply
 * reads the record, which NSM copies into
 * `CPartInfo`; `Hack_IsEraseSupported` decides erase.
 *  - w0: erase-block size in bytes (divisor in `GetFileBlockCnt`,
 *    `DoesFileFit`). High confidence.
 *  - w1: added to a file's size before dividing by w0. High for the formula.
 *  - w2: write-chunk alignment unit (`DownloadAsync`). High.
 *  - w3: not used on the write path.
 * Flag bytes, 0-based wire index (each stored as a bool):
 *  - 0: unresolved. NOT "read-only": when set, NSM's download check skips
 *    its file type, version and bank checks.
 *  - 1–5: not traced.
 *  - 6: strip illegal characters from the name.
 *  - 7: 0 = files are matched by name; set = matched by location.
 *  - 8: incremental backup selector.
 *  - 9: below version 5, erase is allowed when this is 0.
 *  - 10 (version ≥ 5): erase supported, non-zero = yes.
 *  - 11 (version ≥ 5): dependencies supported.
 *  - 12 (version ≥ 10): not traced.
 * There is no "not writable" flag in the list: NSM protects the Native partitions with
 * its own product table, and the keyboard refuses writes there with status 21. Write
 * permission therefore stays with `session.canWrite`.
 * The flag meanings come from reading NSM, not from a device; the hardware session
 * (the maintainers’ notes, W0) confirms them. See the maintainers’ notes.
 */
import type { NordSession } from './session';
import { CQryPartList } from './opcodes';
import { NordError } from './protocol';
import { readAsciiFixed } from '../clavia/ascii';
import { readU32BE as u32 } from './payload-io';

/** Flag-byte positions (0-based) within a partition record. */
export const PART_FLAG = { matchByLocation: 7, eraseBelowV5: 9, eraseSupported: 10 } as const;

/** NSM clamps a record's name length to this many bytes. */
const MAX_NAME = 0x7f;

export interface PartitionInfo {
  /** Protocol index (the record's position in the list). */
  index: number;
  name: string;
  /** w0: erase-block size in bytes. */
  blockBytes: number;
  /** w1: bytes added to a file's size before dividing by w0. */
  blockRounding: number;
  /** w2: write chunks are a multiple of this. */
  writeAlign: number;
  /** w3: not used on the write path. */
  word3: number;
  /** The raw flag bytes, for the hardware session's record. */
  flags: number[];
  /** Files are matched by name (flag 7 clear), as a restore does; false = matched by location. */
  matchByName: boolean;
  /** The partition can erase deleted blocks on request (`CReqEraseBlock`). */
  eraseSupported: boolean;
}

/** Flag bytes per partition record at this FileTransfer version. */
export function partitionFlagCount(fileTransferVersion: number): number {
  if (fileTransferVersion >= 10) return 13;
  if (fileTransferVersion >= 5) return 12;
  return 10;
}

/** Decode a `CRpyPartList` payload (status word included at offset 0). */
export function decodePartitionList(payload: Uint8Array, fileTransferVersion: number): PartitionInfo[] {
  if (payload.length < 5) throw new NordError(`partition list reply too short (${payload.length} bytes)`);
  const count = payload[4];
  const flagCount = partitionFlagCount(fileTransferVersion);
  const out: PartitionInfo[] = [];
  let off = 5;
  for (let index = 0; index < count; index++) {
    if (off + 4 > payload.length) throw new NordError('partition list truncated reading a name length');
    const nameLen = u32(payload, off);
    off += 4;
    if (nameLen > MAX_NAME) throw new NordError(`partition list name longer than ${MAX_NAME} bytes`);
    if (off + nameLen + 16 + flagCount > payload.length) {
      throw new NordError('partition list truncated reading a partition record');
    }
    const name = readAsciiFixed(payload, off, nameLen);
    off += nameLen;
    const [blockBytes, blockRounding, writeAlign, word3] = [0, 4, 8, 12].map((d) => u32(payload, off + d));
    off += 16;
    const flags = Array.from(payload.subarray(off, off + flagCount));
    off += flagCount;
    out.push({
      index, name, blockBytes, blockRounding, writeAlign, word3, flags,
      matchByName: (flags[PART_FLAG.matchByLocation] ?? 0) === 0,
      eraseSupported: fileTransferVersion >= 5
        ? (flags[PART_FLAG.eraseSupported] ?? 0) !== 0
        : flags[PART_FLAG.eraseBelowV5] === 0,
    });
  }
  return out;
}

/** Read the partition list. Needs no begin; the caller holds the session lock (`exclusive`). */
export async function readPartitionList(session: NordSession): Promise<PartitionInfo[]> {
  const reply = await session.request(CQryPartList, []);
  if (reply.status !== 0) throw new NordError(`partition list query failed (status ${reply.status})`);
  return decodePartitionList(reply.payload, session.fileTransferVersion);
}
