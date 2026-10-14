/**
 * Nord Piano (first generation) → DecodedProgram. Every value comes from the
 * Nord Piano OS 1.50 descriptors (see decode.ts): the piano type and the
 * effect rack with its settings. Where the record starts in the file is assumed, so the note
 * marks every decode as provisional.
 */
import { decodeNp1 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { fxKnobs, fxParam, fxSection, fxType, fwHeader, label, legacyHeaderOnly, parts } from '../clavia/fw-present';
import { NP1_PIANO_TYPES } from './labels';
import type { Np1FieldKey } from './layout.generated';

export const NP1_NOTE =
  'Nord Piano: OpenNord’s program map (OS 1.50). Where the settings start in the file is assumed, not yet confirmed on a real file — treat these values as provisional. The piano-type names are the ones the instrument shows.';

export function np1Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp1(bytes);
  const title = 'Nord Piano · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Nord Piano');
  const g = (k: Np1FieldKey) => p.values[k] ?? 0;

  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(label(NP1_PIANO_TYPES, g('piano.pianoType')) ?? 'Piano',
        g('piano.acoustics') ? 'Acoustics' : undefined, g('piano.pedalNoise') ? 'Pedal noise' : undefined),
    }],
  };
  // The rack in panel order. Knob fields are 0–127, shown as stored.
  // No name tables for the effect types on this model yet: they show as stored.
  const effects = fxSection([
    {
      key: 'fx1', label: 'Effect 1', on: g('effects.effects1On') === 1, type: fxType([], g('effects.effects1Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects1Rate'), 0, 127)),
    },
    {
      key: 'fx2', label: 'Effect 2', on: g('effects.effects2On') === 1, type: fxType([], g('effects.effects2Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects2Rate'), 0, 127)),
    },
    {
      key: 'amp', label: 'Amp/Comp', on: g('effects.ampCompOn') === 1, type: fxType([], g('effects.ampCompType')),
      params: fxKnobs(fxParam('Drive', g('effects.ampCompDrive'), 0, 127)),
    },
    {
      key: 'eq', label: 'EQ', on: g('effects.eqOn') === 1,
      params: fxKnobs(
        fxParam('Bass', g('effects.eqBass'), 0, 127), fxParam('Mid', g('effects.eqMid'), 0, 127),
        fxParam('Mid Freq', g('effects.eqMidFreq'), 0, 127), fxParam('Treble', g('effects.eqTreble'), 0, 127),
      ),
    },
    {
      key: 'rvb', label: 'Reverb', on: g('effects.reverbOn') === 1, type: fxType([], g('effects.reverbType')),
      params: fxKnobs(fxParam('Amount', g('effects.reverbDryWet'), 0, 127)),
    },
  ]);
  return { title, header: fwHeader(p), sections: [piano, effects], note: NP1_NOTE, warnings: p.warnings };
}
