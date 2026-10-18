import { useState } from 'react';
import type { ReactNode } from 'react';
import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';
import { StorageMeter } from './StorageMeter';
import { IdentityLcd } from '../program/widgets';
import { OrganizeGrids } from './OrganizeGrids';
import type { ModelInfo } from '../../lib/clavia/partitions';
import { BankLabel } from './BankLabel';
import { Button, FileInput } from '../ui';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import type { ReorgApi } from './useReorg';
import { READ_ONLY_REASON } from '../../lib/device/write-guard';

/** Program file extensions across the whole Nord line (ns4p, ns3f, ns2p, …) — the
 *  push flow reads each file's own CBIN tag, so the picker accepts any of them
 *  rather than Stage 4 alone. */
const PROGRAM_ACCEPT = [...new Set(ALL_MODELS.map((m) => m.programTag).filter(Boolean))]
  .map((tag) => `.${tag}`)
  .join(',');

/** Programs grouped by bank. Open, delete, or send a file to the Nord. */
export function DeviceBrowser({ entries, model, deviceName, capacity, onSelect, onDelete, onSendFile, writable = true, reorg, reorgConfirmExtra }: {
  entries: ProgramEntry[];
  /** The connected Nord's model: Organize draws its banks and slots. */
  model?: ModelInfo;
  deviceName: string;
  /** Program partition capacity for the storage readout, or null while it loads. */
  capacity: PartitionCapacity | null;
  onSelect: (entry: ProgramEntry) => void;
  onDelete: (entry: ProgramEntry) => void;
  /** False on a keyboard OpenNord won't write to: Organize and Send are greyed with the reason, Delete is hidden. */
  writable?: boolean;
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
          <IdentityLcd name={deviceName} lines={[`${entries.length} programs`]} />
          {capacity && <StorageMeter label="STORAGE" capacity={capacity} mode="slots" />}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => setOrganize((v) => !v)} disabled={!writable} title={writable ? undefined : READ_ONLY_REASON}>
            {organize ? 'Done organizing' : 'Organize'}
          </Button>
          <FileInput accept={PROGRAM_ACCEPT} onFile={onSendFile} disabled={!writable} title={writable ? undefined : READ_ONLY_REASON} className="on-btn on-btn--outline">
            Send a file to Nord…
          </FileInput>
        </div>
      </div>
      {organize ? (
        <OrganizeGrids entries={entries} model={model} bankList={capacity?.banks} reorg={reorg} confirmExtra={reorgConfirmExtra} />
      ) : (
        [...byBank.keys()].sort((a, b) => a - b).map((bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <BankLabel bank={bank} />
            <div className="ps-rows">
              {byBank.get(bank)!
                .slice()
                .sort((a, b) => a.slot - b.slot)
                .map((e) => {
                  const v = programEntryView(e);
                  return (
                    <div key={`${e.bank}-${e.slot}`} className="ps-row">
                      <button className="ps-row-open" onClick={() => onSelect(e)} title="Open in the Library">
                        <span className="ps-row-slot">{v.slot}</span>
                        <span style={{ flex: 1, fontWeight: 600 }}>{v.name}</span>
                        <span className="ps-fact">{v.category} · {v.version}</span>
                      </button>
                      {writable && (
                        <button className="ps-row-del" onClick={() => onDelete(e)} aria-label={`Delete ${v.name} from Nord`} title="Delete from Nord">
                          Delete
                        </button>
                      )}
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
