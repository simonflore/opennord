import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { encodeMessage } from './protocol';
import {
  CReqBegin, CReqEnd, CQryFileInfo, CQryFileIterate, CReqFileOpen, CReqFileClose, CReqFileRead, ext2Type,
} from './opcodes';
import { readCbinHeader } from '../ns4/bits';
import { backup } from './backup';
import { USER_PARTITIONS } from './ns4b';

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
