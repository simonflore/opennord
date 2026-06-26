import { useState, useEffect, useRef } from 'react';
import {
  loadBackup, loadBackupStreaming, backupDeviceIO, listPrograms, serializeBackup, streamBackupTo,
  type BackupModel,
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
import { BankLabel } from './BankLabel';
import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { Button, FileInput, WriteTargetDialog } from '../ui';
import { useFolder } from '../../lib/folder/FolderContext';
import { useWriteBackPref } from '../../lib/library/writeBackPrefs';
import { BundleChooser } from './BundleChooser';

/** Above this size, read the backup all at once would exceed the browser's ~2 GiB single-ArrayBuffer
 *  limit (and blow the tab's memory), so we stream instead. Mirrors the folder scan's cap. */
const STREAM_ABOVE = 1024 ** 3; // 1 GiB

type SaveFilePicker = (opts?: {
  suggestedName?: string;
  types?: { description?: string; accept?: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

const saveFilePicker = (): SaveFilePicker | undefined =>
  (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

/** Pending write-to-folder dialog state. */
type PendingWrite = { name: string; existing: boolean };

/** Reorganize a .ns4b backup offline — open, drag a program to an empty slot, download the result. */
export function BackupOrganizer({ onBack, initialModel }: { onBack: () => void; initialModel?: BackupModel }) {
  const folder = useFolder();
  const writeBackPref = useWriteBackPref();
  const [model, setModel] = useState<BackupModel | null>(initialModel ?? null);
  const [entries, setEntries] = useState<ProgramEntry[]>(initialModel ? listPrograms(initialModel) : []);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [planError, setPlanError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);
  const [progress, setProgress] = useState<ExecProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const triedAutoOpen = useRef(false);

  /** Open a bundle from the linked folder directly (no file picker needed). */
  async function openFromFolder(path: string) {
    setPlanError('');
    try {
      const f = await folder.openBundle(path);
      const m = await loadBackupStreaming(f);
      setModel(m);
      setEntries(listPrograms(m));
    } catch (e) {
      setPlanError(getErrorMessage(e));
    }
  }

  // Auto-open when there is exactly one bundle in the linked folder and no model is loaded.
  // Guard with a ref so a rescan that changes `folder.bundles` identity doesn't retry on error.
  useEffect(() => {
    if (!model && !initialModel && folder.bundles.length === 1 && !triedAutoOpen.current) {
      triedAutoOpen.current = true;
      void openFromFolder(folder.bundles[0].path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.bundles, model, initialModel]);

  async function onFile(file: File) {
    setPlanError('');
    try {
      // Full-device backups (samples) run to several GB — stream those; read small ones in one shot.
      const m = file.size > STREAM_ABOVE
        ? await loadBackupStreaming(file)
        : loadBackup(await readFileBytes(file));
      setModel(m);
      setEntries(listPrograms(m));
    } catch (e) {
      setPlanError(getErrorMessage(e));
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
      setPlanError(`Could not complete the move: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false); setProgress(null);
    }
  }

  async function performFolderWrite(name: string, mode: 'new' | 'overwrite') {
    if (!model || busy) return;
    setBusy(true); setPlanError(''); setSaveStatus('');
    try {
      const res = await folder.writeBack(name, (w) => streamBackupTo(model, w), { mode });
      if (res.target === 'folder') {
        setSaveStatus(`Saved to ${folder.folderName ?? ''}/${res.path}`);
        return;
      }
      // folder.writeBack returned 'download' (denied / no FSA) — fall through to disk save.
      await saveToFilePicker(model, name);
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setPlanError(`Could not save the backup: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveToFilePicker(m: BackupModel, name: string) {
    // Small in-memory backups serialize whole; streamed (multi-GB) ones must be written straight to disk.
    if (!m.source) {
      downloadBytes(serializeBackup(m), name);
      return;
    }
    const picker = saveFilePicker();
    if (!picker) {
      setPlanError('This backup is too large to download here — saving it needs a desktop Chromium browser (Chrome or Edge).');
      return;
    }
    const handle = await picker({ suggestedName: name, types: [{ description: 'Nord backup', accept: { 'application/octet-stream': ['.ns4b'] } }] });
    await streamBackupTo(m, await handle.createWritable());
  }

  async function download() {
    if (!model || busy) return;
    const name = `OpenNord Backup (reorganized) ${new Date().toISOString().slice(0, 10)}.ns4b`;

    // Folder-first path: if a folder is linked, route through writeBack.
    if (folder.folderName) {
      if (writeBackPref.mode === 'ask') {
        // Check if a file with this name already exists among the folder's bundles.
        const existing = folder.bundles.some((b) => b.path.split('/').pop() === name);
        setPendingWrite({ name, existing });
        return;
      }
      // Remembered preference — use it directly (no dialog).
      await performFolderWrite(name, writeBackPref.mode);
      return;
    }

    // No folder linked — existing download path verbatim.
    setBusy(true); setPlanError(''); setSaveStatus('');
    try {
      await saveToFilePicker(model, name);
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setPlanError(`Could not save the backup: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDialogChoose(mode: 'new' | 'overwrite', remember: boolean) {
    if (!pendingWrite) return;
    const { name } = pendingWrite;
    if (remember) writeBackPref.setMode(mode);
    setPendingWrite(null);
    await performFolderWrite(name, mode);
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

  if (pendingWrite && folder.folderName) {
    return (
      <WriteTargetDialog
        folderName={folder.folderName}
        existing={pendingWrite.existing}
        onChoose={(mode, remember) => void handleDialogChoose(mode, remember)}
        onCancel={() => setPendingWrite(null)}
      />
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
          <Button variant="secondary" onClick={onBack}>← Back</Button>
          <Button variant="outline" onClick={download} disabled={!model || busy}>
            {busy ? 'Saving…' : 'Download reorganized backup'}
          </Button>
        </div>
      </div>

      {planError && <p className="ps-sub on-error">{planError}</p>}
      {saveStatus && !planError && <p className="ps-sub">{saveStatus}</p>}

      {!model ? (
        folder.bundles.length >= 2 ? (
          <>
            <BundleChooser bundles={folder.bundles} onPick={(p) => void openFromFolder(p)} />
            <FileInput accept=".ns4b" onFile={onFile}
              style={{ display: 'inline-block', marginTop: 16, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: '1px dashed var(--line)', color: 'var(--ink)' }}>
              Open a different .ns4b…
            </FileInput>
          </>
        ) : folder.bundles.length === 1 ? (
          /* Auto-open is in progress (effect fired); show fallback picker in case it fails. */
          <FileInput accept=".ns4b" onFile={onFile}
            style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: '1px dashed var(--line)', color: 'var(--ink)' }}>
            Open a different .ns4b…
          </FileInput>
        ) : (
          <FileInput accept=".ns4b" onFile={onFile}
            style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: '1px dashed var(--line)', color: 'var(--ink)' }}>
            Open a backup (.ns4b) to organize offline
          </FileInput>
        )
      ) : (
        BANK_LETTERS.split('').map((_, bank) => (
          <div key={bank} style={{ marginBottom: 14 }}>
            <BankLabel bank={bank} />
            <SlotGrid bank={bank} slotCount={64} entries={entries} onGesture={onGesture} />
          </div>
        ))
      )}
    </div>
  );
}
