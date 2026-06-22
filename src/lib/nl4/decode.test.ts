import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNl4 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/lead-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const nl4sFiles = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nl4s'));
const nl4pFiles = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nl4p'));

describe('decodeNl4 (nl4s — Sound)', () => {
  it('decodes every nl4s fixture without warnings', () => {
    for (const name of nl4sFiles()) {
      const prog = decodeNl4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('identifies nl4s fileType', () => {
    const prog = decodeNl4(load(nl4sFiles()[0]));
    expect(prog.fileType).toBe('nl4s');
  });

  it('exposes correctly-sized nl4s clusters', () => {
    const prog = decodeNl4(load(nl4sFiles()[0]));
    expect(prog._clusterA).toHaveLength(25);
    expect(prog._clusterB).toHaveLength(73);
    expect(prog._clusterC).toHaveLength(27);
  });
});

describe('decodeNl4 (nl4p — Program)', () => {
  it('decodes every nl4p fixture without warnings', () => {
    for (const name of nl4pFiles()) {
      const prog = decodeNl4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('identifies nl4p fileType', () => {
    const prog = decodeNl4(load(nl4pFiles()[0]));
    expect(prog.fileType).toBe('nl4p');
  });

  it('exposes four slot blocks', () => {
    const prog = decodeNl4(load(nl4pFiles()[0]));
    expect(prog._slot0).toHaveLength(77);
    expect(prog._slot1).toHaveLength(154);
    expect(prog._slot2).toHaveLength(146);
    expect(prog._slot3).toHaveLength(140);
  });
});
