/**
 * Curated per-model decode progress, maintained by hand as fields are mapped (from
 * firmware, NSM or real files). The compatibility matrix renders it: add a
 * `MappedControl` when a field's bytes are known. `bodyBytes` is the model's body
 * size (file length − 44-byte CBIN header).
 *
 * Stage 4 is NOT listed here — it's fully decoded from the offset map already.
 * Nor are the firmware-layout models (Grand, Piano 6, Electro 6, Electro 7,
 * Organ 3, Wave 2): their byte maps are synthesized from the generated layouts
 * in coverage.ts.
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
  'lead-a1': {
    bodyBytes: 79,
    controls: [
      { label: 'Body header (high nibble of body[0])',                ranges: [{ start: 0,  end: 0  }] },
      { label: 'Layer on/off + volume (bitstream bits 4-11)',         ranges: [{ start: 0,  end: 1  }] },
      { label: '7-bit packed parameter stream',                       ranges: [{ start: 0,  end: 76 }] },
      { label: 'Oscillator + filter block (candidate)',               ranges: [{ start: 0,  end: 15 }] },
      { label: 'Amp + mod/filter envelope block (candidate)',         ranges: [{ start: 16, end: 31 }] },
      { label: 'LFO / arpeggiator block (candidate)',                 ranges: [{ start: 33, end: 47 }] },
      { label: 'Effects + voice/global block (candidate)',            ranges: [{ start: 51, end: 76 }] },
      { label: 'Body checksum (16-bit)',                              ranges: [{ start: 77, end: 78 }] },
    ],
    regions: [
      { start: 0,  end: 0,  label: 'Header nibble + layer on/off + volume (start)', status: 'confirmed' },
      { start: 1,  end: 1,  label: 'Volume (cont.) — bits 5-11 of the stream',     status: 'confirmed' },
      { start: 2,  end: 15, label: 'Osc+filter candidate cluster',                 status: 'candidate' },
      { start: 16, end: 31, label: 'Envelope candidate cluster (ADSR)',          status: 'candidate' },
      { start: 32, end: 32, label: '',                                           status: 'constant'  },
      { start: 33, end: 47, label: 'LFO/arp candidate cluster',                  status: 'candidate' },
      { start: 48, end: 50, label: '',                                           status: 'constant'  },
      { start: 51, end: 52, label: 'FX/voice candidate',                         status: 'candidate' },
      { start: 53, end: 53, label: '',                                           status: 'constant'  },
      { start: 54, end: 60, label: 'FX/voice candidate cluster',                 status: 'candidate' },
      { start: 61, end: 61, label: '',                                           status: 'constant'  },
      { start: 62, end: 70, label: 'FX/voice candidate cluster',                 status: 'candidate' },
      { start: 71, end: 71, label: '',                                           status: 'constant'  },
      { start: 72, end: 73, label: 'Global/voice candidate',                     status: 'candidate' },
      { start: 74, end: 75, label: '',                                           status: 'constant'  },
      { start: 76, end: 76, label: 'Tail param/flag bits',                       status: 'candidate' },
      { start: 77, end: 78, label: '16-bit body checksum',                       status: 'confirmed' },
    ],
  },
  'lead-4': {
    bodyBytes: 299,
    controls: [
      { label: 'CBIN checksum (2-byte LE trailer)',                          ranges: [{ start: 297, end: 298 }] },
      { label: 'Voice head selector (values 0-10 observed)',                 ranges: [{ start: 30,  end: 30  }] },
      { label: 'Voice/FX params (2 osc, filter, 2 env, 2 LFO, FX, arp)',     ranges: [{ start: 31,  end: 246 }] },
      { label: 'Enable flag (0/1 boolean)',                                  ranges: [{ start: 239, end: 239 }] },
      { label: 'Enum A (all 8 values observed)',                             ranges: [{ start: 245, end: 245 }] },
      { label: 'Stepped value B (0-20 observed)',                            ranges: [{ start: 248, end: 248 }] },
      { label: 'Morph/assign block (bit-packed)',                            ranges: [{ start: 248, end: 288 }] },
    ],
    regions: [
      // Re-censused 2026-07-04 over 1275 nl4s (factory banks 1-3 + artist
      // banks): the earlier "zero gap 103-237 / cluster C 238-264" split was a
      // small-corpus artifact — the whole 30-246 run varies.
      { start: 0,   end: 18,  label: 'Cluster A - header/category/global',     status: 'candidate' },
      { start: 19,  end: 19,  label: 'Cluster A field (version/enable flag)',  status: 'candidate' },
      { start: 20,  end: 21,  label: 'Cluster A packed fields',               status: 'candidate' },
      { start: 22,  end: 23,  label: 'Anchor/magic 0x80 0x5e (separator)',     status: 'candidate' },
      { start: 24,  end: 24,  label: 'Cluster A trailing packed byte',         status: 'candidate' },
      { start: 25,  end: 29,  label: '',                                       status: 'constant'  },
      { start: 30,  end: 30,  label: 'Voice head selector (0-10 observed)',    status: 'candidate' },
      { start: 31,  end: 238, label: 'Voice/FX params (bit-packed)',           status: 'candidate' },
      { start: 239, end: 239, label: 'Enable flag (0/1 boolean)',              status: 'candidate' },
      { start: 240, end: 244, label: 'Voice/FX packed fields',                 status: 'candidate' },
      { start: 245, end: 245, label: 'Enum A (all 8 values observed)',         status: 'candidate' },
      { start: 246, end: 246, label: 'Voice/FX packed field',                  status: 'candidate' },
      { start: 247, end: 247, label: '',                                       status: 'constant'  },
      { start: 248, end: 248, label: 'Stepped value B (0-20 observed)',        status: 'candidate' },
      { start: 249, end: 288, label: 'Morph/assign packed block',              status: 'candidate' },
      { start: 289, end: 296, label: '',                                       status: 'constant'  },
      { start: 297, end: 298, label: 'CBIN checksum (2-byte LE trailer)',      status: 'confirmed' },
    ],
  },
  'electro-4': {
    bodyBytes: 92,
    controls: [
      { label: 'Organ drawbars (preset 1, default slot)',      ranges: [{ start: 4,  end: 8  }] },
      { label: 'Organ drawbars (preset 2 / edited, active)',   ranges: [{ start: 16, end: 20 }] },
      { label: 'Organ drawbars (second default slot)',         ranges: [{ start: 25, end: 29 }] },
      { label: 'Organ section extra params (post-drawbar)',     ranges: [{ start: 20, end: 21 }] },
      { label: 'Section enable / program flags',               ranges: [{ start: 0,  end: 0  }] },
      { label: 'Sample reference ID (candidate)',              ranges: [{ start: 37, end: 41 }] },
      { label: 'Sample voice / zone params (candidate)',       ranges: [{ start: 43, end: 44 }] },
      { label: 'Secondary program params',                     ranges: [{ start: 51, end: 63 }] },
      { label: 'Level / mode byte (tail0)',                    ranges: [{ start: 68, end: 68 }] },
      { label: 'Level / mode byte (tail1)',                    ranges: [{ start: 79, end: 79 }] },
      { label: 'Program-specific tail bytes',                  ranges: [{ start: 90, end: 91 }] },
    ],
    regions: [
      { start: 0,  end: 0,  label: 'Section enable / program flags',                       status: 'candidate' },
      { start: 1,  end: 3,  label: 'Constant section header A',                            status: 'constant'  },
      { start: 4,  end: 8,  label: 'Organ drawbars (preset 1, 9 nibbles)',                status: 'confirmed' },
      { start: 9,  end: 15, label: 'Constant section header A tail',                       status: 'constant'  },
      { start: 16, end: 20, label: 'Organ drawbars (preset 2 / edited, 9 nibbles)',       status: 'confirmed' },
      { start: 20, end: 21, label: 'Organ vib/chorus + percussion flags',                 status: 'candidate' },
      { start: 22, end: 24, label: 'Constant section header B',                            status: 'constant'  },
      { start: 25, end: 29, label: 'Organ drawbars (second default slot, 9 nibbles)',     status: 'confirmed' },
      { start: 30, end: 36, label: 'Constant section header B tail',                       status: 'constant'  },
      { start: 37, end: 41, label: 'Sample reference ID (high-entropy)',                  status: 'candidate' },
      { start: 42, end: 42, label: 'Sample section param',                                status: 'unknown'   },
      { start: 43, end: 44, label: 'Sample voice / zone params',                          status: 'candidate' },
      { start: 45, end: 45, label: 'Sample section param',                                status: 'unknown'   },
      { start: 46, end: 50, label: 'Constant zero padding',                                status: 'constant'  },
      { start: 51, end: 63, label: 'Secondary program parameters',                         status: 'candidate' },
      { start: 64, end: 67, label: 'Constant zero padding',                                status: 'constant'  },
      { start: 68, end: 68, label: 'Level / mode byte tail0 (bit-3 flag in lo nibble)',    status: 'candidate' },
      { start: 69, end: 78, label: 'Constant zero padding',                                status: 'constant'  },
      { start: 79, end: 79, label: 'Level / mode byte tail1 (hi nibble 0-13)',             status: 'candidate' },
      { start: 80, end: 89, label: 'Constant zero padding',                                status: 'constant'  },
      { start: 90, end: 91, label: 'Program-specific bytes (unique per program)',           status: 'unknown'   },
    ],
  },

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

  'piano-4': {
    // Re-censused 2026-07-04 over 212 files (factory-restore corpus). The 6-file
    // skeleton produced several artifacts, all corrected here: body[25]/[72]
    // "piano family" flags (don't track the modelId→name family), body[35]
    // "level" / body[36] "velocity" (sample-section data), and the "constant"
    // claims at body[5-7] (which actually vary). Surviving confirmed: the piano
    // slot (b19 lo-nibble) + model id (b20-24), both bundle-validated.
    bodyBytes: 90,
    controls: [
      { label: 'Piano partition slot (byte 19 low nibble)',      ranges: [{ start: 19, end: 19 }] },
      { label: 'Piano model ID (family-wide 32-bit, resolves to name)', ranges: [{ start: 20, end: 24 }] },
      { label: 'FX-mod word (FX sub-block head, candidate)',     ranges: [{ start: 59, end: 60 }] },
      { label: 'FX modulation params (rate/amount/mode, candidate)', ranges: [{ start: 66, end: 69 }] },
    ],
    regions: [
      { start: 0,  end: 2,  label: 'Constant zero pad',                                        status: 'constant'  },
      { start: 3,  end: 3,  label: 'Format marker 0x64 (version ×100)',                        status: 'constant'  },
      { start: 4,  end: 4,  label: 'Constant 0x0b',                                            status: 'constant'  },
      { start: 5,  end: 7,  label: 'Header params (vary across corpus; unmapped)',             status: 'unknown'   },
      { start: 8,  end: 16, label: 'Constant header tail',                                     status: 'constant'  },
      { start: 17, end: 18, label: 'Per-program params (transpose / tuning candidate)',         status: 'unknown'   },
      { start: 19, end: 19, label: 'Piano partition slot (low nibble; matches .npno slot)',     status: 'confirmed' },
      { start: 20, end: 24, label: 'Piano model ID (family-wide 32-bit; resolves to name)',     status: 'confirmed' },
      { start: 25, end: 25, label: 'Per-program param (was falsified "family flag")',           status: 'unknown'   },
      { start: 26, end: 33, label: 'Constant zero pad',                                        status: 'constant'  },
      { start: 34, end: 34, label: 'Constant 0x17 (section-length marker)',                    status: 'constant'  },
      { start: 35, end: 47, label: 'Sample-synth section (device sample ref + params; high entropy)', status: 'unknown' },
      { start: 48, end: 57, label: 'Constant zero pad',                                        status: 'constant'  },
      { start: 58, end: 58, label: 'Constant 0x1f (section-length marker)',                    status: 'constant'  },
      { start: 59, end: 60, label: 'FX-mod word (FX sub-block head; 0x0202=off DISPROVEN)',       status: 'candidate' },
      { start: 61, end: 65, label: 'Effect type / intensity params',                           status: 'unknown'   },
      { start: 66, end: 69, label: 'FX modulation params (rate/amount/mode candidate)',          status: 'candidate' },
      { start: 70, end: 71, label: 'Output / routing params (widely varying)',                  status: 'unknown'   },
      { start: 72, end: 72, label: 'FX-region param (was falsified "family check")',             status: 'unknown'   },
      { start: 73, end: 89, label: 'Constant zero tail',                                       status: 'constant'  },
    ],
  },

  'piano-5': {
    bodyBytes: 237,
    controls: [
      { label: 'Layer B active (bit 3 of body[7])',             ranges: [{ start: 7,   end: 7   }] },
      // Layer A piano core cluster (base body bit 461 = byte 57). Confirmed sub-fields:
      { label: 'Sound A layer on (bit)',                        ranges: [{ start: 57,  end: 57  }] },
      { label: 'Sound A volume (7-bit)',                        ranges: [{ start: 57,  end: 58  }] },
      { label: 'Sound A KB zones (4-bit)',                      ranges: [{ start: 58,  end: 59  }] },
      { label: 'Sound A octave shift (4-bit)',                  ranges: [{ start: 59,  end: 59  }] },
      { label: 'Sound A piano type (3-bit enum)',               ranges: [{ start: 59,  end: 60  }] },
      { label: 'Sound A piano model ID (32-bit)',               ranges: [{ start: 61,  end: 64  }] },
      // Layer B piano core cluster (base body bit 717 = byte 89). Confirmed sub-fields:
      { label: 'Sound B layer on (bit)',                        ranges: [{ start: 89,  end: 89  }] },
      { label: 'Sound B volume (7-bit)',                        ranges: [{ start: 89,  end: 90  }] },
      { label: 'Sound B KB zones (4-bit)',                      ranges: [{ start: 90,  end: 91  }] },
      { label: 'Sound B octave shift (4-bit)',                  ranges: [{ start: 91,  end: 91  }] },
      { label: 'Sound B piano type (3-bit enum)',               ranges: [{ start: 91,  end: 92  }] },
      { label: 'Sound B piano model ID (32-bit)',               ranges: [{ start: 93,  end: 96  }] },
      { label: 'FX A transpose / octave (candidate)',           ranges: [{ start: 134, end: 134 }] },
      { label: 'Primary program parameters',                   ranges: [{ start: 18,  end: 32  }] },
      { label: 'Layer A sound slot (9 bytes)',                 ranges: [{ start: 58,  end: 66  }] },
      { label: 'Layer B sound slot (9 bytes)',                 ranges: [{ start: 90,  end: 98  }] },
      { label: 'Layer A effects / EQ parameters (14 bytes)',   ranges: [{ start: 122, end: 135 }] },
      { label: 'Layer B effects / EQ parameters (14 bytes)',   ranges: [{ start: 180, end: 193 }] },
    ],
    regions: [
      { start: 0,   end: 2,   label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 3,   end: 4,   label: 'Format tag 0x65 0x0c (NP5 body sub-format)',                 status: 'constant'  },
      { start: 5,   end: 6,   label: 'Cluster A: program header',                                  status: 'candidate' },
      { start: 7,   end: 7,   label: 'Layer B active (bit 3)',                                     status: 'confirmed' },
      { start: 8,   end: 16,  label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 17,  end: 17,  label: 'Constant magic 0x27 (39 decimal)',                           status: 'constant'  },
      { start: 18,  end: 32,  label: 'Cluster B: primary program params',                          status: 'candidate' },
      { start: 33,  end: 56,  label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 57,  end: 64,  label: 'Layer A piano core (on/vol/zones/octave/type/model ID; base bit 461)', status: 'confirmed' },
      { start: 65,  end: 66,  label: 'Cluster C: layer A sound params tail',                       status: 'candidate' },
      { start: 67,  end: 88,  label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 89,  end: 96,  label: 'Layer B piano core (on/vol/zones/octave/type/model ID; base bit 717)', status: 'confirmed' },
      { start: 97,  end: 98,  label: 'Cluster D: layer B sound params tail',                       status: 'candidate' },
      { start: 99,  end: 120, label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 121, end: 121, label: 'Record marker 0x39 (layer A FX slot)',                       status: 'constant'  },
      { start: 122, end: 133, label: 'Cluster E: layer A FX / EQ params',                          status: 'candidate' },
      { start: 134, end: 134, label: 'FX A transpose / octave (sub-byte enum)',                    status: 'candidate' },
      { start: 135, end: 135, label: 'Cluster E: layer A FX / EQ params tail',                     status: 'candidate' },
      { start: 136, end: 178, label: 'Constant zero pad',                                          status: 'constant'  },
      { start: 179, end: 179, label: 'Record marker 0x39 (layer B FX slot)',                       status: 'constant'  },
      { start: 180, end: 193, label: 'Cluster F: layer B FX / EQ params (14 bytes)',               status: 'candidate' },
      { start: 194, end: 236, label: 'Constant zero pad',                                          status: 'constant'  },
    ],
  },

  'grand-2': {
    bodyBytes: 185,
    controls: [
      // Layer A piano cluster (bytes 22-30 = body bits 176-247). Confirmed sub-fields:
      { label: 'Layer A piano on (bit)',                       ranges: [{ start: 22,  end: 22  }] },
      { label: 'Layer A volume (7-bit)',                       ranges: [{ start: 22,  end: 23  }] },
      { label: 'Layer A KB zones (4-bit)',                     ranges: [{ start: 23,  end: 23  }] },
      { label: 'Layer A octave shift (4-bit)',                 ranges: [{ start: 23,  end: 24  }] },
      { label: 'Layer A piano type (3-bit enum)',              ranges: [{ start: 24,  end: 24  }] },
      { label: 'Layer A piano model slot (5-bit)',             ranges: [{ start: 25,  end: 26  }] },
      { label: 'Layer A piano variation (2-bit)',              ranges: [{ start: 26,  end: 26  }] },
      { label: 'Layer A piano model ID (32-bit)',              ranges: [{ start: 26,  end: 30  }] },
      { label: 'Layer A pstick on/off (bit)',                  ranges: [{ start: 24,  end: 24  }] },
      { label: 'Layer A sustain pedal on/off (bit)',           ranges: [{ start: 24,  end: 25  }] },
      { label: 'Layer A soft release on/off (bit)',            ranges: [{ start: 29,  end: 30  }] },
      { label: 'Layer A string resonance on/off (bit)',        ranges: [{ start: 30,  end: 30  }] },
      { label: 'Layer A pedal noise on/off (bit)',             ranges: [{ start: 30,  end: 30  }] },
      { label: 'Layer A touch (2-bit)',                        ranges: [{ start: 30,  end: 30  }] },
      { label: 'Layer A unison level (2-bit)',                 ranges: [{ start: 30,  end: 31  }] },
      { label: 'Layer A dynamics comp (2-bit)',                ranges: [{ start: 31,  end: 31  }] },
      { label: 'Layer A timbre (3-bit)',                       ranges: [{ start: 31,  end: 31  }] },
      // Layer B piano cluster (bytes 36-44 = body bits 288-359). Confirmed sub-fields:
      { label: 'Layer B piano on (bit)',                       ranges: [{ start: 36,  end: 36  }] },
      { label: 'Layer B volume (7-bit)',                       ranges: [{ start: 36,  end: 37  }] },
      { label: 'Layer B KB zones (4-bit)',                     ranges: [{ start: 37,  end: 37  }] },
      { label: 'Layer B octave shift (4-bit)',                 ranges: [{ start: 37,  end: 38  }] },
      { label: 'Layer B piano type (3-bit enum)',              ranges: [{ start: 38,  end: 38  }] },
      { label: 'Layer B piano model slot (5-bit)',             ranges: [{ start: 38,  end: 39  }] },
      { label: 'Layer B piano variation (2-bit)',              ranges: [{ start: 39,  end: 39  }] },
      { label: 'Layer B piano model ID (32-bit)',              ranges: [{ start: 39,  end: 43  }] },
      { label: 'Layer B pstick on/off (bit)',                  ranges: [{ start: 38,  end: 38  }] },
      { label: 'Layer B sustain pedal on/off (bit)',           ranges: [{ start: 38,  end: 38  }] },
      { label: 'Layer B soft release on/off (bit)',            ranges: [{ start: 43,  end: 43  }] },
      { label: 'Layer B string resonance on/off (bit)',        ranges: [{ start: 43,  end: 43  }] },
      { label: 'Layer B pedal noise on/off (bit)',             ranges: [{ start: 43,  end: 43  }] },
      { label: 'Layer B touch (2-bit)',                        ranges: [{ start: 43,  end: 44  }] },
      { label: 'Layer B unison level (2-bit)',                 ranges: [{ start: 44,  end: 44  }] },
      { label: 'Layer B dynamics comp (2-bit)',                ranges: [{ start: 44,  end: 44  }] },
      { label: 'Layer B timbre (3-bit)',                       ranges: [{ start: 44,  end: 44  }] },
      { label: 'Layer B active / extended mode flag (bit7)',    ranges: [{ start: 8,   end: 8   }] },
      { label: 'Global parameter 1 (top 3 bits)',              ranges: [{ start: 16,  end: 16  }] },
      { label: 'Global parameter 2 (top 3 bits)',              ranges: [{ start: 94,  end: 94  }] },
      { label: 'Layer A extended params (16 bytes)',           ranges: [{ start: 50,  end: 65  }] },
      { label: 'Layer B extended params (16 bytes)',           ranges: [{ start: 72,  end: 87  }] },
      { label: 'Layer A effects / audio params (14 bytes)',    ranges: [{ start: 100, end: 113 }] },
      { label: 'Layer B effects / audio params (14 bytes)',    ranges: [{ start: 121, end: 134 }] },
      { label: 'Layer A final section (16 bytes)',             ranges: [{ start: 142, end: 157 }] },
      { label: 'Layer B final section (16 bytes)',             ranges: [{ start: 164, end: 179 }] },
    ],
    regions: [
      { start: 0,   end: 4,   label: 'Constant preamble',                                       status: 'constant'  },
      { start: 5,   end: 8,   label: 'Global header cluster A (4 bytes)',                       status: 'candidate' },
      { start: 9,   end: 15,  label: 'Separator tag 0x05 section 1',                           status: 'constant'  },
      { start: 16,  end: 16,  label: 'Global param 1 (top 3 bits, values 0-7)',                 status: 'candidate' },
      { start: 17,  end: 21,  label: 'Separator tag 0x0d layer A',                             status: 'constant'  },
      { start: 22,  end: 30,  label: 'Layer A piano core (15 fields: on/vol/zones/octave/type/slot/var/model ID/pstick/susped/softRel/stringRes/pedalNoise/touch/unison/dynComp/timbre)', status: 'confirmed' },
      { start: 31,  end: 35,  label: 'Separator tag 0x0d layer B',                             status: 'constant'  },
      { start: 36,  end: 44,  label: 'Layer B piano core (15 fields: on/vol/zones/octave/type/slot/var/model ID/pstick/susped/softRel/stringRes/pedalNoise/touch/unison/dynComp/timbre)', status: 'confirmed' },
      { start: 45,  end: 49,  label: 'Separator tag 0x15 layer A extended',                    status: 'constant'  },
      { start: 50,  end: 65,  label: 'Layer A extended params cluster C1 (16 bytes)',           status: 'candidate' },
      { start: 66,  end: 71,  label: 'Separator tag 0x15 layer B extended',                    status: 'constant'  },
      { start: 72,  end: 87,  label: 'Layer B extended params cluster C2 (16 bytes)',           status: 'candidate' },
      { start: 88,  end: 93,  label: 'Separator tag 0x05 section 2',                           status: 'constant'  },
      { start: 94,  end: 94,  label: 'Global param 2 (top 3 bits, values 0-7)',                 status: 'candidate' },
      { start: 95,  end: 99,  label: 'Separator tag 0x14 layer A effects',                     status: 'constant'  },
      { start: 100, end: 113, label: 'Layer A effects cluster D1 (14 bytes; [1]=piano model)', status: 'candidate' },
      { start: 114, end: 120, label: 'Separator tag 0x14 layer B effects',                     status: 'constant'  },
      { start: 121, end: 134, label: 'Layer B effects cluster D2 (14 bytes; [1]=piano model)', status: 'candidate' },
      { start: 135, end: 141, label: 'Separator tag 0x15 layer A final',                       status: 'constant'  },
      { start: 142, end: 157, label: 'Layer A final cluster E1 (16 bytes)',                    status: 'candidate' },
      { start: 158, end: 163, label: 'Separator tag 0x15 layer B final',                       status: 'constant'  },
      { start: 164, end: 179, label: 'Layer B final cluster E2 (16 bytes)',                    status: 'candidate' },
      { start: 180, end: 184, label: 'Tail padding',                                           status: 'constant'  },
    ],
  },

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
