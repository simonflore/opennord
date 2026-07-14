import type { PartitionCapacity } from '../../lib/device/capacity';
import { partitionFreeBytes } from '../../lib/device/capacity';
import { StorageMeter } from './StorageMeter';
import { formatBytes } from '../../lib/format';
import { Button } from '../ui';

/** Fill fraction (0..1) of a partition — slots for Programs, blocks for Sample/Piano. */
function fillOf(cap: PartitionCapacity, mode: 'slots' | 'space'): number {
  if (mode === 'slots') return cap.totalSlots > 0 ? (cap.totalSlots - cap.freeSlots) / cap.totalSlots : 0;
  const total = cap.usedBlocks + cap.freeBlocks;
  return total > 0 ? cap.usedBlocks / total : 0;
}

/** Free-space phrase for a partition, e.g. "1.2 GB free" or "24 slots free". */
function freePhrase(cap: PartitionCapacity, mode: 'slots' | 'space'): string {
  if (mode === 'slots') return `${cap.freeSlots} slot${cap.freeSlots === 1 ? '' : 's'} free`;
  const b = partitionFreeBytes(cap);
  return b !== undefined ? `${formatBytes(b)} free` : 'space free';
}

/**
 * A one-line, musician-facing summary of the whole keyboard's storage. Names the
 * tightest area when something's getting full; otherwise reassures. Pure/exported
 * so it's unit-tested without a device.
 */
export function budgetHeadline(parts: { label: string; cap: PartitionCapacity; mode: 'slots' | 'space' }[]): string {
  const present = parts.filter((p) => p.cap);
  if (present.length === 0) return 'Reading your Nord’s storage…';
  const tightest = present.reduce((a, b) => (fillOf(b.cap, b.mode) > fillOf(a.cap, a.mode) ? b : a));
  const fill = fillOf(tightest.cap, tightest.mode);
  if (fill >= 0.999) return `Your ${tightest.label} is full — clear some space before adding more.`;
  if (fill >= 0.9) return `Your ${tightest.label} is nearly full — ${freePhrase(tightest.cap, tightest.mode)}.`;
  return 'Plenty of room across the board.';
}

export type ReclaimState =
  | { status: 'idle' }
  | { status: 'scanning'; pct: number | null }
  | { status: 'done'; bytes: number }
  | { status: 'error'; message: string };

/**
 * "How full is my Nord" — the three partition meters (Programs by slot, Sample &
 * Piano libraries by space) shown together, with a plain-language headline and an
 * on-demand "reclaimable space" scan. Device-connected; capacities are read
 * best-effort, so any that failed to read are simply omitted.
 */
export function MemoryBudget({ program, sample, piano, reclaim, onScan }: {
  program: PartitionCapacity | null;
  sample: PartitionCapacity | null;
  piano: PartitionCapacity | null;
  reclaim: ReclaimState;
  onScan: () => void;
}) {
  const parts: { label: string; cap: PartitionCapacity; mode: 'slots' | 'space' }[] = [
    ...(program ? [{ label: 'program slots', cap: program, mode: 'slots' as const }] : []),
    ...(sample ? [{ label: 'sample library', cap: sample, mode: 'space' as const }] : []),
    ...(piano ? [{ label: 'piano library', cap: piano, mode: 'space' as const }] : []),
  ];
  if (parts.length === 0) return null;

  return (
    <div className="ps-card" style={{ marginBottom: 12 }}>
      <p className="ps-sub" style={{ margin: '0 0 10px' }}>{budgetHeadline(parts)}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {program && <StorageMeter label="Programs" capacity={program} mode="slots" />}
        {sample && <StorageMeter label="Sample library" capacity={sample} mode="space" />}
        {piano && <StorageMeter label="Piano library" capacity={piano} mode="space" />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        {reclaim.status === 'idle' && (
          <Button variant="ghost" onClick={onScan}>Find reclaimable space</Button>
        )}
        {reclaim.status === 'scanning' && (
          <span className="ps-sub" style={{ margin: 0 }}>
            Scanning…{reclaim.pct != null ? ` ${reclaim.pct}%` : ''}
          </span>
        )}
        {reclaim.status === 'done' && (
          <span className="ps-sub" style={{ margin: 0 }}>
            {reclaim.bytes > 0
              ? <>~{formatBytes(reclaim.bytes)} reclaimable — remove unused samples & pianos from their Library tabs.</>
              : <>Nothing to reclaim — every installed sample and piano is in use.</>}
          </span>
        )}
        {reclaim.status === 'error' && (
          <span className="ps-sub" role="alert" style={{ margin: 0 }}>{reclaim.message}</span>
        )}
      </div>
    </div>
  );
}
