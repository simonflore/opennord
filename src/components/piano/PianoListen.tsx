import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { playPcm } from '@/components/sample/audioPlayer';
import { readNspZones } from '@/lib/ns4/nsp';
import { NSP_SAMPLE_RATE, decodeNspStroke, readNspDirectory, strokeFor } from '@/lib/ns4/nsp-audio';
import { noteName } from '@/lib/ns4/sample-view';
import { getErrorMessage } from '@/lib/errors';

/**
 * Audition a piano on this machine: one button per sampled note, played at the chosen
 * velocity. Decodes a single recording on demand; nothing leaves the device
 * (`docs/LEGAL.md` — local access only).
 */
export function PianoListen({ bytes }: { bytes: Uint8Array }) {
  const dir = useMemo(() => readNspDirectory(bytes), [bytes]);
  const zones = useMemo(() => readNspZones(bytes), [bytes]);
  const [velocity, setVelocity] = useState(80);
  const [playing, setPlaying] = useState<number | null>(null);
  const [error, setError] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => { stopRef.current?.(); }, [bytes]);

  if (!dir) return <p className="ps-sub">This piano's sounds can't be played here.</p>;
  const zoneCount = dir.strokes.reduce((n, s) => Math.max(n, s.zone + 1), 0);
  const labelFor = (z: number) => {
    const k = zoneCount === zones.length ? zones[z] : undefined;
    return k ? `${noteName(k.lowNote)}–${noteName(k.highNote)}` : `Note ${z + 1}`;
  };

  function toggle(zone: number) {
    setError('');
    if (playing === zone) { stopRef.current?.(); return; }
    const stroke = strokeFor(dir!, zone, velocity);
    if (!stroke) return;
    try {
      const pcm = decodeNspStroke(bytes, dir!, stroke);
      // The previous note's `ended` fires after this one starts: only the current note may clear the handle.
      const stop = playPcm(pcm, () => {
        if (stopRef.current !== stop) return;
        stopRef.current = null;
        setPlaying((p) => (p === zone ? null : p));
      }, NSP_SAMPLE_RATE);
      stopRef.current = stop;
      setPlaying(zone);
    } catch (e) {
      setError(`Couldn't play this note: ${getErrorMessage(e)}`);
    }
  }

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
            variant={playing === z ? 'primary' : 'secondary'}
            aria-label={`${playing === z ? 'Stop' : 'Play'} ${labelFor(z)} at velocity ${velocity}`}
            onClick={() => toggle(z)}
          >
            {labelFor(z)}
          </Button>
        ))}
      </div>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
