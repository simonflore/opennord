/**
 * Nord Wave → DecodedProgram. The record layout comes from the Wave OS 2.14
 * parameter descriptors (see decode.ts); parameters are known by descriptor
 * index and control id only, so the card shows what is unambiguous to a
 * player — how many controls each slot morphs, and whether slot B repeats
 * slot A — until the Wave's controller chart names the rest.
 */
import { decodeNw1 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import type { Nw1Section } from './types';

export const NW1_NOTE =
  'Wave: layout from the instrument firmware (OS 2.14), alignment not yet checked on a real file. All parameters and morph amounts are read; they are named by MIDI CC until the Wave controller chart is mapped.';

const morphed = (s: Nw1Section) => Object.values(s.morphs).filter((d) => d.some((x) => x !== 0)).length;
const morphPart = (n: number) => (n === 0 ? 'none' : `${n} control${n === 1 ? '' : 's'}`);
const same = (a: Nw1Section, b: Nw1Section) =>
  a.params.every((v, i) => v === b.params[i]) &&
  Object.entries(a.morphs).every(([id, d]) => d.every((x, k) => x === b.morphs[Number(id)]?.[k]));

export function nw1Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNw1(bytes);
  const title = 'Nord Wave · Program';
  const header: [string, string][] = [['Version', `v${p.version}`]];
  if (!p.complete) {
    return {
      title, header, sections: [],
      note: 'Wave: this file is shorter than the program record the firmware writes, so only the file header is shown.',
      warnings: p.warnings,
    };
  }
  const slot = (id: string, label: string, s: Nw1Section, copy: boolean): DecodedSection => ({
    id, label,
    engines: [{ label: 'Morph', parts: [morphPart(morphed(s))] }],
    chips: copy ? ['Same as slot A'] : undefined,
  });
  return {
    title, header,
    sections: [
      slot('A', 'SLOT A', p.slot1, false),
      slot('B', 'SLOT B', p.slot2, same(p.slot1, p.slot2)),
    ],
    note: NW1_NOTE,
    warnings: p.warnings,
  };
}
