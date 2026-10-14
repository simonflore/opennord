/**
 * Build-sample projects and their clip audio in OpenNord's own storage
 *. The user's own work, never shared
 * (docs/LEGAL.md). Projects are plain JSON; audio is stored per clip, at its own rate.
 */
import { idbTx, idbWriteAll, STORE_SAMPLE_PROJECT_AUDIO, STORE_SAMPLE_PROJECTS } from '../idb';
import type { SampleProject } from '../sample-build/model';
import type { ClipAudio } from '../sample-build/render';

export function saveProject(p: SampleProject): Promise<void> {
  return idbTx(STORE_SAMPLE_PROJECTS, 'readwrite', (s) => s.put(p, p.id)).then(() => undefined);
}

export function loadProject(id: string): Promise<SampleProject | undefined> {
  return idbTx<SampleProject | undefined>(STORE_SAMPLE_PROJECTS, 'readonly', (s) => s.get(id));
}

export async function listProjects(): Promise<{ id: string; name: string; target: SampleProject['target']; zones: number; updatedAt: string }[]> {
  const all = await idbTx<SampleProject[]>(STORE_SAMPLE_PROJECTS, 'readonly', (s) => s.getAll());
  return all
    .map((p) => ({ id: p.id, name: p.name, target: p.target, zones: p.zones.length, updatedAt: p.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** The project and its clip audio go together, in one transaction. */
export function deleteProject(p: SampleProject): Promise<void> {
  return idbWriteAll([STORE_SAMPLE_PROJECTS, STORE_SAMPLE_PROJECT_AUDIO], (tx) => {
    tx.objectStore(STORE_SAMPLE_PROJECTS).delete(p.id);
    const audio = tx.objectStore(STORE_SAMPLE_PROJECT_AUDIO);
    for (const c of p.clips) audio.delete(c.audioRef);
  });
}

export function saveClipAudio(audioRef: string, audio: ClipAudio): Promise<void> {
  return idbTx(STORE_SAMPLE_PROJECT_AUDIO, 'readwrite', (s) => s.put(audio, audioRef)).then(() => undefined);
}

export function loadClipAudio(audioRef: string): Promise<ClipAudio | undefined> {
  return idbTx<ClipAudio | undefined>(STORE_SAMPLE_PROJECT_AUDIO, 'readonly', (s) => s.get(audioRef));
}
