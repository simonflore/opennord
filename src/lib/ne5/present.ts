/**
 * Nord Electro 5 → DecodedProgram. Every value comes from the Electro 5 OS 2.04
 * containers (see decode.ts): the piano and Sample Synth sections, the organ's
 * upper and lower parts (the preset each plays, its drawbars, vibrato and
 * percussion) and the effect rack with its settings, named with the instrument's own
 * display texts (labels.ts); sample references are shown as fingerprints.
 */
import { decodeNe5 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import {
  coldfirePianoSection, fxKnobs, fxParam, fxSection, fxType, sourceLeds, fwHeader, label, legacyHeaderOnly, parts,
  sampleSynthSection, soundRefRows, splitText, SPLIT_NOTES_C3_TO_F5,
} from '../clavia/fw-present';
import {
  NE5_AMP_TYPES, NE5_EFFECT1_TYPES, NE5_EFFECT2_TYPES, NE5_EFFECT_SOURCES, NE5_EQ_SOURCES, NE5_ORGAN_MODELS, NE5_ORGAN_SET, NE5_PIANO_TYPES, NE5_REVERB_TYPES,
} from './labels';
import type { Ne5Program } from './types';

const PRESET = ['Preset I', 'Preset II'] as const;

function organPart(p: Ne5Program, part: 'upper' | 'lower'): DecodedSection {
  const type = NE5_ORGAN_SET[p.organModel] ?? 'b3';
  const set = p.organ[type];
  const which = part === 'upper' ? set.upperPreset : set.lowerPreset;
  const preset = which === 1 ? set.presetII : set.presetI;
  return {
    id: part === 'upper' ? 'OU' : 'OL', label: part === 'upper' ? 'ORGAN UPPER' : 'ORGAN LOWER',
    engines: [{ label: 'Organ', parts: parts(label(NE5_ORGAN_MODELS, p.organModel) ?? 'Organ', PRESET[which] ?? PRESET[0]) }],
    drawbars: drawbarViews([...preset.drawbars], type === 'b3' ? B3_FOOTAGE : undefined),
    chips: parts(
      preset.vibrato ? (type === 'b3' ? 'Vibrato/Chorus' : 'Vibrato') : undefined,
      preset.percussion ? 'Percussion' : undefined,
      preset.bass ? `Bass drawbars 16′ ${preset.bass[0]} · 8′ ${preset.bass[1]}` : undefined,
    ),
  };
}

export function ne5Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNe5(bytes);
  const title = 'Nord Electro 5 · Program';
  if (!p.layoutMatched) return legacyHeaderOnly(title, p, 'Electro 5');
  const g = (k: keyof typeof p.values) => p.values[k] ?? 0;

  // Six places (0–5), then the firmware's seventh text: the upper part comes from MIDI, not from a split point.
  const split = splitText(g('common.keyboardSplitKeybSplit') !== 0,
    label([...SPLIT_NOTES_C3_TO_F5, 'MIDI Upper Receive'], g('common.keyboardSplitSplitPoint')))
    .replace('at MIDI Upper Receive', 'MIDI Upper Receive');
  const header = [...fwHeader(p), ...soundRefRows(split, p.piano.ids, p.sampleSynth.ids)];
  const piano = coldfirePianoSection(NE5_PIANO_TYPES, p.piano.type, p.piano.model);
  const synth = sampleSynthSection('SAMPLE SYNTH', {
    sample: p.sampleSynth.sample, attack: g('sampleSynth.sampleSynthAttack'), dcyRel: g('sampleSynth.sampleSynthDcyRel'),
  });
  // The rack in panel order. Knob fields are 0–127 (delay feedback 0–3), shown as stored.
  const effects = fxSection([
    {
      key: 'fx1', label: 'Effect 1', on: g('effects.effects1Enable') === 1, type: fxType(NE5_EFFECT1_TYPES, g('effects.effects1Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects1Rate'), 0, 127)),
      switches: [{ label: 'Ped Ctrl', on: g('effects.effects1PedCtrl') === 1 }],
      source: sourceLeds(NE5_EFFECT_SOURCES, g('effects.effects1Source')),
    },
    {
      key: 'fx2', label: 'Effect 2', on: g('effects.effects2Enable') === 1, type: fxType(NE5_EFFECT2_TYPES, g('effects.effects2Type')),
      params: fxKnobs(fxParam('Rate', g('effects.effects2Rate'), 0, 127)),
      switches: [{ label: 'Deep', on: g('effects.effects2Deep') === 1 }],
      source: sourceLeds(NE5_EFFECT_SOURCES, g('effects.effects2Source')),
    },
    {
      key: 'dly', label: 'Delay', on: g('effects.delayEnable') === 1,
      params: fxKnobs(
        fxParam('Tempo', g('effects.delayTempo'), 0, 127), fxParam('Mix', g('effects.delayDryWet'), 0, 127),
        fxParam('Feedback', g('effects.delayFeedback'), 0, 3),
      ),
      switches: [{ label: 'Ping Pong', on: g('effects.delayPingPong') === 1 }],
      source: sourceLeds(NE5_EFFECT_SOURCES, g('effects.delaySource')),
    },
    {
      key: 'amp', label: 'Amp/Comp', on: g('effects.ampCompEnable') === 1, type: fxType(NE5_AMP_TYPES, g('effects.ampCompType')),
      params: fxKnobs(fxParam('Drive', g('effects.ampCompDrive'), 0, 127)),
      source: sourceLeds(NE5_EFFECT_SOURCES, g('effects.ampCompSource')),
    },
    {
      key: 'eq', label: 'EQ', on: g('effects.equalizerEnable') === 1,
      params: fxKnobs(
        fxParam('Bass', g('effects.equalizerBass'), 0, 127), fxParam('Mid', g('effects.equalizerMid'), 0, 127),
        fxParam('Mid Freq', g('effects.equalizerMidFreq'), 0, 127), fxParam('Treble', g('effects.equalizerTreble'), 0, 127),
      ),
      source: sourceLeds(NE5_EQ_SOURCES, g('effects.equalizerSource')),
    },
    {
      key: 'rvb', label: 'Reverb', on: g('effects.reverbEnable') === 1, type: fxType(NE5_REVERB_TYPES, g('effects.reverbType')),
      params: fxKnobs(fxParam('Amount', g('effects.reverbDryWet'), 0, 127)),
    },
  ]);

  return {
    title, header,
    sections: [piano, synth, organPart(p, 'upper'), organPart(p, 'lower'), effects],
    note: 'Electro 5: OpenNord’s program map (OS 2.04). Piano, Sample Synth, organ drawbar presets and effects decoded, named as the instrument shows them; sample names are fingerprints.',
    warnings: p.warnings,
  };
}
