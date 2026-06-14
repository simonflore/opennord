import { describe, it, expect } from 'vitest';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { encodeMessage } from './protocol';
import { CQryFileInfo, CQryFileIterate, ext2Type } from './opcodes';
import { enumeratePrograms } from './transfer';

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

describe('enumeratePrograms', () => {
  it('walks the iterate cursor across banks and names each file via FileInfo', async () => {
    const replies: Uint8Array[] = [
      iterReply(0, 0, 0),                                                   // bank0: file at slot 0
      infoReply({ size: 824, version: 313, category: 17, name: 'Dont look back' }),
      iterReply(1, 0, 0),                                                   // bank0 exhausted → bank1
    ];
    for (let b = 1; b < 8; b++) replies.push(iterReply(1, b, 0));           // banks 1..7 exhausted
    const session = new NordSession(new MockTransport(replies));

    const entries = await enumeratePrograms(session);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      bank: 0, slot: 0, name: 'Dont look back',
      categoryId: 17, version: 313, sizeBytes: 824,
    });
  });
});
