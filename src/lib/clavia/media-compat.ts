/**
 * Which pianos (`.npno`) and samples (`.nsmp*`) each Nord loads — one row per model, read from
 * the instrument firmware (static analysis of Nord's public OS updaters; knowledge only, see
 * docs/LEGAL.md). Every row names the OS that was read, the firmware function the answer comes
 * from and a confidence: `high` = seen in code or data, `medium` = inferred (pattern match,
 * shared code), `low` = a guess.
 *
 * Sources (local, never committed): the Stage 2/3/4 pass (docs/STAGE2-3-FIRMWARE.md §4,
 * docs/NPNO-WRITE.md) and the line-wide passes over the ColdFire models (E3, E3 HP, E4, E5,
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

/**
 * The models this table covers: the registry's ids plus `electro-7`, which the firmware pass
 * read but `NordModelId` doesn't list yet. (Once it does, the union is unchanged.)
 */
export type MediaModelId = NordModelId | 'electro-7';

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
/** "Piano is too big" above this many notes (Stage 4 `0xC00B5618`; same code elsewhere). */
const STROKES = 0x149f;

/** Piano 4 / 5 / 6, Grand, Grand 2: the same piano manager {4, 120, 5} and limits. */
function pianoLine(os: string, gate: string, confidence: Confidence, samples: readonly SampleGeneration[], sampleSource: string): MediaCompat {
  return {
    pianos: { versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os, source: gate, confidence },
    samples: { generations: samples, os, source: sampleSource, confidence: 'high' },
  };
}

export const MEDIA_COMPAT: Record<MediaModelId, MediaCompat> = {
  // ── Stage line (docs/STAGE2-3-FIRMWARE.md §4, docs/NPNO-WRITE.md) ──────────────────────────
  'stage-4': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os: '1.66', confidence: 'high',
      source: 'gate 0xC00B92E4; manager {4, 120, 5} 0xC0249AC4; voice table 0xC00B47B8; stroke limit 0xC00B5618',
    },
    samples: { generations: [3, 4], os: '1.66', confidence: 'high', source: 'version map {8,11,30,40} + generation 3–4 check 0xC01D7A2C' },
  },
  'stage-3': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x6000, maxStrokes: STROKES, os: '2.64', confidence: 'high',
      source: 'gate 0xC011A4EC; manager 0xC0113814; voice table 0xC0119040; stroke limit 0xC01170EC',
      note: 'NSM offers v6 only on OS ≥ 1.61 (0x1001AFCEC); older systems get the v5 partition',
    },
    samples: { generations: [3], os: '2.64', confidence: 'high', source: 'docs/STAGE2-3-FIRMWARE.md §4 Samples', note: '`.nsmp4` is refused; NSM converts `.nsmp` on the fly' },
  },
  'stage-2': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '3.00', confidence: 'high',
      source: 'gate 0x30175C08; manager 0x30170C2E → 0x301745DC(…, 5, 0x78); stroke limit 0x30173736',
      note: 'NSM offers v6 only on OS ≥ 2.29 (0x1000A9FA4); older systems get the v5 partition',
    },
    samples: { generations: [1, 2], os: '3.00', confidence: 'high', source: 'docs/STAGE2-3-FIRMWARE.md §4 Samples' },
  },
  'stage-2-ex': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '3.00', confidence: 'medium',
      source: 'Stage 2 OS 3.00 (same product id 0x21 and OS as the Stage 2)',
    },
    samples: { generations: [1, 2], os: '3.00', confidence: 'medium', source: 'Stage 2 OS 3.00 (same OS as the Stage 2)' },
    note: 'not read separately: the Stage 2 EX runs the Stage 2 OS',
  },
  'stage-classic': { pianos: 'unknown', samples: 'unknown', note: 'OS 5.08 not analysed' },
  'stage-ex': { pianos: 'unknown', samples: 'unknown', note: 'OS 6.08 not analysed' },

  // ── ColdFire Electro / Piano / C2D / Wave ───────────────────────────────────────────────────
  'electro-3': {
    pianos: {
      versions: [v4, v5], os: '3.14', confidence: 'high', source: 'gate FUN_300422F8 (header, metadata, directory each 0x440 or 0x450)',
      note: 'NSM\'s CElectro3_PreNPNOv5 covers OS 1.00–2.06, which likely predate v5 support (older images not read)',
    },
    samples: { generations: [1, 2], os: '3.14', confidence: 'high', source: 'FUN_3004B84A (NWS v8/v11 only)' },
  },
  'electro-3-hp': {
    pianos: { versions: [v5], os: '3.16', confidence: 'high', source: 'gate FUN_3004283E (0x450 only)' },
    samples: { generations: [1, 2], os: '3.16', confidence: 'high', source: 'FUN_3004BD74 (NWS v8/v11 only)' },
  },
  'electro-4': {
    pianos: { versions: [v5], os: '1.22', confidence: 'high', source: 'gate FUN_30049D4E (0x450 only)' },
    samples: { generations: [1, 2], os: '1.22', confidence: 'high', source: 'FUN_30053768 (NWS v8/v11 only)' },
  },
  'electro-5': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '2.04', confidence: 'high',
      source: 'gates FUN_3011DB4E (npno) / FUN_3011E9AC (npdl); manager FUN_3011D590(…, 5, 0x78); Stage 2 voice table and stroke limit',
    },
    samples: {
      generations: [1, 2], os: '2.04', confidence: 'high', source: 'FUN_301344A6 / FUN_301342A8; version table 0x30227E6D',
      note: 'the table maps NSMP 30 → 3, but the loader takes generations 1–2 only: `.nsmp3` is refused',
    },
  },
  'piano-1': {
    pianos: {
      versions: [v5], os: '1.50', confidence: 'high', source: 'loader FUN_3004C442; generation 5 via FUN_30048240(2, 5, …)',
      note: '0x440 and older are "Unsupported"; 0x464 is unknown to the loader (status 4)',
    },
    samples: 'none',
    note: 'no sample library partition and no sample code',
  },
  'piano-2': {
    pianos: {
      versions: [v5], os: '1.22', confidence: 'high', source: 'loader FUN_300C376A; generation 5 via FUN_300C0E2A(2, 5, …)',
      note: '0x464 is unknown to the loader (status 4)',
    },
    samples: { generations: [1, 2], os: '1.22', confidence: 'high', source: 'FUN_300D078C (NWS v8/v11; also `nwi` entries)' },
  },
  'piano-3': {
    pianos: {
      versions: [v5, v6], voiceTable: 0x4000, maxStrokes: STROKES, os: '2.04', confidence: 'high',
      source: 'gates FUN_3006338E (npno) / FUN_30063C08 (npdl); manager FUN_30062F08(…, 5, 0x78)',
    },
    samples: { generations: [1, 2], os: '2.04', confidence: 'high', source: 'FUN_300715FA; version table 0x301241B4 (8 → 1, 11 → 2)' },
  },
  'c2d': {
    pianos: 'none', samples: 'none',
    note: 'OS 1.12: the Pipe loader FUN_3003B5A0 takes only an embedded CNSP 0x440 pipe, never a `.npno`; no sample code',
  },
  'c2': { pianos: 'unknown', samples: 'unknown', note: 'not analysed (the C2D was)' },
  'wave': {
    pianos: 'none',
    samples: { generations: [1, 2], os: '2.14', confidence: 'high', source: 'FUN_3002B990 (NWS v8/v11; also `nwi` entries)' },
    note: 'no piano code',
  },

  // ── ARM keyboards ───────────────────────────────────────────────────────────────────────────
  'electro-6': {
    pianos: {
      versions: [v5, v6], os: '2.66', confidence: 'high',
      source: 'gate FUN_c00d5828 (Stage 3 ladder); manager {4, 120, 5} at c00005e8',
      note: 'voice table and stroke limit not read on this model',
    },
    samples: {
      generations: [3], os: '2.66', confidence: 'medium', source: 'Stage 3 version map {8 → 1, 11 → 2, 30 → 3} at c01bc870',
      note: 'the generation check itself was not located',
    },
  },
  'electro-7': {
    pianos: {
      versions: [v5, v6], os: '1.30', confidence: 'medium',
      source: 'gate FUN_c0158fe0 (ladder up to 0x464); manager {2, 120, 5} at c000c794',
      note: 'voice table and stroke limit not read on this model',
    },
    samples: 'unknown',
    note: 'samples: a {8, 11, 30, 40} map exists at c04bfd24 but no check using it was located',
  },
  'organ-3': { pianos: 'none', samples: 'none', note: 'OS 1.00: only Program, Live and Settings partitions (FUN_c0002e9c)' },
  'wave-2': {
    pianos: 'none',
    samples: 'unknown',
    note: 'OS 1.24: no pianos; samples: a {8, 11, 30, 40} map exists at c01e1040 but no generation check was located (NSM treats it as `.nsmp3`)',
  },

  // ── Piano line (Piano 4/5/6, Grand, Grand 2) ────────────────────────────────────────────────
  'piano-4': pianoLine('2.66', 'gate FUN_c00ae1a4 (= Stage 3 0xC011A4EC); manager c00002a4 → FUN_c00a7648; stroke limit FUN_c00aa8e8', 'high',
    [3], 'version map c00c3428 + `cmp #3` at c0036220'),
  'grand': pianoLine('1.68', 'compare pattern at c00b75fc (not decompiled); manager c00002a4', 'medium',
    [3], 'version map c00cc66c + generation-3 check at c003962c'),
  'piano-5': pianoLine('1.34', 'compare pattern at c0083f6c / c0088f04 (not decompiled); manager near c01379c4', 'medium',
    [3, 4], 'Stage 4 map + generation 3–4 check at c0109f50'),
  'piano-6': pianoLine('1.20', 'gate FUN_c0095a64 (thresholds 0x423–0x464); stroke limit FUN_c00a1e5c', 'high',
    [3, 4], 'Stage 4 map + generation 3–4 check at c01234ac'),
  'grand-2': pianoLine('1.22', 'compare pattern at c0095a04 / c00980e8 (not decompiled); manager near c0177cec', 'medium',
    [3, 4], 'Stage 4 map + generation 3–4 check at c0123620'),

  // ── Leads: three partitions (Program, Performance, Settings) ────────────────────────────────
  'lead-4': { pianos: 'none', samples: 'none', note: 'OS 1.32: Program, Performance and Settings only (FUN_c000bf58)' },
  'lead-a1': { pianos: 'none', samples: 'none', note: 'OS 1.36: Program, Performance and Settings only (FUN_c0013728)' },
};

/** The row for a model; a model this table doesn't know reads as `unknown`. */
export function mediaCompat(model: MediaModelId): MediaCompat {
  return MEDIA_COMPAT[model] ?? { pianos: 'unknown', samples: 'unknown' };
}

/** `0x450` → 5. */
export function pianoVersionNumber(v: number): number | undefined {
  return ({ [v4]: 4, [v5]: 5, [v6]: 6 } as Record<number, number>)[v];
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
