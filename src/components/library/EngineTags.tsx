import type { EngineSummary } from '@/lib/clavia/engines';
import { EngineTag } from './EngineTag';

/** Nothing active — say so, never render a blank row. */
function Empty() {
  return <span className="text-[11px] text-muted">empty</span>;
}

/**
 * The one renderer for "which engines are active". The union's axis decides the
 * shape — Stage 2/3 group engines under their Slot/Panel, Stage 4 stacks layers
 * under each engine — so the two generations cannot render as each other.
 *
 * `detail` is the opened-program header (names the layers, spells out
 * "Panel A"); omit it for the glanceable Library card (×N, bare letter).
 */
export function EngineTags({ summary, detail = false }: { summary: EngineSummary; detail?: boolean }) {
  if (summary.axis === 'engine') {
    if (!summary.engines.length) return <Empty />;
    return (
      <div className="flex flex-wrap gap-[5px]">
        {summary.engines.map((e) => (
          <EngineTag key={e.kind} kind={e.kind}>
            {detail
              ? `${e.kind}: ${e.layers.join(', ')}`
              : e.layers.length > 1 ? `${e.kind} ×${e.layers.length}` : e.kind}
          </EngineTag>
        ))}
      </div>
    );
  }

  if (!summary.groups.length) return <Empty />;
  return (
    <div className={detail ? 'flex flex-wrap items-center gap-x-3 gap-y-1' : 'flex flex-col gap-1'}>
      {summary.groups.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-[5px]">
          <span className="text-[9px] font-bold uppercase tracking-[.4px] text-muted">
            {detail ? `${summary.term} ${g.id}` : `${g.id}:`}
          </span>
          {g.engines.length ? g.engines.map((k) => <EngineTag key={k} kind={k}>{k}</EngineTag>) : <Empty />}
        </div>
      ))}
    </div>
  );
}
