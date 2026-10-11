import { useEffect, useMemo, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { KeyboardZoneMap } from '@/components/sample/KeyboardZoneMap';
import { MidiConnect } from '@/components/sample/MidiConnect';
import { useOptionalMidi } from '@/lib/midi/MidiContext';
import { readNspZones, type NspZone } from '@/lib/ns4/nsp';
import { readNspDirectory } from '@/lib/ns4/nsp-audio';
import { KEY_MAX, KEY_MIN } from '@/lib/ns4/keyboard-view';
import type { EditZone } from '@/lib/ns4/sample-edit';
import { createPianoEngine } from './pianoEngine';
import { usePianoVoice } from './usePianoVoice';

/** A piano's key zones as bands for the keyboard map: those on the 88 keys, trimmed to them. */
export function keyboardZones(zones: readonly NspZone[]): EditZone[] {
  return zones
    .filter((z) => z.highNote >= KEY_MIN && z.lowNote <= KEY_MAX)
    .map((z) => ({
      rootKey: z.rootNote, keyLow: Math.max(z.lowNote, KEY_MIN), keyHigh: Math.min(z.highNote, KEY_MAX),
      velLow: 0, velTop: 127,
    }));
}

/**
 * Audition a piano on this machine: a keyboard to play it by, from the screen or a MIDI
 * keyboard. Each band is one sampled note, stretched over the keys it covers. Decodes a
 * recording when a key first needs it; nothing leaves the device (`docs/LEGAL.md` — local
 * access only).
 */
export function PianoListen({ bytes }: { bytes: Uint8Array }) {
  const dir = useMemo(() => readNspDirectory(bytes), [bytes]);
  const zones = useMemo(() => readNspZones(bytes), [bytes]);
  const [velocity, setVelocity] = useState(80);
  const [sounding, setSounding] = useState<ReadonlySet<number>>(new Set());
  const [selected, setSelected] = useState(-1);
  const [error, setError] = useState('');

  const zoneCount = dir ? dir.strokes.reduce((n, s) => Math.max(n, s.zone + 1), 0) : 0;
  // Every key plays only when the key map names the recordings one for one.
  const mapped = zoneCount > 0 && zones.length === zoneCount;

  const engine = useMemo(() => {
    if (!dir || !mapped) return null;
    const e = createPianoEngine(bytes, dir, zones, {
      onError: setError,
      onChange: () => setSounding(new Set(e.sounding().keys())),
    });
    return e;
  }, [bytes, dir, zones, mapped]);
  useEffect(() => () => { engine?.stopAll(); }, [engine]);

  // A MIDI keyboard plays the same engine, with its own touch. Depends on the provider's
  // stable setSink/clearSink, not the whole MIDI state (a new object on every hot-plug,
  // which would re-run this and cut held notes).
  const midi = useOptionalMidi();
  const setSink = midi?.setSink;
  const clearSink = midi?.clearSink;
  useEffect(() => {
    if (!engine || !setSink || !clearSink) return;
    const sink = {
      noteOn: (n: number, v: number) => { setError(''); engine.noteOn(n, v); },
      noteOff: (n: number) => engine.noteOff(n),
    };
    setSink(sink);
    return () => clearSink(sink);
  }, [engine, setSink, clearSink]);

  if (!dir) return <p className="ps-sub">This piano's sounds can't be played here.</p>;

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
      {engine ? (
        <>
          <KeyboardZoneMap
            zones={keyboardZones(zones)}
            selected={selected}
            onSelect={setSelected}
            onNoteOn={(n) => { setError(''); engine.noteOn(n, velocity); }}
            onNoteOff={(n) => engine.noteOff(n)}
            soundingMidis={sounding}
          />
          <p className="ps-sub" style={{ margin: 0 }}>
            Click or drag across the keys to play. Each band is one sampled note; the slider sets how hard the keys are struck.
          </p>
          {midi && <MidiConnect what="this piano" />}
        </>
      ) : (
        <RecordingButtons bytes={bytes} zoneCount={zoneCount} velocity={velocity} />
      )}
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

/** Without a key map that names the recordings: one button per recording, as recorded. */
function RecordingButtons({ bytes, zoneCount, velocity }: { bytes: Uint8Array; zoneCount: number; velocity: number }) {
  const { playing, error, toggle } = usePianoVoice(bytes);
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {Array.from({ length: zoneCount }, (_, z) => (
          <Button
            key={z}
            variant={playing === String(z) ? 'primary' : 'secondary'}
            aria-label={`${playing === String(z) ? 'Stop' : 'Play'} Note ${z + 1} at velocity ${velocity}`}
            onClick={() => toggle(String(z), z, velocity)}
          >
            Note {z + 1}
          </Button>
        ))}
      </div>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </>
  );
}
