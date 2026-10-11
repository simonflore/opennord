/**
 * Nord Piano 6 (`.np6p`) body reader — read-only.
 *
 * Applies the Piano 6 OS 1.20 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader. The
 * version word and the length-prefixed chain must end exactly at EOF; anything
 * else returns the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NP6_LAYOUT } from './layout.generated';
import type { Np6Program } from './types';

export function decodeNp6(bytes: Uint8Array): Np6Program {
  return { format: 'np6p', ...decodeFwProgram(bytes, NP6_LAYOUT) };
}
