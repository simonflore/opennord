import { useEffect, useRef } from 'react';
import { peaks } from '../../lib/ns4/nsmp-audio';

/** Draws a mono waveform (channel 0) from raw integer PCM onto a canvas, with an
 *  optional shaded loop region (in/out as per-channel sample indices). */
export function WaveCanvas(
  { pcm, height = 64, loop }:
  { pcm: Int32Array; height?: number; loop?: { start: number; end: number } },
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const width = cv.width;
    const bars = peaks(pcm, width);
    let peak = 0;
    for (let i = 0; i < pcm.length; i++) { const a = Math.abs(pcm[i]); if (a > peak) peak = a; }
    if (peak === 0) peak = 1;
    ctx.clearRect(0, 0, width, height);
    // Loop region first, so the waveform draws on top.
    if (loop && pcm.length > 0 && loop.end > loop.start) {
      const x0 = Math.max(0, Math.min(width, (loop.start / pcm.length) * width));
      const x1 = Math.max(0, Math.min(width, (loop.end / pcm.length) * width));
      ctx.fillStyle = getComputedStyle(cv).getPropertyValue('--accent-soft').trim() || 'rgba(224,32,46,0.18)';
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), height);
    }
    // Canvas fillStyle can't take a CSS var() — resolve the token off the element.
    ctx.fillStyle = getComputedStyle(cv).getPropertyValue('--wave').trim() || '#ff3b3b';
    const mid = height / 2;
    bars.forEach(([lo, hi], x) => {
      const yHi = mid - (hi / peak) * mid;
      const yLo = mid - (lo / peak) * mid;
      ctx.fillRect(x, yHi, 1, Math.max(1, yLo - yHi));
    });
  }, [pcm, height, loop]);
  return <canvas ref={ref} width={600} height={height} style={{ width: '100%', height, background: 'var(--lcd-bg)', borderRadius: 6, display: 'block' }} />;
}
