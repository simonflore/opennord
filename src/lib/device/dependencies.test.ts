import { describe, it, expect } from 'vitest';
import { decodeDependencyReply, computeSampleUsage, normalizeSampleName, findUnusedPianos, type SampleDep } from './dependencies';
import type { ProgramEntry } from './transfer';
import { CQryFileIterate, CQryFileInfo, CQryFileGetDependency, PARTITION_PROGRAM } from './opcodes';

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

// ---------------------------------------------------------------------------
// findUnusedPianos integration — fake NordSession
// ---------------------------------------------------------------------------

/**
 * Build a fake NordSession that serves two partition sweeps:
 *   1. PARTITION_PROGRAM → one program, whose deps name one installed piano.
 *   2. PARTITION_PIANO   → two installed pianos.
 *
 * The referenced piano ends up in .used; the unreferenced one in .unused.
 *
 * We fake only the three calls `findUnusedPianos` actually issues:
 *   - session.begin / session.end → trivial stubs
 *   - session.request(CQryFileIterate, ...)  → one entry then terminal
 *   - session.request(CQryFileInfo, ...)     → the entry's metadata (name)
 *   - session.request(CQryFileGetDependency, ...) → dep list naming one piano
 */
function makeFakeSession(opts: {
  programName: string;
  depPianoName: string;
  installedPianoNames: string[];
}): object {
  const enc = new TextEncoder();

  /** Push a big-endian u32 into a number[] */
  const pu32 = (arr: number[], v: number) =>
    arr.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);

  /** Build a FileIterate reply (0x21): {code, bank, slot} — terminal (code=2) when slot=0xffffffff. */
  const makeIteratePayload = (code: number, bank: number, slot: number): Uint8Array => {
    const p: number[] = [];
    pu32(p, code); pu32(p, bank); pu32(p, slot);
    return new Uint8Array(p);
  };

  /** Build a minimal FileInfo reply (0x1F) for a named entry. */
  const makeInfoPayload = (name: string): Uint8Array => {
    // Layout (from decodeFileInfo): [12]=sizeBytes [16]=fourcc [20]=version [28]=categoryId [32]=nameLen [36..]=name
    const nameBytes = enc.encode(name);
    const p = new Uint8Array(36 + nameBytes.length);
    const view = new DataView(p.buffer);
    view.setUint32(12, 0, false);    // sizeBytes
    view.setUint32(16, 0, false);    // fourcc
    view.setUint32(20, 0, false);    // version
    view.setUint32(28, 0, false);    // categoryId
    view.setUint32(32, nameBytes.length, false); // nameLen
    p.set(nameBytes, 36);
    return p;
  };

  /** Build a dependency reply naming a single dependency. */
  const makeDepPayload = (depName: string): Uint8Array => {
    const p: number[] = [];
    pu32(p, 0);   // status
    pu32(p, 0);   // bank
    pu32(p, 0);   // slot
    pu32(p, 1);   // count = 1
    p.push(1);    // present = true
    pu32(p, 0); pu32(p, 0); pu32(p, 42); // id0, id1, id2
    const nameBytes = enc.encode(depName);
    pu32(p, nameBytes.length);
    p.push(...nameBytes);
    pu32(p, 0); pu32(p, 0); pu32(p, 0); // 3×u32 trailing
    return new Uint8Array(p);
  };

  // Track which partition is "open" so we serve the right iterate/info sequences.
  let currentPartition: number | null = null;
  // Iterate cursor per partition: 0=first-entry, 1=terminal
  const iterateCursors: Record<number, number> = {};

  const reply = (msgId: number, payload: Uint8Array, status = 0) =>
    ({ msgId, status, payload });

  return {
    begin(partition: number) {
      currentPartition = partition;
      iterateCursors[partition] = 0;
      return Promise.resolve(reply(0x05, new Uint8Array()));
    },
    end() {
      currentPartition = null;
      return Promise.resolve(reply(0x07, new Uint8Array()));
    },
    request(msgId: number, words: number[]) {
      // FileIterate (0x20 → reply 0x21)
      if (msgId === CQryFileIterate) {
        const partition = currentPartition!;
        const names =
          partition === PARTITION_PROGRAM
            ? [opts.programName]
            : opts.installedPianoNames;
        const cursor = iterateCursors[partition] ?? 0;
        if (cursor < names.length) {
          iterateCursors[partition] = cursor + 1;
          // code=0 means "file at (bank=0, slot=cursor)"
          return Promise.resolve(reply(CQryFileIterate | 1, makeIteratePayload(0, 0, cursor)));
        } else {
          // code=2 → terminal (no more entries)
          return Promise.resolve(reply(CQryFileIterate | 1, makeIteratePayload(2, 0, 0)));
        }
      }
      // FileInfo (0x1e → reply 0x1f)
      if (msgId === CQryFileInfo) {
        const partition = currentPartition!;
        const slot = words[1];
        const names =
          partition === PARTITION_PROGRAM
            ? [opts.programName]
            : opts.installedPianoNames;
        return Promise.resolve(reply(CQryFileInfo | 1, makeInfoPayload(names[slot] ?? '')));
      }
      // GetDependency (0x28 → reply 0x29)
      if (msgId === CQryFileGetDependency) {
        return Promise.resolve(reply(CQryFileGetDependency | 1, makeDepPayload(opts.depPianoName)));
      }
      return Promise.resolve(reply(msgId | 1, new Uint8Array()));
    },
  };
}

describe('findUnusedPianos', () => {
  it('puts unreferenced installed piano in .unused and referenced one in .used', async () => {
    const session = makeFakeSession({
      programName: 'My Program',
      depPianoName: 'Royal Grand 3D XL 6.1',
      installedPianoNames: ['Royal Grand 3D XL 6.1', 'White Grand XL 6.3'],
    });

    // Cast: the fake implements exactly what findUnusedPianos needs.
    const result = await findUnusedPianos(session as never);

    expect(result.used.map((p) => p.name)).toEqual(['Royal Grand 3D XL 6.1']);
    expect(result.unused.map((p) => p.name)).toEqual(['White Grand XL 6.3']);
  });

  it('lists all installed pianos as unused when no program references any', async () => {
    const session = makeFakeSession({
      programName: 'Empty Program',
      // The program dep names something not in the installed list
      depPianoName: 'Nonexistent Piano',
      installedPianoNames: ['Piano A', 'Piano B'],
    });

    const result = await findUnusedPianos(session as never);

    expect(result.unused.map((p) => p.name)).toEqual(['Piano A', 'Piano B']);
    expect(result.used).toHaveLength(0);
  });
});
