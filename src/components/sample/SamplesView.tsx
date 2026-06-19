import { useState } from 'react';
import '../library/library.css';
import { Card } from '../ui';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import { nsmpGenerationLabel } from '../../lib/ns4/sample-view';
import type { ScannedSample } from '../../lib/folder/scan';

interface Props {
  samples: ScannedSample[];
}

/** Human-friendly byte size, e.g. 1900000 → "1.8 MB". */
function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Folder-detected samples as a Library-style grid; tap one to open the inspector. */
export function SamplesView({ samples }: Props) {
  const [active, setActive] = useState<InspectorInput | null>(null);
  // Open the inspector with no file → its drop/pick zone, so a sample can be
  // loaded directly from the Samples page without first selecting another.
  const [loadNew, setLoadNew] = useState(false);

  if (active || loadNew) {
    return (
      <div>
        <button className="on-btn on-btn--ghost" onClick={() => { setActive(null); setLoadNew(false); }}>← Samples</button>
        <SampleInspector initial={active ?? undefined} />
      </div>
    );
  }

  if (samples.length === 0) {
    // No folder samples — fall back to the single-file inspector (drag/drop or pick).
    return <SampleInspector />;
  }

  return (
    <div>
      <div className="lib-head">
        <div>
          <div className="lib-title">Samples</div>
          <div className="lib-counts">{samples.length} {samples.length === 1 ? 'sample' : 'samples'}</div>
        </div>
        <button className="on-btn" onClick={() => setLoadNew(true)}>Load sample</button>
      </div>

      <div className="lib-grid">
        {samples.map((s) => {
          const open = () => setActive({ bytes: s.bytes, name: s.name });
          return (
            <Card
              key={s.id}
              className="lib-patch"
              role="button"
              tabIndex={0}
              onClick={open}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } }}
            >
              <div className="lib-patch__top">
                <span className="lib-patch__nm">{s.name}</span>
                <span className="lib-slot">{s.file.recognized ? nsmpGenerationLabel(s.file) : '?'}</span>
              </div>
              <div className="lib-patch__engines">
                <span className="lib-eng">
                  {s.file.recognized
                    ? `${s.file.strokeCount} ${s.file.strokeCount === 1 ? 'sample' : 'samples'}`
                    : 'unrecognized'}
                </span>
              </div>
              <div className="lib-patch__foot">
                <span className="lib-slot">{fmtSize(s.bytes.length)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
