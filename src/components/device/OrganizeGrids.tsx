import type { ReactNode } from 'react';
import type { ProgramEntry } from '../../lib/device/transfer';
import { BANK_LETTERS } from '../../lib/clavia/slot';
import { SlotGrid } from './SlotGrid';
import { BankLabel } from './BankLabel';
import { PlanProgress } from './PlanProgress';
import { Dialog, Button } from '../ui';
import type { ReorgApi } from './useReorg';

/** The Organize view: per-bank grids + a Dialog confirm. Shared by the live-device
 *  Organize mode and the backup organizer (which supply the `reorg` flow). */
export function OrganizeGrids({ entries, reorg, confirmExtra }: {
  entries: ProgramEntry[];
  reorg: ReorgApi;
  /** Optional extra control in the confirm dialog (live: the "back up first" toggle). */
  confirmExtra?: ReactNode;
}) {
  const plan = reorg.pendingPlan;
  const verb = plan?.title.startsWith('Swap') ? 'Swap' : 'Move';
  return (
    <>
      <p className="ps-sub" style={{ marginTop: 0, marginBottom: 10 }}>
        Drag a program onto an empty slot to move it, or onto another program to swap them.
      </p>
      {BANK_LETTERS.split('').map((_, bank) => (
        <div key={bank} style={{ marginBottom: 14 }}>
          <BankLabel bank={bank} />
          <SlotGrid bank={bank} slotCount={64} entries={entries} onGesture={reorg.onGesture} />
        </div>
      ))}
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
        {confirmExtra}
        <PlanProgress progress={reorg.progress} />
      </Dialog>
    </>
  );
}
