/**
 * Run "Check this backup" off the main thread. A full check decodes every piano note and
 * CRCs every byte (minutes on a full Piano partition); in a Web Worker the page never
 * stalls, and the main thread only receives progress. Where there are no Workers (tests,
 * very old WebViews) the same `checkBackup` runs inline, pacing itself by elapsed time.
 */
import * as Comlink from 'comlink';
import {
  BackupCheckError, checkBackup, type BackupCheckOptions, type BackupCheckProgress, type BackupCheckReport,
  type BackupCheckWorkerApi,
} from './backup-check';

/** A started worker: the message endpoint plus how to shut it down. */
export interface BackupCheckWorker {
  endpoint: Comlink.Endpoint;
  dispose(): void;
}

function spawnWorker(): BackupCheckWorker | undefined {
  if (typeof Worker === 'undefined') return undefined;
  const worker = new Worker(new URL('./backup-check.worker.ts', import.meta.url), { type: 'module' });
  return { endpoint: worker, dispose: () => worker.terminate() };
}

/**
 * `checkBackup`, in a Web Worker when the browser has them. Same options and report;
 * `signal` stops the worker's check, which still resolves with the partial report.
 * `spawn` is for tests (`undefined` → run inline).
 */
export async function runBackupCheck(
  file: Blob,
  opts: Omit<BackupCheckOptions, 'pace'> = {},
  spawn: () => BackupCheckWorker | undefined = spawnWorker,
): Promise<BackupCheckReport> {
  const worker = spawn();
  if (!worker) return checkBackup(file, opts);
  const remote = Comlink.wrap<BackupCheckWorkerApi>(worker.endpoint);
  const cancel = () => void remote.cancel();
  // Progress travels on its own channel and can land after the report: drop it once settled,
  // or the caller would show a finished check as running again.
  let settled = false;
  const onProgress = opts.onProgress && ((p: BackupCheckProgress) => { if (!settled) opts.onProgress!(p); });
  try {
    // Messages arrive in order, so a cancel sent after this call reaches the running check.
    const report = remote.check(file, opts.playPianos !== false, onProgress && Comlink.proxy(onProgress));
    if (opts.signal?.aborted) cancel();
    else opts.signal?.addEventListener('abort', cancel, { once: true });
    return await report;
  } catch (e) {
    // Only an Error's name and message cross the worker boundary: restore the class the UI shows as is.
    if (e instanceof Error && e.name === 'BackupCheckError') throw new BackupCheckError(e.message);
    throw e;
  } finally {
    settled = true;
    opts.signal?.removeEventListener('abort', cancel);
    remote[Comlink.releaseProxy]();
    worker.dispose();
  }
}
