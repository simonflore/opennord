/**
 * Nord Piano 3 → DecodedProgram. Every value comes from the Piano 3 OS 2.04
 * containers (see decode.ts): the piano and Sample Synth sections with their
 * on/off switches and levels, and which effects are on. The piano-type names
 * are an inferred order (COLDFIRE_PIANO_TYPES); sound references are shown as
 * fingerprints. Provisional until a real `.np3p` confirms the file alignment.
 */
import { decodeNp3 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';
import {
  coldfirePianoSection, effectsSection, fwHeader, legacyHeaderOnly, parts, sampleSynthSection, soundRefRows,
} from '../clavia/fw-present';
import type { Np3FieldKey } from './layout.generated';

export const NP3_NOTE =
  'Piano 3: layout from the instrument firmware (OS 2.04), not yet checked on a real file. Piano, Sample Synth and effects decoded; the piano-type names are inferred, and sound names are fingerprints.';

export function np3Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp3(bytes);
  const title = 'Nord Piano 3 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Piano 3');
  const g = (k: Np3FieldKey) => p.values[k] ?? 0;

  const header = [...fwHeader(p), ...soundRefRows(g('common.keyboardSplitKeybSplit'),
    [g('piano.pianoIdA'), g('piano.pianoIdB')], [g('synth.sampleIdA'), g('synth.sampleIdB')])];
  const piano = coldfirePianoSection(g('piano.pianoType'), g('piano.pianoModel'), g('common.pianoLevel'), g('common.pianoOn'));
  const synth = sampleSynthSection('SAMPLE SYNTH', {
    sample: g('synth.sampleSelect'), attack: g('synth.sampleSynthAttack'), dcyRel: g('synth.sampleSynthDcyRel'),
    level: g('common.synthLevel'), on: g('common.synthOn'),
  });
  const effects = effectsSection(parts(
    g('effects.effects1Fx1') ? 'Effect 1' : undefined,
    g('effects.effects2Fx2') ? 'Effect 2' : undefined,
    g('effects.delay') ? 'Delay' : undefined,
    g('effects.ampCompAC') ? 'Amp/Comp' : undefined,
    g('effects.equalizerEq') ? 'EQ' : undefined,
    g('effects.reverb') ? (g('effects.reverbBright') ? 'Reverb Bright' : 'Reverb') : undefined,
  ));
  return { title, header, sections: [piano, synth, effects], note: NP3_NOTE, warnings: p.warnings };
}
