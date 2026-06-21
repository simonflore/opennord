/** Device-side user Sample Library transfer: enumerate + pull, both scoped to
 *  PARTITION_SAMP_LIB. The single definition shared by the /device samples flow
 *  and the unified /samples screen, so they can't drift on partition/progress. */
import { enumerateFiles, pullFile, type ProgramEntry } from './transfer';
import { PARTITION_SAMP_LIB } from './opcodes';
import type { NordSession } from './session';

/** List the user Sample Library files (names/slots only — cheap, no byte pull). */
export function enumerateSampleLibrary(session: NordSession): Promise<ProgramEntry[]> {
  return session.withSession(PARTITION_SAMP_LIB, () => enumerateFiles(session));
}

/** Pull one sample off the board, reporting (done, total) bytes as it streams. */
export function pullSample(
  session: NordSession, entry: ProgramEntry, onProgress: (done: number, total: number) => void,
): Promise<Uint8Array> {
  return session.withSession(PARTITION_SAMP_LIB, () => pullFile(session, entry, onProgress));
}
