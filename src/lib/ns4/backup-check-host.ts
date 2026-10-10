/**
 * Run "Check this backup" off the main thread. A full check decodes every piano note and
 * CRCs every byte (minutes on a full Piano partition); in a Web Worker the page never
 * stalls, and the main thread only receives progress. Where there are no Workers (tests,
 * very old WebViews), or the worker can't start, the same `checkBackup` runs inline,
 * pacing itself by elapsed time.
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
  try {
    const worker = new Worker(new URL('./backup-check.worker.ts', import.meta.url), { type: 'module' });
    return { endpoint: worker, dispose: () => worker.terminate() };
  } catch {
    return undefined; // a content policy that forbids workers, say: run inline
  }
}

/** The worker died: it failed to load, crashed, or sent a message that can't be read. */
class WorkerFailed extends Error {}

/**
 * `checkBackup`, in a Web Worker when the browser has them. Same options and report;
 * `signal` stops the worker's check, which still resolves with the partial report.
 * A worker that fails before it reports anything (it couldn't load) falls back to the
 * inline check; one that fails mid-check rejects, so the caller never waits forever.
 * `spawn` is for tests (`undefined` → run inline).
 */
export async function runBackupCheck(
  file: Blob,
  opts: Omit<BackupCheckOptions, 'pace'> = {},
  spawn: () => BackupCheckWorker | undefined = spawnWorker,
): Promise<BackupCheckReport> {
  const worker = spawn();
  if (!worker) return checkBackup(file, opts);
  let answered = false;
  try {
    return await checkInWorker(worker, file, opts, () => { answered = true; });
  } catch (e) {
    if (e instanceof WorkerFailed && !answered) return checkBackup(file, opts);
    throw e;
  }
}

async function checkInWorker(
  worker: BackupCheckWorker, file: Blob, opts: Omit<BackupCheckOptions, 'pace'>, onAnswer: () => void,
): Promise<BackupCheckReport> {
  const remote = Comlink.wrap<BackupCheckWorkerApi>(worker.endpoint);
  const cancel = () => void remote.cancel();
  // Comlink only listens for replies: a worker that fails to load or crashes never sends one.
  let fail!: (e: WorkerFailed) => void;
  const failed = new Promise<never>((_, reject) => { fail = reject; });
  const onError = (ev: Event) => {
    ev.preventDefault(); // handled here: keep it out of the page's uncaught errors
    fail(new WorkerFailed((ev as ErrorEvent).message || 'The backup check stopped unexpectedly.'));
  };
  worker.endpoint.addEventListener('error', onError);
  worker.endpoint.addEventListener('messageerror', onError);
  // Progress travels on its own channel and can land after the report: drop it once settled,
  // or the caller would show a finished check as running again.
  let settled = false;
  const onProgress = (p: BackupCheckProgress) => { onAnswer(); if (!settled) opts.onProgress?.(p); };
  try {
    // Messages arrive in order, so a cancel sent after this call reaches the running check.
    const report = remote.check(file, opts.playPianos !== false, Comlink.proxy(onProgress));
    if (opts.signal?.aborted) cancel();
    else opts.signal?.addEventListener('abort', cancel, { once: true });
    return await Promise.race([report, failed]);
  } catch (e) {
    // Only an Error's name and message cross the worker boundary: restore the class the UI shows as is.
    if (e instanceof Error && e.name === 'BackupCheckError') throw new BackupCheckError(e.message);
    throw e;
  } finally {
    settled = true;
    opts.signal?.removeEventListener('abort', cancel);
    worker.endpoint.removeEventListener('error', onError);
    worker.endpoint.removeEventListener('messageerror', onError);
    remote[Comlink.releaseProxy]();
    worker.dispose();
  }
}
