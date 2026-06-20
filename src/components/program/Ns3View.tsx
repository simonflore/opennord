import { useEffect, useMemo, useState } from 'react';
import { identifyNordFile } from '../../lib/clavia/nord-file';
import { decodeNs3, type Ns3Panel } from '../../lib/ns3/decode';
import { DrawbarStack } from './widgets';
import type { DrawbarView } from '../../lib/ns4/view';

/** Resolved factory sample names, keyed `${panelId}-piano` / `${panelId}-synth`. */
type SampleNames = Record<string, string>;

// B3 footage labels for the 9 drawbars; Vox/Farfisa use their own legend.
const B3_FOOTAGE = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];

function organDrawbars(panel: Ns3Panel): DrawbarView[] {
  return panel.organ.drawbars.map((level, i) => ({
    level, label: String(level), color: 'default',
    footage: panel.organ.type === 'B3' ? B3_FOOTAGE[i] : undefined,
  }));
}

/** B3 character chips: vibrato/chorus mode + percussion flags, when on. */
function organChips(panel: Ns3Panel): string[] {
  const chips: string[] = [];
  const { vibChorus, percussion } = panel.organ;
  if (vibChorus.on) chips.push(`Vib/Chorus: ${vibChorus.mode}`);
  if (percussion.on) {
    const f = [percussion.third && '3rd', percussion.fast && 'Fast', percussion.soft && 'Soft'].filter(Boolean);
    chips.push(`Percussion${f.length ? ` · ${f.join(' / ')}` : ''}`);
  }
  return chips;
}

/** The active engines of one panel as readable chips ("Piano · White Grand Lrg"). */
function PanelEngines({ panel, names }: { panel: Ns3Panel; names: SampleNames }) {
  const engines: { name: string; detail: string }[] = [];
  if (panel.organ.on) engines.push({ name: 'Organ', detail: `${panel.organ.type} · ${panel.organ.volume}` });
  if (panel.piano.on) {
    const model = names[`${panel.id}-piano`] ?? panel.piano.type;
    engines.push({ name: 'Piano', detail: `${model} · ${panel.piano.volume}` });
  }
  if (panel.synth.on) {
    // For Sample oscillators, lead with the resolved sample name; else the osc model.
    const src = panel.synth.osc === 'Sample' ? (names[`${panel.id}-synth`] ?? 'Sample') : panel.synth.osc;
    engines.push({ name: 'Synth', detail: `${src} · ${panel.synth.filter} ${panel.synth.cutoff} · ${panel.synth.volume}` });
  }

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>PANEL {panel.id}</h4>
      {engines.length === 0
        ? <p className="ps-sub" style={{ margin: 0 }}>No engines active.</p>
        : (
          <div className="ps-stats" style={{ marginTop: 8 }}>
            {engines.map((e) => (
              <div className="ps-stat" key={e.name}>
                <span className="ps-stat-l">{e.name}</span>
                <span className="ps-stat-v">{e.detail}</span>
              </div>
            ))}
          </div>
        )}
      {panel.organ.on && (
        <div style={{ marginTop: 10 }}><DrawbarStack drawbars={organDrawbars(panel)} /></div>
      )}
      {panel.organ.on && (organChips(panel).length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {organChips(panel).map((c) => <span className="ps-perf-chip" key={c}>{c}</span>)}
        </div>
      )}
      {panel.fx.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {panel.fx.map((f) => (
            <span className="ps-perf-chip" key={f.name}>{f.type ? `${f.name}: ${f.type}` : f.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Resolve each active panel's piano/synth-Sample factory name. The ~1.3MB sample
 * catalog is dynamically imported, so it loads lazily (own chunk) the first time
 * a Stage 3 program is opened, never in the main bundle.
 */
function useSampleNames(panels: Ns3Panel[]): SampleNames {
  const [names, setNames] = useState<SampleNames>({});
  useEffect(() => {
    let alive = true;
    void import('../../lib/ns3/library/service').then(({ resolveSample }) => {
      if (!alive) return;
      const out: SampleNames = {};
      for (const p of panels) {
        if (p.piano.on) {
          const r = resolveSample(p.piano.sampleId, p.piano.sampleVariation);
          if (r) out[`${p.id}-piano`] = r.version ? `${r.name} ${r.version}` : r.name;
        }
        if (p.synth.on && p.synth.osc === 'Sample') {
          const r = resolveSample(p.synth.sampleId, 0);
          if (r) out[`${p.id}-synth`] = r.name;
        }
      }
      setNames(out);
    });
    return () => { alive = false; };
  }, [panels]);
  return names;
}

/**
 * Stage 3 program view (Tier 2, #22). Shows the header (slot / category / version)
 * plus the decoded per-panel engines, with factory sample/model names resolved
 * lazily from the vendored library catalog. Offsets ported from ns3-program-viewer
 * (docs/MULTI-MODEL.md).
 */
export function Ns3View({ bytes }: { bytes: Uint8Array }) {
  const info = useMemo(() => identifyNordFile(bytes), [bytes]);
  const { panels } = useMemo(() => decodeNs3(bytes), [bytes]);
  const names = useSampleNames(panels);

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  // Only surface a real, named category — never the raw "#255 = none" protocol value.
  if (info.categoryName) header.push(['Category', info.categoryName]);
  if (info.version) header.push(['Version', `v${info.version}`]);

  return (
    <div className="ps">
      <div className="ps-card">
        <h4>Stage 3 · Program</h4>
        <div className="ps-stats" style={{ marginTop: 8 }}>
          {header.map(([k, v]) => (
            <div className="ps-stat" key={k}><span className="ps-stat-l">{k}</span><span className="ps-stat-v">{v}</span></div>
          ))}
        </div>
      </div>

      {panels.map((p) => <PanelEngines key={p.id} panel={p} names={names} />)}

      <p className="ps-sub" style={{ marginTop: 12 }}>
        Stage 3 decode (Tier 2): engines, factory sample/model names, levels, organ drawbars, FX
        and B3 character. Offsets + library from the community ns3-program-viewer (see docs).
      </p>
    </div>
  );
}
