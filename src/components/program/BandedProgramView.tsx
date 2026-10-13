import { useEffect, useState } from 'react';
import '../../styles/nord.css';
import type { EngineCardModel, HeaderView } from '../../lib/clavia/engine-view';
import type { FxPanelView } from '../../lib/clavia/fx-view';
import { ProgramHeader } from './ProgramHeader';
import { EngineCard } from './EngineCard';
import { FxPanel } from './FxPanel';
import { ReadoutWarnings } from './widgets';
import { ZonesPanel } from './ProgramZones';
import type { ProgramZonesView } from '../../lib/ns4/view';

const SAMPLE_LIBRARY = 'https://www.nordkeyboards.com/sounds/sample-library/';

export interface ProgramBand { id: string; label: string; cards: EngineCardModel[]; }
export interface SampleRef { key: string; label: string; }

/**
 * Shared page shell for banded models (ns3 panels A/B, ns2 slots A/B). Pure layout:
 * header → one labelled band per slot/panel (its engine cards) → the program's
 * effects panel → referenced-samples strip. Each model builds the data via
 * its own view.ts and renders this.
 */
export function BandedProgramView({ header, bands, fx, sampleRefs, warnings, zones }: {
  header: HeaderView;
  bands: ProgramBand[];
  /** The program's effects, one row per slot/panel plus any program-wide row. */
  fx?: FxPanelView;
  sampleRefs: SampleRef[];
  /** Reader anomalies (a file the layout doesn't match, out-of-range values, …). */
  warnings?: readonly string[];
  /** The keyboard split map, for a model whose programs split the keyboard. */
  zones?: ProgramZonesView | null;
}) {
  return (
    <div className="ps">
      <ProgramHeader header={header} />
      <ReadoutWarnings warnings={warnings} />
      {zones && <ZonesPanel view={zones} />}
      {bands.map((band) => (
        <section className="ps-panel" key={band.id}>
          <div className="ps-panel-lbl">{band.label}</div>
          <div className="ps-grid">
            {band.cards.map((card) => <EngineCard key={`${band.id}-${card.kind}`} card={card} />)}
          </div>
        </section>
      ))}
      {fx && <FxPanel view={fx} title="EFFECTS" />}
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
