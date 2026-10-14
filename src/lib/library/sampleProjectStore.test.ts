import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { addClip, addZone, emptyProject, type SampleProject } from '../sample-build/model';
import { deleteProject, listProjects, loadClipAudio, loadProject, saveClipAudio, saveProject } from './sampleProjectStore';

function project(name: string, updatedAt: string): SampleProject {
  const c = addClip(emptyProject(name), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: `${name}-a`, sampleRate: 44100, channels: 1, frames: 100 });
  const z = addZone(c.project, 60, { clipId: c.clipId, start: 0, end: 100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
  return { ...z.project, updatedAt };
}

describe('sampleProjectStore', () => {
  beforeEach(async () => { for (const p of await listProjects()) { const full = await loadProject(p.id); if (full) await deleteProject(full); } });

  it('round-trips a project exactly', async () => {
    const p = project('Rhodes', '2026-10-14T10:00:00Z');
    await saveProject(p);
    expect(await loadProject(p.id)).toEqual(p);
  });

  it('lists projects newest first, with what the list shows', async () => {
    await saveProject(project('Old', '2026-10-01T00:00:00Z'));
    await saveProject(project('New', '2026-10-14T00:00:00Z'));
    const list = await listProjects();
    expect(list.map((x) => x.name)).toEqual(['New', 'Old']);
    expect(list[0]).toMatchObject({ target: 'nsmp4', zones: 1 });
  });

  it('keeps clip audio, and deleting a project deletes its audio', async () => {
    const p = project('Pad', '2026-10-14T00:00:00Z');
    const audio = { sampleRate: 44100, channels: [Float32Array.from([0, 0.5, -0.5])] };
    await saveProject(p);
    await saveClipAudio('Pad-a', audio);
    expect(await loadClipAudio('Pad-a')).toEqual(audio);
    await deleteProject(p);
    expect(await loadProject(p.id)).toBeUndefined();
    expect(await loadClipAudio('Pad-a')).toBeUndefined();
  });

  it('deleting a project with two clips removes both clips\' audio', async () => {
    const c1 = addClip(emptyProject('Duo'), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'Duo-a', sampleRate: 44100, channels: 1, frames: 3 });
    const c2 = addClip(c1.project, { label: 'b', source: { kind: 'file', fileName: 'b.wav' }, audioRef: 'Duo-b', sampleRate: 44100, channels: 1, frames: 3 });
    const z = addZone(c2.project, 60, { clipId: c1.clipId, start: 0, end: 3, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
    const p: SampleProject = { ...z.project, updatedAt: '2026-10-14T00:00:00Z' };
    const audio = { sampleRate: 44100, channels: [Float32Array.from([0, 0.5, -0.5])] };
    await saveProject(p);
    await saveClipAudio('Duo-a', audio);
    await saveClipAudio('Duo-b', audio);
    await deleteProject(p);
    expect(await loadProject(p.id)).toBeUndefined();
    expect(await loadClipAudio('Duo-a')).toBeUndefined();
    expect(await loadClipAudio('Duo-b')).toBeUndefined();
  });
});
