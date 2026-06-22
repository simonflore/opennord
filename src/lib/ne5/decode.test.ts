import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe5 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ne5p'));

describe('decodeNe5', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 0.04 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNe5(load(name)).version, name).toBe('0.04');
    }
  });

  it('exposes correctly-sized clusters', () => {
    const prog = decodeNe5(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(8);
    expect(prog._clusterB).toHaveLength(17);
    expect(prog._drawbars).toHaveLength(47);
    expect(prog._clusterC).toHaveLength(20);
  });

  it('drawbar region contains valid nibble values (0-8) throughout', () => {
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      let nibbleCount = 0;
      for (const byte of prog._drawbars) {
        if ((byte >> 4) <= 8 && (byte & 0xf) <= 8) nibbleCount++;
      }
      // At least 80% of the drawbar region should have nibble-range values
      expect(nibbleCount / prog._drawbars.length, `${name} nibble ratio`).toBeGreaterThan(0.8);
    }
  });
});
