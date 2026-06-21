import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { patchNs4Checksum } from '../clavia/checksum';
import { readNsmp, parseNsmpSections, decodeNsmp, readNsmpZones, parseLegacyZoneRecords, readGlobalLevelDetune, perNoteCustomCount, readSampleUnison } from './nsmp';
import { writeNsmp } from './nsmp-write';

/** Build a minimal synthetic `.nsmp` (CBIN header + NSMP + hdr sections). */
function makeSyntheticNsmp(name = 'Hi'): Uint8Array {
  const hdrPay = new Uint8Array(8);
  for (let i = 0; i < name.length && i < 8; i++) hdrPay[i] = name.charCodeAt(i);
  const buf = new Uint8Array(0x2c + 16 + (12 + hdrPay.length));
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  const u32be = (v: number, at: number) => { buf[at] = (v >>> 24) & 0xff; buf[at + 1] = (v >>> 16) & 0xff; buf[at + 2] = (v >>> 8) & 0xff; buf[at + 3] = v & 0xff; };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('nsmp', 0x08);
  buf[0x14] = 300 & 0xff; buf[0x15] = (300 >> 8) & 0xff; // version 3.00
  // NSMP section: tag, ver=30, size=4
  u32be(0x4e534d50, 0x2c); u32be(30, 0x30); u32be(4, 0x34);
  // hdr section: tag "\0hdr", ver=10, size=hdrPay.length, payload=name
  u32be(0x00686472, 0x3c); u32be(10, 0x40); u32be(hdrPay.length, 0x44);
  buf.set(hdrPay, 0x48);
  return patchNs4Checksum(buf);
}

describe('parseNsmpSections', () => {
  it('walks [tag][version][size] section headers', () => {
    const secs = parseNsmpSections(makeSyntheticNsmp());
    expect(secs.map((s) => s.tag)).toEqual(['NSMP', '.hdr']);
    expect(secs[0]).toMatchObject({ version: 30, size: 4, payloadOffset: 0x38 });
    expect(secs[1]).toMatchObject({ version: 10, size: 8, payloadOffset: 0x48 });
  });
});

describe('parseNsmpSections — codec 1/2 (legacy 9-byte headers)', () => {
  it('walks [tag:u24][version:u16][size:u32] sections for codec 2', () => {
    // CBIN + version 200 (codec 2) + two 9-byte-header sections (hdr, stk)
    const buf = new Uint8Array(0x2c + 9 + 4 + 9);
    const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
    ascii('CBIN', 0); buf[4] = 1; ascii('nsmp', 8);
    buf[0x14] = 200 & 0xff; buf[0x15] = 0; // version 2.00 → codec 2
    // section 0 @0x2c: tag u24 "hdr", version u16 = 5, size u32 = 4
    ascii('hdr', 0x2c); buf[0x2f] = 0; buf[0x30] = 5; buf[0x34] = 4; // size big-endian low byte
    // section 1 @0x2c+9+4 = 0x39: tag u24 "stk", version 11, size 0
    ascii('stk', 0x39); buf[0x3c] = 0; buf[0x3d] = 11;
    const secs = parseNsmpSections(buf);
    expect(secs.map((s) => s.tag)).toEqual(['.hdr', '.stk']); // u24 tag → NUL-left-padded
    expect(secs[0]).toMatchObject({ version: 5, size: 4, payloadOffset: 0x35 });
    expect(secs[1]).toMatchObject({ version: 11, size: 0, payloadOffset: 0x42 });
  });
});

describe('readNsmp', () => {
  it('reads version, codec, name and recognizes a sample file', () => {
    const f = readNsmp(makeSyntheticNsmp('Strings')); // ≤ 8-byte synthetic hdr payload
    expect(f.recognized).toBe(true);
    expect(f.version).toBe('3.00');
    expect(f.codec).toBe(3);
    expect(f.checksumValid).toBe(true);
    expect(f.name).toBe('Strings');
  });

  it('returns recognized:false for non-sample input', () => {
    expect(readNsmp(new Uint8Array([1, 2, 3, 4])).recognized).toBe(false);
  });
});

// Real-data validation against the user's own sample (gitignored). Skipped in CI.
const realFile = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(realFile))('readNsmp / decodeNsmp — real Strings.nsmp3', () => {
  const bytes = existsSync(realFile) ? new Uint8Array(readFileSync(realFile)) : new Uint8Array();

  it('parses the section tree (codec 3, name, 8 strokes)', () => {
    const f = readNsmp(bytes);
    expect(f.codec).toBe(3);
    expect(f.name).toBe('VLV Strings');
    expect(f.strokeCount).toBe(8);
    expect(f.sections.map((s) => s.tag)).toEqual(
      ['NSMP', '.hdr', '.cat', '.map', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.sty', 'meta'],
    );
  });

  it('reads the 8 key-split zones from the map section', () => {
    const zones = readNsmpZones(bytes);
    expect(zones.length).toBe(8);
    // Strings.nsmp3 is split across the keyboard: descending zones, one stroke each.
    // root-aligned record (CSectionMap::Read): rootKey@+0, keyHigh@+1, globalID@+11.
    expect(zones.map((z) => z.rootKey)).toEqual([45, 42, 40, 38, 33, 30, 28, 26]);
    expect(zones.map((z) => z.keyHigh)).toEqual([45, 42, 41, 39, 35, 31, 28, 26]);
    expect(zones.map((z) => z.globalID)).toEqual([3, 4, 2, 1, 7, 8, 6, 5]);
    // Velocity range is the full 0..127 (single layer); the old reader misread the
    // zone-count byte (8) as zone 0's velTop — the codec-3 off-by-one, now fixed.
    expect(zones.every((z) => z.velTop === 127)).toBe(true); // velMax @+15
    expect(zones.every((z) => z.velLow === 0)).toBe(true); // velMin @+14
    expect(zones.map((z) => z.zoneMode)).toEqual([0, 0, 0, 1, 0, 0, 0, 0]); // @+3, real ground truth
  });

  it('decodes all 8 strokes to clean stereo PCM', () => {
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(8);
    // per-stroke sample counts validated against the decoder (docs/NSMP-CODEC.md)
    expect(strokes.map((s) => s.channels[0].length)).toEqual(
      [68146, 53590, 68220, 53814, 70200, 54380, 67812, 53244],
    );
    for (const s of strokes) {
      expect(s.channelCount).toBe(2);
      expect(s.channels[1].length).toBe(s.channels[0].length); // L/R equal
      const peak = s.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      expect(peak).toBeLessThan(1 << 20); // sane 16-bit levels, not divergence
    }
    // stroke 0: clean silent onset
    expect(Array.from(strokes[0].channels[0].slice(0, 8))).toEqual([0, 0, 0, 0, -1, -2, -3, -4]);
  });
});

// Codec 4 (.nsmp4, word-interleaved) — real + editor-made ground-truth. Skipped in CI.
const nsmp4 = join(process.cwd(), 'research/nsmp/Strings.nsmp4');
const sine4 = join(process.cwd(), 'research/nsmp/ground-truth/sine_24.nsmp4');
describe.skipIf(!existsSync(nsmp4))('decodeNsmp — codec 4 (.nsmp4)', () => {
  it('decodes a real .nsmp4 to clean stereo (word-interleaved)', () => {
    const f = readNsmp(new Uint8Array(readFileSync(nsmp4)));
    expect(f.codec).toBe(4);
    const strokes = decodeNsmp(new Uint8Array(readFileSync(nsmp4)));
    expect(strokes.length).toBeGreaterThan(0);
    for (const s of strokes) {
      expect(s.channelCount).toBe(2);
      const peak = s.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      expect(peak).toBeLessThan(1 << 20); // sane 16-bit, not divergence
    }
  });

  it.skipIf(!existsSync(sine4))('decodes a known 220 Hz sine pixel-clean', () => {
    const strokes = decodeNsmp(new Uint8Array(readFileSync(sine4)));
    const L = strokes[0].channels[0];
    const peak = L.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    expect(peak).toBe(3000); // exact source amplitude — no divergence, no loss
    let zc = 0;
    for (let i = 1; i < L.length; i++) if ((L[i] > 0) !== (L[i - 1] > 0)) zc++;
    expect(zc).toBe(220); // 220 Hz over 0.5 s
  });
});

// OG / legacy `.nsmp` (version 8, NWS tree, 24-bit NW1). Real file, skipped in CI.
const ogNsmp = join(process.cwd(), 'research/nsmp/TAKE ON ME.nsmp');
describe.skipIf(!existsSync(ogNsmp))('readNsmp / decodeNsmp — OG .nsmp (legacy NWS, U24)', () => {
  const bytes = existsSync(ogNsmp) ? new Uint8Array(readFileSync(ogNsmp)) : new Uint8Array();

  it('recognizes the legacy NWS container (version 8, 9 strokes)', () => {
    const f = readNsmp(bytes);
    expect(f.recognized).toBe(true);
    expect(f.legacy).toBe(true);
    expect(f.versionRaw).toBe(8);
    expect(f.strokeCount).toBe(9);
    // legacy 9-byte section tree rooted at the `NWS` magic (0x18)
    expect(f.sections.map((s) => s.tag.replace(/^\.+/, ''))).toEqual(
      ['NWS', 'hdr', 'map', 'stk', 'stk', 'stk', 'stk', 'stk', 'stk', 'stk', 'stk', 'stk', 'sty'],
    );
  });

  it('decodes all 9 strokes to clean stereo via the 24-bit NW1 path', () => {
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(9);
    for (const s of strokes) {
      expect(s.channelCount).toBe(2);
      expect(s.channels[1].length).toBe(s.channels[0].length); // L/R equal
      const peak = s.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      expect(peak).toBeGreaterThan(0);
      expect(peak).toBeLessThan(1 << 16); // clean 16-bit levels, not divergence
    }
  });

  it('reads 9 key-split zones from the OG map (one per stroke — unblocks the editor)', () => {
    const zones = readNsmpZones(bytes);
    expect(zones.length).toBe(9); // === strokeCount, so the editor gate passes
    // OG map zone table: descending top keys (split points), stroke global ids 13→5.
    expect(zones.map((z) => z.keyHigh)).toEqual([108, 90, 81, 75, 69, 61, 51, 45, 39]);
    expect(zones.map((z) => z.globalID)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5]);
  });
});

describe('parseLegacyZoneRecords (OG .nsmp zone table)', () => {
  // Layout reverse-engineered from real OG files: [count:u16][00 00] then
  // count × 12-byte records [strokeIndex][rootKey][tune:u16][keyHigh:u32][00 01 00 00].
  const rec = (idx: number, root: number, keyHigh: number) =>
    [idx, root, 0x04, 0x1a, 0, 0, 0, keyHigh, 0, 1, 0, 0];

  it('decodes count + 12-byte records (keyHigh u32, stroke index, single vel layer)', () => {
    const buf = new Uint8Array([
      // per-note level junk that ends in 0x10 — must NOT false-match the count
      0, 0, 0, 0, 0, 0x10, 0, 0, 0, 0, 0, 0x10,
      0x00, 0x02, 0x00, 0x00, // count = 2, then 2 pad bytes
      ...rec(13, 19, 108),
      ...rec(12, 22, 90),
    ]);
    const z0 = { velLow: 0, zoneMode: 0, zonePlayback: 0, zoneIsOneShot: 0 };
    expect(parseLegacyZoneRecords(buf, 0, buf.length, 2)).toEqual([
      { velTop: 127, keyHigh: 108, keyLow: 19, rootKey: 19, globalID: 13, recordOffset: 16, ...z0 },
      { velTop: 127, keyHigh: 90, keyLow: 22, rootKey: 22, globalID: 12, recordOffset: 28, ...z0 },
    ]);
  });

  it('returns [] when no count marker / valid record block is found', () => {
    expect(parseLegacyZoneRecords(new Uint8Array([1, 2, 3, 4, 5, 6]), 0, 6, 2)).toEqual([]);
    expect(parseLegacyZoneRecords(new Uint8Array(20), 0, 20, 0)).toEqual([]);
  });
});

describe('readSampleUnison (codec-4 map block)', () => {
  it('reads the default unison block from a written .nsmp4: off, 2 voices, 0 dB', () => {
    const bytes = writeNsmp({ name: 'U', channels: [new Int16Array(64)], codec: 4 });
    const u = readSampleUnison(bytes)!;
    expect(u).not.toBeNull();
    expect(u.mode).toBe(0);
    expect(u.active).toBe(false);
    expect([u.numVoice1, u.numVoice2, u.numVoice3, u.numVoiceSame]).toEqual([2, 2, 2, 2]);
    expect(Math.abs(u.gainDbSame)).toBeLessThan(0.01); // unity 0x100000 → 0 dB
    expect(u.detuneMax).toBe(0);
    expect(u.panMax).toBe(0);
    expect(u.randomStrokeMode).toBe(0);
  });

  it('returns null for a codec-3 file (no unison block)', () => {
    const bytes = writeNsmp({ name: 'U3', channels: [new Int16Array(64)], codec: 3 });
    expect(readSampleUnison(bytes)).toBeNull();
  });

  const oth = join(process.cwd(), 'research/nsmp/Other.nsmp4');
  it.skipIf(!existsSync(oth))('reads the real Other.nsmp4 unison block (all default)', () => {
    const u = readSampleUnison(new Uint8Array(readFileSync(oth)))!;
    expect(u.mode).toBe(0);
    expect([u.numVoice1, u.numVoice2, u.numVoice3, u.numVoiceSame]).toEqual([2, 2, 2, 2]);
    expect(u.gainDb1).toBeCloseTo(0, 5);
    expect(u.active).toBe(false);
  });
});

const n4 = join(process.cwd(), 'research/nsmp/Strings.nsmp4');
describe.skipIf(!existsSync(n4))('readNsmpZones — codec-4 split map', () => {
  it('reads the same number of zones as there are strokes, with valid keys', () => {
    const b = new Uint8Array(readFileSync(n4));
    const zones = readNsmpZones(b);
    const strokes = parseNsmpSections(b).filter((s) => s.tag.endsWith('stk')).length;
    expect(zones.length).toBe(strokes);
    for (const z of zones) {
      expect(z.keyHigh).toBeGreaterThanOrEqual(0);
      expect(z.keyHigh).toBeLessThanOrEqual(127);
      expect(z.globalID).toBeGreaterThanOrEqual(1);
    }
    // Each zone must point at a distinct stroke — guards against a misparse that
    // yields the same globalID for every zone (which `>= 1` alone would pass).
    expect(new Set(zones.map((z) => z.globalID)).size).toBe(zones.length);
  });
});

// Exact codec-4 zone values, byte-for-byte against the .nsmpproj ground truth.
const other4 = join(process.cwd(), 'research/nsmp/Other.nsmp4');
describe.skipIf(!existsSync(other4))('readNsmpZones — codec-4 Other.nsmp4 (ground truth)', () => {
  const bytes = existsSync(other4) ? new Uint8Array(readFileSync(other4)) : new Uint8Array();

  it('reads root / split (top) / bottom / velocity / globalID exactly', () => {
    const zones = readNsmpZones(bytes);
    expect(zones.length).toBe(4);
    expect(zones.map((z) => z.rootKey)).toEqual([100, 91, 66, 65]);
    expect(zones.map((z) => z.keyHigh)).toEqual([108, 95, 83, 65]); // split points (topNote)
    expect(zones.map((z) => z.keyLow)).toEqual([96, 84, 66, 17]);
    expect(zones.map((z) => z.velTop)).toEqual([127, 127, 127, 127]);
    expect(zones.map((z) => z.globalID)).toEqual([22, 5, 7, 6]);
  });

  it('links each zone to a stroke by globalID (not position)', () => {
    const zones = readNsmpZones(bytes);
    const decoded = decodeNsmp(bytes);
    const byGid = new Map(decoded.map((s) => [s.globalID, s.index]));
    // globalIDs 22,5,7,6 map to stroke sections 0,3,1,2 — a non-positional order.
    expect(zones.map((z) => byGid.get(z.globalID))).toEqual([0, 3, 1, 2]);
    // every zone resolves to a real decoded stroke
    expect(zones.every((z) => byGid.has(z.globalID))).toBe(true);
  });
});

const tbm4 = '/Users/simonflore/Documents/TBM/VibesNoVibrato Mellotron_M300A 4.1.nsmp4';
describe.skipIf(!existsSync(tbm4))('global + per-note level/detune (read-only)', () => {
  const bytes = existsSync(tbm4) ? new Uint8Array(readFileSync(tbm4)) : new Uint8Array();

  it('flags a non-unity global level as not-default', () => {
    const g = readGlobalLevelDetune(bytes);
    expect(g).not.toBeNull();
    // probe showed global6B = 16 5e 7f 00 00 00 → level 0x165e7f, detune 0
    expect(g!.level).toBe(0x165e7f);
    expect(g!.detune).toBe(0);
    expect(g!.isDefault).toBe(false);
  });

  it('reports 0 custom per-note rows for the all-default corpus file', () => {
    expect(perNoteCustomCount(bytes)).toBe(0);
  });
});
