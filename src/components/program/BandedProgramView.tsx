import { useEffect, useState } from 'react';
import '../../styles/nord.css';
import type { EngineCardModel, FxChipModel, HeaderView } from '../../lib/clavia/engine-view';
import { ProgramHeader } from './ProgramHeader';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';

const SAMPLE_LIBRARY = 'https://www.nordkeyboards.com/sounds/sample-library/';

export interface ProgramBand { id: string; label: string; cards: EngineCardModel[]; fxChips: FxChipModel[]; }
export interface SampleRef { key: string; label: string; }

/**
 * Shared page shell for banded models (ns3 panels A/B, ns2 slots A/B). Pure layout:
 * header → one labelled band per slot/panel (cards + per-band FX) → optional
 * program-global FX row → referenced-samples strip. Each model builds the data via
 * its own view.ts and renders this.
 */
export function BandedProgramView({ header, bands, globalFxChips, sampleRefs }: {
  header: HeaderView;
  bands: ProgramBand[];
  globalFxChips?: FxChipModel[];
  sampleRefs: SampleRef[];
}) {
  return (
    <div className="ps">
      <ProgramHeader header={header} />
      {bands.map((band) => (
        <section className="ps-panel" key={band.id}>
          <div className="ps-panel-lbl">{band.label}</div>
          <div className="ps-grid">
            {band.cards.map((card) => <EngineCard key={`${band.id}-${card.kind}`} card={card} />)}
          </div>
          <FxRow chips={band.fxChips} title="FX" />
        </section>
      ))}
      {globalFxChips && globalFxChips.length > 0 && <FxRow chips={globalFxChips} title="GLOBAL FX" />}
      <SampleStrip refs={sampleRefs} />
    </div>
  );
}

/** The "you need these" factory-sample list (programs reference samples, never embed them). */
function SampleStrip({ refs }: { refs: SampleRef[] }) {
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
 * Resolve factory sample names lazily: the catalog is ~1.3 MB, dynamic-imported only
 * when a program is shown. `resolve` is the model-specific resolver; `deps` re-runs it
 * when the decoded structure changes. Empty until resolution completes.
 */
export function useResolvedSampleNames(resolve: () => Promise<Record<string, string>>, deps: unknown[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    void resolve().then((out) => { if (!cancelled) setNames(out); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return names;
}
