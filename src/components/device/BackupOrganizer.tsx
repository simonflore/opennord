import { useState, useEffect, useRef } from 'react';
import {
  loadBackup, loadBackupStreaming, backupDeviceIO, listPrograms, serializeBackup, streamBackupTo,
  type BackupModel,
} from '../../lib/device/backup-io';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { downloadBytes } from '../../lib/download';
import type { ProgramEntry } from '../../lib/device/transfer';
import type { DeviceIO } from '../../lib/device/device-io';
import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { Button, FileInput, WriteTargetDialog } from '../ui';
import { useFolder } from '../../lib/folder/FolderContext';
import { useFolderWrite } from '../../lib/folder/useFolderWrite';
import { BundleChooser } from './BundleChooser';
import { useReorg } from './useReorg';
import { OrganizeGrids } from './OrganizeGrids';

/** Above this size, read the backup all at once would exceed the browser's ~2 GiB single-ArrayBuffer
 *  limit (and blow the tab's memory), so we stream instead. Mirrors the folder scan's cap. */
const STREAM_ABOVE = 1024 ** 3; // 1 GiB

type SaveFilePicker = (opts?: {
  suggestedName?: string;
  types?: { description?: string; accept?: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

const saveFilePicker = (): SaveFilePicker | undefined =>
  (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

/** Stable no-op DeviceIO for when no model is open (so useReorg has a valid io). */
const NOOP_IO: DeviceIO = {
  pull: async () => new Uint8Array(0),
  push: async () => {},
  delete: async () => {},
  info: async () => null,
};

/** Reorganize a .ns4b backup offline — open, drag a program to an empty slot, download the result. */
export function BackupOrganizer({ onBack, initialModel, initialBundlePath }: { onBack: () => void; initialModel?: BackupModel; initialBundlePath?: string }) {
  const folder = useFolder();
  const [model, setModel] = useState<BackupModel | null>(initialModel ?? null);
  const [entries, setEntries] = useState<ProgramEntry[]>(initialModel ? listPrograms(initialModel) : []);
  const [planError, setPlanError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const triedAutoOpen = useRef(false);

  const reorg = useReorg({
    io: model ? backupDeviceIO(model) : NOOP_IO,
    partition: PARTITION_PROGRAM,
    entries,
    refresh: () => { if (model) setEntries(listPrograms(model)); },
    autoApply: true, // non-destructive in-memory edit — apply on drop, no per-move confirm
  });

  const folderWrite = useFolderWrite({
    onSaved: (path, folderName) => { setPlanError(''); setSaveStatus(`Saved to ${folderName}/${path}`); },
    onFallback: () => saveToFilePicker(model, makeName()),
  });

  function makeName() {
    return `OpenNord Backup (reorganized) ${new Date().toISOString().slice(0, 10)}.ns4b`;
  }

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

  // Auto-open a bundle and skip the chooser: an explicitly-chosen `initialBundlePath`
  // (picked on the Device landing) takes priority; otherwise auto-open when the folder
  // holds exactly one backup. Guard with a ref so a rescan that changes `folder.bundles`
  // identity doesn't retry on error.
  useEffect(() => {
    if (model || initialModel || triedAutoOpen.current) return;
    if (initialBundlePath) {
      triedAutoOpen.current = true;
      void openFromFolder(initialBundlePath);
    } else if (folder.bundles.length === 1) {
      triedAutoOpen.current = true;
      void openFromFolder(folder.bundles[0].path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.bundles, model, initialModel, initialBundlePath]);

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

  async function saveToFilePicker(m: BackupModel | null, name: string) {
    if (!m) return;
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
    if (!model || folderWrite.saving) return;
    const name = makeName();
    // The dated reorganized name won't collide, so existing: false is fine.
    await folderWrite.save({ name, existing: false, write: (w) => streamBackupTo(model, w) });
  }

  if (folderWrite.dialogProps) {
    return (
      <WriteTargetDialog
        {...folderWrite.dialogProps}
        onChoose={(mode, remember) => void folderWrite.dialogProps!.onChoose(mode, remember)}
        onCancel={folderWrite.dialogProps.onCancel}
      />
    );
  }

  return (
    <>
    <div className="ps">
      <div className="ps-hd">
        <div>
          <div className="ps-nm">Organize a backup</div>
          <div className="ps-meta"><span>{model ? `${entries.length} programs` : 'No backup open'}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onBack}>← Back</Button>
          <Button variant="outline" onClick={download} disabled={!model || folderWrite.saving}>
            {folderWrite.saving ? 'Saving…' : 'Download reorganized backup'}
          </Button>
        </div>
      </div>

      {(planError || reorg.error) && <p className="ps-sub on-error">{planError || reorg.error}</p>}
      {saveStatus && !planError && !reorg.error && <p className="ps-sub">{saveStatus}</p>}

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
        <OrganizeGrids entries={entries} reorg={reorg} />
      )}
      </div>
    </>
  );
}
