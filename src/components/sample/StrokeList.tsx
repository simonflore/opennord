import { useRef, useState } from 'react';
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
    return (
      <div className="ps-card" style={{ marginTop: 12 }}>
        <h4>STROKES</h4>
        <p className="ps-sub">Audio preview pending codec-4 decode.</p>
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

  function play() {
    const ctx = getCtx();
    const buf = toAudioBuffer(ctx, normalizeChannels(stroke.channels), SAMPLE_RATE);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => setPlaying(false);
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
          style={{ padding: '4px 10px', borderRadius: 6, cursor: playable && s.ok ? 'pointer' : 'not-allowed', border: '1px solid #c8102e', background: '#c8102e', color: '#fff', fontSize: 11 }}
        >
          {playing ? 'Stop' : 'Play'}
        </button>
        <span className="ps-sub" style={{ margin: 0 }}>
          stroke {s.index} · {s.channels}ch · {s.sampleCount} samples
        </span>
      </div>
      {s.ok && <WaveCanvas pcm={stroke.channels[0]} />}
    </div>
  );
}
