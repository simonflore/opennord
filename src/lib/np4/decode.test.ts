import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp4 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.np4p'));

import { readdirSync } from 'fs';

describe('decodeNp4', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNp4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.00 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNp4(load(name)).version, name).toBe('1.00');
    }
  });

  it('exposes correctly-sized raw clusters', () => {
    const prog = decodeNp4(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(9);
    expect(prog._clusterB).toHaveLength(13);
    expect(prog._clusterC).toHaveLength(14);
  });
});
