import type { ReactNode } from 'react';

/**
 * Master/detail two-pane container. Purely presentational — the parent decides
 * (via useSplitLayout) whether there's room to render both panes.
 */
export function SplitView({ master, detail }: { master: ReactNode; detail: ReactNode }) {
  return (
    <div className="on-split">
      <div className="on-split__master">{master}</div>
      <div className="on-split__detail">{detail}</div>
    </div>
  );
}
