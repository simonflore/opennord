import { parseClaviaFile, type NordProgram } from '../formats';
import { programNameFromFilename } from '../clavia/name';
import { readNs4Bundle } from '../ns4/bundle';
import { readNsmp, type NsmpFile } from '../ns4/nsmp';
import { summarize, isNs4Program } from '../library/entries';
import { classifyFile } from './classify';
import { identifyNordFile } from '../clavia/nord-file';
import { presetKindForTag, type PresetKind } from '../clavia/preset-kind';
import { getErrorMessage } from '../errors';

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
  program: NordProgram;
  bytes: Uint8Array;
  summary?: string;
}

/** A recognized piano-library file — listed by name/size, never decoded. */
export interface ScannedPiano { id: string; name: string; bytes: Uint8Array }

/** A recognized preset file — listed by tag+kind, never decoded. */
export interface ScannedPreset {
  id: string;        // "folder:<path>"
  name: string;
  path: string;
  tag: string;
  kind: PresetKind;
  bytes: Uint8Array;
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
  presets: ScannedPreset[];
  pianos: ScannedPiano[];
  samples: ScannedSample[];
  errors: ScanError[];
}

/**
 * Largest single file we pull whole into memory in the browser via
 * `Blob.arrayBuffer()`. Reading a multi-GB file that way blows the tab's memory
 * budget, and a single such file used to abort the entire scan — so we skip
 * anything larger and report it instead. `.ns4b` bundles are exempt: the folder
 * walk streams them entry-by-entry (`unzip-stream.ts`), so a huge backup never
 * lands in memory whole and is never capped.
 */
export const MAX_READ_BYTES = 1024 ** 3; // 1 GiB

/** Human-readable reason for an oversized, skipped file. */
export function tooLargeReason(size: number): string {
  return `too large to open in the browser (${(size / 1e9).toFixed(1)} GB)`;
}

function reason(err: unknown): string {
  return getErrorMessage(err);
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
  const presets: ScannedPreset[] = [];
  const pianos: ScannedPiano[] = [];
  const samples: ScannedSample[] = [];
  const errors: ScanError[] = [];

  for (const { path, bytes } of files) {
    const kind = classifyFile(path);
    if (!kind) continue;

    try {
      if (kind === 'program') {
        const program = parseClaviaFile(bytes).program;
        program.name = programNameFromFilename(path);
        programs.push({
          id: `folder:${path}`,
          name: program.name ?? path,
          path,
          program,
          bytes,
          summary: program.parsed && isNs4Program(program) ? summarize(program) : undefined,
        });
      } else if (kind === 'bundle') {
        for (const entry of readNs4Bundle(bytes)) {
          programs.push({
            id: `folder:${path}!${entry.path}`,
            name: entry.name,
            path: `${path} → ${entry.path}`,
            program: entry.program,
            bytes: entry.bytes,
            summary: entry.program.parsed && isNs4Program(entry.program) ? summarize(entry.program) : undefined,
          });
        }
      } else if (kind === 'preset') {
        const info = identifyNordFile(bytes);              // real CBIN tag
        const pk = presetKindForTag(info.tag);
        if (pk) presets.push({ id: `folder:${path}`, name: programNameFromFilename(path), path, tag: info.tag, kind: pk, bytes });
      } else if (kind === 'piano') {
        pianos.push({ id: `folder:${path}`, name: programNameFromFilename(path), bytes });
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

  return { programs, presets, pianos, samples, errors };
}
