/**
 * An SFZ instrument as a Build-sample project (spec: the maintainers’ notes,
 * whose project model this fills): the player then sees it on the keys, hears it, fixes what
 * needs fixing and saves it for a Nord, as with recordings they brought themselves.
 *
 * - Each key belongs to the loudest region that covers it, and a run of keys with the same
 *   loudest region is a zone, rooted where that region says. Instruments that split their
 *   velocities differently on different keys keep every key, each with its own loudest.
 * - Softer regions that cover a zone's root become its softer layers (a piano holds them; a
 *   sample plays the loudest), with floors from the converter's own touch law (`layerFloors`).
 * - Round-robin and random alternates stay as extra takes of the zone, to pick from.
 * - A loop ends the take, as on the Nord: audio after a loop's end is dropped.
 * Everything left out is counted in the report, in the player's words. Pure.
 */
import { layerFloors } from '../ns4/nsmp-to-npno';
import { formatBytes } from '../format';
import { plural } from '../plural';
import { emptyProject, projectProblems, type Clip, type SampleProject, type Take, type Zone } from './model';
import type { SfzRegion } from './sfz';

/**
 * A recording the SFZ names, read and already stored (under `audioRef`): its shape, and the
 * root and loop its WAV names, if any. The layout needs no audio, so an import never holds a
 * whole library in memory.
 */
export interface SfzSample {
  fileName: string;
  audioRef: string;
  sampleRate: number;
  channels: 1 | 2;
  frames: number;
  unityNote?: number;
  /** Frames, end inclusive. */
  loop?: { start: number; end: number };
}

export interface SfzImportReport {
  zones: number;
  /** Zones with softer velocity layers (kept for a piano; a sample plays the loudest). */
  layered: number;
  /** Alternates kept as extra takes. */
  alternates: number;
  /** Recordings the SFZ names that weren't found or couldn't be read. */
  missing: string[];
  skipped: KeptRegions['skipped'] & {
    /** Regions no zone uses: other recordings already cover their keys and touch, or no audio is left. */
    unplaced: number;
  };
  /** Loops that didn't fit inside their recording, so the take plays once. */
  loopsDropped: number;
  /** Takes whose audio after the loop end was dropped (the Nord's loop runs to the end). */
  tailsCut: number;
  /** Regions that play one pitch on every key in the SFZ; on the Nord they follow the keys. */
  fixedPitch: number;
  /** What the SFZ sets that a Nord sample has no place for (the program's job, or nothing's). */
  dropped: string[];
  /** The kept audio as 16-bit PCM, in bytes: before the Nord's own compression. */
  audioBytes: number;
}

export interface KeptRegions {
  kept: SfzRegion[];
  skipped: {
    /** Release samples (`trigger=release`): the Nord plays nothing on key up. */
    release: number;
    /** Regions for other key switches than the default one. */
    keyswitch: number;
    /** Regions with no key on the keyboard (pedal and other noises keyed below 0). */
    offKeyboard: number;
  };
}

const ATTACK = new Set(['attack', 'first', 'legato']);

/**
 * The regions an import can use: played on a key going down, for the default key switch (the
 * SFZ's own, else the lowest the regions use), with a key on the keyboard. Decided before any
 * audio is read, so recordings only other regions use are never decoded.
 */
export function keptRegions(regions: readonly SfzRegion[]): KeptRegions {
  const skipped = { release: 0, keyswitch: 0, offKeyboard: 0 };
  let chosen = regions.find((r) => r.keyswitchDefault !== undefined)?.keyswitchDefault;
  if (chosen === undefined) for (const r of regions) if (r.keyswitch !== undefined && (chosen === undefined || r.keyswitch < chosen)) chosen = r.keyswitch;
  const kept: SfzRegion[] = [];
  for (const r of regions) {
    if (!ATTACK.has(r.trigger)) skipped.release++;
    else if (r.keyswitch !== undefined && r.keyswitch !== chosen) skipped.keyswitch++;
    else if (r.hikey < 0 || r.lokey > 127 || r.lokey > r.hikey) skipped.offKeyboard++;
    else kept.push(r);
  }
  return { kept, skipped };
}

interface Placed { region: SfzRegion; sample: SfzSample; take: Omit<Take, 'id' | 'clipId' | 'tuneCents'>; keycenter: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const covers = (p: Placed, key: number) => p.region.lokey <= key && key <= p.region.hikey;
/** Loudest first: the higher top velocity, then the narrower top band, then round-robin order. */
const louder = (a: Placed, b: Placed) => b.region.hivel - a.region.hivel || b.region.lovel - a.region.lovel
  || a.region.seqPosition - b.region.seqPosition || Number(a.region.random) - Number(b.region.random);
/** Another recording of the same keys and touch: an alternate (round robin), not a layer. */
const sameSlot = (a: Placed, b: Placed) => a.region.lokey === b.region.lokey && a.region.hikey === b.region.hikey
  && a.region.lovel === b.region.lovel && a.region.hivel === b.region.hivel;

/**
 * Lay `regions` out as a project named `name`. `samples` holds each region's recording by the
 * path the SFZ names it (`SfzRegion.sample`); a path with none is missing.
 */
export function sfzToProject(
  name: string, regions: readonly SfzRegion[], samples: ReadonlyMap<string, SfzSample | undefined>,
  newId: () => string = () => crypto.randomUUID(),
): { project: SampleProject; report: SfzImportReport } {
  const { kept, skipped } = keptRegions(regions);
  const dropped = new Set<string>();
  const missing = new Set<string>();
  let loopsDropped = 0, tailsCut = 0, fixedPitch = 0, noAudio = 0;
  const placed: Placed[] = [];
  for (const r of kept) {
    const s = samples.get(r.sample);
    if (!s) { missing.add(r.sample); continue; }
    for (const d of r.dropped) dropped.add(d);
    const start = Math.min(r.offset, s.frames);
    let end = r.end !== undefined && r.end >= 0 ? Math.min(s.frames, Math.round(r.end) + 1) : s.frames;
    const points = r.loop === 'sfz' ? { start: r.loopStart!, end: r.loopEnd! } : r.loop === 'file' ? s.loop : undefined;
    let loop: Take['loop'] = null;
    if (points) {
      const loopStart = Math.round(points.start);
      const loopEnd = Math.min(end, Math.round(points.end) + 1);
      if (loopStart > start && loopStart < loopEnd) {
        if (loopEnd < end) tailsCut++;
        end = loopEnd;
        loop = { start: loopStart };
      } else loopsDropped++;
    }
    if (!(start < end)) { noAudio++; continue; }
    if (!r.keytrack && r.lokey !== r.hikey) fixedPitch++;
    const keycenter = r.keycenter === 'sample' ? s.unityNote ?? 60 : r.keycenter;
    placed.push({ region: r, sample: s, keycenter, take: { start, end, loop, loopDecaySeconds: null, gainDb: r.gainDb } });
  }

  // Clips: one per recording, whichever regions use it.
  const clips = new Map<SfzSample, Clip>();
  const clipFor = ({ sample: s }: Placed): Clip => {
    let clip = clips.get(s);
    if (!clip) {
      clip = { id: newId(), label: s.fileName, source: { kind: 'file', fileName: s.fileName }, audioRef: s.audioRef, sampleRate: s.sampleRate, channels: s.channels, frames: s.frames };
      clips.set(s, clip);
    }
    return clip;
  };
  // A take plays at its zone's root: one recorded at another key is tuned to match.
  const takeFor = (p: Placed, root: number): Take =>
    ({ ...p.take, id: newId(), clipId: clipFor(p).id, tuneCents: p.region.tuneCents + 100 * (p.region.keytrack ? root - p.keycenter : 0) });

  // Each key's loudest region; a run of keys with the same one is a zone.
  const ranked = [...placed].sort(louder);
  const runs: { main: Placed; low: number; high: number }[] = [];
  for (let key = 0; key <= 127; key++) {
    const main = ranked.find((p) => covers(p, key));
    const run = runs.at(-1);
    if (!main) continue;
    if (run && run.main === main && run.high === key - 1) run.high = key;
    else runs.push({ main, low: key, high: key });
  }

  const used = new Set<Placed>();
  let alternates = 0;
  const zones: Zone[] = runs.map(({ main, low, high }) => {
    const rootKey = clamp(main.keycenter, low, high);
    // Everything covering the root, loudest first: a softer top velocity is the next layer;
    // another recording of a layer's keys and touch is an alternate take.
    const layers: { p: Placed; take: Take }[] = [];
    const takes: Take[] = [];
    for (const p of ranked.filter((x) => covers(x, rootKey))) {
      const softer = !layers.length || p.region.hivel < layers.at(-1)!.p.region.hivel;
      if (!softer && !layers.some((l) => sameSlot(l.p, p))) continue;
      const take = takeFor(p, rootKey);
      takes.push(take);
      used.add(p);
      if (softer) layers.push({ p, take });
      else alternates++;
    }
    const floors = layerFloors(layers.map((l) => l.p.region.hivel));
    return { id: newId(), rootKey, keyLow: low, keyHigh: high, takes, layers: layers.map((l, k) => ({ takeId: l.take.id, floorDb: floors[k] })) };
  });

  const project: SampleProject = { ...emptyProject(name), clips: [...clips.values()], zones };
  const problems = projectProblems(project);
  if (problems.length) throw new Error(`OpenNord couldn’t lay this instrument out: ${problems[0]}`);
  const report: SfzImportReport = {
    zones: zones.length,
    layered: zones.filter((z) => z.layers.length > 1).length,
    alternates,
    missing: [...missing],
    skipped: { ...skipped, unplaced: noAudio + placed.filter((p) => !used.has(p)).length },
    loopsDropped, tailsCut, fixedPitch,
    dropped: [...dropped],
    audioBytes: project.clips.reduce((sum, c) => sum + c.frames * c.channels * 2, 0),
  };
  return { project, report };
}


/** What an import did and left out, as notes for the player, most important first. */
export function describeSfzImport(r: SfzImportReport, missingIncludes: readonly string[] = []): string[] {
  const out: string[] = [`Imported ${plural(r.zones, 'zone')}, ${formatBytes(r.audioBytes)} of audio before the Nord's own compression.`];
  if (r.missing.length) out.push(`Not found or couldn't be read: ${r.missing.slice(0, 3).map((m) => `“${m}”`).join(', ')}${r.missing.length > 3 ? ` and ${r.missing.length - 3} more` : ''}.`);
  if (missingIncludes.length) out.push(`The instrument includes ${missingIncludes.map((m) => `“${m}”`).join(', ')}, which wasn't in the folder; what it adds is missing.`);
  if (r.layered) out.push(`${plural(r.layered, 'zone has', 'zones have')} velocity layers: a piano keeps them, a sample plays the loudest. Choose Piano above to keep them.`);
  if (r.alternates) out.push(`${plural(r.alternates, 'alternate recording')} (round robin) kept as extra takes, to pick from in each zone.`);
  if (r.tailsCut) out.push(`${plural(r.tailsCut, 'take ends', 'takes end')} at its loop, as on the Nord: the audio after the loop was left out.`);
  if (r.loopsDropped) out.push(`${plural(r.loopsDropped, 'loop')} didn't fit inside the recording, so ${r.loopsDropped === 1 ? 'that take plays' : 'those takes play'} once.`);
  const skipped = [
    r.skipped.release && plural(r.skipped.release, 'release sample'),
    r.skipped.keyswitch && `${plural(r.skipped.keyswitch, 'region')} for other key switches (only the default one was imported)`,
    r.skipped.offKeyboard && `${plural(r.skipped.offKeyboard, 'region')} off the keyboard (pedal and other noises)`,
    r.skipped.unplaced && `${plural(r.skipped.unplaced, 'region')} whose keys and touch other recordings already cover`,
  ].filter(Boolean);
  if (skipped.length) out.push(`Left out: ${skipped.join('; ')}.`);
  if (r.fixedPitch) out.push(`${plural(r.fixedPitch, 'recording plays', 'recordings play')} one pitch on every key in the instrument; on the Nord ${r.fixedPitch === 1 ? 'it follows' : 'they follow'} the keys.`);
  if (r.dropped.length) out.push(`Not carried over: ${r.dropped.join(', ')}. On a Nord these are set in the program.`);
  return out;
}
