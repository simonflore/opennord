/**
 * Nord Grand 2 (`.ng2p`) body reader — read-only.
 *
 * Applies the Grand 2 OS 1.22 registry layout (`layout.generated.ts`, generated
 * generated) through the shared block-chain reader. The
 * version word and the length-prefixed chain must end exactly at EOF; anything
 * else returns the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NG2_LAYOUT } from './layout.generated';
import type { Ng2Program } from './types';

export function decodeNg2(bytes: Uint8Array): Ng2Program {
  return { format: 'ng2p', ...decodeFwProgram(bytes, NG2_LAYOUT) };
}
