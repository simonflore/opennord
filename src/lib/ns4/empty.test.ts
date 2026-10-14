import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { emptyNs4Program, EMPTY_PROGRAM_FORMAT } from './empty';
import { parseNs4Program } from './parse';
import { NS4_LAYOUT } from './layout.generated';
import { editNs4Program, checkFieldWrites } from './writer';
import { decodeFwProgram } from '../clavia/block-chain';
import { writeFwProgram } from '../clavia/layout-write';
import { verifyNs4Checksum } from '../clavia/checksum';
import { readCbinHeader } from '../clavia/cbin';
import { programCategoryName } from '../clavia/categories';

const fixture = new Uint8Array(readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))));

describe('emptyNs4Program', () => {
  const empty = emptyNs4Program();

  it('is a sealed Stage 4 program the size of a real one', () => {
    expect(empty.length).toBe(fixture.length);
    expect(verifyNs4Checksum(empty)).toBe(true);
    const header = readCbinHeader(empty);
    expect(header.tag).toBe('ns4p');
    expect(header.versionRaw).toBe(EMPTY_PROGRAM_FORMAT);
    expect(programCategoryName(header.category)).toBe('None');
  });

  it('carries the same block framing as a real program', () => {
    const at = (b: Uint8Array, i: number) => b[44 + i];
    for (const blk of NS4_LAYOUT.blocks) expect(at(empty, blk.offset)).toBe(at(fixture, blk.offset));
    expect(empty.subarray(44, 48)).toEqual(fixture.subarray(44, 48)); // format 3.13
  });

  it('reads every firmware setting at its firmware default', () => {
    const fw = decodeFwProgram(empty, NS4_LAYOUT);
    expect(fw.layoutMatched).toBe(true);
    for (const f of NS4_LAYOUT.fields) expect(fw.values[f.key]).toBe(f.def);
  });

  it('parses as a program and takes edits like any other', () => {
    const program = parseNs4Program(empty);
    expect(program.parsed).toBe(true);
    expect(program.kind).toBe('program');
    expect(checkFieldWrites(empty)).toBeNull();
    const edited = editNs4Program(empty, [{ group: 'p', name: 'volume', layer: 0, value: 100 }]);
    expect(verifyNs4Checksum(edited)).toBe(true);
    // The firmware-layout writer accepts it too: its framing is the one OpenNord writes.
    expect(() => writeFwProgram(empty, NS4_LAYOUT, {})).not.toThrow();
  });

  it('is the same file every time', () => {
    expect(emptyNs4Program()).toEqual(empty);
  });
});
