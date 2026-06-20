/**
 * Stage 2 presenter: maps {@link decodeNs2} (+ header) into the shared
 * {@link DecodedProgram} shape. v1 is engines + model/type; levels, drawbars, FX
 * and sample names land here as the decoder grows — reusing the same shape, so
 * DecodedProgramView renders them with no view changes.
 */
import { identifyNordFile } from '../clavia/nord-file';
import type { DecodedProgram, DecodedSection, DecodedEngine } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { decodeNs2, type Ns2Slot } from './decode';

function toSection(slot: Ns2Slot): DecodedSection {
  const engines: DecodedEngine[] = [];
  if (slot.organ.on) engines.push({ label: 'Organ', parts: [slot.organ.type, slot.organ.volume] });
  if (slot.piano.on) engines.push({ label: 'Piano', parts: [slot.piano.type, slot.piano.volume] });
  if (slot.synth.on) engines.push({ label: 'Synth', parts: [slot.synth.osc, slot.synth.volume] });
  // Drawbars are the 4-bit B3/Vox encoding; Farfisa's 1-bit form isn't read yet.
  const hasDrawbars = slot.organ.on && (slot.organ.type === 'B3' || slot.organ.type === 'Vox');
  const chips = slot.fx.map((f) => (f.type ? `${f.name}: ${f.type}` : f.name));
  return {
    id: slot.id,
    label: `SLOT ${slot.id}`,
    engines,
    drawbars: hasDrawbars ? drawbarViews(slot.organ.drawbars, slot.organ.type === 'B3' ? B3_FOOTAGE : undefined) : undefined,
    chips: chips.length ? chips : undefined,
  };
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
    note: 'Stage 2 decode (Tier 2): active slots, engines + model/type, levels and organ drawbars. FX and sample names to follow. Offsets from the community ns3-program-viewer (see docs).',
  };
}
