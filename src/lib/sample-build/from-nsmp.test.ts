import { describe, expect, it } from 'vitest';
import { addClip, addZone, emptyProject, projectProblems, setKeys, type NewTake, type SampleProject } from './model';
import { buildProject } from './build';
import { nsmpToProject } from './from-nsmp';
import type { ClipAudio } from './render';
import { NSMP_SAMPLE_RATE, parseNsmpSections } from '../ns4/nsmp';

const sine = (hz: number, seconds: number, rate = 44100) =>
  Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / rate));

/** A two-zone build, the upper zone looped with a decay and tuned. */
function source(target: 'nsmp4' | 'nsmp3'): { p: SampleProject; audio: Map<string, ClipAudio> } {
  const audio = new Map<string, ClipAudio>();
  let p = { ...emptyProject('Two Notes', target), category: 9 };
  const ids: string[] = [];
  for (const [root, hz] of [[57, 220], [69, 440]] as const) {
    const ch = sine(hz, 1);
    const c = addClip(p, { label: `${hz}`, source: { kind: 'file', fileName: `${hz}.wav` }, audioRef: `${hz}`, sampleRate: 44100, channels: 1, frames: ch.length });
    audio.set(c.clipId, { sampleRate: 44100, channels: [ch] });
    const take: NewTake = root === 69
      ? { clipId: c.clipId, start: 0, end: ch.length, loop: { start: 22050 }, loopDecaySeconds: 4, gainDb: 0, tuneCents: 20 }
      : { clipId: c.clipId, start: 0, end: ch.length, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };
    const z = addZone(c.project, root, take);
    p = z.project; ids.push(z.zoneId);
  }
  return { p: setKeys(setKeys(p, ids[0], 40, 63), ids[1], 64, 90), audio };
}

describe('nsmpToProject', () => {
  it.each(['nsmp4', 'nsmp3'] as const)('opens a %s as a build with its zones, loop, decay, tuning and category', (target) => {
    const { p, audio } = source(target);
    const bytes = buildProject(p, (id) => audio.get(id)).bytes;
    let n = 0;
    const r = nsmpToProject(bytes, 'Two Notes', () => `ref-${++n}`);
    expect(projectProblems(r.project)).toEqual([]);
    expect(r.project).toMatchObject({ name: 'Two Notes', target, category: 9 });
    expect(r.project.zones.map((z) => [z.rootKey, z.keyLow, z.keyHigh])).toEqual([[57, 40, 63], [69, 64, 90]]);
    const [low, high] = r.project.zones.map((z) => z.takes[0]);
    expect(low.loop).toBeNull();
    expect(high.loop).not.toBeNull();
    // The loop starts where it did, at the Nord's rate (half a second in).
    expect(high.loop!.start / NSMP_SAMPLE_RATE).toBeCloseTo(0.5, 2);
    expect(high.loopDecaySeconds).toBeCloseTo(4, 0);
    expect(high.tuneCents).toBe(20);
    // Clips are at the Nord's own rate, so building again doesn't resample.
    expect(r.project.clips.every((c) => c.sampleRate === NSMP_SAMPLE_RATE)).toBe(true);
    expect(r.audio.size).toBe(2);
    expect(r.audio.get('ref-1')!.channels[0].length).toBe(r.project.clips[0].frames);
  });

  it('builds again into a sample with the same map', () => {
    const { p, audio } = source('nsmp4');
    const once = nsmpToProject(buildProject(p, (id) => audio.get(id)).bytes, 'Two Notes');
    const read = (clipId: string) => once.audio.get(once.project.clips.find((c) => c.id === clipId)!.audioRef);
    const again = nsmpToProject(buildProject(once.project, read).bytes, 'Two Notes');
    expect(again.project.zones.map((z) => [z.rootKey, z.keyLow, z.keyHigh, !!z.takes[0].loop])).toEqual([[57, 40, 63, false], [69, 64, 90, true]]);
  });

  it('refuses what isn’t a sample, saying so', () => {
    expect(() => nsmpToProject(new Uint8Array(64), 'x')).toThrow(/isn’t a sample/);
  });

  it('refuses one of Nord’s own samples, by the mark in its header', () => {
    const { p, audio } = source('nsmp4');
    const bytes = buildProject(p, (id) => audio.get(id)).bytes.slice();
    const hdr = parseNsmpSections(bytes).find((x) => x.tag.endsWith('hdr'))!;
    bytes[hdr.payloadOffset + 8] = 0x0a; bytes[hdr.payloadOffset + 9] = 0x01; // the factory mark
    expect(() => nsmpToProject(bytes, 'x')).toThrow(/one of Nord’s own samples/);
  });
});
