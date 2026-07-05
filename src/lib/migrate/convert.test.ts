import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { migrateToNs4 } from './convert';
import { buildMigrationTemplateFromDisk } from './template-node';
import { parseNs4Program } from '../ns4/parse';
import { fileTypeTag, readCbinHeader } from '../clavia/cbin';

/** Donor template bytes, loaded off disk (browser passes its own via `?url`). */
const templateBytes = buildMigrationTemplateFromDisk();

/**
 * Synthetic donor buffers. The ns2/ns3 decoders read their body at fixed
 * offsets (src/lib/ns2/decode.test.ts / src/lib/ns3/decode.test.ts) from a
 * bare buffer; migrateToNs4 additionally needs a valid CBIN envelope so
 * identifyNordFile can route by the 4-char tag. So we wrap the same body-byte
 * pattern those decode tests use in a CBIN header (magic + tag + formatType 1
 * → direct offsets, matching the decode tests' `t1()` / NSM-era assumption).
 */
function cbin(tag: string, size = 700): Uint8Array {
  const b = new Uint8Array(size);
  b[0] = 0x43; b[1] = 0x42; b[2] = 0x49; b[3] = 0x4e; // 'CBIN'
  b[0x04] = 1; // formatType 1 → decoders use direct (versionOffset 0) body offsets
  for (let i = 0; i < 4; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x10] = 9; // category = Piano (arbitrary but real)
  return b;
}

/** A Stage 3 program: panel A, piano on + Grand, organ B3 with drawbars. */
function ns3Bytes(): Uint8Array {
  const b = cbin('ns3f');
  b[0x31] = 0; // panel A only
  b[0x43] = 0x80; // piano enable (b7)
  b[0x48] = 0x00; // piano type 0 → Grand
  b[0xbe] = 0x60; // drawbar 1 = 6 (organ)
  return b;
}

/** A Stage 2 program: slot A, piano on + Grand. */
function ns2Bytes(): Uint8Array {
  const b = cbin('ns2p');
  b[0x2e] = 0; // slot A only
  b[0x48] = 0x80; // piano enable (b7)
  b[0xcd] = 0x00; // piano type 0 → Grand
  return b;
}

const ns4Fixture = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);

describe('migrateToNs4', () => {
  it('converts an ns3 program end-to-end', async () => {
    const { bytes, report, suggestedFilename } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    expect(fileTypeTag(bytes)).toBe('ns4p');
    expect(parseNs4Program(bytes).parsed).toBe(true);
    expect(suggestedFilename).toBe('Boston.ns4p');
    expect(report.source).toBe('ns3');
    expect(report.globalNotes.length).toBeGreaterThan(0);
  });

  it('converts an ns2 program end-to-end', async () => {
    const { bytes, report, suggestedFilename } = await migrateToNs4(ns2Bytes(), { sourceName: 'My Patch', templateBytes });
    expect(fileTypeTag(bytes)).toBe('ns4p');
    expect(parseNs4Program(bytes).parsed).toBe(true);
    expect(suggestedFilename).toBe('My Patch.ns4p');
    expect(report.source).toBe('ns2');
  });

  it('carries the source category into the ns4 header', async () => {
    const { bytes } = await migrateToNs4(ns3Bytes(), { sourceName: 'Boston', templateBytes });
    // category 9 = Piano, set in the synthetic donor header
    expect(readCbinHeader(bytes).category).toBe(9);
  });

  it('falls back to a default filename when no source name is given', async () => {
    const { suggestedFilename } = await migrateToNs4(ns3Bytes(), { templateBytes });
    expect(suggestedFilename.endsWith('.ns4p')).toBe(true);
    expect(suggestedFilename.length).toBeGreaterThan('.ns4p'.length);
  });

  it('rejects non-ns2/ns3 input', async () => {
    await expect(migrateToNs4(ns4Fixture, { templateBytes })).rejects.toThrow(/Stage 2 and Stage 3/);
  });

  it('rejects a non-Nord buffer', async () => {
    await expect(migrateToNs4(new Uint8Array(100), { templateBytes })).rejects.toThrow(/Stage 2 and Stage 3/);
  });
});
