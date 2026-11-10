import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { addClip, addZone, emptyProject } from '../sample-build/model';
import { writeNsmpproj } from '../sample-build/nsmpproj';
import { importNsmpproj } from './importNsmpproj';
import { loadProject } from './sampleProjectStore';

describe('importNsmpproj', () => {
  it('opens a project and its recordings from a picked folder as a build, with what came over', async () => {
    const ch = Float32Array.from({ length: 44100 }, (_, i) => 0.5 * Math.sin(i / 20));
    const c = addClip(emptyProject('Pad'), { label: 'Pad C3.wav', source: { kind: 'file', fileName: 'Pad C3.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: ch.length });
    const p = addZone(c.project, 48, { clipId: c.clipId, start: 0, end: ch.length, loop: { start: 22050 }, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
    const w = writeNsmpproj(p, () => ({ sampleRate: 44100, channels: [ch] }));
    const picked = [
      { path: 'Pad/Pad.nsmpproj', file: new Blob([w.projectText]) },
      { path: 'Pad/Pad C3.wav', file: new Blob([w.wavs.get('Pad C3.wav')! as BlobPart]) },
      { path: 'Pad/notes.txt', file: new Blob(['hi']) },
    ];
    const r = await importNsmpproj(picked[0], picked);
    expect(r.notes[0]).toBe('Opened “Pad.nsmpproj” from Nord Sample Editor: one zone.');
    const stored = await loadProject(r.projectId);
    expect(stored?.zones.map((z) => [z.rootKey, z.takes[0].loop?.start])).toEqual([[48, 22050]]);
  });
});
