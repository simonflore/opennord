import { fileTagInfo } from './file-tags';
import type { NordModelId } from './partitions';

/** Organ/Piano/Synth preset partition kinds (the Stage-line preset banks). */
export type PresetKind = 'organ-preset' | 'piano-preset' | 'synth-preset';

const PRESET_KINDS: ReadonlySet<string> = new Set<PresetKind>(['organ-preset', 'piano-preset', 'synth-preset']);
/** The preset browser covers the Stage 2 / 3 / 4 banks only (no reader for the others' presets). */
const STAGE_LINE: ReadonlySet<NordModelId> = new Set<NordModelId>(['stage-2', 'stage-2-ex', 'stage-3', 'stage-4']);

/** Map a CBIN tag to its preset kind (clavia/file-tags.ts), or undefined if the
 *  tag isn't a Stage 2 / 3 / 4 preset: organ `ns4o`, piano `ns4n`, synth
 *  `ns4y` / `ns3y` / `ns2s`. Recognition only — no decode. */
export function presetKindForTag(tag: string): PresetKind | undefined {
  const t = fileTagInfo(tag);
  return t && PRESET_KINDS.has(t.kind) && STAGE_LINE.has(t.models[0]) ? (t.kind as PresetKind) : undefined;
}
