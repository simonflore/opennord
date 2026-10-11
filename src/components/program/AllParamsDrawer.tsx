import { useMemo, useState } from 'react';
import type { NS4Program } from '../../lib/ns4/types';
import { buildParamMap } from '../../lib/ns4/maps';
import { decodeAllParams } from '../../lib/ns4/coverage';
import {
  collapseMorphs, groupParams, filterRows, layerLetter, type ParamGroup, type ParamRow,
} from '../../lib/ns4/params-view';

/** A drawer section; `tag` marks the whole section (e.g. a preset's layer letter). */
export interface ParamsDrawerGroup extends ParamGroup { tag?: string }

/**
 * The parameter reference drawer, presentational: collapsed by default, a
 * search box, then one collapsible table per section with morph assignments as
 * ✎ badges. Callers own the grouping and the search state; `rowTag` marks single
 * rows (a program's layer letter).
 */
export function ParamsDrawer({ total, query, onQuery, groups, rowTag }: {
  total: number;
  query: string;
  onQuery: (query: string) => void;
  /** Sections already filtered by `query`; empty ones left out. */
  groups: ParamsDrawerGroup[];
  rowTag?: (group: ParamsDrawerGroup, row: ParamRow) => string;
}) {
  const searching = query.trim().length > 0;
  return (
    <details className="ps-drawer">
      <summary>Show all parameters ({total})</summary>

      <input
        className="ps-param-search"
        placeholder="Search parameters…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        aria-label="Search parameters"
      />

      {searching && groups.length === 0 && (
        <p className="ps-sub">No parameters match “{query}”.</p>
      )}

      {groups.map((g) => (
        <details className="ps-pgroup" key={g.key} open={searching}>
          <summary>
            {g.label}
            {g.tag && <span className="ps-player">{g.tag}</span>}
            <span className="ps-pgroup-n">{g.rows.length}</span>
          </summary>
          <table className="ps-params">
            <tbody>
              {g.rows.map((r, i) => {
                const tag = rowTag?.(g, r);
                return (
                  <tr key={i}>
                    <td>
                      {r.name}
                      {tag && <span className="ps-player">{tag}</span>}
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
  const groups = useMemo(() => groupParams(filterRows(rows, query)), [rows, query]);

  return (
    <ParamsDrawer
      total={rows.length} query={query} onQuery={setQuery} groups={groups}
      rowTag={(g, r) => (g.key === 'file' || g.key === 'm' ? '' : layerLetter(r.layer))}
    />
  );
}
