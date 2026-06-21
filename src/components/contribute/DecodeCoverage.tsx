import { ALL_MODELS } from '../../lib/clavia/partitions';
import { decodeForModel, DECODE_LABEL } from '../../lib/contribute/coverage';

const ORDER: Record<string, number> = { none: 0, partial: 1, full: 2 };

/** Per-model decode status — shows which models still need contributions. */
export function DecodeCoverage() {
  const rows = ALL_MODELS
    .map((m) => ({ name: m.name, ...decodeForModel(m.id) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));

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
            <strong>{r.name}</strong> —{' '}
            {r.status === 'full'
              ? `${DECODE_LABEL.full} (${r.paramCount} parameters)`
              : DECODE_LABEL[r.status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
