/**
 * Will these files fit, and how many blocks must be erased first? NSM's rule
 * (`CheckDownloadFit_GetRequiredEraseBlockCnt`, `DoesFileFit`),
 * reimplemented: blocks per file = ⌊(size + w1) / w0⌋ from the partition list; free
 * blocks are written straight away; dirty blocks (deleted, not erased) count only on a
 * partition that can erase them, and then exactly the shortfall is erased first.
 * Pure; reasons are in a musician's words.
 */
import type { PartitionCapacity } from './capacity';
import type { PartitionInfo } from './partition-list';
import { formatBytes } from '../format';

export type FitLabel = 'sample' | 'piano';

export function fileBlocks(recordBytes: number, info: Pick<PartitionInfo, 'blockBytes' | 'blockRounding'>): number {
  return Math.floor((recordBytes + info.blockRounding) / info.blockBytes);
}

export interface FitOptions {
  /** What the memory holds, in the player's words. */
  label: FitLabel;
  /** Blocks of files removed before the write (a restore's removals). */
  releasedBlocks?: number;
  /** Places those removals free. */
  releasedSlots?: number;
}

export type FitPlan = { fits: true; blocks: number; eraseBlocks: number } | { fits: false; reason: string };

/** The one "no free place left" sentence (R8); callers that find no empty place reuse it. */
export const noFreePlaceReason = (label: string) =>
  `Your Nord’s ${label} memory has no free place left. Remove a ${label} to make room, then try again.`;

export function planFit(
  cap: Pick<PartitionCapacity, 'freeBlocks' | 'usedBlocks' | 'reservedBlocks' | 'freeSlots'>,
  info: Pick<PartitionInfo, 'blockBytes' | 'blockRounding' | 'eraseSupported'>,
  recordSizes: number[],
  { label, releasedBlocks = 0, releasedSlots = 0 }: FitOptions,
): FitPlan {
  if (!(info.blockBytes > 0)) {
    return { fits: false, reason: `OpenNord couldn’t read how your Nord’s ${label} memory is laid out, so nothing was changed.` };
  }
  const places = cap.freeSlots + releasedSlots;
  if (recordSizes.length > places) {
    return {
      fits: false,
      reason: places === 0
        ? noFreePlaceReason(label)
        : `Your Nord’s ${label} memory has room for ${places} more, not ${recordSizes.length}. Remove some to make room, then try again.`,
    };
  }
  const bytes = (blocks: number) => formatBytes(blocks * info.blockBytes);
  const required = recordSizes.reduce((n, size) => n + fileBlocks(size, info), 0);
  const erasable = releasedBlocks + (info.eraseSupported ? cap.reservedBlocks : 0);
  const available = cap.freeBlocks + erasable;
  if (cap.usedBlocks + available < required) {
    return { fits: false, reason: `This is too big for your Nord’s ${label} memory: it needs ${bytes(required)}, and the whole memory holds ${bytes(cap.usedBlocks + available)}.` };
  }
  if (cap.freeBlocks >= required) return { fits: true, blocks: required, eraseBlocks: 0 };
  if (!info.eraseSupported || available < required) {
    const free = info.eraseSupported ? available : cap.freeBlocks;
    return { fits: false, reason: `Your Nord’s ${label} memory has ${bytes(free)} free, and this needs ${bytes(required)}. Remove some ${label}s to make room, then try again.` };
  }
  return { fits: true, blocks: required, eraseBlocks: required - cap.freeBlocks };
}
