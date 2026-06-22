import { describe, it, expect } from 'vitest';
import { decodeDependencyReply, computeSampleUsage, normalizeSampleName, type SampleDep } from './dependencies';
import type { ProgramEntry } from './transfer';

/** Build a synthetic CRpyFileGetDependency (0x29) payload (status word at offset 0). */
function makeDepPayload(bank: number, slot: number, entries: Array<{ present: boolean; id: number; name: string }>): Uint8Array {
  const enc = new TextEncoder();
  const parts: number[] = [];
  const pushU32 = (v: number) => parts.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); // BE
  pushU32(0);        // status
  pushU32(bank);
  pushU32(slot);
  pushU32(entries.length); // count
  for (const e of entries) {
    parts.push(e.present ? 1 : 0); // u8 present
    pushU32(0);        // id0
    pushU32(0);        // id1
    pushU32(e.id);     // id2 (the unique id)
    const name = enc.encode(e.name);
    pushU32(name.length);
    parts.push(...name);
    pushU32(0); pushU32(0); pushU32(0); // 3×u32 trailing (version ≥ 9)
  }
  return new Uint8Array(parts);
}

describe('decodeDependencyReply', () => {
  it('decodes bank/slot and each entry (present, id, name)', () => {
    const payload = makeDepPayload(0, 4, [
      { present: true, id: 0x11223344, name: 'Royal Grand 3D XL 6.1' },
      { present: false, id: 0x55667788, name: 'White Grand XL 6.3' },
    ]);
    const r = decodeDependencyReply(payload);
    expect(r.bank).toBe(0);
    expect(r.slot).toBe(4);
    expect(r.deps).toEqual([
      { present: true, id: 0x11223344, name: 'Royal Grand 3D XL 6.1' },
      { present: false, id: 0x55667788, name: 'White Grand XL 6.3' },
    ]);
  });

  it('handles an empty dependency list', () => {
    expect(decodeDependencyReply(makeDepPayload(1, 2, [])).deps).toEqual([]);
  });

  it('stops early on a truncated entry instead of throwing', () => {
    const full = makeDepPayload(0, 0, [{ present: true, id: 1, name: 'Half' }]);
    // Cut into the name region: head + nameLen say 4 chars, but the bytes aren't there.
    const r = decodeDependencyReply(full.subarray(0, 16 + 17 + 1)); // header + entry head + 1 name byte
    expect(r.deps.length).toBe(0); // name can't be fully read → entry skipped, no throw
  });
});

/** Minimal ProgramEntry for tests (computeSampleUsage only reads name/slot). */
const pe = (bank: number, slot: number, name: string): ProgramEntry =>
  ({ bank, slot, name, categoryId: 0, version: 0, sizeBytes: 0, fourcc: 'nsmp' });

describe('computeSampleUsage', () => {
  const installed: ProgramEntry[] = [
    pe(0, 0, 'Royal Grand 3D XL 6.1'),
    pe(0, 1, 'Mark I EP'),
    pe(0, 2, 'Unused Strings 4.0'),
  ];
  const deps: SampleDep[] = [
    { present: true, id: 1, name: 'Royal Grand 3D XL 6.1' }, // used + installed
    { present: true, id: 2, name: 'mark i ep' },             // used (name match is case/space-insensitive)
    { present: false, id: 3, name: 'White Grand XL 6.3' },   // referenced but NOT installed → missing
  ];

  it('splits installed samples into used vs unused', () => {
    const u = computeSampleUsage(deps, installed);
    expect(u.used.map((s) => s.slot)).toEqual([0, 1]);
    expect(u.unused.map((s) => s.name)).toEqual(['Unused Strings 4.0']);
  });

  it('reports referenced-but-absent samples as missing (deduped)', () => {
    const u = computeSampleUsage([...deps, { present: false, id: 3, name: 'White Grand XL 6.3' }], installed);
    expect(u.missing.map((d) => d.name)).toEqual(['White Grand XL 6.3']);
  });

  it('an all-unused board lists every installed sample', () => {
    expect(computeSampleUsage([], installed).unused).toHaveLength(3);
  });
});

describe('normalizeSampleName', () => {
  it('trims, collapses whitespace, lowercases', () => {
    expect(normalizeSampleName('  Royal   Grand  3D ')).toBe('royal grand 3d');
  });
});
