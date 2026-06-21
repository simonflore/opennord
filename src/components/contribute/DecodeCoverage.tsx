import { ALL_MODELS } from '../../lib/clavia/partitions';
import { decodeForModel, DECODE_LABEL, type ModelDecode } from '../../lib/contribute/coverage';

const ORDER: Record<string, number> = { none: 0, started: 1, partial: 2, full: 3 };

function statusLine(d: ModelDecode): string {
  if (d.status === 'full') return `${DECODE_LABEL.full} (${d.paramCount} parameters)`;
  if (d.status === 'started') {
    const ctrls = `${d.controlCount} control${d.controlCount === 1 ? '' : 's'}`;
    return `In progress — ${ctrls}${d.pct != null ? `, ${d.pct}% of bytes` : ''}`;
  }
  return DECODE_LABEL[d.status]; // partial / none
}

/** Per-model decode status — shows which models still need contributions. */
export function DecodeCoverage() {
  const rows = ALL_MODELS
    .map((m) => ({ name: m.name, decode: decodeForModel(m.id) }))
    .sort((a, b) => ORDER[a.decode.status] - ORDER[b.decode.status] || a.name.localeCompare(b.name));

  return (
    <div style={{ marginTop: 24 }}>
      <h2>What still needs decoding</h2>
      <p className="ps-sub">
        Stage 4 is fully mapped — it's the reference we check captures against. The models below
        are where your captures add new ground; pick yours and you won't be redoing finished work.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 2 }}>
        {rows.map((r) => (
          <li key={r.name} className="ps-sub">
            <strong>{r.name}</strong> — {statusLine(r.decode)}
          </li>
        ))}
      </ul>
    </div>
  );
}
