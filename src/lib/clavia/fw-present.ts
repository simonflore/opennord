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
import type { DecodedProgram, DecodedSection } from './decoded';

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

/** "Amp Twin", or "Amp" when the type has no label. */
export function ampPart(type: string | undefined): string {
  return parts('Amp', type).join(' ');
}

/** "Reverb Hall Bright": the type and a modifier when known, else just "Reverb". */
export function reverbPart(type: string | undefined, modifier?: string | false): string {
  return parts('Reverb', type, modifier).join(' ');
}

/** Header rows every firmware-layout reader shows: the version, then the transpose when it is on. */
export function fwHeader(p: Pick<FwProgram<string>, 'version'>, transpose?: string): [string, string][] {
  const rows: [string, string][] = [['Version', `v${p.version}`]];
  if (transpose) rows.push(['Transpose', transpose]);
  return rows;
}

/** The presentation when the block chain did not match the firmware layout: the file header only. */
export function headerOnly(title: string, p: FwProgram<string>, model: string, extraNote?: string): DecodedProgram {
  const note = `${model}: this file's structure didn't match the layout read from the firmware, so only the file header is shown.`;
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

/** Header rows of the Electro 5 and the ColdFire Piano 2 / 3: the split, then the piano and sample fingerprints. */
export function soundRefRows(
  split: number, pianoIds: readonly [number, number], sampleIds: readonly [number, number],
): [string, string][] {
  return [['Split', split ? 'on' : 'off'], ['Piano sound id', refId(pianoIds)], ['Sample sound id', refId(sampleIds)]];
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

/** An Amp/Comp selector's setting: "Compressor" / "Rotary" as such, else "Amp <type>". */
export function ampCompPart(type: string | undefined): string {
  return type === 'Compressor' || type === 'Rotary' ? type : ampPart(type);
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
    note: `${model}: this file is shorter than the program record the firmware writes, so only the file header is shown.`,
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

/** An effects card: one "Effects" row listing what is switched on. */
export function effectsSection(on: string[], id = 'FX', title = 'EFFECTS'): DecodedSection {
  return { id, label: title, engines: [{ label: 'Effects', parts: noneOn(on) }] };
}
