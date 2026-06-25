import { useState } from 'react';
import {
  loadBackup, backupDeviceIO, listPrograms, serializeBackup, type BackupModel,
} from '../../lib/device/backup-io';
import { planMove, buildOccupancy, isPlanError, type Addr, type Plan } from '../../lib/device/reorg';
import { executePlan, type ExecProgress } from '../../lib/device/execute';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { BANK_LETTERS } from '../../lib/clavia/slot';
import { downloadBytes } from '../../lib/download';
import type { ProgramEntry } from '../../lib/device/transfer';
import { SlotGrid } from './SlotGrid';
import { PlanProgress } from './PlanProgress';
import { ConfirmPanel } from './ConfirmPanel';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Reorganize a .ns4b backup offline — open, drag a program to an empty slot, download the result. */
export function BackupOrganizer({ onBack, initialModel }: { onBack: () => void; initialModel?: BackupModel }) {
  const [model, setModel] = useState<BackupModel | null>(initialModel ?? null);
  const [entries, setEntries] = useState<ProgramEntry[]>(initialModel ? listPrograms(initialModel) : []);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [planError, setPlanError] = useState('');
  const [progress, setProgress] = useState<ExecProgress | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setPlanError('');
    try {
      const m = loadBackup(new Uint8Array(await file.arrayBuffer()));
      setModel(m);
      setEntries(listPrograms(m));
    } catch (e) {
      setPlanError(msg(e));
    }
  }

  function onGesture(g: { kind: 'move'; from: Addr; to: Addr }) {
    setPlanError('');
    const plan = planMove(buildOccupancy(entries), g.from, g.to);
    if (isPlanError(plan)) { setPlanError(plan.error); return; }
    setPendingPlan(plan);
  }

  async function confirmMove() {
    if (!model || !pendingPlan || busy) return;
    setBusy(true); setProgress(null);
    try {
      const res = await executePlan(backupDeviceIO(model), PARTITION_PROGRAM, pendingPlan, buildOccupancy(entries), { onProgress: setProgress });
      setEntries(listPrograms(model));
      if (!res.ok) setPlanError(`Move failed; the backup is unchanged.${res.warnings.length ? ` (${res.warnings.join('; ')})` : ''}`);
      setPendingPlan(null);
    } catch (e) {
      setPlanError(`Could not complete the move: ${msg(e)}`);
    } finally {
      setBusy(false); setProgress(null);
    }
  }

  function download() {
    if (!model) return;
    downloadBytes(serializeBackup(model), `OpenNord Backup (reorganized) ${new Date().toISOString().slice(0, 10)}.ns4b`);
  }

  if (pendingPlan) {
    return (
      <>
        <ConfirmPanel title="Move program" message={pendingPlan.summary} confirmLabel="Move"
          busy={busy} onConfirm={confirmMove} onCancel={() => setPendingPlan(null)} />
        <PlanProgress progress={progress} />
      </>
    );
  }

  return (
    <div className="ps">
      <div className="ps-hd">
        <div>
          <div className="ps-nm">Organize a backup</div>
          <div className="ps-meta"><span>{model ? `${entries.length} programs` : 'No backup open'}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onBack}
            style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}>← Back</button>
          <button type="button" onClick={download} disabled={!model}
            style={{ padding: '8px 12px', borderRadius: 8, cursor: model ? 'pointer' : 'not-allowed', fontSize: 12, border: '1px solid var(--red)', background: 'transparent', color: 'var(--deps-ink)' }}>Download reorganized backup</button>
        </div>
      </div>

      {planError && <p className="ps-sub on-error">{planError}</p>}

      {!model ? (
        <label style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: '1px dashed var(--line)', color: 'var(--ink)' }}>
          Open a backup (.ns4b) to organize offline
          <input type="file" accept=".ns4b" style={{ display: 'none' }}
            onChange={(ev) => ev.target.files?.[0] && onFile(ev.target.files[0])} />
        </label>
      ) : (
        BANK_LETTERS.split('').map((_, bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <h4 style={{ margin: '0 0 6px', color: 'var(--red-bright)', letterSpacing: 1.5 }}>BANK {BANK_LETTERS[bank]}</h4>
            <SlotGrid bank={bank} slotCount={64} entries={entries} onGesture={onGesture} />
          </div>
        ))
      )}
    </div>
  );
}
