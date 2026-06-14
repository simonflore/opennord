/**
 * Resolve a Nord factory library/sample to its official download — from the
 * committed catalog snapshot (factory-libs.generated.ts). Pure: no device, no
 * network. Deep-links only; OpenNord never hosts/transfers Nord audio.
 */
import { FACTORY_LIBS, type FactoryLibEntry } from './factory-libs.generated';

export interface FactoryMatch {
  url: string;
  sizeKb: number;
  sizeDescription: string;
  type: 'piano' | 'sample';
}

/** Normalize a name or filename to a match key: drop known media extension, spaces→_, lowercase. */
function normalize(s: string): string {
  return s.replace(/\.(npno|nsmp4)$/i, '').replace(/\s+/g, '_').toLowerCase();
}

const INDEX: Map<string, FactoryLibEntry> = (() => {
  const m = new Map<string, FactoryLibEntry>();
  for (const e of FACTORY_LIBS) m.set(normalize(e.filename), e);
  return m;
})();

/**
 * Resolve a factory file to its official download. `name` is the device/display
 * name (e.g. "White Grand XL 6.3" or "Diamond Pad_NW2 RW 4.1"). `ext` (when given)
 * requires the matched entry to be that file type. Returns null for unknown or
 * user-created content.
 */
export function resolveFactory(name: string, ext?: 'npno' | 'nsmp4'): FactoryMatch | null {
  const entry = INDEX.get(normalize(name));
  if (!entry) return null;
  if (ext && !entry.filename.toLowerCase().endsWith(`.${ext}`)) return null;
  return { url: entry.url, sizeKb: entry.sizeKb, sizeDescription: entry.sizeDescription, type: entry.type };
}
