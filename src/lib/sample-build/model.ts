/**
 * A Build-sample project: the clips the player brought in, and the zones that use them
 *. Plain data, changed only by the pure
 * functions below, which return a new project and keep its invariants. Target rules (how far
 * a key may reach, how many layers a zone may have) are not invariants: the target profiles
 * check them (`targets.ts`), so switching target never loses anything.
 */

import { noteName } from '../ns4/sample-view';
import { NPNO_PIANO_TYPE } from '../ns4/nsp-write';

export type TargetId = 'nsmp4' | 'nsmp3' | 'npno';

export interface Clip {
  id: string;
  label: string;
  source: { kind: 'file'; fileName: string } | { kind: 'recording'; recordedAt: string };
  /** Key of the stored audio (Plan 2's storage). */
  audioRef: string;
  sampleRate: number;
  channels: 1 | 2;
  frames: number;
}

export interface Take {
  id: string;
  clipId: string;
  /** Trim, in frames of the clip: [start, end). */
  start: number;
  end: number;
  /** Loop start in frames of the clip; the loop ends at `end`, as on the Nord. */
  loop: { start: number } | null;
  /** Seconds to fall 40 dB while held in the loop; null holds. */
  loopDecaySeconds: number | null;
  gainDb: number;
  tuneCents: number;
  pitchEstimate?: { midi: number; cents: number; confidence: number };
}

export interface Layer {
  takeId: string;
  /** Piano: how far below the hardest hit this layer takes over, in dB (0 for the loudest). */
  floorDb: number;
}

export interface Zone {
  id: string;
  /** The pitch the zone's recordings sound at (MIDI). */
  rootKey: number;
  keyLow: number;
  keyHigh: number;
  takes: Take[];
  /** The takes the file gets, loudest first. A sample uses `layers[0]`, the active take. */
  layers: Layer[];
}

export interface SampleProject {
  version: 1;
  id: string;
  name: string;
  target: TargetId;
  category: number;
  piano?: { type: number; variant?: string };
  clips: Clip[];
  zones: Zone[];
  createdAt: string;
  updatedAt: string;
}

/** Softest floor a piano layer can store, in dB below the hardest hit (the Nord's touch table). */
export const MAX_FLOOR_DB = 51;

export type NewTake = Omit<Take, 'id'>;

const newId = (): string => crypto.randomUUID();
const touch = (p: SampleProject, zones = p.zones, extra: Partial<SampleProject> = {}): SampleProject =>
  ({ ...p, ...extra, zones: [...zones].sort((a, b) => a.rootKey - b.rootKey), updatedAt: new Date().toISOString() });

export function emptyProject(name: string, target: TargetId = 'nsmp4', now = new Date().toISOString()): SampleProject {
  return { version: 1, id: newId(), name, target, category: 0, clips: [], zones: [], createdAt: now, updatedAt: now };
}

export function zoneById(p: SampleProject, zoneId: string): Zone {
  const z = p.zones.find((x) => x.id === zoneId);
  if (!z) throw new Error(`No zone ${zoneId}`);
  return z;
}

/** The take a layer plays; a zone's active take is `takeOf(z, z.layers[0])`. */
export const takeOf = (z: Zone, l: Layer | undefined): Take | undefined => (l ? z.takes.find((t) => t.id === l.takeId) : undefined);

/** Throws the first invariant problem. Loop problems are left out: edits may move a loop and its take separately. */
function assertSound(p: SampleProject): SampleProject {
  const problems = problemsOf(p, false);
  if (problems.length) throw new Error(problems[0]);
  return p;
}

function withZone(p: SampleProject, zoneId: string, change: (z: Zone) => Zone): SampleProject {
  zoneById(p, zoneId);
  return assertSound(touch(p, p.zones.map((z) => (z.id === zoneId ? change(z) : z))));
}

export function addClip(p: SampleProject, clip: Omit<Clip, 'id'>): { project: SampleProject; clipId: string } {
  const clipId = newId();
  return { project: touch(p, p.zones, { clips: [...p.clips, { ...clip, id: clipId }] }), clipId };
}

/** A zone on a single key (its root) playing `take`; widen it with `setKeys` or `autoMap`. */
export function addZone(p: SampleProject, rootKey: number, take: NewTake): { project: SampleProject; zoneId: string; takeId: string } {
  if (p.zones.some((z) => rootKey >= z.keyLow && rootKey <= z.keyHigh)) throw new Error(`${noteName(rootKey)} already has a zone`);
  const zoneId = newId();
  const takeId = newId();
  const zone: Zone = { id: zoneId, rootKey, keyLow: rootKey, keyHigh: rootKey, takes: [{ ...take, id: takeId }], layers: [{ takeId, floorDb: 0 }] };
  return { project: assertSound(touch(p, [...p.zones, zone])), zoneId, takeId };
}

/** Another take of the zone's note; it waits until made active or added as a layer. */
export function addTake(p: SampleProject, zoneId: string, take: NewTake): { project: SampleProject; takeId: string } {
  const takeId = newId();
  return { project: withZone(p, zoneId, (z) => ({ ...z, takes: [...z.takes, { ...take, id: takeId }] })), takeId };
}

/**
 * The take a sample writes: it becomes the loudest layer. A take that is already a softer
 * layer swaps places with the loudest (which takes its floor), so no layer is lost. In a zone
 * with several layers, a take that is not a layer yet has to be added as one first.
 */
export function setActiveTake(p: SampleProject, zoneId: string, takeId: string): SampleProject {
  return withZone(p, zoneId, (z) => {
    if (!z.takes.some((t) => t.id === takeId)) throw new Error(`No take ${takeId} in this zone`);
    const at = z.layers.findIndex((l) => l.takeId === takeId);
    if (at === 0) return z;
    if (at > 0) {
      const layers = z.layers.map((l, k) => (k === 0 ? { takeId, floorDb: 0 } : k === at ? { takeId: z.layers[0].takeId, floorDb: l.floorDb } : l));
      return { ...z, layers };
    }
    if (z.layers.length > 1) throw new Error('This zone has layers: add the take as a layer first, then make it the loudest.');
    return { ...z, layers: [{ takeId, floorDb: 0 }] };
  });
}

export function addLayer(p: SampleProject, zoneId: string, takeId: string, floorDb: number): SampleProject {
  return withZone(p, zoneId, (z) => {
    if (!z.takes.some((t) => t.id === takeId)) throw new Error(`No take ${takeId} in this zone`);
    if (!Number.isFinite(floorDb) || floorDb < 0 || floorDb > MAX_FLOOR_DB) throw new Error(`A layer's floor must be between 0 and ${MAX_FLOOR_DB} dB.`);
    if (!(floorDb > 0)) throw new Error('A softer layer takes over below the loudest one, so its floor must be softer than 0 dB.');
    if (z.layers[0]?.takeId === takeId) throw new Error('This take is the loudest layer and stays at 0 dB; make another take the loudest first.');
    const layers = [...z.layers.filter((l) => l.takeId !== takeId), { takeId, floorDb }].sort((a, b) => a.floorDb - b.floorDb);
    return { ...z, layers };
  });
}

export function removeLayer(p: SampleProject, zoneId: string, takeId: string): SampleProject {
  return withZone(p, zoneId, (z) => {
    const layers = z.layers.filter((l) => l.takeId !== takeId);
    if (!layers.length) throw new Error('A zone needs at least one layer');
    return { ...z, layers: [{ ...layers[0], floorDb: 0 }, ...layers.slice(1)] };
  });
}

export function setRoot(p: SampleProject, zoneId: string, rootKey: number): SampleProject {
  return withZone(p, zoneId, (z) => ({ ...z, rootKey }));
}

export function setKeys(p: SampleProject, zoneId: string, keyLow: number, keyHigh: number): SampleProject {
  return withZone(p, zoneId, (z) => ({ ...z, keyLow, keyHigh }));
}

/**
 * Drag a zone's split: its top key moves, and the zone above starts on the next key. Clamped
 * so each zone keeps its root: the split stays between this zone's root and the key before
 * the next zone's root. A gap above the zone stays a gap.
 */
export function moveSplit(p: SampleProject, zoneId: string, keyHigh: number): SampleProject {
  const z = zoneById(p, zoneId);
  const sorted = [...p.zones].sort((a, b) => a.keyLow - b.keyLow);
  const next = sorted[sorted.indexOf(z) + 1];
  const touching = next !== undefined && next.keyLow === z.keyHigh + 1;
  const top = next ? next.rootKey - 1 : 127;
  const high = Math.max(z.rootKey, Math.min(top, Math.round(keyHigh)));
  if (!next) return withZone(p, zoneId, (x) => ({ ...x, keyHigh: high }));
  const nextLow = touching ? high + 1 : Math.max(next.keyLow, high + 1);
  return assertSound(touch(p, p.zones.map((x) => (x.id === zoneId ? { ...x, keyHigh: high } : x.id === next.id ? { ...x, keyLow: nextLow } : x))));
}

export function updateTake(p: SampleProject, zoneId: string, takeId: string, change: Partial<NewTake>): SampleProject {
  return withZone(p, zoneId, (z) => ({ ...z, takes: z.takes.map((t) => (t.id === takeId ? { ...t, ...change } : t)) }));
}

/**
 * Remove a take. A zone keeps at least one. A take that is a layer takes its layer with it;
 * the next loudest layer then plays at 0 dB, and a zone left with no layer plays its first take.
 */
export function removeTake(p: SampleProject, zoneId: string, takeId: string): SampleProject {
  return withZone(p, zoneId, (z) => {
    if (!z.takes.some((t) => t.id === takeId)) throw new Error(`No take ${takeId} in this zone`);
    if (z.takes.length === 1) throw new Error('A zone needs at least one take; remove the zone instead.');
    const takes = z.takes.filter((t) => t.id !== takeId);
    const left = z.layers.filter((l) => l.takeId !== takeId);
    const layers = left.length ? [{ ...left[0], floorDb: 0 }, ...left.slice(1)] : [{ takeId: takes[0].id, floorDb: 0 }];
    return { ...z, takes, layers };
  });
}

/** The zones (by root note) whose takes use a clip, lowest first. */
export function zonesUsing(p: SampleProject, clipId: string): string[] {
  return [...p.zones].sort((a, b) => a.rootKey - b.rootKey).filter((z) => z.takes.some((t) => t.clipId === clipId)).map((z) => noteName(z.rootKey));
}

/** Remove a recording no take uses. Its stored audio may stay; nothing points at it. */
export function removeClip(p: SampleProject, clipId: string): SampleProject {
  if (!p.clips.some((c) => c.id === clipId)) throw new Error(`No clip ${clipId}`);
  const used = zonesUsing(p, clipId);
  if (used.length) throw new Error(`This recording is used by ${used.length === 1 ? 'zone' : 'zones'} ${used.join(', ')}; remove those takes first.`);
  return touch(p, p.zones, { clips: p.clips.filter((c) => c.id !== clipId) });
}

export function removeZone(p: SampleProject, zoneId: string): SampleProject {
  zoneById(p, zoneId);
  return touch(p, p.zones.filter((z) => z.id !== zoneId));
}

/** Rename the build; like every edit, it marks the project as changed now. */
export function setName(p: SampleProject, name: string): SampleProject {
  return touch(p, p.zones, { name });
}

/** A piano's type and variant (shown after the name on the Nord, e.g. "Mk I"); an empty variant is none. */
export function setPiano(p: SampleProject, change: { type?: number; variant?: string }): SampleProject {
  const piano = { ...(p.piano ?? { type: NPNO_PIANO_TYPE.electric }), ...change };
  if (piano.variant === '') delete piano.variant;
  return touch(p, p.zones, { piano });
}

/** Change the file format. Nothing in the project changes; the new profile's `check` says what the file will get. */
export function setTarget(p: SampleProject, target: TargetId): SampleProject {
  return touch(p, p.zones, { target, piano: target === 'npno' ? p.piano ?? { type: NPNO_PIANO_TYPE.electric } : p.piano });
}

/** Broken invariants, in plain words; empty when the project is sound. */
export function projectProblems(p: SampleProject): string[] {
  return problemsOf(p, true);
}

/** The invariants; `withLoops` false leaves out the loop-inside-take check, which edits may break for a moment. */
function problemsOf(p: SampleProject, withLoops: boolean): string[] {
  const out: string[] = [];
  const clips = new Map(p.clips.map((c) => [c.id, c]));
  const zones = [...p.zones].sort((a, b) => a.keyLow - b.keyLow);
  zones.forEach((z, i) => {
    const name = `Zone ${noteName(z.rootKey)}`;
    if (z.keyLow > z.keyHigh || z.keyLow < 0 || z.keyHigh > 127) out.push(`${name}: its keys run backwards or off the keyboard`);
    if (z.rootKey < z.keyLow || z.rootKey > z.keyHigh) out.push(`${name}: its root is outside its keys`);
    if (i > 0 && z.keyLow <= zones[i - 1].keyHigh) out.push(`${name}: its keys overlap the zone below`);
    if (!z.layers.length) out.push(`${name}: it has no layer`);
    for (const l of z.layers) if (!z.takes.some((t) => t.id === l.takeId)) out.push(`${name}: one of its layers has lost its take`);
    if (z.layers.length && z.layers[0].floorDb !== 0) out.push(`${name}: its loudest layer must play at full loudness (0 dB)`);
    for (const l of z.layers) if (!Number.isFinite(l.floorDb) || l.floorDb < 0 || l.floorDb > MAX_FLOOR_DB) out.push(`${name}: a layer's floor must be between 0 and ${MAX_FLOOR_DB} dB`);
    for (let k = 1; k < z.layers.length; k++) if (z.layers[k].floorDb <= z.layers[k - 1].floorDb) out.push(`${name}: its layers are not loudest first`);
    for (const t of z.takes) {
      const c = clips.get(t.clipId);
      if (!c) { out.push(`${name}: a take's audio is missing`); continue; }
      if (!(t.start >= 0 && t.start < t.end && t.end <= c.frames)) out.push(`${name}: a take's start and end don't fit its audio`);
      if (!Number.isFinite(t.gainDb) || !Number.isFinite(t.tuneCents)) out.push(`${name}: a take's level or tuning is not a number`);
      if (t.loopDecaySeconds !== null && !(Number.isFinite(t.loopDecaySeconds) && t.loopDecaySeconds > 0)) out.push(`${name}: a loop's decay must be a number of seconds above 0`);
      if (withLoops && t.loop && !(t.loop.start > t.start && t.loop.start < t.end)) out.push(`Loop in ${name.toLowerCase()} must start inside its take`);
    }
  });
  return out;
}
