import type { Capture } from './types';
import { stripCbinHeader } from './body';
import { identifyNordFile } from '../clavia/nord-file';
import { pullFile, type ProgramEntry } from '../device/transfer';
import type { NordSession } from '../device/session';

/** A pluggable program reader — one read yields one Capture. */
export interface CaptureSource {
  capture(): Promise<Capture>;
}

function toCapture(file: Uint8Array): Capture {
  return { model: identifyNordFile(file), body: stripCbinHeader(file) };
}

/** Capture from a dropped `.neXp` file (universal, no hardware). */
export function fileCaptureSource(file: Uint8Array): CaptureSource {
  return { capture: async () => toCapture(file) };
}

/** Injected so the slot source is testable without a real device. */
export type ReadFile = (session: NordSession, entry: ProgramEntry) => Promise<Uint8Array>;

/** Capture by reading a specific {bank,slot} off the device (default reader = pullFile). */
export function slotCaptureSource(
  session: NordSession,
  entry: ProgramEntry,
  readFile: ReadFile = pullFile,
): CaptureSource {
  return { capture: async () => toCapture(await readFile(session, entry)) };
}
