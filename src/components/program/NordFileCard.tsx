import { identifyNordFile } from '../../lib/clavia/nord-file';

const KIND_LABEL: Record<string, string> = { program: 'Program', performance: 'Performance', sample: 'Sample', unknown: 'File' };

/**
 * Structure view for a recognized Nord file we don't fully decode yet — Stage 2/3
 * programs and other CBIN files. Shows the generation and the header fields we can
 * trust (NSM-era / Stage 3 decodes slot, category, version; Stage 2's legacy header
 * is recognized but not decoded). Full parameter rendering stays Stage 4-only (#22).
 */
export function NordFileCard({ bytes }: { bytes: Uint8Array }) {
  const info = identifyNordFile(bytes);
  if (!info.recognized) {
    return (
      <div className="ps">
        <div className="ps-card"><p className="ps-sub" style={{ margin: 0 }}>Not a recognized Nord file (no CBIN header).</p></div>
      </div>
    );
  }

  const rows: [string, string][] = [];
  if (info.headerDecoded) {
    if (info.slot) rows.push(['Slot', info.slot]);
    if (info.category !== undefined) rows.push(['Category', info.categoryName ?? `#${info.category}`]);
    if (info.version) rows.push(['Version', `v${info.version}`]);
  }
  rows.push(['Type tag', info.tag]);
  rows.push(['Size', `${info.sizeBytes} bytes`]);

  return (
    <div className="ps">
      <div className="ps-card">
        <h4>{info.generation} · {KIND_LABEL[info.kind] ?? 'File'}</h4>
        {!info.headerDecoded && (
          <p className="ps-sub" style={{ marginTop: 0 }}>
            Legacy {info.generation} header — slot, category and version aren’t decoded yet.
          </p>
        )}
        <div className="ps-stats" style={{ marginTop: 8 }}>
          {rows.map(([k, v]) => (
            <div className="ps-stat" key={k}>
              <span className="ps-stat-l">{k}</span>
              <span className="ps-stat-v">{v}</span>
            </div>
          ))}
        </div>
        <p className="ps-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          OpenNord recognizes this file and its structure. The full parameter view (engines, FX, morphs)
          is available for Stage 4 programs for now — Stage 2/3 decoding is tracked in #22.
        </p>
      </div>
    </div>
  );
}
