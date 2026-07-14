/**
 * NS3/sample factory-recognition primitive.
 *
 * Two exports:
 *   readSampleName    — extracts the embedded canonical name from a .nsmp/.nsmp3/.nsmp4 byte buffer.
 *   resolveNs3SampleByName — reverse-index the eight NS3 catalogs by name → sampleId + metadata.
 *
 * Validated RE: codec-3/4 factory files embed the real catalog name (e.g. "Bandoneon") in the
 * `hdr` metadata chunk starting at hdrIndex + 0x15 (null-terminated ASCII). OG .nsmp files
 * have no `hdr` chunk and return ''.
 */

import { ns3NordPianoLibrary } from './library/ns3-nord-piano-library.generated';
import { ns3NordSampleLibrary2 } from './library/ns3-nord-sample-library-2.generated';
import { ns3NordSampleLibrary3 } from './library/ns3-nord-sample-library-3.generated';
import { ns3NordSampleLibraryArchive } from './library/ns3-nord-sample-library-archive.generated';
import { ns3ProductLibraries } from './library/ns3-product-libraries.generated';
import { ns3UserLibraries } from './library/ns3-user-libraries.generated';
import { ns3ScSoundsLibraries } from './library/ns3-sc-sounds-libraries.generated';
import { ns3RedLibrary } from './library/ns3-red-library.generated';

// ---------------------------------------------------------------------------
// readSampleName
// ---------------------------------------------------------------------------

const HDR = [0x68, 0x64, 0x72]; // ASCII 'hdr'
const HDR_SEARCH_WINDOW = 512;
const NAME_OFFSET = 0x15; // validated offset from hdrIndex to null-terminated name
const NAME_MAX_LEN = 64;

/**
 * Extract the embedded canonical sample name from a Nord sample file's raw bytes.
 *
 * Scans the first 512 bytes for the ASCII sequence `hdr`, then reads a
 * null-terminated ASCII string starting at hdrIndex + 0x15.
 *
 * Returns '' if: no `hdr` marker, empty run, non-ASCII characters, or name > 64 bytes.
 */
export function readSampleName(bytes: Uint8Array): string {
  // Find 'hdr' within the search window.
  const limit = Math.min(bytes.length, HDR_SEARCH_WINDOW);
  let hdrIndex = -1;
  outer: for (let i = 0; i <= limit - HDR.length; i++) {
    for (let j = 0; j < HDR.length; j++) {
      if (bytes[i + j] !== HDR[j]) continue outer;
    }
    hdrIndex = i;
    break;
  }
  if (hdrIndex === -1) return '';

  const nameStart = hdrIndex + NAME_OFFSET;
  if (nameStart >= bytes.length) return '';

  // Read null-terminated ASCII.
  const chars: number[] = [];
  for (let i = nameStart; i < bytes.length && chars.length < NAME_MAX_LEN; i++) {
    const b = bytes[i];
    if (b === 0x00) break;
    // Reject non-printable-ASCII
    if (b < 0x20 || b > 0x7e) return '';
    chars.push(b);
  }

  if (chars.length === 0) return '';
  return String.fromCharCode(...chars);
}

// ---------------------------------------------------------------------------
// resolveNs3SampleByName — reverse index
// ---------------------------------------------------------------------------

export interface SampleEntry {
  sampleId: number;
  name: string;
  info?: string;
  version?: string;
}

interface CatalogEntry { name: string | string[]; version?: string; category?: string; info?: string }
type Catalog = Map<number, CatalogEntry>;

// Same priority order as service.ts / the oracle's getSample().
const LIBS: Catalog[] = [
  ns3NordPianoLibrary, ns3NordSampleLibrary3, ns3NordSampleLibrary2,
  ns3NordSampleLibraryArchive, ns3ProductLibraries, ns3UserLibraries,
  ns3ScSoundsLibraries, ns3RedLibrary,
] as unknown as Catalog[];

/** Lazy-built reverse index: normalizedName → SampleEntry. Built once on first use. */
let reverseIndex: Map<string, SampleEntry> | null = null;

function buildReverseIndex(): Map<string, SampleEntry> {
  const idx = new Map<string, SampleEntry>();

  for (const lib of LIBS) {
    for (const [sampleId, entry] of lib.entries()) {
      const names: string[] = Array.isArray(entry.name) ? entry.name : [entry.name];
      for (const n of names) {
        if (!n) continue;
        const key = n.trim().toLowerCase();
        if (idx.has(key)) continue; // first match wins (priority order preserved)
        idx.set(key, {
          sampleId,
          name: n,
          info: entry.info ?? undefined,
          version: entry.version ?? undefined,
        });
      }
    }
  }

  return idx;
}

/**
 * Reverse-lookup a sample by its canonical name across the eight NS3 catalogs.
 *
 * Matching is case-insensitive and trims leading/trailing whitespace.
 * On multiple catalog entries sharing the same name, the first (highest-priority)
 * catalog wins — matching the oracle's search order.
 *
 * Returns null for "Converted", empty names, or anything not in the catalogs.
 */
export function resolveNs3SampleByName(name: string): SampleEntry | null {
  if (!reverseIndex) reverseIndex = buildReverseIndex();
  const key = name.trim().toLowerCase();
  return reverseIndex.get(key) ?? null;
}
