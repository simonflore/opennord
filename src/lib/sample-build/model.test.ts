import { describe, it, expect } from 'vitest';
import {
  addClip, addLayer, addTake, addZone, emptyProject, projectProblems, removeClip, removeLayer, removeTake, removeZone,
  moveSplit, setActiveTake, setKeys, setName, setRoot, setTarget, updateTake, zoneById, type NewTake, type SampleProject,
} from './model';

const take = (clipId: string, over: Partial<NewTake> = {}): NewTake => ({
  clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0, ...over,
});

function twoZones(): { p: SampleProject; clipId: string; c3: string; c4: string } {
  let p = emptyProject('Upright', 'nsmp4', '2026-10-14T00:00:00Z');
  const a = addClip(p, { label: 'C3.wav', source: { kind: 'file', fileName: 'C3.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 88200 });
  p = a.project;
  const z4 = addZone(p, 60, take(a.clipId)); p = z4.project;
  const z3 = addZone(p, 48, take(a.clipId)); p = z3.project;
  return { p, clipId: a.clipId, c3: z3.zoneId, c4: z4.zoneId };
}

describe('the project model', () => {
  it('starts empty and valid', () => {
    const p = emptyProject('Empty');
    expect(p.zones).toEqual([]);
    expect(p.target).toBe('nsmp4');
    expect(projectProblems(p)).toEqual([]);
  });

  it('renames the project and marks it changed', () => {
    const p = { ...twoZones().p, updatedAt: '2000-01-01T00:00:00.000Z' };
    const q = setName(p, 'Mk I');
    expect(q.name).toBe('Mk I');
    expect(q.updatedAt).not.toBe(p.updatedAt);
  });

  it('keeps zones sorted by root, each on its own root key until mapped', () => {
    const { p } = twoZones();
    expect(p.zones.map((z) => [z.rootKey, z.keyLow, z.keyHigh])).toEqual([[48, 48, 48], [60, 60, 60]]);
    expect(projectProblems(p)).toEqual([]);
  });

  it('a new zone plays its first take', () => {
    const { p, c3 } = twoZones();
    const z = zoneById(p, c3);
    expect(z.layers).toEqual([{ takeId: z.takes[0].id, floorDb: 0 }]);
  });

  it('a second take waits until it is made active; then it replaces the loudest layer only', () => {
    const { p, c3, clipId } = twoZones();
    const t = addTake(p, c3, take(clipId, { start: 100 }));
    expect(zoneById(t.project, c3).layers).toHaveLength(1);
    expect(zoneById(t.project, c3).layers[0].takeId).not.toBe(t.takeId);
    const active = setActiveTake(t.project, c3, t.takeId);
    expect(zoneById(active, c3).layers[0]).toEqual({ takeId: t.takeId, floorDb: 0 });
  });

  it('layers stay loudest first and a zone keeps at least one', () => {
    const { p, c3, clipId } = twoZones();
    const t = addTake(p, c3, take(clipId));
    const layered = addLayer(t.project, c3, t.takeId, 12);
    expect(zoneById(layered, c3).layers.map((l) => l.floorDb)).toEqual([0, 12]);
    const first = zoneById(layered, c3).layers[0].takeId;
    const one = removeLayer(layered, c3, t.takeId);
    expect(zoneById(one, c3).layers).toHaveLength(1);
    expect(() => removeLayer(one, c3, first)).toThrow(/at least one/);
  });

  it('refuses overlapping keys and a root outside its keys', () => {
    const { p, c3 } = twoZones();
    expect(() => setKeys(p, c3, 40, 60)).toThrow(/overlap/);
    expect(() => setKeys(p, c3, 50, 55)).toThrow(/root/);
    const ok = setKeys(p, c3, 36, 59);
    expect(zoneById(ok, c3)).toMatchObject({ keyLow: 36, keyHigh: 59 });
  });

  it('moving a root keeps the zones sorted', () => {
    const { p, c3 } = twoZones();
    const moved = setRoot(setKeys(p, c3, 30, 59), c3, 30);
    expect(moved.zones.map((z) => z.rootKey)).toEqual([30, 60]);
  });

  it('a loop must sit inside its take', () => {
    const { p, c3 } = twoZones();
    const id = zoneById(p, c3).takes[0].id;
    const bad = updateTake(p, c3, id, { loop: { start: 44100 } });
    expect(projectProblems(bad).join()).toMatch(/loop/i);
    const good = updateTake(p, c3, id, { loop: { start: 22050 } });
    expect(projectProblems(good)).toEqual([]);
  });

  it('switching target keeps every take and layer', () => {
    const { p, c3, clipId } = twoZones();
    const t = addTake(p, c3, take(clipId));
    const piano = setTarget(addLayer(t.project, c3, t.takeId, 10), 'npno');
    const back = setTarget(piano, 'nsmp4');
    expect(zoneById(back, c3).takes).toHaveLength(2);
    expect(zoneById(back, c3).layers).toHaveLength(2);
    expect(back.target).toBe('nsmp4');
  });

  it('addZone refuses a root off the keyboard and leaves the project unchanged', () => {
    const { p } = twoZones();
    const before = JSON.stringify(p);
    const clipId = p.clips[0].id;
    expect(() => addZone(p, 200, take(clipId))).toThrow();
    expect(JSON.stringify(p)).toBe(before);
  });

  it('addZone refuses a take whose audio is not in the project', () => {
    const { p } = twoZones();
    expect(() => addZone(p, 70, take('no-such-clip'))).toThrow(/audio/);
  });

  it('addZone refuses a take that runs past its clip', () => {
    const { p } = twoZones();
    const clipId = p.clips[0].id;
    expect(() => addZone(p, 70, take(clipId, { end: 88201 }))).toThrow(/start and end/);
  });

  it('removes a zone', () => {
    const { p, c3 } = twoZones();
    expect(removeZone(p, c3).zones).toHaveLength(1);
  });

  describe('layer floors', () => {
    const withTake = () => {
      const { p, clipId, c3 } = twoZones();
      const t = addTake(p, c3, take(clipId));
      return { p: t.project, c3, takeId: t.takeId };
    };
    it.each([60, -6, NaN, 0, Infinity, 51.2])('refuses the floor %s', (floor) => {
      const { p, c3, takeId } = withTake();
      expect(() => addLayer(p, c3, takeId, floor)).toThrow(/between 0 and 51|softer than/i);
    });
    it('accepts a floor at the 51 dB limit', () => {
      const { p, c3, takeId } = withTake();
      expect(zoneById(addLayer(p, c3, takeId, 51), c3).layers.map((l) => l.floorDb)).toEqual([0, 51]);
    });
    it('keeps the active take at floor 0 after a refused negative floor', () => {
      const { p, c3, takeId } = withTake();
      expect(() => addLayer(p, c3, takeId, -6)).toThrow();
      expect(zoneById(p, c3).layers[0].floorDb).toBe(0);
    });
    it('projectProblems flags non-finite floors', () => {
      const { p, c3 } = twoZones();
      const z = zoneById(p, c3);
      const bad = { ...p, zones: p.zones.map((x) => (x.id === c3 ? { ...z, layers: [{ ...z.layers[0], floorDb: NaN }] } : x)) };
      expect(projectProblems(bad).join()).toMatch(/floor/i);
    });
  });

  it('projectProblems reports a loop decay that is not positive and finite', () => {
    const { p, c3 } = twoZones();
    const id = zoneById(p, c3).takes[0].id;
    for (const bad of [0, -2, NaN, Infinity]) {
      const q = { ...p, zones: p.zones.map((z) => (z.id === c3 ? { ...z, takes: [{ ...z.takes[0], loopDecaySeconds: bad }] } : z)) };
      expect(projectProblems(q).join(), String(bad)).toMatch(/decay/i);
    }
    expect(projectProblems(p)).toEqual([]);
    expect(id).toBeTruthy();
  });
});

describe('review fixes', () => {
  const t = (clipId: string): NewTake => ({ clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
  function zoneWith3(): { p: SampleProject; zoneId: string; ids: string[] } {
    const c = addClip(emptyProject('x', 'npno'), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 88200 });
    const z = addZone(c.project, 60, t(c.clipId));
    const b = addTake(z.project, z.zoneId, t(c.clipId));
    const d = addTake(b.project, z.zoneId, t(c.clipId));
    return { p: addLayer(d.project, z.zoneId, b.takeId, 14), zoneId: z.zoneId, ids: [z.takeId, b.takeId, d.takeId] };
  }

  it('addLayer refuses to move the loudest layer off 0 dB', () => {
    const { p, zoneId, ids } = zoneWith3();
    expect(() => addLayer(p, zoneId, ids[0], 12)).toThrow(/loudest layer/);
  });

  it('setActiveTake swaps a layer with the loudest instead of dropping it', () => {
    const { p, zoneId, ids } = zoneWith3();
    const swapped = setActiveTake(p, zoneId, ids[1]);
    expect(zoneById(swapped, zoneId).layers).toEqual([{ takeId: ids[1], floorDb: 0 }, { takeId: ids[0], floorDb: 14 }]);
    expect(() => setActiveTake(p, zoneId, ids[2])).toThrow(/add the take as a layer first/);
  });

  it('flags a loudest layer off 0 dB and a level or tuning that is not a number', () => {
    const { p, zoneId, ids } = zoneWith3();
    const z = zoneById(p, zoneId);
    const off = { ...p, zones: [{ ...z, layers: [{ takeId: ids[0], floorDb: 3 }] }] };
    expect(projectProblems(off).join()).toMatch(/full loudness/);
    const nan = { ...p, zones: [{ ...z, takes: z.takes.map((x, k) => (k === 0 ? { ...x, gainDb: NaN } : x)) }] };
    expect(projectProblems(nan).join()).toMatch(/level or tuning/);
  });

  it('names zones by note, not by number', () => {
    const { p } = zoneWith3();
    expect(() => addZone(p, 60, t(p.clips[0].id))).toThrow(/^C4 already has a zone/);
  });
});

describe('moveSplit', () => {
  const t = (clipId: string): NewTake => ({ clipId, start: 0, end: 100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
  function two(): { p: SampleProject; low: string; high: string } {
    const c = addClip(emptyProject('x'), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 100 });
    const a = addZone(c.project, 48, t(c.clipId));
    const b = addZone(a.project, 60, t(c.clipId));
    let p = setKeys(b.project, a.zoneId, 36, 54);
    p = setKeys(p, b.zoneId, 55, 72);
    return { p, low: a.zoneId, high: b.zoneId };
  }

  it('moves the split and the neighbour together', () => {
    const { p, low, high } = two();
    const moved = moveSplit(p, low, 57);
    expect([zoneById(moved, low).keyHigh, zoneById(moved, high).keyLow]).toEqual([57, 58]);
    const back = moveSplit(moved, low, 50);
    expect([zoneById(back, low).keyHigh, zoneById(back, high).keyLow]).toEqual([50, 51]);
  });

  it('stops before the neighbour\'s root and at its own root', () => {
    const { p, low, high } = two();
    expect(zoneById(moveSplit(p, low, 80), low).keyHigh).toBe(59);
    expect(zoneById(moveSplit(p, low, 80), high).keyLow).toBe(60);
    expect(zoneById(moveSplit(p, low, 10), low).keyHigh).toBe(48);
  });

  it('moves only the top zone\'s own top key', () => {
    const { p, high } = two();
    expect(zoneById(moveSplit(p, high, 90), high).keyHigh).toBe(90);
    expect(zoneById(moveSplit(p, high, 200), high).keyHigh).toBe(127);
  });

  describe('removing takes and clips', () => {
    it('removes a take that waits, and refuses the last take of a zone', () => {
      const { p, clipId, c4 } = twoZones();
      const added = addTake(p, c4, take(clipId, { end: 1000 }));
      const q = removeTake(added.project, c4, added.takeId);
      expect(zoneById(q, c4).takes).toHaveLength(1);
      expect(() => removeTake(q, c4, zoneById(q, c4).takes[0].id)).toThrow(/at least one take/);
    });

    it('removing a layer’s take removes the layer, and the next loudest plays at 0 dB', () => {
      const { p, clipId, c4 } = twoZones();
      const soft = addTake(p, c4, take(clipId));
      const layered = addLayer(soft.project, c4, soft.takeId, 12);
      const loudest = zoneById(layered, c4).layers[0].takeId;
      const q = removeTake(layered, c4, loudest);
      expect(zoneById(q, c4).layers).toEqual([{ takeId: soft.takeId, floorDb: 0 }]);
      expect(projectProblems(q)).toEqual([]);
    });

    it('removing the active take of a sample makes a waiting take play', () => {
      const { p, clipId, c4 } = twoZones();
      const other = addTake(p, c4, take(clipId));
      const q = removeTake(other.project, c4, zoneById(p, c4).takes[0].id);
      expect(zoneById(q, c4).layers).toEqual([{ takeId: other.takeId, floorDb: 0 }]);
    });

    it('removes a clip no take uses, and refuses one that is used', () => {
      const { p, clipId } = twoZones();
      const spare = addClip(p, { label: 'spare.wav', source: { kind: 'file', fileName: 'spare.wav' }, audioRef: 's', sampleRate: 44100, channels: 1, frames: 10 });
      const q = removeClip(spare.project, spare.clipId);
      expect(q.clips.map((c) => c.id)).toEqual([clipId]);
      expect(() => removeClip(q, clipId)).toThrow(/C3, C4/);
    });
  });
});
