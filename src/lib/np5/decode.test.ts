import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp5 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.np5p'));

describe('decodeNp5', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNp5(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.01 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNp5(load(name)).version, name).toBe('1.01');
    }
  });

  it('exposes correctly-sized raw clusters', () => {
    const prog = decodeNp5(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(3);
    expect(prog._clusterB).toHaveLength(15);
    expect(prog._clusterC).toHaveLength(9);
    expect(prog._clusterD).toHaveLength(9);
    expect(prog._clusterE).toHaveLength(14);
    expect(prog._clusterF).toHaveLength(14);
  });
});
