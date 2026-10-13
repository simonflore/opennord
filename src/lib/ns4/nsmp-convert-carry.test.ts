import { describe, it, expect } from 'vitest';
import { decodeNsmp, readGlobalLevelDetuneBytes, readNsmp, readNsmpZones, readPerNoteRows, perNoteCustomCount } from './nsmp';
import { convertNsmp } from './nsmp-convert';
import { checkSampleConversions } from './nsmp-convert-check';
import { writeNsmpMulti } from './nsmp-write';
import { writeCodec2StrokePayload } from './nsmp-codec2-write';
import { assembleOgNsmp } from './nsmp-og';
import { encodeStrokeNW1Marked } from './nw1-encode';
import { decodeStroke } from './nsmp-codec';

const tone = (n: number, amp: number, k: number) => Int32Array.from({ length: n }, (_, i) => Math.round(amp * Math.sin(i / k)));

/**
 * A two-note sample with everything a real one carries besides audio: a loop with an
 * alternate start and a decay on the first note, a one-shot second note tuned a little
 * sharp, an overall level and detune, and one key with its own level.
 */
function source(codec: 3 | 4): Uint8Array {
  const fields = (pitchBase: number) => Uint8Array.of(0x00, 0x48, pitchBase >> 8, pitchBase & 0xff, 2, 0x0b, 0x82, 0xfd, 0x0a, 0xff, 0xf4, 0x0f, 0, 0);
  const perNote = Array.from({ length: 128 }, () => Uint8Array.of(0x10, 0, 0, 0, 0, 0));
  perNote[60] = Uint8Array.of(0x0c, 0xdb, 0x3e, 0xff, 0xff, 0xfb); // quieter, 5 units flat
  return writeNsmpMulti({
    name: 'Carry', codec,
    globalLevelDetune: Uint8Array.of(0x1f, 0xec, 0x98, 0x00, 0x00, 0x07),
    perNote,
    zones: [
      { channels: [tone(9000, 3000, 9), tone(9000, 2500, 11)], rootKey: 72, keyHigh: 96, keyLow: 70, velLow: 1,
        stroke: { headerFields: fields(0x88ba), loop: { loopStart: 6000, altStart: 1500, loops: true }, decayRaw: 0x80013e } },
      { channels: [tone(4000, 2000, 7), tone(4000, 2000, 7)], rootKey: 60, keyHigh: 69, keyLow: 40,
        stroke: { headerFields: fields(0x8b7b) } },
    ],
  });
}

describe('convertNsmp — what a sample holds besides audio', () => {
  it('the source reads back as written: loop, alternate start, decay, pitch, levels', () => {
    for (const codec of [3, 4] as const) {
      const [a, b] = decodeNsmp(source(codec));
      expect(a.loop).toMatchObject({ loops: true, loopStart: 6000, loopEnd: 9000, altStart: 1500 });
      expect(a.loop!.decayDbPerSecond).toBeGreaterThan(0);
      expect(b.loop).toMatchObject({ loops: false, loopStart: 4000, loopEnd: 4000 });
      expect([a.sampleRate, b.sampleRate]).toEqual([0x88ba, 0x8b7b]);
      expect(perNoteCustomCount(source(codec))).toBe(1);
    }
  });

  for (const from of [3, 4] as const) {
    for (const to of [2, 3, 4] as const) {
      if (from === to) continue;
      it(`keeps them from generation ${from} to ${to}`, () => {
        const src = source(from);
        const out = convertNsmp(src, to).bytes;
        expect(readNsmp(out).codec).toBe(to);
        const before = decodeNsmp(src);
        const after = decodeNsmp(out);
        expect(after.map((s) => s.loop)).toEqual(before.map((s) => s.loop));
        expect(after.map((s) => s.sampleRate)).toEqual(before.map((s) => s.sampleRate));
        after.forEach((s, i) => s.channels.forEach((c, k) => expect(Array.from(c)).toEqual(Array.from(before[i].channels[k]))));
        expect(readGlobalLevelDetuneBytes(out)).toEqual(readGlobalLevelDetuneBytes(src));
        expect(readPerNoteRows(out)).toEqual(readPerNoteRows(src));
        // The one check that says all of the above in one go, as the corpus scan runs it.
        expect(checkSampleConversions(src).find((c) => c.target === to)).toEqual({ target: to, lost: [] });
      });
    }
  }

  it('comes back unchanged through the oldest format and out again', () => {
    const src = source(3);
    const back = convertNsmp(convertNsmp(src, 2).bytes, 3).bytes;
    expect(decodeNsmp(back).map((s) => s.loop)).toEqual(decodeNsmp(src).map((s) => s.loop));
    expect(readPerNoteRows(back)).toEqual(readPerNoteRows(src));
    expect(readGlobalLevelDetuneBytes(back)).toEqual(readGlobalLevelDetuneBytes(src));
  });

  it('keeps each key range between the two newer formats', () => {
    const zones = (b: Uint8Array) => readNsmpZones(b).map((z) => [z.keyLow, z.keyHigh, z.rootKey, z.velLow, z.velTop]);
    expect(zones(convertNsmp(source(3), 4).bytes)).toEqual(zones(source(3)));
    expect(zones(source(3))).toEqual([[70, 96, 72, 1, 127], [40, 69, 60, 0, 127]]);
  });

  it('writes a legacy key map the way real ones are laid out, and reads every zone of it', () => {
    const out = convertNsmp(source(3), 2).bytes;
    const map = readNsmp(out).sections.find((s) => s.tag.endsWith('map'))!;
    // global 6 + 9 zero bytes + 128 rows of 6 + a u24 count + 15 bytes a zone
    expect(map.endOffset - map.payloadOffset).toBe(6 + 9 + 768 + 3 + 2 * 15);
    expect(Array.from(out.subarray(map.payloadOffset + 6, map.payloadOffset + 15))).toEqual(new Array(9).fill(0));
    expect(Array.from(out.subarray(map.payloadOffset + 783, map.payloadOffset + 786))).toEqual([0, 0, 2]);
    expect(readNsmpZones(out).map((z) => [z.keyHigh, z.rootKey])).toEqual([[96, 72], [69, 60]]);
  });

  it('says what a conversion lost when it loses something', () => {
    // A sample written without stroke details has no loop to keep, so nothing is lost…
    const plain = writeNsmpMulti({ name: 'Plain', codec: 3, zones: [{ channels: [tone(3000, 2000, 9)], rootKey: 60, keyHigh: 127 }] });
    expect(checkSampleConversions(plain).every((c) => c.lost.length === 0)).toBe(true);
    // …and a file that isn't a sample has no conversions at all.
    expect(() => checkSampleConversions(new Uint8Array(64))).not.toThrow();
  });

  it('the encoder reports the same block positions the decoder finds', () => {
    const ch = [tone(5000, 3000, 9), tone(5000, 2500, 11)];
    const cuts = [2000, 6000];
    for (const opts of [{}, { wordInterleaved: true }, { u24: true, blockPerCh: 24 }]) {
      const { bytes, marks } = encodeStrokeNW1Marked(ch, { ...opts, segmentsInterleaved: cuts });
      const read = decodeStroke(bytes, 0, 2, opts).marks.map((m) => ({ word: m.word, sample: m.sample }));
      expect(marks).toEqual(read);
      expect(marks.map((m) => m.sample)).toEqual([0, 2000, 6000, 10000]);
    }
  });

  it('copies the gain bytes only between the two newer formats', () => {
    const src = source(3);
    const stk = (b: Uint8Array) => readNsmp(b).sections.filter((x) => x.tag.endsWith('stk'))[0].payloadOffset;
    const gain = (b: Uint8Array) => Array.from(b.subarray(stk(b) + 0x09, stk(b) + 0x10));
    expect(gain(convertNsmp(src, 4).bytes)).toEqual(gain(src));
    expect(gain(convertNsmp(src, 2).bytes)).not.toEqual(gain(src)); // the legacy writer's own values
    // The pitch base and the zone's root key go across either way.
    for (const to of [2, 4] as const) {
      const out = convertNsmp(src, to).bytes;
      expect(Array.from(out.subarray(stk(out) + 0x05, stk(out) + 0x08))).toEqual([72, 0x88, 0xba]);
    }
  });

  it('reads the per-key rows of a .nsmp an older OpenNord wrote, where they follow the global bytes', () => {
    const map = new Uint8Array(6 + 768 + 15);
    map.set([0x10, 0, 0], 0);
    for (let i = 0; i < 128; i++) map.set([0x10, 0, 0], 6 + i * 6);
    map.set([0x0c, 0xdb, 0x3e], 6 + 60 * 6); // one key with its own level
    map.set([5, 0x10, 0, 0, 0, 0, 0, 96, 0, 1], 6 + 768); // gid 5, top key 96
    const old = assembleOgNsmp([
      { tag: 'NWS', version: 11, payload: new Uint8Array(0) },
      { tag: 'hdr', version: 9, payload: new Uint8Array(111) },
      { tag: 'cat', version: 5, payload: new Uint8Array(9) },
      { tag: 'map', version: 10, payload: map },
      { tag: 'stk', version: 9, payload: writeCodec2StrokePayload({ channels: [tone(3000, 2000, 9)], globalID: 5, rootKey: 60, keyHigh: 96 }) },
      { tag: 'sty', version: 5, payload: new Uint8Array(9) },
    ], 200);
    expect(perNoteCustomCount(old)).toBe(1);
    expect(Array.from(readPerNoteRows(old)![60])).toEqual([0x0c, 0xdb, 0x3e, 0, 0, 0]);
    expect(readNsmpZones(old).map((z) => [z.globalID, z.keyHigh])).toEqual([[5, 96]]);
    expect(perNoteCustomCount(convertNsmp(old, 4).bytes)).toBe(1);
  });

  it('gives the strokes new ids for .nsmp when the source ids repeat', () => {
    const z = (rootKey: number, keyHigh: number, k: number) => ({ channels: [tone(3000, 2000, k)], rootKey, keyHigh });
    const src = writeNsmpMulti({ name: 'Ids', codec: 4, zones: [z(72, 96, 9), z(60, 71, 7)] });
    const twin = src.slice();
    const stks = readNsmp(twin).sections.filter((x) => x.tag.endsWith('stk'));
    twin[stks[1].payloadOffset + 3] = twin[stks[0].payloadOffset + 3]; // both strokes now read as id 1
    const ids = decodeNsmp(convertNsmp(twin, 2).bytes).map((s) => s.globalID);
    expect(new Set(ids).size).toBe(2);
  });
});

