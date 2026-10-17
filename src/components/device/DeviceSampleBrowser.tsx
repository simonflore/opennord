import { type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { formatDeviceSlot } from '../../lib/clavia/slot';
import { formatBytes } from '../../lib/format';
import { StorageMeter } from './StorageMeter';
import { IdentityLcd } from '../program/widgets';

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
        <div className="ps-hd-id">
          <IdentityLcd name={deviceName} lines={[`${entries.length} samples`]} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {sampleCapacity && <StorageMeter label="SAMPLE LIBRARY" capacity={sampleCapacity} mode="space" />}
            {pianoCapacity && <StorageMeter label="PIANO LIBRARY" capacity={pianoCapacity} mode="space" />}
          </div>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="ps-sub">No samples found on this Nord.</p>
      ) : (
        <div className="ps-rows">
          {sorted.map((e) => (
            <div key={`${e.bank}-${e.slot}`} className="ps-row">
              <button className="ps-row-open" onClick={() => onSelect(e)}>
                <span className="ps-row-slot">{formatDeviceSlot(e.bank, e.slot)}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{e.name || `(slot ${formatDeviceSlot(e.bank, e.slot)})`}</span>
                <span className="ps-fact">{formatBytes(e.sizeBytes)}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
