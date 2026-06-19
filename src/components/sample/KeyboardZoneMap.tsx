import { useRef, useState } from 'react';
import type { EditZone } from '../../lib/ns4/sample-edit';
import { tileZones, clampKeyHigh, keyFraction, keyFromFraction, isBlackKey, KEY_MIN, KEY_MAX } from '../../lib/ns4/keyboard-view';
import { noteName } from '../../lib/ns4/sample-view';

const W = 1000;
const SEMI = W / (KEY_MAX - KEY_MIN);
const ZONE_TOP = 8, ZONE_H = 56;
const KB_TOP = 82, KB_H = 92;
const VIEW_H = KB_TOP + KB_H + 2;
// Categorical sample-zone palette — dim hues so adjacent samples read apart. A
// documented data-viz exception to the single-accent rule (like the LCD blues).
const ZONE_FILL = ['#2f4a59', '#473a59', '#593a3f', '#3a5945', '#534a2c', '#3f3a59'];

const xOf = (midi: number) => keyFraction(midi) * W;

/**
 * The keyboard zone map: each sample is a colored band across the keys it covers.
 * Click a band to select it (and audition it when `onPlayZone` is set). When
 * `onChangeKeyHigh` is provided the split points become draggable handles to
 * remap keys; omit it for a read-only view (e.g. legacy .nsmp, which we decode
 * but don't edit in place).
 */
export function KeyboardZoneMap({ zones, selected, onSelect, onChangeKeyHigh, onPlayZone }: {
  zones: EditZone[];
  selected: number;
  onSelect: (index: number) => void;
  /** Remap a zone's top key by dragging a split handle. Omit for a read-only map. */
  onChangeKeyHigh?: (index: number, keyHigh: number) => void;
  /** Audition the sample mapped to a zone (by original index). When set, clicking a band plays it. */
  onPlayZone?: (index: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const tiled = tileZones(zones);

  const keyAt = (clientX: number): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    return keyFromFraction((clientX - rect.left) / rect.width);
  };

  const blacks: number[] = [];
  for (let m = KEY_MIN; m <= KEY_MAX; m++) if (isBlackKey(m)) blacks.push(m);
  const octaves: number[] = [];
  for (let m = 24; m <= KEY_MAX; m += 12) octaves.push(m);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${VIEW_H}`} className="ps-kbd" role="group" aria-label="Keyboard zone map">
      <rect x="0" y={KB_TOP} width={W} height={KB_H} rx="4" fill="var(--ink)" />
      {blacks.map((m) => (
        <rect key={m} x={xOf(m) + 1} y={KB_TOP} width={SEMI - 2} height={KB_H * 0.62} fill="var(--bg)" />
      ))}
      {octaves.map((m) => (
        <text key={m} x={xOf(m) + 3} y={KB_TOP + KB_H - 5} fontSize="13" fill="var(--muted)" fontFamily="var(--mono)">{noteName(m)}</text>
      ))}

      {tiled.map((z, pos) => {
        const x = xOf(z.keyLow);
        const w = xOf(z.keyHigh + 1) - x;
        const isSel = z.index === selected;
        return (
          <g key={z.index} onClick={() => { onSelect(z.index); onPlayZone?.(z.index); }} style={{ cursor: 'pointer' }}>
            {/* Label by keyboard position (pos), not stroke order — S1 is always
                the leftmost zone. onSelect/onPlayZone still use z.index to map
                back to the underlying zone/stroke. */}
            <title>{onPlayZone ? `S${pos + 1} — click to audition` : `S${pos + 1}`}</title>
            <rect x={x + 1} y={ZONE_TOP} width={Math.max(0, w - 2)} height={ZONE_H} rx="4"
              fill={ZONE_FILL[pos % ZONE_FILL.length]}
              stroke={isSel ? 'var(--red-bright)' : 'var(--line)'} strokeWidth={isSel ? 2.5 : 1} />
            {w > 26 ? (
              <text x={x + w / 2} y={ZONE_TOP + ZONE_H / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">
                S{pos + 1}
              </text>
            ) : (
              // Too narrow for a horizontal label — rotate it so every zone stays identifiable.
              <text x={x + w / 2} y={ZONE_TOP + ZONE_H / 2} textAnchor="middle" dominantBaseline="middle"
                fontSize="12" fontWeight="700" fill="var(--ink)"
                transform={`rotate(-90 ${x + w / 2} ${ZONE_TOP + ZONE_H / 2})`}>
                S{pos + 1}
              </text>
            )}
          </g>
        );
      })}

      {onChangeKeyHigh && tiled.slice(0, -1).map((z, pos) => {
        const hx = xOf(z.keyHigh + 1);
        return (
          <g key={`h${pos}`} style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); setDrag(pos); }}
            onPointerMove={(e) => { if (drag === pos) onChangeKeyHigh(tiled[pos].index, clampKeyHigh(tiled, pos, keyAt(e.clientX))); }}
            onPointerUp={(e) => { (e.target as Element).releasePointerCapture(e.pointerId); setDrag(null); }}>
            <rect x={hx - 9} y={ZONE_TOP} width={18} height={KB_TOP + KB_H - ZONE_TOP} fill="transparent" />
            <line x1={hx} y1={ZONE_TOP} x2={hx} y2={KB_TOP + KB_H} stroke="var(--ink)" strokeWidth={drag === pos ? 3 : 1.5} />
            <circle cx={hx} cy={ZONE_TOP + 5} r="6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}
