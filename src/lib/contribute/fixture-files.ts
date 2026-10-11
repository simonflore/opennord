/**
 * The file side of `npm run fixtures:scan` (Node only): find the files to check
 * — `fixtures/<model-id>/…` and, with `NORD_FILES=/some/folder`, every Nord file
 * under that folder — and run fixture-validate.ts over them. Files are only
 * ever opened for reading; a backup is read entry by entry through its ZIP
 * directory, and a file too large to be a program (a sample, a piano) only for
 * its header.
 */
import * as fs from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { MODELS, type NordModelId } from '../clavia/partitions';
import {
  errorRow, isArchiveName, isNordFileName, validateArchive, validateBytes, MAX_PROGRAM_ENTRY_BYTES, type ValidationRow,
} from './fixture-validate';

/** Bytes read from a file too large to be a program: enough for any header the identifiers read. */
const HEAD_BYTES = 4096;

export interface InputFile {
  /** Absolute path, for reading only; never recorded. */
  abs: string;
  /** What the report shows: the path under fixtures/ or under the NORD_FILES folder. */
  label: string;
  /** The model the fixtures/<model-id>/ folder names; null under NORD_FILES (taken from the file). */
  model: NordModelId | null;
  size: number;
}

/** Every file under `dir`, recursively — skipping hidden files and folders and not following links. */
function walk(dir: string, visit: (abs: string, size: number) => void): void {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const abs = join(dir, name);
    let st: fs.Stats;
    try { st = fs.lstatSync(abs); } catch { continue; }
    if (st.isDirectory()) walk(abs, visit);
    else if (st.isFile()) visit(abs, st.size);
  }
}

/** `fixtures/<model-id>/**` — the curated local corpus. Folders that aren't a model id are noted and skipped. */
export function listFixtureInputs(root: string): { inputs: InputFile[]; notes: string[] } {
  const inputs: InputFile[] = [];
  const notes: string[] = [];
  if (!fs.existsSync(root)) return { inputs, notes };
  for (const id of fs.readdirSync(root).sort()) {
    const dir = join(root, id);
    if (id.startsWith('.') || !fs.statSync(dir).isDirectory()) continue; // README.md, .report.json
    if (!(id in MODELS)) { notes.push(`fixtures/${id} is not a known model id — skipped`); continue; }
    walk(dir, (abs, size) => inputs.push({ abs, label: `${id}/${relative(dir, abs)}`, model: id as NordModelId, size }));
  }
  return { inputs, notes };
}

/** Expand a leading `~` and resolve against the working folder. */
export function resolveUserPath(path: string): string {
  return resolve(path.replace(/^~(?=$|\/)/, homedir()));
}

/** Every Nord file (by extension) under `dir` (or `dir` itself, when it names one file); the model comes from each file. */
export function listNordFilesInputs(dir: string): { inputs: InputFile[]; notes: string[] } {
  const root = resolveUserPath(dir);
  if (!fs.existsSync(root)) throw new Error(`NORD_FILES=${dir}: no such folder or file`);
  const st = fs.statSync(root);
  if (st.isFile()) return { inputs: [{ abs: root, label: basename(root), model: null, size: st.size }], notes: [] };
  const inputs: InputFile[] = [];
  let ignored = 0;
  walk(root, (abs, size) => {
    if (isNordFileName(abs)) inputs.push({ abs, label: relative(root, abs), model: null, size });
    else ignored++;
  });
  return { inputs, notes: ignored ? [`NORD_FILES: ${ignored} file(s) that aren't Nord files ignored`] : [] };
}

function readHead(abs: string, n: number): Uint8Array {
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = new Uint8Array(n);
    const got = fs.readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, got);
  } finally {
    fs.closeSync(fd);
  }
}

/** A read-only Blob over the file (streamed from disk where Node supports it). */
async function fileBlob(abs: string): Promise<Blob> {
  return typeof fs.openAsBlob === 'function' ? fs.openAsBlob(abs) : new Blob([fs.readFileSync(abs)]);
}

/** Check one input file (or every program entry in a backup). Never throws. */
export async function validateInput(input: InputFile): Promise<ValidationRow[]> {
  try {
    if (isArchiveName(input.abs)) return await validateArchive(input.label, await fileBlob(input.abs), input.model);
    if (input.size > MAX_PROGRAM_ENTRY_BYTES) {
      return [validateBytes(input.label, readHead(input.abs, HEAD_BYTES), input.model, input.size, true)];
    }
    return [validateBytes(input.label, new Uint8Array(fs.readFileSync(input.abs)), input.model, input.size)];
  } catch (e) {
    return [errorRow(input.label, input.model, input.size, e)];
  }
}

export interface ScanResult {
  rows: ValidationRow[];
  notes: string[];
}

/**
 * Collect the inputs (fixtures/<model-id>/ under `fixturesRoot`, plus the
 * `nordFiles` folder when given) and check them all, one at a time.
 */
export async function runFixtureScan(opts: { fixturesRoot: string; nordFiles?: string }): Promise<ScanResult> {
  const fixtures = listFixtureInputs(opts.fixturesRoot);
  const nord = opts.nordFiles ? listNordFilesInputs(opts.nordFiles) : { inputs: [], notes: [] };
  const rows: ValidationRow[] = [];
  for (const input of [...fixtures.inputs, ...nord.inputs]) rows.push(...await validateInput(input));
  return { rows, notes: [...fixtures.notes, ...nord.notes] };
}
