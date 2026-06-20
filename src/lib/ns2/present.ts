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

function fxChip(f: { name: string; type?: string }): string {
  return f.type ? `${f.name}: ${f.type}` : f.name;
}

/** B3-only character chips: vibrato/chorus mode + percussion flags, when on. */
function organChips(slot: Ns2Slot): string[] {
  if (!slot.organ.on || slot.organ.type !== 'B3') return [];
  const chips: string[] = [];
  const { vibChorus, percussion } = slot.organ;
  if (vibChorus.on) chips.push(`Vib/Chorus: ${vibChorus.mode}`);
  if (percussion.on) {
    const f = [percussion.third && '3rd', percussion.fast && 'Fast', percussion.soft && 'Soft'].filter(Boolean);
    chips.push(`Percussion${f.length ? ` · ${f.join(' / ')}` : ''}`);
  }
  return chips;
}

function toSection(slot: Ns2Slot, globalChips: string[]): DecodedSection {
  const engines: DecodedEngine[] = [];
  if (slot.organ.on) engines.push({ label: 'Organ', parts: [slot.organ.type, slot.organ.volume] });
  if (slot.piano.on) engines.push({ label: 'Piano', parts: [slot.piano.type, slot.piano.volume], nameSlot: 0 });
  if (slot.synth.on) {
    engines.push({ label: 'Synth', parts: [slot.synth.osc, slot.synth.volume], nameSlot: slot.synth.osc === 'SAMPLE' ? 0 : undefined });
  }
  // Drawbars are the 4-bit B3/Vox encoding; Farfisa's 1-bit form isn't read yet.
  const hasDrawbars = slot.organ.on && (slot.organ.type === 'B3' || slot.organ.type === 'Vox');
  // B3 character chips (vib/chorus + percussion), then per-slot FX, then global FX.
  const chips = [...organChips(slot), ...slot.fx.map(fxChip), ...globalChips];
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
  const { slots, globalFx } = decodeNs2(bytes);
  const globalChips = globalFx.map(fxChip);

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  if (info.categoryName) header.push(['Category', info.categoryName]);

  // Lazy: NS2 reuses the same vendored sample catalog as NS3 (the nsmp library
  // family), resolved through the shared service via dynamic import.
  const enrich = async (): Promise<Record<string, string>> => {
    const { resolveSample } = await import('../ns3/library/service');
    const out: Record<string, string> = {};
    for (const s of slots) {
      if (s.piano.on) {
        const r = resolveSample(s.piano.sampleId, s.piano.clavVariation);
        if (r) out[`${s.id}-Piano`] = r.version ? `${r.name} ${r.version}` : r.name;
      }
      if (s.synth.on && s.synth.osc === 'SAMPLE') {
        const r = resolveSample(s.synth.sampleId, 0);
        if (r) out[`${s.id}-Synth`] = r.name;
      }
    }
    return out;
  };

  return {
    title: 'Stage 2 · Program',
    header,
    sections: slots.map((s) => toSection(s, globalChips)),
    note: 'Stage 2 decode (Tier 2): active slots, engines + model/type, levels, organ drawbars, FX and factory sample names. Offsets + library from the community ns3-program-viewer (see docs).',
    enrich,
  };
}
