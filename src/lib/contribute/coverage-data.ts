/**
 * Curated per-model decode progress, maintained by hand as fields are mapped (from
 * firmware, NSM or real files). The compatibility matrix renders it: add a
 * `MappedControl` when a field's bytes are known. `bodyBytes` is the model's body
 * size (file length − 44-byte CBIN header).
 *
 * Stage 4 is NOT listed here — it's fully decoded from the offset map already.
 * Nor are the firmware-layout models (Grand, Grand 2, Piano 4/5/6, Electro 6/7,
 * Organ 3, Wave 2) or the legacy-record models (Electro 3 / 3 HP / 4, C2D, Wave,
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
//   'electro-5': {
//     bodyBytes: 1234,
//     controls: [{ label: 'Organ drawbar 1', ranges: [{ start: 39, end: 39 }] }],
//   },
export const MODEL_PROGRESS: Record<string, ModelProgress> = {
  'electro-5': {
    bodyBytes: 103,
    controls: [
      { label: 'Upper drawbars (preset 1, primary)',          ranges: [{ start: 21, end: 25 }] },
      { label: 'Lower drawbars (preset 1, primary)',          ranges: [{ start: 28, end: 32 }] },
      { label: 'Upper drawbars (preset 2)',                   ranges: [{ start: 39, end: 43 }] },
      { label: 'Lower drawbars (preset 2)',                   ranges: [{ start: 45, end: 49 }] },
      { label: 'Pedal drawbars (9 bars, candidate)',          ranges: [{ start: 55, end: 59 }] },
      { label: 'Piano / sample section active (byte17 bit7)',  ranges: [{ start: 17, end: 17 }] },
      { label: 'Piano / sample model ID (high-entropy)',       ranges: [{ start: 7,  end: 12 }] },
      { label: 'Program type flags',                          ranges: [{ start: 0,  end: 0  }] },
      { label: 'Section enable nibble',                       ranges: [{ start: 6,  end: 6  }] },
      { label: 'Sample-section descriptor record (candidate)', ranges: [{ start: 83, end: 94 }] },
      { label: 'Trailing checksum / CRC (candidate)',          ranges: [{ start: 101, end: 102 }] },
    ],
    regions: [
      { start: 0,   end: 0,   label: 'Program type flags (9 unique values)',              status: 'candidate' },
      { start: 1,   end: 5,   label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 6,   end: 6,   label: 'Section enable nibble (0x01/0x00/0x40/0x27)',      status: 'candidate' },
      { start: 7,   end: 12,  label: 'Piano / sample model ID (6 bytes, high-entropy)',   status: 'confirmed' },
      { start: 13,  end: 13,  label: 'Single-bit flag (0x80 or 0x00)',                   status: 'candidate' },
      { start: 14,  end: 16,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 17,  end: 17,  label: 'Piano / sample section active (bit7)',              status: 'confirmed' },
      { start: 18,  end: 18,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 19,  end: 19,  label: 'Flag nibble (0x00 or 0x40)',                       status: 'candidate' },
      { start: 20,  end: 20,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 21,  end: 25,  label: 'Upper drawbars (preset 1, 9 nibbles, primary)',     status: 'confirmed' },
      { start: 26,  end: 26,  label: 'Sub-field nibble (0x20/0x00/0x14)',                status: 'candidate' },
      { start: 27,  end: 27,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 28,  end: 32,  label: 'Lower drawbars (preset 1, 9 nibbles, primary)',     status: 'confirmed' },
      { start: 33,  end: 33,  label: 'Sub-field nibble (0x20 or 0x00)',                  status: 'candidate' },
      { start: 34,  end: 34,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 35,  end: 35,  label: 'Nibble flag',                                      status: 'candidate' },
      { start: 36,  end: 38,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 39,  end: 43,  label: 'Upper drawbars (preset 2, 9 nibbles)',             status: 'confirmed' },
      { start: 44,  end: 44,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 45,  end: 49,  label: 'Lower drawbars (preset 2, 9 nibbles)',             status: 'confirmed' },
      { start: 50,  end: 50,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 51,  end: 51,  label: 'Nibble field',                                     status: 'candidate' },
      { start: 52,  end: 54,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 55,  end: 59,  label: 'Pedal drawbars (9 nibbles, candidate)',             status: 'candidate' },
      { start: 60,  end: 60,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 61,  end: 61,  label: 'Nibble flag (0x8 or 0x0 in hi bit)',               status: 'candidate' },
      { start: 62,  end: 70,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 71,  end: 74,  label: 'Extra nibble group',                               status: 'candidate' },
      { start: 75,  end: 75,  label: 'Constant 0x08 sentinel',                           status: 'constant'  },
      { start: 76,  end: 76,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 77,  end: 77,  label: 'Nibble flag (0x8 or 0x0)',                         status: 'candidate' },
      { start: 78,  end: 80,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 81,  end: 81,  label: 'Constant 0x08 sentinel',                           status: 'constant'  },
      { start: 82,  end: 82,  label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 83,  end: 94,  label: 'Sample-section descriptor record (bank ref + hash)',  status: 'candidate' },
      { start: 95,  end: 97,  label: 'Sample reference block tail (3 bytes)',             status: 'unknown'   },
      { start: 98,  end: 100, label: 'Constant 0x00',                                    status: 'constant'  },
      { start: 101, end: 102, label: 'Trailing checksum / CRC (2 bytes)',                 status: 'candidate' },
    ],
  },
};
