import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { patchNs4Checksum } from '../clavia/checksum';
import { sealTrailerChecksum } from '../clavia/crc16';
import { nspChecksumKind, readNsp, readNspIdentity, readNspZones } from './nsp';
import { makeNpno, tone } from './nsp-synth.testing';
import { buildNpno } from './nsp-write';

/** Minimal synthetic Nord Piano: CBIN + npno + CNSP + a name in the meta block.
 *  Optionally lay down a key map (root per note) @0xB8 (CNSP+0x8C). */
function makeSyntheticNpno(name = 'Test Piano', versionRaw = 610, keymap?: number[]): Uint8Array {
  const buf = new Uint8Array(0x140);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('npno', 0x08);
  buf[0x14] = versionRaw & 0xff;
  buf[0x15] = (versionRaw >> 8) & 0xff;
  ascii('CNSP', 0x2c);
  ascii(name, 0x48); // name within the 0x42..0xA9 metadata block
  if (keymap) { for (let i = 0; i < 128; i++) buf[0xb8 + i] = keymap[i] ?? 0xff; } // CNSP+0x8C
  return patchNs4Checksum(buf);
}

describe('readNsp', () => {
  it('recognizes a Nord Piano file and reads name + version', () => {
    const f = readNsp(makeSyntheticNpno('Astoria Grand', 610));
    expect(f.recognized).toBe(true);
    expect(f.version).toBe('6.10');
    expect(f.codec).toBe(6);
    expect(f.checksumValid).toBe(true);
    expect(f.name).toBe('Astoria Grand');
  });

  it('splits the header name into name + recorded variant at "#"', () => {
    const f = readNsp(makeSyntheticNpno('Electric Grand 1#CP80     ', 530));
    expect(f.name).toBe('Electric Grand 1');
    expect(f.variant).toBe('CP80');
    // v6 files leave the variant empty: "Clavinet D6#" + padding
    const g = readNsp(makeSyntheticNpno('Clavinet D6#          ', 610));
    expect(g.name).toBe('Clavinet D6');
    expect(g.variant).toBeUndefined();
  });

  it('readNspIdentity reads name/variant/version without the checksum, undefined for non-pianos', () => {
    const bytes = makeSyntheticNpno('Wurlitzer 1#200A', 530);
    bytes[bytes.length - 1] ^= 0xff; // break the checksum — identity doesn't care
    expect(readNspIdentity(bytes)).toEqual({ name: 'Wurlitzer 1', variant: '200A', version: '5.30', versionRaw: 530 });
    expect(readNspIdentity(new Uint8Array(0x60))).toBeUndefined();
  });

  it('returns recognized:false for a non-piano (e.g. .nsmp) file', () => {
    const buf = new Uint8Array(0x60);
    for (let i = 0; i < 4; i++) buf[i] = 'CBIN'.charCodeAt(i);
    for (let i = 0; i < 4; i++) buf[8 + i] = 'nsmp'.charCodeAt(i);
    expect(readNsp(buf).recognized).toBe(false);
  });

  it('decodes the key map into sample count + per-sample key ranges', () => {
    // 3 samples: root 40 over notes 0–43, root 50 over 44–53, root 60 over 54–127.
    const km: number[] = [];
    for (let n = 0; n < 128; n++) km[n] = n <= 43 ? 40 : n <= 53 ? 50 : 60;
    const f = readNsp(makeSyntheticNpno('Tri', 610, km));
    expect(f.sampleCount).toBe(3);
    expect(f.zones).toEqual([
      { rootNote: 40, lowNote: 0, highNote: 43 },
      { rootNote: 50, lowNote: 44, highNote: 53 },
      { rootNote: 60, lowNote: 54, highNote: 127 },
    ]);
  });

  it('treats 0x00 / 0xFF keymap entries as unused', () => {
    const km = new Array(128).fill(0xff);
    for (let n = 60; n <= 72; n++) km[n] = 60;
    for (let n = 73; n <= 84; n++) km[n] = 72;
    const f = readNsp(makeSyntheticNpno('Two', 610, km));
    expect(f.sampleCount).toBe(2);
    expect(f.zones![0]).toEqual({ rootNote: 60, lowNote: 60, highNote: 72 });
  });
});

const synth = (cnsp: 0x18 | 0x2c) => makeNpno([{ pcm: [tone(3000, 0.02, 3000, 1)], velocityFrom: 0, before: [[0, 0, 0, 0]] }], 1, cnsp);

describe('readNsp — checksum presence comes from the CBIN header', () => {
  it('reads the format byte: 1 → CRC-32 (v6), 0 → CRC-16 trailer (v5)', () => {
    expect(nspChecksumKind(synth(0x2c))).toBe('crc32');
    expect(nspChecksumKind(synth(0x18))).toBe('crc16');
  });

  it('calls a v6 piano damaged when its CNSP tag is gone, instead of skipping the CRC', () => {
    const p = synth(0x2c);
    p[0x2c] = 0x58; // 'CNSP' → 'XNSP': the tag no longer says where the checksum is
    const f = readNsp(patchNs4Checksum(p)); // even with a CRC that matches the new bytes
    expect(nspChecksumKind(p)).toBeUndefined();
    expect(f).toMatchObject({ recognized: true, hasChecksum: true, checksumValid: false });
    expect(f.warnings[0]).toMatch(/inconsistent/);
  });

  it('calls a piano damaged when the format byte and the CNSP position disagree', () => {
    const v6 = synth(0x2c);
    v6[4] = 0; // says v5, but CNSP sits at 0x2C
    expect(readNsp(patchNs4Checksum(v6)).checksumValid).toBe(false);
    const v5 = synth(0x18);
    v5[4] = 1; // says v6, but CNSP sits at 0x18
    expect(readNsp(sealTrailerChecksum(v5)).checksumValid).toBe(false);
    const odd = synth(0x2c);
    odd[4] = 7; // no known format
    expect(readNsp(patchNs4Checksum(odd))).toMatchObject({ hasChecksum: false, checksumValid: false });
  });
});

describe('readNsp — one-zone pianos', () => {
  const oneZone = () => buildNpno({
    name: 'One Zone', channels: 1,
    zones: [{ rootNote: 60, lowNote: 21, highNote: 108, layers: [{ pcm: [Int32Array.from(tone(4000, 0.02, 3000, 1))], floorDb: 0 }] }],
  }).bytes;

  it('reads the single zone the test recipe builds, since the layers-per-root table agrees', () => {
    const f = readNsp(oneZone());
    expect(f.sampleCount).toBe(1);
    expect(f.zones).toEqual([{ rootNote: 56, lowNote: 21, highNote: 108 }]);
  });

  it("ignores a lone root the layers-per-root table doesn't back up", () => {
    const p = oneZone();
    const table = 0x2c + 0x622;
    p[table + 56 * 2 + 1] = 0; // no strokes at the key map's root…
    p[table + 57 * 2 + 1] = 1; // …but one at another note
    expect(readNspZones(p)).toEqual([]);
    // and a file too short to hold the table can't vouch for a single zone either
    expect(readNspZones(p.subarray(0, 0x2c + 0x622))).toEqual([]);
  });
});

// Real factory file (gitignored, IP — header read only). Skipped in CI.
const factory = join(process.cwd(), 'piano_library_436.nsmp');
describe.skipIf(!existsSync(factory))('readNsp — real Nord Piano library', () => {
  it('reads the header of a real .npno', () => {
    const f = readNsp(new Uint8Array(readFileSync(factory)));
    expect(f.recognized).toBe(true);
    expect(f.codec).toBe(6);
    expect(f.name && f.name.length).toBeGreaterThan(0);
  });
});

// Real .npno fixtures (gitignored, IP — header/keymap only, never audio). Skipped in CI.
const REAL: [string, number][] = [
  ['fixtures/piano-4/Clavinet D6 6.1.npno', 6],
  ['fixtures/Electric_Grand_1_CP80__5.3.npno', 5],
  ['fixtures/Wurlitzer_1__6.3.npno', 6],
];
for (const [rel, codec] of REAL) {
  describe.skipIf(!existsSync(join(process.cwd(), rel)))(`readNsp — ${rel.split('/').pop()}`, () => {
    it('reads name + a sane multisample key map', () => {
      const f = readNsp(new Uint8Array(readFileSync(join(process.cwd(), rel))));
      expect(f.recognized).toBe(true);
      expect(f.codec).toBe(codec);
      expect((f.name ?? '').length).toBeGreaterThan(0);
      expect(f.sampleCount).toBeGreaterThan(3);
      // zones ascend and stay in MIDI range
      const z = f.zones!;
      for (let i = 0; i < z.length; i++) {
        expect(z[i].rootNote).toBeLessThanOrEqual(127);
        expect(z[i].lowNote).toBeLessThanOrEqual(z[i].highNote);
        if (i > 0) expect(z[i].lowNote).toBeGreaterThan(z[i - 1].lowNote);
      }
    });
  });
}

// Real pianos kept outside the repo (NPNO_DIR, see nsp-audio.test.ts) — header only.
const npnoDir = process.env.NPNO_DIR;
const realNpno = npnoDir && existsSync(npnoDir) ? readdirSync(npnoDir).filter((f) => f.endsWith('.npno')) : [];
describe.skipIf(realNpno.length === 0)('readNspIdentity — real pianos in $NPNO_DIR', () => {
  for (const file of realNpno) {
    it(`names ${file} without a "#", with a version`, () => {
      const id = readNspIdentity(new Uint8Array(readFileSync(join(npnoDir!, file))))!;
      expect(id.name).toMatch(/^[^#]+$/);
      expect(id.version).toMatch(/^\d\.\d\d$/);
    });
  }
});
