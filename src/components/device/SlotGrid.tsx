import { useState } from 'react';
import type { ProgramEntry } from '../../lib/device/transfer';
import type { Addr } from '../../lib/device/reorg';
import { formatSlot, BANK_LETTERS } from '../../lib/clavia/slot';
import './slotgrid.css';

interface Props {
  bank: number;
  slotCount: number;
  entries: ProgramEntry[];
  onGesture(g: { kind: 'move'; from: Addr; to: Addr }): void;
}

/** A grid of one bank's slots. Drag an occupied slot onto an empty one to move it. */
export function SlotGrid({ bank, slotCount, entries, onGesture }: Props) {
  const bySlot = new Map(entries.filter((e) => e.bank === bank).map((e) => [e.slot, e]));
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const bankLabel = BANK_LETTERS[bank & 0x7] ?? String(bank);

  return (
    <div className="slot-grid" role="grid" aria-label={`Bank ${bankLabel}`}>
      {Array.from({ length: slotCount }, (_, slot) => {
        const e = bySlot.get(slot);
        const occupied = e !== undefined;
        return (
          <div
            key={slot}
            data-slot={slot}
            data-occupied={occupied}
            className={`slot-grid__cell${occupied ? ' slot-grid__cell--occupied' : ''}`}
            draggable={occupied}
            aria-label={`${formatSlot(bank, slot)}${occupied ? `: ${e!.name}` : ' (empty)'}`}
            onDragStart={() => setDragFrom(slot)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(ev) => { if (!occupied && dragFrom !== null) ev.preventDefault(); }}
            onDrop={() => {
              if (dragFrom !== null && !occupied) {
                onGesture({ kind: 'move', from: { bank, slot: dragFrom }, to: { bank, slot } });
              }
              setDragFrom(null);
            }}
          >
            <span className="slot-grid__label">{formatSlot(bank, slot)}</span>
            {occupied && <span className="slot-grid__name">{e!.name}</span>}
          </div>
        );
      })}
    </div>
  );
}
