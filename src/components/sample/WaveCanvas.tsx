import { useEffect, useRef } from 'react';
import { peaks } from '../../lib/ns4/nsmp-audio';

/** Draws a mono waveform (channel 0) from raw integer PCM onto a canvas. */
export function WaveCanvas({ pcm, height = 64 }: { pcm: Int32Array; height?: number }) {
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
    ctx.fillStyle = '#ff3b3b';
    const mid = height / 2;
    bars.forEach(([lo, hi], x) => {
      const yHi = mid - (hi / peak) * mid;
      const yLo = mid - (lo / peak) * mid;
      ctx.fillRect(x, yHi, 1, Math.max(1, yLo - yHi));
    });
  }, [pcm, height]);
  return <canvas ref={ref} width={600} height={height} style={{ width: '100%', height, background: '#10384e', borderRadius: 6, display: 'block' }} />;
}
