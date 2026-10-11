/**
 * Nord Electro 7 → DecodedProgram — block order not yet
 * confirmed on a real file (see types.ts). Every decoded program says so in its
 * note.
 *
 * Display labels are the Electro 7's own pointer arrays in the OS 1.30 image:
 * organ model, piano category, analog main/aux waves and
 * FM algorithm. The firmware has no text labels for Fx1, Fx2, Amp or Reverb
 * types (probably drawn as graphics), so effects show as on/off only.
 */
import { decodeNe7 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { effectsSection, fwHeader, headerOnlyNote, hexId, label, levelPart, octavePart, parts, transposeText } from '../clavia/fw-present';

/** Org_kOrganModel 0–5. */
export const NE7_ORGAN_MODEL = ['B3', 'Vox', 'Farf', 'Pipe', 'Soft B3', 'B3+Bass'] as const;
/** Pno_kBank 0–5 (piano category). */
export const NE7_PIANO_CATEGORY = ['Grand', 'Upright', 'Electric', 'Clavinet', 'Digital', 'Misc'] as const;
/** Syn_kAnalogMainWaveform 0–5. */
export const NE7_ANALOG_MAIN_WAVE = ['Triangle', 'Saw', 'Square', 'Pulse33', 'Pulse10', 'SuperSaw'] as const;
/** Syn_kAnalogAuxWaveform 0–6. */
export const NE7_ANALOG_AUX_WAVE = ['Off', 'Triangle', 'Saw', 'Square', 'Pulse33', 'Pulse10', 'Noise'] as const;

/** Organ models that use Hammond drawbar footage (B3, Soft B3, B3+Bass). */
const B3_MODELS = new Set([0, 4, 5]);

export const NE7_PROVISIONAL_NOTE =
  'Electro 7: OpenNord’s program map (OS 1.30), block order not yet confirmed on a real file — treat these values as provisional.';

type Get = (key: string) => number | undefined;

function sectionFx(g: Get, blk: string): string[] {
  const on = parts(
    g(`${blk}.fx1Enable`) ? 'Effect 1' : undefined,
    g(`${blk}.fx2Enable`) ? 'Effect 2' : undefined,
    g(`${blk}.dlyEnable`) ? 'Delay' : undefined,
    g(`${blk}.ampEnable`) ? 'Amp' : undefined,
    g(`${blk}.cmpEnable`) ? 'Comp' : undefined,
  );
  return on.length > 0 ? on : ['None on'];
}

function drawbarSet(g: Get, n: 1 | 2 | 3, b3: boolean): DecodedSection {
  const blk = `organDrawbars${n}`;
  const bars = Array.from({ length: 9 }, (_, i) => g(`${blk}.drawbarValue${i + 1}`) ?? 0);
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

export function ne7Decoded(
  bytes: Uint8Array,
  resolvePianoName?: (hash: number) => string | undefined,
): DecodedProgram {
  const p = decodeNe7(bytes);
  const title = 'Nord Electro 7 · Program';
  if (!p.layoutMatched) {
    return { title, header: fwHeader(p), sections: [], note: `${headerOnlyNote('Electro 7')} ${NE7_PROVISIONAL_NOTE}`, warnings: p.warnings };
  }
  const v = p.values as Record<string, number | undefined>;
  const g: Get = (k) => v[k];

  const header = fwHeader(p);
  const transpose = transposeText(g('common.transposeEnable'), g('common.transposeValue'));
  if (transpose) header.push(['Transpose', transpose]);
  const pianoHash = g('piano.nameHash');
  if (pianoHash !== undefined) header.push(['Piano sound id', hexId(pianoHash)]);

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

  const category = label(NE7_PIANO_CATEGORY, g('piano.bank'));
  const pianoName = pianoHash !== undefined ? resolvePianoName?.(pianoHash) : undefined;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [
      {
        label: 'Piano',
        parts: parts(pianoName ?? category ?? 'Piano', pianoName && category, levelPart(g('piano.level')),
          octavePart(g('piano.octaveShift')), !g('piano.isEnabled') && '(off)'),
      },
      { label: 'Effects', parts: sectionFx(g, 'pianoFx') },
    ],
    chips: parts(g('piano.enableStringRes') ? 'String Res' : undefined),
  };

  const mainWave = label(NE7_ANALOG_MAIN_WAVE, g('synthPreset.analogMainWaveform'));
  const auxWave = label(NE7_ANALOG_AUX_WAVE, g('synthPreset.analogAuxWaveform'));
  const algo = g('synthPreset.fmAlgorithm');
  const synth: DecodedSection = {
    id: 'S', label: 'SYNTH',
    engines: [
      {
        label: 'Synth',
        parts: parts(levelPart(g('synth.level')), octavePart(g('synth.octaveShift')), !g('synth.isEnabled') && '(off)'),
      },
      {
        label: 'Preset',
        parts: parts(
          mainWave && `Analog ${mainWave}${auxWave && auxWave !== 'Off' ? ` + ${auxWave}` : ''}`,
          algo !== undefined && algo <= 9 ? `FM Algorithm ${algo + 1}` : undefined,
        ),
      },
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
