/**
 * Nord Electro 3 / 3 HP → DecodedProgram. Values come from the OS 3.14 / HP OS
 * 3.16 descriptor layouts (see decode.ts): which instrument the program plays,
 * the organ model with its Preset I and II registrations, the piano type and
 * its model number, and each instrument's effect switches. The labels are the
 * firmware's own category names for the organ models and piano types; the
 * effect switches are not named yet, so the card counts how many are on.
 * Firmware-derived: the block alignment is not yet confirmed on a real file.
 */
import { decodeNe3 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { label, onOf, parts, shortRecord } from '../clavia/fw-present';
import type { Ne3OrganPreset } from './types';

/** Organ model 0–2 (FUN_30009764 maps them to the B3 / Farf / Vx categories). */
export const NE3_ORGAN_MODELS = ['B3', 'Farfisa', 'Vox'] as const;
/** Piano type 0–5 (categories Grand … Clav/Hps, and User for a sample). */
export const NE3_PIANO_TYPES = ['Grand', 'Upright', 'EPiano', 'Wurl', 'Clav/Hps', 'Sample'] as const;
/** The Electro 3 HP's own names for the same piano types. */
export const NE3_HP_PIANO_TYPES = ['Grand', 'Upright', 'EPiano 1', 'EPiano 2', 'Clav/Hps', 'Sample'] as const;
/** When the file can't tell the two models apart. */
const EITHER_PIANO_TYPES = ['Grand', 'Upright', 'EPiano', 'Wurl / EPiano 2', 'Clav/Hps', 'Sample'] as const;

export const NE3_NOTE =
  'Electro 3: layout from the instrument firmware (OS 3.14, HP OS 3.16), not yet checked on a real file — treat these values as provisional. Every parameter is read; the organ, piano and effect switches are shown.';

function organPreset(id: string, title: string, model: number, p: Ne3OrganPreset, off: boolean): DecodedSection {
  const name = label(NE3_ORGAN_MODELS, model) ?? 'Organ';
  const status = off && '(not playing)';
  if (model === 1) {
    const on = p.farfTabs.flatMap((v, i) => (v ? [String(i + 1)] : []));
    return {
      id, label: title,
      engines: [{ label: 'Organ', parts: parts(name, on.length > 0 ? `tabs ${on.join(' ')}` : 'no tabs on', status) }],
    };
  }
  const bars = model === 2 ? p.voxDrawbars : p.b3Drawbars;
  return {
    id, label: title,
    engines: [{ label: 'Organ', parts: parts(name, bars.join(' '), status) }],
    drawbars: drawbarViews([...bars], model === 0 ? B3_FOOTAGE : undefined),
  };
}

const onCount = (switches: readonly number[]) => `${onOf(switches)} switches on`;

export function ne3Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNe3(bytes);
  const title = p.hp ? 'Nord Electro 3 HP · Program' : 'Nord Electro 3 · Program';
  const header: [string, string][] = [['Version', `v${p.version}`]];
  if (!p.hp) header.push(['Model', 'Electro 3 or 3 HP']);
  if (!p.complete) return shortRecord(title, header, 'Electro 3', p.warnings);
  const organOff = p.focus !== 'organ';
  const types = p.hp ? NE3_HP_PIANO_TYPES : EITHER_PIANO_TYPES;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(label(types, p.pianoType) ?? 'Piano', `model ${p.pianoModel + 1}`, !organOff && '(not playing)'),
    }],
  };
  const effects: DecodedSection = {
    id: 'FX', label: 'EFFECTS',
    engines: [
      { label: 'Organ', parts: [onCount(p.effectSwitches.organ)] },
      { label: 'Piano', parts: [onCount(p.effectSwitches.piano)] },
    ],
  };
  return {
    title, header,
    sections: [
      organPreset('OI', 'ORGAN PRESET I', p.organModel, p.presetI, organOff),
      organPreset('OII', 'ORGAN PRESET II', p.organModel, p.presetII, organOff),
      piano,
      effects,
    ],
    note: NE3_NOTE,
    warnings: p.warnings,
  };
}
