/**
 * Nord Lead A1 → DecodedProgram. The record layout comes from the Lead A1 OS
 * 1.36 parameter descriptors (see decode.ts); parameters are known by MIDI CC
 * only, so the card shows what is unambiguous to a player — how many controls
 * the sound morphs — until the A1 controller chart names the rest.
 */
import { decodeNla } from './decode';
import type { DecodedProgram } from '../clavia/decoded';

export function nlaDecoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNla(bytes);
  const morphed = Object.values(p.morphDeltas).filter((d) => d?.some((x) => x !== 0)).length;
  return {
    title: p.performance ? 'Nord Lead A1 · Performance' : 'Nord Lead A1 · Program',
    header: [['Version', `v${p.version}`]],
    sections: [{
      id: 'V', label: p.performance ? 'SLOT A' : 'SOUND',
      engines: [{ label: 'Morph', parts: [morphed === 0 ? 'none' : `${morphed} control${morphed === 1 ? '' : 's'}`] }],
    }],
    note: 'Lead A1: layout from the instrument firmware (OS 1.36). All parameters and morph amounts are read; they are named by MIDI CC until the A1 controller chart is mapped.',
    warnings: p.warnings,
  };
}
