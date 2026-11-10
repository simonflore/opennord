/**
 * Open a Nord Sample Editor project (`.nsmpproj`) as a build, so projects made in the editor
 * carry on in OpenNord. The layout is the one `nsmpproj.ts` writes and documents; this reads
 * it back: zones (`map_zone` + `common_zone`, tied by `m_zoneId`), their strokes as takes (the
 * enabled `map_stroke` plays), trim, loop, crossfade, decay, level and tuning, root, keys,
 * category and name. The audio is the WAV each `audio_file` names, found by file name among the
 * files the player picked (the editor stores a path relative to where the project was saved).
 */
import { addClip, addTake, addZone, emptyProject, setKeys, setActiveTake, type NewTake, type SampleProject } from './model';
import type { ClipAudio } from './render';

/** One `name { … }` section: its `key = value` lines and the sections inside it, in order. */
export interface NseSection { name: string; values: Record<string, string>; children: NseSection[] }

/** The project's text as sections. Throws when it isn't a Nord Sample Editor project. */
export function parseNsmpproj(text: string): NseSection {
  const root: NseSection = { name: '', values: {}, children: [] };
  const stack = [root];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith('{')) {
      const s: NseSection = { name: line.slice(0, -1).trim(), values: {}, children: [] };
      stack[stack.length - 1].children.push(s);
      stack.push(s);
    } else if (line === '}') {
      if (stack.length > 1) stack.pop();
    } else {
      const at = line.indexOf(' =');
      if (at > 0) stack[stack.length - 1].values[line.slice(0, at)] = line.slice(at + 2).trim();
    }
  }
  const project = root.children.find((c) => c.name === 'SMACEditorProject');
  if (!project) throw new Error('This isn’t a Nord Sample Editor project.');
  return project;
}

const kids = (s: NseSection | undefined, name: string) => (s ? s.children.filter((c) => c.name === name) : []);
const num = (s: NseSection, key: string, fallback = 0) => { const v = Number(s.values[key]); return Number.isFinite(v) ? v : fallback; };

/** The file name an `audio_file` points at, whatever folders its path names. */
export const nseAudioBaseName = (fullName: string) => fullName.replace(/\\/g, '/').split('/').pop() ?? fullName;

/** The file names of the recordings a project uses, as `nseAudioBaseName` gives them. */
export function nsmpprojAudioNames(project: NseSection): string[] {
  return kids(project, 'audio_file').map((a) => nseAudioBaseName(a.values.m_fullName ?? ''));
}

export interface FromNsmpproj { project: SampleProject; audio: Map<string, ClipAudio>; notes: string[] }

/**
 * The build a parsed project describes. `audioByName` holds the recordings by file name
 * (lower case); a zone whose recordings are missing is left out and named in the notes.
 */
export function nsmpprojToProject(
  nse: NseSection, audioByName: Map<string, ClipAudio>, newRef: () => string = () => crypto.randomUUID(),
): FromNsmpproj {
  const instrument = kids(nse, 'instrument')[0];
  const map = kids(instrument, 'map_info')[0];
  const name = instrument?.values.m_name?.trim() || 'Sample';
  let project = emptyProject(name, 'nsmp4');
  const category = instrument ? num(instrument, 'm_categoryCategory', 0) : 0;
  if (category >= 1 && category <= 18) project = { ...project, category };
  const notes: string[] = [];
  const audio = new Map<string, ClipAudio>();

  // Recordings: one clip per audio file found.
  const clipOfFile = new Map<string, { clipId: string; rate: number; frames: number }>();
  const missing = new Set<string>();
  for (const f of kids(nse, 'audio_file')) {
    const file = nseAudioBaseName(f.values.m_fullName ?? '');
    const a = audioByName.get(file.toLowerCase());
    if (!a) { missing.add(file); continue; }
    const audioRef = newRef();
    const added = addClip(project, {
      label: file, source: { kind: 'file', fileName: file }, audioRef,
      sampleRate: a.sampleRate, channels: Math.min(2, a.channels.length) as 1 | 2, frames: a.channels[0].length,
    });
    project = added.project;
    audio.set(audioRef, a);
    clipOfFile.set(f.values.m_id, { clipId: added.clipId, rate: a.sampleRate, frames: a.channels[0].length });
  }

  const strokesOfZone = new Map(kids(nse, 'common_zone').map((z) => [z.values.m_zoneId, kids(z, 'common_stroke')]));
  let shortLoops = 0, layered = 0, dropped = 0, overlapped = 0;
  for (const mz of kids(map, 'map_zone').sort((a, b) => num(a, 'm_btmNote') - num(b, 'm_btmNote'))) {
    if (mz.values.m_isEnabled === '0') continue;
    const root = num(mz, 'm_rootKey', 60), low = num(mz, 'm_btmNote', root), high = num(mz, 'm_topNote', root);
    const common = new Map((strokesOfZone.get(mz.values.m_zoneId) ?? []).map((s) => [s.values.m_globalID, s]));
    const takes: { take: NewTake; on: boolean }[] = [];
    for (const ms of kids(mz, 'map_stroke')) {
      const cs = common.get(ms.values.m_globalID);
      const clip = cs && clipOfFile.get(cs.values.m_fileID);
      if (!cs || !clip) { dropped++; continue; }
      const start = Math.max(0, Math.min(clip.frames - 1, Math.round(num(cs, 'm_start'))));
      const end = Math.max(start + 1, Math.min(clip.frames, Math.round(num(cs, 'm_stop', clip.frames))));
      const loopAt = Math.round(num(cs, 'm_loopStart', end));
      const loops = cs.values.m_loopEnabled === '1' && loopAt > start && loopAt < end;
      if (cs.values.m_shortLoopEnabled === '1') shortLoops++;
      const xfade = num(cs, 'm_loopXFadeLengthLong');
      const gain = num(ms, 'm_gain', 1);
      takes.push({
        on: ms.values.m_isEnabled !== '0',
        take: {
          clipId: clip.clipId, start, end,
          loop: loops ? { start: loopAt } : null,
          loopDecaySeconds: loops && cs.values.m_loopDecayEnabled === '1' && num(cs, 'm_loopDecay') > 0 ? num(cs, 'm_loopDecay') : null,
          ...(loops && xfade > 0 && { loopCrossfadeMs: Math.round((xfade / clip.rate) * 10000) / 10 }),
          gainDb: gain > 0 ? Math.round(20 * Math.log10(gain) * 100) / 100 : 0,
          tuneCents: Math.round(num(ms, 'm_detune')),
        },
      });
    }
    if (!takes.length) continue;
    let zoneId: string;
    try {
      const added = addZone(project, root, takes[0].take);
      project = setKeys(added.project, added.zoneId, Math.min(low, root), Math.max(high, root));
      zoneId = added.zoneId;
    } catch { overlapped++; continue; }
    const ids = [{ id: project.zones.find((z) => z.id === zoneId)!.takes[0].id, on: takes[0].on }];
    for (const t of takes.slice(1)) {
      const r = addTake(project, zoneId, t.take);
      project = r.project;
      ids.push({ id: r.takeId, on: t.on });
    }
    const enabled = ids.filter((x) => x.on);
    if (enabled.length > 1) layered++;
    if (enabled.length && enabled[0].id !== ids[0].id) project = setActiveTake(project, zoneId, enabled[0].id);
  }

  if (missing.size) notes.push(`Not found among the files you picked: ${[...missing].map((m) => `“${m}”`).join(', ')}. Pick the folder with the project and its recordings.`);
  if (dropped) notes.push(`${dropped === 1 ? 'One sample' : `${dropped} samples`} without ${dropped === 1 ? 'its recording was' : 'their recordings were'} left out.`);
  if (overlapped) notes.push(`${overlapped === 1 ? 'One zone overlaps' : `${overlapped} zones overlap`} the keys of another and ${overlapped === 1 ? 'was' : 'were'} left out.`);
  if (layered) notes.push(`${layered === 1 ? 'One zone has' : `${layered} zones have`} several samples switched on: the first plays and the others wait as takes.`);
  if (shortLoops) notes.push(`${shortLoops === 1 ? 'One sample uses' : `${shortLoops} samples use`} the editor’s short loop, which OpenNord doesn’t make: ${shortLoops === 1 ? 'it uses' : 'they use'} the long loop if set, else ${shortLoops === 1 ? 'plays' : 'play'} once. Try Find loop.`);
  if (!project.zones.length) throw new Error(missing.size
    ? 'None of the project’s recordings were found. Pick the folder with the project and its WAV files.'
    : 'This project has no zones to open.');
  return { project, audio, notes };
}
