import { describe, it, expect } from 'vitest';
import { addClip, addLayer, addTake, addZone, emptyProject, setKeys, setTarget, updateTake, type NewTake, type SampleProject } from './model';
import { planPianoZones } from '../ns4/nsmp-to-npno';
import { autoMap } from './analysis/automap';
import { TARGETS } from './targets';
import { noteName } from '../ns4/sample-view';

const take = (clipId: string, over: Partial<NewTake> = {}): NewTake => ({ clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0, ...over });

function project(target: 'nsmp4' | 'npno' = 'nsmp4'): { p: SampleProject; zoneId: string; clipId: string } {
  let p = emptyProject('Test', target);
  const c = addClip(p, { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 44100 });
  p = c.project;
  const z = addZone(p, 60, take(c.clipId));
  return { p: z.project, zoneId: z.zoneId, clipId: c.clipId };
}
const messages = (issues: { message: string }[]) => issues.map((i) => i.message).join(' | ');

describe('noteName', () => {
  it.each([[60, 'C4'], [61, 'C#4'], [21, 'A0'], [0, 'C-1'], [108, 'C8']])('%i is %s', (m, n) => expect(noteName(m)).toBe(n));
});

describe('sample targets', () => {
  it('a zone reaches 24 semitones above its root', () => {
    const { p, zoneId } = project();
    const wide = setKeys(p, zoneId, 40, 100);
    expect(TARGETS.nsmp4.reach(wide.zones[0])).toEqual({ lowest: 40, highest: 84 });
    expect(messages(TARGETS.nsmp4.check(wide))).toMatch(/C#6 to E7 stay silent/);
  });

  it('says only the loudest layer goes into a sample', () => {
    const { p, zoneId, clipId } = project();
    const t = addTake(p, zoneId, take(clipId));
    const layered = addLayer(t.project, zoneId, t.takeId, 12);
    const issues = TARGETS.nsmp4.check(layered);
    expect(issues.every((i) => i.level === 'warning')).toBe(true);
    expect(messages(issues)).toMatch(/only the loudest layer/);
  });

  it('a loop outside its take is an error', () => {
    const { p, zoneId } = project();
    const bad = updateTake(p, zoneId, p.zones[0].takes[0].id, { loop: { start: 0 } });
    expect(TARGETS.nsmp4.check(bad).some((i) => i.level === 'error' && /loop/i.test(i.message))).toBe(true);
  });

  it('an empty project cannot be written', () => {
    expect(TARGETS.nsmp4.check(emptyProject('x')).some((i) => i.level === 'error')).toBe(true);
  });

  it('the silent range starts at the zone\'s first key when the zone lies past its reach', () => {
    // The model forbids a root outside its keys, so build the zone by hand: root 60, keys 90 to 100.
    const { p } = project();
    const z = p.zones[0];
    const past = { ...p, zones: [{ ...z, keyLow: 90, keyHigh: 100 }] };
    expect(TARGETS.nsmp4.reach(past.zones[0])).toEqual({ lowest: 90, highest: 89 });
    expect(messages(TARGETS.nsmp4.check(past))).toMatch(/F#6 to E7 stay silent/);
  });
});

describe('the piano target', () => {
  it('plays its own recording up to where the converter starts copying; keys above are covered by copies', () => {
    const { p, zoneId } = project('npno');
    const z = setKeys(p, zoneId, 50, 70).zones[0];
    expect(TARGETS.npno.reach(z)).toEqual({ lowest: 50, highest: 62 }); // 63–70 are copies, in groups of 4
    expect(messages(TARGETS.npno.check(setKeys(p, zoneId, 50, 70)))).toMatch(/re-pitched copies/);
  });

  it('refuses zones with different numbers of layers, naming them', () => {
    const { p, zoneId, clipId } = project('npno');
    const t = addTake(p, zoneId, take(clipId));
    const layered = addLayer(t.project, zoneId, t.takeId, 12);
    const two = addZone(layered, 72, take(clipId)).project;
    const issues = TARGETS.npno.check(two);
    expect(issues.some((i) => i.level === 'error' && /same number of layers: C4 has 2, C5 has 1/.test(i.message))).toBe(true);
  });

  it('is labelled untested and limits the name', () => {
    expect(TARGETS.npno.hardware).toBe('untested');
    const { p } = project('npno');
    const long = { ...p, name: 'A piano name that is far too long' };
    expect(TARGETS.npno.check(long).some((i) => i.level === 'error' && /name/i.test(i.message))).toBe(true);
  });

  it('reach and the copies count agree: the keys past reach are the copied ones', () => {
    const { p, zoneId } = project('npno');
    const above = setKeys(p, zoneId, 59, 70);
    expect(TARGETS.npno.reach(above.zones[0])).toEqual({ lowest: 59, highest: 62 }); // 63–70: the 8 copied keys
    // The converter tiles from the bottom and copies only keys 4 or more above the recording: 63-70.
    expect(messages(TARGETS.npno.check(above))).toMatch(/Zone C4: 8 keys above/);
  });

  it('allows exactly 30 layers in a piano zone, and 31 is an error', () => {
    const withLayers = (n: number) => {
      let { p, zoneId, clipId } = project('npno');
      for (let k = 1; k < n; k++) { const t = addTake(p, zoneId, take(clipId)); p = addLayer(t.project, zoneId, t.takeId, k); }
      return p;
    };
    expect(TARGETS.npno.check(withLayers(30)).some((i) => i.level === 'error' && /layers/.test(i.message))).toBe(false);
    expect(TARGETS.npno.check(withLayers(31)).some((i) => i.level === 'error' && /30 layers/.test(i.message))).toBe(true);
  });

  it('switching to a piano keeps the sample untouched', () => {
    const { p } = project();
    expect(setTarget(p, 'npno').zones).toEqual(p.zones);
  });

  it('counts the copies the converter makes, per zone, on an auto-mapped project', () => {
    let { p, clipId } = project('npno');
    for (const root of [36, 44, 52, 68, 76, 84, 92, 100]) p = addZone(p, root, take(clipId)).project;
    p = autoMap(p);
    expect(p.zones).toHaveLength(9);
    const warnings = TARGETS.npno.check(p).filter((i) => /re-pitched copies/.test(i.message));
    const counted = warnings.reduce((n, i) => n + Number(/(\d+) keys/.exec(i.message)![1]), 0);
    // Independent count from the plan: entries that sit 4 or more keys above their recording.
    const plan = planPianoZones(p.zones.map((z, i) => ({ keyHigh: z.keyHigh, rootKey: z.rootKey, velTop: 127, globalID: i + 1, floorDb: 0 })));
    const expected = plan.filter((e) => e.highNote - e.layers[0].sourceRoot >= 4).reduce((n, e) => n + e.highNote - e.lowNote + 1, 0);
    expect(counted).toBe(expected);
    expect(counted).toBeLessThan(75);
    expect(warnings.every((w) => w.zoneId && p.zones.some((z) => z.id === w.zoneId))).toBe(true);
  });

  it('flags neighbouring layers whose floors land on the same 0.2 dB step, naming the zone', () => {
    const { p, zoneId, clipId } = project('npno');
    const t = addTake(p, zoneId, take(clipId));
    const same = addLayer(t.project, zoneId, t.takeId, 0.05); // rounds to the loudest layer's step
    const issues = TARGETS.npno.check(same).filter((i) => i.level === 'error' && /floor/i.test(i.message));
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/C4/);
    expect(issues[0].zoneId).toBe(zoneId);
    const apart = addLayer(t.project, zoneId, t.takeId, 0.4);
    expect(TARGETS.npno.check(apart).some((i) => i.level === 'error' && /floor/i.test(i.message))).toBe(false);
  });

  it.each(['Répétition ☆', 'EP #2', ''])('refuses the piano name "%s": plain ASCII, no #', (name) => {
    const { p } = project('npno');
    const issues = TARGETS.npno.check({ ...p, name });
    expect(issues.some((i) => i.level === 'error' && /name/i.test(i.message))).toBe(true);
  });

  it('accepts a plain piano name', () => {
    const { p } = project('npno');
    expect(TARGETS.npno.check({ ...p, name: 'My Upright 2' }).some((i) => i.level === 'error')).toBe(false);
  });
});

describe('sample tuning limit', () => {
  it('flags a tune the file cannot hold as an error naming the zone', () => {
    const { p, zoneId } = project();
    const id = p.zones[0].takes[0].id;
    const far = updateTake(p, zoneId, id, { tuneCents: 2400 });
    const issue = TARGETS.nsmp4.check(far).find((i) => i.level === 'error' && /tuned too far/.test(i.message));
    expect(issue?.message).toMatch(/C4/);
    expect(issue?.zoneId).toBe(zoneId);
    expect(TARGETS.nsmp3.check(updateTake(p, zoneId, id, { tuneCents: 1000 })).some((i) => i.level === 'error')).toBe(false);
  });
});
