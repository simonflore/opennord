import { describe, it, expect } from 'vitest';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { encodeMessage, decodeReply } from './protocol';
import { CQryFileInfo, CQryFileIterate, ext2Type, CReqFileCreate, CReqFileWrite } from './opcodes';
import { enumeratePrograms, enumerateFiles } from './transfer';

/** Build a FileIterate reply (0x21): code@word0, bank@word1, slot@word2. */
function iterReply(code: number, bank: number, slot: number): Uint8Array {
  return encodeMessage(CQryFileIterate | 1, [code, bank, slot]);
}

/** Build a FileInfo reply (0x1F): status@0,_, _, size@12, fourcc@16, version@20, _, category@28, nameLen@32, name@36. */
function infoReply(opts: { size: number; version: number; category: number; name: string }): Uint8Array {
  const nameBytes = new TextEncoder().encode(opts.name);
  // words 0..8 → byte offsets 0,4,8,12,16,20,24,28,32
  const words = [
    0,            // 0  status
    0,            // 4  (bank, unused by decoder)
    0,            // 8  (slot, unused)
    opts.size,    // 12 size
    ext2Type('ns4p'), // 16 fourcc
    opts.version, // 20 version ×100
    0,            // 24 (fileCRC, unused)
    opts.category,// 28 category
    nameBytes.length, // 32 nameLen
  ];
  return encodeMessage(CQryFileInfo | 1, words, nameBytes); // name trails at byte 36
}

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CReqFileOpen, CReqFileRead, CReqFileClose } from './opcodes';
import { pullProgram } from './transfer';
import { parseNs4Program } from '../ns4/parse';
import { readCbinHeader, type CbinHeader } from '../clavia/cbin';
import { verifyNs4Checksum } from '../clavia/checksum';

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);

/** Build a FileRead reply (0x13): 5-word read-ack header (status,bank,slot,offset,dataLen) then data. */
function readReply(bank: number, slot: number, offset: number, data: Uint8Array): Uint8Array {
  return encodeMessage(CReqFileRead | 1, [0, bank, slot, offset, data.length], data);
}

describe('pullProgram', () => {
  it('reassembles the body and reconstructs a valid .ns4p that decodes', async () => {
    const header: CbinHeader = readCbinHeader(fixtureBytes);
    const body = fixtureBytes.subarray(44); // device returns body only
    const entry = {
      bank: header.bank, slot: header.location, name: 'regressionTest',
      categoryId: header.category, version: header.versionRaw,
      sizeBytes: body.length, fourcc: header.tag,
    };
    const replies = [
      encodeMessage(CReqFileOpen | 1, [0]),                  // FileOpen ack
      readReply(header.bank, header.location, 0, body),      // single-chunk read
      encodeMessage(CReqFileClose | 1, [0]),                 // FileClose ack
    ];
    const session = new NordSession(new MockTransport(replies));

    const file = await pullProgram(session, entry);
    expect(file.length).toBe(fixtureBytes.length);            // 868
    expect(verifyNs4Checksum(file)).toBe(true);
    // body round-trips exactly
    expect([...file.subarray(44)]).toEqual([...body]);
    // and the reconstructed file decodes like the original
    const prog = parseNs4Program(file);
    expect(prog.slot).toBe('H:81');
    expect(prog.category).toBe('None');
    expect(prog.layers).toHaveLength(7);
    expect(prog.warnings).toHaveLength(0);
  });
});

describe('enumerateFiles', () => {
  it('walks the cursor across banks and stops on a terminal code', async () => {
    const replies: Uint8Array[] = [
      iterReply(0, 0, 0),                                                   // bank0: file at slot 0
      infoReply({ size: 824, version: 313, category: 17, name: 'Dont look back' }),
      iterReply(1, 0, 0),                                                   // bank0 exhausted → bank1
    ];
    for (let b = 1; b < 8; b++) replies.push(iterReply(1, b, 0));           // banks 1..7 exhausted
    replies.push(iterReply(2, 8, 0));                                       // terminal code → stop
    const session = new NordSession(new MockTransport(replies));

    const entries = await enumerateFiles(session);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ bank: 0, slot: 0, name: 'Dont look back', categoryId: 17, version: 313, sizeBytes: 824 });
  });

  it('returns [] immediately on a terminal code (empty partition)', async () => {
    const session = new NordSession(new MockTransport([iterReply(2, 0, 0)]));
    expect(await enumerateFiles(session)).toEqual([]);
  });

  it('skips a file whose FileInfo returns a non-zero status', async () => {
    const badInfo = encodeMessage(CQryFileInfo | 1, [1]);
    const replies: Uint8Array[] = [iterReply(0, 0, 0), badInfo];
    for (let b = 0; b < 8; b++) replies.push(iterReply(1, b, 0));
    replies.push(iterReply(2, 8, 0));                                       // terminal
    const session = new NordSession(new MockTransport(replies));
    expect(await enumerateFiles(session)).toHaveLength(0);
  });
});

describe('enumeratePrograms (wrapper)', () => {
  it('delegates to enumerateFiles', async () => {
    const session = new NordSession(new MockTransport([iterReply(2, 0, 0)]));
    expect(await enumeratePrograms(session)).toEqual([]);
  });
});

import { programEntryView } from './transfer';

describe('programEntryView', () => {
  it('derives the display row reusing the shared slot + category helpers', () => {
    const v = programEntryView({
      bank: 7, slot: 56, name: 'Dont look back',
      categoryId: 17, version: 313, sizeBytes: 824, fourcc: 'ns4p',
    });
    expect(v).toEqual({ name: 'Dont look back', slot: 'H:81', category: 'None', version: 'v3.13' });
  });
});

import { pushProgram } from './transfer';
import { readCbinHeader as readHdr } from '../clavia/cbin';

describe('pushProgram', () => {
  it('sends FileCreate + FileWrite + FileClose with the validated payload + body', async () => {
    const header = readHdr(fixtureBytes);
    const body = fixtureBytes.subarray(44);
    const t = new MockTransport([
      encodeMessage(CReqFileCreate | 1, [0]),     // create ack
      encodeMessage(CReqFileWrite | 1, [0]),      // write ack
      encodeMessage(CReqFileClose | 1, [0]),      // close ack (commit)
    ]);
    await pushProgram(new NordSession(t), 2, 63, fixtureBytes, 'OPENNORD TEST');

    const create = decodeReply(t.sent[0]);
    expect(create.msgId).toBe(CReqFileCreate);
    expect(create.words.slice(0, 7)).toEqual([2, 63, body.length, ext2Type('ns4p'), 0xffffffff, header.category, 13]);
    expect(new TextDecoder().decode(create.payload.subarray(28, 28 + 13))).toBe('OPENNORD TEST');

    const write = decodeReply(t.sent[1]);
    expect(write.msgId).toBe(CReqFileWrite);
    expect(write.words.slice(0, 4)).toEqual([2, 63, 0, body.length]);
    expect([...write.payload.subarray(16)]).toEqual([...body]);

    const close = decodeReply(t.sent[2]);
    expect(close.msgId).toBe(CReqFileClose);
    expect(close.words.slice(0, 2)).toEqual([2, 63]);
  });

  it('throws on FileCreate failure without writing a body', async () => {
    const t = new MockTransport([encodeMessage(CReqFileCreate | 1, [1])]); // status 1
    await expect(pushProgram(new NordSession(t), 2, 63, fixtureBytes, 'x')).rejects.toThrow();
    expect(t.sent).toHaveLength(1); // only the create attempt was sent
  });

  it('still closes the handle when a write fails mid-transfer', async () => {
    const t = new MockTransport([
      encodeMessage(CReqFileCreate | 1, [0]), // create OK
      encodeMessage(CReqFileWrite | 1, [1]),  // write fails (status 1)
      encodeMessage(CReqFileClose | 1, [0]),  // best-effort close
    ]);
    await expect(pushProgram(new NordSession(t), 2, 63, fixtureBytes, 'x')).rejects.toThrow();
    expect(t.sent).toHaveLength(3); // create + failed write + close all attempted
  });
});

import { deleteProgram } from './transfer';
import { CReqFileDelete } from './opcodes';

describe('deleteProgram', () => {
  it('sends FileDelete{bank, slot}', async () => {
    const t = new MockTransport([encodeMessage(CReqFileDelete | 1, [0])]);
    await deleteProgram(new NordSession(t), 2, 63);
    const del = decodeReply(t.sent[0]);
    expect(del.msgId).toBe(CReqFileDelete);
    expect(del.words.slice(0, 2)).toEqual([2, 63]);
  });

  it('throws on a non-zero delete status', async () => {
    const t = new MockTransport([encodeMessage(CReqFileDelete | 1, [1])]);
    await expect(deleteProgram(new NordSession(t), 2, 63)).rejects.toThrow();
  });
});

import { pullFile, pushFile } from './transfer';
import { buildCbinHeader } from '../clavia/cbin';

describe('pushFile', () => {
  it('derives the FileCreate fourcc from the file header (e.g. ns4o), not hardcoded ns4p', async () => {
    // a minimal CBIN file tagged ns4o (organ preset) + a tiny body
    const header = buildCbinHeader({ formatType: 1, tag: 'ns4o', bank: 1, location: 3, category: 0, versionRaw: 100 });
    const file = new Uint8Array(header.length + 4);
    file.set(header, 0);
    file.set([1, 2, 3, 4], header.length);
    const t = new MockTransport([
      encodeMessage(CReqFileCreate | 1, [0]),
      encodeMessage(CReqFileWrite | 1, [0]),
      encodeMessage(CReqFileClose | 1, [0]),
    ]);
    await pushFile(new NordSession(t), 1, 3, file, 'Champagne');
    const create = decodeReply(t.sent[0]);
    expect(create.words[3]).toBe(ext2Type('ns4o')); // fourcc word
  });
});

describe('pullFile (wrapper parity)', () => {
  it('is the same function pullProgram delegates to', () => {
    expect(typeof pullFile).toBe('function');
  });
});

describe('pullFile progress', () => {
  it('reports progress per read window and reassembles a multi-window body', async () => {
    const body = new Uint8Array(5000);
    for (let i = 0; i < body.length; i++) body[i] = i & 0xff;
    const entry = { bank: 0, slot: 0, name: 'big', categoryId: 0, version: 100, sizeBytes: body.length, fourcc: 'ns4p' };
    const replies = [
      encodeMessage(CReqFileOpen | 1, [0]),
      readReply(0, 0, 0, body.subarray(0, 4096)),
      readReply(0, 0, 4096, body.subarray(4096)),
      encodeMessage(CReqFileClose | 1, [0]),
    ];
    const session = new NordSession(new MockTransport(replies));
    const progress: Array<[number, number]> = [];
    const file = await pullFile(session, entry, (done, total) => progress.push([done, total]));
    expect([...file.subarray(44)]).toEqual([...body]); // body round-trips after the 44-byte header
    expect(progress).toEqual([[4096, 5000], [5000, 5000]]);
  });
});
