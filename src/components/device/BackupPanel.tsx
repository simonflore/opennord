import { useEffect, useRef, useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import { backup, backsUpEverything, backupFilename, canRestore, restore, type RestoreResult } from '../../lib/device/backup';
import { resolveFactory } from '../../lib/device/factory';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { Button, FileInput } from '../ui';
import { analyzeRestore, type RestoreImpact as Impact } from '../../lib/device/restore-diff';
import { RestoreImpact } from './RestoreImpact';

/** Backup → download a .ns4b; Restore → confirm, write, summarize. */
export function BackupPanel({ session, deviceName, onAfterRestore, startBackup = false, onBusyChange }: {
  session: NordSession;
  deviceName: string;
  onAfterRestore: () => void;
  /** Start backing up as soon as it shows (the device menu's "Back up Nord"). */
  startBackup?: boolean;
  /** Told when a backup or restore starts and ends, so a dialog around it can't close mid-way. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  // The picked .ns4b stays a File — real backups run multi-GB, so restore()
  // reads it via ranged slices instead of materializing it in memory.
  const [pendingZip, setPendingZip] = useState<File | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [impact, setImpact] = useState<Impact | 'loading' | 'error' | null>(null);

  async function runBackup() {
    if (busy) return;
    setBusy(true);
    setStatus('Backing up…');
    try {
      const bytes = await backup(session, (done, total) => setStatus(`Backing up ${done} of ${total}…`));
      downloadBytes(bytes, backupFilename(session, 'OpenNord Backup'));
      setStatus(backsUpEverything(session)
        ? 'Backup downloaded.'
        : 'Backup downloaded: programs only. OpenNord doesn’t yet know where this model keeps its other settings and presets.');
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
    setImpact('loading');
    try {
      setImpact(await analyzeRestore(session, file));
    } catch {
      setImpact('error'); // preview is best-effort — never blocks the restore
    }
  }

  async function confirmRestore() {
    if (!pendingZip || busy) return;
    setBusy(true);
    setStatus('Restoring…');
    try {
      const result: RestoreResult = await restore(session, pendingZip, (done, total) => setStatus(`Restoring ${done} of ${total}…`));
      setSkipped(result.skippedFactoryFiles);
      const skippedMsg = result.skippedFactory ? `; skipped ${result.skippedFactory} factory files` : '';
      const failed = result.failures.length ? `; ${result.failures.length} couldn't be written` : '';
      setStatus(`Restored ${result.restored} files${skippedMsg}${failed}.`);
      setPendingZip(null);
      setImpact(null);
      onAfterRestore();
    } catch (e) {
      setStatus(`Restore failed: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (pendingZip) {
    return (
      <div className="ps" style={{ maxWidth: 480 }}>
        <div className="ps-nm">Restore to {deviceName}?</div>
        <p className="ps-sub" style={{ marginTop: 6 }}>
          This writes the backup's user content back to your Nord, overwriting the current programs,
          presets, Live and settings. Factory sample files in the backup are skipped.
        </p>
        {impact === 'loading' && <p className="ps-sub" style={{ marginTop: 8 }}>Analyzing changes…</p>}
        {impact === 'error' && <p className="ps-sub" style={{ marginTop: 8, color: 'var(--muted)' }}>Couldn't preview changes — you can still restore.</p>}
        {impact && impact !== 'loading' && impact !== 'error' && <RestoreImpact impact={impact} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button variant="primary" onClick={confirmRestore} disabled={busy}>
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
        <Button variant="outline" onClick={runBackup} disabled={busy}>Back up Nord</Button>
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
      {skipped.length > 0 && (
        <div className="ps-sub">
          Factory libraries aren't restored over USB — download from Nord, then install with Nord Sound Manager:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {skipped.map((path) => {
              const name = path.replace(/^.*\//, '');
              const ext = name.toLowerCase().endsWith('.npno') ? 'npno' : 'nsmp4';
              const match = resolveFactory(name, ext);
              return (
                <li key={path}>
                  {match
                    ? <a href={match.url} target="_blank" rel="noreferrer" title="Official Nord download">{name}</a>
                    : name}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
