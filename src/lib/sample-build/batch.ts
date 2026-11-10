/**
 * Tools that work on a take, or on every take of a build at once: find a loop, set the level so
 * the loudest moment reaches a peak, and trim the silence at the ends. Pure: each returns a new
 * project (one undo step) and says what it did.
 */
import { takeOf, updateTake, type NewTake, type SampleProject, type Take, type Zone } from './model';
import type { ClipAudio, ReadAudio } from './render';
import { findLoop, type FoundLoop, type LoopSearch } from './analysis/loop';
import { splitOnSilence } from './analysis/split';

/** The loudest sample of a take as it is (before its level), in dBFS; null for silence. */
export function takePeakDb(take: Pick<Take, 'start' | 'end'>, audio: ClipAudio): number | null {
  let peak = 0;
  for (const ch of audio.channels) for (let i = take.start; i < take.end; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; }
  return peak > 0 ? 20 * Math.log10(peak) : null;
}

/** The level that brings a take's loudest moment to `peakDb`, to 0.01 dB; null for silence. */
export function normalizeGain(take: Pick<Take, 'start' | 'end'>, audio: ClipAudio, peakDb: number): number | null {
  const peak = takePeakDb(take, audio);
  return peak === null ? null : Math.round((peakDb - peak) * 100) / 100;
}

/** The change a found loop makes: the loop, and the End it ends on. */
export const loopChange = (l: FoundLoop): Partial<NewTake> => ({ loop: { start: l.start }, end: l.end });

/**
 * A loop for a take, looked for from its Start to the end of the recording, not to its End: a
 * found loop moves End, so looking again must not be held to the last loop's end.
 */
export const findTakeLoop = (take: Pick<Take, 'start'>, audio: ClipAudio, opts: LoopSearch = {}): FoundLoop | null =>
  findLoop(audio, { start: take.start, end: audio.channels[0].length }, opts);

export interface TrimOptions {
  /** Quieter than this (dBFS) counts as silence. */
  thresholdDb: number;
  /** Kept before the first sound, so the attack is whole. */
  preRollMs?: number;
  /** Kept after the last sound, so the tail isn't cut off sharply. */
  tailMs?: number;
}

/**
 * A take's Start and End with the silence before and after the sound trimmed. A loop is kept:
 * Start stays before the loop start, and a looped take's End stays (the loop ends there).
 * Null when nothing would change, or the take is all silence.
 */
export function trimSilence(take: Take, audio: ClipAudio, opts: TrimOptions): { start: number; end: number } | null {
  // The sound as Split… hears it (RMS in 10 ms frames against the threshold): from the first loud stretch to the last.
  const view = { sampleRate: audio.sampleRate, channels: audio.channels.map((ch) => ch.subarray(take.start, take.end)) };
  const sound = splitOnSilence(view, { thresholdDb: opts.thresholdDb, minPauseMs: 0, preRollMs: opts.preRollMs ?? 5, minNoteMs: 0 });
  if (!sound.length) return null;
  const sr = audio.sampleRate;
  let start = take.start + sound[0].start;
  let end = Math.min(take.end, take.start + sound[sound.length - 1].end + Math.round(((opts.tailMs ?? 20) / 1000) * sr));
  if (take.loop) { start = Math.min(start, take.loop.start - 1); end = take.end; }
  return start === take.start && end === take.end ? null : { start, end };
}

/** Every take with its zone, lowest zone first. */
const allTakes = (p: SampleProject) =>
  [...p.zones].sort((a, b) => a.rootKey - b.rootKey).flatMap((z) => z.takes.map((t) => ({ zoneId: z.id, take: t })));

export interface BatchReport {
  /** Takes changed. */
  changed: number;
  /** Takes whose audio isn't here. */
  missing: number;
  /** Takes the tool found nothing to do with (no loop found, all silence, already right). */
  unchanged: number;
  /** Find loops: the weakest match among the loops found (0–1). */
  weakestMatch?: number;
}

function eachTake(p: SampleProject, read: ReadAudio, change: (take: Take, audio: ClipAudio) => Partial<NewTake> | null) {
  let project = p;
  const report: BatchReport = { changed: 0, missing: 0, unchanged: 0 };
  for (const { zoneId, take } of allTakes(p)) {
    const audio = read(take.clipId);
    if (!audio) { report.missing++; continue; }
    const c = change(take, audio);
    if (!c) { report.unchanged++; continue; }
    project = updateTake(project, zoneId, take.id, c);
    report.changed++;
  }
  return { project, report };
}

/** Find a loop in every take; a take with no loop found keeps what it had. */
export function findLoopsAll(p: SampleProject, read: ReadAudio, opts: LoopSearch = {}) {
  let weakest: number | undefined;
  const r = eachTake(p, read, (take, audio) => {
    const l = findTakeLoop(take, audio, opts);
    if (!l) return null;
    weakest = Math.min(weakest ?? 1, l.match);
    return loopChange(l);
  });
  return { project: r.project, report: { ...r.report, ...(weakest !== undefined && { weakestMatch: weakest }) } };
}

/**
 * The level for each take of a piano zone: one gain for them all, taking the loudest layer to
 * `peakDb`, so softer layers stay as much softer as they were recorded. Null when the zone is silent.
 */
function pianoZoneGain(z: Zone, read: ReadAudio, peakDb: number): number | null {
  let loudest: number | null = null;
  for (const l of z.layers) {
    const t = takeOf(z, l);
    const a = t && read(t.clipId);
    const peak = t && a ? takePeakDb(t, a) : null;
    if (peak !== null && (loudest === null || peak > loudest)) loudest = peak;
  }
  return loudest === null ? null : Math.round((peakDb - loudest) * 100) / 100;
}

/**
 * Set levels so the loudest moment reaches `peakDb`: each take on its own for a sample; for a
 * piano, one level per zone, so its soft layers stay soft.
 */
export function normalizeAll(p: SampleProject, read: ReadAudio, peakDb: number) {
  if (p.target === 'npno') {
    const gains = new Map(p.zones.map((z) => [z.id, pianoZoneGain(z, read, peakDb)]));
    const zoneOf = new Map(p.zones.flatMap((z) => z.takes.map((t) => [t.id, z.id] as const)));
    return eachTake(p, read, (take) => {
      const g = gains.get(zoneOf.get(take.id)!) ?? null;
      return g === null || g === take.gainDb ? null : { gainDb: g };
    });
  }
  return eachTake(p, read, (take, audio) => {
    const g = normalizeGain(take, audio, peakDb);
    return g === null || g === take.gainDb ? null : { gainDb: g };
  });
}

/** Normalize one zone (for a piano: all its takes by its loudest layer). */
export function normalizeZone(p: SampleProject, read: ReadAudio, zoneId: string, peakDb: number) {
  const r = normalizeAll({ ...p, zones: p.zones.filter((z) => z.id === zoneId) }, read, peakDb);
  return { project: { ...p, zones: p.zones.map((z) => r.project.zones.find((x) => x.id === z.id) ?? z), updatedAt: r.project.updatedAt }, report: r.report };
}

/** Trim the silence at both ends of every take. */
export function trimSilenceAll(p: SampleProject, read: ReadAudio, opts: TrimOptions) {
  return eachTake(p, read, (take, audio) => trimSilence(take, audio, opts));
}
