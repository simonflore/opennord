/**
 * Nord Piano (first generation) → DecodedProgram. Every value comes from the
 * Nord Piano OS 1.50 descriptors (see decode.ts): the piano type and which
 * effects are on. Where the record starts in the file is assumed, so the note
 * marks every decode as provisional.
 */
import { decodeNp1 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { COLDFIRE_PIANO_TYPES, effectsSection, fwHeader, label, legacyHeaderOnly, parts } from '../clavia/fw-present';
import type { Np1FieldKey } from './layout.generated';

export const NP1_NOTE =
  'Nord Piano: layout from the instrument firmware (OS 1.50). Where the settings start in the file is assumed, not yet confirmed on a real file — treat these values as provisional. The piano-type names are inferred.';

export function np1Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp1(bytes);
  const title = 'Nord Piano · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Nord Piano');
  const g = (k: Np1FieldKey) => p.values[k] ?? 0;

  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(label(COLDFIRE_PIANO_TYPES, g('piano.pianoType')) ?? 'Piano',
        g('piano.acoustics') ? 'Acoustics' : undefined, g('piano.pedalNoise') ? 'Pedal noise' : undefined),
    }],
  };
  const effects = effectsSection(parts(
    g('effects.effects1On') ? 'Effect 1' : undefined,
    g('effects.effects2On') ? 'Effect 2' : undefined,
    g('effects.ampCompOn') ? 'Amp/Comp' : undefined,
    g('effects.eqOn') ? 'EQ' : undefined,
    g('effects.reverbOn') ? 'Reverb' : undefined,
  ));
  return { title, header: fwHeader(p), sections: [piano, effects], note: NP1_NOTE, warnings: p.warnings };
}
