/**
 * Per-model body-decode status — the dedup map so contributors target models that
 * still need work instead of re-deriving what's already decoded.
 *
 * Stage 4 has a complete parameter map (the ns4decode-derived offset map, our
 * oracle). Stage 3 has a partial hand-built decoder. Every other model's progress
 * comes from `coverage-data.ts` — the curated state maintained by hand as fields
 * are mapped. We always know a model's body *size*, so even undecoded models
 * have a concrete target to fill.
 */
import { buildParamMap } from '../ns4/maps';
import { MODEL_PROGRESS, type ModelProgress, type BodyRegion } from './coverage-data';
import { decodeNs3 } from '../ns3/decode';
import { decodeNs2 } from '../ns2/decode';
import type { FwLayout } from '../clavia/block-chain';
import { NG_LAYOUT } from '../ng/layout.generated';
import { NP6_LAYOUT } from '../np6/layout.generated';
import { NE6_LAYOUT } from '../ne6/layout.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NO3_LAYOUT } from '../no3/layout.generated';
import { NW2_LAYOUT } from '../nw2/layout.generated';
import type { LegacyLayout } from '../clavia/legacy-record';
import { NL4_LAYOUT } from '../nl4/layout.generated';
import { NLA_LAYOUT } from '../nla/layout.generated';
import { NE4_LAYOUT } from '../ne4/layout.generated';

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
}

/** Distinct parameters in the Stage 4 map (each id may span multiple layers). */
export const NS4_PARAM_COUNT = new Set(NS4_PARAMS.map((p) => p.id)).size;

// Models with a (full/partial) decoder independent of contributions.
const DECODER_BY_ID: Record<string, 'full' | 'partial'> = {
  'stage-4': 'full',
  'stage-3': 'partial',
  'stage-2': 'partial', // ns2/decode.ts: engines/levels/drawbars/FX via the ns2 oracle
  // Firmware-layout readers (clavia/block-chain.ts), read-only, not yet checked on real files.
  'grand': 'partial',
  'piano-6': 'partial',
  'electro-6': 'partial',
  'electro-7': 'partial',
  'organ-3': 'partial',
  'wave-2': 'partial',
  // Legacy-record readers (clavia/legacy-record.ts), read-only.
  'electro-4': 'partial',
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

// ── Stage 2/3 coverage traced from the reader ────────────────────────────────
// The ns2/ns3 decoders read the program body directly (no internal slice), so a
// tracking Proxy records exactly which bytes a decode touches = the bytes the
// reader decodes. Tracing crafted synthetic inputs (varied fills × panel-flag
// values) fires every conditional branch, yielding the reader's full read
// footprint with no fixtures, no duplicated offset table, and no drift.
const CBIN_HEADER = 44;

function tracedReaderProgress(
  decode: (b: Uint8Array) => unknown, flagOffsets: number[],
): ModelProgress {
  const touched = new Set<number>();
  const record = (bytes: Uint8Array) => {
    const proxy = new Proxy(bytes, {
      get(t, prop, recv) {
        if (typeof prop === 'string') {
          const n = Number(prop);
          if (Number.isInteger(n) && n >= 0) touched.add(n);
        }
        return Reflect.get(t, prop, recv);
      },
    });
    try { decode(proxy as Uint8Array); } catch { /* garbage input may throw mid-parse; reads so far still count */ }
  };
  // Fire all branches: varied fills, and every panel/slot-flag value at the flag byte(s).
  for (const fill of [0x00, 0xff, 0xaa, 0x55]) {
    for (const flag of [0x00, 0x20, 0x40, 0x60, 0x80, 0xc0, 0xe0]) {
      const b = new Uint8Array(768).fill(fill);
      b[0x04] = 1; // content-version marker (selects the +0 offset path)
      for (const fo of flagOffsets) b[fo] = flag;
      record(b);
    }
  }
  const body = [...touched].filter((o) => o >= CBIN_HEADER).map((o) => o - CBIN_HEADER);
  if (body.length === 0) return { bodyBytes: null, controls: [], regions: [] };
  const bodyBytes = Math.max(...body) + 1;
  const covered = new Set(body);
  const regions = coveredToRegions(covered, bodyBytes, () => 'Decoded by reader');
  return { bodyBytes, controls: [], regions };
}

// ── Firmware-layout models: byte map synthesized from the generated layout ──
// Grand, Piano 6, Electro 6 and Wave 2 come from a high-confidence firmware map →
// 'confirmed' (the Electro 6 and Wave 2 chains also reproduce every anchor of the
// earlier corpus readers).
// Electro 7 and Organ 3 have a medium-confidence block order (not yet seen in a
// real file) → 'candidate', so they don't inflate the headline percentage.
const FW_LAYOUTS: Record<string, { layout: FwLayout; status: 'confirmed' | 'candidate' }> = {
  'grand': { layout: NG_LAYOUT, status: 'confirmed' },
  'piano-6': { layout: NP6_LAYOUT, status: 'confirmed' },
  'electro-6': { layout: NE6_LAYOUT, status: 'confirmed' },
  'electro-7': { layout: NE7_LAYOUT, status: 'candidate' },
  'organ-3': { layout: NO3_LAYOUT, status: 'candidate' },
  'wave-2': { layout: NW2_LAYOUT, status: 'confirmed' },
};
const _fwProgress: Record<string, ModelProgress> = {};

// ── Legacy-record models: byte map of the record data (file 0x1A on) ─────────
// Lead 4 (high) and Electro 4 (reproduces the corpus drawbar/sample anchors) →
// 'confirmed'; the Lead A1 alignment is unchecked against real files → 'candidate'.
// Lead 4 maps its program record (a performance is 7 common bytes + 4 of them).
const LEGACY_LAYOUTS: Record<string, { layout: LegacyLayout; status: 'confirmed' | 'candidate' }> = {
  'electro-4': { layout: NE4_LAYOUT, status: 'confirmed' },
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

/** Byte regions from a legacy record layout, labelled by parameter set (the key prefix). */
function legacyLayoutProgress(layout: LegacyLayout, status: 'confirmed' | 'candidate'): ModelProgress {
  const kind: string[] = new Array<string>(layout.dataBytes).fill('Reserved');
  for (const f of layout.fields) mark(kind, f.bit, f.width, `field:${f.key.split('.')[0]}`);
  for (const m of layout.morphLists ?? []) {
    mark(kind, m.countBit, m.countWidth, `field:${m.set} morph list`);
    mark(kind, m.entryBit, m.maxEntries * (m.paramBits + m.sourceBits + m.deltaBits), `field:${m.set} morph list`);
  }
  return { bodyBytes: layout.dataBytes, controls: [], regions: kindsToRegions(kind, status) };
}

let _ns3Progress: ModelProgress | undefined;
let _ns2Progress: ModelProgress | undefined;

/**
 * Returns the decode progress for any model — synthesized from the NS4 offset
 * map (Stage 4), traced from the reader (Stage 2/3), synthesized from the
 * generated firmware layout (Grand, Piano 6, Electro 6/7, Organ 3, Wave 2) or legacy
 * record layout (Electro 4, Lead 4, Lead A1), or curated from MODEL_PROGRESS
 * (every other model).
 */
export function getModelProgress(modelId: string): ModelProgress | undefined {
  if (modelId === 'stage-4') return getNs4Progress();
  if (modelId === 'stage-3') return (_ns3Progress ??= tracedReaderProgress(decodeNs3, [0x31, 0x1d]));
  if (modelId === 'stage-2') return (_ns2Progress ??= tracedReaderProgress(decodeNs2, [0x2e, 0x1a]));
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

export function decodeForModel(modelId: string): ModelDecode {
  const decoder = DECODER_BY_ID[modelId];
  if (decoder === 'full') {
    return { status: 'full', paramCount: NS4_PARAM_COUNT, bodyBytes: NS4_BODY_BYTES, coveredBytes: 0, candidateBytes: 0, controlCount: NS4_PARAM_COUNT, pct: 100 };
  }
  const prog = getModelProgress(modelId); // includes traced Stage 2/3 regions
  const summary = prog ? summarizeProgress(prog) : { coveredBytes: 0, candidateBytes: 0, controlCount: 0, pct: null };
  if (decoder === 'partial') {
    return { status: 'partial', paramCount: null, bodyBytes: prog?.bodyBytes ?? null, ...summary };
  }
  // Undecoded: 'started' once a control is localized in coverage-data, else 'none'.
  return {
    status: summary.controlCount > 0 ? 'started' : 'none',
    paramCount: null,
    bodyBytes: prog?.bodyBytes ?? null,
    ...summary,
  };
}

export const DECODE_LABEL: Record<DecodeStatus, string> = {
  full: 'Fully decoded',
  partial: 'Partly decoded',
  started: 'In progress',
  none: 'Not decoded yet — your captures build this',
};
