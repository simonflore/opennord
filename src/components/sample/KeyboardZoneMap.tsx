import { useRef, useState } from 'react';
import type { EditZone } from '../../lib/ns4/sample-edit';
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import { tileZones, clampKeyHigh, keyFraction, keyFromFraction, isBlackKey, KEY_MIN, KEY_MAX } from '../../lib/ns4/keyboard-view';
import { noteName } from '../../lib/ns4/sample-view';

const W = 1000;
const SEMI = W / (KEY_MAX - KEY_MIN);
const ZONE_TOP = 8, ZONE_H = 56;
const KB_TOP = 82, KB_H = 92;
const VIEW_H = KB_TOP + KB_H + 2;
// Categorical sample-zone palette — 6 dim hues so adjacent samples read apart,
// defined as --zone-1..6 tokens in tokens.css (a documented data-viz exception
// to the single-accent rule, like the LCD blues). SVG fill takes var() directly.
const ZONE_COUNT = 6;
const zoneFill = (pos: number) => `var(--zone-${(pos % ZONE_COUNT) + 1})`;

const xOf = (midi: number) => keyFraction(midi) * W;

/**
 * The keyboard zone map: each sample is a colored band across the keys it covers.
 * Click a band to select it (and audition it when `onPlayZone` is set). When
 * `onChangeKeyHigh` is provided the split points become draggable handles to
 * remap keys; omit it for a read-only view (e.g. legacy .nsmp, which we decode
 * but don't edit in place).
 *
 * Optional playable-mode props (`onNoteOn`/`onNoteOff`/`soundingMidis`/`playableZones`)
 * turn the whole surface into a hold-to-play keyboard: pointer-down gates a note,
 * dragging retriggers across keys, and now-playing / root / range highlights appear.
 * When these props are absent the component behaves exactly as before.
 */
export function KeyboardZoneMap({ zones, selected, onSelect, onChangeKeyHigh, onPlayZone, onNoteOn, onNoteOff, soundingMidis, playableZones }: {
  zones: EditZone[];
  selected: number;
  onSelect: (index: number) => void;
  /** Remap a zone's top key by dragging a split handle. Omit for a read-only map. */
  onChangeKeyHigh?: (index: number, keyHigh: number) => void;
  /** Audition the sample mapped to a zone (by original index). When set, clicking a band plays it. */
  onPlayZone?: (index: number) => void;
  /** Gate a note on (playable mode). When set, pointer-down/drag play individual keys. */
  onNoteOn?: (midi: number) => void;
  /** Release a note (paired with onNoteOn). */
  onNoteOff?: (midi: number) => void;
  /** MIDI note numbers currently sounding — highlights the now-playing band. */
  soundingMidis?: ReadonlySet<number>;
  /** Gapless layout from buildPlayableZones — drives root markers + selected-range tint. */
  playableZones?: PlayableZone[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  // Tracks the held key in playable mode so drag-across retriggers cleanly.
  const held = useRef<number | null>(null);
  const tiled = tileZones(zones);

  const keyAt = (clientX: number): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    return keyFromFraction((clientX - rect.left) / rect.width);
  };

  const press = (clientX: number) => {
    if (!onNoteOn) return;
    const midi = keyAt(clientX);
    if (held.current === midi) return;
    if (held.current != null) onNoteOff?.(held.current);
    held.current = midi;
    // Keep the waveform panel in sync with the zone being played.
    const t = tiled.find((z) => midi >= z.keyLow && midi <= z.keyHigh);
    if (t != null) onSelect(t.index);
    onNoteOn(midi);
  };
  const release = () => {
    if (held.current != null) { onNoteOff?.(held.current); held.current = null; }
  };

  const blacks: number[] = [];
  for (let m = KEY_MIN; m <= KEY_MAX; m++) if (isBlackKey(m)) blacks.push(m);
  const octaves: number[] = [];
  for (let m = 24; m <= KEY_MAX; m += 12) octaves.push(m);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${VIEW_H}`}
      className="ps-kbd"
      role="group"
      aria-label="Keyboard zone map"
      onPointerDown={onNoteOn ? (e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); press(e.clientX); } : undefined}
      onPointerMove={onNoteOn ? (e) => { if (held.current != null) press(e.clientX); } : undefined}
      onPointerUp={onNoteOn ? release : undefined}
      onPointerLeave={onNoteOn ? release : undefined}
    >
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
        const isPlaying = !!soundingMidis && [...soundingMidis].some((m) => m >= z.keyLow && m <= z.keyHigh);
        return (
          <g key={z.index} onClick={() => { onSelect(z.index); onPlayZone?.(z.index); }} style={{ cursor: onNoteOn ? 'crosshair' : 'pointer' }}>
            {/* Label by keyboard position (pos), not stroke order — S1 is always
                the leftmost zone. onSelect/onPlayZone still use z.index to map
                back to the underlying zone/stroke. */}
            <title>{onPlayZone ? `S${pos + 1} — click to audition` : `S${pos + 1}`}</title>
            <rect x={x + 1} y={ZONE_TOP} width={Math.max(0, w - 2)} height={ZONE_H} rx="4"
              fill={zoneFill(pos)}
              stroke={isSel || isPlaying ? 'var(--red-bright)' : 'var(--line)'}
              strokeWidth={isPlaying ? 3 : isSel ? 2.5 : 1} />
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

      {/* Root key markers — a faint red tick at each zone's root note. */}
      {playableZones?.map((z, pos) => (
        <rect key={`r${z.globalID}-${pos}`}
          x={xOf(z.rootKey) + 1} y={KB_TOP} width={Math.max(1, SEMI - 2)} height={KB_H}
          fill="var(--red)" opacity={0.55} pointerEvents="none" />
      ))}

      {/* Selected-zone range tint over the key area. */}
      {selected >= 0 && playableZones != null && (() => {
        const sel = tiled.find((t) => t.index === selected);
        if (!sel) return null;
        const x = xOf(sel.keyLow), w = xOf(sel.keyHigh + 1) - x;
        return <rect x={x} y={KB_TOP} width={w} height={KB_H} fill="var(--accent-soft)" pointerEvents="none" />;
      })()}

      {/* Split-point drag handles (edit mode only — stopPropagation wins over play). */}
      {onChangeKeyHigh && tiled.slice(0, -1).map((z, pos) => {
        const hx = xOf(z.keyHigh + 1);
        return (
          <g key={`h${pos}`} style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => { e.stopPropagation(); (e.target as Element).setPointerCapture(e.pointerId); setDrag(pos); }}
            onPointerMove={(e) => { e.stopPropagation(); if (drag === pos) onChangeKeyHigh(tiled[pos].index, clampKeyHigh(tiled, pos, keyAt(e.clientX))); }}
            onPointerUp={(e) => { e.stopPropagation(); (e.target as Element).releasePointerCapture(e.pointerId); setDrag(null); }}>
            <rect x={hx - 9} y={ZONE_TOP} width={18} height={KB_TOP + KB_H - ZONE_TOP} fill="transparent" />
            <line x1={hx} y1={ZONE_TOP} x2={hx} y2={KB_TOP + KB_H} stroke="var(--ink)" strokeWidth={drag === pos ? 3 : 1.5} />
            <circle cx={hx} cy={ZONE_TOP + 5} r="6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}
