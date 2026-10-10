/**
 * "Check this backup" — prove a Stage 4 `.ns4b` is intact and that what it holds
 * still reads, file by file, without a keyboard.
 *
 * Three layers, each only where there is evidence for it:
 *  1. **The archive.** Every ZIP entry's data — `meta.xml` and stray files included — is
 *     re-hashed against the CRC-32 the archive's central directory recorded for it
 *     (PKWARE APPNOTE 4.4.7). This catches any damage to the backup file itself.
 *  2. **The file's own check value.** The CBIN CRC-32 is
 *     verified where it is known to hold: programs (`.ns4p`, validated across real
 *     programs + the device corpus), pianos (the v6 CRC-32, or the v5 CRC-16 trailer) and format-1 samples (the header
 *     carries the field — `readNsp` / `readNsmp`). Live, preset and settings files
 *     are not CRC-checked here: their CBIN CRC hasn't been confirmed on files NSM
 *     wrote, so a mismatch would not be evidence of damage.
 *  3. **The content reads.** Programs and Live programs decode through
 *     `parseNs4Program`, presets through `parseNs4Preset`, pianos through the piano
 *     stroke decoder (`nsp-audio.ts` — every note of every velocity layer is
 *     decoded to its directory length), samples through the section reader. Sample
 *     *audio* is not decoded: the NW1 sample decoder runs at ~2.5 MB/s, which would
 *     turn a full Sample Library into many minutes. Settings are recognized only —
 *     there is no settings parameter map yet.
 *
 * Local only: the backup never leaves the machine; factory audio is decoded in
 * memory and discarded (`docs/LEGAL.md`, local device access). Messages are
 * musician-facing — no offsets, opcodes or checksums in the UI.
 */
import { readZipDirectory, extractZipEntry, type ZipEntry } from '../clavia/backup/zip-directory';
import { crc32, verifyNs4Checksum } from '../clavia/checksum';
import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { parseNs4Program } from './parse';
import { parseNs4Preset } from './preset';
import { readNsp } from './nsp';
import { readNspDirectory, decodeNspStroke } from './nsp-audio';
import { readNsmp } from './nsmp';

export type BackupItemKind = 'program' | 'live' | 'preset' | 'settings' | 'piano' | 'sample';

export const BACKUP_ITEM_KINDS: readonly BackupItemKind[] = ['program', 'live', 'preset', 'settings', 'piano', 'sample'];

/** File extension → what it is on a Stage 4. */
const KIND_BY_EXT: Record<string, BackupItemKind> = {
  ns4p: 'program',
  ns4l: 'live',
  ns4o: 'preset',
  ns4n: 'preset',
  ns4y: 'preset',
  ns4t: 'settings',
  npno: 'piano',
  nsmp: 'sample',
  nsmp3: 'sample',
  nsmp4: 'sample',
};

export interface BackupItemProblem {
  path: string;
  /** Display name — the filename without its extension. */
  name: string;
  /** `file`: not Stage 4 content (`meta.xml`, stray files) — only the archive layer applies. */
  kind: BackupItemKind | 'file';
  /** What's wrong, in the player's words. */
  message: string;
}

export interface BackupCheckReport {
  /** The archive has NSM's `meta.xml` header. */
  isNordBackup: boolean;
  /** Per kind: how many the backup holds, and how many passed every check. */
  counts: Record<BackupItemKind, { total: number; ok: number }>;
  /** Piano notes (velocity layers) decoded end to end. */
  pianoNotesChecked: number;
  /**
   * Notes OpenNord couldn't decode in pianos whose own checksum proves them intact: a gap in
   * OpenNord's decoder, not damage, so they aren't reported as problems.
   */
  pianoNotesSkipped: number;
  problems: BackupItemProblem[];
  /** Entries that aren't Stage 4 content (stray files): archive-checked only. */
  ignored: number;
  /** `meta.xml` plus the ignored entries — every one is still checked against the archive CRC. */
  otherChecked: number;
  /** The check was stopped before it finished; counts cover what was checked. */
  cancelled: boolean;
}

export interface BackupCheckProgress {
  /** Uncompressed bytes checked so far / in total — pianos dominate, so bytes track time. */
  doneBytes: number;
  totalBytes: number;
  /** Name of the file being checked. */
  current: string;
}

export interface BackupCheckOptions {
  onProgress?: (p: BackupCheckProgress) => void;
  signal?: AbortSignal;
  /** Decode every piano note (default true). Off = header + note list only. */
  playPianos?: boolean;
}

/** What a backup path holds, by its extension; null for anything that isn't Stage 4 content. */
export function backupItemKind(path: string): BackupItemKind | null {
  const base = path.replace(/^.*\//, '');
  if (path.endsWith('/') || path.startsWith('__MACOSX/') || base.startsWith('._')) return null;
  const dot = base.lastIndexOf('.');
  return dot < 0 ? null : KIND_BY_EXT[base.slice(dot + 1).toLowerCase()] ?? null;
}

const nameOf = (path: string) => path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');

const MSG = {
  archive: 'Damaged in this backup file — it no longer matches what was saved.',
  notNord: "Isn't a readable Nord file.",
  unreadable: "Can't be read — the file is intact in the backup but its contents don't make sense.",
  rejected: (what: string) => `Damaged — your Nord may refuse to load this ${what}.`,
  program: "Can't be read as a Stage 4 program.",
  preset: "Can't be read as a Stage 4 preset.",
  settings: "Isn't a Stage 4 settings file.",
  pianoNotes: "The piano's notes can't be found in the file.",
  pianoPlay: (bad: number, all: number) => `${bad} of its ${all} notes can't be played back.`,
  sample: "Isn't a readable Nord sample.",
  silent: 'Holds no sound.',
  incomplete: "This backup file is incomplete or damaged — it can't be restored as is.",
  readFailed: "Couldn't finish checking — the backup file couldn't be read. Make sure it isn't being changed or moved, then try again.",
} as const;

/** A check that couldn't finish. Its message is musician-facing and safe to show as is. */
export class BackupCheckError extends Error {}

/** The file couldn't be read at all (moved or re-synced on disk, out of memory) — not archive damage. */
const isReadFailure = (e: unknown) =>
  e instanceof RangeError || (typeof DOMException !== 'undefined' && e instanceof DOMException);

/** Let the page breathe between heavy steps (pianos run to hundreds of MB). */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Check one non-piano file's content. Returns a problem message, or null when it reads. */
export function checkBackupItem(kind: Exclude<BackupItemKind, 'piano'>, bytes: Uint8Array): string | null {
  if (kind === 'sample') {
    const s = readNsmp(bytes);
    if (!s.recognized || s.pianoLibrary) return MSG.sample;
    if (!s.checksumValid) return MSG.rejected('sample');
    return s.strokeCount > 0 ? null : MSG.silent;
  }
  if (!hasCbinMagic(bytes)) return MSG.notNord;
  const tag = fileTypeTag(bytes);
  if (kind === 'program' || kind === 'live') {
    if (tag !== 'ns4p' && tag !== 'ns4l') return MSG.program;
    // The CBIN CRC is proven for programs; Live's isn't confirmed on NSM-written files.
    if (tag === 'ns4p' && !verifyNs4Checksum(bytes)) return MSG.rejected('program');
    try {
      return parseNs4Program(bytes).parsed ? null : MSG.program;
    } catch {
      return MSG.program;
    }
  }
  if (kind === 'preset') return parseNs4Preset(bytes) ? null : MSG.preset;
  return tag === 'ns4t' ? null : MSG.settings; // settings: recognized only (no parameter map yet)
}

/**
 * Check a piano: header, checksum (CRC-32 in v6, CRC-16 trailer in v5), note directory, then — unless `play` is off —
 * decode every note to its full length. Yields between notes; reports per-note
 * progress through `onNote(fraction)`. Returns the problem message (or null) and how
 * many notes decoded.
 */
export async function checkPiano(
  bytes: Uint8Array,
  opts: { play?: boolean; signal?: AbortSignal; onNote?: (fraction: number) => void } = {},
): Promise<{ problem: string | null; notes: number; skipped: number }> {
  const header = readNsp(bytes);
  if (!header.recognized) return { problem: MSG.notNord, notes: 0, skipped: 0 };
  if (!header.checksumValid) return { problem: MSG.rejected('piano'), notes: 0, skipped: 0 };
  // A piano whose checksum holds (v6 CRC-32, v5 CRC-16 trailer) is byte-for-byte what Nord
  // wrote: anything OpenNord then fails to read is a gap in its decoder, not damage.
  const proven = header.hasChecksum;
  const dir = readNspDirectory(bytes);
  if (!dir) return { problem: proven ? null : MSG.pianoNotes, notes: 0, skipped: 0 };
  if (opts.play === false) return { problem: null, notes: 0, skipped: 0 };
  let bad = 0;
  let notes = 0;
  for (let i = 0; i < dir.strokes.length; i++) {
    if (opts.signal?.aborted) break;
    try {
      decodeNspStroke(bytes, dir, dir.strokes[i]);
      notes++;
    } catch {
      bad++;
    }
    opts.onNote?.((i + 1) / dir.strokes.length);
    if (i % 8 === 7) await tick();
  }
  if (proven) return { problem: null, notes, skipped: bad };
  return { problem: bad ? MSG.pianoPlay(bad, dir.strokes.length) : null, notes, skipped: 0 };
}

const emptyCounts = (): BackupCheckReport['counts'] =>
  Object.fromEntries(BACKUP_ITEM_KINDS.map((k) => [k, { total: 0, ok: 0 }])) as BackupCheckReport['counts'];

/**
 * Check a whole backup. Reads one entry at a time through ranged slices (multi-GB
 * backups never sit in memory whole) and never writes anything.
 */
export async function checkBackup(file: Blob, opts: BackupCheckOptions = {}): Promise<BackupCheckReport> {
  let entries: ZipEntry[];
  try {
    entries = await readZipDirectory(file);
  } catch (e) {
    // The organizer can open a backup whose end was cut off; its directory can't be read.
    throw new BackupCheckError(isReadFailure(e) ? MSG.readFailed : MSG.incomplete);
  }
  const report: BackupCheckReport = {
    isNordBackup: entries.some((e) => e.path === 'meta.xml'),
    counts: emptyCounts(),
    pianoNotesChecked: 0,
    pianoNotesSkipped: 0,
    problems: [],
    ignored: 0,
    otherChecked: 0,
    cancelled: false,
  };
  // Non-content entries (meta.xml, stray files) still get the archive CRC check.
  const work: { entry: ZipEntry; kind: BackupItemKind | null }[] = [];
  for (const entry of entries) {
    if (entry.path.endsWith('/')) continue;
    const kind = backupItemKind(entry.path);
    if (!kind && entry.path !== 'meta.xml') report.ignored++;
    work.push({ entry, kind });
  }
  const totalBytes = work.reduce((n, w) => n + w.entry.size, 0);
  let doneBytes = 0;

  for (const { entry, kind } of work) {
    if (opts.signal?.aborted) { report.cancelled = true; break; }
    const name = nameOf(entry.path);
    opts.onProgress?.({ doneBytes, totalBytes, current: name });
    let problem: string | null;
    let notes = 0;
    // An entry whose header or data is broken is archive damage; a failed read of the file
    // itself is not, and stops the check instead of misreporting every remaining entry.
    let bytes: Uint8Array | null;
    try {
      bytes = await extractZipEntry(file, entry);
    } catch (e) {
      if (isReadFailure(e)) throw new BackupCheckError(MSG.readFailed);
      bytes = null;
    }
    let skipped = 0;
    try {
      if (!bytes || (entry.crc32 !== undefined && crc32(bytes) !== entry.crc32)) {
        problem = MSG.archive;
      } else if (!kind) {
        problem = null;
      } else if (kind === 'piano') {
        const base = doneBytes;
        const r = await checkPiano(bytes, {
          play: opts.playPianos !== false,
          signal: opts.signal,
          onNote: (f) => opts.onProgress?.({ doneBytes: base + Math.round(f * entry.size), totalBytes, current: name }),
        });
        problem = r.problem;
        notes = r.notes;
        skipped = r.skipped;
      } else {
        problem = checkBackupItem(kind, bytes);
      }
    } catch {
      problem = MSG.unreadable; // a reader gave up on the content — intact archive, unreadable file
    }
    if (opts.signal?.aborted) { report.cancelled = true; break; }
    if (kind) report.counts[kind].total++;
    else report.otherChecked++;
    report.pianoNotesChecked += notes;
    report.pianoNotesSkipped += skipped;
    if (problem) report.problems.push({ path: entry.path, name, kind: kind ?? 'file', message: problem });
    else if (kind) report.counts[kind].ok++;
    doneBytes += entry.size;
    await tick();
  }
  if (!report.cancelled) opts.onProgress?.({ doneBytes: totalBytes, totalBytes, current: '' });
  return report;
}

const NOUN: Record<BackupItemKind, [string, string]> = {
  program: ['program', 'programs'],
  live: ['Live program', 'Live programs'],
  preset: ['preset', 'presets'],
  settings: ['settings file', 'settings files'],
  piano: ['piano', 'pianos'],
  sample: ['sample', 'samples'],
};

const count = (n: number, kind: BackupItemKind) => `${n} ${NOUN[kind][n === 1 ? 0 : 1]}`;

/** A short, musician-facing summary of a finished check. */
export function summarizeBackupCheck(r: BackupCheckReport): { ok: boolean; headline: string; contents: string; detail?: string } {
  const present = BACKUP_ITEM_KINDS.filter((k) => r.counts[k].total > 0);
  const contents = present.map((k) => count(r.counts[k].total, k)).join(' · ') || 'No Stage 4 content found';
  const content = present.reduce((n, k) => n + r.counts[k].total, 0);
  const checked = content + r.otherChecked;
  const ok = r.problems.length === 0 && !r.cancelled && content > 0;
  const headline = r.cancelled
    ? `Check stopped — ${checked - r.problems.length} of ${checked} files checked out so far.`
    : content === 0
      ? 'Nothing to check in this backup.'
      : r.problems.length === 0
        ? 'Everything in this backup checks out.'
        : `${r.problems.length} of ${checked} files ${r.problems.length === 1 ? 'needs' : 'need'} attention.`;
  const pianos = r.counts.piano;
  const notes = `${r.pianoNotesChecked} recorded note${r.pianoNotesChecked === 1 ? '' : 's'}`;
  const detail = pianos.ok === 0 || r.pianoNotesChecked === 0
    ? undefined
    : r.pianoNotesSkipped > 0
      ? `${notes} play back. OpenNord can't play ${r.pianoNotesSkipped} more yet — the pianos themselves are intact.`
      : pianos.ok === pianos.total
        ? `Every note of ${pianos.total === 1 ? 'the piano' : `all ${pianos.total} pianos`} plays back (${notes}).`
        : `${pianos.ok} of ${pianos.total} pianos play back in full (${notes}).`;
  return { ok, headline, contents, detail };
}
