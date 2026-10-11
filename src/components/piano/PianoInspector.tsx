import { useEffect, useRef, useState } from 'react';
import type { PianoEntry } from '@/lib/library/piano-entries';
import { pullPiano } from '@/lib/device/pianos';
import { downloadBytes } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import type { NordSession } from '@/lib/device/session';
import { Button } from '@/components/ui';
import { useFolder } from '@/lib/folder/FolderContext';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';
import { noteName } from '@/lib/ns4/sample-view';
import { PianoListen } from './PianoListen';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Detail for a recognized piano: metadata, factory deep-link, local audition, download (with progress). */
export function PianoInspector({ entry, session }: { entry: PianoEntry; session: NordSession | null }) {
  const folder = useFolder();
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState('');
  // Bytes to audition: a local file has them; a backup entry loads them on request.
  const [listenBytes, setListenBytes] = useState<Uint8Array | null>(entry.bytes ?? null);
  useEffect(() => { setListenBytes(entry.bytes ?? null); }, [entry.id, entry.bytes]);
  // The piano on show now: a load that finishes after the user picked another is dropped,
  // so A's recordings never play under B's name (PianosSplit also remounts per piano).
  const shownId = useRef(entry.id);
  useEffect(() => { shownId.current = entry.id; }, [entry.id]);

  async function loadSounds() {
    if (busy || !entry.backupRef) return;
    const id = entry.id;
    setError(''); setBusy(true);
    try {
      const bytes = await extractBackupEntry(folder, entry.backupRef);
      if (shownId.current === id) setListenBytes(bytes);
    } catch (e) {
      if (shownId.current === id) setError(`Couldn't load ${entry.name}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (busy) return;
    setError(''); setBusy(true); setPct(null);
    try {
      let bytes = entry.bytes ?? null;
      if (!bytes && entry.backupRef) {
        bytes = await extractBackupEntry(folder, entry.backupRef);
      } else if (!bytes && entry.device && entry.partition != null && session) {
        bytes = await pullPiano(session, entry.device, (done, total) => setPct(total ? Math.round((done / total) * 100) : 0));
      }
      if (!bytes) throw new Error('Connect your Nord to download this piano.');
      downloadBytes(bytes, `${entry.name}.npno`);
    } catch (e) {
      setError(`Couldn't download ${entry.name}: ${msg(e)}`);
    } finally {
      setBusy(false); setPct(null);
    }
  }

  const sourceLabel =
    entry.source === 'nord'
      ? `On Nord${entry.slot ? ` · ${entry.slot}` : ''}`
      : entry.source === 'backup'
        ? `From backup${entry.size != null ? ` · ${formatBytes(entry.size)}` : ''}`
        : `Local file${entry.size != null ? ` · ${formatBytes(entry.size)}` : ''}`;

  // Librarian detail parsed from the .npno header (folder pianos): version + multisample layout.
  const detail = [
    entry.version && `Nord Piano v${entry.version}`,
    entry.sampleCount != null && `${entry.sampleCount} sampled note${entry.sampleCount === 1 ? '' : 's'}`,
    entry.keyLow != null && entry.keyHigh != null && `${noteName(entry.keyLow)}–${noteName(entry.keyHigh)}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="ps" style={{ maxWidth: 460 }}>
      {/* Identity on the LCD: the piano's name, where it lives, and its layout. */}
      <div className="ps-lcd ps-lcd-id" style={{ marginBottom: 12 }}>
        <h2 className="big">{entry.name}</h2>
        <div>Piano library · {sourceLabel}</div>
        {detail && <div>{detail}</div>}
      </div>
      {entry.factory && (
        <p className="ps-sub">
          This is a Nord factory piano.{' '}
          <a href={entry.factory.url} target="_blank" rel="noreferrer" style={{ color: 'var(--deps-ink)' }}>
            Get it from Nord
          </a>
          {entry.factory.sizeDescription ? ` (${entry.factory.sizeDescription})` : ''}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={() => void download()} disabled={busy}>
          {busy ? (pct !== null ? `Pulling… ${pct}%` : 'Working…') : 'Download'}
        </Button>
        {!listenBytes && entry.backupRef && (
          <Button onClick={() => void loadSounds()} disabled={busy}>Load sounds</Button>
        )}
      </div>
      {listenBytes && <PianoListen bytes={listenBytes} />}
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
