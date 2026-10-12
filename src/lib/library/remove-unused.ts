import { slotNameKey, type SampleUsage } from '@/lib/device/dependencies';
import type { ExecResult, UnrestoredFile } from '@/lib/device/execute';
import type { ProgramEntry } from '@/lib/device/transfer';
import { saveCopies, type CopyWriter, type RemoveResult } from './keep-copies';

/** An installed sample or piano picked for removal. */
interface Removable { id: string; name: string; device?: ProgramEntry }

/** The device and UI steps of one removal; the order they run in is {@link removeUnused}'s. */
export interface RemovalSteps<E extends Removable> {
  targets: E[];
  /** Entries to keep a copy of first, and where copies go (null when none was asked for). */
  keepCopyIds: Set<string>;
  saveCopy: CopyWriter | null;
  /** A fresh usage scan. Throws when it can't read everything. */
  rescan(onProgress: (done: number, total: number) => void): Promise<SampleUsage>;
  pull(entry: E): Promise<Uint8Array>;
  filenameOf(entry: E): string;
  /** Delete these from the Nord (journal, verify, rollback: `executePlan`). */
  remove(entries: E[], onProgress: (done: number, total: number) => void): Promise<ExecResult>;
  /** Read the library's list again. */
  relist(): Promise<ProgramEntry[]>;
  /** Keep the files a failed rollback could not put back. */
  keepUnrestored(files: UnrestoredFile[]): void;
  onUsage(usage: SampleUsage): void;
  onListed(entries: ProgramEntry[]): void;
  /** 0–100 over the whole removal: the scan is the first half, the deletes the second. */
  onProgress(pct: number): void;
  /** A delete was attempted (whatever came of it) and the list read again. */
  afterRemoval(): void;
}

const key = (e: Removable) => slotNameKey({ ...e.device!, name: e.name });
const half = (done: number, total: number) => (total ? Math.round((done / total) * 50) : 0);

/**
 * Remove unused samples or pianos from the Nord, deleting only what is safe to:
 * 1. ask the Nord again what is unused (programs sent or restored since the scan
 *    may use a target now), and drop targets that no longer are;
 * 2. save a copy of each one asked for, in full, and drop those whose copy failed;
 * 3. delete the rest, then read the list again and count from it.
 */
export async function removeUnused<E extends Removable>(s: RemovalSteps<E>): Promise<RemoveResult> {
  const fresh = await s.rescan((done, total) => s.onProgress(half(done, total)));
  s.onUsage(fresh);
  const unusedNow = new Set(fresh.unused.map(slotNameKey));
  const current = s.targets.filter((e) => unusedNow.has(key(e)));
  const uncopied = new Set(!s.saveCopy ? [] : await saveCopies(
    current.filter((e) => s.keepCopyIds.has(e.id)), s.saveCopy, s.pull, s.filenameOf));
  const toRemove = current.filter((e) => !uncopied.has(e));
  const kept = s.targets.length - toRemove.length;
  if (toRemove.length === 0) return { removed: 0, failed: kept };

  const res = await s.remove(toRemove, (done, total) => s.onProgress(50 + half(done, total)));
  // A failed removal whose undo failed too: what it could not put back is on
  // the Nord no longer, so keep it for the user before anything else.
  if (res.unrestored) s.keepUnrestored(res.unrestored);
  let listed: ProgramEntry[] | null = null;
  try { listed = await s.relist(); s.onListed(listed); } catch { /* the list stays as it was */ }
  s.afterRemoval();
  if (res.ok) return { removed: toRemove.length, failed: kept };
  // Rolled back in full, or the Nord can't be asked: count none as gone.
  const recovered = res.unrestored?.length;
  if (res.deviceUnchanged || !listed) return { removed: 0, failed: s.targets.length, recovered };
  const there = new Set(listed.map(slotNameKey));
  const gone = toRemove.filter((e) => !there.has(key(e))).length;
  return { removed: gone, failed: s.targets.length - gone, recovered };
}
