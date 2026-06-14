import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';
import { BANK_LETTERS } from '../../lib/ns4/slot';
import { programNameFromFilename } from '../../lib/ns4/name';

/** Programs grouped by bank A–H. Open, delete, or send a file to the Nord. */
export function DeviceBrowser({ entries, deviceName, onSelect, onDelete, onSendFile }: {
  entries: ProgramEntry[];
  deviceName: string;
  onSelect: (entry: ProgramEntry) => void;
  onDelete: (entry: ProgramEntry) => void;
  onSendFile: (bytes: Uint8Array, name: string) => void;
}) {
  const byBank = new Map<number, ProgramEntry[]>();
  for (const e of entries) {
    const list = byBank.get(e.bank) ?? [];
    list.push(e);
    byBank.set(e.bank, list);
  }

  async function pickFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    onSendFile(bytes, programNameFromFilename(file.name));
  }

  return (
    <div className="ps">
      <div className="ps-hd">
        <div>
          <div className="ps-nm">Your programs</div>
          <div className="ps-meta"><span>{deviceName} · {entries.length} programs</span></div>
        </div>
        <label
          style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid #c8102e', color: '#ff7a72' }}
        >
          Send a file to the Nord
          <input type="file" accept=".ns4p" style={{ display: 'none' }}
            onChange={(ev) => ev.target.files?.[0] && pickFile(ev.target.files[0])} />
        </label>
      </div>
      {[...byBank.keys()].sort((a, b) => a - b).map((bank) => (
        <div key={bank} style={{ marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 6px', color: '#ff5a52', letterSpacing: 1.5 }}>
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
                      background: '#222834', border: '1px solid #313847',
                      borderLeft: '3px solid #c8102e', borderRadius: 8, padding: '8px 12px', color: '#e7eaf0',
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
                      style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #43222a', color: '#ffb454', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
