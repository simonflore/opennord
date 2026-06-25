import { useEffect, useRef, useState } from 'react';
import { zipSync } from 'fflate';
import { normalizeChannels } from '../../lib/ns4/nsmp-audio';
import { encodeWav } from '../../lib/ns4/wav';
import { downloadBytes } from '../../lib/download';
import type { StrokeSummary } from '../../lib/ns4/sample-view';
import { WaveCanvas } from './WaveCanvas';
import { playPcm, SAMPLE_RATE } from './audioPlayer';

export interface InspectorStroke {
  summary: StrokeSummary;
  channels: Int32Array[];
}

/** Filesystem-safe filename stem. */
function safeStem(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'sample';
}

/** WAV bytes + filename for one decoded stroke. */
function strokeWav(stroke: InspectorStroke, baseName: string): { bytes: Uint8Array; filename: string } {
  const bytes = encodeWav(normalizeChannels(stroke.channels), SAMPLE_RATE);
  return { bytes, filename: `${safeStem(baseName)}_S${stroke.summary.index + 1}.wav` };
}

export function StrokeList({ strokes, playable, name = 'sample' }: { strokes: InspectorStroke[]; playable: boolean; name?: string }) {
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

  const exportable = strokes.filter((s) => s.summary.ok);
  function exportZip() {
    const files: Record<string, Uint8Array> = {};
    for (const s of exportable) {
      const { bytes, filename } = strokeWav(s, name);
      files[filename] = bytes;
    }
    downloadBytes(zipSync(files), `${safeStem(name)}_samples.zip`);
  }

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h4 style={{ margin: 0 }}>STROKES</h4>
        {playable && exportable.length > 1 && (
          <button className="on-btn on-btn--secondary" onClick={exportZip} style={{ fontSize: 11 }}>
            Export all (.zip)
          </button>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        {strokes.map((s) => <StrokeRow key={s.summary.index} stroke={s} playable={playable} name={name} />)}
      </div>
    </div>
  );
}

function StrokeRow({ stroke, playable, name }: { stroke: InspectorStroke; playable: boolean; name: string }) {
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  // Stop any playing audio if this row unmounts (e.g. a new file is loaded).
  useEffect(() => () => { stopRef.current?.(); }, []);

  function play() {
    stopRef.current = playPcm(stroke.channels, () => { stopRef.current = null; setPlaying(false); });
    setPlaying(true);
  }
  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
  }

  const s = stroke.summary;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={playing ? stop : play}
          disabled={!playable || !s.ok}
          style={{ padding: '4px 10px', borderRadius: 6, cursor: playable && s.ok ? 'pointer' : 'not-allowed', border: '1px solid var(--red)', background: 'var(--red)', color: 'var(--text-on-accent)', fontSize: 11 }}
        >
          {playing ? 'Stop' : 'Play'}
        </button>
        <button
          onClick={() => { const { bytes, filename } = strokeWav(stroke, name); downloadBytes(bytes, filename); }}
          disabled={!playable || !s.ok}
          title="Download this sample as a WAV file"
          style={{ padding: '4px 10px', borderRadius: 6, cursor: playable && s.ok ? 'pointer' : 'not-allowed', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontSize: 11 }}
        >
          WAV
        </button>
        <span className="ps-sub" style={{ margin: 0 }}>
          Sample {s.index + 1}{s.rootNote ? ` · ${s.rootNote}` : ''} · {s.channels === 2 ? 'stereo' : 'mono'} · {(s.sampleCount / SAMPLE_RATE).toFixed(1)}s
          {s.loops !== undefined && (
            <span title={s.loops ? 'Sample loops' : 'Plays once (no loop)'}> · {s.loops ? '↻ loops' : 'one-shot'}</span>
          )}
          {s.loops && s.loopStart != null && s.loopEnd != null && (
            <span> · loop {(s.loopStart / SAMPLE_RATE).toFixed(2)}–{(s.loopEnd / SAMPLE_RATE).toFixed(2)}s</span>
          )}
        </span>
      </div>
      {s.ok && (
        <WaveCanvas
          pcm={stroke.channels[0]}
          loop={s.loops && s.loopStart != null && s.loopEnd != null ? { start: s.loopStart, end: s.loopEnd } : undefined}
        />
      )}
    </div>
  );
}
