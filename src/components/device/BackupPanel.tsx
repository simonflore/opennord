import { useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import { backup, restore, type RestoreResult } from '../../lib/device/backup';

/** Backup → download a .ns4b; Restore → confirm, write, summarize. */
export function BackupPanel({ session, deviceName, onAfterRestore }: {
  session: NordSession;
  deviceName: string;
  onAfterRestore: () => void;
}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingZip, setPendingZip] = useState<{ bytes: Uint8Array; fileCount: number } | null>(null);

  async function runBackup() {
    if (busy) return;
    setBusy(true);
    setStatus('Backing up…');
    try {
      const bytes = await backup(session, (done, total) => setStatus(`Backing up ${done} of ${total}…`));
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OpenNord Backup ${new Date().toISOString().slice(0, 10)}.ns4b`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Backup downloaded.');
    } catch (e) {
      setStatus(`Backup failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function pickRestore(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    // count restorable entries cheaply: any non-meta entry; the exact count is shown after.
    setPendingZip({ bytes, fileCount: 0 });
    setStatus('');
  }

  async function confirmRestore() {
    if (!pendingZip || busy) return;
    setBusy(true);
    setStatus('Restoring…');
    try {
      const result: RestoreResult = await restore(session, pendingZip.bytes, (done, total) => setStatus(`Restoring ${done} of ${total}…`));
      const skipped = result.skippedFactory ? `; skipped ${result.skippedFactory} factory files` : '';
      const failed = result.failures.length ? `; ${result.failures.length} couldn't be written` : '';
      setStatus(`Restored ${result.restored} files${skipped}${failed}.`);
      setPendingZip(null);
      onAfterRestore();
    } catch (e) {
      setStatus(`Restore failed: ${e instanceof Error ? e.message : String(e)}`);
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
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={confirmRestore} disabled={busy}
            style={{ padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 700, border: '1px solid #c8102e', background: '#c8102e', color: '#fff' }}>
            {busy ? 'Restoring…' : 'Restore'}
          </button>
          <button onClick={() => setPendingZip(null)} disabled={busy}
            style={{ padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', border: '1px solid #ddd' }}>
            Cancel
          </button>
        </div>
        {status && <p className="ps-sub" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={runBackup} disabled={busy}
        style={{ padding: '8px 12px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, border: '1px solid #c8102e', color: '#ff7a72', background: 'transparent' }}>
        Back up
      </button>
      <label style={{ padding: '8px 12px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, border: '1px solid #c8102e', color: '#ff7a72' }}>
        Restore…
        <input type="file" accept=".ns4b" style={{ display: 'none' }} disabled={busy}
          onChange={(ev) => ev.target.files?.[0] && void pickRestore(ev.target.files[0])} />
      </label>
      {status && <span className="ps-sub" style={{ margin: 0 }}>{status}</span>}
    </div>
  );
}
