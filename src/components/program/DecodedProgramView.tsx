import { useEffect, useState } from 'react';
import type { DecodedProgram, DecodedSection } from '../../lib/clavia/decoded';
import { DrawbarStack } from './widgets';

/** One section card: engine rows + optional drawbar stack + optional chips. */
function SectionCard({ section, names }: { section: DecodedSection; names: Record<string, string> }) {
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>{section.label}</h4>
      {section.engines.length === 0
        ? <p className="ps-sub" style={{ margin: 0 }}>No engines active.</p>
        : (
          <div className="ps-stats" style={{ marginTop: 8 }}>
            {section.engines.map((e) => {
              const parts = [...e.parts];
              const resolved = names[`${section.id}-${e.label}`];
              if (e.nameSlot !== undefined && resolved) parts[e.nameSlot] = resolved;
              return (
                <div className="ps-stat" key={e.label}>
                  <span className="ps-stat-l">{e.label}</span>
                  <span className="ps-stat-v">{parts.join(' · ')}</span>
                </div>
              );
            })}
          </div>
        )}
      {section.drawbars && (
        <div style={{ marginTop: 10 }}><DrawbarStack drawbars={section.drawbars} /></div>
      )}
      {section.chips && section.chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {section.chips.map((c) => <span className="ps-perf-chip" key={c}>{c}</span>)}
        </div>
      )}
    </div>
  );
}

/**
 * Renders any {@link DecodedProgram} — the one view shared by every leaner Nord
 * model (Stage 2/3 today). Factory names arrive asynchronously via `enrich` (a
 * lazily-imported catalog) and are substituted into each engine's `nameSlot`.
 */
export function DecodedProgramView({ program }: { program: DecodedProgram }) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!program.enrich) return;
    let alive = true;
    void program.enrich().then((r) => { if (alive) setNames(r); });
    return () => { alive = false; };
  }, [program]);

  return (
    <div className="ps">
      <div className="ps-card">
        <h4>{program.title}</h4>
        <div className="ps-stats" style={{ marginTop: 8 }}>
          {program.header.map(([k, v]) => (
            <div className="ps-stat" key={k}><span className="ps-stat-l">{k}</span><span className="ps-stat-v">{v}</span></div>
          ))}
        </div>
      </div>

      {program.sections.map((s) => <SectionCard key={s.id} section={s} names={names} />)}

      <p className="ps-sub" style={{ marginTop: 12 }}>{program.note}</p>
    </div>
  );
}
