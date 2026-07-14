/**
 * Generation-aware identifier for any Clavia `CBIN` file (Stage 2/3/4 programs &
 * presets). Every Nord file shares the CBIN container (docs/FORMAT.md); the
 * 4-char tag at +0x08 names the kind, and the format-type byte at +0x04 tells
 * legacy (Stage 2, 0) from NSM-era (Stage 3/4, 1).
 *
 * For NSM-era files (Stage 3 & 4) the fixed header — bank/location/category/
 * version — decodes with the same {@link readCbinHeader} we use for Stage 4
 * (verified against real `.ns3f`: v3.04, slot F:33/F:34). Legacy formatType-0
 * files (ns2p, ne4p, ne5p) share a common header layout that IS now decoded:
 * category @0x10 (same enum), raw location @0x0E (ns2p/ne4p sequential-raw;
 * ne5p sequential-1-based via {@link electro5Slot}).
 *
 * This identifies and shows structure; it does NOT decode the parameter body —
 * only Stage 4 programs have the bit map our decoder understands (parse.ts).
 */
import { hasCbinMagic, readCbinHeader } from './cbin';
import { programCategoryName } from './categories';
import { formatSlot, wave2Slot, electro5Slot, lead4Slot, BANK_LETTERS } from './slot';
import { modelByTag, type NordModelId } from './partitions';

export type NordGeneration = 'Stage 2' | 'Stage 3' | 'Stage 4' | 'unknown';

export interface NordFileInfo {
  /** CBIN magic present. */
  recognized: boolean;
  /** 4-char type tag, e.g. `ns2p`, `ns3f`, `ns4p`. */
  tag: string;
  generation: NordGeneration;
  /** Registry model resolved from the program tag (whole line), if known. */
  modelId?: NordModelId;
  /** Musician-facing model name, e.g. "Nord Electro 6" — from the registry by tag. */
  modelName?: string;
  /** Envelope generation from the registry: OG / NW1-v3 / NW1-v4. */
  modelGeneration?: 'OG' | 'NW1-v3' | 'NW1-v4';
  /** Coarse kind from the tag's last char: `p`=program, `f`=performance/file, samples separate. */
  kind: 'program' | 'performance' | 'sample' | 'unknown';
  /** 0 = legacy (Stage 2) header layout, 1 = NSM-era (Stage 3/4). */
  formatType: number;
  /** True when the NSM-era header fields below are decoded (Stage 3/4); false for the legacy layout. */
  headerDecoded: boolean;
  /** Keyboard slot ("F:34"); present when headerDecoded — NSM-era and legacy formatType-0. */
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
  const fullyDecoded = h.tag === 'ns4p' || h.tag === 'ns4l' || h.tag === 'ne6p' || h.tag === 'ne6l';
  const model = modelByTag(h.tag); // whole-line model from the registry (programs)

  const info: NordFileInfo = {
    recognized: true, tag: h.tag, generation, kind,
    modelId: model?.id, modelName: model?.name, modelGeneration: model?.generation,
    formatType: h.formatType, headerDecoded: false, fullyDecoded, sizeBytes: bytes.length,
  };

  // NSM-era header (Stage 3 & 4 and Wave 2) — bank/location/category/version decode reliably.
  // nw2p uses formatType 1 (NSM-era envelope, confirmed vs 26 real fixtures).
  // CWave2::ConvertLocation @0x0000000100034508 handles only NSMP; for programs it
  // returns unhandled — base class applies the shared NSM-era grid (wave2Slot ≡ formatSlot).
  if (h.formatType === 1) {
    info.headerDecoded = true;
    info.slot = h.tag === 'nw2p' ? wave2Slot(h.bank, h.location) : formatSlot(h.bank, h.location);
    info.category = h.category;
    info.categoryName = programCategoryName(h.category);
    info.version = (h.versionRaw / 100).toFixed(2);
  } else if (h.formatType === 0) {
    // Legacy (OG-era) header — applies to Stage 2 (ns2p) AND Electro 4/5 (ne4p/ne5p)
    // and any other formatType=0 file. RE'd by diffing 6 real .ns2p files and confirmed
    // against ne4p/ne5p fixtures (tierB-electro5-recon.md, 2026-06-20):
    //  - category @0x10 shares the same enum (validated: Take On Me → Synth,
    //    Eumel Horn → Wind, BlameBoogie → Clavinet; ne4p cat=14=User);
    //  - ne5p category is 0xFF (sentinel for "not set") — the field IS decoded, it just
    //    has no programCategoryName entry, which is the correct result;
    //  - location @0x0E is the *raw* program number, NOT the NSM page-encoding
    //    (SUMMER 69 sits in slot 69) — so format it directly, not via formatSlot;
    //  - 0x14 (LE) is a *file-format* version integer (e.g. 4 for ne5p, 2-7 for ns2p),
    //    not a firmware/OS version string — not musician-facing, not surfaced.
    //  Full slot/engine decode lives in lib/ns2/decode.ts (ns2) and will live in
    //  lib/ne5/decode.ts (ne5p) when that body codec is built.
    info.headerDecoded = true;
    // ne5p and nl4p use sequential 1-based slot numbering — ConvertLocation returns
    // "unhandled" (base class sequential display), not the Stage 8-column grid.
    // nl4p: CLead4Base::ConvertLocation @0x00000001000ddcf8 — 2-bank/50-slot sequential.
    // ne5p: CElectro5::ConvertLocation @0x0000000100194844 — same sequential scheme.
    // ns2p and ne4p use the raw location value directly (sequential 0-based raw display).
    info.slot = h.tag === 'ne5p'
      ? electro5Slot(h.bank, h.location)
      : h.tag === 'nl4p'
        ? lead4Slot(h.bank, h.location)
        : `${BANK_LETTERS[h.bank & 0x7] ?? h.bank}:${h.location}`;
    info.category = h.category;
    info.categoryName = programCategoryName(h.category);
  }
  return info;
}
