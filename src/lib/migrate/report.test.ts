/**
 * End-to-end honesty-contract guard for the migration report.
 *
 * Runs one representative Stage 3 program through the full `migrateToNs4`
 * pipeline (identify → lift → emit → apply) and pins the grouped report so a
 * later emitter refactor that silently drops a note — or leaks engineer
 * vocabulary into a user-visible string — fails here.
 *
 * Guards specifically:
 *  - Critical 1: a piano/sample re-pick note is always present when the engine
 *    is on but no match was made.
 *  - No user-visible string carries protocol/engineer jargon (mod1/mod2/ampsim/
 *    raw/param/byte/opcode).
 *  - globalNotes is non-empty (the unmapped-bytes disclaimer always shows).
 *  - The full note field+status set is asserted, so a dropped note is caught.
 */
import { describe, expect, it } from 'vitest';
import { migrateToNs4 } from './convert';
import { buildMigrationTemplateFromDisk } from './template-node';

const templateBytes = buildMigrationTemplateFromDisk();

/** Same synthetic-donor helpers as convert.test.ts (a CBIN envelope + body offsets). */
function cbin(tag: string, size = 700): Uint8Array {
  const b = new Uint8Array(size);
  b[0] = 0x43; b[1] = 0x42; b[2] = 0x49; b[3] = 0x4e; // 'CBIN'
  b[0x04] = 1; // formatType 1 → direct body offsets
  for (let i = 0; i < 4; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x10] = 9; // category = Piano
  return b;
}

/** Stage 3: panel A, piano on + Grand, organ B3 with a drawbar. */
function ns3Bytes(): Uint8Array {
  const b = cbin('ns3f');
  b[0x31] = 0; // panel A only
  b[0x43] = 0x80; // piano enable (b7)
  b[0x48] = 0x00; // piano type 0 → Grand
  b[0xbe] = 0x60; // drawbar 1 = 6 (organ)
  return b;
}

const JARGON = /\b(mod1|mod2|ampsim|raw|param|byte|opcode)\b/i;

describe('migration report honesty contract (ns3 end-to-end)', () => {
  it('always emits a piano re-pick note (Critical 1 regression guard)', async () => {
    const { report } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    const pianoNote = report.notes.find((n) => n.field === 'Piano sound');
    expect(pianoNote, 'a "Piano sound" re-pick note must be present').toBeDefined();
    expect(pianoNote?.status).toBe('defaulted');
    expect(pianoNote?.note).toMatch(/pick .* on your Stage 4/i);
  });

  it('surfaces no engineer/protocol vocabulary in any user-visible string', async () => {
    const { report } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    for (const n of report.notes) {
      expect(n.field, `field: ${n.field}`).not.toMatch(JARGON);
      expect(n.note, `note: ${n.note}`).not.toMatch(JARGON);
    }
    for (const g of report.globalNotes) {
      expect(g, `globalNote: ${g}`).not.toMatch(JARGON);
    }
  });

  it('always includes at least one global caveat', async () => {
    const { report } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    expect(report.globalNotes.length).toBeGreaterThan(0);
  });

  it('pins the note field+status set so a dropped note fails the test', async () => {
    const { report } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    // Sorted (field,status) pairs — a stable, order-independent snapshot of the
    // report's shape. A silently-dropped emitter note changes this set.
    const shape = report.notes
      .map((n) => `${n.field} :: ${n.status}`)
      .sort();
    expect(shape).toMatchInlineSnapshot(`
      [
        "Morphs :: not-migratable",
        "Organ :: mapped",
        "Piano octave shift :: approximated",
        "Piano sound :: defaulted",
        "Piano type :: mapped",
        "Synth :: mapped",
      ]
    `);
  });
});
