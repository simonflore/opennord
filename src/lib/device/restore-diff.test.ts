import { describe, it, expect } from 'vitest';
import { diffPrograms, type ProgramSlot } from './restore-diff';

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
