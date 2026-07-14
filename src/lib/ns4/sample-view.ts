/**
 * Sample Inspector view-model — pure derivations from the decoded .nsmp layer to
 * display data. No DOM, no audio. Reused by the Sample Inspector components.
 */
import type { NsmpFile, DecodedStrokeResult } from './nsmp';
import { readNsmpZones, readGlobalLevelDetune, perNoteCustomCount, readSampleUnison, readTruVibrato } from './nsmp';
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
  /** ".nsmp" / ".nsmp3" / ".nsmp4" / "—". */
  codecLabel: string;
  version: string;
  checksumOk: boolean;
  /** False for OG `.nsmp` — it predates the CRC field, so there's nothing to verify. */
  checksumKnown: boolean;
  strokeCount: number;
  sizeBytes: number;
  isFactory: boolean;
  /** Tru-Vibrato engaged (codec-4.2 samples only; undefined when not applicable). */
  truVibrato?: boolean;
  /** Unison voicing summary (codec-4 only), e.g. "on · 2 voices · round-robin". */
  unison?: string;
  /** Round-robin engaged (RandomStrokeMode set) — surfaced independently of unison. */
  roundRobin?: boolean;
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

/** Display label for a sample's generation: ".nsmp" / ".nsmp3" / ".nsmp4" / "—".
 *  The legacy generation is shown as its plain extension (".nsmp") — the internal
 *  "OG" codec name is never surfaced to players. */
export function nsmpGenerationLabel(file: NsmpFile): string {
  if (file.legacy) return '.nsmp';
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

/**
 * Read-only summary of the codec-4 `map` SampleUnison/voicing block. Null for
 * codec 3 (no such block). `summary` is a one-line musician-facing readout — most
 * real files are "off" (the whole known corpus is). Detune/pan are shown raw
 * (their value scale isn't pinned); gains use the known dB scale.
 */
/** Tru-Vibrato engaged? Undefined when not applicable (not a codec-4.2 sample).
 *  Kept off {@link sampleHeaderView} so its callers/tests stay unchanged. */
export function truVibratoView(bytes: Uint8Array): boolean | undefined {
  return readTruVibrato(bytes)?.on;
}

/** At-a-glance voicing badges for the header: unison summary + round-robin flag.
 *  Codec-4 only ({} otherwise). Round-robin is reported independently of unison
 *  because the rompler applies it whenever RandomStrokeMode is set. */
export function voicingView(bytes: Uint8Array): { unison?: string; roundRobin?: boolean } {
  const u = readSampleUnison(bytes);
  if (!u) return {};
  return {
    unison: u.active ? sampleUnisonView(bytes)?.summary : undefined,
    roundRobin: u.randomStrokeMode !== 0,
  };
}

export function sampleUnisonView(bytes: Uint8Array): { active: boolean; summary: string } | null {
  const u = readSampleUnison(bytes);
  if (!u) return null;
  if (!u.active) return { active: false, summary: 'off' };
  // Round-robin is intentionally NOT included here — it's surfaced on its own
  // (voicingView.roundRobin → its own pill), so listing it in the unison summary
  // too would signal it twice.
  const parts = [`${u.numVoiceSame} voices`];
  if (u.detuneMax) parts.push(`detune ${u.detuneMax}`);
  if (u.panMax) parts.push(`pan ${u.panMax}`);
  if (Math.abs(u.gainDbSame) >= 0.05) parts.push(`gain ${u.gainDbSame >= 0 ? '+' : '−'}${Math.abs(u.gainDbSame).toFixed(1)} dB`);
  return { active: true, summary: `on · ${parts.join(' · ')}` };
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
  /** Root note (e.g. "E3") of the zone that plays this stroke. Joined from the
   *  key map by globalID at load time; undefined when no zone references it. */
  rootNote?: string;
  /** The same root note as a MIDI number (for WAV `smpl` dwMIDIUnityNote). */
  rootMidi?: number;
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
