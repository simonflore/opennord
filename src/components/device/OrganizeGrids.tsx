import { useState, type ReactNode } from 'react';
import type { ProgramEntry } from '../../lib/device/transfer';
import { BANK_LETTERS } from '../../lib/clavia/slot';
import { SlotGrid } from './SlotGrid';
import { BankLabel } from './BankLabel';
import { PlanProgress } from './PlanProgress';
import { Dialog, Button } from '../ui';
import type { ReorgApi } from './useReorg';
import { planArrange, planInsert, type ArrangeMode, type Addr } from '../../lib/device/reorg';

/** The Organize view: per-bank grids + a Dialog confirm. Shared by the live-device
 *  Organize mode and the backup organizer (which supply the `reorg` flow). */
export function OrganizeGrids({ entries, reorg, confirmExtra }: {
  entries: ProgramEntry[];
  reorg: ReorgApi;
  /** Optional extra control in the confirm dialog (live: the "back up first" toggle). */
  confirmExtra?: ReactNode;
}) {
  const [mode, setMode] = useState<'swap' | 'insert'>('swap');
  const routeGesture = (g: { kind: 'move'; from: Addr; to: Addr }) =>
    mode === 'insert' ? reorg.propose((occ) => planInsert(occ, g.from, g.to)) : reorg.onGesture(g);
  const plan = reorg.pendingPlan;
  const verb = plan?.bulk
    ? plan.title.split(' ')[0]                       // 'Sort' / 'Compact'
    : plan?.title.startsWith('Swap') ? 'Swap' : 'Move';
  return (
    <>
      <p className="ps-sub" style={{ marginTop: 0, marginBottom: 10 }}>
        {mode === 'insert'
          ? 'Drag a program onto another to insert it there — the programs after it shift down. Drop on an empty slot to just move it.'
          : 'Drag a program onto an empty slot to move it, or onto another program to swap them.'}
      </p>
      <div role="group" aria-label="Reorder mode" style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'center', marginBottom: 10 }}>
        <span className="ps-sub" style={{ margin: 0 }}>Reorder:</span>
        <Button variant={mode === 'swap' ? 'primary' : 'ghost'} aria-pressed={mode === 'swap'} onClick={() => setMode('swap')}>Swap</Button>
        <Button variant={mode === 'insert' ? 'primary' : 'ghost'} aria-pressed={mode === 'insert'} onClick={() => setMode('insert')}>Insert</Button>
      </div>
      {BANK_LETTERS.split('').map((_, bank) => {
        const count = entries.filter((e) => e.bank === bank).length;
        const arrange = (mode: ArrangeMode) => reorg.propose((occ) => planArrange(occ, bank, mode));
        return (
          <div key={bank} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-2)' }}>
              <BankLabel bank={bank} />
              {count >= 2 && (
                <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
                  <Button variant="ghost" disabled={reorg.busy} onClick={() => arrange('name')}>Sort A–Z</Button>
                  <Button variant="ghost" disabled={reorg.busy} onClick={() => arrange('compact')}>Compact</Button>
                </div>
              )}
            </div>
            <SlotGrid bank={bank} slotCount={64} entries={entries} onGesture={routeGesture} mode={mode} />
          </div>
        );
      })}
      <Dialog
        open={!!plan}
        onClose={() => { if (!reorg.busy) reorg.cancel(); }}
        title={plan?.title ?? 'Reorganize'}
        footer={
          <>
            <Button variant="primary" onClick={() => void reorg.confirm()} disabled={reorg.busy}>
              {reorg.busy ? 'Working…' : verb}
            </Button>
            <Button variant="secondary" onClick={reorg.cancel} disabled={reorg.busy}>Cancel</Button>
          </>
        }
      >
        <p className="ps-sub" style={{ margin: 0 }}>{plan?.summary}</p>
        {plan?.bulk && (
          <p className="ps-sub" style={{ margin: '8px 0 0', paddingLeft: 10, borderLeft: '2px solid var(--red)', color: 'var(--dim)' }}>
            This changes slot numbers across the bank. MIDI Program Change and set-list automations that point at slots will shift to match.
          </p>
        )}
        {confirmExtra}
        <label className="ps-sub" style={{ display: 'block', marginTop: 8 }}>
          <input type="checkbox" checked={reorg.dontAsk} onChange={(e) => reorg.setDontAsk(e.target.checked)} />{' '}
          Don’t ask again this session
        </label>
        <PlanProgress progress={reorg.progress} />
      </Dialog>
    </>
  );
}
