/**
 * Nord Piano 2 → DecodedProgram. Every value comes from the Piano 2 OS 1.22
 * descriptors (see decode.ts): the piano and synth sections with their on/off
 * switches and levels, the keyboard settings and which effects are on, named
 * with the instrument's own display texts (labels.ts); sound references are
 * shown as fingerprints.
 */
import { decodeNp2 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';
import {
  ampCompPart, coldfirePianoSection, effectsSection, fwHeader, label, legacyHeaderOnly, parts, reverbPart,
  sampleSynthSection, soundRefRows,
} from '../clavia/fw-present';
import {
  NP2_AMP_TYPES, NP2_EFFECT1_TYPES, NP2_EFFECT2_TYPES, NP2_KEYBOARD_TOUCH, NP2_PIANO_TYPES,
  NP2_REVERB_TYPES, NP2_SUSTAIN_PEDAL_MODES,
} from './labels';
import type { Np2FieldKey } from './layout.generated';

export const NP2_NOTE =
  'Piano 2: layout from the instrument firmware (OS 1.22), not yet checked on a real file. Piano, synth, keyboard settings and effects decoded, named as the instrument shows them; sound names are fingerprints.';

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
  const effects = effectsSection(parts(
    g('effects.effects1On') ? label(NP2_EFFECT1_TYPES, g('effects.effects1Type')) ?? 'Effect 1' : undefined,
    g('effects.effects2On') ? label(NP2_EFFECT2_TYPES, g('effects.effects2Type')) ?? 'Effect 2' : undefined,
    g('effects.delayOn') ? 'Delay' : undefined,
    g('effects.ampCompOn') ? ampCompPart(label(NP2_AMP_TYPES, g('effects.ampCompType'))) : undefined,
    g('effects.eqOn') ? 'EQ' : undefined,
    g('effects.reverbOn') ? reverbPart(label(NP2_REVERB_TYPES, g('effects.reverbType'))) : undefined,
  ));
  header.push(
    ['Keyboard touch', label(NP2_KEYBOARD_TOUCH, g('common.param4')) ?? `#${g('common.param4')}`],
    ['Sustain pedal', label(NP2_SUSTAIN_PEDAL_MODES, g('common.param5')) ?? `#${g('common.param5')}`],
  );

  return { title, header, sections: [piano, synth, effects], note: NP2_NOTE, warnings: p.warnings };
}
