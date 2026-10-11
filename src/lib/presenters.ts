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
import { identifyNordFile, type NordFileInfo } from './clavia/nord-file';
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
  match: (info: NordFileInfo) => boolean;
  present: (bytes: Uint8Array) => DecodedProgram;
}

// NOTE: Stage 2 & Stage 3 now render through their rich per-engine views
// (Ns2ProgramView/Ns3ProgramView), which ProgramView dispatches *before* this
// registry. These entries (and the shared DecodedProgramView) are kept as the
// lean on-ramp for the next not-yet-rich model — add a model here + a present.ts
// to get it rendering immediately, then graduate it to a rich view later.
const PRESENTERS: readonly PresenterEntry[] = [
  { match: (i) => i.generation === 'Stage 3' && i.kind === 'performance', present: ns3Decoded },
  { match: (i) => i.generation === 'Stage 2' && i.kind === 'program', present: ns2Decoded },
  { match: (i) => i.tag === 'ne5p' || i.tag === 'ne5l', present: ne5Decoded },
  { match: (i) => i.tag === 'ne6p' || i.tag === 'ne6l', present: ne6Decoded },
  { match: (i) => i.tag === 'nw2p' || i.tag === 'nw2l', present: nw2Decoded },
  { match: (i) => i.tag === 'nlas' || i.tag === 'nlap', present: nlaDecoded },
  // Firmware-layout readers (clavia/block-chain.ts), programs and Lives. The
  // family-wide piano-name table is injected here (the 32-bit NameHash is the
  // PIANO_NAMES key) — the model modules never import ns4. Electro 7 / Organ 3
  // are provisional until a real file confirms the block order (their notes say so).
  { match: (i) => i.tag === 'np4p' || i.tag === 'np4l', present: (bytes) => np4Decoded(bytes, pianoName) },
  { match: (i) => i.tag === 'np5p' || i.tag === 'np5l', present: (bytes) => np5Decoded(bytes, pianoName) },
  { match: (i) => i.tag === 'ng2p' || i.tag === 'ng2l', present: (bytes) => ng2Decoded(bytes, pianoName) },
  { match: (i) => i.tag === 'ngp' || i.tag === 'ngl', present: (bytes) => ngDecoded(bytes, pianoName) },
  { match: (i) => i.tag === 'np6p' || i.tag === 'np6l', present: (bytes) => np6Decoded(bytes, pianoName) },
  { match: (i) => i.tag === 'ne7p' || i.tag === 'ne7l', present: (bytes) => ne7Decoded(bytes, pianoName) },
  { match: (i) => i.tag === 'no3p' || i.tag === 'no3l', present: no3Decoded },
  // Later ColdFire legacy records (clavia/legacy-program.ts).
  { match: (i) => i.tag === 'np3p' || i.tag === 'np3l', present: np3Decoded },
  { match: (i) => i.tag === 'np2p', present: np2Decoded },
  { match: (i) => i.tag === 'nppg', present: np1Decoded },
  { match: (i) => i.tag === 'nspg', present: (bytes) => ns1Decoded(bytes) },
  { match: (i) => i.tag === 'ncpg', present: ncDecoded },
  // Legacy-record readers (clavia/legacy-record.ts), firmware-derived and provisional
  // until a real file confirms the alignment. The Electro 3 Live partition's tag is
  // not known, and the C2D and Wave register no Live partition, so only programs route here.
  { match: (i) => i.tag === 'nepg', present: ne3Decoded },
  { match: (i) => i.tag === 'nc2p', present: nc2Decoded },
  { match: (i) => i.tag === 'nwp', present: nw1Decoded },
];

/** The shared decoded-program presentation for a file, or null if no model claims it. */
export function decodedProgramFor(bytes: Uint8Array): DecodedProgram | null {
  const info = identifyNordFile(bytes);
  const entry = PRESENTERS.find((p) => p.match(info));
  return entry ? entry.present(bytes) : null;
}
