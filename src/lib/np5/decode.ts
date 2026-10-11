/**
 * Nord Piano 5 (`.np5p`) body reader — read-only.
 *
 * Applies the Piano 5 OS 1.34 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader. The
 * version word and the length-prefixed chain must end exactly at EOF; anything
 * else returns the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NP5_LAYOUT } from './layout.generated';
import type { Np5Program } from './types';

export function decodeNp5(bytes: Uint8Array): Np5Program {
  return { format: 'np5p', ...decodeFwProgram(bytes, NP5_LAYOUT) };
}
