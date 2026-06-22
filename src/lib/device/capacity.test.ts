import { describe, it, expect } from 'vitest';
import { decodeReply } from './protocol';
import {
  decodePartState,
  decodeBankList,
  checkDownloadFit,
  readPartitionCapacity,
  type PartitionCapacity,
} from './capacity';
import type { NordSession } from './session';

/** Parse a space-separated hex dump into bytes. */
function hex(s: string): Uint8Array {
  return new Uint8Array(s.trim().split(/\s+/).map((b) => parseInt(b, 16)));
}

// Real replies captured from a Nord Stage 4 (fw 3.40) via scripts/nordprobe.c —
// read-only `CQryPartState{6}` / `CQryBankList{6}` on the Program partition.
// Full frames incl. the 16-byte header + trailing CRC16, so decodeReply also
// validates framing + CRC against the actual device bytes.

// CQryPartState{6} → CRpyPartState (0x09)
const PART_STATE_PROGRAM = hex(`
  00 00 00 2a 00 00 00 0c 00 00 00 0a 00 00 00 09
  00 00 00 00 00 00 01 64 00 00 0d e0 00 00 12 18 00 00 00 00 00 00 00 04
  8a e5
`);

// CQryBankList{6} → CRpyBankList (0x03): 8 banks "Bank A".."Bank H", each 64 slots.
const BANK_LIST_PROGRAM = hex(`
  00 00 00 8b 00 00 00 0c 00 00 00 0a 00 00 00 03
  00 00 00 00 00 00 00 06 08
  00 00 00 06 42 61 6e 6b 20 41 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 42 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 43 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 44 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 45 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 46 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 47 00 00 00 40
  00 00 00 06 42 61 6e 6b 20 48 00 00 00 40
  69 18
`);

describe('decodePartState (real NS4 capture)', () => {
  it('decodes the Program partition state', () => {
    const reply = decodeReply(PART_STATE_PROGRAM); // also asserts CRC + length
    expect(reply.msgId).toBe(0x09);
    expect(reply.status).toBe(0);
    const state = decodePartState(reply.payload);
    // 356 == the enumerated Program corpus (docs/PROTOCOL-RE.md), the ground-truth anchor.
    expect(state.fileCount).toBe(356);
    // Word order is [fileCount, free, used, reserved, E] — free before used.
    expect(state.freeBlocks).toBe(3552);
    expect(state.usedBlocks).toBe(4632);
    expect(state.reservedBlocks).toBe(0);
  });

  it('rejects a truncated payload', () => {
    expect(() => decodePartState(new Uint8Array(8))).toThrow(/too short/);
  });
});

describe('decodeBankList (real NS4 capture)', () => {
  it('decodes 8 banks of 64 slots = 512', () => {
    const reply = decodeReply(BANK_LIST_PROGRAM);
    expect(reply.msgId).toBe(0x03);
    expect(reply.status).toBe(0);
    const { banks, totalSlots } = decodeBankList(reply.payload);
    expect(banks).toHaveLength(8);
    expect(banks.map((b) => b.name)).toEqual(['Bank A', 'Bank B', 'Bank C', 'Bank D', 'Bank E', 'Bank F', 'Bank G', 'Bank H']);
    expect(banks.every((b) => b.slotCapacity === 64)).toBe(true);
    expect(totalSlots).toBe(512);
  });
});

describe('readPartitionCapacity', () => {
  it('combines both queries into free-slot math (356/512 → 156 free)', async () => {
    // Fake session that answers each query with the captured reply.
    const session = {
      request: async (msgId: number) =>
        decodeReply(msgId === 0x08 ? PART_STATE_PROGRAM : BANK_LIST_PROGRAM),
    } as unknown as NordSession;

    const cap = await readPartitionCapacity(session, 6);
    expect(cap.fileCount).toBe(356);
    expect(cap.totalSlots).toBe(512);
    expect(cap.freeSlots).toBe(156);
    expect(cap.freeBlocks).toBe(3552);
    expect(cap.usedBlocks).toBe(4632);
  });
});

describe('checkDownloadFit', () => {
  const cap = (fileCount: number, totalSlots = 512): PartitionCapacity => ({
    fileCount,
    usedBlocks: 0,
    freeBlocks: 1000,
    reservedBlocks: 0,
    banks: [],
    totalSlots,
    freeSlots: Math.max(0, totalSlots - fileCount),
  });

  it('fits when added files ≤ free slots', () => {
    expect(checkDownloadFit(cap(356), 156).fits).toBe(true); // exactly fills
    expect(checkDownloadFit(cap(356), 1).fits).toBe(true);
  });

  it('does not fit when over, with a shortfall message', () => {
    const r = checkDownloadFit(cap(356), 157, 'Program');
    expect(r.fits).toBe(false);
    expect(r.freeSlots).toBe(156);
    expect(r.reason).toMatch(/Free up 1 more/);
  });

  it('reports a full partition distinctly', () => {
    const r = checkDownloadFit(cap(512), 1, 'Program');
    expect(r.fits).toBe(false);
    expect(r.reason).toMatch(/Program memory is full \(512 of 512 used\)/);
  });
});
