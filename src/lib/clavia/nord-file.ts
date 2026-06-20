/**
 * Generation-aware identifier for any Clavia `CBIN` file (Stage 2/3/4 programs &
 * presets). Every Nord file shares the CBIN container (docs/FORMAT.md); the
 * 4-char tag at +0x08 names the kind, and the format-type byte at +0x04 tells
 * legacy (Stage 2, 0) from NSM-era (Stage 3/4, 1).
 *
 * For NSM-era files (Stage 3 & 4) the fixed header — bank/location/category/
 * version — decodes with the same {@link readCbinHeader} we use for Stage 4
 * (verified against real `.ns3f`: v3.04, slot F:33/F:34). Stage 2's *legacy*
 * header lays those fields out differently and isn't decoded yet, so we surface
 * only the generation/size for it rather than show wrong values.
 *
 * This identifies and shows structure; it does NOT decode the parameter body —
 * only Stage 4 programs have the bit map our decoder understands (parse.ts).
 */
import { hasCbinMagic, readCbinHeader } from './cbin';
import { programCategoryName } from './categories';
import { formatSlot, BANK_LETTERS } from './slot';

export type NordGeneration = 'Stage 2' | 'Stage 3' | 'Stage 4' | 'unknown';

export interface NordFileInfo {
  /** CBIN magic present. */
  recognized: boolean;
  /** 4-char type tag, e.g. `ns2p`, `ns3f`, `ns4p`. */
  tag: string;
  generation: NordGeneration;
  /** Coarse kind from the tag's last char: `p`=program, `f`=performance/file, samples separate. */
  kind: 'program' | 'performance' | 'sample' | 'unknown';
  /** 0 = legacy (Stage 2) header layout, 1 = NSM-era (Stage 3/4). */
  formatType: number;
  /** True when the NSM-era header fields below are decoded (Stage 3/4); false for the legacy layout. */
  headerDecoded: boolean;
  /** Keyboard slot ("F:34"), NSM-era only. */
  slot?: string;
  category?: number;
  categoryName?: string;
  /** Program version, e.g. "3.04". NSM-era only. */
  version?: string;
  /** Whether OpenNord can fully decode the parameter body — Stage 4 programs only, today. */
  fullyDecoded: boolean;
  sizeBytes: number;
}

function generationOf(tag: string): NordGeneration {
  if (tag.startsWith('ns2')) return 'Stage 2';
  if (tag.startsWith('ns3')) return 'Stage 3';
  if (tag.startsWith('ns4')) return 'Stage 4';
  return 'unknown';
}

function kindOf(tag: string): NordFileInfo['kind'] {
  if (tag.startsWith('nsmp')) return 'sample';
  const last = tag.slice(-1);
  if (last === 'p') return 'program';
  if (last === 'f') return 'performance';
  return 'unknown';
}

/** Identify a Nord CBIN file and decode the header fields we can trust. */
export function identifyNordFile(bytes: Uint8Array): NordFileInfo {
  if (!hasCbinMagic(bytes)) {
    return { recognized: false, tag: '', generation: 'unknown', kind: 'unknown', formatType: 0, headerDecoded: false, fullyDecoded: false, sizeBytes: bytes.length };
  }
  const h = readCbinHeader(bytes);
  const generation = generationOf(h.tag);
  const kind = kindOf(h.tag);
  const fullyDecoded = h.tag === 'ns4p' || h.tag === 'ns4l';

  const info: NordFileInfo = {
    recognized: true, tag: h.tag, generation, kind,
    formatType: h.formatType, headerDecoded: false, fullyDecoded, sizeBytes: bytes.length,
  };

  // NSM-era header (Stage 3 & 4) — bank/location/category/version decode reliably.
  if (h.formatType === 1) {
    info.headerDecoded = true;
    info.slot = formatSlot(h.bank, h.location);
    info.category = h.category;
    info.categoryName = programCategoryName(h.category);
    info.version = (h.versionRaw / 100).toFixed(2);
  } else if (generation === 'Stage 2') {
    // Legacy (Stage 2) header, RE'd by diffing 6 real .ns2p files:
    //  - category @0x10 shares the same enum (validated: Take On Me → Synth,
    //    Eumel Horn → Wind, BlameBoogie → Clavinet);
    //  - location @0x0E is the *raw* program number, NOT the NSM page-encoding
    //    (SUMMER 69 sits in slot 69) — so format it directly, not via formatSlot;
    //  - 0x14 (LE) is the NS2 *file-format* version (2-7), not a firmware/OS
    //    version string — so it's not musician-facing and we don't surface it.
    //  Full slot/engine decode lives in lib/ns2/decode.ts (presented via ns2/present.ts).
    info.headerDecoded = true;
    info.slot = `${BANK_LETTERS[h.bank & 0x7] ?? h.bank}:${h.location}`;
    info.category = h.category;
    info.categoryName = programCategoryName(h.category);
  }
  return info;
}
