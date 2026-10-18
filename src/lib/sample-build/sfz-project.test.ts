import { describe, it, expect } from 'vitest';
import { parseSfz, sfzRegion } from './sfz';
import { describeSfzImport, sfzToProject, type SfzSample } from './sfz-project';
import { setTarget, takeOf } from './model';
import { buildProject } from './build';
import { readNsmp } from '../ns4/nsmp';
import { readNsp } from '../ns4/nsp';
import { checkNpnoAcceptance } from '../ns4/nsp-check';
import { layerFloors } from '../ns4/nsmp-to-npno';
import type { ClipAudio } from './render';

const sample = (fileName: string, frames = 1000, wav: Pick<SfzSample, 'unityNote' | 'loop'> = {}): SfzSample =>
  ({ fileName, audioRef: `ref-${fileName}`, sampleRate: 44100, channels: 1, frames, ...wav });

function lay(text: string, files: Record<string, SfzSample | undefined>) {
  const regions = parseSfz(text).regions.map(sfzRegion);
  return sfzToProject('Test', regions, new Map(Object.entries(files)));
}

describe('sfzToProject', () => {
  it('makes a zone per key range, rooted where the SFZ says, with one clip per recording', () => {
    const { project, report } = lay(`
      <region> sample=c4.wav lokey=58 hikey=61 pitch_keycenter=60
      <region> sample=e4.wav lokey=62 hikey=65 pitch_keycenter=64`, { 'c4.wav': sample('c4.wav'), 'e4.wav': sample('e4.wav') });
    expect(project.zones.map((z) => [z.keyLow, z.keyHigh, z.rootKey])).toEqual([[58, 61, 60], [62, 65, 64]]);
    expect(project.clips.map((c) => [c.label, c.audioRef])).toEqual([['c4.wav', 'ref-c4.wav'], ['e4.wav', 'ref-e4.wav']]);
    expect(report).toMatchObject({ zones: 2, layered: 0, alternates: 0, missing: [], audioBytes: 4000 });
  });

  it('keeps velocity bands as layers, loudest first, on the converter\'s touch law', () => {
    const { project, report } = lay(`
      <group> lovel=1 hivel=63 <region> sample=soft.wav key=60
      <group> lovel=64 hivel=127 <region> sample=loud.wav key=60`, { 'soft.wav': sample('soft.wav'), 'loud.wav': sample('loud.wav') });
    const [z] = project.zones;
    expect(z.layers.map((l) => project.clips.find((c) => c.id === takeOf(z, l)!.clipId)!.label)).toEqual(['loud.wav', 'soft.wav']);
    expect(z.layers.map((l) => l.floorDb)).toEqual(layerFloors([127, 63]));
    expect(report.layered).toBe(1);
  });

  it('keeps round-robin alternates as extra takes, not layers', () => {
    const { project, report } = lay(`
      <region> sample=a2.wav key=60 seq_position=2
      <region> sample=a1.wav key=60 seq_position=1`, { 'a1.wav': sample('a1.wav'), 'a2.wav': sample('a2.wav') });
    const [z] = project.zones;
    expect(z.takes).toHaveLength(2);
    expect(z.layers).toHaveLength(1);
    expect(project.clips.find((c) => c.id === takeOf(z, z.layers[0])!.clipId)!.label).toBe('a1.wav');
    expect(report.alternates).toBe(1);
  });

  it('tunes a recording rooted outside its keys onto a key it plays', () => {
    const { project } = lay('<region> sample=c4.wav lokey=62 hikey=64 pitch_keycenter=60 tune=5', { 'c4.wav': sample('c4.wav') });
    const [z] = project.zones;
    expect(z.rootKey).toBe(62);
    expect(z.takes[0].tuneCents).toBe(205);
  });

  it('ends a looped take at its loop, from the SFZ or the WAV, and says what was cut', () => {
    const { project, report } = lay(`
      <region> sample=a.wav key=60 loop_mode=loop_continuous loop_start=100 loop_end=599
      <region> sample=b.wav key=62`, { 'a.wav': sample('a.wav'), 'b.wav': sample('b.wav', 1000, { loop: { start: 200, end: 999 } }) });
    const [a, b] = project.zones.map((z) => z.takes[0]);
    expect([a.start, a.end, a.loop]).toEqual([0, 600, { start: 100 }]);
    expect([b.end, b.loop]).toEqual([1000, { start: 200 }]);
    expect(report.tailsCut).toBe(1);
  });

  it('drops a loop that doesn\'t fit, and plays the take once', () => {
    const { project, report } = lay('<region> sample=a.wav key=60 offset=500 loop_mode=loop_continuous loop_start=100 loop_end=900', { 'a.wav': sample('a.wav') });
    expect(project.zones[0].takes[0]).toMatchObject({ start: 500, end: 1000, loop: null });
    expect(report.loopsDropped).toBe(1);
  });

  it('leaves out release samples, other key switches and missing recordings, and says so', () => {
    const { project, report } = lay(`
      <global> sw_default=c1
      <region> sample=a.wav key=60 sw_last=c1
      <region> sample=b.wav key=62 sw_last=d1
      <region> sample=rel.wav key=60 trigger=release
      <region> sample=gone.wav key=64`, { 'a.wav': sample('a.wav'), 'b.wav': sample('b.wav'), 'rel.wav': sample('rel.wav') });
    expect(project.zones.map((z) => z.rootKey)).toEqual([60]);
    expect(report.skipped).toMatchObject({ release: 1, keyswitch: 1 });
    expect(report.missing).toEqual(['gone.wav']);
  });

  it('loops only when the SFZ asks for a loop mode or the WAV has one, as players do', () => {
    const { project, report } = lay('<region> sample=a.wav key=60 loop_start=100 loop_end=599', { 'a.wav': sample('a.wav') });
    expect(project.zones[0].takes[0]).toMatchObject({ end: 1000, loop: null });
    expect(report.tailsCut).toBe(0);
  });

  it('gives each key its own loudest when keys split their velocities differently', () => {
    const files = Object.fromEntries(['lo_p', 'lo_mp', 'lo_mf', 'lo_f', 'hi_p', 'hi_f'].map((f) => [`${f}.wav`, sample(`${f}.wav`)]));
    const { project, report } = lay(`
      <group> lokey=48 hikey=59 pitch_keycenter=54
      <region> sample=lo_p.wav lovel=1 hivel=31 <region> sample=lo_mp.wav lovel=32 hivel=63
      <region> sample=lo_mf.wav lovel=64 hivel=95 <region> sample=lo_f.wav lovel=96 hivel=127
      <group> lokey=60 hikey=72 pitch_keycenter=66
      <region> sample=hi_p.wav lovel=1 hivel=63 <region> sample=hi_f.wav lovel=64 hivel=127`, files);
    const label = (z: typeof project.zones[number], k: number) => project.clips.find((c) => c.id === takeOf(z, z.layers[k])!.clipId)!.label;
    expect(project.zones.map((z) => [z.keyLow, z.keyHigh, z.layers.length])).toEqual([[48, 59, 4], [60, 72, 2]]);
    expect(project.zones.map((z) => label(z, 0))).toEqual(['lo_f.wav', 'hi_f.wav']); // a full-velocity recording is never a soft layer
    expect(project.zones[0].layers.map((l) => l.floorDb)).toEqual(layerFloors([127, 95, 63, 31]));
    expect(report.skipped.unplaced).toBe(0);
  });

  it('leaves out regions off the keyboard instead of putting them on its edge', () => {
    const { project, report } = lay(`
      <region> sample=a.wav key=60
      <region> sample=pedal.wav lokey=-1 hikey=-1
      <control> octave_offset=12 <region> sample=b.wav key=60`, { 'a.wav': sample('a.wav'), 'pedal.wav': sample('pedal.wav'), 'b.wav': sample('b.wav') });
    expect(project.zones.map((z) => [z.keyLow, z.keyHigh])).toEqual([[60, 60]]);
    expect(report.skipped.offKeyboard).toBe(2);
  });

  it('gives each key to the first of two regions that overlap, and counts the one left over', () => {
    const { project, report } = lay(`
      <region> sample=a.wav lokey=60 hikey=64 pitch_keycenter=62
      <region> sample=b.wav lokey=63 hikey=67 pitch_keycenter=66
      <region> sample=c.wav lokey=61 hikey=63 pitch_keycenter=62`, { 'a.wav': sample('a.wav'), 'b.wav': sample('b.wav'), 'c.wav': sample('c.wav') });
    expect(project.zones.map((z) => [z.keyLow, z.keyHigh])).toEqual([[60, 64], [65, 67]]);
    expect(report.skipped.unplaced).toBe(1);
  });
});

describe('an imported instrument, saved for a Nord', () => {
  const tone = (hz: number) => Float32Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100));
  const audio = new Map<string, ClipAudio>();
  const rec = (fileName: string, hz: number): SfzSample => {
    audio.set(`ref-${fileName}`, { sampleRate: 44100, channels: [tone(hz)] });
    return sample(fileName, 22050);
  };

  it('builds a sample, and a piano that keeps its velocity layers', () => {
    const { project } = lay(`
      <group> lovel=1 hivel=63 <region> sample=soft_c4.wav lokey=48 hikey=62 pitch_keycenter=60 <region> sample=soft_e4.wav lokey=63 hikey=72 pitch_keycenter=64
      <group> lovel=64 <region> sample=hard_c4.wav lokey=48 hikey=62 pitch_keycenter=60 <region> sample=hard_e4.wav lokey=63 hikey=72 pitch_keycenter=64`,
    { 'soft_c4.wav': rec('soft_c4.wav', 261.63), 'soft_e4.wav': rec('soft_e4.wav', 329.63), 'hard_c4.wav': rec('hard_c4.wav', 261.63), 'hard_e4.wav': rec('hard_e4.wav', 329.63) });
    const read = (clipId: string) => audio.get(project.clips.find((c) => c.id === clipId)!.audioRef);

    const sampleFile = buildProject(project, read);
    expect(sampleFile.extension).toBe('.nsmp4');
    expect(readNsmp(sampleFile.bytes)).toMatchObject({ recognized: true, strokeCount: 2 });
    expect(sampleFile.warnings.join(' ')).toContain('only the loudest layer');

    const piano = buildProject(setTarget(project, 'npno'), read);
    expect(piano.extension).toBe('.npno');
    expect(checkNpnoAcceptance(piano.bytes, { deep: true }).ok).toBe(true);
    expect(readNsp(piano.bytes).sampleCount).toBeGreaterThanOrEqual(4); // both layers of both zones
  });
});

describe('describeSfzImport', () => {
  it('says what came over and what didn\'t, in a player\'s words', () => {
    const { report } = lay(`
      <group> hivel=63 <region> sample=soft.wav key=60 ampeg_release=1
      <group> lovel=64 <region> sample=loud.wav key=60 <region> sample=rel.wav key=60 trigger=release`,
    { 'soft.wav': sample('soft.wav'), 'loud.wav': sample('loud.wav'), 'rel.wav': sample('rel.wav') });
    const notes = describeSfzImport(report, ['extra.sfzh']).join('\n');
    expect(notes).toContain('Imported 1 zone');
    expect(notes).toContain('velocity layers');
    expect(notes).toContain('1 release sample');
    expect(notes).toContain('volume envelope');
    expect(notes).toContain('“extra.sfzh”');
  });
});
