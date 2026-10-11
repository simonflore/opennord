/**
 * Small presentation helpers shared by the firmware-layout readers (Grand,
 * Piano 6, Electro 7, Organ 3 — see block-chain.ts). They turn decoded values
 * into the musician-facing fragments the shared DecodedProgramView shows.
 * Pure; model → clavia.
 */
import type { FwProgram } from './block-chain';
import type { DecodedSection } from './decoded';

/** The label for an enum value, or undefined when the value has no known label. */
export function label(table: readonly string[], v: number | undefined): string | undefined {
  return v === undefined ? undefined : table[v];
}

/** "Oct +1" / "Oct −2", or undefined for 0 / unknown. */
export function octavePart(v: number | undefined): string | undefined {
  if (!v) return undefined;
  return `Oct ${v > 0 ? '+' : '−'}${Math.abs(v)}`;
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

/** Header rows every firmware-layout reader shows. */
export function fwHeader(p: FwProgram<string>): [string, string][] {
  return [['Version', `v${p.version}`]];
}

/** The note shown when the block chain did not match, so only the header is known. */
export function headerOnlyNote(model: string): string {
  return `${model}: this file's structure didn't match the instrument’s layout, so only the file header is shown.`;
}

/** An effects card: one "Effects" row listing what is switched on. */
export function effectsSection(on: string[], id = 'FX', title = 'EFFECTS'): DecodedSection {
  return { id, label: title, engines: [{ label: 'Effects', parts: on.length > 0 ? on : ['None on'] }] };
}
