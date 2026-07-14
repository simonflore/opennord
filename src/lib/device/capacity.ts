import type { NordSession } from './session';
import {
  CQryPartState, CQryBankList, PARTITION_PIANO, PARTITION_SAMP_LIB, PARTITION_SAMP_LIB_NATIVE,
} from './opcodes';
import { NordError } from './protocol';
import { readAsciiFixed } from '../clavia/ascii';
import { readU32BE as u32 } from './payload-io';

/**
 * Erase-block size in bytes per partition (Nord Stage 4). The device does NOT
 * transmit this (CRpyPartState counts are in blocks). It's derived from the
 * documented partition capacities — 2 GB Piano / 1 GB Sample Library (official
 * NS4 specs) — over the measured ~16384-block totals, which land on clean powers
 * of two: 128 KiB (Piano) and 64 KiB (Sample). This converts block counts into
 * real megabytes. Program is slot-bound, not byte-bound, so it's omitted (its
 * meter uses slots). Sources: nordkeyboards.com NS4 specs; docs/PROTOCOL-RE.md.
 */
const PARTITION_BLOCK_BYTES: Record<number, number> = {
  0: 131072, // Piano (Native) — shares the physical Piano partition
  [PARTITION_PIANO]: 131072, // Piano (user): 2 GiB / 16384 blocks
  [PARTITION_SAMP_LIB_NATIVE]: 65536, // Samp Lib (Native)
  [PARTITION_SAMP_LIB]: 65536, // Samp Lib (user): 1 GiB / 16384 blocks
};

/**
 * Partition capacity / free-space — the data behind a pre-write fit check.
 * Schemas + field meanings reverse-engineered from NSM (Ghidra) and confirmed
 * live on a Nord Stage 4 (read-only `CQryPartState`/`CQryBankList` queries).
 * See docs/PROTOCOL-RE.md → "Partition capacity / free-space".
 */

/** A partition's storage state, from `CRpyPartState` (0x09). All block fields are erase blocks. */
export interface PartitionState {
  /** User files currently stored in the partition. (Live: Program = 356, matching the enumerated corpus.) */
  fileCount: number;
  /** Erase blocks in use by user content. */
  usedBlocks: number;
  /** Erase blocks available for new user content. */
  freeBlocks: number;
  /** Erase blocks held in reserve (counted against capacity on some partitions). */
  reservedBlocks: number;
}

/** One bank within a partition, from `CRpyBankList` (0x03). */
export interface BankInfo {
  name: string;
  /** Max files this bank can hold (the bank's slot count). */
  slotCapacity: number;
}

/** A partition's bank layout + total slot capacity. */
export interface BankList {
  banks: BankInfo[];
  /** Σ slotCapacity across all banks. (Live: Program = 8 × 64 = 512.) */
  totalSlots: number;
}

/** Everything needed to decide whether new files fit: slot count + block space. */
export interface PartitionCapacity extends PartitionState, BankList {
  /** totalSlots − fileCount, floored at 0. */
  freeSlots: number;
  /** Bytes per erase block, for byte-constrained partitions (Sample/Piano); undefined otherwise. */
  blockSizeBytes?: number;
}


/**
 * Decode a `CRpyPartState` (0x09) reply payload: `u32 status` then 5 payload u32s
 * `[fileCount, free, used, reserved, E]` (E is an unresolved block-size class; unused).
 * `payload` is the reply body (status word included at offset 0).
 *
 * Field order is empirically pinned (see docs/PROTOCOL-RE.md): on a Stage 4 with
 * factory Piano banks loaded, word3 (`used`) × block size matched the documented
 * factory size and word2 (`free`) was tiny — the partition was *full*, not empty.
 * (An earlier reading had free/used swapped; it wrongly showed a full Piano as 2 GB free.)
 */
export function decodePartState(payload: Uint8Array): PartitionState {
  if (payload.length < 20) throw new NordError(`CRpyPartState payload too short (${payload.length} bytes)`);
  return {
    fileCount: u32(payload, 4),
    freeBlocks: u32(payload, 8),
    usedBlocks: u32(payload, 12),
    reservedBlocks: u32(payload, 16),
  };
}

/**
 * Decode a `CRpyBankList` (0x03) reply payload: `u32 status`, `u32 partitionIndex`,
 * `u8 bankCount`, then `bankCount` wire records `{ u32 nameLen, name, u32 slotCapacity }`
 * (variable-length on the wire — the 0x84 stride in NSM is its in-memory array, not this).
 */
export function decodeBankList(payload: Uint8Array): BankList {
  if (payload.length < 9) throw new NordError(`CRpyBankList payload too short (${payload.length} bytes)`);
  const bankCount = payload[8]; // u8
  const banks: BankInfo[] = [];
  let off = 9;
  for (let i = 0; i < bankCount; i++) {
    if (off + 4 > payload.length) throw new NordError('CRpyBankList truncated reading name length');
    const nameLen = u32(payload, off);
    off += 4;
    if (off + nameLen + 4 > payload.length) throw new NordError('CRpyBankList truncated reading bank record');
    banks.push({ name: readAsciiFixed(payload, off, nameLen), slotCapacity: u32(payload, off + nameLen) });
    off += nameLen + 4;
  }
  return { banks, totalSlots: banks.reduce((n, b) => n + b.slotCapacity, 0) };
}

/**
 * Read a partition's full capacity: `CQryPartState` + `CQryBankList`, combined.
 * Session-independent — the queries take an explicit partition index and don't
 * need a `begin()` (validated live). Throws NordError on a non-OK reply status.
 */
export async function readPartitionCapacity(session: NordSession, partition: number): Promise<PartitionCapacity> {
  const ps = await session.request(CQryPartState, [partition]);
  if (ps.status !== 0) throw new NordError(`partition state query failed (status ${ps.status})`);
  const state = decodePartState(ps.payload);

  const bl = await session.request(CQryBankList, [partition]);
  if (bl.status !== 0) throw new NordError(`bank list query failed (status ${bl.status})`);
  const { banks, totalSlots } = decodeBankList(bl.payload);

  return {
    ...state, banks, totalSlots,
    freeSlots: Math.max(0, totalSlots - state.fileCount),
    blockSizeBytes: PARTITION_BLOCK_BYTES[partition],
  };
}

/**
 * Free space in bytes for a byte-constrained partition (Sample / Piano), or
 * `undefined` for slot-constrained partitions (Programs — no block size).
 *
 * Formula transcribed from `CPartitionCtrl::GetFreeBytes @0x100132314`:
 *   freeBytes = (freeBlocks + reservedBlocks) × blockSize
 * (NSM reads `(mem[+0xf14] + mem[+0xf0c]) × mem[+0x3bc]` — free + reserved
 * blocks, times the per-partition block size held at +0x3bc.) This pins the
 * bytes-per-block conversion that `checkDownloadFit` had deferred.
 */
export function partitionFreeBytes(cap: PartitionCapacity): number | undefined {
  if (cap.blockSizeBytes === undefined) return undefined;
  return (cap.freeBlocks + cap.reservedBlocks) * cap.blockSizeBytes;
}

/** The outcome of a fit check — and, when it doesn't fit, a musician-facing reason. */
export interface FitResult {
  fits: boolean;
  freeSlots: number;
  reason?: string;
}

/**
 * Will `addedFiles` new files fit in the partition? Pure — operates on an already-read
 * `PartitionCapacity`, so it's trivially testable and the UI can reuse it. Checks the
 * slot count (the binding limit for programs, fully hardware-validated); free block
 * space is reported on the capacity but not gated here (the bytes-per-block conversion
 * isn't pinned yet — see docs/PROTOCOL-RE.md). `label` is a player-facing partition name.
 */
export function checkDownloadFit(cap: PartitionCapacity, addedFiles: number, label = 'This'): FitResult {
  if (addedFiles <= cap.freeSlots) return { fits: true, freeSlots: cap.freeSlots };
  const reason =
    cap.freeSlots === 0
      ? `${label} memory is full (${cap.fileCount} of ${cap.totalSlots} used). Delete some to make room, then try again.`
      : `Only ${cap.freeSlots} free ${cap.freeSlots === 1 ? 'slot' : 'slots'} left, but ${addedFiles} won't fit. ` +
        `Free up ${addedFiles - cap.freeSlots} more, then try again.`;
  return { fits: false, freeSlots: cap.freeSlots, reason };
}
