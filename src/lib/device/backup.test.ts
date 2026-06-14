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
import { readCbinHeader } from '../ns4/bits';
import { backup, restore } from './backup';
import { USER_PARTITIONS, buildMetaXml } from './ns4b';

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
      ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose),
      ack(CReqEnd),
      ack(CReqBegin),               // finally re-begin(Program)
    ];
    const t = new MockTransport(replies);
    const result = await restore(new NordSession(t), zip);
    expect(result.restored).toBe(1);
    expect(result.skippedFactory).toBe(1);
    expect(result.skippedFactoryFiles).toEqual(['Samp Lib/Pad/Some Sample.nsmp4']);
    expect(result.failures).toEqual([]);
    const createFrame = t.sent.find((f) => decodeReply(f).msgId === CReqFileCreate)!;
    const create = decodeReply(createFrame);
    expect(create.words.slice(0, 2)).toEqual([header.bank, header.location]);
  });

  it('rejects a zip without meta.xml', async () => {
    const zip = zipSync({ 'Program/Bank H/x.ns4p': fixtureBytes }, { level: 0 });
    await expect(restore(new NordSession(new MockTransport([])), zip)).rejects.toThrow();
  });

  it('collects per-file failures without aborting', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank H/regressionTest.ns4p': fixtureBytes,
    }, { level: 0 });
    // When FileCreate fails (status 1), pushFile throws immediately — no FileClose is sent.
    const replies = [
      ack(CReqBegin),
      encodeMessage(CReqFileCreate | 1, [1]), // create fails (status 1) → pushFile throws, no close
      ack(CReqEnd),
      ack(CReqBegin),
    ];
    const result = await restore(new NordSession(new MockTransport(replies)), zip);
    expect(result.restored).toBe(0);
    expect(result.failures).toHaveLength(1);
  });

  it('records a non-CBIN entry as a failure without writing to slot 0:0', async () => {
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank A/garbage.ns4p': new Uint8Array([0, 1, 2, 3, 4]), // not a CBIN file
    }, { level: 0 });
    // No FileCreate is sent — the hasCbinMagic guard throws before any device write.
    const replies = [ack(CReqBegin), ack(CReqEnd), ack(CReqBegin)];
    const t = new MockTransport(replies);
    const result = await restore(new NordSession(t), zip);
    expect(result.restored).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(t.sent.some((f) => decodeReply(f).msgId === CReqFileCreate)).toBe(false);
  });
});
