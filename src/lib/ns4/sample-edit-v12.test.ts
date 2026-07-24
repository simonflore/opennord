import { describe, it, expect } from 'vitest';
import { readNsmp, readNsmpZones, parseNsmpSections } from './nsmp';
import { editModel, patchEditedNsmp } from './sample-edit';
import { nsmpHasChecksumField } from '../clavia/sample-identify';

/**
 * A deterministic, fully-synthetic **format-0, `map` v12** `.nsmp3` — the stroke-
 * reference generation Fred's "Gothic esamble SL.nsmp3" belongs to. No factory
 * content, no gitignored fixture. It carries just enough structure for the real
 * reader/patcher: the `NSMP` section root at 0x18 (format-0, no CRC block), an
 * `hdr` name, a v12 `map` with two 11-byte records, and two `stk` headers whose
 * gid (+3) / root (+5) the zone reader joins against.
 *
 * v12 record = `00 01 [keyLow] [keyHigh] 00 00 01 00 00 00 [gid]` (11 bytes;
 * keyHigh@+3, gid@+10, marker@+6). See parseCodec3V12ZoneRecords.
 */
function synthV12Nsmp(): Uint8Array {
  const b = new Uint8Array(0xa4);
  const asc = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  const sec = (o: number, tagLow3: string, version: number, size: number) => {
    b[o] = 0x00; asc(o + 1, tagLow3);          // tag = "\0" + 3 chars (u32 BE), e.g. "\0map"
    b[o + 7] = version & 0xff;                 // version u32 BE (low byte)
    b[o + 8] = (size >>> 24) & 0xff; b[o + 9] = (size >>> 16) & 0xff;
    b[o + 10] = (size >>> 8) & 0xff; b[o + 11] = size & 0xff; // size u32 BE
  };

  // CBIN header — format-0 (byte 0x04 = 0), tag "nsmp", version 300 (→ codec 3).
  asc(0x00, 'CBIN'); b[0x04] = 0x00; asc(0x08, 'nsmp'); b[0x14] = 0x2c; b[0x15] = 0x01;

  // Body root at 0x18 (format-0): "NSMP", then hdr / map / stk / stk.
  asc(0x18, 'NSMP'); b[0x1f] = 0x1e; b[0x23] = 0x04; // NSMP v?, size 4 → payload 0x24..0x27
  sec(0x28, 'hdr', 0, 16);                            // hdr payload 0x34..0x43
  asc(0x3c, 'Src');                                   // name at hdr payload +8 (printable run)
  sec(0x44, 'map', 12, 28);                           // map payload 0x50..0x6b (v12)
  sec(0x6c, 'stk', 0, 16);                            // stk#1 payload 0x78..0x87
  sec(0x88, 'stk', 0, 16);                            // stk#2 payload 0x94..0xa3

  // map payload: [6B global] then two 11-byte v12 records (gid 5 / gid 6).
  b[0x50] = 0x10;                                     // global level unity high byte
  const rec = (o: number, keyLow: number, keyHigh: number, gid: number) => {
    b[o] = 0x00; b[o + 1] = 0x01; b[o + 2] = keyLow; b[o + 3] = keyHigh; b[o + 6] = 0x01; b[o + 10] = gid;
  };
  rec(0x56, 0, 60, 5);                                // zone A: split 60, gid 5
  rec(0x61, 61, 96, 6);                               // zone B: split 96, gid 6

  // stk headers: gid @ payload +3, root @ payload +5 (strokeRootByGlobalId).
  b[0x78 + 3] = 5; b[0x78 + 5] = 48;                  // gid 5 → root 48
  b[0x94 + 3] = 6; b[0x94 + 5] = 72;                  // gid 6 → root 72
  return b;
}

describe('v12 (.nsmp3 stroke-reference) synthetic fixture is well-formed', () => {
  it('reads as a non-legacy codec-3 v12 with two zones and no checksum field', () => {
    const src = synthV12Nsmp();
    const f = readNsmp(src);
    expect(f.recognized).toBe(true);
    expect(f.legacy).toBe(false);
    expect(f.codec).toBe(3);
    expect(f.checksumValid).toBe(true);         // format-0 → nothing to validate, not a "mismatch"
    expect(f.warnings).toEqual([]);
    expect(nsmpHasChecksumField(src)).toBe(false);
    expect(parseNsmpSections(src).find((s) => s.tag.endsWith('map'))?.version).toBe(12);
    const z = readNsmpZones(src);
    expect(z.map((x) => x.keyHigh)).toEqual([96, 60]); // reader sorts top-down
    expect(z.find((x) => x.globalID === 5)?.rootKey).toBe(48);
    expect(z.find((x) => x.globalID === 6)?.rootKey).toBe(72);
  });
});

describe('patchEditedNsmp on a v12 .nsmp3 (regression for "rename → all mapping/samples lost")', () => {
  it('a pure rename preserves every zone, the NSMP root, and the section tree', () => {
    const src = synthV12Nsmp();
    const before = parseNsmpSections(src).map((s) => `${s.tag}:${s.size}`);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.name = 'Renamed';

    const out = patchEditedNsmp(src, model);

    expect(readNsmp(out).name).toBe('Renamed');
    expect(readNsmpZones(out).length).toBe(2);                     // was 0 before the fix
    expect([...out.subarray(0x18, 0x1c)]).toEqual([0x4e, 0x53, 0x4d, 0x50]); // NSMP root intact
    expect(out.length).toBe(src.length);                          // never changes length
    expect(parseNsmpSections(out).map((s) => `${s.tag}:${s.size}`)).toEqual(before); // tree intact (.stk not clobbered)
  });

  it('edits root + split in place and round-trips them', () => {
    const src = synthV12Nsmp();
    const model = editModel(readNsmp(src), readNsmpZones(src));
    const zoneB = model.zones.find((z) => z.globalID === 6)!;
    zoneB.rootKey = 74;
    zoneB.keyHigh = 100;

    const out = patchEditedNsmp(src, model);

    const back = readNsmpZones(out).find((z) => z.globalID === 6)!;
    expect(back.rootKey).toBe(74);
    expect(back.keyHigh).toBe(100);
    expect(readNsmpZones(out).length).toBe(2);
  });
});
