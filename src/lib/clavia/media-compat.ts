/**
 * Which pianos (`.npno`) and samples (`.nsmp*`) each Nord loads — one row per model, read from
 * the instrument OS (knowledge only, see
 * docs/LEGAL.md). Every row names the OS that was read, the firmware function the answer comes
 * from and a confidence: `high` = seen in code or data, `medium` = inferred (pattern match,
 * shared code), `low` = a guess.
 *
 * Sources (local, never committed): the Stage 2/3/4 pass (the maintainers’ notes,
 * the maintainers’ notes) and the line-wide passes over the ColdFire models (E3, E3 HP, E4, E5,
 * Piano 1/2/3, C2D, Wave), the ARM keyboards (Electro 6/7, Organ 3, Wave 2), the piano line
 * (Piano 4/5/6, Grand, Grand 2) and the Leads, section "Pianos and samples" of each.
 *
 * Partitions, program tags and product ids stay in `partitions.ts`; this table only says what a
 * model's piano and sample partitions accept. Used by `ns4/nsp-check.ts` (`model` option) and
 * `ns4/nsp-write.ts` (`buildNpno`'s `model`).
 *
 * Dependency direction: clavia knows nothing of the ns4 codecs, so sample targets are plain
 * numbers here (they match `ns4/nsmp-convert` `TargetCodec`).
 */
import type { NordModelId } from './partitions';

/** The models this table covers: every registry id. */
export type MediaModelId = NordModelId;

export type Confidence = 'high' | 'medium' | 'low';

/** CNSP piano versions (header +0x04, metadata +0x16, directory +0x61C): v4, v5, v6. */
export const CNSP_VERSION = { v4: 0x440, v5: 0x450, v6: 0x464 } as const;
export type CnspVersion = (typeof CNSP_VERSION)[keyof typeof CNSP_VERSION];

/**
 * Nord sample generation as the firmware numbers it (its version → generation map is
 * {NWS v8 → 1, NWS v11 → 2, NSMP 30 → 3, NSMP 40 → 4}): 1 = `.nsmp` with an NWS v8 body
 * (Library 1.x), 2 = `.nsmp` with an NWS v11 body (Library 2.0), 3 = `.nsmp3`, 4 = `.nsmp4`.
 */
export type SampleGeneration = 1 | 2 | 3 | 4;

export interface PianoAcceptance {
  /** CNSP versions the piano gate loads (header, metadata and directory versions alike). */
  versions: readonly CnspVersion[];
  /**
   * Voice-table entries every loaded piano shares; a piano needs one per note (stroke).
   * Absent where the firmware pass didn't establish it.
   */
  voiceTable?: number;
  /** Most notes one piano may have ("Piano is too big"). Absent where not established. */
  maxStrokes?: number;
  /** OS version that was read. */
  os: string;
  /** Firmware functions the row comes from. */
  source: string;
  confidence: Confidence;
  note?: string;
}

export interface SampleAcceptance {
  generations: readonly SampleGeneration[];
  os: string;
  source: string;
  confidence: Confidence;
  note?: string;
}

/** `none`: the firmware has no such section; `unknown`: not established (no row was read). */
export interface MediaCompat {
  pianos: PianoAcceptance | 'none' | 'unknown';
  samples: SampleAcceptance | 'none' | 'unknown';
  /** Why a `none`/`unknown` is what it is. */
  note?: string;
}

const { v4, v5, v6 } = CNSP_VERSION;
/** "Piano is too big" above this many notes (Stage 4; same code elsewhere). */
const STROKES = 0x149f;

/** Piano 4 / 5 / 6, Grand, Grand 2: the same piano manager {4, 120, 5} and limits. */
function pianoLine(os: string, gate: string, confidence: Confidence, samples: readonly SampleGeneration[], sampleSource: string): MediaCompat {
  return {
    pianos: { versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os, source: gate, confidence },
    samples: { generations: samples, os, source: sampleSource, confidence: 'high' },
  };
}

export const MEDIA_COMPAT: Record<MediaModelId, MediaCompat> = {
  // ── Stage line ──────────────────────────
  'stage-4': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os: '1.66', confidence: 'high',
      source: 'gate; manager {4, 120, 5}; voice table; stroke limit',
    },
    samples: { generations: [3, 4], os: '1.66', confidence: 'high', source: 'version map {8,11,30,40} + generation 3–4 check' },
  },
  'stage-3': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os: '2.64', confidence: 'high',
      source: 'gate; manager; voice table; stroke limit',
      note: 'NSM offers v6 only on OS ≥ 1.61; older systems get the v5 partition',
    },
    samples: { generations: [3], os: '2.64', confidence: 'high', source: 'the maintainers’ notes Samples', note: '`.nsmp4` is refused; NSM converts `.nsmp` on the fly' },
  },
  'stage-2': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '3.00', confidence: 'high',
      source: 'gate; manager →(…, 5, 0x78); stroke limit',
      note: 'NSM offers v6 only on OS ≥ 2.29; older systems get the v5 partition',
    },
    samples: { generations: [1, 2], os: '3.00', confidence: 'high', source: 'the maintainers’ notes Samples' },
  },
  'stage-2-ex': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '3.00', confidence: 'medium',
      source: 'Stage 2 OS 3.00 (same product id 0x21 and OS as the Stage 2)',
    },
    samples: { generations: [1, 2], os: '3.00', confidence: 'medium', source: 'Stage 2 OS 3.00 (same OS as the Stage 2)' },
    note: 'not read separately: the Stage 2 EX runs the Stage 2 OS',
  },
  'stage-classic': {
    pianos: {
      versions: [v4, v5], os: '5.08', confidence: 'high', source: 'piano gate in the OS 5.08 image',
      note: 'also loads the older CNSP 0x423–0x42F and 0x430 pianos; 0x464 (v6) is refused',
    },
    samples: 'none',
    note: 'no sample library partition',
  },
  'stage-ex': {
    pianos: {
      versions: [v4, v5], os: '6.08', confidence: 'high', source: 'piano gate in the OS 6.08 image',
      note: 'also loads the older CNSP 0x423–0x42F and 0x430 pianos; 0x464 (v6) is refused',
    },
    samples: 'none',
    note: 'no sample library partition',
  },

  // ── ColdFire Electro / Piano / C2D / Wave ───────────────────────────────────────────────────
  'electro-3': {
    pianos: {
      versions: [v4, v5], os: '3.14', confidence: 'high', source: 'gate (header, metadata, directory each 0x440 or 0x450)',
      note: 'NSM\'s CElectro3_PreNPNOv5 covers OS 1.00–2.06, which likely predate v5 support (older images not read)',
    },
    samples: { generations: [1, 2], os: '3.14', confidence: 'high', source: '(NWS v8/v11 only)' },
  },
  'electro-3-hp': {
    pianos: { versions: [v5], os: '3.16', confidence: 'high', source: 'gate (0x450 only)' },
    samples: { generations: [1, 2], os: '3.16', confidence: 'high', source: '(NWS v8/v11 only)' },
  },
  'electro-4': {
    pianos: { versions: [v5], os: '1.22', confidence: 'high', source: 'gate (0x450 only)' },
    samples: { generations: [1, 2], os: '1.22', confidence: 'high', source: '(NWS v8/v11 only)' },
  },
  'electro-5': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '2.04', confidence: 'high',
      source: 'gates (npno) / (npdl); manager(…, 5, 0x78); Stage 2 voice table and stroke limit',
    },
    samples: {
      generations: [1, 2], os: '2.04', confidence: 'high', source: 'version table',
      note: 'the table maps NSMP 30 → 3, but the loader takes generations 1–2 only: `.nsmp3` is refused',
    },
  },
  'piano-1': {
    pianos: {
      versions: [v5], os: '1.50', confidence: 'high', source: 'loader; generation 5 via(2, 5, …)',
      note: '0x440 and older are "Unsupported"; 0x464 is unknown to the loader (status 4)',
    },
    samples: 'none',
    note: 'no sample library partition and no sample code',
  },
  'piano-2': {
    pianos: {
      versions: [v5], os: '1.22', confidence: 'high', source: 'loader; generation 5 via(2, 5, …)',
      note: '0x464 is unknown to the loader (status 4)',
    },
    samples: { generations: [1, 2], os: '1.22', confidence: 'high', source: '(NWS v8/v11; also `nwi` entries)' },
  },
  'piano-3': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '2.04', confidence: 'high',
      source: 'gates (npno) / (npdl); manager(…, 5, 0x78)',
    },
    samples: { generations: [1, 2], os: '2.04', confidence: 'high', source: 'version table (8 → 1, 11 → 2)' },
  },
  'c2d': {
    pianos: 'none', samples: 'none',
    note: 'OS 1.12: the Pipe loader takes only an embedded CNSP 0x440 pipe, never a `.npno`; no sample code',
  },
  'c2': { pianos: 'unknown', samples: 'unknown', note: 'OS 2.00 read for its partitions and program record; its Pipe loader was not analysed (the C2D\'s takes only an embedded CNSP 0x440)' },
  'wave': {
    pianos: 'none',
    samples: { generations: [1, 2], os: '2.14', confidence: 'high', source: '(NWS v8/v11; also `nwi` entries)' },
    note: 'no piano code',
  },

  // ── ARM keyboards ───────────────────────────────────────────────────────────────────────────
  'electro-6': {
    pianos: {
      versions: [v5, v6], os: '2.66', confidence: 'high',
      source: 'gate (Stage 3 ladder); manager {4, 120, 5}',
      note: 'voice table and stroke limit not read on this model',
    },
    samples: {
      generations: [3], os: '2.66', confidence: 'medium', source: 'Stage 3 version map {8 → 1, 11 → 2, 30 → 3}',
      note: 'the generation check itself was not located',
    },
  },
  'electro-7': {
    pianos: {
      versions: [v5, v6], os: '1.30', confidence: 'medium',
      source: 'gate (ladder up to 0x464); manager {2, 120, 5}',
      note: 'voice table and stroke limit not read on this model',
    },
    samples: {
      generations: [3, 4], os: '1.30', confidence: 'high',
      source: 'Stage 4 map {8,11,30,40} + generation 3–4 check',
    },
  },
  'organ-3': { pianos: 'none', samples: 'none', note: 'OS 1.00: only Program, Live and Settings partitions' },
  c1: { pianos: 'none', samples: 'none', note: 'C1 OS 1.12: no piano or sample engine (and no USB transfer)' },
  'wave-2': {
    pianos: 'none',
    samples: 'unknown',
    note: 'OS 1.24: no pianos; samples: a {8, 11, 30, 40} map exists but no generation check was located (NSM treats it as `.nsmp3`)',
  },

  // ── Piano line (Piano 4/5/6, Grand, Grand 2) ────────────────────────────────────────────────
  'piano-4': pianoLine('2.66', 'gate (= Stage 3); manager →; stroke limit', 'high',
    [3], 'version map + `cmp #3`'),
  'grand': pianoLine('1.68', 'compare pattern (not confirmed in code); manager', 'medium',
    [3], 'version map + generation-3 check'),
  'piano-5': pianoLine('1.34', 'compare pattern (not confirmed in code); manager', 'medium',
    [3, 4], 'Stage 4 map + generation 3–4 check'),
  'piano-6': pianoLine('1.20', 'gate (thresholds 0x423–0x464); stroke limit', 'high',
    [3, 4], 'Stage 4 map + generation 3–4 check'),
  'grand-2': pianoLine('1.22', 'compare pattern (not confirmed in code); manager', 'medium',
    [3, 4], 'Stage 4 map + generation 3–4 check'),

  // ── Leads: three partitions (Program, Performance, Settings) ────────────────────────────────
  'lead-4': { pianos: 'none', samples: 'none', note: 'OS 1.32: Program, Performance and Settings only' },
  'lead-a1': { pianos: 'none', samples: 'none', note: 'OS 1.36: Program, Performance and Settings only' },
};

/** The row for a model; a model this table doesn't know reads as `unknown`. */
export function mediaCompat(model: MediaModelId): MediaCompat {
  return MEDIA_COMPAT[model] ?? { pianos: 'unknown', samples: 'unknown' };
}

const VERSION_NUMBER: Record<number, number> = { [v4]: 4, [v5]: 5, [v6]: 6 };

/** `0x450` → 5; undefined for a version that isn't v4, v5 or v6. */
export function pianoVersionNumber(v: number): number | undefined {
  return VERSION_NUMBER[v];
}

/** The CNSP version to write for a model: the newest it loads; undefined if it loads none (or isn't known). */
export function pianoWriteVersion(model: MediaModelId): CnspVersion | undefined {
  const p = mediaCompat(model).pianos;
  return typeof p === 'object' ? p.versions.reduce((a, b) => (b > a ? b : a)) : undefined;
}

/**
 * The sample generation to convert to for a model, as a `convertNsmp` target: the newest it
 * loads (`4` = `.nsmp4`, `3` = `.nsmp3`, `2` = `.nsmp`, which OpenNord writes with the v11
 * body every generation-1/2 model takes). Undefined when the model loads no samples or it's
 * not established which.
 */
export function sampleTarget(model: MediaModelId): 2 | 3 | 4 | undefined {
  const s = mediaCompat(model).samples;
  if (typeof s !== 'object') return undefined;
  const newest = Math.max(...s.generations);
  return newest <= 2 ? 2 : (newest as 3 | 4);
}

/** Whether a model takes a sample of this generation; `undefined` when not established. */
export function acceptsSample(model: MediaModelId, generation: SampleGeneration): boolean | undefined {
  const s = mediaCompat(model).samples;
  if (s === 'unknown') return undefined;
  return s !== 'none' && s.generations.includes(generation);
}
