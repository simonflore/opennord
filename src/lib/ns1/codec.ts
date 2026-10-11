import type { ModelCodec } from '../clavia/model';
import { decodeNs1 } from './decode';
import type { Ns1Program } from './types';

/**
 * Nord Stage Classic / Stage EX programs (`nspg`). Read-only, and header-only
 * until the record's start in the file is confirmed (see types.ts).
 */
export const ns1Codec: ModelCodec<Ns1Program> = {
  model: 'ns1',
  tags: ['nspg'],
  decode: (bytes) => decodeNs1(bytes),
};
