/**
 * Nord Electro 7 (`.ne7p`) body reader — read-only, provisional.
 *
 * Applies the Electro 7 OS 1.30 registry layout (`layout.generated.ts`,
 * generated) through the shared block-chain
 * reader. The block order is medium confidence (see types.ts); the presenter's
 * note says so on every decoded program. The version word
 * and the length-prefixed chain must end exactly at EOF; anything else returns
 * the header-only result with a warning. Never throws.
 */
import { decodeFwProgram } from '../clavia/block-chain';
import { NE7_LAYOUT } from './layout.generated';
import type { Ne7Program } from './types';

export function decodeNe7(bytes: Uint8Array): Ne7Program {
  return { format: 'ne7p', ...decodeFwProgram(bytes, NE7_LAYOUT) };
}
