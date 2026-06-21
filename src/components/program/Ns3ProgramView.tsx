import { useEffect, useMemo, useState } from 'react';
import '../../styles/nord.css';
import { decodeNs3, type Ns3Panel } from '../../lib/ns3/decode';
import { ns3EngineCards, ns3FxChips, ns3HeaderView, ns3SampleKey } from '../../lib/ns3/view';
import { ProgramHeader } from './ProgramHeader';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';

const SAMPLE_LIBRARY = 'https://www.nordkeyboards.com/sounds/sample-library/';

/**
 * Stage 3 Program view — full per-engine cards (parity with the Stage 4 view) driven
 * by ns3/view.ts. ns3's structure is two independent panels (A/B), each a complete
 * sound with its own engines + FX, so each panel is its own labelled band. No layer
 * scenes, morphs, or keyboard zones (not in the Stage 3 decode).
 */
export function Ns3ProgramView({ bytes }: { bytes: Uint8Array }) {
  const { panels, name } = useMemo(() => decodeNs3(bytes), [bytes]);
  const names = useNs3SampleNames(panels);

  return (
    <div className="ps">
      <ProgramHeader header={ns3HeaderView(bytes, name, panels)} />
      {panels.map((panel) => (
        <PanelBand key={panel.id} panel={panel} names={names} />
      ))}
      <SampleStrip panels={panels} names={names} />
    </div>
  );
}

function PanelBand({ panel, names }: { panel: Ns3Panel; names: Record<string, string> }) {
  const cards = ns3EngineCards(panel, names);
  const chips = ns3FxChips(panel);
  return (
    <section className="ps-panel">
      <div className="ps-panel-lbl">PANEL {panel.id}</div>
      <div className="ps-grid">
        {cards.map((card) => <EngineCard key={`${panel.id}-${card.kind}`} card={card} />)}
      </div>
      <FxRow chips={chips} title="FX" />
    </section>
  );
}

/** The "you need these" factory-sample list (programs reference samples, never embed them). */
function SampleStrip({ panels, names }: { panels: Ns3Panel[]; names: Record<string, string> }) {
  const refs: { key: string; label: string }[] = [];
  for (const p of panels) {
    const piano = names[ns3SampleKey(p.id, 'Piano')];
    if (p.piano.on && piano) refs.push({ key: `${p.id}-pno`, label: piano });
    const synth = names[ns3SampleKey(p.id, 'Synth')];
    if (p.synth.on && p.synth.oscillator.type === 'Sample' && synth) refs.push({ key: `${p.id}-syn`, label: synth });
  }
  if (refs.length === 0) return null;
  return (
    <div className="ps-deps">
      <div className="ps-deps-t">SAMPLES THIS PATCH REFERENCES</div>
      {refs.map((r) => (
        <a key={r.key} className="ps-dep" href={SAMPLE_LIBRARY} target="_blank" rel="noreferrer"
           title="Find in the Nord Sample Library">● {r.label}</a>
      ))}
    </div>
  );
}

/**
 * Resolve factory sample names lazily: the catalog is ~1.3 MB, so it is dynamic-
 * imported only when a Stage 3 program is shown (mirrors ns3/present.ts enrich).
 * Returns a names map keyed by ns3SampleKey(); empty until resolution completes.
 */
function useNs3SampleNames(panels: Ns3Panel[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
      if (!cancelled) setNames(out);
    })();
    return () => { cancelled = true; };
  }, [panels]);
  return names;
}
