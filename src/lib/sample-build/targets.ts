/**
 * One profile per file format: what the
 * format can hold, how far a key reaches from its recording, and the checks Save & send lists.
 */
import { NSMP_SAMPLE_RATE } from '../ns4/nsmp';
import { MAX_KEYS_ABOVE_ROOT } from '../ns4/nsmp-write';
import { MAX_ZONE_KEYS, planPianoZones, UNTESTED, type SampleZone } from '../ns4/nsmp-to-npno';
import { noteName } from '../ns4/sample-view';
import { MAX_LAYERS_PER_ROOT } from '../ns4/nsp-check';
import { MAX_NPNO_NAME } from '../ns4/nsp-write';
import { projectProblems, takeOf, type Layer, type SampleProject, type TargetId, type Zone } from './model';

export interface Issue { level: 'error' | 'warning'; message: string; zoneId?: string }

export interface TargetProfile {
  id: TargetId;
  label: string;
  partition: 'sample' | 'piano';
  maxLayersPerZone: number;
  nameMax: number;
  hardware: 'verified' | 'untested';
  /**
   * The keys the file plays from this zone's own recording, as written. `highest` is clamped to
   * at least `lowest - 1`: when the zone lies entirely past its limit, the range is empty
   * (`highest = lowest - 1`), meaning none of the zone's keys play the recording as written.
   */
  reach(zone: Zone): { lowest: number; highest: number };
  check(p: SampleProject): Issue[];
}

const span = (lo: number, hi: number) => (lo === hi ? noteName(lo) : `${noteName(lo)} to ${noteName(hi)}`);

// The replay rate lives in a u16 header field (stk +0x06), so 65535 is the ceiling; the reader
// only trusts rates from 8000 up.
const PITCH_MIN = 8000, PITCH_MAX = 65535;
const MAX_TUNE_CENTS = Math.floor(Math.min(1200 * Math.log2(PITCH_MAX / NSMP_SAMPLE_RATE), 1200 * Math.log2(NSMP_SAMPLE_RATE / PITCH_MIN)));

/** The replay rate a sample stroke stores for a tune, in Hz. */
export const pitchBaseFor = (tuneCents: number): number => Math.round(NSMP_SAMPLE_RATE * 2 ** (tuneCents / 1200));

/** Why a sample zone's tune cannot be stored, in plain words; null when it can. */
export function tuneProblem(z: Zone, tuneCents: number): string | null {
  const base = pitchBaseFor(tuneCents);
  return base < PITCH_MIN || base > PITCH_MAX ? `Zone ${noteName(z.rootKey)} is tuned too far; keep tune within about ±${MAX_TUNE_CENTS} cents.` : null;
}

/** Checks every target shares: the model's own problems, and an empty project. */
function common(p: SampleProject): Issue[] {
  const issues: Issue[] = projectProblems(p).map((message) => ({ level: 'error', message }));
  if (!p.zones.length) issues.push({ level: 'error', message: 'Add at least one zone before saving.' });
  return issues;
}

function sampleProfile(id: 'nsmp4' | 'nsmp3', label: string): TargetProfile {
  const profile: TargetProfile = {
    id, label, partition: 'sample', maxLayersPerZone: 1, nameMax: 102, hardware: 'verified',
    // `MAX_KEYS_ABOVE_ROOT`: NSE greys out keys past it and no local zone goes further (nsmp-write.ts).
    reach: (z) => ({ lowest: z.keyLow, highest: Math.max(z.keyLow - 1, Math.min(z.keyHigh, z.rootKey + MAX_KEYS_ABOVE_ROOT)) }),
    check(p) {
      const issues = common(p);
      for (const z of p.zones) {
        const r = profile.reach(z);
        if (r.highest < z.keyHigh) {
          issues.push({ level: 'warning', zoneId: z.id, message: `${span(Math.max(r.highest + 1, z.keyLow), z.keyHigh)} stay silent: a sample reaches at most ${MAX_KEYS_ABOVE_ROOT} semitones above its recording (${noteName(z.rootKey)}).` });
        }
        const active = takeOf(z, z.layers[0]);
        const tune = active && tuneProblem(z, active.tuneCents);
        if (tune) issues.push({ level: 'error', zoneId: z.id, message: tune });
        if (z.layers.length > 1) {
          issues.push({ level: 'warning', zoneId: z.id, message: `Zone ${noteName(z.rootKey)}: only the loudest layer goes into a sample.` });
        }
      }
      return issues;
    },
  };
  return profile;
}

/**
 * The project as the piano converter sees it: one `SampleZone` per zone and layer, numbered from
 * 1, with one top velocity per layer index so layer k of every zone is one touch band.
 * `buildPianoFile` and `copyWarnings` both use it, so the warning counts what the file gets.
 */
export function pianoSourceZones(p: SampleProject): { zone: SampleZone; src: Zone; layer: Layer }[] {
  const out: { zone: SampleZone; src: Zone; layer: Layer }[] = [];
  for (const z of p.zones) {
    z.layers.forEach((layer, k) => {
      out.push({ src: z, layer, zone: { keyHigh: z.keyHigh, rootKey: z.rootKey, velTop: 127 - k, globalID: out.length + 1, floorDb: layer.floorDb } });
    });
  }
  return out;
}

/**
 * Keys the converter fills with re-pitched copies, per zone. A zone's first plan entry is its
 * own recording; every entry after it is a copy made for keys well above the recording.
 */
function copyWarnings(p: SampleProject): Issue[] {
  if (!p.zones.length || p.zones.some((z) => !z.layers.length)) return [];
  const source = pianoSourceZones(p);
  const zones = source.map((s) => s.zone);
  const owner = new Map(source.map((s) => [s.zone.globalID, s.src]));
  const seen = new Set<Zone>();
  const keys = new Map<Zone, number>();
  for (const entry of planPianoZones(zones)) {
    const z = owner.get(entry.layers[0].globalID);
    if (!z) continue;
    if (!seen.has(z)) { seen.add(z); continue; }
    keys.set(z, (keys.get(z) ?? 0) + entry.highNote - entry.lowNote + 1);
  }
  return [...keys].map(([z, n]) => ({
    level: 'warning', zoneId: z.id,
    message: `Zone ${noteName(z.rootKey)}: ${n} keys above its recording are played by re-pitched copies.`,
  }));
}

const piano: TargetProfile = {
  id: 'npno', label: '.npno · piano', partition: 'piano', maxLayersPerZone: MAX_LAYERS_PER_ROOT,
  nameMax: MAX_NPNO_NAME, hardware: 'untested',
  // The converter (`planPianoZones`) peels the keys above a recording off in groups of
  // `MAX_ZONE_KEYS`, each a re-pitched copy, until fewer than that are left above the root; the
  // rest plays from the zone's own recording. Same rule as `copyWarnings`, so the keyboard and
  // the count agree.
  reach: (z) => {
    const above = Math.max(0, z.keyHigh - z.rootKey);
    const own = z.keyHigh - MAX_ZONE_KEYS * Math.floor(above / MAX_ZONE_KEYS);
    return { lowest: z.keyLow, highest: Math.max(z.keyLow - 1, Math.min(z.keyHigh, own)) };
  },
  check(p) {
    const issues = common(p);
    if (p.name.length > piano.nameMax) issues.push({ level: 'error', message: `A piano name has at most ${piano.nameMax} characters.` });
    if (!p.name.trim()) issues.push({ level: 'error', message: 'Give the piano a name.' });
    else if (!/^[\x20-\x7e]+$/.test(p.name) || p.name.includes('#')) {
      issues.push({ level: 'error', message: 'A piano name can only use plain letters, digits and basic punctuation: no accents, symbols or "#".' });
    }
    for (const z of p.zones) {
      if (z.layers.length > piano.maxLayersPerZone) issues.push({ level: 'error', zoneId: z.id, message: `Zone ${noteName(z.rootKey)} has more than ${piano.maxLayersPerZone} layers.` });
      // A Nord stores a floor in 0.2 dB steps; neighbours on one step would play as one layer.
      const steps = z.layers.map((l) => Math.round(l.floorDb * 5));
      if (steps.some((st, k) => k > 0 && st === steps[k - 1])) {
        issues.push({ level: 'error', zoneId: z.id, message: `Zone ${noteName(z.rootKey)}: two layers take over at almost the same loudness; give each layer its own floor, at least 0.2 dB apart.` });
      }
    }
    const counts = new Set(p.zones.map((z) => z.layers.length));
    if (counts.size > 1) {
      const list = p.zones.map((z) => `${noteName(z.rootKey)} has ${z.layers.length}`).join(', ');
      issues.push({ level: 'error', message: `Every zone of a piano needs the same number of layers: ${list}.` });
    }
    issues.push(...copyWarnings(p));
    issues.push({ level: 'warning', message: UNTESTED });
    return issues;
  },
};

export const TARGETS: Record<TargetId, TargetProfile> = {
  nsmp4: sampleProfile('nsmp4', '.nsmp4 · Stage 4 sample'),
  nsmp3: sampleProfile('nsmp3', '.nsmp3 · Stage 3 sample'),
  npno: piano,
};
