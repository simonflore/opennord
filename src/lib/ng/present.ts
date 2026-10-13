/**
 * Nord Grand → DecodedProgram. Shows the piano and sample-synth layers and the
 * effect chain from the program map (Grand OS 1.68 registry
 *, the Piano 4 layout plus `Com_kSplPos`).
 *
 * Display labels are the Grand's own panel labels for the same OS
 * (Piano 4 labels, with "Clav" and "Misc" for the Grand); the label-to-parameter
 * pairing is by value count (medium). Effect settings without a known label show
 * as their stored number on the effects panel. The piano NAME comes from the family-wide
 * piano-hash table, injected by the composition root (presenters.ts).
 */
import { decodeNg } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  fwHeader, fxSection, headerOnly, label, levelPart, octavePart, parts, pianoParts,
  pianoSynthSides, singleSplit, soundIdRow, splitText, SPLIT_SIDES, SPLIT_NOTES_F2_TO_F6, SPLIT_NOTES_FROM_C3, transposeText, type PianoNameResolver,
} from '../clavia/fw-present';
import { rackUnits } from '../clavia/fx-lean';

/** Pno_kBank 0–5 (Grand OS 1.68 label table). */
export const NG_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav', 'Digital', 'Misc'] as const;
/** Pno_kEq for non-Clav pianos (Piano 4 / Grand label table; Clav uses its own combinations). */
export const NG_TIMBRE = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2'] as const;
/** Effects_kFx1Type 0–7. */
export const NG_FX1 = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NG_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kSpkType 0–4. */
export const NG_SPEAKER = ['Small', 'JC', 'Twin', 'Dist', 'Comp'] as const;
/** Effects_kRvbType 0–2 (+ the Bright switch). */
export const NG_REVERB = ['Room', 'Stage', 'Hall'] as const;

const CLAV = 3;

export function ngDecoded(bytes: Uint8Array, resolvePianoName?: PianoNameResolver): DecodedProgram {
  const p = decodeNg(bytes);
  const title = 'Nord Grand · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Grand');
  const v = p.values;
  // Spl Select 0–2 is Off, Pno/Syn, Syn/Pno (the instrument’s own texts): which sound is below the split point.
  const sides = v['common.splSelect'] ?? 0;
  // Format 1.01 moved the split point to a nine-place field (F2 to F6); 1.00 has the seven places from C3.
  const splitNote = (p.formatVersion ?? 0) >= 101
    ? label(SPLIT_NOTES_F2_TO_F6, v['common.splPos'])
    : label(SPLIT_NOTES_FROM_C3, v['common.splPosEol']);
  const header = [
    ...fwHeader(p, transposeText(v['common.transposeEnable'], v['common.transposeValue'])),
    ['Split', splitText(sides !== 0, splitNote, v['common.splWidth'], SPLIT_SIDES[sides])] as [string, string],
    ...soundIdRow('Piano sound id', v['piano.nameHash']),
    ...soundIdRow('Sample sound id', v['synth.smpNameHash']),
  ];

  const bank = v['piano.bank'];
  const timbre = bank !== CLAV ? label(NG_TIMBRE, v['piano.eq']) : undefined;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(
        ...pianoParts(v['piano.nameHash'], label(NG_PIANO_TYPE, bank), v['piano.variation'], resolvePianoName),
        levelPart(v['piano.level']),
        octavePart(v['piano.octaveShift']),
        timbre && timbre !== 'None' ? `Timbre ${timbre}` : undefined,
        !v['piano.enable'] && '(off)',
      ),
    }],
    chips: parts(v['piano.pedalNoise'] ? 'Pedal Noise' : undefined),
  };
  const synth: DecodedSection = {
    id: 'S', label: 'SAMPLE SYNTH',
    engines: [{
      label: 'Synth',
      parts: parts('Sample', levelPart(v['synth.level']), octavePart(v['synth.octaveShift']), !v['synth.enable'] && '(off)'),
    }],
  };

  // Sources 1 and 2 read as Piano and Synth by the Electro 6's enumeration of the same field
  // (0 Organ, 1 Piano, 2 Synth; ne6/labels.ts). The Piano 4, whose layout the Grand shares, confirms it on real files (np4/present.ts); not checked on Grand files.
  const fx = fxSection(rackUnits((k) => v[k as keyof typeof v], {
    fx1: NG_FX1, fx2: NG_FX2, speaker: NG_SPEAKER, reverb: NG_REVERB, sources: [undefined, 'Piano', 'Synth'],
  }));

  return {
    title, header,
    keyboard: singleSplit(sides !== 0, splitNote, v['common.splWidth'],
      pianoSynthSides(sides, v['piano.enable'] === 1, v['synth.enable'] === 1)),
    sections: [piano, synth, fx],
    note: 'Grand: read with OpenNord’s map of Grand OS 1.68 programs (the Piano 4 layout plus a 9-step split point). Not yet checked against a real Grand file.',
    warnings: p.warnings,
  };
}
