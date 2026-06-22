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

// Keyed by model id (clavia/partitions.ts). Add models + controls as you process
// contributions. Example (delete when you add a real one):
//   'electro-6': {
//     bodyBytes: 1234,
//     controls: [{ label: 'Organ drawbar 1', ranges: [{ start: 39, end: 39 }] }],
//   },
export const MODEL_PROGRESS: Record<string, ModelProgress> = {
  'electro-6': {
    bodyBytes: 211,
    controls: [
      { label: 'Upper drawbars (9 bars)', ranges: [{ start: 143, end: 147 }] },
      { label: 'Lower drawbars (9 bars)', ranges: [{ start: 158, end: 162 }] },
      { label: 'LFO / synth enable',      ranges: [{ start: 39,  end: 39  }] },
      { label: 'LFO rate + depth (16-bit)',ranges: [{ start: 7,   end: 8   }] },
      { label: 'Piano vibrato apply',      ranges: [{ start: 73,  end: 73  }] },
      { label: 'Global LFO active flag',   ranges: [{ start: 6,   end: 6   }] },
    ],
    regions: [
      { start: 0,   end: 4,   label: 'Header prefix',            status: 'constant'  },
      { start: 5,   end: 8,   label: 'Global / LFO params',      status: 'candidate' },
      { start: 9,   end: 19,  label: '',                          status: 'constant'  },
      { start: 20,  end: 28,  label: 'Organ control (B)',         status: 'candidate' },
      { start: 29,  end: 37,  label: '',                          status: 'constant'  },
      { start: 38,  end: 50,  label: 'Synth / mod engine (C)',    status: 'candidate' },
      { start: 51,  end: 61,  label: '',                          status: 'constant'  },
      { start: 62,  end: 75,  label: 'Piano section (D)',         status: 'candidate' },
      { start: 76,  end: 93,  label: '',                          status: 'constant'  },
      { start: 94,  end: 94,  label: 'Unknown flag',              status: 'unknown'   },
      { start: 95,  end: 103, label: '',                          status: 'constant'  },
      { start: 104, end: 104, label: 'Section flag',              status: 'unknown'   },
      { start: 105, end: 113, label: '',                          status: 'constant'  },
      { start: 114, end: 114, label: 'Section flag',              status: 'unknown'   },
      { start: 115, end: 123, label: '',                          status: 'constant'  },
      { start: 124, end: 125, label: 'Unknown 2-byte field',      status: 'unknown'   },
      { start: 126, end: 142, label: '',                          status: 'constant'  },
      { start: 143, end: 147, label: 'Upper drawbars',            status: 'confirmed' },
      { start: 148, end: 157, label: '',                          status: 'constant'  },
      { start: 158, end: 162, label: 'Lower drawbars',            status: 'confirmed' },
      { start: 163, end: 185, label: '',                          status: 'constant'  },
      { start: 186, end: 186, label: 'Unknown flag',              status: 'unknown'   },
      { start: 187, end: 200, label: '',                          status: 'constant'  },
      { start: 201, end: 201, label: 'Unknown flag',              status: 'unknown'   },
      { start: 202, end: 210, label: '',                          status: 'constant'  },
    ],
  },
};
