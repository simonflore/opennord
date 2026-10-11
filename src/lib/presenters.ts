/**
 * Presenter registry — the composition root for the shared decoded-program view
 * (sibling to formats.ts, same role for presentation). Maps a recognized Nord
 * file to its {@link DecodedProgram} via the model's presenter. Adding a model =
 * one entry here + a `present.ts`; the view, drawbar widget, FX chips and lazy
 * name resolver are all shared.
 *
 * Lives outside clavia/ to keep the model → clavia dependency direction (this
 * imports the model presenters; clavia/ never imports models).
 */
import { identifyNordFile } from './clavia/nord-file';
import { programTagFor } from './formats';
import type { DecodedProgram } from './clavia/decoded';
import { ns3Decoded } from './ns3/present';
import { ns2Decoded } from './ns2/present';
import { ng2Decoded } from './ng2/present';
import { np5Decoded } from './np5/present';
import { np4Decoded } from './np4/present';
import { PIANO_NAMES } from './ns4/names.generated';
import { ne5Decoded } from './ne5/present';
import { ne6Decoded } from './ne6/present';
import { nw2Decoded } from './nw2/present';
import { nlaDecoded } from './nla/present';
import { ngDecoded } from './ng/present';
import { np6Decoded } from './np6/present';
import { ne7Decoded } from './ne7/present';
import { no3Decoded } from './no3/present';
import { np3Decoded } from './np3/present';
import { ncDecoded } from './nc/present';
import { ns1Decoded } from './ns1/present';
import { np1Decoded } from './np1/present';
import { np2Decoded } from './np2/present';
import { ne3Decoded } from './ne3/present';
import { nc2Decoded } from './nc2/present';
import { nw1Decoded } from './nw1/present';

/** Family-wide piano-name lookup (the 32-bit piano name hash → display name). */
const pianoName = (hash: number): string | undefined => PIANO_NAMES[hash];

interface PresenterEntry {
  /** The program tag(s) this presenter reads; a Live file reaches it through its program tag (formats.ts `programTagFor`). */
  tags: readonly string[];
  present: (bytes: Uint8Array) => DecodedProgram;
}

// NOTE: Stage 2 & Stage 3 now render through their rich per-engine views
// (Ns2ProgramView/Ns3ProgramView), which ProgramView dispatches *before* this
// registry. These entries (and the shared DecodedProgramView) are kept as the
// lean on-ramp for the next not-yet-rich model — add a model here + a present.ts
// to get it rendering immediately, then graduate it to a rich view later.
const PRESENTERS: readonly PresenterEntry[] = [
  { tags: ['ns3f'], present: ns3Decoded },
  { tags: ['ns2p'], present: ns2Decoded },
  { tags: ['ne5p'], present: ne5Decoded },
  { tags: ['ne6p'], present: ne6Decoded },
  { tags: ['nw2p'], present: nw2Decoded },
  { tags: ['nlas', 'nlap'], present: nlaDecoded },
  // Firmware-layout readers (clavia/block-chain.ts). The family-wide piano-name
  // table is injected here (the 32-bit NameHash is the PIANO_NAMES key) — the
  // model modules never import ns4. Electro 7 / Organ 3 are provisional until a
  // real file confirms the block order (their notes say so).
  { tags: ['np4p'], present: (bytes) => np4Decoded(bytes, pianoName) },
  { tags: ['np5p'], present: (bytes) => np5Decoded(bytes, pianoName) },
  { tags: ['ng2p'], present: (bytes) => ng2Decoded(bytes, pianoName) },
  { tags: ['ngp'], present: (bytes) => ngDecoded(bytes, pianoName) },
  { tags: ['np6p'], present: (bytes) => np6Decoded(bytes, pianoName) },
  { tags: ['ne7p'], present: (bytes) => ne7Decoded(bytes, pianoName) },
  { tags: ['no3p'], present: no3Decoded },
  // Later ColdFire legacy records (clavia/legacy-program.ts).
  { tags: ['np3p'], present: np3Decoded },
  { tags: ['np2p'], present: np2Decoded },
  { tags: ['nppg'], present: np1Decoded },
  { tags: ['nspg'], present: ns1Decoded },
  { tags: ['ncpg'], present: ncDecoded },
  // Legacy-record readers (clavia/legacy-record.ts), provisional
  // until a real file confirms the alignment.
  { tags: ['nepg'], present: ne3Decoded },
  { tags: ['nc2p'], present: nc2Decoded },
  { tags: ['nwp'], present: nw1Decoded },
];

/** The shared decoded-program presentation for a file, or null if no model claims it. */
export function decodedProgramFor(bytes: Uint8Array): DecodedProgram | null {
  const tag = programTagFor(identifyNordFile(bytes), bytes);
  const entry = tag ? PRESENTERS.find((p) => p.tags.includes(tag)) : undefined;
  return entry ? entry.present(bytes) : null;
}
