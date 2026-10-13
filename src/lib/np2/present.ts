/**
 * Nord Piano 2 → DecodedProgram. Every value comes from the Piano 2 OS 1.22
 * descriptors (see decode.ts): the piano and synth sections with their on/off
 * switches and levels, the keyboard settings and the effect rack with its settings, named
 * with the instrument's own display texts (labels.ts); sound references are
 * shown as fingerprints.
 */
import { decodeNp2 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';
import {
  coldfirePianoSection, fxKnobs, fxParam, fxSection, fxStored, fxType, fwHeader, label, legacyHeaderOnly,
  sampleSynthSection, soundRefRows,
} from '../clavia/fw-present';
import {
  NP2_AMP_TYPES, NP2_EFFECT1_TYPES, NP2_EFFECT2_TYPES, NP2_KEYBOARD_TOUCH, NP2_PIANO_TYPES,
  NP2_REVERB_TYPES, NP2_SUSTAIN_PEDAL_MODES,
} from './labels';
import type { Np2FieldKey } from './layout.generated';

export const NP2_NOTE =
  'Piano 2: OpenNord’s program map (OS 1.22), not yet checked on a real file. Piano, synth, keyboard settings and effects decoded, named as the instrument shows them; sound names are fingerprints.';

export function np2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp2(bytes);
  const title = 'Nord Piano 2 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Piano 2');
  const g = (k: Np2FieldKey) => p.values[k] ?? 0;

  const header = [...fwHeader(p), ...soundRefRows(g('common.keybSplit'),
    [g('piano.pianoIdA'), g('piano.pianoIdB')], [g('synth.sampleIdA'), g('synth.sampleIdB')])];
  const piano = coldfirePianoSection(NP2_PIANO_TYPES, g('piano.pianoType'), g('piano.pianoModel'), g('piano.pianoLevel'), g('piano.pianoOn'));
  const synth = sampleSynthSection('SYNTH', {
    sample: g('synth.sampleSelect'), attack: g('synth.attack'), dcyRel: g('synth.dcyRel'),
    level: g('synth.synthLevel'), on: g('synth.synthOn'),
  });
  // The rack in panel order. Knob fields are 0–127 (delay feedback 0–3), shown as stored.
  // The source values (0–1) have no names in this model's tables, so they show as stored too.
  const effects = fxSection([
    {
      key: 'fx1', label: 'Effect 1', on: g('effects.effects1On') === 1, type: fxType(NP2_EFFECT1_TYPES, g('effects.effects1Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects1Rate'), 0, 127), fxStored('Source', g('effects.effects1Source'))),
    },
    {
      key: 'fx2', label: 'Effect 2', on: g('effects.effects2On') === 1, type: fxType(NP2_EFFECT2_TYPES, g('effects.effects2Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects2Rate'), 0, 127), fxStored('Source', g('effects.effects2Source'))),
    },
    {
      key: 'dly', label: 'Delay', on: g('effects.delayOn') === 1,
      params: fxKnobs(
        fxParam('Tempo', g('effects.delayTempo'), 0, 127), fxParam('Mix', g('effects.delayDryWet'), 0, 127),
        fxParam('Feedback', g('effects.delayFeedback'), 0, 3), fxStored('Source', g('effects.delaySource')),
      ),
    },
    {
      key: 'amp', label: 'Amp/Comp', on: g('effects.ampCompOn') === 1, type: fxType(NP2_AMP_TYPES, g('effects.ampCompType')),
      params: fxKnobs(fxParam('Drive', g('effects.ampCompDrive'), 0, 127), fxStored('Source', g('effects.ampCompSource'))),
    },
    {
      key: 'eq', label: 'EQ', on: g('effects.eqOn') === 1,
      params: fxKnobs(
        fxParam('Bass', g('effects.eqBass'), 0, 127), fxParam('Mid', g('effects.eqMid'), 0, 127),
        fxParam('Mid Freq', g('effects.eqMidFreq'), 0, 127), fxParam('Treble', g('effects.eqTreble'), 0, 127),
        fxStored('Source', g('effects.eqSource')),
      ),
    },
    {
      key: 'rvb', label: 'Reverb', on: g('effects.reverbOn') === 1, type: fxType(NP2_REVERB_TYPES, g('effects.reverbType')),
      params: fxKnobs(fxParam('Amount', g('effects.reverbDryWet'), 0, 127)),
    },
  ]);
  header.push(
    ['Keyboard touch', label(NP2_KEYBOARD_TOUCH, g('common.param4')) ?? `#${g('common.param4')}`],
    ['Sustain pedal', label(NP2_SUSTAIN_PEDAL_MODES, g('common.param5')) ?? `#${g('common.param5')}`],
  );
  return { title, header, sections: [piano, synth, effects], note: NP2_NOTE, warnings: p.warnings };
}
