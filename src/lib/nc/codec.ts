import type { ModelCodec } from '../clavia/model';
import { decodeNc } from './decode';
import type { NcProgram } from './types';

/** Nord C2 programs (`ncpg`, the C2's own tag; the C2D's is `nc2p`). Read-only, alignment unconfirmed. */
export const ncCodec: ModelCodec<NcProgram> = {
  model: 'nc',
  tags: ['ncpg'],
  decode: decodeNc,
};
