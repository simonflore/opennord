import { useMemo } from 'react';
import { decodeNs2, type Ns2Slot } from '../../lib/ns2/decode';
import {
  ns2EngineCards, ns2SlotFxChips, ns2GlobalFxChips, ns2HeaderView, ns2SampleRefs, ns2SampleKey,
} from '../../lib/ns2/view';
import { BandedProgramView, useResolvedSampleNames, type ProgramBand } from './BandedProgramView';

/**
 * Stage 2 program view — full per-engine cards via the shared BandedProgramView.
 * ns2's structure is two slots (A/B), each a complete sound with its own engines +
 * FX, plus program-global FX (reverb/compressor) shown in a single global row.
 */
export function Ns2ProgramView({ bytes }: { bytes: Uint8Array }) {
  const { slots, globalFx } = useMemo(() => decodeNs2(bytes), [bytes]);
  const active = useMemo(() => slots.filter((s) => s.active), [slots]);
  const names = useResolvedSampleNames(() => resolveNs2Names(active), [active]);

  const bands: ProgramBand[] = active.map((slot) => ({
    id: slot.id,
    label: `SLOT ${slot.id}`,
    cards: ns2EngineCards(slot, names),
    fxChips: ns2SlotFxChips(slot),
  }));

  return (
    <BandedProgramView
      header={ns2HeaderView(bytes, active)}
      bands={bands}
      globalFxChips={ns2GlobalFxChips(globalFx)}
      sampleRefs={ns2SampleRefs(active, names)}
    />
  );
}

/** Lazy resolver — ns2 reuses the shared nsmp catalog via the ns3 service. */
async function resolveNs2Names(slots: Ns2Slot[]): Promise<Record<string, string>> {
  const { resolveSample } = await import('../../lib/ns3/library/service');
  const out: Record<string, string> = {};
  for (const s of slots) {
    if (s.piano.on) {
      const r = resolveSample(s.piano.sampleId, s.piano.clavVariation);
      if (r) out[ns2SampleKey(s.id, 'Piano')] = r.version ? `${r.name} ${r.version}` : r.name;
    }
    if (s.synth.on && s.synth.osc === 'SAMPLE') {
      const r = resolveSample(s.synth.sampleId, 0);
      if (r) out[ns2SampleKey(s.id, 'Synth')] = r.name;
    }
  }
  return out;
}
