/**
 * Curated per-model decode progress, maintained by hand as fields are mapped (from
 * firmware, NSM or real files). The compatibility matrix renders it: add a
 * `MappedControl` when a field's bytes are known. `bodyBytes` is the model's body
 * size (file length − 44-byte CBIN header).
 *
 * Stage 4 is NOT listed here — it's fully decoded from the offset map already.
 * Nor are the firmware-layout models (Grand, Grand 2, Piano 4/5/6, Electro 6/7,
 * Organ 3, Wave 2) or the legacy-record models (Stage 2 / 2 EX, Electro 4 / 5,
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
 */
export type RegionStatus = 'constant' | 'confirmed' | 'candidate' | 'unknown';

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
export const MODEL_PROGRESS: Record<string, ModelProgress> = {
  'wave': {
    bodyBytes: 306,
    controls: [
      { label: 'Slot 1 oscillator/waveform select (enum)',          ranges: [{ start: 0,   end: 1   }] },
      { label: 'Slot 2 oscillator/waveform select (enum)',          ranges: [{ start: 140, end: 141 }] },
      { label: 'Slot 1 enum param (default 7)',                     ranges: [{ start: 45,  end: 46  }] },
      { label: 'Slot 2 enum param (default 7)',                     ranges: [{ start: 185, end: 186 }] },
      { label: 'Slot 1 stepped param (even-only steps)',            ranges: [{ start: 39,  end: 40  }] },
      { label: 'Slot 2 stepped param (even-only steps)',            ranges: [{ start: 179, end: 180 }] },
      { label: 'Slot 1 selector enum2 (0-6) / enum3 (0-3)',         ranges: [{ start: 49, end: 50 }, { start: 84, end: 85 }] },
      { label: 'Slot 2 selector enum2 (0-6) / enum3 (0-3)',         ranges: [{ start: 189, end: 190 }, { start: 224, end: 225 }] },
      { label: 'Slot 1 voice params (osc/filter/env/LFO, packed)',  ranges: [{ start: 0,   end: 116 }] },
      { label: 'Slot 2 voice params (mirror of slot 1, +140)',      ranges: [{ start: 140, end: 256 }] },
      { label: 'Global / FX / master tail',                         ranges: [{ start: 280, end: 290 }] },
      { label: 'CBIN body checksum (trailing)',                     ranges: [{ start: 304, end: 306 }] },
    ],
    regions: [
      { start: 0,   end: 116, label: 'Slot 1 voice block (osc/filter/env/LFO)', status: 'candidate' },
      { start: 116, end: 140, label: '',                                        status: 'constant'  },
      { start: 140, end: 256, label: 'Slot 2 voice block (parallel to slot 1)', status: 'candidate' },
      { start: 256, end: 280, label: '',                                        status: 'constant'  },
      { start: 280, end: 290, label: 'Global / FX / master tail',               status: 'candidate' },
      { start: 290, end: 303, label: '',                                        status: 'constant'  },
      { start: 303, end: 304, label: 'byte[303] near-constant flag/padding',    status: 'unknown'   },
      { start: 304, end: 306, label: 'Body checksum (uint16)',                  status: 'candidate' },
    ],
  },
};
