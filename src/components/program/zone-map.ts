/**
 * Geometry for the keyboard zone map: where a split-point note sits across an
 * 88-key keyboard (A0–C8), and which stretch of it each layer plays. Pure, so
 * ProgramZones only draws.
 *
 * The map is drawn on the 88-key layout for every program: a file doesn't say
 * which keyboard size it was made on, and split points are notes, not positions.
 */

export const LOWEST = 21;   // A0
export const HIGHEST = 108; // C8
const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BLACK = new Set([1, 3, 6, 8, 10]);

const isBlack = (midi: number) => BLACK.has(midi % 12);

/** White keys strictly below `midi` on the 88-key board. */
function whitesBelow(midi: number): number {
  let n = 0;
  for (let m = LOWEST; m < midi; m++) if (!isBlack(m)) n++;
  return n;
}

export const WHITE_KEYS = whitesBelow(HIGHEST + 1); // 52

/** "C4" / "F#5" / "Bb2" → MIDI note (C4 = 60), or null when it isn't a note name. */
export function noteToMidi(name: string): number | null {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!m) return null;
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + PITCH[m[1]] + acc;
}

/** Left edge of a key, as a 0–1 fraction of the keyboard width. */
export function keyX(midi: number): number {
  const clamped = Math.max(LOWEST, Math.min(HIGHEST, midi));
  const w = whitesBelow(clamped);
  // A black key sits across the line between two whites, a little left of it.
  return (isBlack(clamped) ? w - 0.3 : w) / WHITE_KEYS;
}

/** Every black key's left edge (0–1), for drawing the keyboard. */
export const BLACK_KEYS: number[] = [];
for (let m = LOWEST; m <= HIGHEST; m++) if (isBlack(m)) BLACK_KEYS.push(keyX(m));
export const BLACK_KEY_WIDTH = 0.6 / WHITE_KEYS;

export interface ZoneLayer { kind: string; id: string }
export interface Lane { kind: string; id: string; segments: { from: number; to: number }[] }
export interface Split { x: number; note: string; xfade: string | null }

const KIND_ORDER: Record<string, number> = { organ: 0, piano: 1, synth: 2 };

/**
 * Turn the four zones + three optional split points into one lane per layer.
 * A split point that is off doesn't divide the keyboard, so the zones on both
 * sides of it share one stretch; a layer covers a stretch if it plays in any
 * zone there. Adjacent stretches a layer covers merge into one segment.
 */
export function zoneLanes(
  zones: { layers: ZoneLayer[] }[],
  boundaries: (string | null)[],
  xfade: (string | null)[],
): { lanes: Lane[]; splits: Split[] } {
  const splits: Split[] = [];
  const edges: (number | null)[] = [0];
  boundaries.forEach((b, i) => {
    const midi = b ? noteToMidi(b) : null;
    const x = midi === null ? null : keyX(midi);
    edges.push(x);
    if (x !== null && b) splits.push({ x, note: b, xfade: xfade[i] ?? null });
  });
  edges.push(1);

  // Zone i spans from the nearest real edge at or left of it to the next one right of it.
  const span = (i: number) => {
    let from = 0, to = 1;
    for (let e = i; e >= 0; e--) { const v = edges[e]; if (v !== null) { from = v; break; } }
    for (let e = i + 1; e < edges.length; e++) { const v = edges[e]; if (v !== null) { to = v; break; } }
    return { from, to };
  };

  const byLayer = new Map<string, Lane>();
  zones.forEach((zone, i) => {
    const s = span(i);
    for (const l of zone.layers) {
      const key = `${l.kind}${l.id}`;
      const lane = byLayer.get(key) ?? { kind: l.kind, id: l.id, segments: [] };
      if (!lane.segments.some((g) => g.from === s.from && g.to === s.to)) lane.segments.push({ ...s });
      byLayer.set(key, lane);
    }
  });

  const lanes = [...byLayer.values()].sort(
    (a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || a.id.localeCompare(b.id),
  );
  for (const lane of lanes) {
    lane.segments.sort((a, b) => a.from - b.from);
    lane.segments = lane.segments.reduce<Lane['segments']>((out, g) => {
      const last = out[out.length - 1];
      if (last && g.from <= last.to) last.to = Math.max(last.to, g.to);
      else out.push(g);
      return out;
    }, []);
  }
  return { lanes, splits };
}

/** "+/- 12 semitones" → "±12" — the crossfade width, as a player would say it. */
export function shortXfade(x: string): string {
  return x.replace(/^\+\/-\s*/, '±').replace(/\s*semitones?$/, '');
}
