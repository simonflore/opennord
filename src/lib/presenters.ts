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
];

/** The shared decoded-program presentation for a file, or null if no model claims it. */
export function decodedProgramFor(bytes: Uint8Array): DecodedProgram | null {
  const info = identifyNordFile(bytes);
  const entry = PRESENTERS.find((p) => p.match(info));
  return entry ? entry.present(bytes) : null;
}
