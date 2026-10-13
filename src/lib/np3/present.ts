/**
 * Nord Piano 3 → DecodedProgram. Every value comes from the Piano 3 OS 2.04
 * containers (see decode.ts): the piano and Sample Synth sections with their
 * on/off switches and levels, and the effect rack with its settings, named with the
 * instrument's own display texts (labels.ts); sound references are shown as
 * fingerprints. Provisional until a real `.np3p` confirms the file alignment.
 */
import { decodeNp3 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';
import {
  coldfirePianoSection, fxKnobs, fxParam, fxSection, fxType, sourceLeds, fwHeader, legacyHeaderOnly,
  keyName, pianoSynthSides, sampleSynthSection, singleSplit, soundRefRows, splitText, SPLIT_SIDES,
} from '../clavia/fw-present';
import {
  NP3_AMP_TYPES, NP3_EFFECT1_TYPES, NP3_EFFECT2_TYPES, NP3_EFFECT_SOURCES, NP3_EQ_SOURCES, NP3_PIANO_TYPES, NP3_REVERB_TYPES,
} from './labels';
import type { Np3FieldKey } from './layout.generated';

export const NP3_NOTE =
  'Piano 3: OpenNord’s program map (OS 2.04), not yet checked on a real file. Piano, Sample Synth and effects decoded, named as the instrument shows them; sound names are fingerprints.';

export function np3Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp3(bytes);
  const title = 'Nord Piano 3 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Piano 3');
  const g = (k: Np3FieldKey) => p.values[k] ?? 0;

  // "Split point" (common, id 10) is a key counted from the bottom of the 88-key
  // keyboard: its default, 44, is F4, one of the seven places the manual lists
  // (C3, F3, C4, F4, C5, F5, C6). Medium: not checked on a real file.
  // Keyb Split 0–2 is Off, Piano/Synth, Synth/Piano (the instrument’s own texts).
  const sides = g('common.keyboardSplitKeybSplit');
  const splitNote = keyName(g('common.splitPoint'));
  const split = splitText(sides !== 0, splitNote, undefined, SPLIT_SIDES[sides]);
  const keyboard = singleSplit(sides !== 0, splitNote, 0, pianoSynthSides(sides, g('common.pianoOn') !== 0, g('common.synthOn') !== 0));
  const header = [...fwHeader(p), ...soundRefRows(split,
    [g('piano.pianoIdA'), g('piano.pianoIdB')], [g('synth.sampleIdA'), g('synth.sampleIdB')])];
  const piano = coldfirePianoSection(NP3_PIANO_TYPES, g('piano.pianoType'), g('piano.pianoModel'), g('common.pianoLevel'), g('common.pianoOn'));
  const synth = sampleSynthSection('SAMPLE SYNTH', {
    sample: g('synth.sampleSelect'), attack: g('synth.sampleSynthAttack'), dcyRel: g('synth.sampleSynthDcyRel'),
    level: g('common.synthLevel'), on: g('common.synthOn'),
  });
  // The rack in panel order. Knob fields are 0–127 (delay feedback 0–3), shown as stored.
  const effects = fxSection([
    {
      key: 'fx1', label: 'Effect 1', on: g('effects.effects1Fx1') === 1, type: fxType(NP3_EFFECT1_TYPES, g('effects.effects1Fx1Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects1Fx1Rate'), 0, 127)),
      switches: [{ label: 'Ped Ctrl', on: g('effects.effects1PedCtrl') === 1 }],
      source: sourceLeds(NP3_EFFECT_SOURCES, g('effects.effects1Fx1Src')),
    },
    {
      key: 'fx2', label: 'Effect 2', on: g('effects.effects2Fx2') === 1, type: fxType(NP3_EFFECT2_TYPES, g('effects.effects2Fx2Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects2Fx2Rate'), 0, 127)),
      switches: [{ label: 'Deep', on: g('effects.effects2Deep') === 1 }],
      source: sourceLeds(NP3_EFFECT_SOURCES, g('effects.effects2Fx2Src')),
    },
    {
      key: 'dly', label: 'Delay', on: g('effects.delay') === 1,
      params: fxKnobs(
        fxParam('Tempo', g('effects.delayTempo'), 0, 127), fxParam('Mix', g('effects.delayDryWet'), 0, 127),
        fxParam('Feedback', g('effects.delayFeedback'), 0, 3),
      ),
      source: sourceLeds(NP3_EFFECT_SOURCES, g('effects.delaySrc')),
    },
    {
      key: 'amp', label: 'Amp/Comp', on: g('effects.ampCompAC') === 1, type: fxType(NP3_AMP_TYPES, g('effects.ampCompACType')),
      params: fxKnobs(fxParam('Drive', g('effects.ampCompDrive'), 0, 127)),
      source: sourceLeds(NP3_EFFECT_SOURCES, g('effects.ampCompACSrc')),
    },
    {
      key: 'eq', label: 'EQ', on: g('effects.equalizerEq') === 1,
      params: fxKnobs(
        fxParam('Bass', g('effects.equalizerBass'), 0, 127), fxParam('Mid', g('effects.equalizerMid'), 0, 127),
        fxParam('Mid Freq', g('effects.equalizerMidFreq'), 0, 127), fxParam('Treble', g('effects.equalizerTreble'), 0, 127),
      ),
      source: sourceLeds(NP3_EQ_SOURCES, g('effects.equalizerEqSrc')),
    },
    {
      key: 'rvb', label: 'Reverb', on: g('effects.reverb') === 1, type: fxType(NP3_REVERB_TYPES, g('effects.reverbType')),
      params: fxKnobs(fxParam('Amount', g('effects.reverbDryWet'), 0, 127)),
      switches: [{ label: 'Bright', on: g('effects.reverbBright') === 1 }],
    },
  ]);
  return { title, header, keyboard, sections: [piano, synth, effects], note: NP3_NOTE, warnings: p.warnings };
}
