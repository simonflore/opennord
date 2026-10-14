/**
 * From analysed recordings to zones (spec §6): `placeTakes` puts each candidate on a zone for
 * its root (a new zone, or a waiting take where the root already has one: NSE's "Collision
 * Detected"); `autoMap` spreads the zones over the keys, splitting halfway between roots and
 * reaching at most `MAX_KEYS_ABOVE_ROOT` above a root; `keyGaps` names the keys left between.
 */
import { MAX_KEYS_ABOVE_ROOT } from '../../ns4/nsmp-write';
import { addTake, addZone, setKeys, type SampleProject, type Take } from '../model';

export interface Candidate { clipId: string; start: number; end: number; root: number | null; label: string; pitchEstimate?: Take['pitchEstimate'] }
export interface PlaceReport {
  newZones: number; addedTakes: number; unclear: string[];
  /** Where each candidate went, in order: a new zone, a waiting take on a zone, or left out (no clear root). */
  outcomes: ('zone' | 'take' | 'unclear')[];
}

export function placeTakes(p: SampleProject, items: Candidate[]): { project: SampleProject; report: PlaceReport } {
  const report: PlaceReport = { newZones: 0, addedTakes: 0, unclear: [], outcomes: [] };
  let project = p;
  for (const c of items) {
    if (c.root === null) { report.unclear.push(c.label); report.outcomes.push('unclear'); continue; }
    const take = { clipId: c.clipId, start: c.start, end: c.end, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0, pitchEstimate: c.pitchEstimate };
    const zone = project.zones.find((z) => z.rootKey === c.root);
    if (zone) { project = addTake(project, zone.id, take).project; report.addedTakes++; report.outcomes.push('take'); continue; }
    // A new zone sits on its root alone; any zone already spread over that key is narrowed
    // back to its root first, and `autoMap` lays them all out again.
    for (const z of project.zones) if (c.root >= z.keyLow && c.root <= z.keyHigh) project = setKeys(project, z.id, z.rootKey, z.rootKey);
    project = addZone(project, c.root, take).project;
    report.newZones++;
    report.outcomes.push('zone');
  }
  return { project, report };
}

export function autoMap(p: SampleProject): SampleProject {
  const zones = [...p.zones].sort((a, b) => a.rootKey - b.rootKey);
  // Narrow every zone to its root first, so no `setKeys` below overlaps a neighbour.
  let project = zones.reduce((acc, z) => setKeys(acc, z.id, z.rootKey, z.rootKey), p);
  const reach = (root: number) => Math.min(127, root + MAX_KEYS_ABOVE_ROOT);
  zones.forEach((z, i) => {
    const prev = zones[i - 1];
    const next = zones[i + 1];
    // Zones meet halfway between roots. Where the zone below can't reach halfway, the keys
    // between stay empty (a gap `keyGaps` reports) and this zone starts at the halfway key.
    let keyLow = 0;
    if (prev) {
      const meet = Math.floor((prev.rootKey + z.rootKey) / 2);
      const firstFree = reach(prev.rootKey) >= meet ? meet + 1 : meet;
      keyLow = Math.min(z.rootKey, firstFree);
    }
    const keyHigh = Math.max(z.rootKey, next ? Math.min(reach(z.rootKey), Math.floor((z.rootKey + next.rootKey) / 2)) : reach(z.rootKey));
    project = setKeys(project, z.id, keyLow, keyHigh);
  });
  return project;
}

export function keyGaps(p: SampleProject): { low: number; high: number }[] {
  const zones = [...p.zones].sort((a, b) => a.keyLow - b.keyLow);
  const gaps: { low: number; high: number }[] = [];
  for (let i = 1; i < zones.length; i++) {
    if (zones[i].keyLow > zones[i - 1].keyHigh + 1) gaps.push({ low: zones[i - 1].keyHigh + 1, high: zones[i].keyLow - 1 });
  }
  return gaps;
}
