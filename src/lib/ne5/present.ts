/**
 * Nord Electro 5 → DecodedProgram. Every value comes from the Electro 5 OS 2.04
 * containers (see decode.ts): the piano and Sample Synth sections, the organ's
 * upper and lower parts (the preset each plays, its drawbars, vibrato and
 * percussion) and which effects are on, named with the instrument's own
 * display texts (labels.ts); sample references are shown as fingerprints.
 */
import { decodeNe5 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import {
  ampCompPart, coldfirePianoSection, effectsSection, fwHeader, label, legacyHeaderOnly, parts, reverbPart,
  sampleSynthSection, soundRefRows,
} from '../clavia/fw-present';
import {
  NE5_AMP_TYPES, NE5_EFFECT1_TYPES, NE5_EFFECT2_TYPES, NE5_ORGAN_MODELS, NE5_ORGAN_SET, NE5_PIANO_TYPES, NE5_REVERB_TYPES,
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

  const header = [...fwHeader(p), ...soundRefRows(g('common.keyboardSplitKeybSplit'), p.piano.ids, p.sampleSynth.ids)];
  const piano = coldfirePianoSection(NE5_PIANO_TYPES, p.piano.type, p.piano.model);
  const synth = sampleSynthSection('SAMPLE SYNTH', {
    sample: p.sampleSynth.sample, attack: g('sampleSynth.sampleSynthAttack'), dcyRel: g('sampleSynth.sampleSynthDcyRel'),
  });
  const effects = effectsSection(parts(
    g('effects.effects1Enable') ? label(NE5_EFFECT1_TYPES, g('effects.effects1Type')) ?? 'Effect 1' : undefined,
    g('effects.effects2Enable') ? label(NE5_EFFECT2_TYPES, g('effects.effects2Type')) ?? 'Effect 2' : undefined,
    g('effects.delayEnable') ? 'Delay' : undefined,
    g('effects.ampCompEnable') ? ampCompPart(label(NE5_AMP_TYPES, g('effects.ampCompType'))) : undefined,
    g('effects.equalizerEnable') ? 'EQ' : undefined,
    g('effects.reverbEnable') ? reverbPart(label(NE5_REVERB_TYPES, g('effects.reverbType'))) : undefined,
  ));


  return {
    title, header,
    sections: [piano, synth, organPart(p, 'upper'), organPart(p, 'lower'), effects],
    note: 'Electro 5: OpenNord’s program map (OS 2.04). Piano, Sample Synth, organ drawbar presets and effects decoded, named as the instrument shows them; sample names are fingerprints.',
    warnings: p.warnings,
  };
}
