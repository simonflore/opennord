import type { ModelCodec } from '../clavia/model';
import { decodeNp3 } from './decode';
import type { Np3Program } from './types';

/** Nord Piano 3 programs (`np3p`; `np3l` = Live, assumed to hold the same record). Read-only. */
export const np3Codec: ModelCodec<Np3Program> = {
  model: 'np3',
  tags: ['np3p', 'np3l'],
  decode: decodeNp3,
};
