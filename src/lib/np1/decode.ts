/**
 * Nord Piano (`.nppg`) reader — the Nord Piano OS 1.50 parameter descriptors
 * (`layout.generated.ts`, generated) read
 * through the shared legacy program reader. The record has no version; its
 * file position (0x1A) is a guess (low), which the presenter's note states on
 * every decode. See types.ts. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { NP1_LAYOUT } from './layout.generated';
import type { Np1Program } from './types';

export function decodeNp1(bytes: Uint8Array): Np1Program {
  return { ...decodeLegacyProgram(bytes, NP1_LAYOUT, { model: 'Nord Piano' }), format: 'nppg' };
}
