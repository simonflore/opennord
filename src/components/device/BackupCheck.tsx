import { useEffect, useRef, useState } from 'react';
import {
  checkBackup, summarizeBackupCheck, type BackupCheckProgress, type BackupCheckReport,
} from '../../lib/ns4/backup-check';
import { getErrorMessage } from '../../lib/errors';
import { Button } from '../ui';

/**
 * "Check this backup": reads every file in an open `.ns4b` — programs, Live, presets,
 * settings, pianos (every recorded note decoded) and samples — and says, in plain
 * words, whether it's all intact. Read-only and local; nothing is written or sent.
 */
export function BackupCheck({ file }: { file: Blob }) {
  const [progress, setProgress] = useState<BackupCheckProgress | null>(null);
  const [report, setReport] = useState<BackupCheckReport | null>(null);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);

  // A different backup invalidates the last result; leaving the page stops a running check.
  useEffect(() => { setReport(null); setError(''); }, [file]);
  useEffect(() => () => abort.current?.abort(), []);

  async function run() {
    if (abort.current) return;
    const ac = new AbortController();
    abort.current = ac;
    setReport(null); setError(''); setProgress({ doneBytes: 0, totalBytes: 0, current: '' });
    try {
      setReport(await checkBackup(file, { signal: ac.signal, onProgress: setProgress }));
    } catch (e) {
      setError(`Couldn't check this backup: ${getErrorMessage(e)}`);
    } finally {
      abort.current = null;
      setProgress(null);
    }
  }

  const pct = progress && progress.totalBytes ? Math.floor((progress.doneBytes / progress.totalBytes) * 100) : 0;
  const summary = report ? summarizeBackupCheck(report) : null;

  return (
    <section aria-label="Check this backup" className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {progress ? (
          <>
            <Button variant="secondary" onClick={() => abort.current?.abort()}>Stop checking</Button>
            <span role="status" aria-live="polite" className="text-sm text-dim">
              Checking{progress.current ? ` ${progress.current}` : ''}… {pct}%
            </span>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => void run()}>Check backup</Button>
            {!summary && (
              <span className="text-sm text-dim">
                Reads every file and plays through each piano to make sure nothing is damaged.
              </span>
            )}
          </>
        )}
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}
      {summary && report && (
        <div role="status" className="flex flex-col gap-1">
          <p className={summary.ok ? 'text-sm font-semibold text-ink' : 'text-sm font-semibold text-warn'}>{summary.headline}</p>
          <p className="text-sm text-dim">{summary.contents}</p>
          {summary.detail && <p className="text-sm text-dim">{summary.detail}</p>}
          {report.problems.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {report.problems.map((p) => (
                <li key={p.path} className="text-sm text-ink">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-dim"> — {p.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
