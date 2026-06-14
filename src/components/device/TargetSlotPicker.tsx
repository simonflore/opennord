import type { ProgramEntry } from '../../lib/device/transfer';
import { formatSlot, BANK_LETTERS } from '../../lib/ns4/slot';

/** A chosen write target. `occupiedBy` is the existing program name, if any. */
export interface SlotTarget {
  bank: number;
  slot: number;
  occupiedBy?: string;
}

/**
 * Pick a destination slot from the instrument's A–H × 64 grid, shown as X:YY.
 * Occupied slots show the program name; empty slots are quiet. Speaks no raw
 * bank/slot numbers — only the Nord's X:YY labels.
 */
export function TargetSlotPicker({ entries, onPick, onCancel }: {
  entries: ProgramEntry[];
  onPick: (target: SlotTarget) => void;
  onCancel: () => void;
}) {
  const occupied = new Map<string, string>();
  for (const e of entries) occupied.set(`${e.bank}-${e.slot}`, e.name);

  return (
    <div className="ps">
      <div className="ps-hd">
        <div className="ps-nm">Choose a slot</div>
        <button onClick={onCancel} style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid #ddd' }}>
          Cancel
        </button>
      </div>
      {Array.from({ length: 8 }, (_, bank) => (
        <div key={bank} style={{ marginBottom: 12 }}>
          <h4 style={{ margin: '0 0 6px', color: 'var(--red-bright)', letterSpacing: 1.5 }}>BANK {BANK_LETTERS[bank]}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
            {Array.from({ length: 64 }, (_, slot) => {
              const name = occupied.get(`${bank}-${slot}`);
              return (
                <button
                  key={slot}
                  onClick={() => onPick({ bank, slot, occupiedBy: name })}
                  title={name ? `${formatSlot(bank, slot)} — ${name}` : `${formatSlot(bank, slot)} — empty`}
                  style={{
                    fontSize: 9, padding: '4px 2px', borderRadius: 4, cursor: 'pointer', overflow: 'hidden',
                    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    border: '1px solid #313847',
                    background: name ? '#2c3340' : '#1a1e26',
                    color: name ? '#e7eaf0' : '#6b7280',
                  }}
                >
                  {formatSlot(bank, slot)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
