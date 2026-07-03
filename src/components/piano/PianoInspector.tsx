import { useState } from 'react';
import type { PianoEntry } from '@/lib/library/piano-entries';
import { pullPiano } from '@/lib/device/pianos';
import { downloadBytes } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import type { NordSession } from '@/lib/device/session';
import { Button } from '@/components/ui';
import { useFolder } from '@/lib/folder/FolderContext';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';
import { noteName } from '@/lib/ns4/sample-view';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Thin, decode-free detail for a recognized piano: metadata, factory deep-link, download (with progress). */
export function PianoInspector({ entry, session }: { entry: PianoEntry; session: NordSession | null }) {
  const folder = useFolder();
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState('');

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
      ? ` · On Nord${entry.slot ? ` · ${entry.slot}` : ''}`
      : entry.source === 'backup'
        ? ` · From backup${entry.size != null ? ` · ${formatBytes(entry.size)}` : ''}`
        : ` · Local file${entry.size != null ? ` · ${formatBytes(entry.size)}` : ''}`;

  // Librarian detail parsed from the .npno header (folder pianos): version + multisample layout.
  const detail = [
    entry.version && `Nord Piano v${entry.version}`,
    entry.sampleCount != null && `${entry.sampleCount} sampled note${entry.sampleCount === 1 ? '' : 's'}`,
    entry.keyLow != null && entry.keyHigh != null && `${noteName(entry.keyLow)}–${noteName(entry.keyHigh)}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="ps" style={{ maxWidth: 460 }}>
      <div className="ps-nm">{entry.name}</div>
      <p className="ps-sub" style={{ marginTop: 6 }}>
        Piano library{sourceLabel}
      </p>
      {detail && <p className="ps-sub" style={{ marginTop: 2 }}>{detail}</p>}
      {entry.factory && (
        <p className="ps-sub">
          This is a Nord factory piano.{' '}
          <a href={entry.factory.url} target="_blank" rel="noreferrer" style={{ color: 'var(--deps-ink)' }}>
            Get it from Nord
          </a>
          {entry.factory.sizeDescription ? ` (${entry.factory.sizeDescription})` : ''}
        </p>
      )}
      <Button variant="primary" onClick={() => void download()} disabled={busy}>
        {busy ? (pct !== null ? `Pulling… ${pct}%` : 'Working…') : 'Download'}
      </Button>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
