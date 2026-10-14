/**
 * The factory pianos and samples a Stage 4 program can name, by name or by id; which of
 * the panel's piano-type buttons a piano sits under; and the edits that pick a sound.
 *
 * A program names its piano by a 32-bit id and its type (Grand, Upright, Electric,
 * Clav, Digital, Misc); a synth layer names its sample by id and plays it only in
 * samples mode (clavia/sound-id.ts). FACTORY_SOUNDS lists every factory sound with its
 * id. Pure.
 */
import { FACTORY_SOUNDS, type FactorySound } from './factory-sounds.generated';
import { NPNO_PIANO_TYPE as G } from './nsp-write';
import type { RawEdit } from './writer';

export type { FactorySound };

/**
 * A factory piano's catalog group (the piano type a .npno file stores) → the program's
 * `piano type` (0 Grand, 1 Upright, 2 Electric, 3 Clav, 4 Digital, 5 Misc). Only the
 * groups whose button is known: the Clavinet under Clav is confirmed by the regression
 * fixture's Clavinet D6 layer. Electric grands, harpsichords and the other EPs (group
 * 15, `misc` in the .npno table) are left out until a real program shows where the
 * instrument files them.
 */
const PANEL_TYPE_BY_GROUP: Readonly<Record<number, number>> = {
  [G.grand]: 0, [G.upright]: 1, [G.electric]: 2, [G.wurlitzer]: 2, [G.clav]: 3, [G.digital]: 4, [G.mallets]: 5,
};

/** The `piano type` a factory piano is filed under, or undefined when that isn't known yet. */
export function pianoPanelType(sound: FactorySound): number | undefined {
  return sound.kind === 'piano' && sound.group !== undefined ? PANEL_TYPE_BY_GROUP[sound.group] : undefined;
}

let byId: Map<number, FactorySound> | undefined;

/** The factory sound a program's id names, if it is one. */
export function factorySoundById(id: number): FactorySound | undefined {
  byId ??= new Map(FACTORY_SOUNDS.map((s) => [s.id, s]));
  return byId.get(id);
}

/** Factory sounds of `kind` whose library name contains every word of `query` (case-insensitive). */
export function findFactorySounds(kind: FactorySound['kind'], query = ''): FactorySound[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return FACTORY_SOUNDS.filter((s) => {
    if (s.kind !== kind) return false;
    const name = s.library.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}

/** The setting that picks a sound of each kind, and the one that must go with it. */
const SOUND_SETTING = {
  piano: { group: 'p', name: 'piano model ID/name', with: 'piano type' },
  sample: { group: 'y', name: 'sample ID/name', with: 'samples/analog' },
} as const;

/** The kind of sound an edit of `group:name` picks, if it picks one. */
export function soundKindOf(group: string, name: string): FactorySound['kind'] | undefined {
  return (Object.keys(SOUND_SETTING) as FactorySound['kind'][])
    .find((k) => SOUND_SETTING[k].group === group && SOUND_SETTING[k].name === name);
}

/**
 * The edit a sound depends on when a program picks it on `layer`: a piano's type (the
 * button it is filed under), or a synth layer's samples mode. A reason instead when the
 * id is not a factory sound of `kind`, or its button isn't known yet.
 */
export function soundCompanionEdit(kind: FactorySound['kind'], id: number, layer: number):
  { sound: FactorySound; edit: RawEdit } | { error: string } {
  const sound = factorySoundById(id);
  if (!sound || sound.kind !== kind) return { error: `${id} is not a factory ${kind}'s id` };
  const value = kind === 'piano' ? pianoPanelType(sound) : 0; // samples/analog 0 = samples
  if (value === undefined) {
    return { error: `${sound.library}: which piano button it sits under is not known yet, so it can't be picked` };
  }
  const s = SOUND_SETTING[kind];
  return { sound, edit: { group: s.group, name: s.with, layer, value } };
}
