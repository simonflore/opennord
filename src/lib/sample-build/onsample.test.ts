import { describe, it, expect } from 'vitest';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { encodeWav } from '../ns4/wav';
import { addClip, emptyProject } from './model';
import { importAudioFiles } from './import-files';
import { readOnsample, writeOnsample } from './onsample';

const wav = (hz: number) => encodeWav([Float32Array.from({ length: 11025 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100))], 44100);

function built() {
  const r = importAudioFiles(emptyProject('Rhodes'), [{ fileName: 'C3.wav', bytes: wav(130.81) }, { fileName: 'C4.wav', bytes: wav(261.63) }]);
  const read = (clipId: string) => r.audio.get(r.project.clips.find((c) => c.id === clipId)!.audioRef);
  return { project: r.project, read };
}

describe('.onsample', () => {
  it('round-trips the project and its audio', () => {
    const { project, read } = built();
    const back = readOnsample(writeOnsample(project, read));
    // JSON turns a pitch estimate of -0 cents into 0, which toEqual tells apart; compare as saved.
    expect(back.project.zones).toEqual(JSON.parse(JSON.stringify(project.zones)));
    expect(back.project.name).toBe('Rhodes');
    expect(back.project.id).not.toBe(project.id);
    for (const c of back.project.clips) {
      const a = back.audio.get(c.audioRef)!;
      expect(a.channels[0].length).toBe(c.frames);
      expect(a.sampleRate).toBe(44100);
    }
  });

  it('leaves out a clip no take uses when its audio is missing, but not a used one', () => {
    const { project, read } = built();
    const spare = addClip(project, { label: 'spare.wav', source: { kind: 'file', fileName: 'spare.wav' }, audioRef: 'gone', sampleRate: 44100, channels: 1, frames: 10 });
    const back = readOnsample(writeOnsample(spare.project, (id) => (id === spare.clipId ? undefined : read(id))));
    expect(back.project.clips.map((c) => c.label)).toEqual(['C3.wav', 'C4.wav']);
    expect(() => writeOnsample(project, () => undefined)).toThrow(/C3.wav/);
  });

  it.each([
    ['not a zip', new TextEncoder().encode('hello'), /isn’t an OpenNord project/],
    ['no project.json', zipSync({ 'x.txt': strToU8('x') }), /isn’t an OpenNord project/],
    ['a newer version', zipSync({ 'project.json': strToU8(JSON.stringify({ version: 2 })) }), /newer OpenNord/],
    ['project.json that is not JSON', zipSync({ 'project.json': strToU8('{nope') }), /damaged/],
    ['project.json with no clips', zipSync({ 'project.json': strToU8(JSON.stringify({ version: 1 })) }), /damaged/],
    ['project.json that is null', zipSync({ 'project.json': strToU8('null') }), /damaged/],
    ['a null clip entry', zipSync({ 'project.json': strToU8(JSON.stringify({ version: 1, clips: [null], zones: [] })) }), /damaged/],
    ['an empty zone entry', zipSync({ 'project.json': strToU8(JSON.stringify({ version: 1, clips: [], zones: [{}] })) }), /damaged/],
    ['a zone whose takes are not a list', zipSync({ 'project.json': strToU8(JSON.stringify({ version: 1, clips: [], zones: [{ layers: [], takes: 5 }] })) }), /damaged/],
    ['project.json that is a number', zipSync({ 'project.json': strToU8('7') }), /damaged/],
  ])('refuses %s in plain words', (_, bytes, msg) => {
    expect(() => readOnsample(bytes)).toThrow(msg);
  });

  it('refuses a project whose clip audio is missing', () => {
    const { project, read } = built();
    const files = zipSync({ 'project.json': strToU8(JSON.stringify(project)) });
    expect(() => readOnsample(files)).toThrow(/audio for “C3.wav” is missing/);
    expect(() => readOnsample(writeOnsample(project, read))).not.toThrow();
  });

  it('refuses clip audio that does not match the clip record', () => {
    const { project, read } = built();
    const tweak = (patch: object) => {
      const p = { ...project, clips: project.clips.map((c, i) => (i === 0 ? { ...c, ...patch } : c)) };
      return zipSync({ ...unzipSync(writeOnsample(project, read)), 'project.json': strToU8(JSON.stringify(p)) });
    };
    for (const patch of [{ frames: 5 }, { sampleRate: 48000 }, { channels: 2 }]) {
      expect(() => readOnsample(tweak(patch))).toThrow(/audio for “C3.wav” doesn’t match/);
    }
  });

  it('refuses a truncated clip WAV as damaged', () => {
    const { project, read } = built();
    const files = unzipSync(writeOnsample(project, read));
    const key = Object.keys(files).find((k) => k.startsWith('clips/'))!;
    files[key] = files[key].slice(0, 20);
    expect(() => readOnsample(zipSync(files))).toThrow(/audio for “.*” in this project file is damaged/);
  });

  it('refuses to write when a clip’s audio is missing', () => {
    const { project } = built();
    expect(() => writeOnsample(project, () => undefined)).toThrow(/audio for “C3.wav” couldn’t be read, so the project file wasn’t written/);
  });
});
