/**
 * Small presentation helpers shared by the firmware-layout readers (Stage 3,
 * Grand, Grand 2, Piano 4/5/6, Electro 6/7, Organ 3, Wave 2 — see block-chain.ts)
 * and the legacy-record ones (Electro 3, C2D, Wave, Lead A1 — legacy-record.ts;
 * Electro 5, Piano 2 / 3, Nord Piano, C2, Stage Classic / EX — legacy-program.ts).
 * They turn decoded values into the musician-facing fragments the shared
 * DecodedProgramView shows.
 * Pure; model → clavia.
 */
import type { FwProgram } from './block-chain';
import type { DecodedProgram, DecodedSection, KeyboardZonesView } from './decoded';
import type { KeyItem } from './engine-view';
import type { FxGroupView, FxParamView, FxUnitView } from './fx-view';

/** Drawbar numbers 1–9, for reading a set of `drawbarValue1…9` fields. */
export const DRAWBAR_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** The label for an enum value, or undefined when the value has no known label. */
export function label(table: readonly string[], v: number | undefined): string | undefined {
  return v === undefined ? undefined : table[v];
}

/** "Oct +1" / "Oct −2", or undefined for 0 / unknown. */
export function octavePart(v: number | undefined): string | undefined {
  if (!v) return undefined;
  return `Oct ${v > 0 ? '+' : '−'}${Math.abs(v)}`;
}

/** "variation 2"… for a non-zero piano `Variation` (the piano's sub-variant, 0–3), else undefined. */
export function variationPart(v: number | undefined): string | undefined {
  return v ? `variation ${v + 1}` : undefined;
}

/** "level 100", or undefined when unknown. */
export function levelPart(v: number | undefined): string | undefined {
  return v === undefined ? undefined : `level ${v}`;
}

/** A 32-bit identifier as fixed-width hex. */
export function hexId(n: number): string {
  return `0x${(n >>> 0).toString(16).padStart(8, '0')}`;
}

/** Drop undefined fragments. */
export function parts(...xs: (string | undefined | false)[]): string[] {
  return xs.filter((x): x is string => typeof x === 'string' && x.length > 0);
}

/** "+2 semitones" for an enabled transpose, else undefined. */
export function transposeText(enabled: number | undefined, value: number | undefined): string | undefined {
  if (!enabled || !value) return undefined;
  return `${value > 0 ? '+' : '−'}${Math.abs(value)} semitone${Math.abs(value) === 1 ? '' : 's'}`;
}

/** The family-wide piano-name lookup (32-bit `NameHash` → name), injected by presenters.ts. */
export type PianoNameResolver = (hash: number) => string | undefined;

/**
 * A piano's identity: its name from the hash (else the type label, else "Piano"),
 * the type after a resolved name, then a non-zero variation.
 */
export function pianoParts(
  hash: number | undefined, type: string | undefined, variation: number | undefined, resolve?: PianoNameResolver,
): string[] {
  const name = hash === undefined ? undefined : resolve?.(hash);
  return parts(name ?? type ?? 'Piano', name && type, variationPart(variation));
}

/** A header row with a 32-bit sound id in hex, or no row when the id wasn't read. */
export function soundIdRow(title: string, hash: number | undefined): [string, string][] {
  return hash === undefined ? [] : [[title, hexId(hash)]];
}

/** Header rows every firmware-layout reader shows: the version, then the transpose when it is on. */
export function fwHeader(p: Pick<FwProgram<string>, 'version'>, transpose?: string): [string, string][] {
  const rows: [string, string][] = [['Version', `v${p.version}`]];
  if (transpose) rows.push(['Transpose', transpose]);
  return rows;
}

/** The presentation when the block chain did not match the firmware layout: the file header only. */
export function headerOnly(title: string, p: FwProgram<string>, model: string, extraNote?: string): DecodedProgram {
  const note = `${model}: this file's structure didn't match the instrument’s layout, so only the file header is shown.`;
  return { title, header: fwHeader(p), sections: [], note: extraNote ? `${note} ${extraNote}` : note, warnings: p.warnings };
}

/**
 * The presentation when a legacy record (clavia/legacy-record.ts) was not read:
 * the file header only, with the reason in the warnings.
 */
export function legacyHeaderOnly(
  title: string, p: Pick<FwProgram<string>, 'version' | 'warnings'>, model: string, extraNote?: string,
): DecodedProgram {
  const note = `${model}: the program settings in this file couldn't be read, so only the file header is shown.`;
  return { title, header: fwHeader(p), sections: [], note: extraNote ? `${note} ${extraNote}` : note, warnings: p.warnings };
}

/** Two 15-bit reference ids (piano or sample) as one fixed-width hex fingerprint. */
export function refId(ids: readonly [number, number]): string {
  return `0x${((ids[0] * 0x8000 + ids[1]) >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Header rows of the Electro 5 and the ColdFire Piano 2 / 3: the split (on/off,
 * or the text a model that knows its split point passes), then the piano and
 * sample fingerprints.
 */
export function soundRefRows(
  split: number | string, pianoIds: readonly [number, number], sampleIds: readonly [number, number],
): [string, string][] {
  const text = typeof split === 'string' ? split : split ? 'on' : 'off';
  return [['Split', text], ['Piano sound id', refId(pianoIds)], ['Sample sound id', refId(sampleIds)]];
}

// ── Keyboard split (models with one split point) ─────────────────────────────
//
// A Nord split point is not a free note: it is one of a few fixed places on the
// keyboard, the ones with an LED above the keys. The file stores which one.

/**
 * Split positions, as each model's firmware names them (its table of display
 * texts for the split point):
 *  - F2 C3 F3 C4 F4 C5 F5 C6 F6 C7: Stage 3 OS 2.64, Grand 2 OS 1.22;
 *  - the first nine of those, to F6: Electro 7 OS 1.30, Piano 6 OS 1.20, Grand OS 1.68;
 *  - C3 F3 C4 F4 C5 F5 C6: Piano 3 OS 2.04, Piano 4 OS 2.66, Piano 5 OS 1.34;
 *  - the first six of those, to F5: Electro 5 OS 2.04, Electro 6 OS 2.66.
 * (The Stage 4's eleven, C2 to C7, are in ns4/values.generated.ts.)
 */
export const SPLIT_NOTES_FROM_F2 = ['F2', 'C3', 'F3', 'C4', 'F4', 'C5', 'F5', 'C6', 'F6', 'C7'] as const;
/** The nine positions of the Electro 7, Piano 6 and Grand: F2 to F6. */
export const SPLIT_NOTES_F2_TO_F6 = SPLIT_NOTES_FROM_F2.slice(0, 9);
export const SPLIT_NOTES_FROM_C3 = ['C3', 'F3', 'C4', 'F4', 'C5', 'F5', 'C6'] as const;
/** The six positions of the Electro 5 and 6: C3 to F5. */
export const SPLIT_NOTES_C3_TO_F5 = SPLIT_NOTES_FROM_C3.slice(0, 6);
/**
 * Which sound is on which side, where the instrument has one setting for it
 * (Piano 3, Piano 4, Grand): Off, piano below and synth above, or the reverse.
 * Their firmware's texts are "Off", "Pno/Syn" ("Piano/Synth") and "Syn/Pno".
 */
export const SPLIT_SIDES = ['Off', 'Piano / Synth', 'Synth / Piano'] as const;
/** `Edt_Com_kSplitWidth` 0–2: X-Fade Off, 1 and 2 on the panel, worded as the Stage 4's are. */
const SPLIT_XFADE = ['none', '+/- 6 semitones', '+/- 12 semitones'] as const;

/** Which side of the split point a sound plays. */
export type SplitSide = 'lower' | 'upper' | 'both';
/**
 * `Edt_*_kKbdZone` 0–2. The registry default is 1, a sound on the whole keyboard,
 * so 0 and 2 are the two sides; lower first, as the Stage 2's zone table runs
 * (LO, LO UP, UP). Medium: not confirmed on a real file.
 */
export const KBD_ZONE: readonly SplitSide[] = ['lower', 'both', 'upper'];

/** The side a stored zone value names; undefined (the whole keyboard) when it isn't one of the three. */
export const splitSide = (v: number | undefined): SplitSide | undefined => (v === undefined ? undefined : KBD_ZONE[v]);

export interface SplitLayer { kind: 'organ' | 'piano' | 'synth'; id: string; on: boolean; side: SplitSide | undefined }

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
/** The name of a key counted from the lowest of an 88-key keyboard (0 = A0, 39 = C4). */
export function keyName(key: number): string {
  const midi = key + 21;
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** The header's "Split" text: off, or where it is and how wide its crossfade. */
export function splitText(on: boolean, note: string | undefined, width?: number, sides?: string): string {
  if (!on) return 'off';
  const xfade = width === 1 ? ' · crossfade ±6' : width === 2 ? ' · crossfade ±12' : '';
  const where = note ? `at ${note}${xfade}` : 'on';
  return sides ? `${sides} · ${where}` : where;
}

/** The two sounds of a model whose one setting puts them either side (see {@link SPLIT_SIDES}): 1 = piano below. */
export function pianoSynthSides(sides: number, pianoOn: boolean, synthOn: boolean): SplitLayer[] {
  const pianoLower = sides !== 2;
  return [
    { kind: 'piano', id: '', on: pianoOn, side: pianoLower ? 'lower' : 'upper' },
    { kind: 'synth', id: '', on: synthOn, side: pianoLower ? 'upper' : 'lower' },
  ];
}

/**
 * The keyboard map of a program with one split point: the sounds that are on,
 * each on its side of the point. Undefined with the split off (every sound then
 * plays the whole keyboard) or when the position isn't known.
 */
export function singleSplit(
  on: boolean, note: string | undefined, width: number | undefined, layers: SplitLayer[],
): KeyboardZonesView | undefined {
  if (!on || !note) return undefined;
  const playing = (side: SplitSide) => layers
    .filter((l) => l.on && (l.side === undefined || l.side === 'both' || l.side === side))
    .map(({ kind, id }) => ({ kind, id }));
  const lower = { layers: playing('lower') };
  const upper = { layers: playing('upper') };
  const xfade = SPLIT_XFADE[width ?? 0] ?? 'none';
  return {
    hasSplit: true,
    zones: [lower, lower, upper, upper],
    boundaries: [null, note, null],
    xfade: [null, xfade === 'none' ? null : xfade, null],
    transpose: null,
    performance: { sustain: false, kbHold: false },
  };
}

/**
 * Their piano card: the type (labelled from the model's own `types` table), its
 * model number, then the level and "(off)" where the record stores them.
 */
export function coldfirePianoSection(
  types: readonly string[], type: number, model: number, level?: number, on?: number,
): DecodedSection {
  return {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(label(types, type) ?? 'Piano', `no. ${model + 1}`, levelPart(level), on === 0 && '(off)'),
    }],
  };
}

/** Their sample synth card, titled as on the panel ("SAMPLE SYNTH" / "SYNTH"). */
export function sampleSynthSection(
  title: string, s: { sample: number; attack: number; dcyRel: number; level?: number; on?: number },
): DecodedSection {
  return {
    id: 'S', label: title,
    engines: [{
      label: 'Synth',
      parts: parts(`sample ${s.sample + 1}`, levelPart(s.level), `attack ${s.attack}`, `decay/release ${s.dcyRel}`,
        s.on === 0 && '(off)'),
    }],
  };
}

/** The presentation when a legacy record is cut short: the file header only. */
export function shortRecord(
  title: string, header: [string, string][], model: string, warnings: readonly string[],
): DecodedProgram {
  return {
    title, header, sections: [], warnings,
    note: `${model}: this file is shorter than the program record the instrument writes, so only the file header is shown.`,
  };
}

/** How many controls a sound morphs: "none", "1 control", "3 controls". */
export function morphCountPart(n: number): string {
  return n === 0 ? 'none' : `${n} control${n === 1 ? '' : 's'}`;
}

/** "2 of 5": how many of a set of on/off switches are on. */
export function onOf(switches: readonly number[]): string {
  return `${switches.filter((v) => v).length} of ${switches.length}`;
}

/** The effects that are on, or "None on". */
export function noneOn(on: string[]): string[] {
  return on.length > 0 ? on : ['None on'];
}

/** A value's knob position (0–100) across the field's range; undefined when not decoded or the range is empty. */
export function fxFill(v: number | undefined, min: number, max: number): number | undefined {
  if (v === undefined || max <= min) return undefined;
  return Math.max(0, Math.min(100, Math.round(((v - min) / (max - min)) * 100)));
}

/** One knob of an effect unit: the raw number (or `text`, when the model has a label for it) at its position. */
export function fxParam(label: string, v: number | undefined, min: number, max: number, text?: string): FxParamView | undefined {
  if (v === undefined) return undefined;
  return { label, value: text ?? String(v), fill: fxFill(v, min, max) };
}

/** An effect's selected type: its display text, or the stored number when the table does not cover it. */
export function fxType(table: readonly string[], v: number | undefined): string | undefined {
  return label(table, v) ?? (v === undefined ? undefined : String(v));
}

/** A source selector: one LED per engine, the selected one lit. A gap in the table is a stored value the model does not use. */
export function sourceLeds(table: readonly (string | undefined)[], v: number | undefined): KeyItem[] | undefined {
  return v === undefined ? undefined : table.flatMap((label, i) => (label === undefined ? [] : [{ label, on: i === v }]));
}

/** A setting nothing names yet: its stored number as a readout; undefined when the file does not have it. */
export function fxStored(label: string, v: number | undefined): FxParamView | undefined {
  return v === undefined ? undefined : { label, value: String(v) };
}

/** One switch of an effect unit, lit when its 1-bit field is set. */
export function fxSwitch(label: string, v: number | undefined): KeyItem {
  return { label, on: v === 1 };
}

/** An effects card drawn as panel blocks: the instrument's one rack, in panel order. */
export function fxSection(units: FxUnitView[], id = 'FX', title = 'EFFECTS'): DecodedSection {
  return { id, label: title, engines: [], fx: { groups: [{ key: id, label: '', units }] } };
}

/** The settings a file has: drops the ones whose field is not decoded. */
export function fxKnobs(...ps: (FxParamView | undefined)[]): FxParamView[] {
  return ps.filter((p): p is FxParamView => p !== undefined);
}

/** An effects card with several rows: one per engine or layer, plus any shared row. */
export function fxGroupsSection(groups: FxGroupView[], id = 'FX', title = 'EFFECTS'): DecodedSection {
  return { id, label: title, engines: [], fx: { groups } };
}
