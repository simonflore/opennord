import { useMemo, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { readNspZones } from '@/lib/ns4/nsp';
import { noteName } from '@/lib/ns4/sample-view';
import { usePianoVoice } from './usePianoVoice';

/**
 * Audition a piano on this machine: one button per sampled note, played at the chosen
 * velocity. Decodes a single recording on demand; nothing leaves the device
 * (`docs/LEGAL.md` — local access only).
 */
export function PianoListen({ bytes }: { bytes: Uint8Array }) {
  const { dir, zoneCount, playing, error, toggle } = usePianoVoice(bytes);
  const zones = useMemo(() => readNspZones(bytes), [bytes]);
  const [velocity, setVelocity] = useState(80);

  if (!dir) return <p className="ps-sub">This piano's sounds can't be played here.</p>;
  const labelFor = (z: number) => {
    const k = zoneCount === zones.length ? zones[z] : undefined;
    return k ? `${noteName(k.lowNote)}–${noteName(k.highNote)}` : `Note ${z + 1}`;
  };

  return (
    <div style={{ marginTop: 14 }}>
      <SectionLabel>Listen</SectionLabel>
      <label style={{ display: 'grid', gridTemplateColumns: '5.5rem 1fr 2.5rem', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span className="ps-sub" style={{ margin: 0 }}>Velocity</span>
        <input
          type="range" min={1} max={127} value={velocity}
          aria-label={`Velocity ${velocity}`}
          onChange={(e) => setVelocity(Number(e.target.value))}
          style={{ accentColor: 'var(--red)', width: '100%' }}
        />
        <span className="ps-sub" style={{ margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{velocity}</span>
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {Array.from({ length: zoneCount }, (_, z) => (
          <Button
            key={z}
            variant={playing === String(z) ? 'primary' : 'secondary'}
            aria-label={`${playing === String(z) ? 'Stop' : 'Play'} ${labelFor(z)} at velocity ${velocity}`}
            onClick={() => toggle(String(z), z, velocity)}
          >
            {labelFor(z)}
          </Button>
        ))}
      </div>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
