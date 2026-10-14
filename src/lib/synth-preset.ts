/**
 * Stage 3 and Stage 2 synth presets (`.ns3y`, `.ns2s`): the one table of what
 * each tag is read with — its model's reader (ns3/preset.ts, ns2/preset.ts),
 * synth card and layout (for the decode inspector's byte map). Stage 4 presets
 * go through ns4/preset.ts instead.
 */
import type { SynthEngineCard } from './clavia/engine-view';
import type { ProgramLayout } from './contribute/coverage';
import { identifyNordFile } from './clavia/nord-file';
import { decodeNs3SynthPreset, NS3_SYNTH_PRESET_LAYOUT } from './ns3/preset';
import { ns3SynthPresetCard } from './ns3/view';
import { decodeNs2SynthPreset, NS2_SYNTH_PRESET_LAYOUT } from './ns2/preset';
import { ns2SynthPresetCard } from './ns2/view';

export interface SynthPresetRead {
  model: 'Nord Stage 3' | 'Nord Stage 2';
  /** Sound source and filter type, the way a Stage 4 preset row reads ("Sample · LP24"). */
  headline: string;
  /** The synth card (a sample oscillator reads "Sample" until the panel puts in the resolved name); null when the body is not laid out as this model's synth preset. */
  card: SynthEngineCard | null;
  /** The sample's id for the Stage 2/3 factory catalog (ns3/library/service.ts), when the oscillator plays a sample. */
  sampleId?: number;
  warnings: readonly string[];
}

interface SynthPresetSpec {
  model: SynthPresetRead['model'];
  layout: ProgramLayout;
  /** The card (null when the body does not fit the layout), the sample's id and the reader's warnings. */
  read: (bytes: Uint8Array) => { card: SynthEngineCard | null; sampleId: number; warnings: readonly string[] };
}

const SPECS: Record<string, SynthPresetSpec> = {
  ns3y: {
    model: 'Nord Stage 3',
    layout: { kind: 'fw', layout: NS3_SYNTH_PRESET_LAYOUT },
    read: (bytes) => {
      const p = decodeNs3SynthPreset(bytes);
      return { card: p.synth && ns3SynthPresetCard(p.synth), sampleId: p.synth?.sampleId ?? 0, warnings: p.warnings };
    },
  },
  ns2s: {
    model: 'Nord Stage 2',
    layout: { kind: 'legacy', layout: NS2_SYNTH_PRESET_LAYOUT },
    read: (bytes) => {
      const p = decodeNs2SynthPreset(bytes);
      return { card: ns2SynthPresetCard(p.synth), sampleId: p.synth.sampleId, warnings: p.warnings };
    },
  },
};

const specFor = (tag: string): SynthPresetSpec | undefined => (Object.hasOwn(SPECS, tag) ? SPECS[tag] : undefined);

/** The layout a synth preset tag is stored with, or undefined for any other tag. */
export function synthPresetLayout(tag: string): ProgramLayout | undefined {
  return specFor(tag)?.layout;
}

/**
 * Read a Stage 3 or Stage 2 synth preset; null for any other file. A preset whose
 * body does not fit its layout comes back with no card, its warnings saying why. Never throws.
 */
export function readSynthPreset(bytes: Uint8Array, tag = identifyNordFile(bytes).tag): SynthPresetRead | null {
  const spec = specFor(tag);
  if (!spec) return null;
  const r = spec.read(bytes);
  const synth = r.card?.synth;
  return {
    model: spec.model,
    headline: synth ? [synth.osc, synth.filterType].filter(Boolean).join(' · ') : '',
    card: r.card,
    // A name hash of 0 is unknown (a Stage 2 record from before version 6), not a sample to look up.
    sampleId: synth?.source === 'sample' && r.sampleId !== 0 ? r.sampleId : undefined,
    warnings: r.warnings,
  };
}
