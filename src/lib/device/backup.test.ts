import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { encodeMessage, decodeReply } from './protocol';
import {
  CReqBegin, CReqEnd, CQryFileInfo, CQryFileIterate, CReqFileOpen, CReqFileClose, CReqFileRead, ext2Type,
  CReqFileCreate, CReqFileWrite,
} from './opcodes';
import { readCbinHeader } from '../clavia/cbin';
import { backup, backupFilename, backupSpecs, restore, BACKUP_REFUSED_MESSAGE } from './backup';
import { USER_PARTITIONS, buildMetaXml } from './ns4b';
import { WriteBlockedError } from './write-guard';

/** A session confirmed writable on every Stage 4 user partition (a trusted layout). */
function stage4Session(t: MockTransport): NordSession {
  const s = new NordSession(t);
  s.allowWrites(USER_PARTITIONS.map((p) => p.partition));
  return s;
}

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const ack = (op: number) => encodeMessage(op | 1, [0]);
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

    const zip = await backup(session, undefined, [programSpec]);
    const files = unzipSync(zip);
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

    const files = unzipSync(await backup(session));
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
    expect(Object.keys(unzipSync(zip))).toContain('Program/Bank H/regressionTest.ns4p');
    expect(reply.msgId).toBe(CQryFileInfo | 1);
  });
});

describe('restore', () => {
  it('writes each file to its header-derived slot and skips factory entries', async () => {
    const header = readCbinHeader(fixtureBytes); // bank 7, location 56
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
      'Samp Lib/Pad/Some Sample.nsmp4': new Uint8Array([1, 2, 3]), // factory → skipped
    }, { level: 0 });

    const replies = [
      ack(CReqBegin),               // begin(Program)
      ...preflight(),               // guard: empty partition, 64 free slots
      ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose),
      ack(CReqEnd),
      ack(CReqBegin),               // finally re-begin(Program)
    ];
    const t = new MockTransport(replies);
    const result = await restore(stage4Session(t), zip);
    expect(result.restored).toBe(1);
    expect(result.skippedFactory).toBe(1);
    expect(result.skippedFactoryFiles).toEqual(['Samp Lib/Pad/Some Sample.nsmp4']);
    expect(result.failures).toEqual([]);
    const createFrame = t.sent.find((f) => decodeReply(f).msgId === CReqFileCreate)!;
    const create = decodeReply(createFrame);
    expect(create.words.slice(0, 2)).toEqual([header.bank, header.location]);
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
      ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose),
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
