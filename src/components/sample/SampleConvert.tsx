import { useState } from 'react';
import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp } from '../../lib/ns4/nsmp-convert';
import { downloadBytes } from '../../lib/download';

type Status =
  | { kind: 'idle' }
  | { kind: 'done'; msg: string; warnings: string[] }
  | { kind: 'error'; msg: string };

/**
 * Convert a loaded sample to another generation and download it. Targets are the
 * codec generations other than the source's, so it works from any variant — the
 * original `.nsmp` (OG) → `.nsmp3`/`.nsmp4`, `.nsmp3` → `.nsmp4`, `.nsmp4` → `.nsmp3`.
 * Audio is preserved exactly (`convertNsmp`).
 */
export function SampleConvert({ bytes, file }: { bytes: Uint8Array; file: NsmpFile }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const source = file.legacy ? 0 : file.codec ?? 0;
  const targets = ([3, 4] as const).filter((t) => t !== source);
  if (targets.length === 0) return null;

  function convert(target: 3 | 4) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || 'sample'}${extension}`;
      downloadBytes(out, filename);
      setStatus({ kind: 'done', msg: `Saved ${filename}`, warnings });
    } catch (e) {
      setStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>CONVERT</h4>
      <p className="ps-sub" style={{ marginTop: 0 }}>
        Save this sample as another generation — audio is preserved exactly.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {targets.map((t) => (
          <button key={t} className="on-btn on-btn--secondary" onClick={() => convert(t)}>
            Convert to .nsmp{t}
          </button>
        ))}
      </div>
      {status.kind === 'done' && (
        <>
          <p className="ps-sub" style={{ margin: '10px 0 0', color: 'var(--ink)' }}>✓ {status.msg}</p>
          {status.warnings.length > 0 && (
            <ul className="ps-sub" style={{ margin: '4px 0 0' }}>
              {status.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </>
      )}
      {status.kind === 'error' && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>Couldn’t convert: {status.msg}</p>
      )}
    </div>
  );
}
