import type { ModelCodec } from '../clavia/model';
import { decodeNp3 } from './decode';
import type { Np3Program } from './types';

/** Nord Piano 3 programs (`np3p`; a Live `np3l` with the same record length reads here too). Read-only. */
export const np3Codec: ModelCodec<Np3Program> = {
  model: 'np3',
  tags: ['np3p'],
  decode: decodeNp3,
};
