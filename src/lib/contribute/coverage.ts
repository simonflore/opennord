/**
 * Per-model body-decode status — the dedup map so contributors target models that
 * still need work instead of re-deriving what's already decoded.
 *
 * Stage 4 has a complete parameter map (the ns4decode-derived offset map, our
 * oracle). Stage 2 / 2 EX, Stage 3 and the other firmware-layout readers map
 * their body from a per-model parameter registry or descriptors. Every
 * other model's progress
 * comes from `coverage-data.ts` — the curated state maintained by hand as fields
 * are mapped. We always know a model's body *size*, so even undecoded models
 * have a concrete target to fill.
 */
import { buildParamMap } from '../ns4/maps';
import { MODEL_PROGRESS, type ModelProgress, type BodyRegion } from './coverage-data';
import type { FwLayout } from '../clavia/block-chain';
import { NS3_LAYOUT } from '../ns3/layout.generated';
import { NG_LAYOUT } from '../ng/layout.generated';
import { NG2_LAYOUT } from '../ng2/layout.generated';
import { NP4_LAYOUT } from '../np4/layout.generated';
import { NP5_LAYOUT } from '../np5/layout.generated';
import { NP6_LAYOUT } from '../np6/layout.generated';
import { NE6_LAYOUT } from '../ne6/layout.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NO3_LAYOUT } from '../no3/layout.generated';
import { NW2_LAYOUT } from '../nw2/layout.generated';
import type { LegacyLayout } from '../clavia/legacy-record';
import { NL4_LAYOUT } from '../nl4/layout.generated';
import { NLA_LAYOUT } from '../nla/layout.generated';
import { NE4_LAYOUT } from '../ne4/layout.generated';
import { NE3_LAYOUT } from '../ne3/layout.generated';
import { NE3HP_LAYOUT } from '../ne3/layout-hp.generated';
import { NC2_LAYOUT } from '../nc2/layout.generated';
import { NW1_LAYOUT } from '../nw1/layout.generated';
import { NS2_LAYOUT } from '../ns2/layout.generated';

/** The single canonical Stage 4 param map (ns4decode port + corpus-RE'd extras). */
const NS4_PARAMS = buildParamMap();

export type DecodeStatus = 'full' | 'partial' | 'started' | 'none';

export interface ModelDecode {
  status: DecodeStatus;
  /** Decoded parameter count where we have a full map, else null. */
  paramCount: number | null;
  /** Total body size in bytes, if known. */
  bodyBytes: number | null;
  /** Distinct body bytes in a *confirmed* region — what we can actually decode. */
  coveredBytes: number;
  /** Distinct body bytes in a *candidate* region — section identified, fields not pinned. */
  candidateBytes: number;
  /** Controls localized so far. */
  controlCount: number;
  /** Percent of body bytes confirmed-decoded, if bodyBytes is known. */
  pct: number | null;
  /** The reader covers every parameter the instrument stores in a program (its firmware's own map). */
  fullMap: boolean;
}

/** Distinct parameters in the Stage 4 map (each id may span multiple layers). */
export const NS4_PARAM_COUNT = new Set(NS4_PARAMS.map((p) => p.id)).size;

// Models with a (full/partial) decoder independent of contributions.
const DECODER_BY_ID: Record<string, 'full' | 'partial'> = {
  'stage-4': 'full',
  // Firmware-layout readers (clavia/block-chain.ts), read-only. Grand, Piano 6,
  // Electro 7 and Organ 3 are not yet checked on real files; the Stage 3 layout
  // reproduces every offset the earlier corpus decoder read from real files.
  'stage-3': 'partial',
  'grand': 'partial',
  'grand-2': 'partial',
  'piano-4': 'partial',
  'piano-5': 'partial',
  'piano-6': 'partial',
  'electro-6': 'partial',
  'electro-7': 'partial',
  'organ-3': 'partial',
  'wave-2': 'partial',
  // Legacy-record readers (clavia/legacy-record.ts), read-only. The Stage 2 EX
  // shares the Stage 2's ns2p program format.
  'stage-2': 'partial',
  'stage-2-ex': 'partial',
  'electro-3': 'partial',
  'electro-3-hp': 'partial',
  'electro-4': 'partial',
  'c2d': 'partial',
  'wave': 'partial',
  'lead-4': 'partial',
  'lead-a1': 'partial',
};

// ── Stage 4 coverage synthesized from the offset map ─────────────────────────
const NS4_BODY_BYTES = 824;
const NS4_CBIN_BITS = 44 * 8; // header is 44 bytes; bit offsets in the map are absolute

const GROUP_LABEL: Record<string, string> = {
  m: 'Master section', o: 'Organ engine', p: 'Piano engine', y: 'Synth engine',
};

/**
 * Run-length encode a covered-byte set into BodyRegions. `labelFor(b)` returns a
 * group label for a covered byte (regions break where the label changes); covered
 * runs become 'confirmed', gaps become 'constant'.
 */
function coveredToRegions(
  covered: Set<number>, bodyBytes: number, labelFor: (b: number) => string,
): BodyRegion[] {
  const regions: BodyRegion[] = [];
  let i = 0;
  while (i < bodyBytes) {
    const isCovered = covered.has(i);
    const label = isCovered ? labelFor(i) : '';
    let j = i + 1;
    while (j < bodyBytes && covered.has(j) === isCovered && (!isCovered || labelFor(j) === label)) j++;
    regions.push({ start: i, end: j - 1, label, status: isCovered ? 'confirmed' : 'constant' });
    i = j;
  }
  return regions;
}

let _ns4Progress: ModelProgress | undefined;

function getNs4Progress(): ModelProgress {
  if (_ns4Progress) return _ns4Progress;
  const groupFor: Record<number, string> = {};
  const covered = new Set<number>();
  for (const param of NS4_PARAMS) {
    for (const layer of param.layers) {
      const bs = Math.floor((layer.begBit - NS4_CBIN_BITS) / 8);
      const be = Math.floor((layer.endBit - NS4_CBIN_BITS) / 8);
      if (bs < 0) continue;
      for (let b = bs; b <= Math.min(NS4_BODY_BYTES - 1, be); b++) {
        covered.add(b);
        if (!groupFor[b]) groupFor[b] = param.group;
      }
    }
  }
  const regions = coveredToRegions(covered, NS4_BODY_BYTES, (b) => GROUP_LABEL[groupFor[b]] ?? groupFor[b]);
  _ns4Progress = { bodyBytes: NS4_BODY_BYTES, controls: [], regions };
  return _ns4Progress;
}

// ── Firmware-layout models: byte map synthesized from the generated layout ──
// Stage 3, Grand, Grand 2, Piano 4/5/6, Electro 6 and Wave 2 come from a
// high-confidence firmware map → 'confirmed' (Stage 3, Piano 4 / 5, Grand 2,
// Electro 6 and Wave 2 also reproduce the offsets, block lengths and anchors of
// the earlier readers).
// Electro 7 and Organ 3 have a medium-confidence block order (not yet seen in a
// real file) → 'candidate', so they don't inflate the headline percentage.
const FW_LAYOUTS: Record<string, { layout: FwLayout; status: 'confirmed' | 'candidate' }> = {
  'stage-3': { layout: NS3_LAYOUT, status: 'confirmed' },
  'grand': { layout: NG_LAYOUT, status: 'confirmed' },
  'grand-2': { layout: NG2_LAYOUT, status: 'confirmed' },
  'piano-4': { layout: NP4_LAYOUT, status: 'confirmed' },
  'piano-5': { layout: NP5_LAYOUT, status: 'confirmed' },
  'piano-6': { layout: NP6_LAYOUT, status: 'confirmed' },
  'electro-6': { layout: NE6_LAYOUT, status: 'confirmed' },
  'electro-7': { layout: NE7_LAYOUT, status: 'candidate' },
  'organ-3': { layout: NO3_LAYOUT, status: 'candidate' },
  'wave-2': { layout: NW2_LAYOUT, status: 'confirmed' },
};
const _fwProgress: Record<string, ModelProgress> = {};

/** Firmware-layout readers that still leave part of the stored program out, and what. */
const NOT_FULL_MAP: Record<string, string> = {
  'wave-2': 'morph amounts are not read yet',
};

// ── Legacy-record models: byte map of the record data (after the record version) ─
// Lead 4 (high) → 'confirmed'. Stage 2 / 2 EX → 'confirmed': framing, values and
// morph deltas checked on ns3-program-viewer's corpus of real files. Electro 4 (its
// layout is medium confidence, although it reproduces the corpus drawbar/sample
// anchors), Lead A1, Electro 3 / 3 HP, C2D and Wave (alignment unchecked against
// real files) → 'candidate'.
// Lead 4 maps its program record (a performance is 7 common bytes + 4 of them).
const LEGACY_LAYOUTS: Record<string, { layout: LegacyLayout; status: 'confirmed' | 'candidate' }> = {
  'stage-2': { layout: NS2_LAYOUT, status: 'confirmed' },
  'stage-2-ex': { layout: NS2_LAYOUT, status: 'confirmed' },
  'electro-3': { layout: NE3_LAYOUT, status: 'candidate' },
  'electro-3-hp': { layout: NE3HP_LAYOUT, status: 'candidate' },
  'electro-4': { layout: NE4_LAYOUT, status: 'candidate' },
  'c2d': { layout: NC2_LAYOUT, status: 'candidate' },
  'wave': { layout: NW1_LAYOUT, status: 'candidate' },
  'lead-4': { layout: NL4_LAYOUT, status: 'confirmed' },
  'lead-a1': { layout: NLA_LAYOUT, status: 'candidate' },
};

/** Run-length encode per-byte kinds; `field:<label>` bytes take `status`, everything else is constant. */
function kindsToRegions(kind: string[], status: 'confirmed' | 'candidate'): BodyRegion[] {
  const regions: BodyRegion[] = [];
  let i = 0;
  while (i < kind.length) {
    let j = i + 1;
    while (j < kind.length && kind[j] === kind[i]) j++;
    const field = kind[i].startsWith('field:');
    regions.push({ start: i, end: j - 1, label: field ? kind[i].slice(6) : kind[i], status: field ? status : 'constant' });
    i = j;
  }
  return regions;
}

/** Mark bits [start, start + width) of `kind` as `label`. */
function mark(kind: string[], start: number, width: number, label: string): void {
  for (let b = start >> 3; b <= (start + width - 1) >> 3; b++) kind[b] = label;
}

/** Byte regions from a firmware layout: version + block-length bytes and reserved space are constant. */
function layoutProgress(layout: FwLayout, status: 'confirmed' | 'candidate'): ModelProgress {
  const kind: string[] = new Array<string>(layout.bodyBytes).fill('Reserved');
  for (let b = 0; b < 4; b++) kind[b] = 'Format version';
  for (const blk of layout.blocks) kind[blk.offset] = 'Block length';
  for (const f of layout.fields) {
    const blk = layout.blocks[f.block];
    mark(kind, (blk.offset + 1) * 8 + f.bit, f.width, `field:${blk.name}`);
  }
  return { bodyBytes: layout.bodyBytes, controls: [], regions: kindsToRegions(kind, status) };
}

/** Byte regions from a legacy record layout (padding included), labelled by parameter set (the key prefix). */
function legacyLayoutProgress(layout: LegacyLayout, status: 'confirmed' | 'candidate'): ModelProgress {
  const kind: string[] = new Array<string>(layout.dataBytes + (layout.padBytes ?? 0)).fill('Reserved');
  for (const f of layout.fields) mark(kind, f.bit, f.width, `field:${f.key.split('.')[0]}`);
  for (const m of layout.morphLists ?? []) {
    mark(kind, m.countBit, m.countWidth, `field:${m.set} morph list`);
    mark(kind, m.entryBit, m.maxEntries * (m.paramBits + m.sourceBits + m.deltaBits), `field:${m.set} morph list`);
  }
  return { bodyBytes: kind.length, controls: [], regions: kindsToRegions(kind, status) };
}

/**
 * Returns the decode progress for any model — synthesized from the NS4 offset
 * map (Stage 4), from the generated firmware layout (Stage 3, Grand, Grand 2,
 * Piano 4/5/6, Electro 6/7, Organ 3, Wave 2) or legacy record layout (Stage 2 /
 * 2 EX, Electro 3 / 3 HP / 4, C2D, Wave, Lead 4, Lead A1), or curated from
 * MODEL_PROGRESS (every other model).
 */
export function getModelProgress(modelId: string): ModelProgress | undefined {
  if (modelId === 'stage-4') return getNs4Progress();
  const fw = FW_LAYOUTS[modelId];
  if (fw) return (_fwProgress[modelId] ??= layoutProgress(fw.layout, fw.status));
  const legacy = LEGACY_LAYOUTS[modelId];
  if (legacy) return (_fwProgress[modelId] ??= legacyLayoutProgress(legacy.layout, legacy.status));
  return MODEL_PROGRESS[modelId];
}

/**
 * Confirmed/candidate byte counts + control count + percent for a curated entry.
 *
 * The headline `pct` counts only **confirmed** region bytes — the bytes we can
 * decode into real parameter values — so the number means the same thing across
 * every model ("what OpenNord can actually read"). Candidate sections (identified
 * but not field-pinned) are reported separately as `candidateBytes` and still
 * render on the byte map; they don't inflate the headline.
 *
 * When a model has no `regions` (older entries, or controls localized without regions),
 * we fall back to counting the union of `controls` bytes as confirmed.
 */
export function summarizeProgress(
  p: ModelProgress,
): { coveredBytes: number; candidateBytes: number; controlCount: number; pct: number | null } {
  let coveredBytes: number;
  let candidateBytes = 0;

  if (p.regions && p.regions.length > 0) {
    const confirmed = new Set<number>();
    const candidate = new Set<number>();
    for (const r of p.regions) {
      const bucket = r.status === 'confirmed' ? confirmed : r.status === 'candidate' ? candidate : null;
      if (!bucket) continue;
      for (let b = r.start; b <= r.end; b++) bucket.add(b);
    }
    coveredBytes = confirmed.size;
    candidateBytes = candidate.size;
  } else {
    const seen = new Set<number>();
    for (const c of p.controls) for (const r of c.ranges) for (let b = r.start; b <= r.end; b++) seen.add(b);
    coveredBytes = seen.size;
  }

  return {
    coveredBytes,
    candidateBytes,
    controlCount: p.controls.length,
    pct: p.bodyBytes ? Math.round((coveredBytes / p.bodyBytes) * 100) : null,
  };
}

/**
 * Parameters a firmware layout reads, counted like the Stage 4's {@link NS4_PARAM_COUNT}:
 * each firmware parameter once, however many layers, slots or sections repeat it
 * (Wave 2 stores its parameters once per slot, Grand 2 per layer). Sub-fields (the
 * Electro 7's `<knob>.pedalAssign` / `.wheelAssign` flags) belong to their knob, an
 * inline morph delta (Lead A1, Wave, Stage 2) to the parameter it modulates, and a
 * second stored copy (the C2D's repeated containers) to its first copy.
 */
function distinctParams(layout: FwLayout | LegacyLayout): number {
  const params = layout.fields.filter((f) =>
    f.key.split('.').length === 2 && !('deltaOf' in f && f.deltaOf) && !('copyOf' in f && f.copyOf));
  // Legacy records name fields by descriptor; a set stored more than once shares its
  // descriptor ids. A layout's `sets` names them (the Electro 3's presets, the C2D's
  // manuals, the Wave's and Stage 2's slots); a trailing I/II or digit (the Electro 4's
  // and Stage 2's Preset I/II, the Electro 4's blockX1/X2) marks the rest.
  const sets = 'sets' in layout ? layout.sets : undefined;
  const setOf = (prefix: string) => (sets?.[prefix] ?? prefix).replace(/(II?|\d)$/, '');
  const ident = (f: (typeof params)[number]) => ('id' in f ? `${setOf(f.key.split('.')[0])}#${f.id}` : f.name);
  return new Set(params.map(ident)).size;
}

export function decodeForModel(modelId: string): ModelDecode {
  const decoder = DECODER_BY_ID[modelId];
  if (decoder === 'full') {
    return { status: 'full', paramCount: NS4_PARAM_COUNT, bodyBytes: NS4_BODY_BYTES, coveredBytes: 0, candidateBytes: 0, controlCount: NS4_PARAM_COUNT, pct: 100, fullMap: true };
  }
  const prog = getModelProgress(modelId);
  const summary = prog ? summarizeProgress(prog) : { coveredBytes: 0, candidateBytes: 0, controlCount: 0, pct: null };
  if (decoder === 'partial') {
    const layout = (FW_LAYOUTS[modelId] ?? LEGACY_LAYOUTS[modelId])?.layout;
    const paramCount = layout ? distinctParams(layout) : null;
    const fullMap = !!layout && !(modelId in NOT_FULL_MAP);
    return { status: 'partial', paramCount, bodyBytes: prog?.bodyBytes ?? null, ...summary, fullMap };
  }
  // Undecoded: 'started' once a control is localized in coverage-data, else 'none'.
  return {
    status: summary.controlCount > 0 ? 'started' : 'none',
    paramCount: null,
    bodyBytes: prog?.bodyBytes ?? null,
    ...summary,
    fullMap: false,
  };
}

export const DECODE_LABEL: Record<DecodeStatus, string> = {
  full: 'Fully decoded',
  partial: 'Partly decoded',
  started: 'Some parameters mapped',
  none: 'Not decoded yet',
};
