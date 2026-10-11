/**
 * Nord Organ 3 → DecodedProgram — block order not yet
 * confirmed on a real file (see types.ts). Every decoded program says so in its
 * note.
 *
 * Display labels are the Organ 3's own tables in the OS 1.00 image: organ
 * model, bass model, speaker, ModFx, reverb type and colour. Which manual is
 * upper is not established, so the manuals are labelled A and B.
 */
import { decodeNo3 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { DRAWBAR_NUMBERS, effectsSection, fwHeader, headerOnly, label, parts, transposeText } from '../clavia/fw-present';
import type { No3FieldKey } from './layout.generated';

/** kOrganModel 0–4. */
export const NO3_ORGAN_MODEL = ['B3', 'Vx', 'Farf', 'Soft B3', 'Pipe'] as const;
/** kBassModel 0–8. */
export const NO3_BASS_MODEL = ['B3 1', 'B3 2', 'Trk 1', 'Trk 2', 'Vx', 'Farf', 'Pipe', 'Soft B3', 'Preset'] as const;
/** kSpeakerModel 0–4. */
export const NO3_SPEAKER = ['Clean', 'JC', 'Brit', 'Twin', 'Rotary'] as const;
/** kModFxType 0–4. */
export const NO3_MODFX = ['Phaser', 'Tremolo', 'Ring Modulator', 'Flanger', 'Chorus'] as const;
/** kReverbType 0–5. */
export const NO3_REVERB = ['Spring', 'Booth', 'Room', 'Stage', 'Hall', 'Cathedral'] as const;
/** kReverbColor 0–2. */
export const NO3_REVERB_COLOR = ['Normal', 'Dark', 'Bright'] as const;

/** Organ models that use Hammond drawbar footage (B3, Soft B3). */
const B3_MODELS = new Set([0, 3]);

export const NO3_PROVISIONAL_NOTE =
  'Organ 3: OpenNord’s program map (OS 1.00), block order not yet confirmed on a real file — treat these values as provisional.';

type Get = (key: No3FieldKey) => number | undefined;

function manual(g: Get, id: 'A' | 'B', b3: boolean): DecodedSection {
  const bars = DRAWBAR_NUMBERS.map((i) => g(`manual${id}Drawbar.drawbarValue${i}`) ?? 0);
  return {
    id: `M${id}`, label: `MANUAL ${id}`,
    engines: [{ label: 'Drawbars', parts: [bars.join(' ')] }],
    drawbars: drawbarViews(bars, b3 ? B3_FOOTAGE : undefined),
    chips: parts(g(`manual${id}ModeAndLayer.vibratoEnable`) ? 'Vibrato' : undefined),
  };
}

export function no3Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNo3(bytes);
  const title = 'Nord Organ 3 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Organ 3', NO3_PROVISIONAL_NOTE);
  const g: Get = (k) => p.values[k];

  const header = fwHeader(p, transposeText(g('common.transposeEnable'), g('common.programTranspose')));

  const model = g('common.organModel');
  const b3 = model !== undefined && B3_MODELS.has(model);
  const organ: DecodedSection = {
    id: 'O', label: 'ORGAN',
    engines: [{ label: 'Organ', parts: [label(NO3_ORGAN_MODEL, model) ?? 'Organ'] }],
    chips: parts(g('modeSpecific.percussionEnable') ? 'Percussion' : undefined),
  };

  const bassBars = [g('bassDrawbar.bassDrawbarValue1') ?? 0, g('bassDrawbar.bassDrawbarValue2') ?? 0];
  const bass: DecodedSection = {
    id: 'BS', label: 'BASS',
    engines: [{ label: 'Bass', parts: [label(NO3_BASS_MODEL, g('common.bassModel')) ?? 'Bass'] }],
    drawbars: drawbarViews(bassBars),
  };

  const speaker = label(NO3_SPEAKER, g('common.speakerModel'));
  const modFx = label(NO3_MODFX, g('common.modFxType'));
  const reverb = label(NO3_REVERB, g('common.reverbType'));
  const color = label(NO3_REVERB_COLOR, g('common.reverbColor'));

  return {
    title, header,
    sections: [
      organ, manual(g, 'A', b3), manual(g, 'B', b3), bass,
      effectsSection(parts(
        g('common.speakerEnable') ? `Speaker ${speaker ?? ''}`.trim() : undefined,
        g('common.modFxEnable') ? modFx ?? 'Mod FX' : undefined,
        g('common.delayEnable') ? 'Delay' : undefined,
        g('common.eqEnable') ? 'EQ' : undefined,
        g('common.reverbEnable')
          ? `Reverb ${reverb ?? ''}${color && color !== 'Normal' ? ` ${color}` : ''}`.trim() : undefined,
      )),
    ],
    note: NO3_PROVISIONAL_NOTE,
    warnings: p.warnings,
  };
}
