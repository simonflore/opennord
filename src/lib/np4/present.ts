/**
 * Nord Piano 4 → DecodedProgram. NP4 (NW1-v3) confirms a coarser piano core than
 * the NW1-v4 models: family (EP/Grand), level and velocity curve are pinned; the
 * full piano-type enum and FX are not. Confirmed via the George=Tea differential
 * and the Stage piano oracle.
 */
import { decodeNp4 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';

export function np4Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp4(bytes);
  const parts = [p.pianoFamily === 'EP' ? 'Electric Piano' : 'Grand/Acoustic'];
  if (p.velocityCurve !== 'Unknown') parts.push(`${p.velocityCurve} touch`);
  parts.push(`level ${p.pianoLevel}`);

  return {
    title: 'Nord Piano 4 · Program',
    header: [
      ['Version', `v${p.version}`],
      ['Model family', `${p.pianoModelFamily}`],
    ],
    sections: [{ id: 'A', label: 'PIANO', engines: [{ label: 'Piano', parts }] }],
    note: 'Piano 4: family (EP/Grand), level and velocity curve confirmed. Exact sound name and FX are firmware-gated / not yet decoded.',
  };
}
