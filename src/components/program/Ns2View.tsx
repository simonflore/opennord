import { useMemo } from 'react';
import { identifyNordFile } from '../../lib/clavia/nord-file';
import { decodeNs2, type Ns2Slot } from '../../lib/ns2/decode';

/** The active engines of one slot as readable rows ("Piano · Clavinet"). */
function SlotEngines({ slot }: { slot: Ns2Slot }) {
  const engines: { name: string; detail: string }[] = [];
  if (slot.organ.on) engines.push({ name: 'Organ', detail: slot.organ.type });
  if (slot.piano.on) engines.push({ name: 'Piano', detail: slot.piano.type });
  if (slot.synth.on) engines.push({ name: 'Synth', detail: slot.synth.osc });

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>SLOT {slot.id}</h4>
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
 * Stage 2 program view (Tier 2, #22). Shows the header (slot / category) plus the
 * decoded per-slot engines. Offsets ported from ns3-program-viewer's ns2 decoder
 * (docs/MULTI-MODEL.md); a first slice — engines + model/type — with levels,
 * drawbars and FX to follow.
 */
export function Ns2View({ bytes }: { bytes: Uint8Array }) {
  const info = useMemo(() => identifyNordFile(bytes), [bytes]);
  const { slots } = useMemo(() => decodeNs2(bytes), [bytes]);

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  if (info.categoryName) header.push(['Category', info.categoryName]);

  return (
    <div className="ps">
      <div className="ps-card">
        <h4>Stage 2 · Program</h4>
        <div className="ps-stats" style={{ marginTop: 8 }}>
          {header.map(([k, v]) => (
            <div className="ps-stat" key={k}><span className="ps-stat-l">{k}</span><span className="ps-stat-v">{v}</span></div>
          ))}
        </div>
      </div>

      {slots.map((s) => <SlotEngines key={s.id} slot={s} />)}

      <p className="ps-sub" style={{ marginTop: 12 }}>
        Stage 2 decode (Tier 2): active slots and their engines + model/type. Levels, drawbars and
        FX to follow. Offsets from the community ns3-program-viewer (see docs).
      </p>
    </div>
  );
}
