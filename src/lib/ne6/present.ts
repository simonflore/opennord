/**
 * Nord Electro 6 → DecodedProgram. Confirmed: the organ upper/lower drawbars
 * (B3 footage, corpus differential). The sample/piano section is identified; its
 * 32-bit sound id is surfaced as a fingerprint (no factory-name table exists for
 * the lite line — see the ne6-np4-sample-name-blocked note). FX not decoded.
 */
import { decodeNe6 } from './decode';
import { drawbarViews, B3_FOOTAGE } from '../clavia/drawbars';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';

const hexBytes = (b: Uint8Array) => '0x' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

function manual(id: string, label: string, bars: readonly number[]): DecodedSection {
  return {
    id, label,
    engines: [{ label: 'Drawbars', parts: [bars.join(' ')] }],
    drawbars: drawbarViews([...bars], B3_FOOTAGE),
  };
}

export function ne6Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNe6(bytes);
  return {
    title: 'Nord Electro 6 · Program',
    header: [
      ['Version', `v${p.version}`],
      ['Sample sound id', hexBytes(p.sample.modelId)],
    ],
    sections: [
      manual('OU', 'ORGAN UPPER', p.organ.upper.bars),
      manual('OL', 'ORGAN LOWER', p.organ.lower.bars),
    ],
    note: 'Electro 6: organ drawbars confirmed (B3 footage). Sample/piano section identified (sound id is a fingerprint, not yet name-resolved); FX/synth params not yet decoded.',
    warnings: p.warnings,
  };
}
