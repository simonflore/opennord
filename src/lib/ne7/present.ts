/**
 * Nord Electro 7 → DecodedProgram — firmware-derived, block order not yet
 * confirmed on a real file (see types.ts). Every decoded program says so in its
 * note.
 *
 * Display labels are the Electro 7's own pointer arrays in the OS 1.30 image:
 * organ model (c04c76d8) and piano category (c05a2420). The firmware has no text
 * labels for Fx1, Fx2, Amp or Reverb types (probably drawn as graphics), so
 * effects show as on/off only. The embedded synth preset stores the analog
 * waveforms and the FM algorithm side by side; only the active mode's sound is
 * shown. `Syn_kMode` 0 = Sample is confirmed (it reloads the sample); 1 = Analog
 * and 2 = FM are likely, and say so (docs/ELECTRO7-ENGINES.md §4.1). Oscillator
 * labels: the OS 1.30 lists at c04c7678 / c04c87d4.
 */
import { decodeNe7 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import {
  DRAWBAR_NUMBERS, effectsSection, fwHeader, headerOnly, label, levelPart, noneOn, octavePart, parts, pianoParts,
  soundIdRow, transposeText, type PianoNameResolver,
} from '../clavia/fw-present';
import type { Ne7FieldKey } from './layout.generated';

/** Org_kOrganModel 0–5. */
export const NE7_ORGAN_MODEL = ['B3', 'Vox', 'Farf', 'Pipe', 'Soft B3', 'B3+Bass'] as const;
/** Pno_kBank 0–5 (piano category). */
export const NE7_PIANO_CATEGORY = ['Grand', 'Upright', 'Electric', 'Clavinet', 'Digital', 'Misc'] as const;

/** Syn_kAnalogMainWaveform 0–5 (Osc A). */
export const NE7_OSC_A = ['Triangle', 'Saw', 'Square', 'Pulse 33', 'Pulse 10', 'SuperSaw'] as const;
/** Syn_kAnalogAuxWaveform 0–6 (Osc B; 0 = off). */
export const NE7_OSC_B = ['Off', 'Triangle', 'Saw', 'Square', 'Pulse 33', 'Pulse 10', 'Noise'] as const;

/** Organ models that use Hammond drawbar footage (B3, Soft B3, B3+Bass). */
const B3_MODELS = new Set([0, 4, 5]);

export const NE7_PROVISIONAL_NOTE =
  'Electro 7: firmware-derived (OS 1.30 registry), block order not yet confirmed on a real file — treat these values as provisional.';

type Get = (key: Ne7FieldKey) => number | undefined;

function sectionFx(g: Get, blk: 'organFx' | 'pianoFx' | 'synthFx'): string[] {
  return noneOn(parts(
    g(`${blk}.fx1Enable`) ? 'Effect 1' : undefined,
    g(`${blk}.fx2Enable`) ? 'Effect 2' : undefined,
    g(`${blk}.dlyEnable`) ? 'Delay' : undefined,
    g(`${blk}.ampEnable`) ? 'Amp' : undefined,
    g(`${blk}.cmpEnable`) ? 'Comp' : undefined,
  ));
}

/** The synth preset's sound for its mode; Analog and FM are marked "likely". */
function synthSound(g: Get): string[] {
  switch (g('synthPreset.mode')) {
    case 0: return ['Sample'];
    case 1: {
      const oscB = label(NE7_OSC_B, g('synthPreset.analogAuxWaveform'));
      return parts('Analog (likely)', label(NE7_OSC_A, g('synthPreset.analogMainWaveform')),
        oscB !== undefined && oscB !== 'Off' && `Osc B ${oscB}`);
    }
    case 2: {
      const alg = g('synthPreset.fmAlgorithm');
      return parts('FM (likely)', alg !== undefined && `Algorithm ${alg + 1}`);
    }
    default: return [];
  }
}

function drawbarSet(g: Get, n: 1 | 2 | 3, b3: boolean): DecodedSection {
  const blk = `organDrawbars${n}` as const;
  const bars = DRAWBAR_NUMBERS.map((i) => g(`${blk}.drawbarValue${i}`) ?? 0);
  return {
    id: `D${n}`, label: `ORGAN · DRAWBARS ${n}`,
    engines: [{ label: 'Drawbars', parts: [bars.join(' ')] }],
    drawbars: drawbarViews(bars, b3 ? B3_FOOTAGE : undefined),
    chips: parts(
      g(`${blk}.vibratoEnable`) ? 'Vibrato' : undefined,
      g(`${blk}.percussionEnable`) ? 'Percussion' : undefined,
    ),
  };
}

export function ne7Decoded(bytes: Uint8Array, resolvePianoName?: PianoNameResolver): DecodedProgram {
  const p = decodeNe7(bytes);
  const title = 'Nord Electro 7 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Electro 7', NE7_PROVISIONAL_NOTE);
  const g: Get = (k) => p.values[k];

  const header = [
    ...fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue'))),
    ...soundIdRow('Piano sound id', g('piano.nameHash')),
    ...(g('synthPreset.mode') === 0 ? soundIdRow('Synth sample id', g('synthPreset.smpNameHash')) : []),
  ];

  const model = g('organ.organModel');
  const organ: DecodedSection = {
    id: 'O', label: 'ORGAN',
    engines: [
      {
        label: 'Organ',
        parts: parts(label(NE7_ORGAN_MODEL, model) ?? 'Organ', levelPart(g('organ.level')),
          octavePart(g('organLayerA.octaveShift')), !g('organ.isEnabled') && '(off)'),
      },
      { label: 'Effects', parts: sectionFx(g, 'organFx') },
    ],
  };
  const b3 = model !== undefined && B3_MODELS.has(model);

  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [
      {
        label: 'Piano',
        parts: parts(
          ...pianoParts(g('piano.nameHash'), label(NE7_PIANO_CATEGORY, g('piano.bank')), g('piano.variation'), resolvePianoName),
          levelPart(g('piano.level')), octavePart(g('piano.octaveShift')), !g('piano.isEnabled') && '(off)'),
      },
      { label: 'Effects', parts: sectionFx(g, 'pianoFx') },
    ],
    chips: parts(g('piano.enableStringRes') ? 'String Res' : undefined),
  };

  const synth: DecodedSection = {
    id: 'S', label: 'SYNTH',
    engines: [
      {
        label: 'Synth',
        parts: parts(levelPart(g('synth.level')), octavePart(g('synth.octaveShift')), !g('synth.isEnabled') && '(off)'),
      },
      { label: 'Preset', parts: synthSound(g) },
      { label: 'Effects', parts: sectionFx(g, 'synthFx') },
    ],
  };

  return {
    title, header,
    sections: [
      organ, drawbarSet(g, 1, b3), drawbarSet(g, 2, b3), drawbarSet(g, 3, b3),
      piano, synth,
      effectsSection(parts(
        g('common.rvbEnable') ? 'Reverb' : undefined,
        g('common.rotaryEnable') ? 'Rotary' : undefined,
      ), 'G', 'GLOBAL EFFECTS'),
    ],
    note: NE7_PROVISIONAL_NOTE,
    warnings: p.warnings,
  };
}
