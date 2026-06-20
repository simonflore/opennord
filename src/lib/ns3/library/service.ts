/**
 * Nord sample-library lookup. Re-derives getSample() from ns3-program-viewer
 * (Chris55, GPLv3; see ATTRIBUTION.md) — the lookup LOGIC, over the vendored
 * catalog DATA (*.generated.ts). Resolves a 32-bit sampleId hash to its factory
 * name across the eight catalogs, in the oracle's search order.
 *
 * This module statically imports ~1.3MB of catalog data, so it is only ever
 * pulled in via dynamic import() (from the Stage 3 presenter's enrich) — out of the main
 * bundle and loaded lazily the first time a Stage 3 program is opened.
 */
import { ns3NordPianoLibrary } from './ns3-nord-piano-library.generated';
import { ns3NordSampleLibrary2 } from './ns3-nord-sample-library-2.generated';
import { ns3NordSampleLibrary3 } from './ns3-nord-sample-library-3.generated';
import { ns3NordSampleLibraryArchive } from './ns3-nord-sample-library-archive.generated';
import { ns3ProductLibraries } from './ns3-product-libraries.generated';
import { ns3UserLibraries } from './ns3-user-libraries.generated';
import { ns3ScSoundsLibraries } from './ns3-sc-sounds-libraries.generated';
import { ns3RedLibrary } from './ns3-red-library.generated';

interface CatalogEntry { name: string | string[]; version?: string; category?: string; info?: string }
type Catalog = Map<number, CatalogEntry>;

// Same priority order as the oracle's getSample().
const LIBS: Catalog[] = [
  ns3NordPianoLibrary, ns3NordSampleLibrary3, ns3NordSampleLibrary2,
  ns3NordSampleLibraryArchive, ns3ProductLibraries, ns3UserLibraries,
  ns3ScSoundsLibraries, ns3RedLibrary,
] as unknown as Catalog[];

export interface SampleName { name: string; version?: string; category?: string }

/**
 * Resolve a sampleId to its factory sample, or null if unknown. `clavinetModel`
 * selects the variant for clavinet/harpsichord multisamples (whose name is an
 * array of model variations).
 */
export function resolveSample(sampleId: number, clavinetModel = 0): SampleName | null {
  let lib: CatalogEntry | undefined;
  for (const m of LIBS) { lib = m.get(sampleId); if (lib) break; }
  if (!lib || !lib.name) return null;
  if (Array.isArray(lib.name)) {
    const name = clavinetModel >= 0 && clavinetModel < lib.name.length
      ? lib.name[clavinetModel]
      : `${lib.name[0]} (?)`;
    return { name };
  }
  return {
    name: lib.name,
    version: lib.version ? `v${lib.version}` : undefined,
    category: lib.category && lib.category !== 'None' ? lib.category : undefined,
  };
}
