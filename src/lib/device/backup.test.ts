import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate';
import { NordSession, STOPPED_ANSWERING } from './session';
import { MockTransport } from './transport';
import { encodeMessage, decodeReply } from './protocol';
import {
  CReqBegin, CReqEnd, CQryFileInfo, CQryFileIterate, CReqFileOpen, CReqFileClose, CReqFileRead, ext2Type,
  CReqFileCreate, CReqFileWrite, CQryBankList, CReqFileDelete, CReqEraseBlock, CQryEraseStatus, CQryPartList,
} from './opcodes';
import { cbinRecord, readCbinHeader } from '../clavia/cbin';
import {
  backup, backupFilename, backupProgressText, backupSpecs, canRestore, restore, restoreSummary, safetyBackup,
  BACKUP_REFUSED_MESSAGE, BACKUP_TOO_LARGE_MESSAGE, LAYOUT_UNREADABLE_MESSAGE, type RestoreResult,
} from './backup';
import { loadBackupStreaming, streamBackupTo } from './backup-io';
import { streamUnzip } from '../folder/unzip-stream';
import { NON_LIBRARY_PARTITIONS, USER_PARTITIONS, buildMetaXml } from './ns4b';
import {
  FLAGS_NO_ERASE, ScriptedTransport, TIMEOUT, ack as ackWords, bankList as bankListOf, cbinFile, info as infoOf, iter as iterOf,
  partList, partState as stateOf, sentIds, status as statusOf, testSample,
} from './wire-replies';
import { NSMP4_ONLY } from './library-file';
import { noFreePlaceReason } from './fit';
import { WriteBlockedError } from './write-guard';

/** A session confirmed writable on every Stage 4 user partition (a trusted layout). */
function stage4Session(t: MockTransport): NordSession {
  const s = new NordSession(t);
  s.stage4Layout = true;
  s.allowWrites(USER_PARTITIONS.map((p) => p.partition));
  return s;
}

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const ack = (op: number) => encodeMessage(op | 1, [0]);
/** FileInfo's answer for a slot that holds nothing: what pushFile asks before it writes. */
const emptySlot = encodeMessage(CQryFileInfo | 1, [1]);
const iter = (code: number, bank: number, slot: number) => encodeMessage(CQryFileIterate | 1, [code, bank, slot]);
function info(o: { size: number; version: number; category: number; name: string }) {
  const nb = new TextEncoder().encode(o.name);
  return encodeMessage(CQryFileInfo | 1, [0, 0, 0, o.size, ext2Type('ns4p'), o.version, 0, o.category, nb.length], nb);
}
function readReply(body: Uint8Array) {
  return encodeMessage(CReqFileRead | 1, [0, 0, 0, 0, body.length], body);
}
// Capacity replies restore() now reads as a pre-flight guard.
const partState = (fileCount: number) => encodeMessage(0x09, [0, fileCount, 0, 1000, 0, 0]);
function bankList(caps: number[]) {
  const trailing: number[] = [caps.length]; // u8 bank count, then {u32 nameLen, name, u32 slotCapacity}…
  caps.forEach((cap, i) => {
    const nb = [...new TextEncoder().encode(`Bank ${String.fromCharCode(65 + i)}`)];
    trailing.push(0, 0, 0, nb.length, ...nb, (cap >>> 24) & 255, (cap >>> 16) & 255, (cap >>> 8) & 255, cap & 255);
  });
  return encodeMessage(0x03, [0, 6], new Uint8Array(trailing));
}
/** The queries restore() issues right after begin(): enumerate (empty) + CQryPartState + CQryBankList. */
const preflight = (fileCount = 0, caps = [64]) => [iter(2, 0, 0), partState(fileCount), bankList(caps)];

/** Unzip a backup Blob. */
async function unzipBlob(blob: Blob) {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

describe('backup', () => {
  it('produces a .ns4b zip with meta.xml + the file at its NSM path', async () => {
    const programSpec = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const header = readCbinHeader(fixtureBytes); // bank 7 (H), location 56
    const body = fixtureBytes.subarray(44);
    // Backup of ONLY the Program partition (specs override), holding one file.
    const replies = [
      // pass 1: enumerate Program
      ack(CReqBegin), iter(0, header.bank, header.location),
      info({ size: body.length, version: header.versionRaw, category: header.category, name: 'regressionTest' }),
      iter(2, header.bank, 0), ack(CReqEnd),
      // pass 2: pull the file
      ack(CReqBegin), ack(CReqFileOpen), readReply(body), ack(CReqFileClose), ack(CReqEnd),
      // finally: re-begin Program
      ack(CReqBegin),
    ];
    const session = new NordSession(new MockTransport(replies));

    const files = await unzipBlob(await backup(session, undefined, [programSpec]));
    expect(Object.keys(files)).toContain('meta.xml');
    expect(strFromU8(files['meta.xml'])).toContain('backup_format_version="1"');
    expect(Object.keys(files)).toContain('Program/Bank H/regressionTest.ns4p');
    // the stored file is a full CBIN file (header + body)
    expect(files['Program/Bank H/regressionTest.ns4p'].length).toBe(fixtureBytes.length);
  });

  it('fails when the Nord refuses a partition, instead of leaving it out', async () => {
    const programSpec = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const refused = encodeMessage(CReqBegin | 1, [2]);
    const session = new NordSession(new MockTransport([refused, ack(CReqEnd)]));
    await expect(backup(session, undefined, [programSpec])).rejects.toThrow(BACKUP_REFUSED_MESSAGE);
  });

  it('on a model without the Stage 4 layout, backs up its programs only, under their own extension', async () => {
    const header = readCbinHeader(fixtureBytes);
    const body = fixtureBytes.subarray(44);
    const ns3Info = (() => {
      const nb = new TextEncoder().encode('Stage 3 Program');
      return encodeMessage(CQryFileInfo | 1, [0, 0, 0, body.length, ext2Type('ns3f'), header.versionRaw, 0, header.category, nb.length], nb);
    })();
    const transport = new MockTransport([
      ack(CReqBegin), iter(0, header.bank, header.location), ns3Info, iter(2, header.bank, 0), ack(CReqEnd),
      ack(CReqBegin), ack(CReqFileOpen), readReply(body), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const session = new NordSession(transport);
    session.programPartition = 7; // where a Stage 3 keeps its programs
    expect(backupSpecs(session).map((s) => s.partition)).toEqual([7]);

    const files = await unzipBlob(await backup(session));
    // No meta.xml: nothing must take this for a Stage 4 backup.
    expect(Object.keys(files)).toEqual(['Program/Bank H/Stage 3 Program.ns3f']);
    expect(backupFilename(session, 'OpenNord Backup', new Date('2026-10-12'))).toBe('OpenNord Backup 2026-10-12 (programs).zip');
  });

  it('on a Stage 4, backs up every user partition', () => {
    const session = new NordSession(new MockTransport([]));
    session.stage4Layout = true;
    expect(backupSpecs(session)).toEqual(USER_PARTITIONS);
    expect(backupFilename(session, 'OpenNord Backup', new Date('2026-10-12'))).toBe('OpenNord Backup 2026-10-12.ns4b');
  });

  it('excludes concurrent session use while a backup runs', async () => {
    const programSpec = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const header = readCbinHeader(fixtureBytes);
    const body = fixtureBytes.subarray(44);
    const replies = [
      // The backup starts first, so it must own the pipe end-to-end…
      ack(CReqBegin), iter(0, header.bank, header.location),
      info({ size: body.length, version: header.versionRaw, category: header.category, name: 'regressionTest' }),
      iter(2, header.bank, 0), ack(CReqEnd),
      ack(CReqBegin), ack(CReqFileOpen), readReply(body), ack(CReqFileClose), ack(CReqEnd),
      // …and only then does the racing withSession op get its frames.
      ack(CReqBegin),
      info({ size: 1, version: 0, category: 0, name: 'x' }),
      ack(CReqEnd),
    ];
    const session = new NordSession(new MockTransport(replies));

    const [zip, reply] = await Promise.all([
      backup(session, undefined, [programSpec]),
      session.withSession(6, () => session.request(CQryFileInfo, [0, 0])),
    ]);
    expect(Object.keys(await unzipBlob(zip))).toContain('Program/Bank H/regressionTest.ns4p');
    expect(reply.msgId).toBe(CQryFileInfo | 1);
  });
});

describe('backup of the sample library', () => {
  const record = testSample({ name: 'Pad' });
  const sampleSpec = USER_PARTITIONS.find((p) => p.partition === 5)!;
  const withHeader = (slot: number) => cbinFile(record, { slot });
  const listOnePad = [ack(CReqBegin), iterOf(0, 0, 3), infoOf('Pad', record.length), iterOf(1, 0, 0), iterOf(2, 1, 0), ack(CReqEnd)];
  const sampleRead = encodeMessage(CReqFileRead | 1, [0, 0, 3, 0, record.length], record);
  const previousWith = (bytes: Uint8Array) =>
    new Blob([zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), 'Samp Lib/User 1/Pad.nsmp4': bytes }, { level: 0 }) as unknown as BlobPart]);

  it('files each sample under the device’s bank name with the .nsmp4 extension, reporting bytes', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const progress: unknown[] = [];
    const files = await unzipBlob(await backup(new NordSession(t), (p) => progress.push(p), [sampleSpec]));
    expect(Object.keys(files)).toEqual(['meta.xml', 'Samp Lib/User 1/Pad.nsmp4']);
    expect([...cbinRecord(files['Samp Lib/User 1/Pad.nsmp4'])]).toEqual([...record]);
    expect(sentIds(t)).toContain(CQryBankList);
    expect(progress.at(-1)).toEqual({ doneFiles: 1, totalFiles: 1, doneBytes: record.length, totalBytes: record.length });
  });

  it('copies a sample an earlier backup already holds at the same place, without reading it again', async () => {
    const t = new MockTransport([...listOnePad, ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqEnd)]);
    const files = await unzipBlob(await backup(new NordSession(t), undefined, [sampleSpec], { previous: previousWith(withHeader(3)) }));
    expect([...files['Samp Lib/User 1/Pad.nsmp4']]).toEqual([...withHeader(3)]);
    expect(sentIds(t)).not.toContain(CReqFileOpen);
  });

  it('passes a stored copy through as a slice of the earlier backup: its data is never read whole', async () => {
    const t = new MockTransport([...listOnePad, ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqEnd)]);
    const prev = previousWith(withHeader(3));
    // Record the size of every read of the earlier backup; a slice itself reads nothing.
    const reads: number[] = [];
    class Tracked extends Blob {
      override slice(start?: number, end?: number): Blob {
        const part = super.slice(start, end);
        const read = part.arrayBuffer.bind(part);
        return Object.assign(part, { arrayBuffer: () => { reads.push(part.size); return read(); } });
      }
    }
    const tracked = new Tracked([prev]);
    const files = await unzipBlob(await backup(new NordSession(t), undefined, [sampleSpec], { previous: tracked }));
    expect([...files['Samp Lib/User 1/Pad.nsmp4']]).toEqual([...withHeader(3)]);
    // The directory tail and the headers only; extracting it would read exactly its bytes.
    expect(reads).not.toContain(withHeader(3).length);
  });

  it('reports how many files it copied from the earlier backup', async () => {
    const t = new MockTransport([...listOnePad, ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqEnd)]);
    const stats: unknown[] = [];
    await backup(new NordSession(t), undefined, [sampleSpec], { previous: previousWith(withHeader(3)), onReuse: (x) => stats.push(x) });
    expect(stats).toEqual([{ reused: 1, previousUnreadable: false }]);
  });

  it('reports zero copied when the earlier backup had the sample at another place', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const stats: unknown[] = [];
    await backup(new NordSession(t), undefined, [sampleSpec], { previous: previousWith(withHeader(2)), onReuse: (x) => stats.push(x) });
    expect(stats).toEqual([{ reused: 0, previousUnreadable: false }]);
  });

  it('says so when the earlier backup couldn’t be read, and says nothing without one', async () => {
    const reads = () => new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const stats: unknown[] = [];
    await backup(new NordSession(reads()), undefined, [sampleSpec], { previous: new Blob(['not a zip']), onReuse: (x) => stats.push(x) });
    expect(stats).toEqual([{ reused: 0, previousUnreadable: true }]);
    await backup(new NordSession(reads()), undefined, [sampleSpec], { onReuse: (x) => stats.push(x) });
    expect(stats).toHaveLength(1);
  });

  it('reads a sample again when the earlier backup had it at another place', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    await backup(new NordSession(t), undefined, [sampleSpec], { previous: previousWith(withHeader(2)) });
    expect(sentIds(t)).toContain(CReqFileOpen);
  });

  it('falls back to numbered bank folders when the bank list isn’t answered', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), encodeMessage(CQryBankList | 1, [2]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const files = await unzipBlob(await backup(new NordSession(t), undefined, [sampleSpec]));
    expect(Object.keys(files)).toContain('Samp Lib/Bank 1/Pad.nsmp4');
  });

  it('fails before reading anything when the backup would pass 4 GB', async () => {
    const huge = 0xffff_ff00;
    const t = new MockTransport([ack(CReqBegin), iterOf(0, 0, 3), infoOf('Pad', huge), iterOf(1, 0, 0), iterOf(2, 1, 0), ack(CReqEnd)]);
    await expect(backup(new NordSession(t), undefined, [sampleSpec])).rejects.toThrow(BACKUP_TOO_LARGE_MESSAGE);
    expect(sentIds(t)).not.toContain(CReqFileOpen);
  });

  it('reads everything off the Nord when the earlier backup isn’t a readable zip', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const previous = new Blob(['this is not a zip at all']);
    const files = await unzipBlob(await backup(new NordSession(t), undefined, [sampleSpec], { previous }));
    expect([...cbinRecord(files['Samp Lib/User 1/Pad.nsmp4'])]).toEqual([...record]);
  });

  it('numbers a bank whose name is only dots, so it can’t climb out of its folder', async () => {
    const t = new MockTransport([
      ...listOnePad,
      ack(CReqBegin), bankListOf(5, [['..', 100]]), ack(CReqFileOpen), sampleRead, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const files = await unzipBlob(await backup(new NordSession(t), undefined, [sampleSpec]));
    expect(Object.keys(files)).toContain('Samp Lib/Bank 1/Pad.nsmp4');
  });

  it('fails when the bank list goes unanswered, rather than read on out of step', async () => {
    const t = new ScriptedTransport([...listOnePad, ack(CReqBegin), TIMEOUT, ack(CReqEnd)]);
    await expect(backup(new NordSession(t), undefined, [sampleSpec])).rejects.toThrow(/didn't answer/);
    expect(sentIds(t)).not.toContain(CReqFileOpen);
  });

  it('streams back in through the Backup Organizer byte for byte, even when a sample holds zip markers', async () => {
    // Zip signatures inside the audio: a reader that ends an entry at the first one truncates it.
    const marked = new Uint8Array([...record, 0x50, 0x4b, 0x07, 0x08, 1, 2, 0x50, 0x4b, 0x01, 0x02, 3, 0x50, 0x4b, 0x03, 0x04, 4, 5, 6]);
    const read = encodeMessage(CReqFileRead | 1, [0, 0, 3, 0, marked.length], marked);
    const t = new MockTransport([
      ack(CReqBegin), iterOf(0, 0, 3), infoOf('Pad', marked.length), iterOf(1, 0, 0), iterOf(2, 1, 0), ack(CReqEnd),
      ack(CReqBegin), bankListOf(5, [['User 1', 100]]), ack(CReqFileOpen), read, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const blob = await backup(new NordSession(t), undefined, [sampleSpec]);
    const expected = await unzipBlob(blob);
    expect([...cbinRecord(expected['Samp Lib/User 1/Pad.nsmp4'])]).toEqual([...marked]);

    const streamed: Record<string, Uint8Array> = {};
    await streamUnzip(blob.stream(), (e) => { streamed[e.path] = e.bytes; });
    expect(streamed).toEqual(expected);

    const model = await loadBackupStreaming(blob);
    const chunks: Uint8Array[] = [];
    await streamBackupTo(model, new WritableStream<Uint8Array>({ write(c) { chunks.push(c.slice()); } }));
    const exported = new Blob(chunks.map((c) => c as unknown as BlobPart));
    const reStreamed: Record<string, Uint8Array> = {};
    await streamUnzip(exported.stream(), (e) => { reStreamed[e.path] = e.bytes; });
    expect(reStreamed).toEqual(expected);
    expect(await unzipBlob(exported)).toEqual(expected);
  });

  it('words its progress in files and percent', () => {
    expect(backupProgressText({ doneFiles: 3, totalFiles: 8, doneBytes: 250, totalBytes: 1000 })).toBe('Backing up… 25% (3 of 8 files)');
    expect(backupProgressText({ doneFiles: 0, totalFiles: 0, doneBytes: 0, totalBytes: 0 })).toBe('Backing up… 0% (0 of 0 files)');
  });
});

describe('the safety backup before a reorganize', () => {
  /** The partition each Begin opened, in order. */
  const begunPartitions = (t: MockTransport) =>
    t.sent.map((f) => decodeReply(f)).filter((m) => m.msgId === CReqBegin).map((m) => m.words[0]);
  /** An empty partition: begin, no files, end. */
  const emptyPartition = [ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd)];

  it('on a Stage 4, reads programs, presets, Live and Settings, never the Piano or Sample library', async () => {
    const t = new MockTransport(NON_LIBRARY_PARTITIONS.flatMap(() => emptyPartition));
    const session = new NordSession(t);
    session.stage4Layout = true;
    expect(backupSpecs(session, { libraries: false })).toEqual(NON_LIBRARY_PARTITIONS);
    const files = await unzipBlob(await safetyBackup(session));
    expect(begunPartitions(t)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(Object.keys(files)).toEqual(['meta.xml']);
  });

  it('on another model, reads its programs only, as the full backup does', async () => {
    const t = new MockTransport(emptyPartition);
    const session = new NordSession(t);
    session.programPartition = 7;
    expect(Object.keys(await unzipBlob(await safetyBackup(session)))).toEqual([]);
    expect(begunPartitions(t)).toEqual([7]);
  });

  it('the full backup on a Stage 4 reads the libraries too', async () => {
    const t = new MockTransport(USER_PARTITIONS.flatMap(() => emptyPartition));
    const session = new NordSession(t);
    session.stage4Layout = true;
    await backup(session);
    expect(begunPartitions(t)).toEqual([6, 7, 8, 9, 10, 11, 1, 5]);
  });
});

describe('restore', () => {
  it('writes each file to its header-derived slot and leaves out samples while their writes are off', async () => {
    const header = readCbinHeader(fixtureBytes); // bank 7, location 56
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
      'Samp Lib/Pad/Some Sample.nsmp4': new Uint8Array([1, 2, 3]), // factory → skipped
    }, { level: 0 });

    const replies = [
      ack(CReqBegin),               // begin(Program)
      ...preflight(),               // guard: empty partition, 64 free slots
      emptySlot, ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose),
      ack(CReqEnd),
      ack(CReqBegin),               // finally re-begin(Program)
    ];
    const t = new MockTransport(replies);
    const result = await restore(stage4Session(t), zip, undefined, { libraryWrites: { sample: false, piano: false } });
    expect(result.restored).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.skippedFiles).toEqual(['Samp Lib/Pad/Some Sample.nsmp4']);
    expect(result.failures).toEqual([]);
    const createFrame = t.sent.find((f) => decodeReply(f).msgId === CReqFileCreate)!;
    const create = decodeReply(createFrame);
    expect(create.words.slice(0, 2)).toEqual([header.bank, header.location]);
  });

  it('leaves a piano in the backup alone while piano writes are off, saying why', async () => {
    const zip = zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), 'Piano/Bank 1/Royal Grand.npno': new Uint8Array([1, 2, 3]) }, { level: 0 });
    const t = new MockTransport([]);
    const result = await restore(stage4Session(t), zip, undefined, { libraryWrites: { sample: false, piano: false } });
    expect(result).toMatchObject({
      restored: 0, skipped: 1, skippedFiles: ['Piano/Bank 1/Royal Grand.npno'], failures: [],
      leftOut: [{ path: 'Piano/Bank 1/Royal Grand.npno', kind: 'piano', why: 'not-yet-tried' }],
    });
    expect(t.sent).toEqual([]);
  });

  it('restores from a Blob using ranged reads only (multi-GB safe)', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
    }, { level: 0 });
    const blob = new Blob([zip as unknown as BlobPart]);
    // A real .ns4b runs multi-GB and can't be materialized (Blob.arrayBuffer has
    // a ~2 GiB wall) — restore must only take ranged slice() reads.
    Object.defineProperty(blob, 'arrayBuffer', {
      value: () => Promise.reject(new Error('whole-file read — restore must stream')),
    });
    const replies = [
      ack(CReqBegin), ...preflight(),
      emptySlot, ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose),
      ack(CReqEnd), ack(CReqBegin),
    ];
    const result = await restore(stage4Session(new MockTransport(replies)), blob);
    expect(result.restored).toBe(1);
    expect(result.failures).toEqual([]);
  });

  it('rejects a zip without meta.xml', async () => {
    const zip = zipSync({ 'Program/Bank H/x.ns4p': fixtureBytes }, { level: 0 });
    await expect(restore(stage4Session(new MockTransport([])), zip)).rejects.toThrow();
  });

  it('collects per-file failures without aborting', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
    }, { level: 0 });
    // When FileCreate fails (status 1), pushFile throws immediately — no FileClose is sent.
    const replies = [
      ack(CReqBegin),
      ...preflight(),                         // guard open (64 free slots) → write is attempted
      emptySlot,
      encodeMessage(CReqFileCreate | 1, [1]), // create fails (status 1) → pushFile throws, no close
      ack(CReqEnd),
      ack(CReqBegin),
    ];
    const result = await restore(stage4Session(new MockTransport(replies)), zip);
    expect(result.restored).toBe(0);
    expect(result.failures).toHaveLength(1);
  });

  it('refuses the whole restore up front when a target partition is not confirmed', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
      'Live/Bank 1/Live 1.ns4l': fixtureBytes, // Live (10) is not confirmed below
    }, { level: 0 });
    const t = new MockTransport([]);
    const session = new NordSession(t);
    session.allowWrites([6]); // e.g. a probe-confirmed Program partition only
    await expect(restore(session, zip)).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0); // never touched the device
  });

  it('refuses an archive whose only partition is writable here for another reason', async () => {
    // A Stage 3: partition 7 is confirmed, as its Programs. A backup holding only
    // Stage 4 organ presets (also 7) must not be written over them.
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Organ Preset/Bank 1/B3.ns4o': fixtureBytes,
    }, { level: 0 });
    const t = new MockTransport([]);
    const session = new NordSession(t);
    session.allowWrites([7]);
    await expect(restore(session, zip)).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0);
  });

  it('reports a partition the Nord refuses to open, without trying to write to it', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
    }, { level: 0 });
    const t = new MockTransport([encodeMessage(CReqBegin | 1, [2]), encodeMessage(CReqEnd | 1, [0])]); // begin refused (status 2)
    const result = await restore(stage4Session(t), zip);
    expect(result.restored).toBe(0);
    expect(result.failures).toEqual([
      { path: 'Program/Bank H/regressionTest.ns4p', error: 'Could not open partition 6: status 2' },
    ]);
    // no writes; the end releases the session lock the Nord took before refusing
    expect(t.sent.map((f) => decodeReply(f).msgId)).toEqual([CReqBegin, CReqEnd]);
  });

  it('records a non-CBIN entry as a failure without writing to slot 0:0', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank A/garbage.ns4p': new Uint8Array([0, 1, 2, 3, 4]), // not a CBIN file
    }, { level: 0 });
    // No FileCreate is sent — the hasCbinMagic guard throws before any device write.
    const replies = [ack(CReqBegin), ...preflight(), ack(CReqEnd), ack(CReqBegin)];
    const t = new MockTransport(replies);
    const result = await restore(stage4Session(t), zip);
    expect(result.restored).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(t.sent.some((f) => decodeReply(f).msgId === CReqFileCreate)).toBe(false);
  });
});

describe('restore of the sample library', () => {
  const record = cbinRecord(testSample({ name: 'Pad' }));
  const padAt = (slot: number) => cbinFile(record, { slot });
  const archive = (files: Record<string, Uint8Array> = { 'Samp Lib/User 1/Pad.nsmp4': padAt(3) }) =>
    zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), ...files }, { level: 0 });
  const banks = bankListOf(5, [['User 1', 100]]);
  const on = { libraryWrites: { sample: true, piano: false }, sleep: async () => {} };
  const nordHas = (names: string[]) => [
    ...names.flatMap((n, i) => [iterOf(0, 0, i), infoOf(n, 10)]), iterOf(1, 0, 0), iterOf(2, 1, 0),
  ];
  const begun = (t: MockTransport) =>
    t.sent.map((f) => decodeReply(f)).filter((f) => f.msgId === CReqBegin).map((f) => f.words[0]);

  it('writes a sample the Nord lacks at its header’s place', async () => {
    const t = new MockTransport([
      partList(), ack(CReqBegin), iterOf(2, 0, 0), stateOf(0, 100, 0, 0), banks,
      ackWords(CReqFileCreate, 0, 3), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(result).toMatchObject({ restored: 1, removed: 0, unchanged: 0, failures: [] });
    const create = t.sent.map((f) => decodeReply(f)).find((f) => f.msgId === CReqFileCreate)!;
    expect(create.words.slice(0, 3)).toEqual([0, 3, record.length]);
  });

  it('a restore whose only reason is a duplicate name doesn’t say nothing was removed', async () => {
    const zip = archive({ 'Samp Lib/User 1/Pad.nsmp4': padAt(3), 'Samp Lib/User 2/Pad.nsmp4': padAt(4) });
    const t = new MockTransport([
      partList(), ack(CReqBegin), iterOf(2, 0, 0), stateOf(0, 100, 0, 0), banks,
      ackWords(CReqFileCreate, 0, 3), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(result.restored).toBe(1);
    expect(result.libraryReasons).toEqual([expect.stringMatching(/two samples called “Pad”/)]);
    expect(result.sayNoneRemoved).toBe(false);
    expect(restoreSummary(result)).not.toMatch(/No samples or pianos were removed/);
  });

  it('leaves a same-name, same-size sample alone', async () => {
    const t = new MockTransport([
      partList(), ack(CReqBegin), iterOf(0, 0, 3), infoOf('Pad', record.length), iterOf(1, 0, 0), iterOf(2, 1, 0),
      stateOf(1, 100, 1, 0), banks, ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(result).toMatchObject({ restored: 0, unchanged: 1, removed: 0, failures: [] });
    expect(sentIds(t)).not.toContain(CReqFileCreate);
  });

  it('removes what the backup lacks, erases the shortfall, then writes', async () => {
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['Old']), stateOf(1, 0, 1, 0), banks,
      ack(CReqFileDelete), stateOf(0, 0, 0, 1), banks,
      ack(CReqEraseBlock), ackWords(CQryEraseStatus, 1, 1, 0),
      ackWords(CReqFileCreate, 0, 3), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(result).toMatchObject({ restored: 1, removed: 1, removedFiles: ['Old'], notRewritten: [], failures: [] });
    expect(sentIds(t)).toEqual(expect.arrayContaining([CReqFileDelete, CReqEraseBlock, CReqFileCreate]));
  });

  it('removes nothing when the backup’s samples won’t fit even after the removals', async () => {
    const t = new MockTransport([
      partList({ 5: { flags: FLAGS_NO_ERASE } }), ack(CReqBegin), ...nordHas(['Old']), stateOf(1, 0, 1, 0), banks, ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(sentIds(t)).not.toContain(CReqFileDelete);
    expect(result.removed).toBe(0);
    expect(result.failures).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', error: expect.stringMatching(/sample memory has 0 B free/) }]);
    // The player is told why, and that nothing was removed.
    const summary = restoreSummary(result);
    expect(summary).toMatch(/sample memory has 0 B free/);
    expect(summary).toMatch(/No samples or pianos were removed from your Nord\./);
  });

  it('does not touch the Nord’s samples while sample writes are off', async () => {
    const t = new MockTransport([]);
    const result = await restore(stage4Session(t), archive(), undefined, { libraryWrites: { sample: false, piano: false } });
    expect(result.skippedFiles).toEqual(['Samp Lib/User 1/Pad.nsmp4']);
    expect(result.leftOut).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', kind: 'sample', why: 'not-yet-tried' }]);
    expect(t.sent).toHaveLength(0);
  });

  it('reports every sample when the partition list can’t be read', async () => {
    const t = new MockTransport([encodeMessage(CQryPartList | 1, [2])]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(result.failures).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', error: 'Couldn’t read your Nord’s memory layout; nothing was changed.' }]);
    expect(sentIds(t)).toEqual([CQryPartList]);
    expect(restoreSummary(result)).toContain(LAYOUT_UNREADABLE_MESSAGE);
  });

  it('never plans a library the backup has no folder for, so its files stay put', async () => {
    const t = new MockTransport([
      partList(), ack(CReqBegin), iterOf(2, 0, 0), stateOf(0, 100, 0, 0), banks,
      ackWords(CReqFileCreate, 0, 3), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    // Piano writes on too, but the backup holds no pianos: the Piano library is never opened.
    const result = await restore(stage4Session(t), archive(), undefined, { ...on, libraryWrites: { sample: true, piano: true } });
    expect(result).toMatchObject({ restored: 1, removed: 0, failures: [] });
    expect(begun(t)).toEqual([5]);
  });

  it('a backup with no samples or pianos never reads the partition list', async () => {
    const zip = zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), 'Program/Bank H/regressionTest.ns4p': fixtureBytes }, { level: 0 });
    const t = new MockTransport([
      ack(CReqBegin), ...preflight(), emptySlot, ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), zip, undefined, { ...on, libraryWrites: { sample: true, piano: true } });
    expect(result.restored).toBe(1);
    expect(sentIds(t)).not.toContain(CQryPartList);
    expect(begun(t)).toEqual([6]);
  });

  it('removes nothing, and sends nothing, when a backup sample would be refused', async () => {
    const t = new MockTransport([]);
    const zip = archive({
      'Samp Lib/User 1/Pad.nsmp4': padAt(3),
      'Samp Lib/User 1/Old Format.nsmp4': cbinFile(record, { slot: 4, versionRaw: 300 }),
    });
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(t.sent).toHaveLength(0);
    expect(result).toMatchObject({ restored: 0, removed: 0 });
    expect(result.failures).toEqual(expect.arrayContaining([
      { path: 'Samp Lib/User 1/Old Format.nsmp4', error: NSMP4_ONLY },
      { path: 'Samp Lib/User 1/Pad.nsmp4', error: expect.stringMatching(/nothing in your Nord’s sample memory was changed/i) },
    ]));
    expect(result.failures).toHaveLength(2);
    const summary = restoreSummary(result);
    expect(summary).toContain(NSMP4_ONLY);
    expect(summary).toMatch(/another sample in this backup can’t go to your Nord/);
  });

  it('refuses the library, removing and erasing nothing, when the write alignment is impossible', async () => {
    const t = new MockTransport([
      partList({ 5: { words: [65536, 65535, 65471, 0] } }), ack(CReqBegin), ...nordHas(['Old']), stateOf(1, 0, 1, 0), banks, ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(sentIds(t)).not.toContain(CReqFileDelete);
    expect(sentIds(t)).not.toContain(CReqEraseBlock);
    expect(result.removed).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(restoreSummary(result)).toMatch(/pieces of 65471 bytes/);
  });

  it('a single refused sample is not reported as "another" sample', async () => {
    const t = new MockTransport([]);
    const zip = archive({ 'Samp Lib/User 1/Old Format.nsmp4': cbinFile(record, { slot: 4, versionRaw: 300 }) });
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(t.sent).toHaveLength(0);
    expect(result.failures).toEqual([{ path: 'Samp Lib/User 1/Old Format.nsmp4', error: NSMP4_ONLY }]);
    const summary = restoreSummary(result);
    expect(summary).toContain(NSMP4_ONLY);
    expect(summary).not.toMatch(/another/);
  });

  it('leaves the libraries out, and still restores programs, on a keyboard that is not a Stage 4', async () => {
    const t = new MockTransport([]);
    const s = stage4Session(t);
    s.stage4Layout = false;
    const result = await restore(s, archive(), undefined, on);
    expect(result.skippedFiles).toEqual(['Samp Lib/User 1/Pad.nsmp4']);
    expect(result.leftOut).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', kind: 'sample', why: 'stage4-only' }]);
    expect(restoreSummary(result)).toMatch(/Stage 4/);
    expect(t.sent).toHaveLength(0);
  });

  it('removes nothing, and sends nothing, when a backup sample can’t be read', async () => {
    const t = new MockTransport([]);
    const zip = archive({ 'Samp Lib/User 1/Pad.nsmp4': padAt(3), 'Samp Lib/User 1/Broken.nsmp4': new Uint8Array([1, 2, 3]) });
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(t.sent).toHaveLength(0);
    expect(result.failures).toEqual(expect.arrayContaining([
      { path: 'Samp Lib/User 1/Broken.nsmp4', error: expect.stringMatching(/not a Nord file/) },
      { path: 'Samp Lib/User 1/Pad.nsmp4', error: expect.stringMatching(/nothing in your Nord’s sample memory was changed/i) },
    ]));
  });

  it('a removal that failed is said without its code', async () => {
    const zip = archive({ 'Samp Lib/User 1/A.nsmp4': padAt(3), 'Samp Lib/User 1/B.nsmp4': padAt(4) });
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['A', 'Old']), stateOf(2, 100, 2, 0), banks,
      ack(CReqFileDelete), statusOf(CReqFileDelete, 7), ack(CReqEnd),
    ]);
    const summary = restoreSummary(await restore(stage4Session(t), zip, undefined, on));
    expect(summary).toMatch(/removing “Old” from your Nord failed, so OpenNord stopped/);
    expect(summary).not.toMatch(/No samples or pianos were removed/);
    expect(summary).not.toMatch(/code|status \d/i);
  });

  it('stops at the first failed write and says what is no longer on the Nord', async () => {
    const zip = archive({ 'Samp Lib/User 1/A.nsmp4': padAt(3), 'Samp Lib/User 1/B.nsmp4': padAt(4) });
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['A', 'Old']), stateOf(2, 100, 2, 0), banks,
      ack(CReqFileDelete), ack(CReqFileDelete), stateOf(0, 100, 0, 2), banks,
      statusOf(CReqFileCreate, 5), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(result).toMatchObject({ restored: 0, removed: 2, removedFiles: ['A', 'Old'], notRewritten: ['A'] });
    expect(result.failures).toEqual([
      { path: 'Samp Lib/User 1/A.nsmp4', error: expect.stringMatching(/refused the new file/) },
      { path: 'Samp Lib/User 1/B.nsmp4', error: 'Not restored: OpenNord stopped after “A” couldn’t be written.' },
    ]);
    expect(sentIds(t).filter((id) => id === CReqFileCreate)).toHaveLength(1);
    expect(sentIds(t).at(-1)).toBe(CReqEnd);
  });

  it('stops at a removal that fails, naming what was removed and not written back', async () => {
    const zip = archive({ 'Samp Lib/User 1/A.nsmp4': padAt(3), 'Samp Lib/User 1/B.nsmp4': padAt(4) });
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['A', 'Old']), stateOf(2, 100, 2, 0), banks,
      ack(CReqFileDelete), statusOf(CReqFileDelete, 7), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(result).toMatchObject({ restored: 0, removed: 1, removedFiles: ['A'], notRewritten: ['A'] });
    expect(result.failures).toEqual([
      { path: 'Samp Lib/User 1/A.nsmp4', error: expect.stringMatching(/removing “Old” from your Nord failed/) },
      { path: 'Samp Lib/User 1/B.nsmp4', error: expect.stringMatching(/removing “Old” from your Nord failed/) },
    ]);
    expect(sentIds(t)).not.toContain(CReqFileCreate);
    expect(sentIds(t).at(-1)).toBe(CReqEnd);
  });

  it('writes nothing when the room after the removals falls short of what was counted', async () => {
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['Old']), stateOf(1, 0, 1, 0), banks,
      ack(CReqFileDelete), stateOf(0, 0, 1, 0), banks, ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), archive(), undefined, on);
    expect(result).toMatchObject({ restored: 0, removed: 1, removedFiles: ['Old'], notRewritten: [] });
    expect(result.failures).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', error: expect.stringMatching(/sample memory/) }]);
    expect(sentIds(t)).not.toContain(CReqEraseBlock);
    expect(sentIds(t)).not.toContain(CReqFileCreate);
  });

  it('removes nothing when a write would find no free place', async () => {
    const zip = archive({ 'Samp Lib/User 1/A.nsmp4': padAt(0), 'Samp Lib/User 1/B.nsmp4': padAt(1) });
    // One place in all, taken by Old (which goes): room for one write, not two. The
    // slot count comes from the bank list, so the free-slot check alone can't see it.
    const t = new MockTransport([
      partList(), ack(CReqBegin), ...nordHas(['Old']), stateOf(0, 100, 1, 0), bankListOf(5, [['User 1', 1]]), ack(CReqEnd),
    ]);
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(sentIds(t)).not.toContain(CReqFileDelete);
    expect(result.removed).toBe(0);
    expect(result.failures.map((f) => f.error)).toEqual([noFreePlaceReason('sample'), noFreePlaceReason('sample')]);
    const summary = restoreSummary(result);
    expect(summary.split(noFreePlaceReason('sample'))).toHaveLength(2); // said once, not per file
  });

  it('removes nothing when two names would be the same once the Nord cuts them short', async () => {
    const long = 'Strings '.repeat(20); // 160 bytes: the Nord keeps 128
    const zip = archive({ [`Samp Lib/User 1/${long}A.nsmp4`]: padAt(3), [`Samp Lib/User 1/${long}B.nsmp4`]: padAt(4) });
    const t = new MockTransport([partList(), ack(CReqBegin), iterOf(2, 0, 0), stateOf(0, 100, 0, 0), banks, ack(CReqEnd)]);
    const result = await restore(stage4Session(t), zip, undefined, on);
    expect(sentIds(t)).not.toContain(CReqFileCreate);
    expect(result.failures).toHaveLength(2);
    expect(result.failures[0].error).toMatch(/same name on your Nord/);
  });

  it('without options, leaves samples out under the shipped gate', async () => {
    const t = new MockTransport([]);
    const result = await restore(stage4Session(t), archive());
    expect(result.leftOut).toEqual([{ path: 'Samp Lib/User 1/Pad.nsmp4', kind: 'sample', why: 'not-yet-tried' }]);
    expect(t.sent).toHaveLength(0);
  });

  it('stops the whole restore without an end when a write goes unanswered, and asks for a reconnect', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const zip = archive({ 'Samp Lib/User 1/Pad.nsmp4': padAt(3), 'Piano/Bank 1/Grand.npno': cbinFile(record, { tag: 'npno' }) });
    const t = new ScriptedTransport([
      partList(), ack(CReqBegin), iterOf(2, 0, 0), stateOf(0, 100, 0, 0), banks,
      ackWords(CReqFileCreate, 0, 3), TIMEOUT, TIMEOUT, TIMEOUT,
    ]);
    const session = stage4Session(t);
    const result = await restore(session, zip, undefined, { ...on, libraryWrites: { sample: true, piano: true } });
    expect(result.sessionLost).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(begun(t)).toEqual([5]); // the pianos were never started
    expect(result.failures).toEqual([
      { path: 'Samp Lib/User 1/Pad.nsmp4', error: expect.stringMatching(/may have been kept/) },
      { path: 'Piano/Bank 1/Grand.npno', error: expect.stringMatching(/stopped answering/) },
    ]);
    expect(() => session.assertWritable()).toThrow(WriteBlockedError);
  });

  it('any reply that never came inside a library’s session: no end, the session dead, the rest not started', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const zip = archive({ 'Samp Lib/User 1/Pad.nsmp4': padAt(3), 'Piano/Bank 1/Grand.npno': cbinFile(record, { tag: 'npno' }) });
    const t = new ScriptedTransport([partList(), ack(CReqBegin), TIMEOUT]);
    const session = stage4Session(t);
    const result = await restore(session, zip, undefined, { ...on, libraryWrites: { sample: true, piano: true } });
    expect(result.sessionLost).toBe(true);
    expect(session.isDead).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(begun(t)).toEqual([5]);
  });

  it('no answer to the partition list: the session is dead and nothing is written', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = new ScriptedTransport([TIMEOUT]);
    const session = stage4Session(t);
    const result = await restore(session, archive(), undefined, { ...on, libraryWrites: { sample: true, piano: false } });
    expect(result.sessionLost).toBe(true);
    expect(session.isDead).toBe(true);
    expect(sentIds(t)).not.toContain(CReqBegin);
  });

  it('on any keyboard but a Stage 4, refuses up front though its libraries are confirmed writable', async () => {
    // A Stage 2 on a current OS: Piano (1), Samp Lib (5) and its Program partition are
    // writable, never all of programs, presets, Live and Settings, so canRestore is false.
    const t = new MockTransport([]);
    const session = new NordSession(t);
    session.allowWrites([1, 5, 6]);
    expect(canRestore(session)).toBe(false);
    const zip = archive({ 'Samp Lib/User 1/Pad.nsmp4': padAt(3) });
    await expect(restore(session, zip, undefined, { ...on, libraryWrites: { sample: true, piano: true } }))
      .rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0);
  });

  it('restores the programs when only the samples and pianos aren’t confirmed writable here', async () => {
    const zip = archive({ 'Program/Bank H/regressionTest.ns4p': fixtureBytes, 'Samp Lib/User 1/Pad.nsmp4': padAt(3) });
    const t = new MockTransport([
      ack(CReqBegin), ...preflight(), emptySlot, ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const session = new NordSession(t);
    session.allowWrites(NON_LIBRARY_PARTITIONS.map((p) => p.partition));
    session.stage4Layout = true;
    expect(canRestore(session)).toBe(true);
    const result = await restore(session, zip, undefined, on);
    expect(result).toMatchObject({
      restored: 1, failures: [], leftOut: [{ path: 'Samp Lib/User 1/Pad.nsmp4', kind: 'sample', why: 'read-only' }],
    });
    expect(sentIds(t)).not.toContain(CQryPartList);
  });
});

describe('restoreSummary', () => {
  const none: RestoreResult = {
    restored: 0, unchanged: 0, removed: 0, skipped: 0, skippedFiles: [], failures: [],
    leftOut: [], removedFiles: [], notRewritten: [], sessionLost: false, libraryReasons: [], sayNoneRemoved: false,
  };

  it('says how many samples and pianos weren’t restored while their writes are off, never “factory”', () => {
    const text = restoreSummary({
      ...none, restored: 4, skipped: 3, skippedFiles: ['a', 'b', 'c'],
      leftOut: [
        { path: 'a', kind: 'sample', why: 'not-yet-tried' }, { path: 'b', kind: 'sample', why: 'not-yet-tried' },
        { path: 'c', kind: 'piano', why: 'not-yet-tried' },
      ],
    });
    expect(text).toMatch(/^Restored 4 files\./);
    expect(text).toMatch(/2 samples and 1 piano weren’t restored: not yet tried on a Nord\./);
    expect(text).not.toMatch(/factory/i);
  });

  it('names what is no longer on the Nord after a stopped restore, and asks for a reconnect when the Nord went quiet', () => {
    const text = restoreSummary({
      ...none, removed: 2, removedFiles: ['A', 'Old'], notRewritten: ['A'], sessionLost: true,
      failures: [{ path: 'x', error: 'e' }],
    });
    expect(text).toMatch(/removed 2 samples or pianos/);
    expect(text).toMatch(/1 couldn’t be written/);
    expect(text).toMatch(/No longer on your Nord, but still in your backup: A\./);
    expect(text).toContain(STOPPED_ANSWERING); // the same sentence Send to Nord says
  });

  it('lists each reason once, after the counts, and says when nothing was removed', () => {
    const text = restoreSummary({
      ...none, failures: [{ path: 'a', error: 'raw' }, { path: 'b', error: 'raw' }],
      libraryReasons: ['Your Nord’s sample memory has 1 MB free, and this needs 2 MB. Remove some samples to make room, then try again.'],
      sayNoneRemoved: true,
    });
    expect(text).toBe(
      'Restored 0 files; 2 couldn’t be written. Your Nord’s sample memory has 1 MB free, and this needs 2 MB. '
      + 'Remove some samples to make room, then try again. No samples or pianos were removed from your Nord.',
    );
  });

  it('adds “none removed” from the flag, never from the words of a reason', () => {
    const line = /No samples or pianos were removed/;
    // A reason that happens to say "nothing" doesn't hide the line when the flag asks for it…
    expect(restoreSummary({ ...none, libraryReasons: ['Nothing fits.'], sayNoneRemoved: true })).toMatch(line);
    // …and a notice alone (a duplicate name) doesn't add it.
    expect(restoreSummary({ ...none, restored: 1, libraryReasons: ['This backup has two samples called “Pad”.'] })).not.toMatch(line);
    // Once something was removed, the line would be wrong.
    expect(restoreSummary({ ...none, removed: 1, libraryReasons: ['x'], sayNoneRemoved: true })).not.toMatch(line);
  });

  it('counts files it doesn’t recognise apart from the samples and pianos', () => {
    expect(restoreSummary({ ...none, restored: 1, skipped: 1, skippedFiles: ['x.txt'] })).toMatch(/Left out 1 file OpenNord doesn’t recognise\./);
  });
});
