import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildMigrationTemplate } from './template';
import { buildMigrationTemplateFromDisk } from './template-node';
import { MIGRATION_DEFAULTS } from './defaults';
import { parseNs4Program } from '../ns4/parse';
import { getRawParam } from '../ns4/writer';
import { computeNs4Checksum } from '../clavia/checksum';

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);

describe('buildMigrationTemplate (pure, injected bytes — the browser path)', () => {
  const tpl = buildMigrationTemplate(fixtureBytes);

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

  it('has all engines off by default', () => {
    expect(getRawParam(tpl, 'o', 'layer on/off', 0)).toBe(0);
    expect(getRawParam(tpl, 'p', 'layer on/off', 0)).toBe(0);
    expect(getRawParam(tpl, 'y', 'layer on/off', 0)).toBe(0);
  });

  it('is deterministic (same input bytes → same output bytes)', () => {
    const again = buildMigrationTemplate(fixtureBytes);
    expect(again).toEqual(tpl);
  });
});

describe('buildMigrationTemplateFromDisk (Node/test helper)', () => {
  it('matches the pure path fed the same on-disk fixture', () => {
    const fromDisk = buildMigrationTemplateFromDisk();
    const injected = buildMigrationTemplate(fixtureBytes);
    expect(fromDisk).toEqual(injected);
  });

  it('is idempotent (memoized copy each call, equal bytes, distinct arrays)', () => {
    const a = buildMigrationTemplateFromDisk();
    const b = buildMigrationTemplateFromDisk();
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // caller gets a copy it may mutate
  });
});
