/**
 * Nord Electro 5 → DecodedProgram. Confirmed: organ drawbars (primary upper/lower
 * + pedal, B3 footage). The sample section is identified (active flag). FX and the
 * organ model enum are not decoded (the corpus has no organ presets to pin the model).
 */
import { decodeNe5 } from './decode';
import { drawbarViews, B3_FOOTAGE } from '../clavia/drawbars';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';

function manual(id: string, label: string, bars: readonly number[]): DecodedSection {
  return {
    id, label,
    engines: [{ label: 'Drawbars', parts: [bars.join(' ')] }],
    drawbars: drawbarViews([...bars], B3_FOOTAGE),
  };
}

export function ne5Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNe5(bytes);
  const sections = [
    manual('OU', 'ORGAN UPPER', p.organ.preset1Upper.bars),
    manual('OL', 'ORGAN LOWER', p.organ.preset1Lower.bars),
    manual('OP', 'ORGAN PEDAL', p.organ.pedal.bars),
  ];
  return {
    title: 'Nord Electro 5 · Program',
    header: [
      ['Version', `v${p.version}`],
      ['Sample section', p.sampleSectionActive ? 'active' : 'off'],
    ],
    sections,
    note: 'Electro 5: organ drawbars confirmed (upper/lower/pedal, B3 footage). Sample section identified; FX and organ model enum not yet decoded.',
    warnings: p.warnings,
  };
}
