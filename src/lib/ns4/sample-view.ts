/**
 * Sample Inspector view-model — pure derivations from the decoded .nsmp layer to
 * display data. No DOM, no audio. Reused by the Sample Inspector components.
 */
import type { NsmpFile, DecodedStrokeResult } from './nsmp';
import { readNsmpZones, readGlobalLevelDetune, perNoteCustomCount } from './nsmp';
import { dsp2Level, dsp2Detune } from './nw1-dsp';
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
  /** Global + per-note level/detune, read-only. Computed by {@link gainDetuneView}
   *  (kept off {@link sampleHeaderView} so its callers/tests stay unchanged). */
  gainDetune?: {
    isDefault: boolean;
    /** Raw stored values (Q20 level, s24 detune). */
    level: number; detune: number;
    /** Interpreted via the NSE converters: gain in dB, detune in cents. */
    gainDb: number; detuneCents: number;
    customNotes: number;
  };
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

/** Read-only global + per-note level/detune for the header. Null-safe: returns
 *  undefined when there's no `map` section to read. */
export function gainDetuneView(bytes: Uint8Array): SampleHeaderView['gainDetune'] {
  const g = readGlobalLevelDetune(bytes);
  if (!g) return undefined;
  return {
    isDefault: g.isDefault, level: g.level, detune: g.detune,
    gainDb: dsp2Level(g.level), detuneCents: dsp2Detune(g.detune),
    customNotes: perNoteCustomCount(bytes),
  };
}

export interface ZoneRow {
  /** The stroke this zone plays, by global id. */
  globalID: number;
  /** Root key as a note name. */
  rootNote: string;
  /** Zone bottom key as a note name. */
  btmNote: string;
  /** Zone top key as a note name. */
  topNote: string;
  /** Bottom velocity of this layer (velMin). */
  velLow: number;
  /** Top velocity of this layer (velMax). */
  velTop: number;
}

/** The zone/key map as display rows. Reads the `map` section via readNsmpZones. */
export function zoneMapRows(bytes: Uint8Array): ZoneRow[] {
  return readNsmpZones(bytes).map((z) => ({
    globalID: z.globalID,
    rootNote: noteName(z.rootKey),
    btmNote: noteName(z.keyLow),
    topNote: noteName(z.keyHigh),
    velLow: z.velLow,
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
  /** Loop in/out, per-channel samples from stroke start (only when looping). */
  loopStart?: number;
  loopEnd?: number;
}

export function strokeSummary(d: DecodedStrokeResult): StrokeSummary {
  const sampleCount = d.channels[0]?.length ?? 0;
  return {
    index: d.index, sampleCount, channels: d.channelCount,
    peak: peakAmplitude(d.channels), ok: sampleCount > 0,
    loops: d.loop ? d.loop.loops : undefined,
    loopStart: d.loop?.loops ? d.loop.loopStart : undefined,
    loopEnd: d.loop?.loops ? d.loop.loopEnd : undefined,
  };
}
