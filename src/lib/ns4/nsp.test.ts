import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { patchNs4Checksum } from '../clavia/checksum';
import { readNsp } from './nsp';

/** Minimal synthetic Nord Piano: CBIN + npno + CNSP + a name in the meta block.
 *  Optionally lay down a key map (root per note) @0xB7. */
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
  if (keymap) { for (let i = 0; i < 128; i++) buf[0xb7 + i] = keymap[i] ?? 0xff; }
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
