/** Device-side Piano Library transfer: enumerate + pull (with progress, since piano
 *  sets are multi-GB), scoped to PARTITION_PIANO. Mirrors device/samples.ts. */
import { enumerateFiles, pullFile, type ProgramEntry } from './transfer';
import { PARTITION_PIANO } from './opcodes';
import type { NordSession } from './session';

/** List the Piano Library files (names/slots only — cheap, no byte pull). */
export function enumeratePianoLibrary(session: NordSession): Promise<ProgramEntry[]> {
  return session.withSession(PARTITION_PIANO, () => enumerateFiles(session));
}

/** Pull one piano off the board, reporting (done, total) bytes as it streams (gigabytes). */
export function pullPiano(
  session: NordSession, entry: ProgramEntry, onProgress: (done: number, total: number) => void,
): Promise<Uint8Array> {
  return session.withSession(PARTITION_PIANO, () => pullFile(session, entry, onProgress));
}
