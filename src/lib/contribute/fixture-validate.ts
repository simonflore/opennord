/**
 * The checks `npm run fixtures:scan` runs on each real Nord file — what tells us,
 * from files we don't have, whether a reader's layout lines up with the file.
 * On top of the identification and registry cross-check of
 * clavia/fixture-report.ts, every file a program reader reads (a program, or a
 * Live holding a program record — formats.ts `programTagFor`) gets:
 *
 * - framing: header type and record length against the layout's;
 * - its checksum, for its header type (clavia/checksum.ts);
 * - the reader's verdict — the same one the opt-in `file.read` diagnostics
 *   report (diagnostics/file-read.ts): layout matched or header only, record
 *   version, the version it was converted from, warnings, out-of-range values;
 * - for a model OpenNord writes (program-write.ts): a write of no values, which
 *   must give back the file byte for byte, and a write-back of every value the
 *   reader returned, which must too.
 *
 * A Stage 4 preset (organ `ns4o`, piano `ns4n`, synth `ns4y`) gets its checksum
 * and the preset reader's result (ns4/preset.ts): decoded, how many voices, and
 * whether every voice's identity — organ model, piano model, synth oscillator
 * and filter — came out. OpenNord writes no presets, so there is no write check.
 *
 * A piano (`.npno`) or sample (`.nsmp*`) gets its check value and a decode of
 * every note (stroke) it holds (ns4/nsp-audio.ts, ns4/nsmp.ts): how many there
 * are and how many decode. The audio is decoded in memory and dropped.
 *
 * Backups and bundles (ZIP) are opened and each program or preset entry inside
 * is checked the same way. Never throws per file; never writes. What a row records is what
 * the scanner already did (tags, sizes, versions, warnings) plus counts and
 * byte offsets — no parameter values (a writer's refusal message has its value
 * redacted) and no names other than the file's own path.
 */
import { checkSampleConversions, type ConversionCheck } from '../ns4/nsmp-convert-check';
import { cbinFraming, CBIN_FORMAT_LEGACY, CBIN_FORMAT_NSM } from '../clavia/cbin';
import { verifyFileChecksum } from '../clavia/checksum';
import { identifyNordFile } from '../clavia/nord-file';
import { fileTagInfo } from '../clavia/file-tags';
import { identifyFixture, crossCheckFixture, type FixtureFinding } from '../clavia/fixture-report';
import { MODELS, type NordModelId } from '../clavia/partitions';
import type { ClaviaModel } from '../clavia/model';
import { readZipDirectory, extractZipEntry, type ZipEntry } from '../clavia/backup/zip-directory';
import { identifyBackup } from '../clavia/backup/backup-index';
import { parseClaviaFile, programTagFor } from '../formats';
import { writeProgram, PROGRAM_WRITERS, NOT_WRITABLE, type ProgramValues } from '../program-write';
import { readerResult, type ReaderVerdict } from '../diagnostics/file-read';
import { parseNs4Preset } from '../ns4/preset';
import { readNspIdentity } from '../ns4/nsp';
import { readNspDirectory, decodeNspStroke } from '../ns4/nsp-audio';
import { readNsmp, decodeNsmp } from '../ns4/nsmp';
import { pianoChecksumHolds } from '../ns4/backup-check';
import { ns3FieldsConverted } from '../ns3/convert';
import { getErrorMessage } from '../errors';
import { programLayoutInfo } from './coverage';

/** Backup entries larger than this are not program files (samples, pianos) and are not opened. */
export const MAX_PROGRAM_ENTRY_BYTES = 1 << 20;

export type WriteOutcome = 'identical' | 'differs' | 'refused' | 'not-writable' | 'skipped';

export interface WriteCheck {
  outcome: WriteOutcome;
  /** Why the writer refused (any value in the message redacted), or why the check was skipped. */
  reason?: string;
  /** When the written file differs: how many bytes, and the first file offset that does. */
  diffBytes?: number;
  firstDiffAt?: number;
}

export interface FramingCheck {
  /** CBIN header type at 0x04: legacy (0), NSM-era (1), or a newer one no reader takes. */
  headerType: 'legacy' | 'nsm-era' | 'newer';
  /** The record / body length this file has (size − 26 legacy, size − 44 NSM-era). */
  recordBytes: number;
  /** The lengths the layouts for this tag make; empty when no layout states one (Stage 4, performances). */
  expectedRecordBytes: number[];
  /** recordBytes is one of them; null when there is nothing to compare. */
  lengthOk: boolean | null;
}

export interface ProgramCheck {
  /** The program tag whose reader read the file (a Live reads as its model's program). */
  programTag: string;
  /** The reader / writer model it routed to. */
  codecModel: ClaviaModel;
  framing: FramingCheck;
  checksumOk: boolean;
  reader: ReaderVerdict & {
    /** The record / body version the firmware converts on load, when the file is in one. */
    convertedFrom: number | null;
  };
  noOpWrite: WriteCheck;
  writeBack: WriteCheck;
}

export interface PresetCheck {
  checksumOk: boolean;
  /** The preset reader decoded it. */
  read: boolean;
  /** Enabled voices (layers) it decoded. */
  voices: number;
  /** Every decoded voice has its identity (organ model, piano model, synth oscillator + filter). */
  identified: boolean;
}

export interface MediaCheck {
  kind: 'piano' | 'sample';
  checksumOk: boolean;
  /** Notes (strokes) the file holds, and how many of them decode. */
  notes: number;
  notesDecoded: number;
  /** A sample converted to the other generations and read back (only when asked for). */
  conversions?: ConversionCheck[];
}

/** What the media check does besides the default. */
export interface MediaCheckOptions {
  /** Also convert every sample to the other generations and compare (slow: minutes for a library). */
  conversions?: boolean;
}

export interface ValidationRow extends FixtureFinding {
  /** The file's path as given (relative to the folder scanned); a backup entry is `backup › entry`. */
  path: string;
  /** The model the file is checked as: its fixtures/ folder, a backup's model, or the file's own tag. */
  model: NordModelId | null;
  size: number;
  /** Registry cross-check findings (fixture-report.ts `crossCheckFixture`) and read errors. */
  issues: string[];
  /** Backup / bundle entries not opened: not Nord program-type files, or too large to be one. */
  skippedEntries?: number;
  check?: ProgramCheck;
  preset?: PresetCheck;
  media?: MediaCheck;
}

const extOf = (name: string) => (name.split('.').pop() ?? '').toLowerCase();
const baseName = (path: string) => path.replace(/^.*[/\\]/, '');

/** A writer's message may name the value it refused (`key: 300 is outside …`); keep the key, drop the value. */
export function redactWriteMessage(message: string): string {
  return message.replace(/^([\w.[\]-]+): -?\d+(?:\.\d+)?\b/, '$1: <value>');
}

/** True for a ZIP bundle or backup, by extension (clavia/file-tags.ts). */
export function isArchiveName(name: string): boolean {
  return fileTagInfo(extOf(name))?.container === 'zip';
}

/** True for a file name the scan looks at: a Nord file type, a sample or a piano library. */
export function isNordFileName(name: string): boolean {
  const ext = extOf(name);
  return !!fileTagInfo(ext) || ext.startsWith('nsmp') || ext === 'npno';
}

function diffOf(a: Uint8Array, b: Uint8Array): Pick<WriteCheck, 'diffBytes' | 'firstDiffAt'> | null {
  let diffBytes = Math.abs(a.length - b.length);
  let firstDiffAt = a.length === b.length ? -1 : Math.min(a.length, b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      diffBytes++;
      if (firstDiffAt < 0 || i < firstDiffAt) firstDiffAt = i;
    }
  }
  return diffBytes === 0 ? null : { diffBytes, firstDiffAt };
}

/** Write `values` into a copy of the file with OpenNord's writer and compare the result with the file. */
export function writeCheck(model: ClaviaModel, bytes: Uint8Array, values: ProgramValues): WriteCheck {
  if (!PROGRAM_WRITERS[model]) return { outcome: 'not-writable', reason: NOT_WRITABLE[model] ?? 'no writer for this model' };
  let out: Uint8Array;
  try {
    out = writeProgram(model, bytes.slice(), values);
  } catch (e) {
    return { outcome: 'refused', reason: redactWriteMessage(getErrorMessage(e)) };
  }
  const diff = diffOf(bytes, out);
  return diff ? { outcome: 'differs', ...diff } : { outcome: 'identical' };
}

/** The reader's `values`, when it returns a flat record of numbers. */
function readerValues(program: Record<string, unknown> | null): ProgramValues | null {
  const v = program?.values;
  if (!v || typeof v !== 'object') return null;
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(v)) if (typeof x === 'number') out[k] = x;
  return Object.keys(out).length > 0 ? out : null;
}

function framingOf(bytes: Uint8Array, programTag: string, model: NordModelId | null): FramingCheck {
  const f = cbinFraming(bytes);
  const headerType = f.formatType === CBIN_FORMAT_LEGACY ? 'legacy' : f.formatType === CBIN_FORMAT_NSM ? 'nsm-era' : 'newer';
  const tag = fileTagInfo(programTag);
  // A tag several models write (Electro 3 / 3 HP, Stage 2 / 2 EX) takes any of their layouts' lengths.
  // A performance holds several program records and no layout states its length.
  const models = tag?.kind === 'performance' ? [] : [...new Set([...(model ? [model] : []), ...(tag?.models ?? [])])];
  const expected = [...new Set(models.map((m) => programLayoutInfo(m)?.recordBytes).filter((n): n is number => n !== undefined))];
  return {
    headerType, recordBytes: f.recordBytes, expectedRecordBytes: expected,
    lengthOk: expected.length === 0 ? null : expected.includes(f.recordBytes),
  };
}

function convertedFromOf(verdict: ReaderVerdict, codecModel: ClaviaModel, model: NordModelId | null): number | null {
  const v = verdict.recordVersion;
  if (verdict.layoutMatched !== true || v === null) return null;
  const native = model ? programLayoutInfo(model)?.nativeVersions : null;
  if (native && (v < native[0] || v > native[1])) return v;
  // Stage 3 3.00 / 3.01 bodies sit inside the layout's range but have a few values fixed up on load.
  if (codecModel === 'ns3' && ns3FieldsConverted(v).length > 0) return v;
  return null;
}

/**
 * Every check on one file a program reader reads, or null for any other file
 * (samples, presets, Settings, a Live that holds no program). Never throws.
 */
export function checkProgram(bytes: Uint8Array, model: NordModelId | null): ProgramCheck | null {
  const info = identifyNordFile(bytes);
  const programTag = info.recognized ? programTagFor(info, bytes) : undefined;
  if (!programTag) return null;
  let codecModel: ClaviaModel = 'unknown';
  try { codecModel = parseClaviaFile(bytes).model; } catch { /* the reader verdict below reports the throw */ }
  const { program, verdict } = readerResult(bytes, programTag);
  const values = readerValues(program);
  const writeBack: WriteCheck = verdict.layoutMatched !== true
    ? { outcome: 'skipped', reason: 'the reader did not read the body' }
    : !values ? { outcome: 'skipped', reason: 'the reader returns no values to write back' }
    : writeCheck(codecModel, bytes, values);
  return {
    programTag, codecModel,
    framing: framingOf(bytes, programTag, model),
    checksumOk: verifyFileChecksum(bytes),
    reader: { ...verdict, convertedFrom: convertedFromOf(verdict, codecModel, model) },
    noOpWrite: writeCheck(codecModel, bytes, {}),
    writeBack,
  };
}

/** The checks on a Stage 4 preset, or null for any other file. Never throws. */
export function checkPreset(bytes: Uint8Array): PresetCheck | null {
  const tag = identifyNordFile(bytes).tag;
  if (tag !== 'ns4o' && tag !== 'ns4n' && tag !== 'ns4y') return null;
  let preset: ReturnType<typeof parseNs4Preset> = null;
  try { preset = parseNs4Preset(bytes); } catch { /* counted as not read */ }
  return {
    checksumOk: verifyFileChecksum(bytes),
    read: preset !== null,
    voices: preset?.layers.length ?? 0,
    identified: !!preset && preset.layers.every((l) => !!l.headline),
  };
}

const noPace = async () => {};

/**
 * The checks on a piano or a sample: check value, then every note decoded (in
 * memory, then dropped). Null for any other file. Never throws.
 */
export async function checkMedia(bytes: Uint8Array, opts: MediaCheckOptions = {}): Promise<MediaCheck | null> {
  try {
    if (readNspIdentity(bytes)) {
      const checksumOk = await pianoChecksumHolds(bytes, noPace);
      const dir = readNspDirectory(bytes);
      let notesDecoded = 0;
      for (const stroke of dir?.strokes ?? []) {
        try { decodeNspStroke(bytes, dir!, stroke); notesDecoded++; } catch { /* counted as not decoded */ }
      }
      return { kind: 'piano', checksumOk, notes: dir?.strokes.length ?? 0, notesDecoded };
    }
    const s = readNsmp(bytes);
    if (!s.recognized || s.pianoLibrary) return null;
    let notesDecoded = 0;
    try { notesDecoded = decodeNsmp(bytes).length; } catch { /* none decoded */ }
    const media: MediaCheck = { kind: 'sample', checksumOk: s.checksumValid, notes: s.strokeCount, notesDecoded };
    if (opts.conversions && notesDecoded > 0) {
      // Its own failure is a finding about the conversion, not a reason to lose the rest.
      try { media.conversions = checkSampleConversions(bytes); } catch (e) {
        media.conversions = [{ target: s.legacy ? 3 : 2, lost: [`could not be checked (${(e as Error).message})`] }];
      }
    }
    return media;
  } catch {
    return null;
  }
}

/** A piano or sample file: identified, then {@link checkMedia}. Never throws. */
export async function validateMediaBytes(path: string, bytes: Uint8Array, model: NordModelId | null, opts: MediaCheckOptions = {}): Promise<ValidationRow> {
  const row = validateBytes(path, bytes, model, bytes.length, true);
  const media = await checkMedia(bytes, opts);
  if (media) row.media = media;
  return row;
}

const CONVERSION_EXT: Record<number, string> = { 2: '.nsmp', 3: '.nsmp3', 4: '.nsmp4' };

/** Whether a file name is a piano or sample (checked with {@link validateMediaBytes}). */
export function isMediaFileName(name: string): boolean {
  const ext = extOf(name);
  return ext.startsWith('nsmp') || ext === 'npno';
}

/** The model a file belongs to when no folder says: the one its tag names. */
function modelOf(bytes: Uint8Array, name: string): NordModelId | null {
  const info = identifyNordFile(bytes);
  return info.modelId ?? fileTagInfo(extOf(name))?.models[0] ?? null;
}

/**
 * Check one file (not an archive). `model` is the fixtures/ folder's or the
 * backup's model, or null to take it from the file. With `identifyOnly` (a file
 * read only in part, too large to be a program) only identification runs.
 */
export function validateBytes(
  path: string, bytes: Uint8Array, model: NordModelId | null, size = bytes.length, identifyOnly = false,
): ValidationRow {
  const name = baseName(path);
  const finding = identifyFixture(name, bytes);
  const m = model ?? modelOf(bytes, name);
  const issues = m ? crossCheckFixture(finding, m).issues
    : !finding.headerOk && finding.error ? [`did not identify: ${finding.error}`] : [];
  const row: ValidationRow = { ...finding, path, model: m, size, issues };
  if (identifyOnly) return row;
  try {
    const check = checkProgram(bytes, m);
    if (check) row.check = check;
    else {
      const preset = checkPreset(bytes);
      if (preset) row.preset = preset;
    }
  } catch (e) {
    row.issues.push(`check failed: ${getErrorMessage(e)}`);
  }
  return row;
}

/** An archive entry the scan opens: a Nord file type by extension (not a sample or piano), small enough to be a program. */
function opensEntry(entry: ZipEntry): boolean {
  const name = baseName(entry.path);
  if (entry.path.endsWith('/') || entry.path.startsWith('__MACOSX/') || name.startsWith('._')) return false;
  const ext = extOf(name);
  return fileTagInfo(ext)?.container === 'cbin' && entry.size <= MAX_PROGRAM_ENTRY_BYTES;
}

/** A row for a file the scan could not read at all. A file-system error is kept as its code: its message names the absolute path. */
export function errorRow(path: string, model: NordModelId | null, size: number, error: unknown): ValidationRow {
  const code = (error as { code?: unknown } | null)?.code;
  const message = typeof code === 'string' ? code : getErrorMessage(error);
  return { name: baseName(path), ext: extOf(path), kind: 'unknown', headerOk: false, error: message, path, model, size, issues: [`could not read: ${message}`] };
}

/**
 * Open a backup or bundle (read through its ZIP directory, entry by entry, so a
 * multi-GB backup is never loaded whole) and check every program-type entry.
 * The first row is the archive itself. Never throws.
 */
export async function validateArchive(path: string, file: Blob, model: NordModelId | null): Promise<ValidationRow[]> {
  const ext = extOf(path);
  let entries: ZipEntry[];
  try {
    entries = await readZipDirectory(file);
  } catch (e) {
    return [{ ...errorRow(path, model, file.size, e), kind: 'backup' }];
  }
  let m = model;
  if (!m) {
    try { m = await identifyBackup(entries, (e) => extractZipEntry(file, e)); } catch { m = null; }
  }
  m ??= fileTagInfo(ext)?.models[0] ?? null;
  const opened = entries.filter(opensEntry);
  const archive: ValidationRow = {
    name: baseName(path), ext, kind: 'backup', zipEntries: entries.map((e) => e.path), headerOk: true,
    path, model: m, size: file.size, issues: [], skippedEntries: entries.length - opened.length,
  };
  const rows = [archive];
  for (const entry of opened) {
    const label = `${path} › ${entry.path}`;
    try {
      rows.push(validateBytes(label, await extractZipEntry(file, entry), m, entry.size));
    } catch (e) {
      rows.push(errorRow(label, m, entry.size, e));
    }
  }
  return rows;
}

// ── Summary ─────────────────────────────────────────────────────────────────

export interface ModelSummary {
  model: NordModelId | null;
  name: string;
  /** The model's program layout status in contribute/coverage.ts, when it has one. */
  layoutStatus: 'confirmed' | 'candidate' | null;
  files: number;
  archives: number;
  programs: number;
  readOk: number;
  headerOnly: number;
  noLayoutCheck: number;
  outOfRangeFiles: number;
  /** Programs read with a warning besides out-of-range values and full-conversion notes (a resized block, a short file, …). */
  warned: number;
  converted: number;
  checksumOk: number;
  checksumFail: number;
  lengthOff: number;
  /** Programs read with the layout, no warning or out-of-range value, checksum holding and the expected length. */
  cleanReads: number;
  noOp: Record<WriteOutcome, number>;
  presets: number;
  presetsRead: number;
  presetChecksumOk: number;
  presetsIdentified: number;
  pianos: number;
  samples: number;
  mediaChecksumOk: number;
  notes: number;
  notesDecoded: number;
  /** Sample conversions tried, and how many kept audio, loops, level and tuning. */
  conversions: number;
  conversionsKept: number;
  writeBack: Record<WriteOutcome, number>;
  /** Rows the scan could not read or check, plus registry cross-check findings. */
  problems: number;
  topWarnings: [string, number][];
  topRefusals: [string, number][];
}

const emptyOutcomes = (): Record<WriteOutcome, number> => ({ identical: 0, differs: 0, refused: 0, 'not-writable': 0, skipped: 0 });

/** A note that the reader converted an older record exactly as the firmware does: informational, not a misread. */
const isFullConversionNote = (w: string) => w.includes('OpenNord converts it the same way');

/** Reader warnings that point at a misread, leaving out full-conversion notes. */
const alignmentWarnings = (c: ProgramCheck) =>
  c.reader.warningCount - c.reader.warnings.filter(isFullConversionNote).length;

const isClean = (c: ProgramCheck) =>
  c.reader.layoutMatched === true && alignmentWarnings(c) === 0 && c.reader.outOfRange === 0 &&
  c.checksumOk && c.framing.lengthOk !== false;

/**
 * Whether a row needs a look (listed by file in the console summary). A refused
 * write is not one: the writers refuse older formats and performances by design,
 * and the summary counts those refusals by reason.
 */
export function rowProblems(row: ValidationRow): string[] {
  const out = [...row.issues];
  const p = row.preset;
  if (p && !p.read) out.push('preset not read');
  if (p && !p.checksumOk) out.push('checksum does not hold');
  if (p?.read && !p.identified) out.push('a voice without its identity (model / oscillator)');
  const m = row.media;
  if (m && !m.checksumOk) out.push('checksum does not hold');
  if (m && m.notes === 0) out.push('holds no notes');
  if (m && m.notesDecoded < m.notes) out.push(`${m.notes - m.notesDecoded} of ${m.notes} notes did not decode`);
  for (const v of m?.conversions ?? []) {
    if (v.lost.length) out.push(`converted to ${CONVERSION_EXT[v.target]}: loses ${v.lost.join(', ')}`);
  }
  const c = row.check;
  if (!c) return out;
  if (c.reader.headerOnly) out.push('header only');
  if (c.reader.outOfRange > 0) out.push(`${c.reader.outOfRange} out-of-range value(s)`);
  if (!c.checksumOk) out.push('checksum does not hold');
  if (c.framing.lengthOk === false) out.push(`record ${c.framing.recordBytes} bytes, layout makes ${c.framing.expectedRecordBytes.join(' or ')}`);
  if (c.noOpWrite.outcome === 'differs') out.push(`no-op write differs (${c.noOpWrite.diffBytes} bytes from 0x${c.noOpWrite.firstDiffAt?.toString(16)})`);
  if (c.writeBack.outcome === 'differs') out.push(`write-back differs (${c.writeBack.diffBytes} bytes from 0x${c.writeBack.firstDiffAt?.toString(16)})`);
  return out;
}

function top(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

/** Per-model totals, in registry order (files with no model last). */
export function summarizeRows(rows: readonly ValidationRow[]): ModelSummary[] {
  const byModel = new Map<NordModelId | null, ValidationRow[]>();
  for (const r of rows) {
    const list = byModel.get(r.model);
    if (list) list.push(r); else byModel.set(r.model, [r]);
  }
  const order = Object.keys(MODELS) as NordModelId[];
  const keys = [...byModel.keys()].sort((a, b) => (a === null ? 1 : b === null ? -1 : order.indexOf(a) - order.indexOf(b)));
  return keys.map((model) => {
    const list = byModel.get(model)!;
    const s: ModelSummary = {
      model, name: model ? MODELS[model]?.name ?? model : 'No model', layoutStatus: model ? programLayoutInfo(model)?.status ?? null : null,
      files: 0, archives: 0, programs: 0, readOk: 0, headerOnly: 0, noLayoutCheck: 0, outOfRangeFiles: 0, warned: 0, converted: 0,
      checksumOk: 0, checksumFail: 0, lengthOff: 0, cleanReads: 0, noOp: emptyOutcomes(), writeBack: emptyOutcomes(),
      presets: 0, presetsRead: 0, presetChecksumOk: 0, presetsIdentified: 0,
      pianos: 0, samples: 0, mediaChecksumOk: 0, notes: 0, notesDecoded: 0, conversions: 0, conversionsKept: 0,
      problems: 0, topWarnings: [], topRefusals: [],
    };
    const warnings = new Map<string, number>();
    const refusals = new Map<string, number>();
    for (const r of list) {
      if (r.kind === 'backup') s.archives++; else s.files++;
      if (r.issues.length > 0) s.problems++;
      if (r.preset) {
        s.presets++;
        if (r.preset.read) s.presetsRead++;
        if (r.preset.checksumOk) s.presetChecksumOk++;
        if (r.preset.identified) s.presetsIdentified++;
      }
      if (r.media) {
        if (r.media.kind === 'piano') s.pianos++; else s.samples++;
        if (r.media.checksumOk) s.mediaChecksumOk++;
        s.notes += r.media.notes;
        s.notesDecoded += r.media.notesDecoded;
        for (const v of r.media.conversions ?? []) {
          s.conversions++;
          if (v.lost.length === 0) s.conversionsKept++;
        }
      }
      const c = r.check;
      if (!c) continue;
      s.programs++;
      if (c.reader.layoutMatched === true) s.readOk++;
      else if (c.reader.layoutMatched === null) s.noLayoutCheck++;
      if (c.reader.headerOnly) s.headerOnly++;
      if (c.reader.outOfRange > 0) s.outOfRangeFiles++;
      // Out-of-range values carry a warning of their own, counted above.
      if (c.reader.layoutMatched === true && alignmentWarnings(c) > (c.reader.outOfRange > 0 ? 1 : 0)) s.warned++;
      if (c.reader.convertedFrom !== null) s.converted++;
      if (c.checksumOk) s.checksumOk++; else s.checksumFail++;
      if (c.framing.lengthOk === false) s.lengthOff++;
      if (isClean(c)) s.cleanReads++;
      s.noOp[c.noOpWrite.outcome]++;
      s.writeBack[c.writeBack.outcome]++;
      for (const w of c.reader.warnings) warnings.set(w, (warnings.get(w) ?? 0) + 1);
      for (const w of [c.noOpWrite, c.writeBack]) {
        if (w.outcome === 'refused' && w.reason) refusals.set(w.reason, (refusals.get(w.reason) ?? 0) + 1);
      }
    }
    s.topWarnings = top(warnings, 3);
    s.topRefusals = top(refusals, 3);
    return s;
  });
}

/** The one-line verdict on an unconfirmed ('candidate') layout from this run's files. */
export function alignmentVerdict(s: ModelSummary): string {
  if (s.programs === 0) return 'no program files in this run — alignment still unchecked';
  if (s.cleanReads === s.programs) {
    return `${s.programs} real file${s.programs === 1 ? '' : 's'} read cleanly → alignment looks right`;
  }
  const why = [
    s.headerOnly && `${s.headerOnly} header-only`,
    s.noLayoutCheck && `${s.noLayoutCheck} with no layout check`,
    s.outOfRangeFiles && `${s.outOfRangeFiles} with out-of-range values`,
    s.warned && `${s.warned} with reader warnings`,
    s.checksumFail && `${s.checksumFail} checksum fail`,
    s.lengthOff && `${s.lengthOff} of unexpected length`,
  ].filter(Boolean).join(', ');
  return `${s.cleanReads} of ${s.programs} read cleanly (${why}) → alignment needs a look`;
}

const outcomes = (o: Record<WriteOutcome, number>) =>
  `identical ${o.identical} · differs ${o.differs} · refused ${o.refused}` +
  (o['not-writable'] ? ` · not writable ${o['not-writable']}` : '') + (o.skipped ? ` · skipped ${o.skipped}` : '');

const clip = (s: string, n = 110) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The console summary: one block per model, the files that need a look, then the unconfirmed layouts. */
export function formatSummary(rows: readonly ValidationRow[], reportPath: string, maxProblemsPerModel = 5): string {
  const summaries = summarizeRows(rows);
  const programs = summaries.reduce((n, s) => n + s.programs, 0);
  const presets = summaries.reduce((n, s) => n + s.presets, 0);
  const media = summaries.reduce((n, s) => n + s.pianos + s.samples, 0);
  const archives = summaries.reduce((n, s) => n + s.archives, 0);
  const files = summaries.reduce((n, s) => n + s.files, 0);
  const lines: string[] = [
    `OpenNord file check — ${files} file(s)${archives ? ` (incl. the contents of ${archives} backup/bundle file(s))` : ''}, ` +
    `${programs} program(s)${presets ? `, ${presets} preset(s)` : ''}${media ? `, ${media} piano(s)/sample(s)` : ''} checked. Nothing was changed or sent anywhere. Full report: ${reportPath}`,
  ];
  for (const s of summaries) {
    lines.push('', `${s.name}${s.model ? ` (${s.model})` : ''}${s.layoutStatus ? ` — layout ${s.layoutStatus}` : ''}`);
    lines.push(`  files ${s.files}${s.archives ? ` + ${s.archives} backup(s)` : ''} · programs checked ${s.programs}` +
      (s.presets ? ` · presets checked ${s.presets}` : '') +
      (s.pianos ? ` · pianos checked ${s.pianos}` : '') + (s.samples ? ` · samples checked ${s.samples}` : ''));
    if (s.programs > 0) {
      lines.push(
        `  read OK ${s.readOk} · header-only ${s.headerOnly}${s.noLayoutCheck ? ` · read (no layout check) ${s.noLayoutCheck}` : ''}` +
        ` · out-of-range ${s.outOfRangeFiles} · with warnings ${s.warned} · converted from an older version ${s.converted}`,
        `  checksum OK ${s.checksumOk} / fail ${s.checksumFail}${s.lengthOff ? ` · unexpected length ${s.lengthOff}` : ''}`,
        `  no-op write: ${outcomes(s.noOp)}`,
        `  write-back:  ${outcomes(s.writeBack)}`,
      );
      if (s.layoutStatus === 'candidate') lines.push(`  → ${alignmentVerdict(s)}`);
      for (const [w, n] of s.topWarnings) lines.push(`  warning ×${n}: ${clip(w)}`);
      for (const [w, n] of s.topRefusals) lines.push(`  write refused ×${n}: ${clip(w)}`);
    }
    if (s.presets > 0) {
      lines.push(`  presets: read ${s.presetsRead} · voice identified ${s.presetsIdentified} · checksum OK ${s.presetChecksumOk} / fail ${s.presets - s.presetChecksumOk}`);
    }
    if (s.pianos + s.samples > 0) {
      lines.push(`  pianos/samples: checksum OK ${s.mediaChecksumOk} / fail ${s.pianos + s.samples - s.mediaChecksumOk} · notes decoded ${s.notesDecoded} of ${s.notes}`);
      if (s.conversions > 0) lines.push(`  sample conversions: ${s.conversions} tried · ${s.conversionsKept} keep audio, loops, level and tuning`);
    }
    const flagged = rows.filter((r) => r.model === s.model).map((r) => [r.path, rowProblems(r)] as const).filter(([, p]) => p.length > 0);
    for (const [path, p] of flagged.slice(0, maxProblemsPerModel)) lines.push(`  ! ${clip(path, 70)}: ${clip(p.join('; '))}`);
    if (flagged.length > maxProblemsPerModel) lines.push(`  ! … ${flagged.length - maxProblemsPerModel} more in the report`);
  }
  const candidates = summaries.filter((s) => s.layoutStatus === 'candidate');
  if (candidates.length > 0) {
    lines.push('', 'Unconfirmed layouts checked against these files:');
    for (const s of candidates) {
      const ok = s.programs > 0 && s.cleanReads === s.programs;
      lines.push(`  ${s.programs === 0 ? '-   ' : ok ? 'OK  ' : 'LOOK'} ${s.name}: ${alignmentVerdict(s)}`);
    }
  }
  return lines.join('\n');
}
