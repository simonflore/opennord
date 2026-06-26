import { locateNordFiles, type FolderSource, type Located } from './source';
import {
  scanFiles, MAX_READ_BYTES, tooLargeReason,
  type RawFile, type ScannedProgram, type ScannedPreset, type ScannedPiano, type ScannedSample, type ScanError,
} from './scan';
import { streamUnzip } from './unzip-stream';
import { isBundleProgramEntry } from '../ns4/bundle';
import { getErrorMessage } from '../errors';

/** A chunk of decoded results emitted as a scan progresses. */
export interface ScanBatch { programs: ScannedProgram[]; presets: ScannedPreset[]; pianos: ScannedPiano[]; samples: ScannedSample[]; errors: ScanError[]; }
/** A detected `.ns4b` backup — name + size only, never its contents. */
export interface BundleDescriptor { path: string; size: number; }
export type BatchSink = (batch: ScanBatch) => void;

/** Drives a folder scan in two passes; `expandBundles` reuses the bundles `scanLoose` found. */
export interface Scanner {
  scanLoose(source: FolderSource, onBatch: BatchSink): Promise<BundleDescriptor[]>;
  expandBundles(paths: string[], onBatch: BatchSink): Promise<void>;
  dispose?(): void;
}

/** Result rows are flushed to the sink every BATCH_SIZE files to bound chatter. */
export const BATCH_SIZE = 16;

function errBatch(path: string, reason: string): ScanBatch {
  return { programs: [], presets: [], pianos: [], samples: [], errors: [{ path, reason }] };
}

/** Buffers RawFiles, parsing + flushing via scanFiles every BATCH_SIZE. */
function makeBuffer(onBatch: BatchSink) {
  const buf: RawFile[] = [];
  const flush = () => { if (buf.length) onBatch(scanFiles(buf.splice(0, buf.length))); };
  const push = (f: RawFile) => { buf.push(f); if (buf.length >= BATCH_SIZE) flush(); };
  return { push, flush };
}

class MainThreadScanner implements Scanner {
  private bundles = new Map<string, Extract<Located, { kind: 'bundle' }>>();

  async scanLoose(source: FolderSource, onBatch: BatchSink): Promise<BundleDescriptor[]> {
    this.bundles.clear();
    const descriptors: BundleDescriptor[] = [];
    const { push, flush } = makeBuffer(onBatch);
    for await (const loc of locateNordFiles(source)) {
      if (loc.kind === 'bundle') {
        this.bundles.set(loc.path, loc);
        descriptors.push({ path: loc.path, size: loc.size });
        continue;
      }
      if (loc.size > MAX_READ_BYTES) { onBatch(errBatch(loc.path, tooLargeReason(loc.size))); continue; }
      try { push({ path: loc.path, bytes: await loc.bytes() }); }
      catch (err) { onBatch(errBatch(loc.path, getErrorMessage(err))); }
    }
    flush();
    return descriptors;
  }

  async expandBundles(paths: string[], onBatch: BatchSink): Promise<void> {
    const { push, flush } = makeBuffer(onBatch);
    for (const path of paths) {
      const bundle = this.bundles.get(path);
      if (!bundle) continue;
      try {
        await streamUnzip(
          bundle.stream(),
          (entry) => push({ path: `${path}!${entry.path}`, bytes: entry.bytes }),
          isBundleProgramEntry,
        );
      } catch (err) {
        flush(); // emit whatever decoded before the failure
        onBatch(errBatch(path, getErrorMessage(err)));
      }
    }
    flush();
  }
}

/** A scanner that runs entirely on the calling thread (used before the worker lands, and in tests). */
export function mainThreadScanner(): Scanner {
  return new MainThreadScanner();
}
