import { type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { formatSlot } from '../../lib/clavia/slot';
import { formatBytes } from '../../lib/format';
import { StorageMeter } from './StorageMeter';

/** The board's samples (Samp Lib partition) as a flat list; tap one to pull + open. */
export function DeviceSampleBrowser({ entries, deviceName, sampleCapacity, pianoCapacity, onSelect }: {
  entries: ProgramEntry[];
  deviceName: string;
  /** Sample Library storage (byte-constrained), or null while it loads. */
  sampleCapacity: PartitionCapacity | null;
  /** Piano Library storage (byte-constrained), or null while it loads. */
  pianoCapacity: PartitionCapacity | null;
  onSelect: (entry: ProgramEntry) => void;
}) {
  const sorted = entries.slice().sort((a, b) => a.bank - b.bank || a.slot - b.slot);
  return (
    <div className="ps">
      <div className="ps-hd">
        <div>
          <div className="ps-nm">Samples on {deviceName}</div>
          <div className="ps-meta"><span>{entries.length} samples</span></div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {sampleCapacity && <StorageMeter label="SAMPLE LIBRARY" capacity={sampleCapacity} mode="space" />}
          {pianoCapacity && <StorageMeter label="PIANO LIBRARY" capacity={pianoCapacity} mode="space" />}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="ps-sub">No samples found on this Nord.</p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {sorted.map((e) => (
            <button
              key={`${e.bank}-${e.slot}`}
              onClick={() => onSelect(e)}
              className="ps-accent-row"
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ fontWeight: 600 }}>{e.name || `(slot ${formatSlot(e.bank, e.slot)})`}</span>
              <span className="ps-sub" style={{ margin: 0 }}>{formatSlot(e.bank, e.slot)} · {formatBytes(e.sizeBytes)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
