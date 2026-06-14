import { useState } from 'react';
import '../library/library.css';
import { Card } from '../ui';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import type { ScannedSample } from '../../lib/folder/scan';

interface Props {
  samples: ScannedSample[];
}

/** Folder-detected samples as a list; tap one to open the inspector. */
export function SamplesView({ samples }: Props) {
  const [active, setActive] = useState<InspectorInput | null>(null);

  if (active) {
    return (
      <div>
        <button className="on-btn on-btn--ghost" onClick={() => setActive(null)}>← Samples</button>
        <SampleInspector initial={active} />
      </div>
    );
  }

  if (samples.length === 0) {
    // No folder samples — fall back to the single-file inspector (drag/drop or pick).
    return <SampleInspector />;
  }

  return (
    <div className="lib-grid">
      {samples.map((s) => (
        <Card
          key={s.id}
          className="lib-patch"
          role="button"
          tabIndex={0}
          onClick={() => setActive({ bytes: s.bytes, name: s.name })}
          onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setActive({ bytes: s.bytes, name: s.name }); } }}
        >
          <div className="lib-patch__nm">{s.name}</div>
          <div className="lib-patch__sub">{s.file.recognized ? `codec ${s.file.codec ?? '?'}` : 'unrecognized'}</div>
        </Card>
      ))}
    </div>
  );
}
