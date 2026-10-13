/**
 * Nord Piano 4 → DecodedProgram. Shows the piano and sample-synth layers and the
 * effect chain from the program map (Piano 4 OS 2.66 registry
 *; the Grand layout minus its 4-bit split point).
 *
 * Display labels are the Piano 4's own panel labels for the same OS
 * (…); the label-to-parameter pairing is by value count (medium). Effect
 * settings without a known label show as their stored number on the effects panel. The piano
 * NAME comes from the family-wide piano-hash table, injected by the composition
 * root (presenters.ts) — this module never imports ns4.
 */
import { decodeNp4 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  fwHeader, fxSection, headerOnly, label, levelPart, octavePart, parts, pianoParts,
  pianoSynthSides, singleSplit, soundIdRow, splitText, SPLIT_SIDES, SPLIT_NOTES_FROM_C3, transposeText, type PianoNameResolver,
} from '../clavia/fw-present';
import { rackUnits } from '../clavia/fx-lean';

/** Pno_kBank 0–5 (Piano 4 OS 2.66 label table). */
export const NP4_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav/Hps', 'Digital', 'Layer'] as const;
/** Pno_kEq for non-Clav pianos (Piano 4 label table; Clav/Hps uses its own combinations). */
export const NP4_TIMBRE = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2'] as const;
/** Effects_kFx1Type 0–7. */
export const NP4_FX1 = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NP4_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kSpkType 0–4. */
export const NP4_SPEAKER = ['Small', 'JC', 'Twin', 'Dist', 'Comp'] as const;
/** Effects_kRvbType 0–2 (+ the Bright switch). */
export const NP4_REVERB = ['Room', 'Stage', 'Hall'] as const;

const CLAV = 3;

export function np4Decoded(bytes: Uint8Array, resolvePianoName?: PianoNameResolver): DecodedProgram {
  const p = decodeNp4(bytes);
  const title = 'Nord Piano 4 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Piano 4');
  const v = p.values;
  // Spl Select 0–2 is Off, Pno/Syn, Syn/Pno (the instrument’s own texts): which sound is below the split point.
  const sides = v['common.splSelect'] ?? 0;
  const splitNote = label(SPLIT_NOTES_FROM_C3, v['common.splPos']);
  const header = [
    ...fwHeader(p, transposeText(v['common.transposeEnable'], v['common.transposeValue'])),
    ['Split', splitText(sides !== 0, splitNote, v['common.splWidth'], SPLIT_SIDES[sides])] as [string, string],
    ...soundIdRow('Piano sound id', v['piano.nameHash']),
    ...soundIdRow('Sample sound id', v['synth.smpNameHash']),
  ];

  const bank = v['piano.bank'];
  const timbre = bank !== CLAV ? label(NP4_TIMBRE, v['piano.eq']) : undefined;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(
        ...pianoParts(v['piano.nameHash'], label(NP4_PIANO_TYPE, bank), v['piano.variation'], resolvePianoName),
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

  // Sources: 1 = Piano, 2 = Synth, the Electro 6's enumeration of the same field (ne6/labels.ts).
  // Checked on 212 real Piano 4 programs, counting switched-on effects in programs with one engine on:
  // value 1 sits with the piano in 138 of 139, value 2 with the synth in 30 of 30.
  const fx = fxSection(rackUnits((k) => v[k as keyof typeof v], {
    fx1: NP4_FX1, fx2: NP4_FX2, speaker: NP4_SPEAKER, reverb: NP4_REVERB, sources: [undefined, 'Piano', 'Synth'],
  }));

  return {
    title, header,
    keyboard: singleSplit(sides !== 0, splitNote, v['common.splWidth'],
      pianoSynthSides(sides, v['piano.enable'] === 1, v['synth.enable'] === 1)),
    sections: [piano, synth, fx],
    note: 'Piano 4: piano, sample synth and effects read with OpenNord’s map of Piano 4 OS 2.66 programs.',
    warnings: p.warnings,
  };
}
