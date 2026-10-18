/**
 * Import an SFZ instrument as a new build: read the instrument and the recordings it names
 * from the files the player picked (usually its whole folder), store each recording as it is
 * read, then the project, and say what came over. The layout itself is `sfzToProject`'s.
 */
import { readFileBytes } from '../file';
import { parseSfz, sfzRegion } from '../sample-build/sfz';
import { folderOf, sampleResolver } from '../sample-build/sfz-files';
import { describeSfzImport, keptRegions, sfzToProject, type SfzSample } from '../sample-build/sfz-project';
import { readWav } from '../sample-build/import-files';
import type { ClipAudio } from '../sample-build/render';
import { deleteClipAudio, saveClipAudio, saveProject } from './sampleProjectStore';

/** A picked file and its path within the picked folder (`webkitRelativePath`), or its name. */
export interface PickedFile { path: string; file: Blob }

/** Audio a WAV reader can't read; the browser's decoder in the app (`decodeWithBrowser`). */
export type DecodeOther = (bytes: Uint8Array) => Promise<ClipAudio>;

export const isSfz = (path: string) => /\.sfz$/i.test(path);
const isText = (path: string) => /\.(sfz|sfzh|txt)$/i.test(path);
const baseName = (path: string) => path.replace(/\\/g, '/').split('/').pop() ?? path;

/** Recordings read at once: enough to overlap reading with decoding, few enough to keep memory small. */
const READ_AT_ONCE = 3;

/** Run `work` over `items`, at most `limit` at a time. */
async function eachLimited<T>(items: readonly T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await work(items[next++]);
  }));
}

export async function importSfz(
  sfz: PickedFile, picked: readonly PickedFile[], decodeOther?: DecodeOther,
): Promise<{ projectId: string; notes: string[] }> {
  const decoder = new TextDecoder();
  const byPath = new Map(picked.map((p) => [p.path, p.file]));
  const resolve = sampleResolver(picked.map((p) => p.path));
  // Includes are read synchronously by the parser, so every text file nearby is read first.
  const texts = new Map<string, string>();
  await Promise.all(picked.filter((p) => isText(p.path)).map(async (p) => { texts.set(p.path, decoder.decode(await readFileBytes(p.file))); }));
  const text = texts.get(sfz.path) ?? decoder.decode(await readFileBytes(sfz.file));
  const parsed = parseSfz(text, (path) => {
    const at = resolve(sfz.path, path);
    return at === undefined ? undefined : texts.get(at);
  });
  const regions = parsed.regions.map(sfzRegion);
  if (!regions.length) throw new Error(`“${baseName(sfz.path)}” has no regions, so there is nothing to import.`);

  // Only the recordings kept regions play are read: a library's release samples and other
  // key switches can be most of its audio. Each is stored as soon as it is decoded and let go,
  // so memory holds a few recordings at a time, never the library.
  const samples = new Map<string, SfzSample | undefined>();
  const stored: string[] = [];
  await eachLimited([...new Set(keptRegions(regions).kept.map((r) => r.sample))], READ_AT_ONCE, async (name) => {
    const at = resolve(sfz.path, name);
    samples.set(name, undefined); // missing until read
    if (!at) return;
    try {
      const bytes = await readFileBytes(byPath.get(at)!);
      const wav = /\.wav$/i.test(at);
      const read = wav ? readWav(bytes) : decodeOther ? { audio: await decodeOther(bytes) } : undefined;
      if (!read) return;
      const audioRef = crypto.randomUUID();
      await saveClipAudio(audioRef, read.audio);
      stored.push(audioRef);
      const { sampleRate, channels } = read.audio;
      samples.set(name, {
        fileName: baseName(at), audioRef, sampleRate, channels: channels.length as 1 | 2, frames: channels[0].length,
        ...('unityNote' in read && { unityNote: read.unityNote, loop: read.loop }),
      });
    } catch {
      // Reported with the missing ones: the note names the file.
    }
  });

  try {
    const name = baseName(sfz.path).replace(/\.sfz$/i, '') || folderOf(sfz.path) || 'SFZ instrument';
    const { project, report } = sfzToProject(name, regions, samples);
    if (!report.zones) {
      throw new Error(report.missing.length
        ? `None of the recordings “${baseName(sfz.path)}” names were found. Pick the instrument’s whole folder.`
        : `Nothing in “${baseName(sfz.path)}” could be placed on the keys.`);
    }
    await saveProject(project);
    // Recordings no zone ended up using go again.
    const kept = new Set(project.clips.map((c) => c.audioRef));
    await deleteClipAudio(stored.filter((ref) => !kept.has(ref)));
    return { projectId: project.id, notes: describeSfzImport(report, parsed.missingIncludes) };
  } catch (e) {
    await deleteClipAudio(stored).catch(() => undefined);
    throw e;
  }
}
