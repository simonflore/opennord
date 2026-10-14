/**
 * Stage 3 synth preset (`.ns3y`) reader.
 *
 * A synth preset is a Stage 3 program body cut down to one block: the u32 format
 * version, then the `A:Synth` block (53 bytes) exactly as it sits in a `.ns3f`
 * (NS3_LAYOUT block `synthA`). So the preset reads with the program's own Synth
 * fields: oscillator, filter, envelopes, LFO, arpeggiator, voice and the sample's
 * name hash. The synth's level, keyboard zone and preset name live in the
 * program's SynthCommon block and are not part of a preset. Checked on the four
 * `.ns3y` in fixtures/ (102 bytes, format 3.00): the chain walks to the end with
 * one 53-byte block and every field is inside its range.
 */
import { decodeFwProgram, type FwLayout } from '../clavia/block-chain';
import { NS3_LAYOUT, type Ns3FieldKey } from './layout.generated';
import { ns3SynthOf, type Ns3Synth } from './decode';

const SYNTH_BLOCK = NS3_LAYOUT.blocks.findIndex((b) => b.key === 'synthA');

/** The program layout narrowed to the one block a synth preset carries, placed right after the format version. */
export const NS3_SYNTH_PRESET_LAYOUT: FwLayout<Ns3FieldKey> = {
  ...NS3_LAYOUT,
  unit: 'synth preset',
  bodyBytes: 4 + 1 + NS3_LAYOUT.blocks[SYNTH_BLOCK].length,
  blocks: [{ ...NS3_LAYOUT.blocks[SYNTH_BLOCK], offset: 4 }],
  fields: NS3_LAYOUT.fields.filter((f) => f.block === SYNTH_BLOCK).map((f) => ({ ...f, block: 0 })),
};

export interface Ns3SynthPreset {
  /** The body's u32 format version (×100), or null when the body is too short. */
  readonly formatVersion: number | null;
  /** True when the body is the one Synth block and its fields were read. */
  readonly layoutMatched: boolean;
  /** The Synth block's fields by program key (`synthA.*`). */
  readonly values: Partial<Record<Ns3FieldKey, number>>;
  /** The synth, read as the Program view reads panel A's; null when the layout did not match. */
  readonly synth: Ns3Synth | null;
  readonly warnings: readonly string[];
}

/** Decode a Stage 3 synth preset. Never throws. */
export function decodeNs3SynthPreset(bytes: Uint8Array): Ns3SynthPreset {
  const fw = decodeFwProgram(bytes, NS3_SYNTH_PRESET_LAYOUT);
  return {
    formatVersion: fw.formatVersion,
    layoutMatched: fw.layoutMatched,
    values: fw.values,
    synth: fw.layoutMatched ? ns3SynthOf(fw.values) : null,
    warnings: fw.warnings,
  };
}
