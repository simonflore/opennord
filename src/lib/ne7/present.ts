/**
 * Nord Electro 7 → DecodedProgram — block order not yet
 * confirmed on a real file (see types.ts). Every decoded program says so in its
 * note.
 *
 * Display labels are the Electro 7's own pointer arrays in the OS 1.30 image:
 * organ model and piano category. The firmware has no text
 * labels for Fx1, Fx2, Amp or Reverb types (probably drawn as graphics), so
 * effect types show as their stored number, beside each effect's settings. The embedded synth preset stores the analog
 * waveforms and the FM algorithm side by side; only the active mode's sound is
 * shown. `Syn_kMode` 0 = Sample is confirmed (it reloads the sample); 1 = Analog
 * and 2 = FM are likely, and say so. Oscillator
 * labels: the OS 1.30 lists.
 */
import { decodeNe7 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import {
  DRAWBAR_NUMBERS, fwHeader, fxGroupsSection, fxKnobs, fxParam, fxStored, fxType, headerOnly, label, levelPart, octavePart, parts, pianoParts,
  singleSplit, soundIdRow, splitSide, splitText, SPLIT_NOTES_F2_TO_F6, transposeText, type PianoNameResolver,
} from '../clavia/fw-present';
import type { FxUnitView } from '../clavia/fx-view';
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
  'Electro 7: OpenNord’s program map (OS 1.30), block order not yet confirmed on a real file — treat these values as provisional.';

type Get = (key: Ne7FieldKey) => number | undefined;

/**
 * One engine's effect chain. The Electro 7 has no effect-type tables here yet,
 * so types show as stored. Ranges are the registry's (OS 1.30).
 */
function chainUnits(g: Get, blk: 'organFx' | 'pianoFx' | 'synthFx'): FxUnitView[] {
  const e = (k: string) => g(`${blk}.${k}` as Ne7FieldKey);
  const on = (k: string) => e(k) === 1;
  return [
    {
      key: `${blk}-fx1`, label: 'Effect 1', on: on('fx1Enable'), type: fxType([], e('fx1Type')),
      params: fxKnobs(fxParam('Rate', e('fx1Rate'), 0, 127), fxParam('Amount', e('fx1Amt'), 0, 127)),
    },
    {
      key: `${blk}-fx2`, label: 'Effect 2', on: on('fx2Enable'), type: fxType([], e('fx2Type')),
      params: fxKnobs(fxParam('Rate', e('fx2Rate'), 0, 127), fxParam('Amount', e('fx2Amt'), 0, 127)),
      switches: [{ label: 'Mono', on: on('fx2Mono') }],
    },
    {
      key: `${blk}-dly`, label: 'Delay', on: on('dlyEnable'),
      params: fxKnobs(
        fxParam('Rate', e('dlyRate'), 0, 16383), fxParam('Mix', e('dlyMix'), 0, 127), fxParam('Feedback', e('dlyFeedback'), 0, 127),
        // Filter (0–3), ping pong (0–3) and mode (0–1) are stored settings with no names yet.
        fxStored('Filter', e('dlyFltType')), fxStored('Ping Pong', e('dlyPingPong')), fxStored('Mode', e('dlyMode')),
      ),
    },
    {
      key: `${blk}-amp`, label: 'Amp/EQ', on: on('ampEnable'), type: fxType([], e('ampType')),
      params: fxKnobs(
        fxParam('Drive', e('ampDrive'), 0, 127), fxParam('Bass', e('ampBass'), -60, 60), fxParam('Mid', e('ampMid'), -60, 60),
        fxParam('Mid Freq', e('ampMidFreq'), 0, 127), fxParam('Treble', e('ampTreble'), -60, 60),
      ),
    },
    { key: `${blk}-cmp`, label: 'Comp', on: on('cmpEnable'), params: fxKnobs(fxParam('Amount', e('cmpAmt'), 0, 127)) },
    {
      // The program's one reverb, with this engine's own amount.
      key: `${blk}-rvb`, label: 'Reverb', on: g('common.rvbEnable') === 1, type: fxType([], g('common.rvbType')),
      params: fxKnobs(fxParam('Amount', e('rvbAmt'), 0, 127), fxStored('Color', g('common.rvbColor'))),
      switches: [{ label: 'Chorale', on: g('common.rvbChorale') === 1 }],
    },
  ];
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
  const splitOn = g('common.splitEnable') === 1;
  const splitNote = label(SPLIT_NOTES_F2_TO_F6, g('common.splitPosition'));

  const header = [
    ...fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue'))),
    ['Split', splitText(splitOn, splitNote, g('common.splitWidth'))] as [string, string],
    ...soundIdRow('Piano sound id', g('piano.nameHash')),
    ...(g('synthPreset.mode') === 0 ? soundIdRow('Synth sample id', g('synthPreset.smpNameHash')) : []),
  ];
  const keyboard = singleSplit(splitOn, splitNote, g('common.splitWidth'), [
    { kind: 'organ', id: '', on: g('organ.isEnabled') === 1, side: splitSide(g('organ.kbdZone')) },
    { kind: 'piano', id: '', on: g('piano.isEnabled') === 1, side: splitSide(g('piano.kbdZone')) },
    { kind: 'synth', id: '', on: g('synth.isEnabled') === 1, side: splitSide(g('synth.kbdZone')) },
  ]);

  const model = g('organ.organModel');
  const organ: DecodedSection = {
    id: 'O', label: 'ORGAN',
    engines: [
      {
        label: 'Organ',
        parts: parts(label(NE7_ORGAN_MODEL, model) ?? 'Organ', levelPart(g('organ.level')),
          octavePart(g('organLayerA.octaveShift')), !g('organ.isEnabled') && '(off)'),
      },
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
    ],
  };

  return {
    title, header, keyboard,
    sections: [
      organ, drawbarSet(g, 1, b3), drawbarSet(g, 2, b3), drawbarSet(g, 3, b3),
      piano, synth,
      fxGroupsSection([
        ...([
          ['organFx', 'Organ', 'organ', g('organ.isEnabled')], ['pianoFx', 'Piano', 'piano', g('piano.isEnabled')],
          ['synthFx', 'Synth', 'synth', g('synth.isEnabled')],
        ] as const).filter(([, , , enabled]) => enabled === 1)
          .map(([blk, label, kind]) => ({ key: blk, label, kind, units: chainUnits(g, blk) })),
        {
          key: 'rotary', label: 'Rotary', kind: 'organ' as const,
          units: [{
            key: 'rotary', label: 'Rotary', on: g('common.rotaryEnable') === 1,
            params: fxKnobs(
              fxParam('Drive', g('common.rotaryDriveAmount'), 0, 127),
              // Speed (0–2) and source (0–2) are stored settings with no names yet.
              fxStored('Speed', g('common.rotarySpeed')),
              fxStored('Source', g('common.rotarySource')),
            ),
          }],
        },
      ]),
    ],
    note: NE7_PROVISIONAL_NOTE,
    warnings: p.warnings,
  };
}
