import { type ProgramEntry } from '../../lib/device/transfer';
import { formatSlot } from '../../lib/ns4/slot';
import { formatBytes } from '../../lib/format';

/** The board's samples (Samp Lib partition) as a flat list; tap one to pull + open. */
export function DeviceSampleBrowser({ entries, deviceName, onSelect }: {
  entries: ProgramEntry[];
  deviceName: string;
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
      </div>
      {entries.length === 0 ? (
        <p className="ps-sub">No samples found on this Nord.</p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {sorted.map((e) => (
            <button
              key={`${e.bank}-${e.slot}`}
              onClick={() => onSelect(e)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, textAlign: 'left',
                cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line)',
                borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '8px 12px', color: 'var(--ink)',
              }}
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
