import type { ZoneRow } from '../../lib/ns4/sample-view';

/** The raw key/velocity map — RE-grade detail, tucked behind an Advanced disclosure. */
export function ZoneMap({ rows }: { rows: ZoneRow[] }) {
  if (rows.length === 0) return null;
  return (
    <details className="ps-card" style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', font: '700 10px var(--font)', letterSpacing: '1px', color: 'var(--dim)' }}>
        ADVANCED · KEY MAP ({rows.length} {rows.length === 1 ? 'zone' : 'zones'})
      </summary>
      <table className="ps-params" style={{ marginTop: 8 }}>
        <thead><tr><th>sample</th><th>root</th><th>up to</th><th>vel ≤</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.globalID}</td><td>{r.rootNote}</td><td>{r.topNote}</td><td>{r.velTop}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
