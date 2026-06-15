import { useEffect, useRef, useState } from 'react';
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import type { StrokeSummary } from '../../lib/ns4/sample-view';
import { WaveCanvas } from './WaveCanvas';

const SAMPLE_RATE = 44100; // decoded rate not yet recovered — audition only

export interface InspectorStroke {
  summary: StrokeSummary;
  channels: Int32Array[];
}

/** Lazily-created shared AudioContext (browser only). */
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function StrokeList({ strokes, playable }: { strokes: InspectorStroke[]; playable: boolean }) {
  if (strokes.length === 0) {
    // Codec 3 and 4 decode; legacy codec 1/2 (or a decode failure) → no audio.
    const message = playable
      ? 'Audio preview unavailable for this file.'
      : 'Audio preview not available for this codec.';
    return (
      <div className="ps-card" style={{ marginTop: 12 }}>
        <h4>SAMPLES</h4>
        <p className="ps-sub">{message}</p>
      </div>
    );
  }
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>STROKES</h4>
      {strokes.map((s) => <StrokeRow key={s.summary.index} stroke={s} playable={playable} />)}
    </div>
  );
}

function StrokeRow({ stroke, playable }: { stroke: InspectorStroke; playable: boolean }) {
  const [playing, setPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Stop any playing audio if this row unmounts (e.g. a new file is loaded).
  useEffect(() => () => { sourceRef.current?.stop(); sourceRef.current = null; }, []);

  function play() {
    const ctx = getCtx();
    const buf = toAudioBuffer(ctx, normalizeChannels(stroke.channels), SAMPLE_RATE);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => { sourceRef.current = null; setPlaying(false); };
    src.start();
    sourceRef.current = src;
    setPlaying(true);
  }
  function stop() {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setPlaying(false);
  }

  const s = stroke.summary;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={playing ? stop : play}
          disabled={!playable || !s.ok}
          style={{ padding: '4px 10px', borderRadius: 6, cursor: playable && s.ok ? 'pointer' : 'not-allowed', border: '1px solid var(--red)', background: 'var(--red)', color: '#fff', fontSize: 11 }}
        >
          {playing ? 'Stop' : 'Play'}
        </button>
        <span className="ps-sub" style={{ margin: 0 }}>
          Sample {s.index + 1} · {s.channels === 2 ? 'stereo' : 'mono'} · {(s.sampleCount / SAMPLE_RATE).toFixed(1)}s
        </span>
      </div>
      {s.ok && <WaveCanvas pcm={stroke.channels[0]} />}
    </div>
  );
}
