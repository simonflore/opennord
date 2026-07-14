/**
 * Resolve a Nord factory library/sample to its official download. Pure: no
 * device, no network. Deep-links only; OpenNord never hosts/transfers Nord audio.
 *
 * The download URL is a *template*, not stored data: every entry's URL is
 * `…/from_file_name/<filename>/` — Nord's own resolver endpoint, which
 * 302-redirects to S3 server-side. So URL construction needs no catalog at all;
 * it needs the exact filename. The committed snapshot (factory-libs.generated.ts)
 * is kept only for the `name → filename` mapping and metadata (size/type) — the
 * one thing a template can't derive (filenames carry irregular size/version
 * tokens like `White_Grand_XL_6.3` or `Diamond Pad_NW2 RW 4.1`).
 *
 * The live-catalog fetch + cache and the `from_file_name` HEAD fallback (for
 * versions the offline snapshot no longer lists) are network/server-side and
 * land with the cloud backend — see #35. This module stays pure and offline:
 * the snapshot is the last-resort, always-available source.
 */
import { FACTORY_LIBS, type FactoryLibEntry } from './factory-libs.generated';

/** Nord's official file resolver — `<base>/<filename>/` 302-redirects to S3. */
const FACTORY_FILE_ENDPOINT = 'https://www.nordkeyboards.com/wt/api/main/v1/file/from_file_name';

export interface FactoryMatch {
  /** The stable catalog filename, e.g. "White_Grand_XL_6.3.npno". The id a
   *  cloud manifest stores, and the key that resolves to a download exactly. */
  filename: string;
  url: string;
  sizeKb: number;
  sizeDescription: string;
  type: 'piano' | 'sample';
}

/**
 * Build the official download URL for a factory filename. Pure template — no
 * catalog lookup. The caller is responsible for knowing `filename` is real
 * factory content (a manifest filename, or a snapshot hit); this does not
 * validate existence (that's the backend's HEAD check, #35).
 */
export function factoryUrl(filename: string): string {
  return `${FACTORY_FILE_ENDPOINT}/${filename}/`;
}

/**
 * Normalize a name or filename to a match key: drop a known media extension
 * (only the NS4 formats `.npno`/`.nsmp4`), spaces→_, lowercase. We deliberately
 * strip ONLY those extensions — a blanket `\.[^.]+$` would eat a version suffix
 * like the ".3" in "White Grand XL 6.3" and break the match.
 */
function normalize(s: string): string {
  return s.replace(/\.(npno|nsmp4)$/i, '').replace(/\s+/g, '_').toLowerCase();
}

const INDEX: Map<string, FactoryLibEntry> = (() => {
  const m = new Map<string, FactoryLibEntry>();
  for (const e of FACTORY_LIBS) m.set(normalize(e.filename), e);
  return m;
})();

function toMatch(entry: FactoryLibEntry, ext?: 'npno' | 'nsmp4'): FactoryMatch | null {
  if (ext && !entry.filename.toLowerCase().endsWith(`.${ext}`)) return null;
  return {
    filename: entry.filename,
    url: factoryUrl(entry.filename),
    sizeKb: entry.sizeKb,
    sizeDescription: entry.sizeDescription,
    type: entry.type,
  };
}

/**
 * Resolve a factory file to its official download by **display name** (e.g.
 * "White Grand XL 6.3" or "Diamond Pad_NW2 RW 4.1"). `ext` (when given) requires
 * the matched entry to be that file type. Returns null for unknown or
 * user-created content. The fuzzy path — for callers that only have a name.
 */
export function resolveFactory(name: string, ext?: 'npno' | 'nsmp4'): FactoryMatch | null {
  const entry = INDEX.get(normalize(name));
  return entry ? toMatch(entry, ext) : null;
}

/**
 * Resolve by the **exact catalog filename** — the stable id a cloud manifest
 * stores (e.g. "White_Grand_XL_6.3.npno"). This is the precise path:
 * `filename → download`, no display-name fuzziness. Returns null when the
 * offline snapshot doesn't list it (a delisted/newer version is confirmed
 * factory only by the backend HEAD check, #35 — we stay conservative here so a
 * user-created sample is never mislabeled as factory).
 */
export function resolveFactoryByFilename(filename: string, ext?: 'npno' | 'nsmp4'): FactoryMatch | null {
  const entry = INDEX.get(normalize(filename));
  return entry ? toMatch(entry, ext) : null;
}
