import { strToU8 } from 'fflate';
import { STOPPED_ANSWERING, type NordSession } from './session';
import { TransportTimeoutError } from './transport';
import { readZipDirectory, extractZipEntry, storedEntryData, type ZipEntry } from '../clavia/backup/zip-directory';
import {
  STORED_ZIP_END_BYTES, STORED_ZIP_MAX_BYTES, StoredZipWriter, storedZipEntryOverhead,
} from '../clavia/backup/stored-zip';
import { NordError, SessionRefusedError } from './protocol';
import { deleteProgram, enumerateFiles, pullFile, pushFile, type ProgramEntry } from './transfer';
import { decodeBankList, readPartitionCapacity, type PartitionCapacity } from './capacity';
import { readCbinHeader, hasCbinMagic } from '../clavia/cbin';
import {
  NON_LIBRARY_PARTITIONS, USER_PARTITIONS, buildMetaXml, disambiguatePath, libraryForPartition, nameFromPath, partitionForPath,
  type PartitionSpec,
} from './ns4b';
import { CQryBankList } from './opcodes';
import { planLibraryRestore, readBackupLibraryFile, type BackupLibraryFile } from './library-restore';
import { addrKey, type Addr } from './reorg';
import { getErrorMessage } from '../errors';
import { WriteBlockedError, libraryWritesOn, type LibraryKind } from './write-guard';
import { readPartitionList, type PartitionInfo } from './partition-list';
import { fileBlocks, noFreePlaceReason, planFit } from './fit';
import { firstFreeLocation } from './locations';
import { StreamWriteError, createFileStreamed, deviceNameBytes, eraseBlocks, writeChunkBytes } from './stream-write';
import { LIBRARY_PARTITION, libraryFileRefusal } from './library-file';
import { REQUEST_TIMEOUT_MS, bracketUnlessLost, libraryPartitionInfo } from './send-library';
import { plural } from '../plural';
import { LEFT_OUT_REASON, libraryLeftOutWhy, type LibraryLeftOutWhy } from './restore-diff';

/** A sample or piano a restore left out, and why: its writes are off, or this keyboard's library isn't confirmed writable. */
export interface LeftOutFile { path: string; kind: LibraryKind; why: LibraryLeftOutWhy }

export interface RestoreResult {
  restored: number;
  /** Samples and pianos already on the Nord under the same name and size: not written again. */
  unchanged: number;
  /** Samples and pianos removed because the backup doesn't have them, or has another file under that name. */
  removed: number;
  /** Files left out: samples and pianos while they can't be written, and files OpenNord doesn't recognise. */
  skipped: number;
  /** Their zip paths. */
  skippedFiles: string[];
  /** The samples and pianos among {@link skippedFiles}, with the reason each was left out. */
  leftOut: LeftOutFile[];
  failures: { path: string; error: string }[];
  /** Names of the samples and pianos removed from the Nord. */
  removedFiles: string[];
  /** Of those, the ones whose backup copy then wasn't written: no longer on the Nord, still in the backup. */
  notRewritten: string[];
  /** The Nord stopped answering a write: the restore stopped there, and the player must reconnect before anything else. */
  sessionLost: boolean;
  /**
   * Why samples or pianos weren't restored, each once, in plain words (no codes): the
   * per-file `failures` say it per path, with the raw detail where there is one.
   */
  libraryReasons: string[];
  /**
   * A library stopped before removing anything, for a reason that doesn't say so itself
   * (no room, no free place, a write that failed). When nothing was removed at all, the
   * summary then adds that none were. A notice (a duplicate name) never sets it.
   */
  sayNoneRemoved: boolean;
}

type Progress = (done: number, total: number) => void;

/**
 * What a backup of this keyboard holds. Everything on a Stage 4 (with `libraries:
 * false`, everything but the Piano and Sample libraries); on any other model only its
 * programs, since {@link USER_PARTITIONS} are Stage 4 indices and name other things there.
 */
export function backupSpecs(session: NordSession, { libraries = true }: { libraries?: boolean } = {}): PartitionSpec[] {
  if (session.stage4Layout) return libraries ? USER_PARTITIONS : NON_LIBRARY_PARTITIONS;
  return [{ ...USER_PARTITIONS[0], partition: session.programPartition }];
}

/** True when {@link backup} saves everything, not just the programs. */
export function backsUpEverything(session: NordSession): boolean {
  return backupSpecs(session) === USER_PARTITIONS;
}

/** File name for a {@link backup} of this keyboard. Only a full one is a `.ns4b`
 *  (a Stage 4 backup, which Restore and Check backup read); a programs-only copy
 *  from another model is a plain zip of its program files. */
export function backupFilename(session: NordSession, title: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return backsUpEverything(session) ? `${title} ${day}.ns4b` : `${title} ${day} (programs).zip`;
}

/** Shown when the Nord won't open one of the memory areas a backup reads. */
export const BACKUP_REFUSED_MESSAGE =
  'Your Nord wouldn’t let OpenNord read part of its memory, so no backup was made. Unplug the ' +
  'USB cable and plug it back in, then try again.';

export interface BackupProgress { doneFiles: number; totalFiles: number; doneBytes: number; totalBytes: number }

export interface BackupOptions {
  /**
   * An earlier `.ns4b`. A sample or piano it already holds under the same path (so the
   * same name and bank), at the same place and with the same size, is copied from it
   * instead of read off the Nord again, as NSM's "update an existing archive" does.
   * Files are matched by name, place and size, never by content: a sample edited on the
   * Nord without changing its size keeps the earlier backup's copy.
   */
  previous?: Blob;
  /**
   * Told once, when a backup made with `previous` has finished: how many files were
   * copied from it, and whether it couldn't be read at all (then every file came off
   * the Nord). Not called without `previous`. The return type of {@link backup} is unchanged.
   *
   * There is no model check: a `meta.xml` product id isn't a reliable model. OpenNord
   * writes one fixed id whatever keyboard it backs up, and NSM's ids aren't mapped to
   * USB products. The place and size checks per file are the guard.
   */
  onReuse?: (stats: { reused: number; previousUnreadable: boolean }) => void;
  /**
   * False leaves the Piano and Sample libraries out (see {@link backupSpecs}). Only
   * read when `specs` isn't given.
   */
  libraries?: boolean;
}

/** The backup's progress in a musician's words. */
export function backupProgressText(p: BackupProgress): string {
  const pct = p.totalBytes ? Math.floor((p.doneBytes / p.totalBytes) * 100) : 0;
  return `Backing up… ${pct}% (${p.doneFiles} of ${p.totalFiles} files)`;
}

/**
 * Back up user content to a .ns4b — meta.xml + `<Folder>/<Bank>/<name>.<ext>` — as a
 * Blob written one file at a time, so a backup holding gigabytes of pianos never sits
 * in memory whole ({@link StoredZipWriter}: stored, sizes in the local headers, no data
 * descriptors; no ZIP64, so an archive stays under 4 GiB, which a Stage 4's 3 GiB of
 * libraries does). Read-only on the device: one
 * begin/end per partition. Sample and piano folders use the device's own bank names,
 * as NSM does. A partition the Nord refuses fails the backup
 * ({@link BACKUP_REFUSED_MESSAGE}). Without `specs`, what is read follows the
 * keyboard ({@link backupSpecs}); a programs-only copy carries no meta.xml.
 */
export async function backup(
  session: NordSession,
  onProgress?: (p: BackupProgress) => void,
  specs?: PartitionSpec[],
  opts: BackupOptions = {},
): Promise<Blob> {
  const ns4b = specs !== undefined || backsUpEverything(session);
  try {
    // Exclusive: the manual begin/end brackets must not interleave with any
    // other flow's frames on the shared pipe.
    return await session.exclusive(() =>
      backupUnlocked(session, onProgress, specs ?? backupSpecs(session, { libraries: opts.libraries }), ns4b, opts));
  } catch (cause) {
    if (cause instanceof SessionRefusedError) throw Object.assign(new NordError(BACKUP_REFUSED_MESSAGE), { cause });
    throw cause;
  }
}

/**
 * The backup taken before a reorganize ("Back up my Nord first"): everything a full
 * {@link backup} holds except the Piano and Sample libraries, which a reorganize never
 * touches and which would take many minutes to read.
 */
export function safetyBackup(session: NordSession): Promise<Blob> {
  return backup(session, undefined, undefined, { libraries: false });
}

/** A stored zip ({@link StoredZipWriter}) written into Blob parts as each file is added. */
class BlobZip {
  private parts: Blob[] = [];
  private writer = new StoredZipWriter();

  add(path: string, bytes: Uint8Array): void {
    this.parts.push(new Blob(this.writer.add(path, bytes).map((c) => c as unknown as BlobPart)));
  }

  /** An entry copied from another stored zip: its data stays a slice of that Blob, never read here. */
  addCopy(path: string, copy: StoredCopy): void {
    this.parts.push(new Blob([this.writer.addKnown(path, copy.data.size, copy.crc) as unknown as BlobPart]), copy.data);
  }

  finish(): Blob {
    this.parts.push(new Blob(this.writer.end().map((c) => c as unknown as BlobPart)));
    return new Blob(this.parts, { type: 'application/zip' });
  }
}

/** Shown when a backup would not fit the .ns4b format (no ZIP64). */
export const BACKUP_TOO_LARGE_MESSAGE =
  'This backup would be larger than 4 GB, which this backup format can’t hold. Nothing was saved.';

/** A bank name usable as a folder: not empty and not only dots, with path characters replaced. */
function bankFolderName(name: string): string | null {
  const clean = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return clean === '' || /^\.+$/.test(clean) ? null : clean;
}

/**
 * The device's bank names as folder names, else the spec's numbering. Only a refused or
 * unreadable bank list falls back; a lost Nord or an unanswered query fails the backup,
 * since a reply that arrives late would answer the next request.
 */
async function deviceBankLabels(session: NordSession, spec: PartitionSpec): Promise<(bank: number) => string> {
  const reply = await session.request(CQryBankList, [spec.partition]);
  if (reply.status !== 0) return spec.bankLabel;
  let names: (string | null)[];
  try {
    names = decodeBankList(reply.payload).banks.map((b) => bankFolderName(b.name));
  } catch {
    return spec.bankLabel; // a malformed list: the numbered folders
  }
  return (bank) => names[bank] ?? spec.bankLabel(bank);
}

/** The earlier backup's directory by path; empty when it isn't a readable zip (then every file is read off the Nord). */
async function previousDirectory(previous: Blob | undefined): Promise<{ dir: Map<string, ZipEntry>; unreadable: boolean }> {
  if (!previous) return { dir: new Map(), unreadable: false };
  try {
    return { dir: new Map((await readZipDirectory(previous)).map((e) => [e.path, e] as const)), unreadable: false };
  } catch {
    return { dir: new Map(), unreadable: true };
  }
}

/** A stored entry of an earlier backup: its data as a slice of that Blob, with the CRC its directory records. */
interface StoredCopy { data: Blob; crc: number }

/**
 * The earlier backup's copy of this file, when it is the same file at the same place.
 * A stored entry with a recorded CRC comes back as a {@link StoredCopy}, so its data
 * isn't read again; any other (a deflated one) is extracted.
 */
async function reusable(
  previous: Blob | undefined, path: string, zipEntry: ZipEntry | undefined, entry: ProgramEntry,
): Promise<StoredCopy | Uint8Array | null> {
  if (!previous || !zipEntry) return null;
  try {
    const f = await readBackupLibraryFile(previous, path, zipEntry);
    if (f.bank !== entry.bank || f.slot !== entry.slot || f.recordBytes !== entry.sizeBytes) return null;
    const data = zipEntry.crc32 === undefined ? null : await storedEntryData(previous, zipEntry);
    if (data) return { data, crc: zipEntry.crc32! };
    return await extractZipEntry(previous, zipEntry);
  } catch {
    return null; // unreadable in the old archive: read it off the Nord
  }
}

async function backupUnlocked(
  session: NordSession,
  onProgress: ((p: BackupProgress) => void) | undefined,
  specs: PartitionSpec[],
  ns4b: boolean,
  opts: BackupOptions,
): Promise<Blob> {
  const zip = new BlobZip();
  if (ns4b) zip.add('meta.xml', strToU8(buildMetaXml(0)));
  const { dir: previous, unreadable } = await previousDirectory(opts.previous);
  let reused = 0;
  // Pass 1: enumerate each partition (for the totals + the work list). Each
  // partition is its own begin/end session so the device returns to idle.
  const items: { spec: PartitionSpec; entry: ProgramEntry }[] = [];
  for (const spec of specs) {
    const entries = await session.bracket(spec.partition, () => enumerateFiles(session));
    for (const entry of entries) items.push({ spec, entry });
  }
  const totalBytes = items.reduce((n, i) => n + i.entry.sizeBytes, 0);
  // Each stored file is its CBIN header + record; the paths aren't known yet, so allow
  // a generous name. Checked up front so a too-large backup fails before minutes of reading.
  const ZIP_NAME_ALLOWANCE = 512;
  const CBIN_HEADER_ALLOWANCE = 64;
  const estimate = 128 + STORED_ZIP_END_BYTES
    + items.reduce((n, i) => n + i.entry.sizeBytes + CBIN_HEADER_ALLOWANCE + storedZipEntryOverhead('') + ZIP_NAME_ALLOWANCE, 0);
  if (estimate > STORED_ZIP_MAX_BYTES) throw new NordError(BACKUP_TOO_LARGE_MESSAGE);
  let doneFiles = 0;
  let doneBytes = 0;
  const report = (inFile = 0) => onProgress?.({ doneFiles, totalFiles: items.length, doneBytes: doneBytes + inFile, totalBytes });
  const written = new Set<string>();
  // Pass 2: pull each file, grouped by partition (one begin/end per partition).
  for (const spec of specs) {
    const group = items.filter((i) => i.spec.partition === spec.partition);
    if (group.length === 0) continue;
    await session.bracket(spec.partition, async () => {
      const library = spec.library ? { ...spec, bankLabel: await deviceBankLabels(session, spec) } : null;
      for (const { entry } of group) {
        // A library file is named by its partition's own extension (nsmp4, npno); the
        // device reports "nsmp" for a Stage 4 sample. Others keep the device's.
        const named = library ?? { ...spec, ext: /^[a-z0-9]{2,4}$/i.test(entry.fourcc) ? entry.fourcc : spec.ext };
        const path = disambiguatePath(named, entry.bank, entry.name, entry.slot, (p) => written.has(p));
        const kept = library ? await reusable(opts.previous, path, previous.get(path), entry) : null;
        if (kept) reused++;
        if (kept && !(kept instanceof Uint8Array)) zip.addCopy(path, kept);
        else zip.add(path, kept ?? await pullFile(session, entry, (done) => report(done)));
        written.add(path);
        doneFiles++;
        doneBytes += entry.sizeBytes;
        report();
      }
    });
  }
  if (opts.previous) opts.onReuse?.({ reused, previousUnreadable: unreadable });
  return zip.finish();
}

/**
 * True when Restore can be offered: programs, presets, Live and Settings, every
 * partition a backup writes outside the Piano and Sample libraries, are confirmed
 * writable on this keyboard. The libraries aren't required: a restore leaves out the
 * files of a library that isn't confirmed here and says so (`leftOut`, 'read-only'),
 * so the programs can still be restored. When false, offering Restore would only end
 * in a refusal (see {@link restore}).
 */
export function canRestore(session: NordSession): boolean {
  return NON_LIBRARY_PARTITIONS.every((p) => session.canWrite(p.partition));
}

export interface RestoreOptions {
  /** Per kind; defaults to the hardware gate (`libraryWritesOn`). */
  libraryWrites?: Partial<Record<LibraryKind, boolean>>;
  /** Bytes sent of the sample or piano being written. */
  onFileProgress?: (path: string, done: number, total: number) => void;
  /** For tests: how the erase poll waits. */
  sleep?: (ms: number) => Promise<void>;
}

type RestoreItem = { path: string; entry: ZipEntry };

/** Every sample and piano fails with this when the partition list can't be read. */
export const LAYOUT_UNREADABLE_MESSAGE = 'Couldn’t read your Nord’s memory layout; nothing was changed.';

/** The files a restore didn't reach after the Nord stopped answering. */
const NORD_SILENT_MESSAGE = 'Not restored: your Nord stopped answering, so OpenNord stopped.';

/**
 * Restore a .ns4b onto the device. Programs, presets, Live and Settings: each file
 * is written to its header's {bank, slot} (replacing what is there). Samples and
 * pianos, once their writes are on: NSM's by-name restore ({@link restoreLibrary}).
 * Best-effort: per-file failures are collected, not fatal. Refused as a whole
 * (`WriteBlockedError`, nothing written) unless {@link canRestore}.
 */
export function restore(
  session: NordSession,
  backup: Blob | Uint8Array,
  onProgress?: Progress,
  opts: RestoreOptions = {},
): Promise<RestoreResult> {
  // Real .ns4b backups run multi-GB — never materialize the whole archive.
  // A Blob source is read via ranged slices only (central directory + one
  // file at a time).
  const blob = backup instanceof Uint8Array ? new Blob([backup as unknown as BlobPart]) : backup;
  // Exclusive: see backup() — same shared-pipe rule for the write brackets.
  return session.exclusive(() => restoreUnlocked(session, blob, onProgress, opts));
}

async function restoreUnlocked(
  session: NordSession,
  blob: Blob,
  onProgress: Progress | undefined,
  opts: RestoreOptions,
): Promise<RestoreResult> {
  const entries = await readZipDirectory(blob);
  if (!entries.some((e) => e.path === 'meta.xml')) throw new NordError('Not a Nord backup (no meta.xml).');

  const result: RestoreResult = {
    restored: 0, unchanged: 0, removed: 0, skipped: 0, skippedFiles: [], leftOut: [], failures: [],
    removedFiles: [], notRewritten: [], sessionLost: false, libraryReasons: [], sayNoneRemoved: false,
  };
  const writesOn = (kind: LibraryKind) => opts.libraryWrites?.[kind] ?? libraryWritesOn(kind);
  const byPartition = new Map<number, RestoreItem[]>();
  for (const entry of entries) {
    const path = entry.path;
    if (path === 'meta.xml' || path.endsWith('/')) continue;
    const partition = partitionForPath(path);
    const kind = partition === null ? null : libraryForPartition(partition);
    const why = kind === null ? null : libraryLeftOutWhy(session, kind, writesOn(kind));
    if (partition === null || why !== null) {
      result.skipped++;
      result.skippedFiles.push(path);
      if (kind !== null && why !== null) result.leftOut.push({ path, kind, why });
      continue;
    }
    const list = byPartition.get(partition) ?? [];
    list.push({ path, entry });
    byPartition.set(partition, list);
  }
  const total = [...byPartition.values()].reduce((n, l) => n + l.length, 0);
  // All or nothing for programs, presets, Live and Settings: a backup's files are
  // addressed by Stage 4 partition, so unless every one of those is confirmed on this
  // keyboard, refuse the whole restore up front. Checking only the partitions this
  // archive uses is not enough: on a Stage 3, partition 7 is confirmed, as its
  // Programs, and an archive of Stage 4 organ presets alone would be written over them.
  if (!canRestore(session)) throw new WriteBlockedError();

  let done = 0;
  const tick = () => onProgress?.(++done, total);
  // One begin/end session per partition; the device returns to idle between them.
  for (const [partition, items] of byPartition) {
    if (libraryForPartition(partition) !== null) continue; // below, after the rest
    try {
      // A refused begin replies with a status rather than throwing; treat it like
      // an unreachable partition (else every write would fail the write gate).
      const begun = await session.begin(partition);
      if (begun.status !== 0) throw new NordError(`status ${begun.status}`);
    } catch (e) {
      // Whole partition unreachable — record each file as failed, don't abort the rest.
      const error = `Could not open partition ${partition}: ${getErrorMessage(e)}`;
      for (const { path } of items) { result.failures.push({ path, error }); tick(); }
      continue;
    }
    try {
      // Pre-flight capacity guard: translate "no room" into a friendly, up-front
      // failure instead of raw FileCreate status errors mid-restore. Overwriting an
      // occupied slot consumes no new slot, so only writes landing on empty slots
      // draw down free slots. Capacity/occupancy are best-effort — if either query
      // fails the guard stays open (freeSlots = ∞) and we just attempt the write.
      const occupied = await safeOccupiedSlots(session);
      const cap = await safeCapacity(session, partition);
      let freeSlots = cap ? cap.freeSlots : Infinity;

      for (const { path, entry } of items) {
        try {
          const bytes = await extractZipEntry(blob, entry); // one small file at a time
          if (!hasCbinMagic(bytes)) throw new NordError('not a Nord file (no CBIN magic)');
          const header = readCbinHeader(bytes);
          const isNewSlot = !occupied.has(slotKey(header.bank, header.location));
          if (isNewSlot && freeSlots <= 0) throw new NordError(partitionFullMessage(cap));
          await pushFile(session, header.bank, header.location, bytes, nameFromPath(path));
          if (isNewSlot) {
            occupied.add(slotKey(header.bank, header.location));
            freeSlots--;
          }
          result.restored++;
        } catch (e) {
          result.failures.push({ path, error: getErrorMessage(e) });
        }
        tick();
      }
    } finally {
      // Quietly: an end the Nord doesn't answer (unplugged) must not replace
      // the per-file result with its own error.
      await session.end().catch(() => undefined);
    }
  }

  // Samples and pianos. Every backup file of a library is checked before anything is
  // sent there; a library the archive has no files for never gets here, so it is never
  // planned against an empty list (which would remove everything in it).
  const libraries: LibraryJob[] = [];
  for (const [partition, items] of byPartition) {
    const kind = libraryForPartition(partition);
    if (kind === null) continue;
    const progress = new FileTally(items, result, tick);
    const files = await checkBackupFiles(blob, kind, items, progress);
    if (files) libraries.push({ kind, items, files, progress });
  }
  if (libraries.length === 0) return result;
  // NSM's 60 s bound on every reply, as Send to Nord has.
  await session.withReplyTimeout(REQUEST_TIMEOUT_MS, async () => {
    let list: PartitionInfo[];
    try {
      list = await readPartitionList(session);
    } catch (e) {
      console.warn('[restore] the partition list could not be read', e);
      if (e instanceof TransportTimeoutError) {
        // No reply: the replies are out of step, so nothing more goes to this Nord.
        session.markDead();
        result.sessionLost = true;
        for (const job of libraries) job.progress.failRest(NORD_SILENT_MESSAGE, null);
        return;
      }
      for (const job of libraries) job.progress.failRest(LAYOUT_UNREADABLE_MESSAGE);
      return;
    }
    for (const [i, job] of libraries.entries()) {
      if (await restoreLibrary(session, job, blob, list, result, opts)) {
        // The session is out of step: nothing more is sent until the player reconnects.
        result.sessionLost = true;
        for (const rest of libraries.slice(i + 1)) rest.progress.failRest(NORD_SILENT_MESSAGE, null);
        return;
      }
    }
  });
  return result;
}

interface LibraryJob { kind: LibraryKind; items: RestoreItem[]; files: BackupLibraryFile[]; progress: FileTally }

/**
 * Each of a library's files is ticked once: restored, unchanged or failed. A failure
 * can carry a `reason` for the player ({@link RestoreResult.libraryReasons}): a plain
 * sentence, said once however many files it stopped. Null keeps one out (raw detail,
 * or the "stopped answering" the summary says anyway).
 */
class FileTally {
  private pending: Set<string>;

  constructor(items: RestoreItem[], private result: RestoreResult, private tick: () => void) {
    this.pending = new Set(items.map((i) => i.path));
  }

  finish(path: string, error?: string, reason: string | null = null): void {
    if (!this.pending.delete(path)) return;
    if (error !== undefined) this.result.failures.push({ path, error });
    if (reason !== null) this.say(reason, false);
    this.tick();
  }

  /**
   * Fail every file not yet ticked; `reason` defaults to `error`, which must then be plain
   * words. Said only when a file is still pending. `noneRemoved`: the stop came before any
   * removal and its words don't say so ({@link RestoreResult.sayNoneRemoved}).
   */
  failRest(error: string, reason: string | null = error, noneRemoved = false): void {
    if (reason !== null && this.pending.size > 0) this.say(reason, noneRemoved);
    for (const path of [...this.pending]) this.finish(path, error);
  }

  private say(reason: string, noneRemoved: boolean): void {
    if (!this.result.libraryReasons.includes(reason)) this.result.libraryReasons.push(reason);
    if (noneRemoved) this.result.sayNoneRemoved = true;
  }
}

/**
 * Read every backup file of a library (one small ranged read each) and check the
 * writer would take it. One unreadable or refused file fails the whole library before
 * anything is sent: removing by name with that file missing would remove the Nord's
 * copy and write nothing in its place. Null when the library is not to be restored.
 */
async function checkBackupFiles(
  blob: Blob, kind: LibraryKind, items: RestoreItem[], progress: FileTally,
): Promise<BackupLibraryFile[] | null> {
  const files: BackupLibraryFile[] = [];
  let bad = false;
  for (const { path, entry } of items) {
    try {
      const f = await readBackupLibraryFile(blob, path, entry, kind);
      if (f.refusal !== undefined) {
        progress.finish(path, f.refusal, f.refusal);
        bad = true;
      } else {
        files.push(f);
      }
    } catch (e) {
      progress.finish(path, getErrorMessage(e)); // raw; the sentence below says it plainly
      bad = true;
    }
  }
  if (bad) {
    progress.failRest(`Not restored: another ${kind} in this backup can’t go to your Nord, so nothing in your Nord’s ${kind} memory was changed.`);
    return null;
  }
  return files.length > 0 ? files : null;
}

/**
 * NSM's by-name restore of one library:
 * plan by name, check the space with the removals counted, remove, erase the
 * shortfall, write each file at its header's place when free. When the space check
 * fails, nothing is removed. The first removal or write that fails stops the library;
 * the files removed whose backup copy wasn't then written are listed in
 * `notRewritten`. Returns true when the Nord stopped answering a write: the session is
 * then abandoned without an end, and the caller stops the restore.
 */
async function restoreLibrary(
  session: NordSession,
  { kind, items, files, progress }: LibraryJob,
  blob: Blob,
  list: PartitionInfo[],
  result: RestoreResult,
  opts: RestoreOptions,
): Promise<boolean> {
  let info: PartitionInfo;
  let chunkBytes: number;
  try {
    info = libraryPartitionInfo(list, kind);
    chunkBytes = writeChunkBytes(info.writeAlign); // before any removal: an impossible alignment refuses the library
  } catch (e) {
    progress.failRest(getErrorMessage(e)); // libraryPartitionInfo's or writeChunkBytes's own sentence
    return false;
  }
  const partition = LIBRARY_PARTITION[kind];
  const geometry = { blockBytes: info.blockBytes };
  const zipEntry = new Map(items.map((i) => [i.path, i.entry] as const));
  const removed: ProgramEntry[] = [];
  const written = new Set<string>();
  const state: { rewrites: Set<string>; writing: string | null } = { rewrites: new Set(), writing: null };
  try {
    await bracketUnlessLost(session, partition, async () => {
      // Strict: a short listing would remove nothing it should, but write over names it missed.
      const onNord = await enumerateFiles(session, Infinity, { strict: true });
      const plan = planLibraryRestore(onNord, files);
      if (plan.aborted) { // not reached: checkBackupFiles already refused these
        progress.failRest(`Not restored: nothing in your Nord’s ${kind} memory was changed.`);
        return;
      }
      state.rewrites = new Set(plan.write.map((f) => f.name));
      for (const f of plan.duplicates) {
        const notice = `This backup has two ${kind}s called “${f.name}”, and a Nord keeps one per name; the first was restored.`;
        progress.finish(f.path, notice, notice);
      }
      for (const f of plan.unchanged) { result.unchanged++; progress.finish(f.path); }
      const sizes = plan.write.map((f) => f.recordBytes);
      const cap = await readPartitionCapacity(session, partition, geometry);
      const room = planFit(cap, info, sizes, {
        label: kind,
        releasedBlocks: plan.remove.reduce((n, d) => n + fileBlocks(d.sizeBytes, info), 0),
        releasedSlots: plan.remove.length,
      });
      // Nothing removed. An unreadable layout's reason says so itself.
      if (!room.fits) { progress.failRest(room.reason, room.reason, info.blockBytes > 0); return; }
      const removing = new Set(plan.remove);
      const blocked = dryRunWrites(kind, plan.write, onNord.filter((d) => !removing.has(d)), cap.banks);
      if (blocked) { progress.failRest(blocked.reason, blocked.reason, !blocked.saysUnchanged); return; } // nothing removed
      for (const d of plan.remove) {
        try {
          await deleteProgram(session, d.bank, d.slot);
        } catch (e) {
          if (e instanceof TransportTimeoutError) throw e; // out of step: bracketUnlessLost, no end
          progress.failRest(
            `Not restored: removing “${d.name}” from your Nord failed (${getErrorMessage(e)}), so OpenNord stopped.`,
            `Not restored: removing “${d.name}” from your Nord failed, so OpenNord stopped.`,
          );
          return;
        }
        removed.push(d);
        result.removed++;
        result.removedFiles.push(d.name);
      }
      let eraseCount = room.eraseBlocks;
      if (plan.remove.length > 0) {
        const after = planFit(await readPartitionCapacity(session, partition, geometry), info, sizes, { label: kind });
        if (!after.fits) { progress.failRest(after.reason); return; }
        eraseCount = after.eraseBlocks;
      }
      await eraseBlocks(session, eraseCount, { sleep: opts.sleep });
      // The places just emptied count as free (NSM's queued deletes), so `removed` stays out.
      const gone = new Set(removed);
      const stays = onNord.filter((d) => !gone.has(d));
      const taken: Addr[] = [];
      for (const f of plan.write) {
        state.writing = f.path;
        try {
          const bytes = await extractZipEntry(blob, zipEntry.get(f.path)!);
          const refused = libraryFileRefusal(kind, bytes);
          if (refused) throw new NordError(refused);
          const at = firstFreeLocation(stays, cap.banks, { prefer: { bank: f.bank, slot: f.slot }, taken });
          if (!at) throw new NordError(noFreePlaceReason(kind));
          taken.push(await createFileStreamed(session, { bytes, name: f.name, ...at }, {
            chunkBytes,
            onProgress: (doneBytes, totalBytes) => opts.onFileProgress?.(f.path, doneBytes, totalBytes),
          }));
        } catch (e) {
          // A close the Nord never answered: leave without an end (bracketUnlessLost).
          if (e instanceof StreamWriteError && e.closeStatus === undefined) throw e;
          progress.finish(f.path, getErrorMessage(e));
          const stopped = `Not restored: OpenNord stopped after “${f.name}” couldn’t be written.`;
          progress.failRest(stopped, stopped, true);
          return;
        }
        state.writing = null;
        result.restored++;
        written.add(f.name);
        progress.finish(f.path);
      }
    });
  } catch (e) {
    // A lost close, or any reply that never came inside the bracket (it marked the session dead).
    if ((e instanceof StreamWriteError && e.sessionLost) || session.isDead) {
      if (state.writing !== null) progress.finish(state.writing, getErrorMessage(e));
      progress.failRest(NORD_SILENT_MESSAGE, null);
      return true;
    }
    progress.failRest(getErrorMessage(e), `Your Nord’s ${kind}s couldn’t all be restored: something went wrong while OpenNord was writing them.`, true);
  } finally {
    for (const d of removed) if (state.rewrites.has(d.name) && !written.has(d.name)) result.notRewritten.push(d.name);
  }
  return false;
}

/**
 * Before anything is removed: would every write find a place (the places the removals
 * empty count as free, and each write takes one), and does every name stay its own
 * once the Nord cuts it to 128 bytes? The reason to refuse the library, or null. The
 * Nord may still choose another place than this pass did; this only proves one exists.
 */
function dryRunWrites(
  kind: LibraryKind, writes: BackupLibraryFile[], stays: ProgramEntry[], banks: PartitionCapacity['banks'],
): { reason: string; saysUnchanged: boolean } | null {
  const taken: Addr[] = [];
  for (const f of writes) {
    const at = firstFreeLocation(stays, banks, { prefer: { bank: f.bank, slot: f.slot }, taken });
    if (!at) return { reason: noFreePlaceReason(kind), saysUnchanged: false };
    taken.push(at);
  }
  const decoder = new TextDecoder();
  const owner = new Map(stays.map((d) => [decoder.decode(deviceNameBytes(d.name)), d.name] as const));
  for (const f of writes) {
    const key = decoder.decode(deviceNameBytes(f.name));
    const other = owner.get(key);
    if (other !== undefined && other !== f.name) {
      return {
        reason: `Nothing in your Nord’s ${kind} memory was changed: “${other}” and “${f.name}” would get the same name on your Nord, `
          + 'which cuts long names short and keeps one per name. Shorten one of them, then restore again.',
        saysUnchanged: true,
      };
    }
    owner.set(key, f.name);
  }
  return null;
}

/** A restore's outcome in a musician's words. */
export function restoreSummary(r: RestoreResult): string {
  const counts = [`Restored ${plural(r.restored, 'file')}`];
  if (r.unchanged) counts.push(`${r.unchanged} already on your Nord`);
  if (r.removed) counts.push(`removed ${plural(r.removed, 'sample or piano', 'samples or pianos')}`);
  if (r.failures.length) counts.push(`${r.failures.length} couldn’t be written`);
  const lines = [`${counts.join('; ')}.`];
  // Why samples and pianos weren't restored, each once; and, when a library stopped
  // without saying so and none was removed, that too.
  for (const reason of r.libraryReasons) lines.push(/[.!?]$/.test(reason) ? reason : `${reason}.`);
  if (r.sayNoneRemoved && r.removed === 0) lines.push('No samples or pianos were removed from your Nord.');
  for (const why of ['not-yet-tried', 'stage4-only', 'read-only'] as const) {
    const files = r.leftOut.filter((f) => f.why === why);
    if (files.length === 0) continue;
    const samples = files.filter((f) => f.kind === 'sample').length;
    const pianos = files.length - samples;
    const what = [samples && plural(samples, 'sample'), pianos && plural(pianos, 'piano')].filter(Boolean).join(' and ');
    lines.push(`${what} ${files.length === 1 ? 'wasn’t' : 'weren’t'} restored: ${LEFT_OUT_REASON[why]}.`);
  }
  const unknown = r.skipped - r.leftOut.length;
  if (unknown > 0) lines.push(`Left out ${plural(unknown, 'file')} OpenNord doesn’t recognise.`);
  if (r.notRewritten.length) lines.push(`No longer on your Nord, but still in your backup: ${r.notRewritten.join(', ')}.`);
  if (r.sessionLost) lines.push(STOPPED_ANSWERING);
  return lines.join(' ');
}

const slotKey = (bank: number, slot: number) => addrKey({ bank, slot });

/** Currently-occupied {bank, slot} keys in the begun partition; empty set on failure. */
async function safeOccupiedSlots(session: NordSession): Promise<Set<string>> {
  try {
    return new Set((await enumerateFiles(session)).map((e) => slotKey(e.bank, e.slot)));
  } catch {
    return new Set();
  }
}

/** Read a partition's capacity, or null if the queries aren't answered. */
async function safeCapacity(session: NordSession, partition: number): Promise<PartitionCapacity | null> {
  try {
    return await readPartitionCapacity(session, partition);
  } catch {
    return null;
  }
}

function partitionFullMessage(cap: PartitionCapacity | null): string {
  return cap
    ? `No free slots — ${cap.fileCount} of ${cap.totalSlots} used. Delete some files and restore again.`
    : 'No free slots left on the device. Delete some files and restore again.';
}
