/**
 * Curated per-model decode progress, maintained by hand as fields are mapped (from
 * firmware, NSM or real files). The compatibility matrix renders it: add a
 * `MappedControl` when a field's bytes are known. `bodyBytes` is the model's body
 * size (file length − 44-byte CBIN header).
 *
 * Stage 4 is NOT listed here — it's fully decoded from the offset map already.
 * Nor are the firmware-layout models (Grand, Grand 2, Piano 4/5/6, Electro 6/7,
 * Organ 3, Wave 2) or the legacy-record models (Stage 2 / 2 EX, Electro 3 / 3 HP /
 * 4 / 5, Piano 1 / 2 / 3, Stage Classic / EX, C2, C2D, Wave,
 * Lead 4, Lead A1):
 * their byte maps are synthesized from the generated layouts in coverage.ts.
 */

export interface MappedControl {
  /** What the control is, e.g. "Filter cutoff" or "CC 70". */
  label: string;
  /** Body-relative byte ranges it occupies. */
  ranges: Array<{ start: number; end: number }>;
}

/**
 * A named byte region for the body-coverage visual map.
 * `constant`  — same value across corpus (structural padding / fixed fields).
 * `confirmed` — mapped to a named control with known encoding.
 * `candidate` — section identified but individual field bits not yet pinned.
 * `unknown`   — varies in the corpus but not yet attributed to a section.
 * `reserved`  — known to hold no setting: a firmware layout's format version, block
 *               lengths and the bits it leaves unused. Not a gap: nothing is left to decode there.
 */
export type RegionStatus = 'constant' | 'confirmed' | 'candidate' | 'unknown' | 'reserved';

export interface BodyRegion {
  start: number;
  end: number;
  label: string;
  status: RegionStatus;
}

export interface ModelProgress {
  /** Total body size in bytes (file length − 44). null until a file is measured. */
  bodyBytes: number | null;
  /** Controls localized to bytes so far. */
  controls: MappedControl[];
  /** Named byte regions for the coverage visual map (optional). */
  regions?: BodyRegion[];
}

// Keyed by model id (clavia/partitions.ts). Add models + controls as fields are
// mapped. Example:
//   'some-model': {
//     bodyBytes: 1234,
//     controls: [{ label: 'Organ drawbar 1', ranges: [{ start: 39, end: 39 }] }],
//   },
export const MODEL_PROGRESS: Record<string, ModelProgress> = {};
