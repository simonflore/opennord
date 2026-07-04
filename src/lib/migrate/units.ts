/**
 * Parsers for the human-readable value strings the ns2/ns3 decoders emit
 * (dB labels from clavia/volume.ts NORD_DB, "0.5 ms" / "1.5 s" time tables,
 * "2.0 Hz" / "1 kHz" rate tables). The migrate layer normalizes everything
 * to MIDI 0–127, milliseconds, and Hz before mapping onto Stage 4 params.
 */
import { NORD_DB } from '../clavia/volume';

const dbIndex = new Map<string, number>(NORD_DB.map((s, i) => [s, i]));

export function dbStringToMidi(s: string): number | null {
  return dbIndex.get(s) ?? null;
}

export function timeStringToMs(s: string): number | null {
  const m = /(-?\d+(?:\.\d+)?)\s*(ms|s)\s*$/.exec(s);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return m[2] === 's' ? v * 1000 : v;
}

export function freqStringToHz(s: string): number | null {
  const m = /(-?\d+(?:\.\d+)?)\s*(k?Hz)\s*$/.exec(s);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return m[2] === 'kHz' ? v * 1000 : v;
}
