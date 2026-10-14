/**
 * Write a project as the target's file (spec §9). Samples go through `writeNsmpMulti` (the
 * hardware-verified writer, the maintainers’ notes 2026-10-14); pianos through `sampleToPiano`
 * (Task 5). The result is read back and compared before it is returned.
 */
import { writeNsmpMulti, type WriteZone } from '../ns4/nsmp-write';
import { decodeNsmp, loopDecayDbPerSecond, loopDecayRaw, NSMP_SAMPLE_RATE, readNsmpZones } from '../ns4/nsmp';
import { resampleToRate } from '../ns4/nw1-resample';
import { sampleToPiano, UNTESTED, type SampleSource } from '../ns4/nsmp-to-npno';
import { checkNpnoAcceptance } from '../ns4/nsp-check';
import { fileNameStem, NPNO_PIANO_TYPE } from '../ns4/nsp-write';
import { noteName } from '../ns4/sample-view';
import { takeOf, type SampleProject, type Take, type Zone } from './model';
import { renderTake, type ReadAudio, type RenderedTake } from './render';
import { TARGETS, pianoSourceZones, pitchBaseFor } from './targets';

export interface BuildResult {
  bytes: Uint8Array;
  extension: '.nsmp4' | '.nsmp3' | '.npno';
  fileName: string;
  /** What the player should know about the file, in plain words. */
  warnings: string[];
}

/** Check the project and render every take a zone uses; throws the first error in plain words. */
export function prepare(p: SampleProject, read: ReadAudio): { warnings: string[]; take: (z: Zone, t: Take) => RenderedTake } {
  const issues = TARGETS[p.target].check(p);
  const error = issues.find((i) => i.level === 'error');
  if (error) throw new Error(error.message);
  // A clip split into many notes is read once, not once per take.
  const cache = new Map<string, ReturnType<ReadAudio>>();
  const audioOf = (clipId: string) => (cache.has(clipId) ? cache.get(clipId) : cache.set(clipId, read(clipId)).get(clipId));
  return {
    warnings: issues.filter((i) => i.level === 'warning').map((i) => i.message),
    take: (z, t) => {
      const audio = audioOf(t.clipId);
      if (!audio) throw new Error(`The audio for zone ${noteName(z.rootKey)} is missing; remove this take and add the recording again.`);
      const clip = p.clips.find((c) => c.id === t.clipId);
      if (audio.sampleRate !== clip?.sampleRate || audio.channels.length !== clip.channels || audio.channels.some((ch) => ch.length < t.end)) {
        throw new Error(`The audio for zone ${noteName(z.rootKey)} doesn’t match its clip; remove this take and add the recording again.`);
      }
      return renderTake(t, audio);
    },
  };
}

export function buildProject(p: SampleProject, read: ReadAudio): BuildResult {
  return p.target === 'npno' ? buildPianoFile(p, read) : buildSampleFile(p, read);
}

export function buildSampleFile(p: SampleProject, read: ReadAudio): BuildResult {
  const { warnings, take } = prepare(p, read);
  const codec = p.target === 'nsmp3' ? 3 : 4;
  const asked: { root: number; low: number; high: number; loop: number | null; pitch: number; channels: number; frames: number; decay: number }[] = [];
  const zones: WriteZone[] = p.zones.map((z) => {
    const t = takeOf(z, z.layers[0])!;
    const r = take(z, t);
    const pitchBase = pitchBaseFor(t.tuneCents); // `check` (in `prepare`) refused tunes it can't store
    const ratio = NSMP_SAMPLE_RATE / r.sampleRate;
    // The sinc resample overshoots on hot audio; `writeNsmpMulti` clamps to ±32767.
    const channels = resampleToRate(r.channels, r.sampleRate, NSMP_SAMPLE_RATE);
    // A loop starting on the take's last frames can round onto the resampled end; keep it inside.
    const loopStart = r.loopStart === null ? null : Math.min(Math.round(r.loopStart * ratio), channels[0].length - 1);
    asked.push({ root: z.rootKey, low: z.keyLow, high: TARGETS[p.target].reach(z).highest, loop: loopStart,
      pitch: pitchBase, channels: channels.length, frames: channels[0].length,
      decay: loopStart === null ? 0 : loopDecayDbPerSecond(loopDecayRaw(t.loopDecaySeconds)),
    });
    return {
      channels, rootKey: z.rootKey, keyLow: z.keyLow, keyHigh: z.keyHigh,
      stroke: {
        rootKey: z.rootKey,
        // Tune by the stroke's replay rate (header +0x06), as converted strokes carry theirs.
        pitchBase,
        loop: loopStart === null ? undefined : { loopStart, altStart: 0, loops: true },
        decayRaw: loopStart === null ? undefined : loopDecayRaw(t.loopDecaySeconds),
      },
    };
  });
  const bytes = writeNsmpMulti({ name: p.name, codec, zones });

  // Read back: the file must hold what was asked.
  const got = readNsmpZones(bytes);
  const strokes = decodeNsmp(bytes);
  asked.forEach((a, i) => {
    const z = got[i];
    const s = strokes.find((x) => x.globalID === z?.globalID);
    const loop = s?.loop?.loops ? s.loop.loopStart : null;
    const decay = s?.loop?.loops ? s.loop.decayDbPerSecond : 0;
    if (
      !z || !s || z.rootKey !== a.root || z.keyLow !== a.low || z.keyHigh !== a.high || loop !== a.loop ||
      s.sampleRate !== a.pitch || s.channelCount !== a.channels || s.channels[0]?.length !== a.frames ||
      Math.abs(decay - a.decay) > 0.05
    ) {
      throw new Error(`OpenNord wrote zone ${noteName(a.root)} wrongly; nothing was saved. Please report this.`);
    }
  });
  return { bytes, extension: codec === 3 ? '.nsmp3' : '.nsmp4', fileName: `${fileNameStem(p.name, 'Sample')}.nsmp${codec}`, warnings };
}

/**
 * A piano through the converter "Make piano" uses (`sampleToPiano`): each zone's layers
 * become touch layers with the project's own floors (Task 1's `floorDb`), recordings are
 * re-pitched so every key plays its recording downwards, keys far above get copies, and the
 * result is held to `checkNpnoAcceptance(deep)`. A zone's own keyLow is not used: piano zones
 * tile from the zone below, as `planPianoZones` lays them out.
 */
export function buildPianoFile(p: SampleProject, read: ReadAudio): BuildResult {
  const { warnings, take } = prepare(p, read);
  const source: { zones: SampleSource['zones'][number][]; strokes: SampleSource['strokes'][number][] } = { zones: [], strokes: [] };
  const holds: string[] = [];
  let fades = 0;
  for (const { zone, src: z, layer } of pianoSourceZones(p)) {
    const t = takeOf(z, layer)!;
    const r = take(z, t);
    source.zones.push(zone);
    if (r.loopStart !== null) {
      if (t.loopDecaySeconds) fades++;
      else if (!holds.includes(noteName(z.rootKey))) holds.push(noteName(z.rootKey));
    }
    const frames = r.channels[0].length;
    source.strokes.push({
      globalID: zone.globalID,
      channels: r.channels,
      channelCount: r.channels.length,
      // Tune by the rate the recording is read at: higher rate, higher pitch.
      sampleRate: r.sampleRate * 2 ** (t.tuneCents / 1200),
      loop: r.loopStart === null ? null : {
        loopStart: r.loopStart, loopEnd: frames, loops: true, altStart: 0,
        decayDbPerSecond: loopDecayDbPerSecond(loopDecayRaw(t.loopDecaySeconds)),
      },
    });
  }
  // All loops hold: a true hold. Mixed: the converter's default fades them all, so say so.
  const mixed = holds.length > 0 && fades > 0;
  const result = sampleToPiano(source, {
    name: p.name, pianoType: p.piano?.type ?? NPNO_PIANO_TYPE.electric,
    ...(holds.length > 0 && fades === 0 ? { loopFade: 0 } : {}),
  });
  const acceptance = checkNpnoAcceptance(result.bytes, { deep: true, fileName: result.fileName });
  const failed = acceptance.checks.find((c) => !c.ok);
  if (failed) throw new Error(`This piano would not load on a Nord: ${failed.detail}`);
  // `sampleToPiano` adds its own, fuller "not tried on a Nord yet" line; keep only that one.
  const own = warnings.filter((w) => w !== UNTESTED);
  const theirs = mixed ? result.warnings.filter((w) => !w.includes("now fade like a piano's")) : result.warnings;
  if (mixed) {
    own.push(`Zones ${holds.join(', ')} hold their loops here, but in a piano they fade like a piano's: a piano made in OpenNord can't mix holding and fading loops yet.`);
  }
  return { bytes: result.bytes, extension: '.npno', fileName: result.fileName, warnings: [...own, ...theirs] };
}
