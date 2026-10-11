/**
 * Nord Organ 3 (`.no3p`) body reader — read-only, provisional.
 *
 * Applies the Organ 3 OS 1.00 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader. The
 * block order is medium confidence (see types.ts); the presenter's note says so
 * on every decoded program. The version word and the length-prefixed chain must
 * end exactly at EOF; anything else returns the header-only result with a
 * warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NO3_LAYOUT } from './layout.generated';
import type { No3Program } from './types';

export function decodeNo3(bytes: Uint8Array): No3Program {
  return { format: 'no3p', ...decodeFwProgram(bytes, NO3_LAYOUT) };
}
