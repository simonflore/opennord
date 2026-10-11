/**
 * Nord Wave 2 → DecodedProgram. Every value comes from the Wave 2 OS 1.24
 * registry layout (see decode.ts): per slot its sound source (sample or
 * oscillator), level and on/off from MultiCommon, the filter type and the
 * effects that are on, labelled with the instrument's own display texts
 * (labels.ts), and how many controls each slot morphs and from which sources
 * (Impulse, Wheel, Pedal, After Touch, Velocity), as the Wave and Lead A1 cards
 * show it.
 */
import { decodeNw2, NW2_MORPH_SOURCES, NW2_SLOTS, nw2SlotEnabled, nw2SlotMorphs, nw2SlotSource } from './decode';
import type { Nw2Program, Nw2Slot } from './types';
import type { DecodedEngine, DecodedProgram, DecodedSection } from '../clavia/decoded';
import { fwHeader, headerOnly, label, levelPart, morphCountPart, noneOn, parts, transposeText } from '../clavia/fw-present';
import { NW2_FILTER_TYPES, NW2_FX_TYPES, NW2_REVERB_TYPES } from './labels';

function slotSection(p: Nw2Program, s: Nw2Slot): DecodedSection {
  const g = p.values;
  const source = nw2SlotSource(p, s);
  const engines: DecodedEngine[] = [{
    label: 'Voice',
    parts: parts(source?.kind === 'sample' ? 'Sample' : 'Oscillator', levelPart(g[`common.slotLevel${s}`]),
      nw2SlotEnabled(p, s) === false && '(off)'),
  }];
  if (g[`slot${s}Filter.fltEnable`]) {
    engines.push({ label: 'Filter', parts: [label(NW2_FILTER_TYPES, g[`slot${s}Filter.fltType`]) ?? 'Filter'] });
  }
  engines.push({
    label: 'Effects',
    parts: noneOn(parts(
      g[`slot${s}Fx.fxEnable`] ? label(NW2_FX_TYPES, g[`slot${s}Fx.fxType`]) ?? 'Effect' : undefined,
      g[`slot${s}Eq.eqEnable`] ? 'EQ' : undefined,
      g[`slot${s}Delay.dlyEnable`] ? 'Delay' : undefined,
      g[`slot${s}Reverb.rvbEnable`] ? label(NW2_REVERB_TYPES, g[`slot${s}Reverb.rvbType`]) ?? 'Reverb' : undefined,
    )),
  });
  const morphs = nw2SlotMorphs(p, s);
  const used = new Set([...morphs.values()].flat());
  engines.push({
    label: 'Morph',
    parts: [morphCountPart(morphs.size), ...NW2_MORPH_SOURCES.map((m) => m.source).filter((m) => used.has(m))],
  });
  return { id: s, label: `SLOT ${s}`, engines };
}

export function nw2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNw2(bytes);
  const title = 'Nord Wave 2 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Wave 2');
  return {
    title,
    header: fwHeader(p, transposeText(p.values['common.transposeEnable'], p.values['common.transposeValue'])),
    sections: NW2_SLOTS.map((s) => slotSection(p, s)),
    note: 'Wave 2: layout from the instrument firmware (OS 1.24). Every setting is read, morphs included; the cards show slot on/off, level, sound source, filter, effects and morphs. Oscillator waveform names are not shown yet.',
    warnings: p.warnings,
  };
}
