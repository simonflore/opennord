/**
 * Open a Nord Sample Editor project as a new build: the project and the recordings it names,
 * from the files the player picked (the folder with both). Each recording is read and
 * stored, then the project, as `importSfz` does.
 */
import { readFileBytes } from '../file';
import { isReadableAudioName, readAudioFile } from '../sample-build/import-files';
import { nsmpprojAudioNames, nsmpprojToProject, parseNsmpproj } from '../sample-build/nsmpproj-read';
import type { ClipAudio } from '../sample-build/render';
import { deleteClipAudio, saveClipAudio, saveProject } from './sampleProjectStore';
import type { DecodeOther, PickedFile } from './importSfz';

export const isNsmpproj = (path: string) => /\.nsmpproj$/i.test(path);
const baseName = (path: string) => path.replace(/\\/g, '/').split('/').pop() ?? path;

export async function importNsmpproj(
  project: PickedFile, picked: readonly PickedFile[], decodeOther?: DecodeOther,
): Promise<{ projectId: string; notes: string[] }> {
  const nse = parseNsmpproj(new TextDecoder().decode(await readFileBytes(project.file)));
  // Only the recordings the project names are read, wherever in the picked folder they sit.
  const wanted = new Set(nsmpprojAudioNames(nse).map((n) => n.toLowerCase()));
  const audio = new Map<string, ClipAudio>();
  const unreadable: string[] = [];
  for (const f of picked) {
    const name = baseName(f.path);
    if (!wanted.has(name.toLowerCase()) || audio.has(name.toLowerCase())) continue;
    try {
      const bytes = await readFileBytes(f.file);
      audio.set(name.toLowerCase(), isReadableAudioName(name) || !decodeOther ? readAudioFile(bytes).audio : await decodeOther(bytes));
    } catch { unreadable.push(name); }
  }
  const r = nsmpprojToProject(nse, audio);
  const stored: string[] = [];
  try {
    for (const [ref, a] of r.audio) { await saveClipAudio(ref, a); stored.push(ref); }
    await saveProject(r.project);
  } catch (e) {
    await deleteClipAudio(stored).catch(() => undefined);
    throw e;
  }
  const notes = [`Opened “${baseName(project.path)}” from Nord Sample Editor: ${r.project.zones.length === 1 ? 'one zone' : `${r.project.zones.length} zones`}.`, ...r.notes];
  if (unreadable.length) notes.push(`Couldn’t read ${unreadable.map((n) => `“${n}”`).join(', ')}: convert ${unreadable.length === 1 ? 'it' : 'them'} to WAV.`);
  return { projectId: r.project.id, notes };
}
