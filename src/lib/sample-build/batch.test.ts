import { describe, expect, it } from 'vitest';
import { addClip, addZone, emptyProject, projectProblems, type SampleProject } from './model';
import { findLoopsAll, normalizeAll, normalizeGain, takePeakDb, trimSilence, trimSilenceAll } from './batch';
import { crossfadeFrames, renderTake, type ClipAudio } from './render';

const SR = 44100;
/** 0.2 s of silence, then a steady 220 Hz tone at `amp` for `seconds`, then 0.3 s of silence. */
const tone = (amp: number, seconds = 1.5): ClipAudio => {
  const pad = Math.round(0.2 * SR), body = Math.round(seconds * SR);
  const ch = new Float32Array(pad + body + Math.round(0.3 * SR));
  for (let i = 0; i < body; i++) ch[pad + i] = amp * Math.min(1, i / 441) * Math.sin((2 * Math.PI * 220 * i) / SR);
  return { sampleRate: SR, channels: [ch] };
};

function project(audios: ClipAudio[]): { p: SampleProject; audio: Map<string, ClipAudio> } {
  let p = emptyProject('x');
  const audio = new Map<string, ClipAudio>();
  audios.forEach((a, k) => {
    const frames = a.channels[0].length;
    const c = addClip(p, { label: `n${k}`, source: { kind: 'file', fileName: `n${k}.wav` }, audioRef: `r${k}`, sampleRate: SR, channels: 1, frames });
    p = addZone(c.project, 48 + 12 * k, { clipId: c.clipId, start: 0, end: frames, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
    audio.set(c.clipId, a);
  });
  return { p, audio };
}

describe('normalize', () => {
  it('brings each take’s loudest moment to the peak asked', () => {
    const quiet = tone(0.1), loud = tone(0.5);
    expect(takePeakDb({ start: 0, end: quiet.channels[0].length }, quiet)).toBeCloseTo(-20, 1);
    const { p, audio } = project([quiet, loud]);
    const r = normalizeAll(p, (id) => audio.get(id), -1);
    expect(r.report).toMatchObject({ changed: 2, missing: 0 });
    const gains = r.project.zones.map((z) => z.takes[0].gainDb);
    expect(gains[0]).toBeCloseTo(19, 1);
    expect(gains[1]).toBeCloseTo(5.02, 1);
    // Done twice, nothing more changes.
    expect(normalizeAll(r.project, (id) => audio.get(id), -1).report.changed).toBe(0);
  });

  it('leaves silence alone', () => {
    const silent: ClipAudio = { sampleRate: SR, channels: [new Float32Array(100)] };
    expect(normalizeGain({ start: 0, end: 100 }, silent, -1)).toBeNull();
  });
});

describe('trim silence', () => {
  it('trims both ends to the sound, keeping a little before and after', () => {
    const a = tone(0.5);
    const { p } = project([a]);
    const take = p.zones[0].takes[0];
    const t = trimSilence(take, a, { thresholdDb: -60, preRollMs: 5, tailMs: 20 })!;
    expect(t.start).toBeGreaterThan(0.19 * SR);
    expect(t.start).toBeLessThanOrEqual(0.2 * SR);
    expect(t.end).toBeLessThan(1.75 * SR);
  });

  it('keeps a loop: Start stays before it and End stays where the loop ends', () => {
    const a = tone(0.5);
    const { p } = project([a]);
    const take = { ...p.zones[0].takes[0], start: 0, loop: { start: 4000 } };
    const t = trimSilence(take, a, { thresholdDb: -60 })!;
    expect(t.start).toBeLessThan(4000);
    expect(t.end).toBe(take.end);
  });

  it('across a build, it counts what it changed', () => {
    const { p, audio } = project([tone(0.5), tone(0.3)]);
    const r = trimSilenceAll(p, (id) => audio.get(id), { thresholdDb: -60 });
    expect(r.report.changed).toBe(2);
    expect(projectProblems(r.project)).toEqual([]);
  });
});

describe('find loops across a build', () => {
  it('loops every take it can, ends each take on its loop, and reports the weakest match', () => {
    const { p, audio } = project([tone(0.5), tone(0.3, 2)]);
    const r = findLoopsAll(p, (id) => audio.get(id));
    expect(r.report.changed).toBe(2);
    for (const z of r.project.zones) {
      const t = z.takes[0];
      expect(t.loop).not.toBeNull();
      expect(t.loop!.start).toBeLessThan(t.end);
    }
    expect(projectProblems(r.project)).toEqual([]);
  });

  it('counts takes whose audio is missing', () => {
    const { p } = project([tone(0.5)]);
    expect(findLoopsAll(p, () => undefined).report).toMatchObject({ changed: 0, missing: 1 });
  });
});

describe('loop crossfade', () => {
  const audio: ClipAudio = { sampleRate: 1000, channels: [Float32Array.from({ length: 1000 }, (_, i) => i / 1000)] };
  const take = { id: 't', clipId: 'c', start: 0, end: 800, loop: { start: 400 }, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 };

  it('fades the end into the sound before the loop start, so the join runs on', () => {
    const r = renderTake({ ...take, loopCrossfadeMs: 100 }, audio);
    // A linear fade: halfway through, half of each side (no equal-power swell).
    expect(r.channels[0][749]).toBe(Math.round(((749 / 1000) * 0.5 + (349 / 1000) * 0.5) * 32767));
    expect(crossfadeFrames({ ...take, loopCrossfadeMs: 100 }, 1000)).toBe(100);
    // The last frame before the jump is the one just before the loop start.
    expect(r.channels[0][799]).toBe(Math.round((399 / 1000) * 32767));
    // Before the fade, untouched.
    expect(r.channels[0][699]).toBe(Math.round((699 / 1000) * 32767));
  });

  it('fits the fade inside the loop and the take before it', () => {
    expect(crossfadeFrames({ ...take, loopCrossfadeMs: 5000 }, 1000)).toBe(400);
    expect(crossfadeFrames({ ...take, start: 350, loopCrossfadeMs: 5000 }, 1000)).toBe(50);
    expect(crossfadeFrames({ ...take, loop: null, loopCrossfadeMs: 50 }, 1000)).toBe(0);
  });

  it('none, the take plays as recorded', () => {
    const r = renderTake(take, audio);
    expect(r.channels[0][799]).toBe(Math.round((799 / 1000) * 32767));
  });
});

describe('review fixes', () => {
  it('a piano’s Normalize keeps its soft layer softer: one level per zone, from the loudest layer', async () => {
    const { addLayer, setTarget } = await import('./model');
    const soft = tone(0.1), hard = tone(0.5);
    let { p, audio } = project([hard]);
    const c = addClip(p, { label: 'soft', source: { kind: 'file', fileName: 'soft.wav' }, audioRef: 'rs', sampleRate: SR, channels: 1, frames: soft.channels[0].length });
    audio = new Map(audio).set(c.clipId, soft);
    const z = c.project.zones[0];
    const { addTake } = await import('./model');
    const t = addTake(c.project, z.id, { clipId: c.clipId, start: 0, end: soft.channels[0].length, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
    p = addLayer(setTarget(t.project, 'npno'), z.id, t.takeId, 12);
    const r = normalizeAll(p, (id) => audio.get(id), -1);
    const gains = r.project.zones[0].takes.map((x) => x.gainDb);
    expect(gains[0]).toBeCloseTo(gains[1], 5); // the same level for both
    expect(gains[0]).toBeCloseTo(-1 - 20 * Math.log10(0.5), 1);
  });

  it('finding a loop twice doesn’t keep shortening the take', () => {
    const { p, audio } = project([tone(0.5, 3)]);
    const once = findLoopsAll(p, (id) => audio.get(id)).project;
    const twice = findLoopsAll(once, (id) => audio.get(id)).project;
    expect(twice.zones[0].takes[0].end).toBe(once.zones[0].takes[0].end);
  });
});
