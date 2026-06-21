import type { PartitionCapacity } from '../../lib/device/capacity';
import { formatBytes } from '../../lib/format';

/**
 * A partition storage readout reusing the shared `.ps-meter` styling.
 * - `slots` — for Programs, where the binding limit is the slot count
 *   ("156 of 512 free"). Hardware-validated.
 * - `space` — for Sample/Piano libraries, where bytes bind, not slots: shows
 *   free space (e.g. "1.2 GB free") when the partition's block size is known,
 *   else falls back to "% full" from the erase-block usage.
 */
export function StorageMeter({ label, capacity, mode }: {
  label: string;
  capacity: PartitionCapacity;
  mode: 'slots' | 'space';
}) {
  const { pct, value, warn } = mode === 'slots' ? slotsView(capacity) : spaceView(capacity);
  return (
    <div className="ps-meter" style={{ marginTop: 0, minWidth: 150 }}>
      <div className="ps-meter-label">
        <span>{label}</span>
        <span style={warn ? { color: 'var(--warn)' } : undefined}>{value}</span>
      </div>
      <div className="ps-meter-track">
        <div className="ps-meter-fill" style={{ width: `${pct}%`, background: warn ? 'var(--warn)' : undefined }} />
      </div>
    </div>
  );
}

function slotsView(c: PartitionCapacity) {
  const used = Math.max(0, c.totalSlots - c.freeSlots);
  const pct = c.totalSlots > 0 ? Math.round((used / c.totalSlots) * 100) : 0;
  const full = c.freeSlots === 0;
  return { pct, value: full ? 'Full' : `${c.freeSlots} of ${c.totalSlots} free`, warn: full };
}

function spaceView(c: PartitionCapacity) {
  const total = c.usedBlocks + c.freeBlocks;
  const pct = total > 0 ? Math.round((c.usedBlocks / total) * 100) : 0;
  const value = c.freeBlocks === 0
    ? 'Full'
    : c.blockSizeBytes
      ? `${formatBytes(c.freeBlocks * c.blockSizeBytes)} free`
      : `${pct}% full`;
  return { pct, value, warn: pct >= 90 };
}
