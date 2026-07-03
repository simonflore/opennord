import { useCallback, useState } from 'react';
import { useFolder } from './FolderContext';
import { useWriteBackPref } from '../library/writeBackPrefs';
import { getErrorMessage } from '../errors';

/** One pending "save into the folder" job. */
export interface FolderWriteJob {
  /** Suggested filename including extension. */
  name: string;
  /** Whether a same-named file already exists (drives the dialog's Overwrite option). */
  existing: boolean;
  /** Streams the output bytes into the folder file. */
  write: (w: FileSystemWritableFileStream) => Promise<void>;
}

/**
 * Shared "save into the linked folder, else fall back to a download" flow used by
 * the Backup Organizer and the sample converter. Owns the ask/remember dialog gate
 * and the write-in-progress flag; the caller supplies the per-output streamer and
 * its own download fallback, and renders the dialog from `dialogProps`.
 */
export function useFolderWrite({ onSaved, onFallback }: {
  onSaved: (path: string, folderName: string) => void;
  onFallback: () => void | Promise<void>;
}) {
  const folder = useFolder();
  const pref = useWriteBackPref();
  const [pending, setPending] = useState<FolderWriteJob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runWrite = useCallback(async (job: FolderWriteJob, mode: 'new' | 'overwrite') => {
    setSaving(true);
    try {
      const res = await folder.writeBack(job.name, job.write, { mode });
      if (res.target === 'folder') onSaved(res.path, folder.folderName ?? '');
      else await onFallback();
    } catch (e) {
      // Surface the failure (revoked permission, disk error mid-stream) — a
      // silent stop here reads as "saved" when nothing was written. Kept out
      // of the caller's hands because the dialog path floats this promise.
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [folder, onSaved, onFallback]);

  /** Begin a save: no folder → fallback; policy 'ask' → open the dialog; else write now. */
  const save = useCallback(async (job: FolderWriteJob) => {
    setError(null);
    if (!folder.folderName) { await onFallback(); return; }
    if (pref.mode === 'ask') { setPending(job); return; }
    await runWrite(job, pref.mode);
  }, [folder.folderName, pref.mode, onFallback, runWrite]);

  const choose = useCallback(async (mode: 'new' | 'overwrite', remember: boolean) => {
    const job = pending;
    setPending(null);
    if (!job) return;
    if (remember) pref.setMode(mode);
    await runWrite(job, mode);
  }, [pending, pref, runWrite]);

  const cancel = useCallback(() => setPending(null), []);

  const dialogProps = pending && folder.folderName
    ? { folderName: folder.folderName, existing: pending.existing, onChoose: choose, onCancel: cancel }
    : null;

  return { save, saving, error, dialogProps };
}
