/**
 * Stage 2 presenter: maps {@link decodeNs2} (+ header) into the shared
 * {@link DecodedProgram} shape. v1 is engines + model/type; levels, drawbars, FX
 * and sample names land here as the decoder grows — reusing the same shape, so
 * DecodedProgramView renders them with no view changes.
 */
import { identifyNordFile } from '../clavia/nord-file';
import type { DecodedProgram, DecodedEngine } from '../clavia/decoded';
import { decodeNs2, type Ns2Slot } from './decode';

function toSection(slot: Ns2Slot) {
  const engines: DecodedEngine[] = [];
  if (slot.organ.on) engines.push({ label: 'Organ', parts: [slot.organ.type, slot.organ.volume] });
  if (slot.piano.on) engines.push({ label: 'Piano', parts: [slot.piano.type, slot.piano.volume] });
  if (slot.synth.on) engines.push({ label: 'Synth', parts: [slot.synth.osc, slot.synth.volume] });
  return { id: slot.id, label: `SLOT ${slot.id}`, engines };
}

export function ns2Decoded(bytes: Uint8Array): DecodedProgram {
  const info = identifyNordFile(bytes);
  const { slots } = decodeNs2(bytes);

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  if (info.categoryName) header.push(['Category', info.categoryName]);

  return {
    title: 'Stage 2 · Program',
    header,
    sections: slots.map(toSection),
    note: 'Stage 2 decode (Tier 2): active slots and their engines + model/type. Levels, drawbars and FX to follow. Offsets from the community ns3-program-viewer (see docs).',
  };
}
