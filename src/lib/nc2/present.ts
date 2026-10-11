/**
 * Nord C2D → DecodedProgram. Values come from the C2D OS 1.12 container list
 * (see decode.ts). The block names are inferred (medium–low) and which stored
 * drawbar set is the one sounding is not established, so the card stays with
 * what reads unambiguously: each manual's first stored B3 drawbar set, the
 * pedal drawbars and how many switches of each effect-switch set are on.
 * Firmware-derived: the alignment is not yet confirmed on a real file.
 */
import { decodeNc2 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { label, onOf, shortRecord } from '../clavia/fw-present';

/** common.param0, Organ Model (0–3): the same control (id 9) and order as the C2's (medium). */
export const NC2_ORGAN_MODELS = ['B3', 'Vox', 'Farfisa', 'Pipe'] as const;

export const NC2_NOTE =
  'C2D: layout from the instrument firmware (OS 1.12), not yet checked on a real file — treat these values as provisional. Every parameter is read; the first B3 drawbar set of each manual, the pedal drawbars and the effect switches are shown.';

function manual(id: string, title: string, bars: readonly number[]): DecodedSection {
  return {
    id, label: title,
    engines: [{ label: 'B3', parts: ['set 1', bars.join(' ')] }],
    drawbars: drawbarViews([...bars], B3_FOOTAGE),
  };
}

export function nc2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNc2(bytes);
  const title = 'Nord C2D · Program';
  const header: [string, string][] = [['Version', `v${p.version}`]];
  if (!p.complete) return shortRecord(title, header, 'C2D', p.warnings);
  const model = p.values['common.param0'];
  if (model !== undefined) header.push(['Organ model', label(NC2_ORGAN_MODELS, model) ?? `#${model}`]);
  const pedal: DecodedSection = {
    id: 'PD', label: 'PEDAL',
    engines: [{ label: 'Pedal', parts: [p.pedalDrawbars.join(' ')] }],
    drawbars: drawbarViews([...p.pedalDrawbars]),
  };
  const effects: DecodedSection = {
    id: 'FX', label: 'EFFECTS',
    engines: [{
      label: 'Switches',
      parts: p.effectSwitches.map((s, i) => `set ${i + 1}: ${onOf(s)} on`),
    }],
  };
  return {
    title, header,
    sections: [
      manual('M1', 'MANUAL 1', p.manuals[0].b3Drawbars[0]),
      manual('M2', 'MANUAL 2', p.manuals[1].b3Drawbars[0]),
      pedal,
      effects,
    ],
    note: NC2_NOTE,
    warnings: p.warnings,
  };
}
