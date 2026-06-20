/**
 * Sample Inspector view-model — pure derivations from the decoded .nsmp layer to
 * display data. No DOM, no audio. Reused by the Sample Inspector components.
 */
import type { NsmpFile, DecodedStrokeResult } from './nsmp';
import { readNsmpZones } from './nsmp';
import { peakAmplitude } from './nsmp-audio';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** MIDI note number → scientific name (C4 = 60, A0 = 21, C-1 = 0). */
export function noteName(midi: number): string {
  const n = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${n}${Math.floor(midi / 12) - 1}`;
}

export interface SampleHeaderView {
  name: string;
  /** ".nsmp (OG)" / ".nsmp3" / ".nsmp4" / "—". */
  codecLabel: string;
  version: string;
  checksumOk: boolean;
  /** False for OG `.nsmp` — it predates the CRC field, so there's nothing to verify. */
  checksumKnown: boolean;
  strokeCount: number;
  sizeBytes: number;
  isFactory: boolean;
}

/** Display label for a sample's generation: ".nsmp (OG)" / ".nsmp3" / ".nsmp4" / "—". */
export function nsmpGenerationLabel(file: NsmpFile): string {
  if (file.legacy) return '.nsmp (OG)';
  return file.codec ? `.nsmp${file.codec}` : '—';
}

export function sampleHeaderView(file: NsmpFile, sizeBytes: number, fallbackName?: string): SampleHeaderView {
  return {
    name: file.name?.trim() || fallbackName?.trim() || 'Unnamed',
    codecLabel: nsmpGenerationLabel(file),
    version: file.version ?? '—',
    checksumOk: file.checksumValid,
    checksumKnown: !file.legacy,
    strokeCount: file.strokeCount,
    sizeBytes,
    isFactory: file.suspectedFactory,
  };
}

export interface ZoneRow {
  /** The stroke this zone plays, by global id. */
  globalID: number;
  /** Root key as a note name. */
  rootNote: string;
  /** Zone top key as a note name. */
  topNote: string;
  /** Top velocity of this layer. */
  velTop: number;
}

/** The zone/key map as display rows. Reads the `map` section via readNsmpZones. */
export function zoneMapRows(bytes: Uint8Array): ZoneRow[] {
  return readNsmpZones(bytes).map((z) => ({
    globalID: z.globalID,
    rootNote: noteName(z.rootKey),
    topNote: noteName(z.keyHigh),
    velTop: z.velTop,
  }));
}

export interface StrokeSummary {
  index: number;
  sampleCount: number;
  channels: number;
  peak: number;
  ok: boolean;
  /** Whether the stroke loops; undefined when the loop region wasn't decodable. */
  loops?: boolean;
}

export function strokeSummary(d: DecodedStrokeResult): StrokeSummary {
  const sampleCount = d.channels[0]?.length ?? 0;
  return {
    index: d.index, sampleCount, channels: d.channelCount,
    peak: peakAmplitude(d.channels), ok: sampleCount > 0,
    loops: d.loop ? d.loop.loops : undefined,
  };
}
