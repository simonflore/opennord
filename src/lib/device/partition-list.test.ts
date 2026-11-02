import { describe, it, expect } from 'vitest';
import { decodeReply, encodeMessage, NordError } from './protocol';
import { CQryPartList } from './opcodes';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { decodePartitionList, partitionFlagCount, readPartitionList, PART_FLAG } from './partition-list';
import { FLAGS_NO_ERASE, partList } from './wire-replies';

describe('partitionFlagCount', () => {
  it('is 10 below version 5, 12 from 5, 13 from 10', () => {
    expect(partitionFlagCount(4)).toBe(10);
    expect(partitionFlagCount(5)).toBe(12);
    expect(partitionFlagCount(8)).toBe(12);
    expect(partitionFlagCount(10)).toBe(13);
  });
});

describe('decodePartitionList', () => {
  it('reads each record: name, four words, flags', () => {
    const list = decodePartitionList(decodeReply(partList({ 1: { words: [131072, 131071, 1024, 7] } })).payload, 10);
    expect(list).toHaveLength(12);
    expect(list[5]).toMatchObject({ index: 5, name: 'Samp Lib', blockBytes: 65536, blockRounding: 65535, writeAlign: 512, word3: 0 });
    expect(list[1]).toMatchObject({ name: 'Piano', blockBytes: 131072, blockRounding: 131071, writeAlign: 1024, word3: 7 });
    expect(list[5].flags).toHaveLength(13);
    expect(list[5]).toMatchObject({ matchByName: true, eraseSupported: true });
  });

  it('reads erase from index 10 at version >= 5, and matchByName from index 7', () => {
    const byLocation = FLAGS_NO_ERASE.map((b, i) => (i === PART_FLAG.matchByLocation ? 1 : b));
    const list = decodePartitionList(decodeReply(partList({ 0: { flags: byLocation }, 6: { flags: FLAGS_NO_ERASE } })).payload, 10);
    expect(list[0]).toMatchObject({ matchByName: false, eraseSupported: false });
    expect(list[6]).toMatchObject({ matchByName: true, eraseSupported: false });
  });

  it('does not take index 11 (dependencies) alone for erase support', () => {
    const depsOnly = FLAGS_NO_ERASE.map((b, i) => (i === 11 ? 1 : b));
    const [p] = decodePartitionList(decodeReply(partList({ 0: { flags: depsOnly } })).payload, 10);
    expect(p.eraseSupported).toBe(false);
  });

  it('below version 5, erase is allowed when index 9 is 0 and not otherwise', () => {
    const build = (flags: number[]) => decodeReply(encodeMessage(CQryPartList | 1, [0], new Uint8Array([1, 0, 0, 0, 1, 0x50, ...new Array(16).fill(0), ...flags]))).payload;
    expect(decodePartitionList(build(new Array(10).fill(0)), 4)[0]).toMatchObject({ eraseSupported: true });
    expect(decodePartitionList(build([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]), 4)[0].eraseSupported).toBe(false);
    expect(decodePartitionList(build(new Array(10).fill(1)), 4)[0].flags).toHaveLength(10);
  });

  it('refuses a name longer than 127 bytes, saying so', () => {
    const bytes = [1, 0, 0, 0, 0x80, ...new Array(0x80).fill(65), ...new Array(16 + 13).fill(0)];
    const payload = decodeReply(encodeMessage(CQryPartList | 1, [0], new Uint8Array(bytes))).payload;
    expect(() => decodePartitionList(payload, 10)).toThrow(/longer than 127 bytes/);
  });

  it('refuses a truncated record', () => {
    const payload = decodeReply(partList()).payload.slice(0, 40);
    expect(() => decodePartitionList(payload, 10)).toThrow(NordError);
  });
});

describe('readPartitionList', () => {
  it('asks CQryPartList and decodes at the session version', async () => {
    const t = new MockTransport([partList()]);
    const list = await readPartitionList(new NordSession(t));
    expect(decodeReply(t.sent[0]).msgId).toBe(CQryPartList);
    expect(list[6].name).toBe('Program');
  });

  it('throws on a non-zero status', async () => {
    const t = new MockTransport([encodeMessage(CQryPartList | 1, [2])]);
    await expect(readPartitionList(new NordSession(t))).rejects.toThrow(/partition list/);
  });
});
