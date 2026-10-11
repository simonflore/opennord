/**
 * Nord Piano 4 (`.np4p`) body reader — read-only.
 *
 * Applies the Piano 4 OS 2.66 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader. The
 * version word and the length-prefixed chain must end exactly at EOF; anything
 * else returns the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NP4_LAYOUT } from './layout.generated';
import type { Np4Program } from './types';

export function decodeNp4(bytes: Uint8Array): Np4Program {
  return { format: 'np4p', ...decodeFwProgram(bytes, NP4_LAYOUT) };
}
