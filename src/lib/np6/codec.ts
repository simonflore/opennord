import type { ModelCodec } from '../clavia/model';
import { decodeNp6 } from './decode';
import type { Np6Program } from './types';

/** Nord Piano 6 programs (`np6p`; `np6l` = Live). Read-only. */
export const np6Codec: ModelCodec<Np6Program> = {
  model: 'np6',
  tags: ['np6p'],
  decode: decodeNp6,
};
