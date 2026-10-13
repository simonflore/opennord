import { readNsmp, decodeNsmp, readNsmpZones, readSampleUnison, readNoteAlternates, type NsmpFile, type DecodedStrokeResult, type NsmpZone } from '../../lib/ns4/nsmp';
import { gainDetuneView, strokeSummary, noteName } from '../../lib/ns4/sample-view';
import { buildPlayableZones, strokeKeyboardOrder, type PlayableZone } from '../../lib/ns4/playable-zones';
import { createSampler, type Sampler, type AmpEnvelope } from './sampleEngine';
import type { InspectorStroke } from './StrokeList';
import { playPcm } from './audioPlayer';

export interface LoadedSample {
  bytes: Uint8Array;
  file: NsmpFile;
  /** Source filename stem — display fallback when the file carries no name (OG). */
  name: string;
  decoded: DecodedStrokeResult[];
  /** Zone map parsed once at load (consumed by the editor's initial model). */
  zones: NsmpZone[];
  strokes: InspectorStroke[];
  /** Codec we can decode audio for — OG (legacy), 3 or 4. */
  decodable: boolean;
  /** Gapless playable zone layout for the sampler + keyboard highlight. */
  playableZones: PlayableZone[];
  /** globalID → keyboard position (0-based) for StrokeList ordering. */
  order: Map<number, number>;
  /** globalID → decoded stroke (sampler needs audio + loop info). */
  strokesByGlobalID: Map<number, DecodedStrokeResult>;
  /** Polyphonic player, null when audio isn't decodable. */
  sampler: Sampler | null;
}

/**
 * Parse a sample's bytes into everything a view needs to show and play it. `live`
 * are getters the sampler reads at each note-on, so a caller can change the
 * envelope or unison level without rebuilding the sampler.
 */
export function loadSample(
  bytes: Uint8Array, name: string,
  live: { env: () => AmpEnvelope | null; unisonLevel: () => number },
): LoadedSample {
  const file = readNsmp(bytes);
  const decodable = file.codec === 3 || file.codec === 4 || file.legacy;
  let decoded: DecodedStrokeResult[] = [];
  if (decodable) {
    try { decoded = decodeNsmp(bytes); } catch { decoded = []; }
  }
  const zones: NsmpZone[] = file.recognized ? readNsmpZones(bytes) : [];
  // A zone references its stroke by globalID; the zone's rootKey is that
  // stroke's recorded pitch. Join here (both in scope) so each stroke row can
  // show its root note. First match wins if a stroke is shared across zones.
  const rootByGlobalID = new Map<number, number>();
  for (const z of zones) if (!rootByGlobalID.has(z.globalID)) rootByGlobalID.set(z.globalID, z.rootKey);
  const strokes: InspectorStroke[] = decoded.map((d) => {
    const root = rootByGlobalID.get(d.globalID);
    const summary = root != null ? { ...strokeSummary(d), rootNote: noteName(root), rootMidi: root } : strokeSummary(d);
    return { summary, channels: d.channels };
  });
  const stem = name.replace(/\.[^./]+$/, '');
  const playableZones = buildPlayableZones(zones);
  const order = strokeKeyboardOrder(zones);
  const strokesByGlobalID = new Map(decoded.map((d) => [d.globalID, d]));
  // Play at the sample's authored pitch: apply its stored global detune (0 for
  // the common default). Gain is deliberately NOT applied — the audio is peak-
  // normalized per stroke, so the stored level would fight that, not reproduce it.
  const detuneCents = gainDetuneView(bytes)?.detuneCents ?? 0;
  // Unison and repeated-note variation play the way the instrument voices them: the
  // sample's own values, and its neighbouring recordings per key (see sampleEngine).
  const sampler = decodable
    ? createSampler(playableZones, strokesByGlobalID, live.env, {
      detuneCents, unison: readSampleUnison(bytes), unisonLevel: live.unisonLevel, alternates: readNoteAlternates(bytes),
    })
    : null;
  return { bytes, file, name: stem, decoded, zones, strokes, decodable, playableZones, order, strokesByGlobalID, sampler };
}

/**
 * Audition the sample mapped to zone `index`. A zone references its stroke by
 * `globalID` (not position), so we join the parsed zone to the decoded stroke on
 * that id (see nsmp.ts). No-op if the zone has no decoded audio.
 */
export function playZone(loaded: LoadedSample, index: number): void {
  const zone = loaded.zones[index];
  if (!zone) return;
  const stroke = loaded.decoded.find((s) => s.globalID === zone.globalID);
  if (stroke) playPcm(stroke.channels, undefined, stroke.sampleRate);
}
