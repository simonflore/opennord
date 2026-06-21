/**
 * Curated per-model decode progress — the checked-in "state" you maintain as you
 * process contribution bundles. No backend: localize a control to its bytes,
 * add an entry here, and the coverage map (contribute landing + compatibility
 * matrix) updates.
 *
 * Workflow: open a contribution JSON, decide which body bytes a labeled change
 * occupies (the bundle already gives candidate `ranges` per entry), then add a
 * `MappedControl`. `bodyBytes` is the model's body size — read it from any export
 * (file length − 44-byte CBIN header) the first time you touch a model.
 *
 * Stage 4 is NOT listed here — it's fully decoded from the offset map already.
 */

export interface MappedControl {
  /** What the control is, e.g. "Filter cutoff" or "CC 70". */
  label: string;
  /** Body-relative byte ranges it occupies (same shape as a contribution entry). */
  ranges: Array<{ start: number; end: number }>;
}

export interface ModelProgress {
  /** Total body size in bytes (file length − 44). null until a file is measured. */
  bodyBytes: number | null;
  /** Controls localized to bytes so far. */
  controls: MappedControl[];
}

// Keyed by model id (clavia/partitions.ts). Add models + controls as you process
// contributions. Example (delete when you add a real one):
//   'electro-6': {
//     bodyBytes: 1234,
//     controls: [{ label: 'Organ drawbar 1', ranges: [{ start: 39, end: 39 }] }],
//   },
export const MODEL_PROGRESS: Record<string, ModelProgress> = {};
