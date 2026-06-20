import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { patchNs4Checksum } from '../clavia/checksum';
import { readNsp } from './nsp';

/** Minimal synthetic Nord Piano: CBIN + npno + CNSP + a name in the meta block. */
function makeSyntheticNpno(name = 'Test Piano', versionRaw = 610): Uint8Array {
  const buf = new Uint8Array(0x120);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('npno', 0x08);
  buf[0x14] = versionRaw & 0xff;
  buf[0x15] = (versionRaw >> 8) & 0xff;
  ascii('CNSP', 0x2c);
  ascii(name, 0x48); // name within the 0x42..0xA9 metadata block
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
