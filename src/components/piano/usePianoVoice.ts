import { useEffect, useMemo, useRef, useState } from 'react';
import { getSharedCtx, playPcm } from '@/components/sample/audioPlayer';
import { NSP_SAMPLE_RATE, decodeNspStroke, readNspDirectory, strokeFor } from '@/lib/ns4/nsp-audio';
import { getErrorMessage } from '@/lib/errors';

/**
 * One voice for auditioning a piano on this machine: decodes the one recording a tap
 * asks for, on demand, and plays it through the shared player (`docs/LEGAL.md` — local
 * access only, nothing leaves the device). `toggle` starts a note, or stops it when it
 * is the one playing.
 */
export function usePianoVoice(bytes: Uint8Array | null) {
  const dir = useMemo(() => (bytes ? readNspDirectory(bytes) : undefined), [bytes]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => { stopRef.current?.(); }, [bytes]);

  /**
   * Play key zone `zone` at `velocity` (1–127) under the id `key`. `semitones` re-pitches
   * the recording the way a sampler stretches a zone across its keys (0 = as recorded).
   */
  function toggle(key: string, zone: number, velocity: number, semitones = 0) {
    // Unlock audio inside every tap: iPad suspends (or WebKit 'interrupts') the shared
    // context in the background, and a folder piano has no other tap that would.
    getSharedCtx();
    setError('');
    if (playing === key) { stopRef.current?.(); return; }
    if (!bytes || !dir) return;
    const stroke = strokeFor(dir, zone, velocity);
    if (!stroke) return;
    try {
      const pcm = decodeNspStroke(bytes, dir, stroke);
      const rate = NSP_SAMPLE_RATE * 2 ** (semitones / 12);
      // The previous note's `ended` fires after this one starts: only the current note may clear the handle.
      const stop = playPcm(pcm, () => {
        if (stopRef.current !== stop) return;
        stopRef.current = null;
        setPlaying((p) => (p === key ? null : p));
      }, rate);
      stopRef.current = stop;
      setPlaying(key);
    } catch (e) {
      setError(`Couldn't play this note: ${getErrorMessage(e)}`);
    }
  }

  /** Key zones the directory holds. */
  const zoneCount = dir ? dir.strokes.reduce((n, s) => Math.max(n, s.zone + 1), 0) : 0;

  return { dir, zoneCount, playing, error, toggle };
}
