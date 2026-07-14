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
  // Lite piano/organ models: surface the Stage-oracle-confirmed core fields.
  { match: (i) => i.tag === 'ng2p', present: ng2Decoded },
  { match: (i) => i.tag === 'np5p', present: np5Decoded },
  // np4 gets the family-wide piano-name table injected here — the np4 module
  // itself treats ns4 as a transcribe-only oracle and never imports it.
  { match: (i) => i.tag === 'np4p', present: (bytes) => np4Decoded(bytes, (id) => PIANO_NAMES[id]) },
  { match: (i) => i.tag === 'ne5p', present: ne5Decoded },
  { match: (i) => i.tag === 'ne6p', present: ne6Decoded },
  { match: (i) => i.tag === 'nw2p', present: nw2Decoded },
  { match: (i) => i.tag === 'nlas' || i.tag === 'nlap', present: nlaDecoded },
];

/** The shared decoded-program presentation for a file, or null if no model claims it. */
export function decodedProgramFor(bytes: Uint8Array): DecodedProgram | null {
  const info = identifyNordFile(bytes);
  const entry = PRESENTERS.find((p) => p.match(info));
  return entry ? entry.present(bytes) : null;
}
