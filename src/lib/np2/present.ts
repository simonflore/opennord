/**
 * Nord Piano 2 → DecodedProgram. Every value comes from the Piano 2 OS 1.22
 * descriptors (see decode.ts): the piano and synth sections with their on/off
 * switches and levels, and which effects are on. The parameters are named by
 * matching control ids with the Piano 3 (medium) and the piano-type order is
 * inferred (COLDFIRE_PIANO_TYPES); sound references are shown as fingerprints.
 */
import { decodeNp2 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';
import {
  coldfirePianoSection, effectsSection, fwHeader, legacyHeaderOnly, parts, sampleSynthSection, soundRefRows,
} from '../clavia/fw-present';
import type { Np2FieldKey } from './layout.generated';

export const NP2_NOTE =
  'Piano 2: layout from the instrument firmware (OS 1.22), not yet checked on a real file. Piano, synth and effects decoded; parameter names come from matching MIDI controllers with the Piano 3, the piano-type names are inferred, and sound names are fingerprints.';

export function np2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp2(bytes);
  const title = 'Nord Piano 2 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Piano 2');
  const g = (k: Np2FieldKey) => p.values[k] ?? 0;

  const header = [...fwHeader(p), ...soundRefRows(g('common.keybSplit'),
    [g('piano.pianoIdA'), g('piano.pianoIdB')], [g('synth.sampleIdA'), g('synth.sampleIdB')])];
  const piano = coldfirePianoSection(g('piano.pianoType'), g('piano.pianoModel'), g('piano.pianoLevel'), g('piano.pianoOn'));
  const synth = sampleSynthSection('SYNTH', {
    sample: g('synth.sampleSelect'), attack: g('synth.attack'), dcyRel: g('synth.dcyRel'),
    level: g('synth.synthLevel'), on: g('synth.synthOn'),
  });
  const effects = effectsSection(parts(
    g('effects.effects1On') ? 'Effect 1' : undefined,
    g('effects.effects2On') ? 'Effect 2' : undefined,
    g('effects.delayOn') ? 'Delay' : undefined,
    g('effects.ampCompOn') ? 'Amp/Comp' : undefined,
    g('effects.eqOn') ? 'EQ' : undefined,
    g('effects.reverbOn') ? 'Reverb' : undefined,
  ));
  return { title, header, sections: [piano, synth, effects], note: NP2_NOTE, warnings: p.warnings };
}
