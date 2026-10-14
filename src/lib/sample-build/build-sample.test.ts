import { describe, it, expect } from 'vitest';
import { addClip, addZone, emptyProject, setKeys, updateTake, type NewTake, type SampleProject } from './model';
import { buildProject } from './build';
import type { ClipAudio } from './render';
import { decodeNsmp, readNsmp, readNsmpZones, NSMP_SAMPLE_RATE } from '../ns4/nsmp';

const sine = (hz: number, seconds: number, rate = 44100, amp = 0.3) =>
  Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));

function project(target: 'nsmp4' | 'nsmp3' = 'nsmp4'): { p: SampleProject; audio: Map<string, ClipAudio>; zoneId: string } {
  const audio = new Map<string, ClipAudio>();
  let p = emptyProject('Two Notes', target);
  const zoneIds: string[] = [];
  for (const [root, hz] of [[57, 220], [69, 440]] as const) {
    const ch = sine(hz, 1);
    const c = addClip(p, { label: `${hz}`, source: { kind: 'file', fileName: `${hz}.wav` }, audioRef: `${hz}`, sampleRate: 44100, channels: 1, frames: ch.length });
    audio.set(c.clipId, { sampleRate: 44100, channels: [ch] });
    const take: NewTake = { clipId: c.clipId, start: 0, end: ch.length, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };
    const z = addZone(c.project, root, take);
    p = z.project; zoneIds.push(z.zoneId);
  }
  p = setKeys(p, zoneIds[0], 0, 63);
  p = setKeys(p, zoneIds[1], 64, 100);
  return { p, audio, zoneId: zoneIds[1] };
}

describe('buildProject: samples', () => {
  it.each(['nsmp4', 'nsmp3'] as const)('writes a %s that reads back with its zones', (target) => {
    const { p, audio } = project(target);
    const r = buildProject(p, (id) => audio.get(id));
    expect(r.extension).toBe(`.${target}`);
    expect(readNsmp(r.bytes).checksumValid).toBe(true);
    expect(readNsmpZones(r.bytes).map((z) => [z.rootKey, z.keyLow, z.keyHigh])).toEqual([[57, 0, 63], [69, 64, 93]]);
    const strokes = decodeNsmp(r.bytes);
    expect(strokes).toHaveLength(2);
    expect(strokes[0].sampleRate).toBe(NSMP_SAMPLE_RATE);
    expect(strokes[0].channels[0].length).toBeCloseTo(NSMP_SAMPLE_RATE, -2); // 1 s at 35,002 Hz
    expect(r.warnings.join()).toMatch(/E7 stay silent|stay silent/);
  });

  it('carries a loop and its decay', () => {
    const { p, audio, zoneId } = project();
    const take = p.zones[1].takes[0];
    const looped = updateTake(p, zoneId, take.id, { loop: { start: 22050 }, loopDecaySeconds: 4 });
    const s = decodeNsmp(buildProject(looped, (id) => audio.get(id)).bytes)[1];
    expect(s.loop?.loops).toBe(true);
    expect(s.loop?.loopStart).toBeCloseTo(NSMP_SAMPLE_RATE / 2, -1);
    expect(s.loop?.decayDbPerSecond).toBeCloseTo(10, 0);
  });

  it('tunes by the stroke\'s pitch base, not by resampling', () => {
    const { p, audio, zoneId } = project();
    const tuned = updateTake(p, zoneId, p.zones[1].takes[0].id, { tuneCents: 100 });
    const s = decodeNsmp(buildProject(tuned, (id) => audio.get(id)).bytes)[1];
    expect(s.sampleRate).toBe(Math.round(NSMP_SAMPLE_RATE * 2 ** (100 / 1200)));
    const plain = decodeNsmp(buildProject(p, (id) => audio.get(id)).bytes)[1];
    expect(s.channels[0].length).toBe(plain.channels[0].length);
  });

  it('refuses a tune the file cannot hold', () => {
    const { p, audio, zoneId } = project();
    const far = updateTake(p, zoneId, p.zones[1].takes[0].id, { tuneCents: 2400 });
    expect(() => buildProject(far, (id) => audio.get(id))).toThrow(/tuned too far/);
  });

  it('refuses a tune past the u16 pitch field, and still builds +1000 cents', () => {
    const { p, audio, zoneId } = project();
    const id = p.zones[1].takes[0].id;
    expect(() => buildProject(updateTake(p, zoneId, id, { tuneCents: 1100 }), (c) => audio.get(c))).toThrow(/tuned too far/);
    const ok = buildProject(updateTake(p, zoneId, id, { tuneCents: 1000 }), (c) => audio.get(c));
    expect(decodeNsmp(ok.bytes)[1].sampleRate).toBe(Math.round(NSMP_SAMPLE_RATE * 2 ** (1000 / 1200)));
  });

  it('holds a loop when no decay is set', () => {
    const { p, audio, zoneId } = project();
    const looped = updateTake(p, zoneId, p.zones[1].takes[0].id, { loop: { start: 22050 }, loopDecaySeconds: null });
    const s = decodeNsmp(buildProject(looped, (id) => audio.get(id)).bytes)[1];
    expect(s.loop?.loops).toBe(true);
    expect(s.loop?.decayDbPerSecond).toBe(0);
  });

  it('writes a stereo clip with both channels and its loop', () => {
    const left = sine(330, 1), right = sine(331, 1);
    let q = emptyProject('Stereo', 'nsmp4');
    const c = addClip(q, { label: 's', source: { kind: 'file', fileName: 's.wav' }, audioRef: 's', sampleRate: 44100, channels: 2, frames: left.length });
    const z = addZone(c.project, 60, { clipId: c.clipId, start: 0, end: left.length, loop: { start: 22050 }, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
    q = z.project;
    const s = decodeNsmp(buildProject(q, () => ({ sampleRate: 44100, channels: [left, right] })).bytes)[0];
    expect(s.channelCount).toBe(2);
    expect(s.channels).toHaveLength(2);
    expect(s.channels[0].length).toBe(s.channels[1].length);
    expect(s.loop?.loops).toBe(true);
  });

  it('refuses a project with errors, saying why', () => {
    const { p, audio, zoneId } = project();
    const bad = updateTake(p, zoneId, p.zones[1].takes[0].id, { loop: { start: 0 } });
    expect(() => buildProject(bad, (id) => audio.get(id))).toThrow(/loop/i);
  });

  it('says which audio is missing', () => {
    const { p } = project();
    expect(() => buildProject(p, () => undefined)).toThrow(/audio/i);
  });

  it('builds hot audio: sinc overshoot after resampling is clamped, not written out of range', () => {
    const n = 44100;
    const saw = Float32Array.from({ length: n }, (_, i) => ((i % 200) / 200) * 2 - 1);
    const square = Float32Array.from({ length: n }, (_, i) => (Math.floor(i / 50) % 2 ? -1 : 1));
    for (const [name, ch, gainDb] of [['saw', saw, 6], ['square', square, 0]] as const) {
      let q = emptyProject(name, 'nsmp4');
      const c = addClip(q, { label: name, source: { kind: 'file', fileName: `${name}.wav` }, audioRef: name, sampleRate: 44100, channels: 1, frames: n });
      q = addZone(c.project, 60, { clipId: c.clipId, start: 0, end: n, loop: null, loopDecaySeconds: null, gainDb, tuneCents: 0 }).project;
      const r = buildProject(q, () => ({ sampleRate: 44100, channels: [ch] }));
      const s = decodeNsmp(r.bytes)[0];
      let peak = 0;
      for (const v of s.channels[0]) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeGreaterThan(30000);
      expect(peak).toBeLessThanOrEqual(32767);
    }
  });

  it('refuses audio that does not match its clip, naming the zone', () => {
    const { p, audio } = project();
    const short = new Map(audio);
    const first = p.zones[0].takes[0].clipId;
    short.set(first, { sampleRate: 44100, channels: [new Float32Array(1000)] });
    expect(() => buildProject(p, (id) => short.get(id))).toThrow(/audio for zone A3 doesn.t match its clip/);
    const stereo = new Map(audio);
    const second = p.zones[1].takes[0].clipId;
    stereo.set(second, { sampleRate: 44100, channels: [new Float32Array(44100), new Float32Array(44100)] });
    expect(() => buildProject(p, (id) => stereo.get(id))).toThrow(/audio for zone A4 doesn.t match its clip/);
  });
});

describe('buildProject: review fixes', () => {
  it('keeps a loop that starts on the take\'s last frame', () => {
    const { p, audio, zoneId } = project();
    const take = p.zones[1].takes[0];
    const looped = updateTake(p, zoneId, take.id, { loop: { start: take.end - 1 } });
    const s = decodeNsmp(buildProject(looped, (id) => audio.get(id)).bytes)[1];
    expect(s.loop?.loops).toBe(true);
    expect(s.loop!.loopStart).toBeLessThan(s.channels[0].length);
  });

  it('refuses audio at a different rate than its clip', () => {
    const { p, audio } = project();
    const id = p.zones[1].takes[0].clipId;
    const wrongRate = (cid: string) => (cid === id ? { ...audio.get(cid)!, sampleRate: 48000 } : audio.get(cid));
    expect(() => buildProject(p, wrongRate)).toThrow(/doesn.t match its clip/);
  });
});
