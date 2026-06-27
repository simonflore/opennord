import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readCbinHeader } from '../clavia/cbin';
import { diffPrograms, listBackupProgramSlots, type ProgramSlot } from './restore-diff';

const p = (bank: number, slot: number, name: string): ProgramSlot => ({ bank, slot, name });

describe('diffPrograms', () => {
  it('counts a slot whose program name differs as changed', () => {
    const d = diffPrograms([p(0, 0, 'Old Lead')], [p(0, 0, 'New Lead')]);
    expect(d).toEqual({ changed: 1, added: 0, unchanged: 0, untouched: 0 });
  });

  it('counts the same name at a slot as unchanged', () => {
    const d = diffPrograms([p(0, 0, 'Lead')], [p(0, 0, 'Lead')]);
    expect(d).toEqual({ changed: 0, added: 0, unchanged: 1, untouched: 0 });
  });

  it('counts a backup program landing on an empty device slot as added', () => {
    const d = diffPrograms([], [p(1, 3, 'Pad')]);
    expect(d).toEqual({ changed: 0, added: 1, unchanged: 0, untouched: 0 });
  });

  it('counts a device program the backup does not write as untouched', () => {
    const d = diffPrograms([p(2, 5, 'Bass')], []);
    expect(d).toEqual({ changed: 0, added: 0, unchanged: 0, untouched: 1 });
  });

  it('tallies a mixed layout', () => {
    const device = [p(0, 0, 'A'), p(0, 1, 'B'), p(0, 2, 'KeepMe')];
    const backup = [p(0, 0, 'A'), p(0, 1, 'B2'), p(0, 9, 'New')];
    // 0:0 same → unchanged; 0:1 differs → changed; 0:9 empty → added; 0:2 not written → untouched
    expect(diffPrograms(device, backup)).toEqual({ changed: 1, added: 1, unchanged: 1, untouched: 1 });
  });

  it('handles both sides empty', () => {
    expect(diffPrograms([], [])).toEqual({ changed: 0, added: 0, unchanged: 0, untouched: 0 });
  });
});

const fixture = (name: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`../ns4/__fixtures__/${name}`, import.meta.url))));

describe('listBackupProgramSlots', () => {
  it("reads each program file's {bank, slot} from its CBIN header + name from the path", async () => {
    const prog = fixture('BreakFreeSolo.ns4p');
    const h = readCbinHeader(prog); // ground truth: where this program actually lives
    const blob = new Blob([zipSync({
      'meta.xml': strToU8('<?xml version="1.0"?><backup product_id="46"/>'),
      'Program/Bank A/My Lead.ns4p': prog,
      'Samp Lib/Factory/Bell.nsmp4': new Uint8Array(8), // must be ignored (not a program)
    }).buffer as ArrayBuffer]);
    const slots = await listBackupProgramSlots(blob, 'TBM.ns4b');
    expect(slots).toEqual([{ bank: h.bank, slot: h.location, name: 'My Lead' }]);
  });
});
