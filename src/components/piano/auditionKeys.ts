import type { NspZone } from '@/lib/ns4/nsp';
import { noteName } from '@/lib/ns4/sample-view';

/** One key of a quick audition: which recording to play and how far to re-pitch it. */
export interface AuditionKey {
  id: string;
  /** What the player sees: "C4", or "Low"/"Middle"/"High" without a key map. */
  label: string;
  /** Key zone index (directory order). */
  zone: number;
  /** Re-pitch from the recording's root to the key, in semitones. */
  semitones: number;
}

/** C2 … C6: the octaves a player reaches for to hear a piano's range. */
const TARGETS = [36, 48, 60, 72, 84];

/**
 * A handful of keys to hear a piano by: every C from C2 to C6 the piano covers, each
 * played from the recording mapped to it and re-pitched to the exact note, like the
 * instrument does across a zone. Without a key map that agrees with the recordings, falls
 * back to the lowest, middle and highest recording as recorded.
 */
export function auditionKeys(zones: readonly NspZone[], zoneCount: number): AuditionKey[] {
  if (zoneCount === 0) return [];
  if (zones.length === zoneCount) {
    const keys: AuditionKey[] = [];
    for (const note of TARGETS) {
      const zone = zones.findIndex((k) => k.lowNote <= note && note <= k.highNote);
      if (zone >= 0) keys.push({ id: `note-${note}`, label: noteName(note), zone, semitones: note - zones[zone].rootNote });
    }
    if (keys.length > 0) return keys;
  }
  const picks = [...new Set([0, Math.floor((zoneCount - 1) / 2), zoneCount - 1])];
  const labels = picks.length === 3 ? ['Low', 'Middle', 'High'] : picks.length === 2 ? ['Low', 'High'] : ['Play'];
  return picks.map((zone, i) => ({ id: `zone-${zone}`, label: labels[i], zone, semitones: 0 }));
}
