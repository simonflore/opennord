/**
 * Turn a Nord Sample (`.nsmp`, `.nsmp3`, `.nsmp4`) into a Nord Piano (`.npno`), so a sampled
 * instrument can be played from the piano section. The sample is decoded, brought to the
 * piano rate and handed to {@link buildNpno}; nothing new is known about either format here.
 *
 * What has to change on the way:
 *  - **Pitch.** A piano zone's top key is at most one above the note the file stores for its
 *    recording, which a Nord plays 3 semitones below the recording's pitch at 44.1 kHz
 *    (`NSP_MAX_KEYS_ABOVE_ROOT`, the maintainers’ notes), while a sample zone usually reaches
 *    above its root. So each zone is re-pitched to sound right on its top key, and the keys
 *    far above a recording get copies of their own, a few keys each, so none has to play far
 *    below its recording either.
 *  - **Rate.** Samples carry their own rate (35,002 Hz by default); a piano plays at 44.1 kHz.
 *  - **Loops.** A piano loop is a whole number of frames. A short loop is repeated until the
 *    rounding is under a third of a cent, then cut where it meets itself.
 *  - **Touch.** Zones that share their keys become the piano's dynamic layers.
 *  - **Fade.** A piano note held in its loop fades at the layer's loop decay; one that
 *    doesn't fade rings for as long as the key or the pedal is held. A sample's loop often
 *    holds (its release does the work on the sample section), so such a loop gets a
 *    piano-like fade unless asked otherwise ({@link NsmpToNpnoOptions.loopFade}).
 *
 * ⚠ The piano writer is hardware-untested, so the result is too.
 * ⚠ SCOPE (`docs/LEGAL.md`): local conversion of a file the user has; nothing is uploaded.
 */
import { decodeNsmp, perNoteCustomCount, readGlobalLevelDetune, readNsmpZones, type DecodedStrokeResult } from './nsmp';
import { dsp2Detune } from './nw1-dsp';
import { DEFAULT_HALF_WIDTH, resampleForExport } from './nse-resample';
import { peakAmplitude } from './nsmp-audio';
import { NSP_SAMPLE_RATE, touchAttenuation } from './nsp-audio';
import { buildNpno, MAX_NPNO_NAME, MIN_RECORDED_NOTE, NPNO_PIANO_TYPE, NPNO_RECORDING_ABOVE_TOP_KEY, type NpnoBuildResult, type NpnoZoneInput } from './nsp-write';

/** Most keys a recording covers above its own pitch before the next keys get a copy: a key
 *  then plays at most 3 semitones below its zone's top key, about what factory pianos do. */
export const MAX_ZONE_KEYS = 4;
/** The note a zone's recordings are pitched to for a top key (`buildNpno`'s `rootNote`). */
const recordedNoteFor = (topKey: number) => topKey + NPNO_RECORDING_ABOVE_TOP_KEY;
/** Lowest top key a zone can have: its stored root, one below, can't be 0. */
const MIN_TOP_KEY = MIN_RECORDED_NOTE - NPNO_RECORDING_ABOVE_TOP_KEY;
/** A loop shorter than this (frames at the piano rate) is repeated: rounding half a frame in
 *  4,410 is under 0.2 cents. */
const MIN_LOOP_FRAMES = 4410;
/** A note without a loop that ends louder than this (re its peak) would stop with a jolt. */
const AUDIBLE_TAIL = 0.01; // −40 dB
/** Fade put on the end of such a note, in seconds (less on a very short one). */
const TAIL_FADE_SECONDS = 0.5;
/** Reach of the resampling filter either side of a frame, in input frames, with one to spare. */
const FILTER_REACH = DEFAULT_HALF_WIDTH + 1;
/** Said of every piano OpenNord builds, until one has been loaded on an instrument. */
/** The warning every piano OpenNord makes carries until one has loaded on a Nord. */
export const UNTESTED = 'A piano made by OpenNord has not been tried on a Nord yet. Back up your Nord before you load it.';
/** Softest floor a layer can store, in dB. */
const MAX_FLOOR_DB = 51;

/** The part of a sample zone the conversion needs. */
export interface SampleZone {
  keyHigh: number;
  rootKey: number;
  velTop: number;
  globalID: number;
  /** The layer's floor in dB below the hardest hit, when the caller sets it (Build sample's
   *  layers); otherwise `planPianoZones` derives floors from the top velocities. */
  floorDb?: number;
}

export interface PianoZonePlan {
  lowNote: number;
  highNote: number;
  /** Note the zone's recordings must sound at when played at 44.1 kHz: 3 semitones above its
   *  top key, where the instrument plays them back down to pitch. */
  rootNote: number;
  /** Loudest first; `sourceRoot` is the note the sample's recording sounds at. */
  layers: { globalID: number; floorDb: number; sourceRoot: number }[];
}

/**
 * Layer floors (dB below the hardest hit) from each layer's top velocity, loudest first. The
 * instrument switches halfway between neighbouring floors, so each floor is set to put that
 * switch at the velocity that divided the two layers, on the touch law `strokeFor` uses.
 */
export function layerFloors(velTops: readonly number[]): number[] {
  const floors = [0];
  for (let k = 1; k < velTops.length; k++) {
    const boundary = touchAttenuation(velTops[k] + 0.5) / 5; // 0.2 dB steps → dB
    const room = MAX_FLOOR_DB - 0.2 * (velTops.length - 1 - k); // leave a step for each softer layer
    const floor = Math.min(room, Math.max(floors[k - 1] + 0.2, 2 * boundary - floors[k - 1]));
    floors.push(Math.round(floor * 5) / 5);
  }
  return floors;
}

/**
 * Lay a sample's zones out as piano zones. Zones with the same top velocity form a touch
 * layer, tiled across the keys by their top key (as the sample keyboard shows them); a second
 * zone on the same keys and velocity, an alternate take, is left out, since a piano plays one
 * recording for a key and touch. The layers need not split at the same keys: a piano zone runs
 * between neighbouring split points of any layer and takes, from each layer, the recording
 * that covers it. Each piano zone is pitched for its own top key.
 */
export function planPianoZones(zones: readonly SampleZone[]): PianoZonePlan[] {
  const bands = new Map<number, SampleZone[]>(); // top velocity → its zones, lowest keys first
  for (const z of [...zones].sort((a, b) => a.keyHigh - b.keyHigh)) {
    const band = bands.get(z.velTop) ?? [];
    if (band.at(-1)?.keyHigh !== z.keyHigh) band.push(z);
    bands.set(z.velTop, band);
  }
  const loudestFirst = [...bands.keys()].sort((a, b) => b - a).map((v) => bands.get(v)!);
  const plan: PianoZonePlan[] = [];
  let low = 0;
  for (const top of [...new Set(zones.map((z) => z.keyHigh))].sort((a, b) => a - b)) {
    // From each layer, the zone whose keys reach this far (none above a layer's top zone).
    const covering = loudestFirst.map((band) => band.find((z) => z.keyHigh >= top)).filter((z) => z !== undefined);
    const sourceRoot = covering[0].rootKey; // the loudest layer's: where the keys are split
    const floors = covering.every((z) => z.floorDb !== undefined)
      ? covering.map((z) => z.floorDb!)
      : layerFloors(covering.map((z) => z.velTop));
    const layers = covering.map((z, k) => ({ globalID: z.globalID, floorDb: floors[k], sourceRoot: z.rootKey }));
    const high = Math.min(127, top);
    // From the top down: a group of keys for each stretch that lies well above the recording.
    const parts: PianoZonePlan[] = [];
    let t = high;
    while (t - sourceRoot >= MAX_ZONE_KEYS && t - MAX_ZONE_KEYS + 1 > low) {
      parts.push({ lowNote: t - MAX_ZONE_KEYS + 1, highNote: t, rootNote: recordedNoteFor(t), layers });
      t -= MAX_ZONE_KEYS;
    }
    if (t >= Math.max(low, MIN_TOP_KEY)) parts.push({ lowNote: low, highNote: t, rootNote: recordedNoteFor(t), layers });
    plan.push(...parts.reverse());
    low = high + 1;
  }
  return plan;
}

/**
 * Resample a recording to the piano rate so it sounds `semitones` above where it did, and
 * carry its loop over as whole frames. With a loop the result ends at the loop's end.
 * `semitones` may be fractional (a sample's stored detune).
 */
export function resampleForPiano(
  channels: ArrayLike<number>[],
  sampleRate: number,
  semitones: number,
  loop: { loopStart: number; loopEnd: number } | null,
): { pcm: Int32Array[]; loop?: { start: number; length: number } } {
  const srcRate = sampleRate * 2 ** (semitones / 12); // the rate at which the recording sounds that much higher
  const round = (out: Float64Array[], frames = out[0].length) => out.map((ch) => {
    const pcm = new Int32Array(frames);
    for (let n = 0; n < frames; n++) pcm[n] = Math.round(ch[n]);
    return pcm;
  });
  const length = loop ? loop.loopEnd - loop.loopStart : 0;
  if (!loop || length < 2 || loop.loopEnd > channels[0].length) {
    return { pcm: round(resampleForExport(channels, srcRate, NSP_SAMPLE_RATE)) };
  }
  // Repeat the loop until its length rounds to whole frames without detuning it, then nudge
  // the ratio so that length is exact: the seam then meets itself.
  const ratio = NSP_SAMPLE_RATE / srcRate; // output frames per input frame
  const repeats = Math.max(1, Math.ceil(MIN_LOOP_FRAMES / (length * ratio)));
  const frames = Math.round(repeats * length * ratio);
  const exact = frames / (repeats * length);
  // The piano's loop starts a filter's reach into the sample's: every frame of it is then
  // made from looping audio alone, the same audio playback wraps into, so the seam is exact.
  // (Frames right at the sample's loop start are still coloured by the audio before it.)
  const start = Math.ceil((loop.loopStart + FILTER_REACH) * exact);
  const unrolled = channels.map((ch) => {
    // Up to the loop's shifted end, plus the filter's reach beyond it (and one reach to spare).
    const out = new Float64Array(loop.loopStart + repeats * length + 3 * FILTER_REACH);
    for (let n = 0; n < out.length; n++) out[n] = ch[n < loop.loopStart ? n : loop.loopStart + ((n - loop.loopStart) % length)];
    return out;
  });
  const out = resampleForExport(unrolled, NSP_SAMPLE_RATE / exact, NSP_SAMPLE_RATE);
  return { pcm: round(out, start + frames), loop: { start, length: frames } };
}

/**
 * A piano note without a loop stops when its recording does. If it is still sounding there,
 * fade its end in place so it doesn't stop with a jolt. Returns whether it had to.
 */
export function fadeAbruptEnd(pcm: Int32Array[]): boolean {
  const frames = pcm[0].length;
  const fade = Math.min(frames >> 2, Math.round(TAIL_FADE_SECONDS * NSP_SAMPLE_RATE)); // a quarter of a short note at most
  const tail = peakAmplitude(pcm.map((ch) => ch.subarray(Math.max(0, frames - 441)))); // the last 10 ms
  if (tail <= peakAmplitude(pcm) * AUDIBLE_TAIL) return false;
  for (const ch of pcm) {
    for (let n = frames - fade; n < frames; n++) ch[n] = Math.round(ch[n] * ((frames - 1 - n) / fade) ** 2);
  }
  return true;
}

/** A piano name a Nord accepts, from a sample's file or display name: plain ASCII, no `#`,
 *  short enough that the stored file name stays within 32 characters. */
export function pianoNameFrom(source: string): string {
  const base = source.replace(/^.*[\\/]/, '').replace(/\.nsmp[34]?$/i, '');
  const plain = base.normalize('NFKD').replace(/[^\x20-\x7e]|#/g, '').replace(/\s+/g, ' ').trim();
  return plain.slice(0, MAX_NPNO_NAME).trim() || 'Piano';
}

export interface NsmpToNpnoOptions {
  /** Piano name (see {@link pianoNameFrom}). */
  name: string;
  /** Which piano type the file says it is ({@link NPNO_PIANO_TYPE}). Default: electric piano. */
  pianoType?: number;
  /** A model or variant shown after the name (e.g. "Mk I"); see `NpnoInput.variant`. */
  variant?: string;
  /**
   * How a held note fades once it is in its loop: `'auto'` (default) takes the sample's own
   * loop decay where it sets one and a piano-like fade where it doesn't; `'piano'` gives every
   * loop the piano-like fade (faster up the keys, as factory pianos do); a number is a fade
   * in dB a second for every loop, 0 holding the note for as long as it is held.
   */
  loopFade?: LoopFade;
}

/** See {@link NsmpToNpnoOptions.loopFade}. */
export type LoopFade = 'auto' | 'piano' | number;

/**
 * A loop's fade for {@link buildNpno} (dB a second; undefined is its piano-like default), and
 * whether that fade is the sample's own, the piano's in place of a sample loop that holds, or
 * a hold.
 */
function loopFadeFor(fade: LoopFade, sampleDbPerSecond: number): { db?: number; kind: 'set' | 'piano-for-hold' | 'hold' } {
  if (fade === 'piano') return { kind: 'set' };
  if (fade === 'auto') return sampleDbPerSecond > 0 ? { db: sampleDbPerSecond, kind: 'set' } : { kind: 'piano-for-hold' };
  return fade > 0 ? { db: fade, kind: 'set' } : { db: 0, kind: 'hold' };
}

export interface NsmpToNpnoResult extends NpnoBuildResult {
  /** What didn't carry over, in a player's words. */
  warnings: string[];
}

/** A sample as the conversion needs it: what {@link nsmpToNpno} reads from a file. */
export interface SampleSource {
  zones: readonly SampleZone[];
  /** The recordings the zones play, by `globalID`. */
  strokes: readonly Pick<DecodedStrokeResult, 'globalID' | 'channels' | 'channelCount' | 'sampleRate' | 'loop'>[];
  /** The sample's global detune, in cents: the sample section plays every recording this sharp. */
  detuneCents?: number;
  /** Keys whose level or tuning the sample adjusts individually (not carried over). */
  adjustedKeys?: number;
}

/** Convert a Nord Sample file to a Nord Piano. Throws a plain-words error when it can't. */
export function nsmpToNpno(bytes: Uint8Array, opts: NsmpToNpnoOptions): NsmpToNpnoResult {
  let strokes: DecodedStrokeResult[] = [];
  try { strokes = decodeNsmp(bytes); } catch { /* not a sample we can read: reported by sampleToPiano */ }
  return sampleToPiano({
    zones: readNsmpZones(bytes),
    strokes,
    detuneCents: dsp2Detune(readGlobalLevelDetune(bytes)?.detune ?? 0),
    adjustedKeys: perNoteCustomCount(bytes),
  }, opts);
}

/** Build a piano from a decoded sample. Throws a plain-words error when it can't. */
export function sampleToPiano(source: SampleSource, opts: NsmpToNpnoOptions): NsmpToNpnoResult {
  const byId = new Map(source.strokes.filter((s) => s.channels[0]?.length).map((s) => [s.globalID, s]));
  const zones = source.zones.filter((z) => byId.has(z.globalID));
  if (!zones.length) throw new Error("OpenNord couldn't read a playable sample from this file.");
  const detune = (source.detuneCents ?? 0) / 100; // semitones

  const plan = planPianoZones(zones);
  const used = new Set(plan.flatMap((z) => z.layers.map((l) => l.globalID)));
  const channels = [...used].some((id) => byId.get(id)!.channelCount === 2) ? 2 : 1;

  let peak = 0;
  const faded = new Set<number>(); // recordings that end while still sounding
  let fadedSeconds = 0;
  const loopFades = new Map<number, ReturnType<typeof loopFadeFor>['kind']>(); // looped recordings
  const input: NpnoZoneInput[] = plan.map((z) => ({
    rootNote: z.rootNote, lowNote: z.lowNote, highNote: z.highNote,
    layers: z.layers.map((l) => {
      const s = byId.get(l.globalID)!;
      const loop = s.loop?.loops ? s.loop : null;
      const r = resampleForPiano(s.channels, s.sampleRate, z.rootNote - l.sourceRoot + detune, loop);
      if (!r.loop && fadeAbruptEnd(r.pcm)) {
        faded.add(l.globalID);
        fadedSeconds = Math.max(fadedSeconds, r.pcm[0].length / NSP_SAMPLE_RATE);
      }
      let decayDbPerSecond: number | undefined;
      if (r.loop) {
        const f = loopFadeFor(opts.loopFade ?? 'auto', loop!.decayDbPerSecond);
        decayDbPerSecond = f.db;
        loopFades.set(l.globalID, f.kind);
      }
      peak = Math.max(peak, peakAmplitude(r.pcm));
      const pcm = channels === 2 && r.pcm.length === 1 ? [r.pcm[0], r.pcm[0]] : r.pcm;
      return { pcm, floorDb: l.floorDb, loop: r.loop, decayDbPerSecond };
    }),
  }));
  // `buildNpno` keeps each recording's level in its level word, which has no room above 16
  // bits: one gain for the whole piano brings a hotter source within it, relative levels kept.
  if (peak > 32767) {
    const gain = 32767 / peak;
    const scaled = new Set<ArrayLike<number>>(); // a mono recording sits in both channels of a stereo piano
    for (const z of input) for (const l of z.layers) for (const ch of l.pcm as Int32Array[]) {
      if (scaled.has(ch)) continue;
      scaled.add(ch);
      for (let n = 0; n < ch.length; n++) ch[n] = Math.round(ch[n] * gain);
    }
  }
  const warnings: string[] = [];
  const count = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
  const unread = source.zones.length - zones.length;
  if (unread) {
    warnings.push(`${count(unread, "key zone's recording", "key zones' recordings")} couldn't be read and `
      + `${unread === 1 ? 'was' : 'were'} left out; the keys play the next zone up.`);
  }
  // Alternate takes: recordings of a key and touch another zone already has.
  const taken = new Set<string>();
  const spare = new Set<number>();
  for (const z of zones) {
    const place = `${z.velTop}:${z.keyHigh}`;
    if (taken.has(place) && !used.has(z.globalID)) spare.add(z.globalID);
    taken.add(place);
  }
  const alternates = spare.size;
  if (alternates) {
    warnings.push(`${count(alternates, 'alternate recording was', 'alternate recordings were')} left out: `
      + 'a piano plays one recording for each key and touch.');
  }
  const adjusted = source.adjustedKeys ?? 0;
  if (adjusted) {
    warnings.push(`This sample adjusts the level or tuning of ${count(adjusted, 'key', 'keys')} individually. `
      + "OpenNord can't carry that over yet, so those keys may sound a little different.");
  }
  if (faded.size) {
    const which = faded.size === used.size ? 'This sample has' : `${faded.size} of this sample's recordings have`;
    warnings.push(`${which} no sustain loop, so a held note fades out when its recording ends `
      + `(they last up to ${Math.round(fadedSeconds)} seconds, longer on keys below the recorded note).`);
  }
  const pianoForHold = [...loopFades.values()].filter((k) => k === 'piano-for-hold').length;
  if (pianoForHold) {
    const which = pianoForHold === loopFades.size ? "This sample's loops don't" : `${pianoForHold} of this sample's ${loopFades.size} loops don't`;
    warnings.push(`${which} fade, so held notes on them now fade like a piano's. `
      + 'Pick another fade if you want them to hold.');
  }
  if ([...loopFades.values()].includes('hold')) {
    warnings.push('Held notes never fade: with the sustain pedal down, a note rings until you let go.');
  }
  warnings.push(UNTESTED);
  const result = buildNpno({ name: opts.name, variant: opts.variant, pianoType: opts.pianoType ?? NPNO_PIANO_TYPE.electric, channels, zones: input });
  return { ...result, warnings };
}
