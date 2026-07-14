import * as Comlink from 'comlink';
import { mainThreadScanner, type BatchSink, type BundleDescriptor } from './pipeline';
import type { FolderSource } from './source';

// One session per worker instance; mirrors the main-thread scanner's statefulness
// (expandBundles reuses the bundles the preceding scanLoose found).
const session = mainThreadScanner();

const api = {
  scanLoose(source: FolderSource, onBatch: BatchSink): Promise<BundleDescriptor[]> {
    return session.scanLoose(source, onBatch);
  },
  expandBundles(paths: string[], onBatch: BatchSink): Promise<void> {
    return session.expandBundles(paths, onBatch);
  },
};

export type ScanWorkerApi = typeof api;
Comlink.expose(api);
