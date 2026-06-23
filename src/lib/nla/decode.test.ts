import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNla } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/lead-a1');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nlas'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNla', () => {
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

  it('exposes correctly-sized candidate sections', () => {
    const prog = decodeNla(load(fixtures()[0]));
    expect(prog._oscFilterSection).toHaveLength(31); // body[1-31]
    expect(prog._lfoArpSection).toHaveLength(15); // body[33-47]
    expect(prog._fxVoiceSection).toHaveLength(26); // body[51-76]
    expect(prog._rawBody).toHaveLength(79);
  });

  it('reads a constant-0 bitstream header nibble in every fixture', () => {
    for (const name of fixtures()) {
      expect(decodeNla(load(name)).headerNibble, name).toBe(0);
    }
  });

  it('reads a near-unique 16-bit checksum (50/51 distinct)', () => {
    const seen = new Set<number>();
    for (const name of fixtures()) {
      const prog = decodeNla(load(name));
      expect(prog.checksum, name).toBeGreaterThanOrEqual(0);
      expect(prog.checksum, name).toBeLessThanOrEqual(0xffff);
      seen.add(prog.checksum);
    }
    // High entropy: a checksum, not a parameter.
    expect(seen.size).toBeGreaterThanOrEqual(fixtures().length - 1);
  });
});
