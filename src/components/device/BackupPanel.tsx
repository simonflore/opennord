import { useEffect, useRef, useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import {
  backup, backsUpEverything, backupFilename, backupProgressText, canRestore, restore, restoreSummary, type RestoreResult,
} from '../../lib/device/backup';
import { resolveFactory } from '../../lib/device/factory';
import { downloadBlob } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { plural } from '../../lib/plural';
import { Button, FileInput } from '../ui';
import { analyzeRestore, libraryLeftOutWhy, type RestoreImpact as Impact } from '../../lib/device/restore-diff';
import { RestoreImpact } from './RestoreImpact';
import { readZipDirectory } from '../../lib/clavia/backup/zip-directory';
import { libraryForPartition, partitionForPath } from '../../lib/device/ns4b';
import type { LibraryKind } from '../../lib/device/write-guard';
import { useLibraryWrites } from './useLibraryWrites';

/** Backup → download a .ns4b; Restore → confirm, write, summarize. */
export function BackupPanel({
  session, deviceName, onAfterRestore, onSessionLost, startBackup = false, onBusyChange, libraryWrites,
}: {
  session: NordSession;
  deviceName: string;
  onAfterRestore: () => void;
  /**
   * The Nord stopped answering a write mid-restore (`sessionLost`): drop the session
   * now (DeviceContext `markLost`), before anything else reads from it. The panel
   * keeps the restore's summary and offers nothing more on this session.
   */
  onSessionLost?: () => void;
  /** Start backing up as soon as it shows (the device menu's "Back up Nord"). */
  startBackup?: boolean;
  /** Told when a backup or restore starts and ends, so a dialog around it can't close mid-way. */
  onBusyChange?: (busy: boolean) => void;
  /** For tests: the sample and piano gate; defaults to `libraryWritesOn`, following the /dev/hardware switch. */
  libraryWrites?: Record<LibraryKind, boolean>;
}) {
  const [status, setStatus] = useState('');
  // Set once the Nord stopped answering: this session is gone, only the summary stays.
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  // The picked .ns4b stays a File — real backups run multi-GB, so restore()
  // reads it via ranged slices instead of materializing it in memory.
  const [pendingZip, setPendingZip] = useState<File | null>(null);
  // Samples and pianos left out while their writes are off, whose names match a factory download.
  const [skipped, setSkipped] = useState<{ path: string; name: string; url: string }[]>([]);
  const [impact, setImpact] = useState<Impact | 'loading' | 'error' | null>(null);
  // The libraries this restore removes from and replaces in, read from the archive's directory (not the preview).
  const [replacing, setReplacing] = useState<LibraryKind[]>([]);
  const liveWrites = useLibraryWrites();
  const writes = libraryWrites ?? liveWrites;
  // Only a full backup (a Stage 4's) holds samples and pianos an update could copy.
  const updatable = backsUpEverything(session);

  /** `previous`: an earlier .ns4b whose unchanged samples and pianos are copied, not read off the Nord again. */
  async function runBackup(previous?: File) {
    if (busy) return;
    setBusy(true);
    setStatus('Backing up…');
    try {
      let reuse: { reused: number; previousUnreadable: boolean } | null = null;
      const blob = await backup(session, (p) => setStatus(backupProgressText(p)), undefined, {
        previous, onReuse: (stats) => { reuse = stats; },
      });
      downloadBlob(blob, backupFilename(session, 'OpenNord Backup'));
      const done = backsUpEverything(session)
        ? 'Backup downloaded.'
        : 'Backup downloaded: programs only. OpenNord doesn’t yet know where this model keeps its other settings and presets.';
      setStatus(`${done}${reuseSentence(reuse)}`);
    } catch (e) {
      setStatus(`Backup failed: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  // Once per mount, even under StrictMode's double effects: two backups would read the Nord twice.
  const started = useRef(false);
  useEffect(() => {
    if (!startBackup || started.current) return;
    started.current = true;
    void runBackup();
    // runBackup reads the latest state itself; this only fires on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startBackup]);

  async function pickRestore(file: File) {
    setPendingZip(file);
    setStatus('');
    setSkipped([]); // clear any prior restore's skipped list
    setReplacing([]);
    setImpact('loading');
    setReplacing(await librariesReplaced(file, (kind) => libraryLeftOutWhy(session, kind, writes[kind]) === null));
    try {
      setImpact(await analyzeRestore(session, file, writes));
    } catch {
      setImpact('error'); // preview is best-effort — never blocks the restore
    }
  }

  async function confirmRestore() {
    if (!pendingZip || busy) return;
    setBusy(true);
    setStatus('Restoring…');
    try {
      const result: RestoreResult = await restore(
        session, pendingZip, (done, total) => setStatus(`Restoring ${done} of ${total}…`), { libraryWrites: writes },
      );
      setSkipped(factoryDownloads(result));
      setStatus(restoreSummary(result));
      setPendingZip(null);
      setImpact(null);
      // A Nord that stopped answering mid-write must be reconnected before it's read again.
      if (result.sessionLost) {
        setGone(true);
        onSessionLost?.();
      } else {
        onAfterRestore();
      }
    } catch (e) {
      setStatus(`Restore failed: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  const factoryList = skipped.length > 0 && (
    <div className="ps-sub">
      Of the samples and pianos that weren’t restored, these are factory files you can download from Nord,
      then install with Nord Sound Manager:
      <ul className="mt-1 mb-0 pl-4.5">
        {skipped.map(({ path, name, url }) => (
          <li key={path}>
            <a href={url} target="_blank" rel="noreferrer" title="Official Nord download">{name}</a>
          </li>
        ))}
      </ul>
    </div>
  );

  if (gone) {
    return (
      <div className="flex flex-col gap-2">
        {/* `m-0!`: .ps-sub is unlayered CSS and would win over a plain utility. */}
        <p className="ps-sub m-0!" role="status">{status}</p>
        {factoryList}
      </div>
    );
  }

  if (pendingZip) {
    return (
      <div className="ps" style={{ maxWidth: 480 }}>
        <div className="ps-nm">Restore to {deviceName}?</div>
        <p className="ps-sub" style={{ marginTop: 6 }}>
          This writes the backup's user content back to your Nord, overwriting the current programs,
          presets, Live and settings.
          {replacing.length > 0 && ` ${replacedSentence(replacing)}`}
        </p>
        {impact === 'loading' && <p className="ps-sub" style={{ marginTop: 8 }}>Analyzing changes…</p>}
        {impact === 'error' && <p className="ps-sub" style={{ marginTop: 8, color: 'var(--muted)' }}>Couldn't preview changes — you can still restore.</p>}
        {impact && impact !== 'loading' && impact !== 'error' && <RestoreImpact impact={impact} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button variant="primary" onClick={confirmRestore} disabled={busy || impact === 'loading'}>
            {busy ? 'Restoring…' : 'Restore Nord'}
          </Button>
          <Button variant="secondary" onClick={() => { setPendingZip(null); setImpact(null); }} disabled={busy}>Cancel</Button>
        </div>
        {status && <p className="ps-sub" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={() => void runBackup()} disabled={busy}>Back up Nord</Button>
        {updatable && (
          <FileInput accept=".ns4b" disabled={busy} onFile={(f) => void runBackup(f)} className="on-btn on-btn--outline">
            Update a backup…
          </FileInput>
        )}
        {canRestore(session) ? (
          <FileInput accept=".ns4b" disabled={busy} onFile={(f) => void pickRestore(f)} className="on-btn on-btn--outline">
            Restore Nord…
          </FileInput>
        ) : session.canWrite(session.programPartition) && (
          // (When even programs can't be written, the page's "Browsing only" note already says so.)
          <span className="ps-sub" style={{ margin: 0 }}>
            Restoring a backup is off on this keyboard: OpenNord couldn’t confirm where everything in
            it belongs, so it won’t overwrite anything.
          </span>
        )}
        {status && <span className="ps-sub" style={{ margin: 0 }}>{status}</span>}
      </div>
      {updatable && (
        <p className="ps-sub m-0!">
          “Update a backup…” copies the samples and pianos you already backed up (same name, place and size)
          from the backup you pick, and reads the rest from your Nord. Pick a backup of this Nord. For a
          completely fresh copy, use Back up Nord.
        </p>
      )}
      {factoryList}
    </div>
  );
}

/** What an update did with the earlier backup, as a sentence to follow "Backup downloaded."; empty for a plain backup. */
function reuseSentence(reuse: { reused: number; previousUnreadable: boolean } | null): string {
  if (!reuse) return '';
  if (reuse.previousUnreadable) return ' Couldn’t read that backup, so everything was read from your Nord.';
  if (reuse.reused === 0) return ' Nothing could be copied from your earlier backup, so everything was read from your Nord.';
  return ` ${plural(reuse.reused, 'sample or piano', 'samples and pianos')} copied from your earlier backup; the rest read from your Nord.`;
}

/**
 * Official downloads for the samples and pianos a restore left out while their writes
 * are off, when their names match a factory file. Restored files and user files get none.
 */
function factoryDownloads(result: RestoreResult): { path: string; name: string; url: string }[] {
  return result.leftOut.flatMap(({ path, kind }) => {
    const name = path.replace(/^.*\//, '');
    const match = resolveFactory(name, kind === 'piano' ? 'npno' : 'nsmp4');
    return match ? [{ path, name, url: match.url }] : [];
  });
}

/**
 * The libraries a restore of `file` writes to (`writable` decides each kind), from the
 * archive's directory alone: no file is read. Empty when the directory can't be read,
 * since the restore then stops before it changes anything.
 */
async function librariesReplaced(file: File, writable: (kind: LibraryKind) => boolean): Promise<LibraryKind[]> {
  try {
    const kinds = new Set<LibraryKind>();
    for (const e of await readZipDirectory(file)) {
      const partition = partitionForPath(e.path);
      const kind = partition === null ? null : libraryForPartition(partition);
      if (kind !== null && !e.path.endsWith('/') && writable(kind)) kinds.add(kind);
    }
    return (['sample', 'piano'] as const).filter((k) => kinds.has(k));
  } catch {
    return [];
  }
}

/** The restore's by-name rule for the libraries it writes, with the backup prompt. */
function replacedSentence(kinds: LibraryKind[]): string {
  const what = kinds.length === 2 ? 'Samples and pianos' : kinds[0] === 'sample' ? 'Samples' : 'Pianos';
  return `${what} on your Nord that aren’t in this backup are removed, and ones with the same name are replaced. Make a fresh backup first.`;
}
