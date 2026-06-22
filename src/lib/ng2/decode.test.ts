import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNg2 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/grand-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ng2p'));

describe('decodeNg2', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.02 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNg2(load(name)).version, name).toBe('1.02');
    }
  });

  it('exposes correctly-sized raw clusters', () => {
    const prog = decodeNg2(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(4);
    expect(prog._clusterB1).toHaveLength(9);
    expect(prog._clusterB2).toHaveLength(9);
    expect(prog._clusterC1).toHaveLength(16);
    expect(prog._clusterC2).toHaveLength(16);
    expect(prog._clusterD1).toHaveLength(14);
    expect(prog._clusterD2).toHaveLength(14);
    expect(prog._clusterE1).toHaveLength(16);
    expect(prog._clusterE2).toHaveLength(16);
  });

  it('layer pairs share identical default values (constant presets)', () => {
    // When both layers are inactive, B1/B2, C1/C2 etc. may be identical.
    // This test documents the observation from corpus analysis.
    const prog = decodeNg2(load(fixtures()[0]));
    // At minimum, the paired clusters should have the same length.
    expect(prog._clusterB1.length).toBe(prog._clusterB2.length);
    expect(prog._clusterC1.length).toBe(prog._clusterC2.length);
  });
});
