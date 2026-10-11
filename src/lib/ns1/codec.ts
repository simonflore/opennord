import type { ModelCodec } from '../clavia/model';
import { decodeNs1 } from './decode';
import type { Ns1Program } from './types';

/**
 * Nord Stage Classic / Stage EX programs (`nspg`). Read-only; the record's
 * alignment in the file follows the CBIN framing rule and is not yet confirmed
 * on a real file (see types.ts). The models register no Live partition.
 */
export const ns1Codec: ModelCodec<Ns1Program> = {
  model: 'ns1',
  tags: ['nspg'],
  decode: (bytes) => decodeNs1(bytes),
};
