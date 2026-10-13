import { useMemo } from 'react';
import { decodeNs3, type Ns3Panel } from '../../lib/ns3/decode';
import { ns3EngineCards, ns3FxPanel, ns3HeaderView, ns3SampleKey, ns3SampleRefs, ns3Zones } from '../../lib/ns3/view';
import { BandedProgramView, useResolvedSampleNames, type ProgramBand } from './BandedProgramView';

/**
 * Stage 3 program view — full per-engine cards (parity with Stage 4) via the shared
 * BandedProgramView. ns3's structure is two independent panels (A/B), each its own
 * labelled band, with the keyboard split map above them. No layer scenes. Effects
 * are per panel, drawn on the shared effects panel.
 */
export function Ns3ProgramView({ bytes, name }: { bytes: Uint8Array; name?: string }) {
  const { panels, split, name: decodedName, warnings } = useMemo(() => decodeNs3(bytes), [bytes]);
  const names = useResolvedSampleNames(() => resolveNs3Names(panels), [panels]);

  const bands: ProgramBand[] = panels.map((panel) => ({
    id: panel.id,
    label: `PANEL ${panel.id}`,
    cards: ns3EngineCards(panel, names),
  }));

  return (
    <BandedProgramView
      // The ns3 body carries no name (it lives in the filename), so decodeNs3
      // returns undefined — prefer the filename-derived name the caller passes.
      header={ns3HeaderView(bytes, name ?? decodedName, panels)}
      bands={bands}
      fx={ns3FxPanel(panels)}
      sampleRefs={ns3SampleRefs(panels, names)}
      warnings={warnings}
      zones={ns3Zones(panels, split)}
    />
  );
}

/** Lazy resolver: pull the ~1.3 MB catalog only when a Stage 3 program is shown. */
async function resolveNs3Names(panels: Ns3Panel[]): Promise<Record<string, string>> {
  const { resolveSample } = await import('../../lib/ns3/library/service');
  const out: Record<string, string> = {};
  for (const p of panels) {
    if (p.piano.on) {
      const r = resolveSample(p.piano.sampleId, p.piano.sampleVariation);
      if (r) out[ns3SampleKey(p.id, 'Piano')] = r.version ? `${r.name} ${r.version}` : r.name;
    }
    if (p.synth.on && p.synth.oscillator.type === 'Sample') {
      const r = resolveSample(p.synth.sampleId, 0);
      if (r) out[ns3SampleKey(p.id, 'Synth')] = r.name;
    }
  }
  return out;
}
