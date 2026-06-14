import type { ZoneRow } from '../../lib/ns4/sample-view';

export function ZoneMap({ rows }: { rows: ZoneRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>ZONES &amp; KEY MAP</h4>
      <table className="ps-params">
        <thead><tr><th>stroke</th><th>root</th><th>up to</th><th>vel ≤</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.strokeIndex}</td><td>{r.rootNote}</td><td>{r.topNote}</td><td>{r.velTop}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
