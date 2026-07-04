/**
 * Nord Piano 4 → DecodedProgram. NP4 (NW1-v3) confirms a coarser piano core than
 * the NW1-v4 models: family (EP/Grand) and the family-wide piano model id are
 * pinned (Ondre bundle meta.xml ground truth); FX are not.
 *
 * The piano NAME comes from the family-wide id table in ns4 — injected by the
 * composition root (presenters.ts) rather than imported here, keeping this
 * module's "Stage oracle is transcribe-only" rule intact.
 */
import { decodeNp4 } from './decode';
import type { DecodedProgram } from '../clavia/decoded';

export function np4Decoded(
  bytes: Uint8Array,
  resolvePianoName?: (modelId: number) => string | undefined,
): DecodedProgram {
  const p = decodeNp4(bytes);
  const pianoName = resolvePianoName?.(p.pianoModelId);
  const parts = [pianoName ?? 'Piano'];

  return {
    title: 'Nord Piano 4 · Program',
    header: [['Version', `v${p.version}`]],
    sections: [{ id: 'A', label: 'PIANO', engines: [{ label: 'Piano', parts }] }],
    note: pianoName
      ? 'Piano 4: piano sound confirmed. The sample layer and FX are not yet decoded.'
      : 'Piano 4: this piano id is not in the known-name table yet. Sample layer and FX not yet decoded.',
    warnings: p.warnings,
  };
}
