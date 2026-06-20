import { identifyNordFile } from '../../lib/clavia/nord-file';
import { decodeNs3, type Ns3Panel } from '../../lib/ns3/decode';

/** The active engines of one panel as readable chips ("Piano · Grand"). */
function PanelEngines({ panel }: { panel: Ns3Panel }) {
  const engines: { name: string; detail: string }[] = [];
  if (panel.organ.on) engines.push({ name: 'Organ', detail: `${panel.organ.type} · ${panel.organ.volume}` });
  if (panel.piano.on) engines.push({ name: 'Piano', detail: `${panel.piano.type} · ${panel.piano.volume}` });
  if (panel.synth.on) engines.push({ name: 'Synth', detail: `${panel.synth.osc} · ${panel.synth.filter} ${panel.synth.cutoff} · ${panel.synth.volume}` });

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
    </div>
  );
}

/**
 * Stage 3 program view (Tier 2, #22). Shows the header (slot / category / version)
 * plus the decoded per-panel engines. Offsets ported from ns3-program-viewer
 * (docs/MULTI-MODEL.md); this is a first slice — engines + model/type — so it's
 * framed as in-progress until fuller parameter decode lands.
 */
export function Ns3View({ bytes }: { bytes: Uint8Array }) {
  const info = identifyNordFile(bytes);
  const { panels } = decodeNs3(bytes);

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  if (info.category !== undefined) header.push(['Category', info.categoryName ?? `#${info.category}`]);
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

      {panels.map((p) => <PanelEngines key={p.id} panel={p} />)}

      <p className="ps-sub" style={{ marginTop: 12 }}>
        Stage 3 decode is in progress — engines and models are read here; drawbars, levels and FX are
        coming. Offsets from the community ns3-program-viewer (see docs).
      </p>
    </div>
  );
}
