import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNla } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/lead-a1');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nlas'));

describe('decodeNla', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNla(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 0.07 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNla(load(name)).version, name).toBe('0.07');
    }
  });

  it('exposes correctly-sized clusters', () => {
    const prog = decodeNla(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(32);
    expect(prog._clusterB).toHaveLength(15);
    expect(prog._clusterC).toHaveLength(28);
  });
});
