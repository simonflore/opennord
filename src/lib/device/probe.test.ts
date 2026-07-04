import { describe, it, expect } from 'vitest';
import { encodeMessage } from './protocol';
import { ext2Type } from './opcodes';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { probeDevice, inferProgramPartition, crossCheckProgramPartition } from './probe';
import type { ProbeReport } from './probe';

const WRITE_OPCODES = [0x0a, 0x10, 0x14]; // Create, Write, Delete
const reply = (msgId: number, words: number[]) => encodeMessage(msgId, words);
/** A FileInfo (0x1f) reply carrying just enough for decodeFileInfo: fourcc at word 4. */
const fileInfo = (fourcc: string) => reply(0x1f, [0, 0, 0, 10, ext2Type(fourcc), 313, 0, 0, 0]);
const opcodeOf = (frame: Uint8Array) =>
  new DataView(frame.buffer, frame.byteOffset, frame.byteLength).getUint32(12);
const at = () => new Date('2026-06-20T00:00:00Z');

describe('probeDevice', () => {
  it('records an existing (empty) partition and skips absent ones', async () => {
    // partition 0: begin OK, iterate→terminal (0 files), end OK; partitions 1..13: begin fail.
    const replies = [reply(0x05, [0]), reply(0x21, [2, 0, 0]), reply(0x07, [0])];
    for (let i = 1; i < 14; i++) replies.push(reply(0x05, [1])); // begin status 1 → absent
    const t = new MockTransport(replies);
    const r = await probeDevice(new NordSession(t), { deviceName: 'Nord X', productId: 0x0030, now: at });
    expect(r.partitions).toEqual([{ index: 0, fileCount: 0, fourccs: [] }]);
    expect(r.deviceName).toBe('Nord X');
    expect(r.capturedAt).toBe('2026-06-20T00:00:00.000Z');
  });

  it('records the distinct file types (fourccs) present in each partition', async () => {
    // partition 0 holds one ns3f file, then partitions 1..13 are absent.
    const replies = [
      reply(0x05, [0]), // begin OK
      reply(0x21, [0, 0, 0]), // FileIterate code 0 → a file at bank 0, slot 0
      fileInfo('ns3f'), // FileInfo → type ns3f
      reply(0x21, [2, 0, 0]), // FileIterate terminal → stop
      reply(0x07, [0]), // end OK
    ];
    for (let i = 1; i < 14; i++) replies.push(reply(0x05, [1]));
    const t = new MockTransport(replies);
    const r = await probeDevice(new NordSession(t), { deviceName: 'Nord X', productId: 0x0026, now: at });
    expect(r.partitions).toEqual([{ index: 0, fileCount: 1, fourccs: ['ns3f'] }]);
  });

  it('NEVER emits a write opcode (read-only contract)', async () => {
    const replies = Array.from({ length: 28 }, () => reply(0x05, [1])); // all partitions absent
    const t = new MockTransport(replies);
    await probeDevice(new NordSession(t), { deviceName: 'Nord X', productId: 0x0030, now: at });
    const used = t.sent.map(opcodeOf);
    for (const w of WRITE_OPCODES) expect(used).not.toContain(w);
  });
});

const report = (parts: Array<[number, string[]]>): ProbeReport => ({
  deviceName: 'Nord X', productId: 0x0030, capturedAt: at().toISOString(),
  partitions: parts.map(([index, fourccs]) => ({ index, fileCount: fourccs.length, fourccs })),
});

describe('inferProgramPartition', () => {
  it('returns the index of the partition whose fourccs include the program tag', () => {
    // A real Electro 5 probe: "ne5p" lives at partition 4, not the default 6.
    const r = report([[1, ['ne5o']], [4, ['ne5p']], [6, ['ne5l']]]);
    expect(inferProgramPartition(r, 'ne5p')).toBe(4);
  });

  it('returns undefined when no partition carries the program tag', () => {
    expect(inferProgramPartition(report([[4, ['ne5o']]]), 'ne5p')).toBeUndefined();
  });
});

describe('crossCheckProgramPartition', () => {
  it('agrees when the probe confirms the static index', () => {
    const r = report([[4, ['ne5p']]]);
    expect(crossCheckProgramPartition(r, 'ne5p', 4)).toEqual({ probed: 4, expected: 4, agrees: true });
  });

  it('flags a disagreement so the static index can be corrected', () => {
    const r = report([[2, ['ne5p']]]);
    expect(crossCheckProgramPartition(r, 'ne5p', 4)).toEqual({ probed: 2, expected: 4, agrees: false });
  });

  it('reports no agreement when the tag is absent from the probe', () => {
    const r = report([[4, ['ne5o']]]);
    expect(crossCheckProgramPartition(r, 'ne5p', 4)).toEqual({ probed: undefined, expected: 4, agrees: false });
  });
});
