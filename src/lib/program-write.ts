/**
 * Program writers by model — the write-side counterpart of formats.ts. Each
 * entry pairs a model with the layout and framing its reader uses, so an edit
 * lands exactly where the reader reads it; the in-place writing, range checks
 * and checksum live in clavia/layout-write.ts. Values are keyed like the
 * reader's `values` (the generated field keys).
 *
 * Stage 4 programs have their own writer (ns4/writer.ts). Not wired into the
 * UI yet: no product flow edits a non-Stage-4 program today.
 */
import type { ClaviaModel } from './clavia/model';
import { LAYOUT_WRITERS, NOT_WRITABLE, ProgramWriteError, type ProgramValues, type ProgramWriter } from './program-write-layout';

export { ProgramWriteError, NOT_WRITABLE, type ProgramValues };

/** The models OpenNord writes, and how (program-write-layout.ts). */
export const PROGRAM_WRITERS: Partial<Record<ClaviaModel, ProgramWriter>> =
  Object.fromEntries(Object.entries(LAYOUT_WRITERS).map(([model, w]) => [model, w.write]));

/**
 * Write `values` into a `model` program file and return the new, resealed file
 * (the input is not changed). Throws a {@link ProgramWriteError} for a model,
 * file or value it can't write.
 */
export function writeProgram(model: ClaviaModel, bytes: Uint8Array, values: ProgramValues): Uint8Array {
  const write = PROGRAM_WRITERS[model];
  if (!write) throw new ProgramWriteError(`OpenNord can’t write this program: ${NOT_WRITABLE[model] ?? 'its model is not supported'}`);
  return write(bytes, values);
}
