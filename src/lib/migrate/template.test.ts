import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildMigrationTemplate } from './template';
import { MIGRATION_DEFAULTS } from './defaults';
import { parseNs4Program } from '../ns4/parse';
import { getRawParam } from '../ns4/writer';
import { computeNs4Checksum } from '../clavia/checksum';

describe('buildMigrationTemplate', () => {
  const tpl = buildMigrationTemplate();

  it('produces a parseable, checksum-valid .ns4p', () => {
    const prog = parseNs4Program(tpl);
    expect(prog.parsed).toBe(true);
    // stored checksum at [24..28] LE must equal recomputed body checksum
    const stored =
      tpl[24] | (tpl[25] << 8) | (tpl[26] << 16) | ((tpl[27] << 24) >>> 0);
    expect(stored >>> 0).toBe(computeNs4Checksum(tpl) >>> 0);
  });

  it('applies every default (reads back the forced value)', () => {
    for (const d of MIGRATION_DEFAULTS) {
      expect(getRawParam(tpl, d.group, d.name, d.layer ?? 0)).toBe(d.value);
    }
  });

  it('is idempotent (memoized copy each call, equal bytes)', () => {
    const again = buildMigrationTemplate();
    expect(again).toEqual(tpl);
    expect(again).not.toBe(tpl); // caller gets a copy it may mutate
  });

  it('has all engines off by default', () => {
    expect(getRawParam(tpl, 'o', 'layer on/off', 0)).toBe(0);
    expect(getRawParam(tpl, 'p', 'layer on/off', 0)).toBe(0);
    expect(getRawParam(tpl, 'y', 'layer on/off', 0)).toBe(0);
  });

  it('injected-bytes path (browser UI) produces identical result', () => {
    const fixtureBytes = new Uint8Array(
      readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
    );
    const injected = buildMigrationTemplate(fixtureBytes);
    expect(injected).toEqual(tpl);
  });
});
