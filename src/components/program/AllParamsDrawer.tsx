import { useMemo, useState } from 'react';
import type { NS4Program } from '../../lib/ns4/types';
import { buildParamMap } from '../../lib/ns4/maps';
import { decodeAllParams } from '../../lib/ns4/coverage';
import { collapseMorphs, groupParams, filterRows, layerLetter } from '../../lib/ns4/params-view';

/**
 * The full parameter reference for power users / verification — reorganized so
 * it reads, not dumps: morph variants ("X with wheel/A.T./ctrlped") collapse into
 * their base row as ✎ badges, rows group by section (File / Master / Organ /
 * Piano / Synth) in collapsible panels, and a search filters across everything.
 */
export function AllParamsDrawer({ program }: { program: NS4Program }) {
  const [query, setQuery] = useState('');
  const rows = useMemo(
    () => collapseMorphs(decodeAllParams(program.bytes, buildParamMap())),
    [program.bytes],
  );
  const filtered = useMemo(() => filterRows(rows, query), [rows, query]);
  const groups = useMemo(() => groupParams(filtered), [filtered]);
  const searching = query.trim().length > 0;

  return (
    <details className="ps-drawer">
      <summary>Show all parameters ({rows.length})</summary>

      <input
        className="ps-param-search"
        placeholder="Search parameters…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search parameters"
      />

      {searching && filtered.length === 0 && (
        <p className="ps-sub">No parameters match “{query}”.</p>
      )}

      {groups.map((g) => (
        <details className="ps-pgroup" key={g.key} open={searching}>
          <summary>{g.label}<span className="ps-pgroup-n">{g.rows.length}</span></summary>
          <table className="ps-params">
            <tbody>
              {g.rows.map((r, i) => {
                const letter = g.key === 'file' || g.key === 'm' ? '' : layerLetter(r.layer);
                return (
                  <tr key={i}>
                    <td>
                      {r.name}
                      {letter && <span className="ps-player">{letter}</span>}
                    </td>
                    <td>
                      {r.display}
                      {r.morphs.wheel && <span className="ps-morph" title={`wheel → ${r.morphs.wheel}`}>✎W</span>}
                      {r.morphs.at && <span className="ps-morph" title={`aftertouch → ${r.morphs.at}`}>✎A</span>}
                      {r.morphs.pedal && <span className="ps-morph" title={`pedal → ${r.morphs.pedal}`}>✎P</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      ))}
    </details>
  );
}
