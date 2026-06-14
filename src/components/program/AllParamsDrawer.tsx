import { useMemo } from 'react';
import type { NS4Program } from '../../lib/ns4/types';
import { buildParamMap } from '../../lib/ns4/maps';
import { decodeAllParams } from '../../lib/ns4/coverage';

/**
 * The full per-parameter dump for power users / verification. Reuses the same
 * decode core as the DecodeInspector (decodeAllParams + buildParamMap), but
 * scoped to the already-loaded program — no second file upload needed.
 */
export function AllParamsDrawer({ program }: { program: NS4Program }) {
  const rows = useMemo(() => decodeAllParams(program.bytes, buildParamMap()), [program.bytes]);
  return (
    <details className="ps-drawer">
      <summary>Show all parameters ({rows.length})</summary>
      <table className="ps-params">
        <thead><tr><th>parameter</th><th>value</th></tr></thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={i}><td>{d.name}</td><td>{d.display}</td></tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
