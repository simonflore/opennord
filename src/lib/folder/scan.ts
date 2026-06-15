import { parseNs4Program } from '../ns4/parse';
import { programNameFromFilename } from '../ns4/name';
import { readNs4Bundle } from '../ns4/bundle';
import { readNsmp, type NsmpFile } from '../ns4/nsmp';
import { summarize } from '../library/entries';
import type { NS4Program } from '../ns4/types';
import { classifyFile } from './classify';

/** A flat file pulled from the folder — what both access paths produce. */
export interface RawFile {
  /** Folder-relative path, e.g. `"Bank 1/Lead.ns4p"`. */
  path: string;
  bytes: Uint8Array;
}

/** A program (or preset, or bundle-extracted program) for the Library. */
export interface ScannedProgram {
  id: string;        // "folder:<path>" or "folder:<bundlePath>!<innerPath>"
  name: string;
  path: string;      // human-facing source path
  program: NS4Program;
  bytes: Uint8Array;
  summary?: string;
}

/** A sample for the Samples tab. */
export interface ScannedSample {
  id: string;        // "folder:<path>"
  name: string;
  path: string;
  file: NsmpFile;
  bytes: Uint8Array;
}

export interface ScanError {
  path: string;
  reason: string;
}

export interface ScanResult {
  programs: ScannedProgram[];
  samples: ScannedSample[];
  errors: ScanError[];
}

/**
 * Largest single file we pull into memory in the browser. Reading a multi-GB
 * file (e.g. a full `.ns4b` backup) via `Blob.arrayBuffer()` either blows the
 * tab's memory budget or freezes the UI thread on the synchronous unzip — and a
 * single such file used to abort the entire scan. We skip anything larger and
 * report it instead. Streaming large bundles is future work.
 */
export const MAX_READ_BYTES = 1024 ** 3; // 1 GiB

/** Human-readable reason for an oversized, skipped file. */
export function tooLargeReason(size: number): string {
  return `too large to open in the browser (${(size / 1e9).toFixed(1)} GB)`;
}

function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Classify and decode every file in a flat folder listing.
 *
 * Pure and tolerant: a failure on one file (unreadable bundle, bad bytes) lands
 * in `errors` and never aborts the rest. IDs are path-derived so repeated scans
 * are stable and reconcile by replacement.
 */
export function scanFiles(files: RawFile[]): ScanResult {
  const programs: ScannedProgram[] = [];
  const samples: ScannedSample[] = [];
  const errors: ScanError[] = [];

  for (const { path, bytes } of files) {
    const kind = classifyFile(path);
    if (!kind) continue;

    try {
      if (kind === 'program') {
        const program = parseNs4Program(bytes);
        program.name = programNameFromFilename(path);
        programs.push({
          id: `folder:${path}`,
          name: program.name ?? path,
          path,
          program,
          bytes,
          summary: program.parsed ? summarize(program) : undefined,
        });
      } else if (kind === 'bundle') {
        for (const entry of readNs4Bundle(bytes)) {
          programs.push({
            id: `folder:${path}!${entry.path}`,
            name: entry.name,
            path: `${path} → ${entry.path}`,
            program: entry.program,
            bytes: entry.bytes,
            summary: entry.program.parsed ? summarize(entry.program) : undefined,
          });
        }
      } else {
        const file = readNsmp(bytes);
        samples.push({
          id: `folder:${path}`,
          name: programNameFromFilename(path),
          path,
          file,
          bytes,
        });
      }
    } catch (err) {
      errors.push({ path, reason: reason(err) });
    }
  }

  return { programs, samples, errors };
}
