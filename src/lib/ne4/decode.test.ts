import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe4 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ne4p'));

describe('decodeNe4', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNe4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.03 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNe4(load(name)).version, name).toBe('1.03');
    }
  });

  it('exposes correctly-sized clusters', () => {
    const prog = decodeNe4(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(6);
    expect(prog._clusterB).toHaveLength(9);
    expect(prog._clusterC).toHaveLength(13);
    expect(prog._tail).toHaveLength(4);
  });
});
