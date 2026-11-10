/**
 * A Nord sample (`.nsmp`, `.nsmp3`, `.nsmp4`) as a build, so a sample already in the Library
 * can be reworked (a loop found, a take swapped, keys moved) and saved or sent again, or
 * carried on in Nord Sample Editor. Each recording becomes a clip at the sample's own rate
 * (the build writes it back without resampling), and each zone keeps its keys, root, loop
 * and loop decay; a recording's fine tuning comes back as the take's Tune.
 *
 * Levels: the recordings are brought up to full scale each, as the sample player in the app
 * plays them; the stored per-stroke level isn't read yet, so takes start at 0 dB.
 */
import { decodeNsmp, NSMP_SAMPLE_RATE, readNsmp, readNsmpZones, readSampleCategory, type DecodedStrokeResult } from '../ns4/nsmp';
import { normalizeChannels } from '../ns4/nsmp-audio';
import { noteName } from '../ns4/sample-view';
import { addClip, addTake, addZone, emptyProject, setKeys, type NewTake, type SampleProject } from './model';
import type { ClipAudio } from './render';

export interface FromNsmp {
  project: SampleProject;
  /** Clip audio by its audioRef. */
  audio: Map<string, ClipAudio>;
  /** What came over and what didn't, in plain words. */
  notes: string[];
}

/** Seconds to fall 40 dB, from the loop's dB lost per second (0 holds). */
const decaySeconds = (dbPerSecond: number): number | null => (dbPerSecond > 0 ? Math.round((40 / dbPerSecond) * 100) / 100 : null);

export function nsmpToProject(bytes: Uint8Array, name: string, newRef: () => string = () => crypto.randomUUID()): FromNsmp {
  const file = readNsmp(bytes);
  if (!file.recognized || file.pianoLibrary) throw new Error('This isn’t a sample OpenNord can open as a build.');
  // The sample's own header marks Nord's factory samples (`hdrFactoryFlag`); a build is for your own.
  if (file.suspectedFactory) throw new Error('This looks like one of Nord’s own samples. Build a sample is for samples you made.');
  const strokes = decodeNsmp(bytes);
  if (!strokes.length) throw new Error('OpenNord couldn’t read the recordings in this sample, so it can’t be opened as a build.');
  const zones = readNsmpZones(bytes);
  const notes: string[] = [];

  let project = emptyProject(name.trim() || file.name?.trim() || 'Sample', file.codec === 3 ? 'nsmp3' : 'nsmp4');
  const category = readSampleCategory(bytes).main;
  if (category !== undefined) project = { ...project, category };
  if (file.legacy) notes.push('This is an older sample (.nsmp): the build saves it as a Stage 4 sample (.nsmp4); switch to Stage 3 if you need that.');

  const audio = new Map<string, ClipAudio>();
  const clipOf = new Map<DecodedStrokeResult, string>();
  const strokeById = new Map(strokes.map((s) => [s.globalID, s]));
  let lostLoops = 0;

  /** The take a stroke becomes, adding its recording as a clip the first time. */
  const takeOf = (s: DecodedStrokeResult, root: number): NewTake => {
    let clipId = clipOf.get(s);
    const frames = s.channels[0].length;
    if (!clipId) {
      const channels = normalizeChannels(s.channels.slice(0, 2));
      const audioRef = newRef();
      const added = addClip(project, {
        label: `${project.name} ${noteName(root)}${s.index ? ` (recording ${s.index + 1})` : ''}`,
        source: { kind: 'file', fileName: name }, audioRef, sampleRate: NSMP_SAMPLE_RATE, channels: channels.length as 1 | 2, frames,
      });
      project = added.project;
      clipId = added.clipId;
      clipOf.set(s, clipId);
      audio.set(audioRef, { sampleRate: NSMP_SAMPLE_RATE, channels });
    }
    if (!s.loop) lostLoops++;
    const loops = !!s.loop?.loops && s.loop.loopStart > 0 && s.loop.loopStart < frames;
    return {
      clipId, start: 0, end: frames,
      loop: loops ? { start: s.loop!.loopStart } : null,
      loopDecaySeconds: loops ? decaySeconds(s.loop!.decayDbPerSecond) : null,
      gainDb: 0,
      // The recording's fine tuning is its pitch base off the Nord's rate (`strokeSampleRate`).
      tuneCents: Math.round(1200 * Math.log2(s.sampleRate / NSMP_SAMPLE_RATE)),
    };
  };

  // A zone is a key range with its root; several strokes on one range are its takes, the
  // loudest velocity layer playing (a build's sample plays one take per zone).
  const groups = new Map<string, { root: number; low: number; high: number; strokes: { s: DecodedStrokeResult; vel: number }[] }>();
  for (const z of zones) {
    const s = strokeById.get(z.globalID);
    if (!s) continue;
    const key = `${z.keyLow}-${z.keyHigh}-${z.rootKey}`;
    const g = groups.get(key) ?? { root: z.rootKey, low: z.keyLow, high: z.keyHigh, strokes: [] };
    g.strokes.push({ s, vel: z.velTop });
    groups.set(key, g);
  }
  // No readable key map: each recording on its own root key, one zone each.
  if (!groups.size) {
    notes.push('The sample’s key map couldn’t be read: each recording is on its own key; use Auto map to spread them.');
    strokes.forEach((s, i) => groups.set(`s${i}`, { root: 60 + i, low: 60 + i, high: 60 + i, strokes: [{ s, vel: 127 }] }));
  }

  let layered = 0, skipped = 0;
  for (const g of [...groups.values()].sort((a, b) => a.low - b.low)) {
    const ordered = g.strokes.sort((a, b) => b.vel - a.vel);
    let zoneId: string;
    try {
      const first = takeOf(ordered[0].s, g.root); // adds its clip to the project first
      const added = addZone(project, g.root, first);
      project = setKeys(added.project, added.zoneId, Math.min(g.low, g.root), Math.max(g.high, g.root));
      zoneId = added.zoneId;
    } catch {
      skipped += ordered.length; // keys that overlap a zone already placed
      continue;
    }
    for (const { s } of ordered.slice(1)) {
      const take = takeOf(s, g.root);
      project = addTake(project, zoneId, take).project;
      layered++;
    }
  }
  if (layered) notes.push(`${layered === 1 ? 'One zone has' : 'Some zones have'} velocity layers: the loudest plays and the others wait as takes (a Stage 3 or 4 sample plays one per zone).`);
  if (skipped) notes.push(`${skipped === 1 ? 'One recording overlaps' : `${skipped} recordings overlap`} the keys of another zone and ${skipped === 1 ? 'was' : 'were'} left out.`);
  if (lostLoops) notes.push(`The loop of ${lostLoops === 1 ? 'one recording' : `${lostLoops} recordings`} couldn’t be read: ${lostLoops === 1 ? 'it plays' : 'they play'} once; use Find loop.`);
  notes.push('Each recording is brought up to full level, as OpenNord plays samples; set Level per take if they should differ.');
  return { project, audio, notes };
}
