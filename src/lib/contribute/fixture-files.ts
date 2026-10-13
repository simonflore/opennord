/**
 * The file side of `npm run fixtures:scan` (Node only): find the files to check
 * — `fixtures/<model-id>/…` and, with `NORD_FILES=/some/folder`, every Nord file
 * under that folder — and run fixture-validate.ts over them. Files are only
 * ever opened for reading; a backup is read entry by entry through its ZIP
 * directory; a piano or sample is read whole (one at a time) to decode its
 * notes; any other file too large to be a program only for its header.
 */
import * as fs from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { MODELS, type NordModelId } from '../clavia/partitions';
import {
  errorRow, isArchiveName, isMediaFileName, isNordFileName, validateArchive, validateBytes, validateMediaBytes,
  MAX_PROGRAM_ENTRY_BYTES, type MediaCheckOptions, type ValidationRow,
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

/**
 * Every file under `dir`, recursively — skipping hidden files and folders (.DS_Store,
 * `._` resource forks) and not following links. Returns how many folders could not
 * be listed (no permission), which are skipped.
 */
function walk(dir: string, visit: (abs: string, size: number) => void): number {
  let names: string[];
  try { names = fs.readdirSync(dir).sort(); } catch { return 1; }
  let unreadable = 0;
  for (const name of names) {
    if (name.startsWith('.')) continue;
    const abs = join(dir, name);
    let st: fs.Stats;
    try { st = fs.lstatSync(abs); } catch { continue; }
    if (st.isDirectory()) unreadable += walk(abs, visit);
    else if (st.isFile()) visit(abs, st.size);
  }
  return unreadable;
}

const unreadableNote = (where: string, n: number) => (n ? [`${where}: ${n} folder(s) could not be opened (no permission) — skipped`] : []);

/**
 * `fixtures/<model-id>/**` — the curated local corpus — plus the Nord files in
 * any other folder or loose at the top (samples, pianos, sound banks), whose
 * model is taken from each file.
 */
export function listFixtureInputs(root: string): { inputs: InputFile[]; notes: string[] } {
  const inputs: InputFile[] = [];
  const notes: string[] = [];
  if (!fs.existsSync(root)) return { inputs, notes };
  let unreadable = 0;
  for (const id of fs.readdirSync(root).sort()) {
    const dir = join(root, id);
    if (id.startsWith('.')) continue; // .report.json
    const st = fs.statSync(dir, { throwIfNoEntry: false });
    if (st?.isFile()) {
      if (isNordFileName(id)) inputs.push({ abs: dir, label: id, model: null, size: st.size });
      continue;
    }
    if (!st?.isDirectory()) continue;
    // A model folder may be a link to a library elsewhere; any other folder's files carry their own model.
    // Only Nord files are taken: a bundle's meta.xml or a README is not one.
    const model = id in MODELS ? (id as NordModelId) : null;
    unreadable += walk(dir, (abs, size) => {
      if (isNordFileName(abs)) inputs.push({ abs, label: `${id}/${relative(dir, abs)}`, model, size });
    });
  }
  return { inputs, notes: [...notes, ...unreadableNote('fixtures', unreadable)] };
}

/** Expand a leading `~` and resolve against the folder the command was typed in (npm runs scripts from the package folder). */
export function resolveUserPath(path: string): string {
  return resolve(process.env.INIT_CWD ?? process.cwd(), path.replace(/^~(?=$|\/)/, homedir()));
}

/** Every Nord file (by extension) under `dir` (or `dir` itself, when it names one file); the model comes from each file. */
export function listNordFilesInputs(dir: string): { inputs: InputFile[]; notes: string[] } {
  const root = resolveUserPath(dir);
  if (!fs.existsSync(root)) throw new Error(`NORD_FILES=${dir}: no such folder or file`);
  const st = fs.statSync(root);
  if (st.isFile()) return { inputs: [{ abs: root, label: basename(root), model: null, size: st.size }], notes: [] };
  const inputs: InputFile[] = [];
  let ignored = 0;
  const unreadable = walk(root, (abs, size) => {
    if (isNordFileName(abs)) inputs.push({ abs, label: relative(root, abs), model: null, size });
    else ignored++;
  });
  return {
    inputs,
    notes: [...(ignored ? [`NORD_FILES: ${ignored} file(s) that aren't Nord files ignored`] : []), ...unreadableNote('NORD_FILES', unreadable)],
  };
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

/** Check one input file (or every program entry in a backup). Never throws. */
export async function validateInput(input: InputFile, opts: MediaCheckOptions = {}): Promise<ValidationRow[]> {
  try {
    // A Blob over the file on disk: the archive is read slice by slice, never loaded whole.
    if (isArchiveName(input.abs)) return await validateArchive(input.label, await fs.openAsBlob(input.abs), input.model);
    if (isMediaFileName(input.abs)) return [await validateMediaBytes(input.label, new Uint8Array(fs.readFileSync(input.abs)), input.model, opts)];
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
export async function runFixtureScan(opts: { fixturesRoot: string; nordFiles?: string; checkConversions?: boolean }): Promise<ScanResult> {
  const fixtures = listFixtureInputs(opts.fixturesRoot);
  const nord = opts.nordFiles ? listNordFilesInputs(opts.nordFiles) : { inputs: [], notes: [] };
  const rows: ValidationRow[] = [];
  for (const input of [...fixtures.inputs, ...nord.inputs]) rows.push(...await validateInput(input, { conversions: opts.checkConversions }));
  return { rows, notes: [...fixtures.notes, ...nord.notes] };
}
