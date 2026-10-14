import { useEffect, useMemo, useRef } from 'react';
import { peaks } from '../../lib/ns4/nsmp-audio';

const WIDTH = 600; // canvas pixels; CSS stretches it to the container

/** Draws a mono waveform (channel 0) from raw integer PCM onto a canvas, with an
 *  optional shaded loop region (per-channel sample indices). `fill` stretches it to its
 *  container's height instead of `height` px (which stays the drawing's resolution). */
export function WaveCanvas(
  { pcm, height = 64, fill = false, loop, playhead }:
  {
    pcm: Int32Array; height?: number; fill?: boolean; loop?: { start: number; end: number };
    playhead?: number | null;
  },
) {
  const ref = useRef<HTMLCanvasElement>(null);
  // The bars and the peak depend only on the audio, so moving the loop or the playhead only redraws.
  const { bars, peak } = useMemo(() => {
    let max = 0;
    for (let i = 0; i < pcm.length; i++) { const a = Math.abs(pcm[i]); if (a > max) max = a; }
    return { bars: peaks(pcm, WIDTH), peak: max || 1 };
  }, [pcm]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const width = cv.width;
    ctx.clearRect(0, 0, width, height);
    // Loop region first, so the waveform draws on top.
    if (loop && pcm.length > 0 && loop.end > loop.start) {
      const x0 = Math.max(0, Math.min(width, (loop.start / pcm.length) * width));
      const x1 = Math.max(0, Math.min(width, (loop.end / pcm.length) * width));
      ctx.fillStyle = getComputedStyle(cv).getPropertyValue('--accent-soft').trim() || 'rgba(255,106,26,0.14)';
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), height);
    }
    // Canvas fillStyle can't take a CSS var() — resolve the token off the element.
    ctx.fillStyle = getComputedStyle(cv).getPropertyValue('--wave').trim() || '#ecebe6';
    const mid = height / 2;
    bars.forEach(([lo, hi], x) => {
      const yHi = mid - (hi / peak) * mid;
      const yLo = mid - (lo / peak) * mid;
      ctx.fillRect(x, yHi, 1, Math.max(1, yLo - yHi));
    });
    if (playhead != null && playhead >= 0) {
      const px = Math.max(0, Math.min(width, playhead * width));
      ctx.fillStyle = getComputedStyle(cv).getPropertyValue('--red-bright').trim() || '#ff5a5a';
      ctx.fillRect(px, 0, 2, height);
    }
  }, [pcm, bars, peak, height, loop, playhead]);
  return <canvas ref={ref} width={WIDTH} height={height} style={{ width: '100%', height: fill ? '100%' : height, background: 'var(--wave-bg)', borderRadius: 6, display: 'block' }} />;
}
