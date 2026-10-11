import { useState } from 'react';
import type { ReactNode } from 'react';
import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { StorageMeter } from './StorageMeter';
import { OrganizeGrids } from './OrganizeGrids';
import { BankLabel } from './BankLabel';
import { Button, FileInput } from '../ui';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import type { ReorgApi } from './useReorg';

/** Program file extensions across the whole Nord line (ns4p, ns3f, ns2p, …) — the
 *  push flow reads each file's own CBIN tag, so the picker accepts any of them
 *  rather than Stage 4 alone. */
const PROGRAM_ACCEPT = [...new Set(ALL_MODELS.map((m) => m.programTag).filter(Boolean))]
  .map((tag) => `.${tag}`)
  .join(',');

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
        {/* The connected Nord's identity on the LCD, with its program storage under it. */}
        <div className="ps-hd-id">
          <div className="ps-lcd ps-lcd-id">
            <h2 className="big">{deviceName}</h2>
            <div>{entries.length} programs</div>
          </div>
          {capacity && <StorageMeter label="STORAGE" capacity={capacity} mode="slots" />}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => setOrganize((v) => !v)}>
            {organize ? 'Done organizing' : 'Organize'}
          </Button>
          <FileInput accept={PROGRAM_ACCEPT} onFile={onSendFile} className="on-btn on-btn--outline">
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
            <div style={{ display: 'grid', borderTop: '1px solid var(--line)' }}>
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
                        <span className="ps-row-slot">{v.slot}</span>
                        <span style={{ flex: 1, fontWeight: 600 }}>{v.name}</span>
                        <span className="ps-fact">{v.category} · {v.version}</span>
                      </button>
                      <button className="ps-row-del" onClick={() => onDelete(e)} title={`Delete ${v.name}`}>
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
