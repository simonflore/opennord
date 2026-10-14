/**
 * The portable project file (spec §8): a zip of `project.json` and `clips/<clipId>.wav`
 * (16-bit, at each clip's own rate), kept in the linked folder so a build travels and is
 * backed up with it. Reading checks the file thoroughly and says plainly what's wrong.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { encodeWav } from '../ns4/wav';
import { projectProblems, zonesUsing, type SampleProject } from './model';
import type { ClipAudio, ReadAudio } from './render';
import { wavToClipAudio } from './import-files';

const damaged = () => new Error('This project file is damaged.');

/** A clip no take uses whose audio is missing is left out; a used one with missing audio stops the write. */
export function writeOnsample(p: SampleProject, read: ReadAudio): Uint8Array {
  const files: Zippable = {};
  const clips = p.clips.filter((c) => {
    const a = read(c.id);
    if (!a) {
      if (zonesUsing(p, c.id).length === 0) return false;
      throw new Error(`The audio for “${c.label}” couldn’t be read, so the project file wasn’t written.`);
    }
    files[`clips/${c.id}.wav`] = [encodeWav(a.channels, a.sampleRate), { level: 0 }]; // audio barely compresses; storing is fast
    return true;
  });
  files['project.json'] = strToU8(JSON.stringify(clips.length === p.clips.length ? p : { ...p, clips }));
  return zipSync(files);
}

export function readOnsample(bytes: Uint8Array): { project: SampleProject; audio: Map<string, ClipAudio> } {
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes); } catch { throw new Error('This file isn’t an OpenNord project.'); }
  if (!files['project.json']) throw new Error('This file isn’t an OpenNord project.');
  let json: unknown;
  try { json = JSON.parse(strFromU8(files['project.json'])); } catch { throw damaged(); }
  if (typeof json !== 'object' || json === null) throw damaged();
  const parsed = json as SampleProject;
  if (typeof parsed.version === 'number' && parsed.version > 1) throw new Error('This project was made by a newer OpenNord; update OpenNord to open it.');
  if (parsed.version !== 1 || !Array.isArray(parsed.clips) || !Array.isArray(parsed.zones)) throw damaged();
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
  if (!parsed.clips.every((c) => isObj(c) && typeof c.id === 'string')) throw damaged();
  if (!parsed.zones.every((z) => isObj(z) && Array.isArray(z.layers) && Array.isArray(z.takes))) throw damaged();
  const audio = new Map<string, ClipAudio>();
  let project: SampleProject;
  try {
    const clips = parsed.clips.map((c) => {
      const label = typeof c.label === 'string' ? c.label : 'a clip';
      const wav = files[`clips/${c.id}.wav`];
      if (!wav) throw new Error(`The audio for “${label}” is missing from this project file.`);
      const audioRef = crypto.randomUUID();
      let clipAudio: ClipAudio;
      try { clipAudio = wavToClipAudio(wav); } catch { throw new Error(`The audio for “${label}” in this project file is damaged.`); }
      if (clipAudio.channels[0].length !== c.frames || clipAudio.sampleRate !== c.sampleRate || clipAudio.channels.length !== c.channels) {
        throw new Error(`The audio for “${label}” doesn’t match this project file.`);
      }
      audio.set(audioRef, clipAudio);
      return { ...c, audioRef };
    });
    project = { ...parsed, id: crypto.randomUUID(), clips, updatedAt: new Date().toISOString() };
    const problem = projectProblems(project)[0];
    if (problem) throw new Error(`This project file is damaged: ${problem}`);
  } catch (e) {
    // Our own plain-words errors pass through; anything else (a malformed entry) is damage.
    if (e instanceof Error && !(e instanceof TypeError || e instanceof RangeError)) throw e;
    throw damaged();
  }
  return { project, audio };
}
