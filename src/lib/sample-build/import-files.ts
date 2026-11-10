/**
 * WAV and AIFF files into a project (spec §6–7): each readable file becomes a clip with one take over
 * the whole recording, placed by the root in its name or, failing that, its detected pitch;
 * then the zones are mapped over the keys. Unreadable files are reported, not fatal.
 *
 * Decoding (slow, and independent of the project) and placing (cheap) are separate steps, so
 * a caller can decode once, store the audio, and then place onto whatever the project is by then.
 */
import { parseWav, wavToFloat, type WavAudio } from '../ns4/wav';
import { getErrorMessage } from '../errors';
import { addClip, type SampleProject } from './model';
import { isAiff, parseAiff } from './aiff';
import type { ClipAudio } from './render';
import { rootFromFileName } from './analysis/note-name';
import { estimatePitch } from './analysis/pitch';
import { autoMap, placeTakes, type Candidate, type PlaceReport } from './analysis/automap';

/** A WAV's audio, with the root and loop its `smpl` chunk names, when it has one. */
export function readWav(bytes: Uint8Array): { audio: ClipAudio } & Pick<WavAudio, 'unityNote' | 'loop'> {
  let wav;
  try { wav = parseWav(bytes); } catch { throw new Error('This isn’t a WAV file OpenNord can read (PCM or 32-bit float).'); }
  if (!wav.channels[0]?.length) throw new Error('This WAV file has no audio in it.');
  if (!(wav.sampleRate > 0)) throw new Error('This WAV file doesn’t say its sample rate, so it can’t be played.');
  const audio = { sampleRate: wav.sampleRate, channels: wavToFloat({ ...wav, channels: wav.channels.slice(0, 2) }) };
  return { audio, unityNote: wav.unityNote, loop: wav.loop };
}

export const wavToClipAudio = (bytes: Uint8Array): ClipAudio => readWav(bytes).audio;

/** A WAV or AIFF file's audio, with the root note and loop the file names, when it has them. */
export function readAudioFile(bytes: Uint8Array): ReturnType<typeof readWav> {
  if (isAiff(bytes)) {
    const a = parseAiff(bytes);
    // Both keys always there, as `readWav` gives them, so callers can tell a file reader's result from a browser decode.
    return { audio: a.audio, unityNote: a.unityNote, loop: a.loop };
  }
  return readWav(bytes);
}

/** Does a file name look like audio `readAudioFile` reads? */
export const isReadableAudioName = (name: string): boolean => /\.(wav|wave|aif|aiff|aifc)$/i.test(name);

export interface ImportedFile { fileName: string; bytes: Uint8Array }
export interface DecodedFile {
  fileName: string; audio: ClipAudio; pitch: ReturnType<typeof estimatePitch>;
  /** The root note and loop (end inclusive) the file itself names. */
  unityNote?: number; loop?: { start: number; end: number };
}
export type Unreadable = { fileName: string; reason: string }[];
export interface ImportResult {
  project: SampleProject;
  audio: Map<string, ClipAudio>;
  report: PlaceReport & { unreadable: Unreadable };
}

/** Read each file's audio and hear its pitch; a file that can't be read is listed with why. */
export function decodeAudioFiles(files: ImportedFile[]): { decoded: DecodedFile[]; unreadable: Unreadable } {
  const decoded: DecodedFile[] = [];
  const unreadable: Unreadable = [];
  for (const f of files) {
    try {
      const { audio, unityNote, loop } = readAudioFile(f.bytes);
      decoded.push({
        fileName: f.fileName, audio, pitch: estimatePitch(audio, 0, audio.channels[0].length),
        ...(unityNote !== undefined && { unityNote }), ...(loop && { loop }),
      });
    } catch (e) { unreadable.push({ fileName: f.fileName, reason: getErrorMessage(e) }); }
  }
  return { decoded, unreadable };
}

/** Add decoded files to `p` as clips, place a take for each, and map the keys. `audio` is by the new clips' audioRef. */
export function placeDecoded(p: SampleProject, decoded: DecodedFile[], newRef: (file: DecodedFile) => string = () => crypto.randomUUID()): {
  project: SampleProject; audio: Map<string, ClipAudio>; report: PlaceReport;
} {
  let project = p;
  const audio = new Map<string, ClipAudio>();
  const candidates: Candidate[] = [];
  for (const file of decoded) {
    const { fileName, audio: clipAudio, pitch, unityNote, loop } = file;
    const audioRef = newRef(file);
    const frames = clipAudio.channels[0].length;
    const added = addClip(project, {
      label: fileName, source: { kind: 'file', fileName }, audioRef,
      sampleRate: clipAudio.sampleRate, channels: clipAudio.channels.length as 1 | 2, frames,
    });
    project = added.project;
    audio.set(audioRef, clipAudio);
    // The name wins, then the note the file stores, then what was heard. Many tools store 60
    // when nobody set a note, so a stored C4 only counts when no clear pitch was heard.
    const stored = unityNote === 60 ? undefined : unityNote;
    const root = rootFromFileName(fileName) ?? stored ?? pitch?.midi ?? unityNote ?? null;
    // A file's own loop comes along. On the Nord a loop ends the sample, so the take ends where the loop does.
    const fits = loop && loop.start > 0 && loop.end > loop.start && loop.end < frames;
    candidates.push({
      clipId: added.clipId, start: 0, end: fits ? loop.end + 1 : frames, root, label: fileName, pitchEstimate: pitch ?? undefined,
      ...(fits && { loopStart: loop.start }),
    });
  }
  const placed = placeTakes(project, candidates);
  return { project: autoMap(placed.project), audio, report: placed.report };
}

export function importAudioFiles(p: SampleProject, files: ImportedFile[], newRef?: (file: DecodedFile) => string): ImportResult {
  const { decoded, unreadable } = decodeAudioFiles(files);
  const placed = placeDecoded(p, decoded, newRef);
  return { ...placed, report: { ...placed.report, unreadable } };
}
