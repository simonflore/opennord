/**
 * Open a sample from the Library as a new build (`nsmpToProject`): its recordings are stored,
 * then the project, so a saved build never points at audio that wasn't written.
 */
import { nsmpToProject } from '../sample-build/from-nsmp';
import { deleteClipAudio, saveClipAudio, saveProject } from './sampleProjectStore';

export async function openSampleAsBuild(bytes: Uint8Array, name: string): Promise<{ projectId: string; notes: string[] }> {
  const { project, audio, notes } = nsmpToProject(bytes, name.replace(/\.nsmp[34]?$/i, ''));
  const stored: string[] = [];
  try {
    for (const [ref, a] of audio) { await saveClipAudio(ref, a); stored.push(ref); }
    await saveProject(project);
  } catch (e) {
    await deleteClipAudio(stored).catch(() => undefined);
    throw e;
  }
  return { projectId: project.id, notes };
}
