import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeNsmpMulti } from './nsmp-write';
import { readNsmp, decodeNsmp, readNsmpZones, parseNsmpSections, readStrokeLoop, patchStrokeLoopBytes } from './nsmp';
import { editModel, buildEditedNsmp, patchEditedNsmp } from './sample-edit';

/**
 * A deterministic 2-zone source .nsmp (no gitignored fixture needed). Audio is
 * long enough to clear the decoder's stroke-detection length gate (see
 * `decodeStrokeSection` in nsmp.ts) so the strokes round-trip back out.
 */
function srcNsmp(): Uint8Array {
  const a = Int32Array.from({ length: 1500 }, (_, i) => Math.round(1000 * Math.sin(i / 8)));
  const b = Int32Array.from({ length: 1800 }, (_, i) => Math.round(800 * Math.sin(i / 12)));
  return writeNsmpMulti({
    name: 'Src',
    codec: 3,
    zones: [
      { channels: [a], keyHigh: 60, rootKey: 48, velTop: 127 },
      { channels: [b], keyHigh: 96, rootKey: 72, velTop: 127 },
    ],
  });
}

describe('editModel', () => {
  it('derives name + per-zone fields from a loaded sample', () => {
    const src = srcNsmp();
    const m = editModel(readNsmp(src), readNsmpZones(src));
    expect(m.name).toBe('Src');
    expect(m.zones.length).toBe(2);
    expect(m.zones[0]).toMatchObject({ rootKey: 48, keyHigh: 60, velTop: 127 });
    expect(m.zones[1]).toMatchObject({ rootKey: 72, keyHigh: 96 });
  });
});

describe('buildEditedNsmp', () => {
  it('round-trips an edit: rename + change a zone root; audio preserved', () => {
    const src = srcNsmp();
    const decoded = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.name = 'Edited';
    model.zones[0].rootKey = 36;

    const out = buildEditedNsmp(model, decoded, 3);

    expect(readNsmp(out).name).toBe('Edited');
    const z = readNsmpZones(out);
    expect(z[0].rootKey).toBe(36);
    expect(z[1].rootKey).toBe(72);
    // audio preserved exactly (positional pairing)
    const rd = decodeNsmp(out);
    expect([...rd[0].channels[0]]).toEqual([...decoded[0].channels[0]]);
    expect([...rd[1].channels[0]]).toEqual([...decoded[1].channels[0]]);
  });

  it('throws if a zone has no corresponding decoded stroke', () => {
    const src = srcNsmp();
    const decoded = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.zones.push({ rootKey: 60, keyLow: 48, keyHigh: 100, velTop: 127 }); // extra zone, no stroke
    expect(() => buildEditedNsmp(model, decoded, 3)).toThrow();
  });
});

describe('patchStrokeLoopBytes', () => {
  it('writes loop-in @+0x1b and loop-out @+0x24 as u32 BE, leaving the rest', () => {
    const buf = new Uint8Array(0x40);
    patchStrokeLoopBytes(buf, 0, 0x01020304, 0x0a0b0c0d);
    expect([...buf.subarray(0x1b, 0x1f)]).toEqual([0x01, 0x02, 0x03, 0x04]);
    expect([...buf.subarray(0x24, 0x28)]).toEqual([0x0a, 0x0b, 0x0c, 0x0d]);
    // start (@0x12) and end (@0x2d) untouched (still zero here)
    expect([...buf.subarray(0x12, 0x16)]).toEqual([0, 0, 0, 0]);
    expect([...buf.subarray(0x2d, 0x31)]).toEqual([0, 0, 0, 0]);
  });
});

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const takeOnMe = '/Users/simonflore/Documents/TBM/TAKE ON ME.nsmp';
describe.skipIf(!existsSync(takeOnMe))('loop points round-trip in place', () => {
  it('moves loop-in/out and reads them back, preserving size', () => {
    const src = new Uint8Array(readFileSync(takeOnMe));
    const stk = parseNsmpSections(src).find((s) => s.tag.endsWith('stk'));
    if (!stk) return;
    const before = readStrokeLoop(src, stk.payloadOffset);
    if (!before) return;
    const startAbs = u32be(src, stk.payloadOffset + 0x12);
    const out = patchEditedNsmp(src, {
      name: 'x', zones: [],
      loops: [{ stkPayloadOffset: stk.payloadOffset, loopInAbs: startAbs + before.loopStart + 50, loopOutAbs: startAbs + before.loopEnd - 50 }],
    });
    const after = readStrokeLoop(out, stk.payloadOffset);
    expect(after!.loopStart).toBe(before.loopStart + 50);
    expect(after!.loopEnd).toBe(before.loopEnd - 50);
    expect(out.length).toBe(src.length);
  });
});

describe('patchEditedNsmp', () => {
  it('patches zone fields + name in place, preserving size, audio and checksum', () => {
    const src = srcNsmp();
    const before = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.name = 'Edited';
    model.zones[0].rootKey = 36;
    model.zones[0].keyHigh = 58;
    model.zones[0].velTop = 100;

    const out = patchEditedNsmp(src, model);

    expect(out.length).toBe(src.length);           // in-place: same file size
    expect(readNsmp(out).checksumValid).toBe(true); // re-checksummed
    expect(readNsmp(out).name).toBe('Edited');
    const z = readNsmpZones(out);
    expect(z[0]).toMatchObject({ rootKey: 36, keyHigh: 58, velTop: 100 });
    expect(z[1]).toMatchObject({ rootKey: 72, keyHigh: 96, velTop: 127 }); // untouched
    // audio is byte-identical — patching never moves a sample
    const after = decodeNsmp(out);
    expect([...after[0].channels[0]]).toEqual([...before[0].channels[0]]);
    expect([...after[1].channels[0]]).toEqual([...before[1].channels[0]]);
  });

  it('patches an edited bottom key (keyLow) back in place', () => {
    const src = srcNsmp();
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.zones[0].keyLow = 36; // C2
    const out = patchEditedNsmp(src, model);
    expect(out.length).toBe(src.length);
    expect(readNsmpZones(out)[0].keyLow).toBe(36);
    expect(readNsmpZones(out)[1].keyLow).toBe(readNsmpZones(src)[1].keyLow); // untouched
  });

  // Real codec-4 multisample: edit one zone, prove everything else stays byte-exact.
  const other4 = join(process.cwd(), 'research/nsmp/Other.nsmp4');
  it.skipIf(!existsSync(other4))('edits a real .nsmp4 zone, preserving every other byte', () => {
    const src = new Uint8Array(readFileSync(other4));
    const model = editModel(readNsmp(src), readNsmpZones(src));
    const e0 = model.zones[0].recordOffset!;
    model.zones[0].rootKey = 101; // was 100

    const out = patchEditedNsmp(src, model);

    expect(out.length).toBe(src.length);
    expect(readNsmp(out).checksumValid).toBe(true);
    expect(readNsmpZones(out)[0].rootKey).toBe(101);
    expect(readNsmpZones(out).slice(1)).toEqual(readNsmpZones(src).slice(1)); // other zones intact
    // exactly two bytes differ: the rootKey (codec-4 root@+0) and… the rest is the
    // CRC. Collect the changed offsets and assert they're only those.
    const changed: number[] = [];
    for (let i = 0; i < src.length; i++) if (src[i] !== out[i]) changed.push(i);
    expect(changed).toContain(e0 + 0); // rootKey byte (ZONE_LAYOUT_C4.rootKey === 0)
    // CRC lives at 0x18..0x1b; every other changed byte must be in that range.
    expect(changed.every((i) => i === e0 || (i >= 0x18 && i <= 0x1b))).toBe(true);
  });
});
