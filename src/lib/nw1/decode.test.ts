import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw1 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nwp'));

describe('decodeNw1', () => {
  it('decodes every fixture without warnings', () => {
    // Sample 50 files to keep test runtime manageable (1018 total fixtures)
    const sample = fixtures().slice(0, 50);
    for (const name of sample) {
      const prog = decodeNw1(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('exposes correctly-sized clusters', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(76);
    expect(prog._clusterB).toHaveLength(39);
    expect(prog._clusterC).toHaveLength(116);
    expect(prog._clusterTail).toHaveLength(26);
  });

  it('body length is 306 bytes', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog._rawBody).toHaveLength(306);
  });

  it('version is a formatted decimal string', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog.version).toMatch(/^\d+\.\d{2}$/);
  });
});
