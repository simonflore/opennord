/**
 * Nord C2 → DecodedProgram. Values come from the C2 OS 2.00 containers (see
 * decode.ts). For the selected organ model each manual shows the drawbar set
 * or preset it plays — B3 drawbars with footage, Vox drawbar levels, the
 * Farfisa tabs or pipe stops that are on — then the B3 bass drawbars and the
 * selected organ's effect switches. Block names and the organ-model order are
 * inferred (medium) and the file alignment is not yet confirmed, so the note
 * marks the values provisional.
 */
import { decodeNc } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { fwHeader, label, legacyHeaderOnly, parts } from '../clavia/fw-present';
import type { NcpFieldKey } from './layout.generated';

export const NC_NOTE =
  'C2: OpenNord’s program map (OS 2.00), not yet checked on a real file — treat these values as provisional. The organ-model order is inferred; every parameter is read.';

/** common.organModel (0–3) — order inferred (medium). */
export const NC_ORGAN_MODELS = ['B3', 'Vox', 'Farfisa', 'Pipe'] as const;

const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

type Get = (key: string) => number;

function manual(g: Get, model: number, m: 'Upper' | 'Lower'): DecodedSection {
  const id = m === 'Upper' ? 'MU' : 'ML';
  const section: DecodedSection = {
    id, label: m === 'Upper' ? 'UPPER MANUAL' : 'LOWER MANUAL',
    engines: [{ label: 'Organ', parts: [label(NC_ORGAN_MODELS, model) ?? 'Organ'] }],
  };
  const on = (prefix: string, field: string, name: string) =>
    NINE.flatMap((i) => (g(`${prefix}.${field}${i}`) ? [`${name} ${i}`] : []));
  if (model === 0) {
    const set = g(`b3${m}.drawbarSet`) + 1;
    section.engines[0].parts.push(`drawbar set ${set}`);
    section.drawbars = drawbarViews(NINE.map((i) => g(`b3${m}Drawbar${set}.drawbar${i}`)), B3_FOOTAGE);
    const perc = m === 'Upper' ? [0, 1, 2, 3].filter((i) => g(`b3Perc${set}.param${i}`)).length : 0;
    section.chips = parts(g(`b3${m}.vibratoOn`) ? 'Vibrato/Chorus' : undefined, perc ? `Percussion (${perc} switch${perc > 1 ? 'es' : ''})` : undefined);
  } else if (model === 1) {
    const preset = g(`vox${m}.presetSelect`) + 1;
    section.engines[0].parts.push(`preset ${preset}`);
    section.drawbars = drawbarViews(NINE.map((i) => g(`vox${m}Preset${preset}.drawbar${i}`)));
  } else if (model === 2) {
    const preset = g(`farf${m}.presetSelect`) + 1;
    section.engines[0].parts.push(`preset ${preset}`);
    const tabs = on(`farf${m}Preset${preset}`, 'tab', 'tab');
    section.engines.push({ label: 'Tabs', parts: tabs.length ? tabs : ['none'] });
  } else if (model === 3) {
    const preset = g('pipeCommon.presetSelect') + 1;
    section.engines[0].parts.push(`preset ${preset}`);
    const stops = on(`pipe${m}Preset${preset}`, 'stop', 'stop');
    section.engines.push({ label: 'Stops', parts: stops.length ? stops : ['none'] });
  }
  return section;
}

export function ncDecoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNc(bytes);
  const title = 'Nord C2 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'C2');
  const g: Get = (key) => p.values[key as NcpFieldKey] ?? 0;
  const model = g('common.organModel');

  const bass: DecodedSection = {
    id: 'BS', label: 'BASS',
    engines: [{ label: 'B3 Bass', parts: [`16′ ${g('b3Bass.drawbar1')} · 8′ ${g('b3Bass.drawbar2')}`] }],
    drawbars: drawbarViews([g('b3Bass.drawbar1'), g('b3Bass.drawbar2')], ['16′', '8′']),
  };
  const fx = ['effectsB3', 'effectsVox', 'effectsFarf', 'effectsPipe'][model] ?? 'effectsB3';
  const switches = [0, 1, 2, 3].filter((i) => g(`${fx}.param${i}`)).length;
  const effects: DecodedSection = {
    id: 'FX', label: 'EFFECTS',
    engines: [{ label: 'Switches', parts: [`${switches} of 4 on`] }],
  };
  return {
    title, header: fwHeader(p),
    sections: [manual(g, model, 'Upper'), manual(g, model, 'Lower'), bass, effects],
    note: NC_NOTE,
    warnings: p.warnings,
  };
}
