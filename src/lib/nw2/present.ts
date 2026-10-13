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
import {
  fwHeader, fxGroupsSection, fxKnobs, fxParam, fxStored, fxSwitch, fxType, headerOnly, label, levelPart, morphCountPart, parts, transposeText,
} from '../clavia/fw-present';
import type { FxUnitView } from '../clavia/fx-view';
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
  const morphs = nw2SlotMorphs(p, s);
  const used = new Set([...morphs.values()].flat());
  engines.push({
    label: 'Morph',
    parts: [morphCountPart(morphs.size), ...NW2_MORPH_SOURCES.map((m) => m.source).filter((m) => used.has(m))],
  });
  return { id: s, label: `SLOT ${s}`, engines };
}

/** One slot's effect chain in panel order. Ranges are the registry's; unnamed settings show as stored. */
function slotFxUnits(p: Nw2Program, s: Nw2Slot): FxUnitView[] {
  const g = p.values;
  const v = (k: string) => (g as Record<string, number | undefined>)[`slot${s}${k}`];
  return [
    {
      key: `${s}-fx`, label: 'Effect', on: v('Fx.fxEnable') === 1, type: fxType(NW2_FX_TYPES, v('Fx.fxType')),
      params: fxKnobs(fxParam('Rate', v('Fx.fxRateClkDiv'), 0, 127), fxParam('Amount', v('Fx.fxAmt'), 0, 127)),
      switches: [fxSwitch('Mst Clk', v('Fx.fxClkEnable'))],
    },
    {
      key: `${s}-eq`, label: 'EQ', on: v('Eq.eqEnable') === 1,
      params: fxKnobs(
        fxParam('Drive', v('Eq.eqDrive'), 0, 127), fxParam('Bass', v('Eq.eqBass'), -60, 60), fxParam('Mid', v('Eq.eqMidGain'), -60, 60),
        fxParam('Mid Freq', v('Eq.eqMidFreq'), -60, 60), fxParam('Treble', v('Eq.eqTreble'), -60, 60),
      ),
    },
    {
      key: `${s}-dly`, label: 'Delay', on: v('Delay.dlyEnable') === 1,
      params: fxKnobs(
        fxParam('Rate', v('Delay.dlyRateClkDiv'), 0, 16383), fxParam('Mix', v('Delay.dlyMix'), 0, 127),
        fxParam('Feedback', v('Delay.dlyFbkAmt'), 0, 127),
        // The feedback filter (0–3) and feedback effect (0–3) are stored settings with no names yet.
        fxStored('Filter', v('Delay.dlyFbkFilt')), fxStored('FB FX', v('Delay.dlyFbkFx')),
      ),
      switches: [fxSwitch('Mst Clk', v('Delay.dlyClkEnable')), fxSwitch('Ping Pong', v('Delay.dlyFbkPingPong')), fxSwitch('Deep', v('Delay.dlyFbkDeep'))],
    },
    {
      key: `${s}-rvb`, label: 'Reverb', on: v('Reverb.rvbEnable') === 1, type: fxType(NW2_REVERB_TYPES, v('Reverb.rvbType')),
      params: fxKnobs(fxParam('Amount', v('Reverb.rvbAmt'), 0, 127), fxStored('Color', v('Reverb.rvbColor'))),
      switches: [fxSwitch('Modulate', v('Reverb.rvbModulate'))],
    },
  ];
}

export function nw2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNw2(bytes);
  const title = 'Nord Wave 2 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Wave 2');
  return {
    title,
    header: fwHeader(p, transposeText(p.values['common.transposeEnable'], p.values['common.transposeValue'])),
    sections: [
      ...NW2_SLOTS.map((s) => slotSection(p, s)),
      fxGroupsSection(NW2_SLOTS.filter((s) => nw2SlotEnabled(p, s) !== false)
        .map((s) => ({ key: `slot${s}`, label: `Slot ${s}`, units: slotFxUnits(p, s) }))),
    ],
    note: 'Wave 2: OpenNord’s program map (OS 1.24). Every setting is read, morphs included; the cards show slot on/off, level, sound source, filter, effects and morphs. Oscillator waveform names are not shown yet.',
    warnings: p.warnings,
  };
}
