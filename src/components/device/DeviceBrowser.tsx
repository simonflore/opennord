import { useState } from 'react';
import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { BANK_LETTERS } from '../../lib/clavia/slot';
import type { Addr } from '../../lib/device/reorg';
import { StorageMeter } from './StorageMeter';
import { SlotGrid } from './SlotGrid';

/** Programs grouped by bank A–H. Open, delete, or send a file to the Nord. */
export function DeviceBrowser({ entries, deviceName, capacity, onSelect, onDelete, onSendFile, onReorg }: {
  entries: ProgramEntry[];
  deviceName: string;
  /** Program partition capacity for the storage readout, or null while it loads. */
  capacity: PartitionCapacity | null;
  onSelect: (entry: ProgramEntry) => void;
  onDelete: (entry: ProgramEntry) => void;
  /** Hand the chosen file to the caller, which reads it (error handling lives there). */
  onSendFile: (file: File) => void;
  onReorg?: (g: { kind: 'move'; from: Addr; to: Addr }) => void;
}) {
  const [organize, setOrganize] = useState(false);

  const byBank = new Map<number, ProgramEntry[]>();
  for (const e of entries) {
    const list = byBank.get(e.bank) ?? [];
    list.push(e);
    byBank.set(e.bank, list);
  }

  return (
    <div className="ps">
      <div className="ps-hd">
        <div>
          <div className="ps-nm">Your programs</div>
          <div className="ps-meta"><span>{deviceName} · {entries.length} programs</span></div>
          {capacity && <StorageMeter label="STORAGE" capacity={capacity} mode="slots" />}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setOrganize((v) => !v)}
            style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}
          >
            {organize ? 'Done organizing' : 'Organize'}
          </button>
          <label
            style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid var(--red)', color: 'var(--deps-ink)' }}
          >
            Send a file to the Nord
            <input type="file" accept=".ns4p" style={{ display: 'none' }}
              onChange={(ev) => ev.target.files?.[0] && onSendFile(ev.target.files[0])} />
          </label>
        </div>
      </div>
      {organize ? (
        BANK_LETTERS.split('').map((_, bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <h4 style={{ margin: '0 0 6px', color: 'var(--red-bright)', letterSpacing: 1.5 }}>
              BANK {BANK_LETTERS[bank]}
            </h4>
            <SlotGrid bank={bank} slotCount={64} entries={entries} onGesture={(g) => onReorg?.(g)} />
          </div>
        ))
      ) : (
        [...byBank.keys()].sort((a, b) => a - b).map((bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <h4 style={{ margin: '0 0 6px', color: 'var(--red-bright)', letterSpacing: 1.5 }}>
              BANK {BANK_LETTERS[bank] ?? bank}
            </h4>
            <div style={{ display: 'grid', gap: 6 }}>
              {byBank.get(bank)!
                .slice()
                .sort((a, b) => a.slot - b.slot)
                .map((e) => {
                  const v = programEntryView(e);
                  return (
                    <div
                      key={`${e.bank}-${e.slot}`}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                        background: 'var(--surface)', border: '1px solid var(--line)',
                        borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '8px 12px', color: 'var(--ink)',
                      }}
                    >
                      <button
                        onClick={() => onSelect(e)}
                        style={{
                          flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                          textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{v.name}</span>
                        <span className="ps-sub" style={{ margin: 0 }}>{v.slot} · {v.category} · {v.version}</span>
                      </button>
                      <button
                        onClick={() => onDelete(e)}
                        title={`Delete ${v.name}`}
                        style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--deps-border)', color: 'var(--warn)', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
