/**
 * Turn a Nord Sample (`.nsmp`, `.nsmp3`, `.nsmp4`) into a Nord Piano (`.npno`), so a sampled
 * instrument can be played from the piano section. The sample is decoded, brought to the
 * piano rate and handed to {@link buildNpno}; nothing new is known about either format here.
 *
 * What has to change on the way:
 *  - **Pitch.** The piano DSP plays a recording at or below its own pitch, never above
 *, while a sample zone usually reaches above its root. So
 *    each zone is re-pitched to its top key, and the keys far above a recording get copies of
 *    their own, a few keys each, so none has to play far below its recording either.
 *  - **Rate.** Samples carry their own rate (35,002 Hz by default); a piano plays at 44.1 kHz.
 *  - **Loops.** A piano loop is a whole number of frames. A short loop is repeated until the
 *    rounding is under a third of a cent, then cut where it meets itself.
 *  - **Touch.** Zones that share their keys become the piano's dynamic layers.
 *
 * ⚠ The piano writer is hardware-untested, so the result is too.
 * ⚠ SCOPE (`docs/LEGAL.md`): local conversion of a file the user has; nothing is uploaded.
 */
import { decodeNsmp, readNsmpZones, type DecodedStrokeResult } from './nsmp';
import { resampleForExport } from './nse-resample';
import { NSP_SAMPLE_RATE } from './nsp-audio';
import { buildNpno, NPNO_PIANO_TYPE, type NpnoBuildResult, type NpnoZoneInput } from './nsp-write';
import type { NpnoModel } from './nsp-check';

/** Most keys a recording covers above its own pitch before the next keys get a copy: a key
 *  then plays at most 3 semitones down, about what factory pianos do. */
const MAX_ZONE_KEYS = 4;
/** Lowest note a piano zone can be recorded at (`buildNpno`: a stored root of 0 is "no key"). */
const MIN_ROOT = 5;
/** A loop shorter than this (frames at the piano rate) is repeated: rounding half a frame in
 *  4,410 is under 0.2 cents. */
const MIN_LOOP_FRAMES = 4410;
/** A note without a loop that ends louder than this (re its peak) would stop with a jolt. */
const AUDIBLE_TAIL = 0.01; // −40 dB
/** Fade put on the end of such a note, in seconds (less on a very short one). */
const TAIL_FADE_SECONDS = 0.5;
/** Softest floor a layer can store, in dB. */
const MAX_FLOOR_DB = 51;

/** The part of a sample zone the conversion needs. */
export interface SampleZone {
  keyHigh: number;
  rootKey: number;
  velLow: number;
  velTop: number;
  globalID: number;
}

export interface PianoZonePlan {
  lowNote: number;
  highNote: number;
  /** Note the zone's recordings must sound at: its top key. */
  rootNote: number;
  /** Note the sample's recordings sound at. */
  sourceRoot: number;
  /** Loudest first. */
  layers: { globalID: number; floorDb: number }[];
}

/**
 * Layer floors (dB below the hardest hit) from each layer's top velocity, loudest first. The
 * instrument switches halfway between neighbouring floors, so each floor is set to put that
 * switch at the velocity that divided the two layers, on the touch law `strokeFor` uses
 * (40·log10(v/127) dB).
 */
export function layerFloors(velTops: readonly number[]): number[] {
  const floors = [0];
  for (let k = 1; k < velTops.length; k++) {
    const boundary = Math.min(40, -40 * Math.log10(Math.max(1, velTops[k] + 0.5) / 127));
    const room = MAX_FLOOR_DB - 0.2 * (velTops.length - 1 - k); // leave a step for each softer layer
    const floor = Math.min(room, Math.max(floors[k - 1] + 0.2, 2 * boundary - floors[k - 1]));
    floors.push(Math.round(floor * 5) / 5);
  }
  return floors;
}

/**
 * Lay a sample's zones out as piano zones. Zones are tiled by their top key (as the sample
 * keyboard shows them); zones sharing a top key are touch layers. Each piano zone is pitched
 * to its own top key.
 */
export function planPianoZones(zones: readonly SampleZone[]): PianoZonePlan[] {
  const byTop = new Map<number, SampleZone[]>();
  for (const z of zones) byTop.set(z.keyHigh, [...(byTop.get(z.keyHigh) ?? []), z]);
  const plan: PianoZonePlan[] = [];
  let low = 0;
  for (const top of [...byTop.keys()].sort((a, b) => a - b)) {
    const group = byTop.get(top)!.sort((a, b) => b.velTop - a.velTop);
    const sourceRoot = group[0].rootKey;
    const floors = layerFloors(group.map((z) => z.velTop));
    const layers = group.map((z, k) => ({ globalID: z.globalID, floorDb: floors[k] }));
    const high = Math.min(127, top);
    // From the top down: a group of keys for each stretch that lies well above the recording.
    const parts: PianoZonePlan[] = [];
    let t = high;
    while (t - sourceRoot >= MAX_ZONE_KEYS && t - MAX_ZONE_KEYS + 1 > low) {
      parts.push({ lowNote: t - MAX_ZONE_KEYS + 1, highNote: t, rootNote: t, sourceRoot, layers });
      t -= MAX_ZONE_KEYS;
    }
    if (t >= Math.max(low, MIN_ROOT)) parts.push({ lowNote: low, highNote: t, rootNote: t, sourceRoot, layers });
    plan.push(...parts.reverse());
    low = high + 1;
  }
  return plan;
}

/**
 * Resample a recording to the piano rate so it sounds `semitones` above where it did, and
 * carry its loop over as whole frames. With a loop the result ends at the loop's end.
 */
export function resampleForPiano(
  channels: ArrayLike<number>[],
  sampleRate: number,
  semitones: number,
  loop: { loopStart: number; loopEnd: number } | null,
): { pcm: Int32Array[]; loop?: { start: number; length: number } } {
  const ratio = NSP_SAMPLE_RATE / (sampleRate * 2 ** (semitones / 12)); // output frames per input frame
  const round = (out: Float64Array[], frames: number) => out.map((ch) => Int32Array.from(ch.subarray(0, frames), Math.round));
  const length = loop ? loop.loopEnd - loop.loopStart : 0;
  if (!loop || length < 2 || loop.loopEnd > channels[0].length) {
    const out = resampleForExport(channels, NSP_SAMPLE_RATE / ratio, NSP_SAMPLE_RATE);
    return { pcm: round(out, out[0].length) };
  }
  // Repeat the loop until its length rounds to whole frames without detuning it, then nudge
  // the ratio so that length is exact: the seam then meets itself.
  const repeats = Math.max(1, Math.ceil(MIN_LOOP_FRAMES / (length * ratio)));
  const frames = Math.round(repeats * length * ratio);
  const exact = frames / (repeats * length);
  // One more pass of the loop after the end gives the filter the signal it would meet there.
  const unrolled = channels.map((ch) => {
    const out = new Float64Array(loop.loopEnd + repeats * length);
    for (let n = 0; n < loop.loopEnd; n++) out[n] = ch[n];
    for (let n = loop.loopEnd; n < out.length; n++) out[n] = ch[loop.loopStart + ((n - loop.loopStart) % length)];
    return out;
  });
  const out = resampleForExport(unrolled, NSP_SAMPLE_RATE / exact, NSP_SAMPLE_RATE);
  const start = Math.round(loop.loopStart * exact);
  return { pcm: round(out, start + frames), loop: { start, length: frames } };
}

/**
 * A piano note without a loop stops when its recording does. If it is still sounding there,
 * fade its end in place so it doesn't stop with a jolt. Returns whether it had to.
 */
export function fadeAbruptEnd(pcm: Int32Array[]): boolean {
  const frames = pcm[0].length;
  const fade = Math.min(frames >> 2, Math.round(TAIL_FADE_SECONDS * NSP_SAMPLE_RATE)); // a quarter of a short note at most
  let peak = 0;
  let tail = 0;
  for (const ch of pcm) {
    for (let n = 0; n < frames; n++) peak = Math.max(peak, Math.abs(ch[n]));
    for (let n = frames - Math.min(frames, 441); n < frames; n++) tail = Math.max(tail, Math.abs(ch[n]));
  }
  if (tail <= peak * AUDIBLE_TAIL) return false;
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
  return plain.slice(0, 23).trim() || 'Piano';
}

export interface NsmpToNpnoOptions {
  /** Piano name (see {@link pianoNameFrom}). */
  name: string;
  /** Which piano type it is filed under on the instrument. Default Electric. */
  pianoType?: number;
  /** The Nord it is for (`buildNpno` refuses a model that can't load a version 6 piano). */
  model?: NpnoModel;
}

export interface NsmpToNpnoResult extends NpnoBuildResult {
  /** What didn't carry over, in a player's words. */
  warnings: string[];
}

/** Convert a Nord Sample to a Nord Piano. Throws a plain-words error when it can't. */
export function nsmpToNpno(bytes: Uint8Array, opts: NsmpToNpnoOptions): NsmpToNpnoResult {
  let strokes: DecodedStrokeResult[] = [];
  try { strokes = decodeNsmp(bytes); } catch { /* not a sample we can read: reported below */ }
  const byId = new Map(strokes.filter((s) => s.channels[0]?.length).map((s) => [s.globalID, s]));
  const zones = readNsmpZones(bytes).filter((z) => byId.has(z.globalID));
  if (!zones.length) throw new Error("OpenNord couldn't read a playable sample from this file.");

  const warnings: string[] = [];
  const plan = planPianoZones(zones);
  const channels = plan.some((z) => z.layers.some((l) => byId.get(l.globalID)!.channelCount === 2)) ? 2 : 1;

  let peak = 0;
  const faded = new Set<number>(); // recordings that end while still sounding
  let fadedSeconds = 0;
  const built = plan.map((z) => ({
    ...z,
    layers: z.layers.map((l) => {
      const s = byId.get(l.globalID)!;
      const loop = s.loop?.loops ? s.loop : null;
      const r = resampleForPiano(s.channels, s.sampleRate, z.rootNote - z.sourceRoot, loop);
      if (!r.loop && fadeAbruptEnd(r.pcm)) {
        faded.add(l.globalID);
        fadedSeconds = Math.max(fadedSeconds, r.pcm[0].length / NSP_SAMPLE_RATE);
      }
      for (const ch of r.pcm) for (let n = 0; n < ch.length; n++) peak = Math.max(peak, Math.abs(ch[n]));
      const pcm = channels === 2 && r.pcm.length === 1 ? [r.pcm[0], r.pcm[0]] : r.pcm;
      return { pcm, floorDb: l.floorDb, loop: r.loop, decayDbPerSecond: r.loop ? loop!.decayDbPerSecond : undefined };
    }),
  }));
  if (faded.size) {
    warnings.push(`${faded.size === new Set(plan.flatMap((z) => z.layers.map((l) => l.globalID))).size ? 'This sample has' : `${faded.size} of this sample's recordings have`} no sustain loop, `
      + `so a held note fades out when its recording ends (after ${Math.round(fadedSeconds)} seconds at most).`);
  }
  // One gain for the whole piano keeps the recordings' relative levels within 16 bits.
  const gain = peak > 32767 ? 32767 / peak : 1;
  const input: NpnoZoneInput[] = built.map((z) => ({
    rootNote: z.rootNote, lowNote: z.lowNote, highNote: z.highNote,
    layers: z.layers.map((l) => ({
      ...l,
      pcm: gain === 1 ? l.pcm : l.pcm.map((ch) => ch.map((v) => Math.round(v * gain))),
    })),
  }));
  const result = buildNpno({
    name: opts.name, pianoType: opts.pianoType ?? NPNO_PIANO_TYPE.electric, model: opts.model, channels, zones: input,
  });
  return { ...result, warnings };
}
