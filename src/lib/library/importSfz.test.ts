import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { encodeWav } from '../ns4/wav';
import { importSfz, type PickedFile } from './importSfz';
import { loadClipAudio, loadProject } from './sampleProjectStore';

const wav = (path: string, loop?: { start: number; end: number; unityNote?: number }): PickedFile =>
  ({ path, file: new Blob([encodeWav([new Float32Array(2000).fill(0.25)], 44100, loop) as BlobPart]) });
const text = (path: string, body: string): PickedFile => ({ path, file: new Blob([body]) });

describe('importSfz', () => {
  it('stores the instrument as a new build, with its audio, and says what came over', async () => {
    const sfz = text('Rhodes/Rhodes.sfz', '#include "map.sfzh"\n<region> sample=Samples/E4.wav key=64');
    const files = [sfz, text('Rhodes/map.sfzh', '<region> sample=Samples\\C4.wav lokey=58 hikey=62 pitch_keycenter=sample'),
      wav('Rhodes/Samples/C4.wav', { start: 100, end: 1499, unityNote: 60 }), wav('Rhodes/Samples/E4.wav')];
    const { projectId, notes } = await importSfz(sfz, files);
    const project = (await loadProject(projectId))!;
    expect(project.name).toBe('Rhodes');
    expect(project.zones.map((z) => [z.keyLow, z.keyHigh, z.rootKey])).toEqual([[58, 62, 60], [64, 64, 64]]);
    expect(project.zones[0].takes[0]).toMatchObject({ end: 1500, loop: { start: 100 } });
    for (const c of project.clips) expect(await loadClipAudio(c.audioRef)).toBeDefined();
    expect(notes[0]).toContain('Imported 2 zones');
  });

  it('reads other audio through the decoder it is given, and lists what it couldn\'t read', async () => {
    const sfz = text('Kit/kit.sfz', '<region> sample=a.flac key=36 <region> sample=b.ogg key=38');
    const decode = async (bytes: Uint8Array) => {
      if (new TextDecoder().decode(bytes) === 'unreadable') throw new Error('no');
      return { sampleRate: 48000, channels: [new Float32Array(500)] };
    };
    const { projectId, notes } = await importSfz(sfz, [sfz, text('Kit/a.flac', 'x'), text('Kit/b.ogg', 'unreadable')], decode);
    expect((await loadProject(projectId))!.zones.map((z) => z.rootKey)).toEqual([36]);
    expect(notes.join(' ')).toContain('“b.ogg”');
  });

  it('never reads the recordings only left-out regions play', async () => {
    const sfz = text('P/p.sfz', '<region> sample=note.flac key=60 <region> sample=release.flac key=60 trigger=release <region> sample=other.flac key=62 sw_last=c1 sw_default=c0');
    const read: string[] = [];
    const decode = async (bytes: Uint8Array) => { read.push(new TextDecoder().decode(bytes)); return { sampleRate: 48000, channels: [new Float32Array(500)] }; };
    await importSfz(sfz, [sfz, text('P/note.flac', 'note'), text('P/release.flac', 'release'), text('P/other.flac', 'other')], decode);
    expect(read).toEqual(['note']);
  });

  it('refuses an instrument whose recordings aren\'t there', async () => {
    const sfz = text('x.sfz', '<region> sample=gone.wav key=60');
    await expect(importSfz(sfz, [sfz])).rejects.toThrow('Pick the instrument’s whole folder');
  });

  it('refuses a file with no regions', async () => {
    const sfz = text('empty.sfz', '// nothing');
    await expect(importSfz(sfz, [sfz])).rejects.toThrow('has no regions');
  });
});
