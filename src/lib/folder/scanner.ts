import * as Comlink from 'comlink';
import { mainThreadScanner, type Scanner, type BatchSink, type BundleDescriptor } from './pipeline';
import type { FolderSource } from './source';
import type { ScanWorkerApi } from './scan.worker';

/**
 * A {@link Scanner} that runs the pipeline inside a Web Worker (zero main-thread
 * CPU — no parse/unzip jank on a large library), wrapped with Comlink. Batch
 * callbacks cross the worker boundary via `Comlink.proxy`. Falls back to the
 * main-thread scanner where Workers are unavailable (very old WebViews).
 */
export function createScanner(): Scanner {
  if (typeof Worker === 'undefined') return mainThreadScanner();
  const worker = new Worker(new URL('./scan.worker.ts', import.meta.url), { type: 'module' });
  const remote = Comlink.wrap<ScanWorkerApi>(worker);
  return {
    scanLoose: (source: FolderSource, onBatch: BatchSink): Promise<BundleDescriptor[]> =>
      remote.scanLoose(source, Comlink.proxy(onBatch)),
    expandBundles: (paths: string[], onBatch: BatchSink): Promise<void> =>
      remote.expandBundles(paths, Comlink.proxy(onBatch)),
    dispose: () => worker.terminate(),
  };
}
