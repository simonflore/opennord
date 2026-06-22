import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw2 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nw2p'));

describe('decodeNw2', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 3.01 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNw2(load(name)).version, name).toBe('3.01');
    }
  });

  it('exposes four voice slots', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    expect(prog.slots).toHaveLength(4);
  });

  it('each slot has 8 drawbar values in range 0-8', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      for (const slot of prog.slots) {
        expect(slot.drawbars.bars, `${name} drawbar count`).toHaveLength(8);
        for (const bar of slot.drawbars.bars) {
          expect(bar, `${name} drawbar value`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} drawbar value`).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('slot raw bytes are the expected size', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    for (const slot of prog.slots) {
      expect(slot._raw).toHaveLength(244);
    }
  });
});
