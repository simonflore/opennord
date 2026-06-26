import { useState } from 'react';
import type { ReactNode } from 'react';
import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { StorageMeter } from './StorageMeter';
import { OrganizeGrids } from './OrganizeGrids';
import { BankLabel } from './BankLabel';
import { Button, FileInput } from '../ui';
import type { ReorgApi } from './useReorg';

/** Programs grouped by bank A–H. Open, delete, or send a file to the Nord. */
export function DeviceBrowser({ entries, deviceName, capacity, onSelect, onDelete, onSendFile, reorg, reorgConfirmExtra }: {
  entries: ProgramEntry[];
  deviceName: string;
  /** Program partition capacity for the storage readout, or null while it loads. */
  capacity: PartitionCapacity | null;
  onSelect: (entry: ProgramEntry) => void;
  onDelete: (entry: ProgramEntry) => void;
  /** Hand the chosen file to the caller, which reads it (error handling lives there). */
  onSendFile: (file: File) => void;
  reorg: ReorgApi;
  reorgConfirmExtra?: ReactNode;
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
          <Button variant="secondary" onClick={() => setOrganize((v) => !v)}>
            {organize ? 'Done organizing' : 'Organize'}
          </Button>
          <FileInput accept=".ns4p" onFile={onSendFile} className="on-btn on-btn--outline">
            Send a file to the Nord
          </FileInput>
        </div>
      </div>
      {organize ? (
        <OrganizeGrids entries={entries} reorg={reorg} confirmExtra={reorgConfirmExtra} />
      ) : (
        [...byBank.keys()].sort((a, b) => a - b).map((bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <BankLabel bank={bank} />
            <div style={{ display: 'grid', gap: 6 }}>
              {byBank.get(bank)!
                .slice()
                .sort((a, b) => a.slot - b.slot)
                .map((e) => {
                  const v = programEntryView(e);
                  return (
                    <div key={`${e.bank}-${e.slot}`} className="ps-accent-row">
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
