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

/** WAV bytes + filename for one decoded stroke.
 *  Encodes the root note into the name (e.g. `Pad_S3_C4.wav`) so the pitch is
 *  recoverable from the file alone when rebuilding a sample project in NSE. */
function strokeWav(stroke: InspectorStroke, baseName: string): { bytes: Uint8Array; filename: string } {
  const s = stroke.summary;
  // Preserve loop points as a `smpl` chunk so the loop survives round-tripping
  // back into a Nord Sample Editor project (the community "looping hack").
  const loop = s.loops && s.loopStart != null && s.loopEnd != null
    ? { start: s.loopStart, end: s.loopEnd, unityNote: s.rootMidi }
    : undefined;
  const bytes = encodeWav(normalizeChannels(stroke.channels), SAMPLE_RATE, loop);
  const root = s.rootNote ? `_${safeStem(s.rootNote)}` : '';
  return { bytes, filename: `${safeStem(baseName)}_S${s.index + 1}${root}.wav` };
}

export function StrokeList({ strokes, playable, name = 'sample', order, globalIDOf, soundingGlobalIDs, playheadOf }: {
  strokes: InspectorStroke[]; playable: boolean; name?: string;
  order?: Map<number, number>; globalIDOf?: (strokeIndex: number) => number | undefined;
  soundingGlobalIDs?: ReadonlySet<number>;
  /** Normalized 0..1 playhead for a stroke by its index, or null when silent. */
  playheadOf?: (strokeIndex: number) => number | null;
}) {
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

  const sIndex = (s: InspectorStroke): number => {
    const gid = globalIDOf?.(s.summary.index);
    const pos = gid != null ? order?.get(gid) : undefined;
    return pos ?? Number.MAX_SAFE_INTEGER; // orphans last
  };
  const rows = order ? [...strokes].sort((a, b) => sIndex(a) - sIndex(b)) : strokes;

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
        {rows.map((s) => {
          const gid = globalIDOf?.(s.summary.index);
          const sNumber = order && gid != null ? (order.get(gid) ?? null) : null;
          const sounding = !!soundingGlobalIDs && globalIDOf != null && gid != null && soundingGlobalIDs.has(gid);
          return (
            <StrokeRow key={s.summary.index} stroke={s} playable={playable} name={name}
              sNumber={sNumber} sounding={sounding}
              playhead={playheadOf ? playheadOf(s.summary.index) : undefined} />
          );
        })}
      </div>
    </div>
  );
}

function StrokeRow({ stroke, playable, name, sNumber, sounding, playhead }: {
  stroke: InspectorStroke; playable: boolean; name: string;
  sNumber?: number | null; sounding?: boolean;
  /** Normalized 0..1 playhead position from the sampler, or null/undefined when silent. */
  playhead?: number | null;
}) {
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
    <div style={{ marginBottom: 10, borderLeft: sounding ? '3px solid var(--red-bright)' : '3px solid transparent', paddingLeft: 6 }}>
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
          Sample {sNumber != null ? sNumber + 1 : s.index + 1}{s.rootNote ? ` · ${s.rootNote}` : ''} · {s.channels === 2 ? 'stereo' : 'mono'} · {(s.sampleCount / SAMPLE_RATE).toFixed(1)}s
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
          playhead={playhead}
        />
      )}
    </div>
  );
}
