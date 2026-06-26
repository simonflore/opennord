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

/** MIME carried on the drag so the source {bank,slot} travels with it — across grid
 *  instances (each bank is its own SlotGrid), which per-component state cannot do. */
const DRAG_MIME = 'application/x-nord-slot';

/** A grid of one bank's slots. Drag an occupied slot onto an empty one — in this or
 *  any other bank's grid — to move it. */
export function SlotGrid({ bank, slotCount, entries, onGesture }: Props) {
  const bySlot = new Map(entries.filter((e) => e.bank === bank).map((e) => [e.slot, e]));
  const bankLabel = BANK_LETTERS[bank & 0x7] ?? String(bank);
  // Highlight-only: which empty cell a drag is currently over. Local to this grid
  // (you hover one grid at a time) — it does NOT carry the drag source, which
  // lives in dataTransfer so cross-bank drops still resolve it.
  const [overSlot, setOverSlot] = useState<number | null>(null);

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
            className={`slot-grid__cell${occupied ? ' slot-grid__cell--occupied' : ''}${overSlot === slot ? (occupied ? ' slot-grid__cell--swap-over' : ' slot-grid__cell--over') : ''}`}
            draggable={occupied}
            aria-label={`${formatSlot(bank, slot)}${occupied ? `: ${e!.name}` : ' (empty)'}`}
            onDragStart={(ev) => {
              ev.dataTransfer.setData(DRAG_MIME, JSON.stringify({ bank, slot }));
              ev.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(ev) => {
              if ([...ev.dataTransfer.types].includes(DRAG_MIME)) {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
                setOverSlot(slot);
              }
            }}
            onDragLeave={() => setOverSlot((s) => (s === slot ? null : s))}
            onDrop={(ev) => {
              setOverSlot(null);
              const raw = ev.dataTransfer.getData(DRAG_MIME);
              if (!raw) return;
              ev.preventDefault();
              const from = JSON.parse(raw) as Addr;
              if (from.bank === bank && from.slot === slot) return; // dropped on itself
              onGesture({ kind: 'move', from, to: { bank, slot } });
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
