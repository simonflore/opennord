import type { ProgramEntry } from '../../lib/device/transfer';
import { formatDeviceSlot } from '../../lib/clavia/slot';
import type { ModelInfo } from '../../lib/clavia/partitions';
import { deviceSlotLayout } from '../../lib/device/slot-layout';
import type { BankInfo } from '../../lib/device/capacity';
import { BankLabel } from './BankLabel';
import { Button } from '../ui';

/** A chosen write target. `occupiedBy` is the existing program name, if any. */
export interface SlotTarget {
  bank: number;
  slot: number;
  occupiedBy?: string;
}

/**
 * Pick a destination slot from the instrument's own banks and slots (its model's
 * Program partition, grown to reach every listed file), shown as X:YY.
 * Occupied slots show the program name; empty slots are quiet. Speaks no raw
 * bank/slot numbers — only the Nord's X:YY labels.
 */
export function TargetSlotPicker({ entries, model, bankList, onPick, onCancel }: {
  entries: ProgramEntry[];
  /** The connected Nord's model, for its bank × slot shape; a Stage 4's without it. */
  model?: ModelInfo;
  /** The Nord's own bank list, when read: it wins over the model's recorded shape. */
  bankList?: readonly BankInfo[] | null;
  onPick: (target: SlotTarget) => void;
  onCancel: () => void;
}) {
  const occupied = new Map<string, string>();
  for (const e of entries) occupied.set(`${e.bank}-${e.slot}`, e.name);
  const { banks, perBank } = deviceSlotLayout(model, entries, bankList);

  return (
    <div className="ps">
      <div className="ps-hd">
        <div className="ps-nm">Choose a slot</div>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      {Array.from({ length: banks }, (_, bank) => (
        <div key={bank} style={{ marginBottom: 12 }}>
          <BankLabel bank={bank} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
            {Array.from({ length: perBank }, (_, slot) => {
              const name = occupied.get(`${bank}-${slot}`);
              return (
                <button
                  key={slot}
                  onClick={() => onPick({ bank, slot, occupiedBy: name })}
                  title={name ? `${formatDeviceSlot(bank, slot)} — ${name}` : `${formatDeviceSlot(bank, slot)} — empty`}
                  style={{
                    fontSize: 9, padding: '4px 2px', borderRadius: 4, cursor: 'pointer', overflow: 'hidden',
                    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    border: '1px solid var(--line)',
                    background: name ? 'var(--surface-2)' : 'var(--bg)',
                    color: name ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {formatDeviceSlot(bank, slot)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
