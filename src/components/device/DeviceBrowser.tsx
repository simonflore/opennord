import { programEntryView, type ProgramEntry } from '../../lib/device/transfer';

const BANK_LETTERS = 'ABCDEFGH';

/** Programs grouped by bank A–H; click a row to open it. Speaks names + X:YY only. */
export function DeviceBrowser({ entries, onSelect }: {
  entries: ProgramEntry[];
  onSelect: (entry: ProgramEntry) => void;
}) {
  const byBank = new Map<number, ProgramEntry[]>();
  for (const e of entries) {
    const list = byBank.get(e.bank) ?? [];
    list.push(e);
    byBank.set(e.bank, list);
  }

  return (
    <div className="ps">
      <div className="ps-hd">
        <div className="ps-nm">Your programs</div>
        <div className="ps-logo">nord</div>
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
                  <button
                    key={`${e.bank}-${e.slot}`}
                    onClick={() => onSelect(e)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 10, textAlign: 'left', cursor: 'pointer',
                      background: '#222834', border: '1px solid #313847',
                      borderLeft: '3px solid #c8102e', borderRadius: 8, padding: '8px 12px', color: '#e7eaf0',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{v.name}</span>
                    <span className="ps-sub" style={{ margin: 0 }}>{v.slot} · {v.category} · {v.version}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
