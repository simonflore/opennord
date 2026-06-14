import { useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import { backup, restore, type RestoreResult } from '../../lib/device/backup';
import { resolveFactory } from '../../lib/device/factory';
import { downloadBytes } from '../../lib/download';

/** Backup → download a .ns4b; Restore → confirm, write, summarize. */
export function BackupPanel({ session, deviceName, onAfterRestore }: {
  session: NordSession;
  deviceName: string;
  onAfterRestore: () => void;
}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingZip, setPendingZip] = useState<Uint8Array | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  async function runBackup() {
    if (busy) return;
    setBusy(true);
    setStatus('Backing up…');
    try {
      const bytes = await backup(session, (done, total) => setStatus(`Backing up ${done} of ${total}…`));
      downloadBytes(bytes, `OpenNord Backup ${new Date().toISOString().slice(0, 10)}.ns4b`);
      setStatus('Backup downloaded.');
    } catch (e) {
      setStatus(`Backup failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function pickRestore(file: File) {
    setPendingZip(new Uint8Array(await file.arrayBuffer()));
    setStatus('');
    setSkipped([]); // clear any prior restore's skipped list
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
            style={{ padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 700, border: '1px solid var(--red)', background: 'var(--red)', color: '#fff' }}>
            {busy ? 'Restoring…' : 'Restore'}
          </button>
          <button onClick={() => setPendingZip(null)} disabled={busy}
            style={{ padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', border: '1px solid var(--line)' }}>
            Cancel
          </button>
        </div>
        {status && <p className="ps-sub" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={runBackup} disabled={busy}
          style={{ padding: '8px 12px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, border: '1px solid var(--red)', color: '#ff7a72', background: 'transparent' }}>
          Back up
        </button>
        <label style={{ padding: '8px 12px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, border: '1px solid var(--red)', color: '#ff7a72' }}>
          Restore…
          <input type="file" accept=".ns4b" style={{ display: 'none' }} disabled={busy}
            onChange={(ev) => ev.target.files?.[0] && void pickRestore(ev.target.files[0])} />
        </label>
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
