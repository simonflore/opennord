/**
 * Nord Electro 6 → DecodedProgram. Every value comes from the Electro 6 OS 2.66
 * registry layout (see decode.ts): piano / sample synth / organ sections with
 * their enables, levels and octave shifts, the sounding drawbar preset of each
 * organ manual, and the global effects, labelled with the instrument's own
 * display texts (labels.ts). The piano and synth sample references are 32-bit
 * name hashes, shown as fingerprints (no Electro 6 name table yet).
 */
import { decodeNe6 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import {
  DRAWBAR_NUMBERS, fwHeader, fxSection, headerOnly, hexId, label, levelPart, octavePart, parts, splitText,
  SPLIT_NOTES_C3_TO_F5, transposeText,
} from '../clavia/fw-present';
import { rackUnits, type FieldGet } from '../clavia/fx-lean';
import type { Ne6FieldKey } from './layout.generated';
import {
  NE6_AMP_TYPES, NE6_FX1_TYPES, NE6_FX2_TYPES, NE6_FX_SOURCES, NE6_ORGAN_MODELS, NE6_PIANO_TYPES, NE6_REVERB_TYPES, ne6VibratoLabel,
} from './labels';

/** Organ models that use Hammond drawbar footage (B3, B3 Bass). */
const B3_MODELS = new Set([0, 5]);

type Get = (key: Ne6FieldKey) => number | undefined;

function organManual(g: Get, m: 'A' | 'B'): DecodedSection {
  const second = g(`manual${m}PresetCommon.presetFocus`) === 1;
  const preset = second ? `manual${m}PresetII` as const : `manual${m}PresetI` as const;
  const model = g('organManualCommon.model');
  const bars = DRAWBAR_NUMBERS.map((i) => g(`${preset}.db${i}`) ?? 0);
  const vibrato = ne6VibratoLabel(model, g('organManualCommon.vibratoType'));
  return {
    id: `O${m}`, label: `ORGAN ${m}`,
    engines: [{
      label: 'Organ',
      parts: parts(label(NE6_ORGAN_MODELS, model) ?? 'Organ', levelPart(g('organManualCommon.level')),
        second ? 'Preset II' : 'Preset I', octavePart(g(`organMulti${m}.octaveShift`)), !g('organ.enable') && '(off)'),
    }],
    drawbars: drawbarViews(bars, model !== undefined && B3_MODELS.has(model) ? B3_FOOTAGE : undefined),
    chips: parts(
      g(`${preset}.vibratoEnable`) ? (vibrato ? `Vibrato ${vibrato}` : 'Vibrato') : undefined,
      g(`${preset}.b3PercEnable`) ? 'Percussion' : undefined,
    ),
  };
}

export function ne6Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNe6(bytes);
  const title = 'Nord Electro 6 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Electro 6');
  const g: Get = (k) => p.values[k];

  const header = fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue')));
  // Spl Mode 0 is no split; what its other values (1–7) select is not read yet, so no sides are shown.
  header.push(['Split', splitText(g('common.splMode') !== 0, label(SPLIT_NOTES_C3_TO_F5, g('common.splPos')), g('common.splWidth'))]);
  const pianoHash = g('piano.nameHash');
  if (pianoHash !== undefined) header.push(['Piano sound id', hexId(pianoHash)]);
  const sampleHash = g('synth.smpNameHash');
  if (sampleHash !== undefined) header.push(['Sample sound id', hexId(sampleHash)]);

  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(label(NE6_PIANO_TYPES, g('piano.bank')) ?? 'Piano', levelPart(g('piano.level')),
        octavePart(g('piano.octaveShift')), !g('piano.enable') && '(off)'),
    }],
  };
  const synth: DecodedSection = {
    id: 'S', label: 'SAMPLE SYNTH',
    engines: [{
      label: 'Synth',
      parts: parts(levelPart(g('synth.level')), octavePart(g('synth.octaveShift')), !g('synth.enable') && '(off)'),
    }],
  };

  // The rack is the family the Piano 4, Piano 5 and Grand share (clavia/fx-lean.ts).
  const effects = fxSection(rackUnits(g as FieldGet, {
    fx1: NE6_FX1_TYPES, fx2: NE6_FX2_TYPES, speaker: NE6_AMP_TYPES, reverb: NE6_REVERB_TYPES, sources: NE6_FX_SOURCES,
  }));

  return {
    title, header,
    sections: [piano, synth, organManual(g, 'A'), organManual(g, 'B'), effects],
    note: 'Electro 6: OpenNord’s program map (OS 2.66). Piano, synth and organ sections, drawbar presets and effects decoded; sample names are fingerprints until a name table exists.',
    warnings: p.warnings,
  };
}
