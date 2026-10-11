import type { ModelCodec } from '../clavia/model';
import { decodeNp2 } from './decode';
import type { Np2Program } from './types';

/** Nord Piano 2 programs (`np2p`). Read-only; a Live (`np2l`) reaches it through formats.ts `programTagFor`. */
export const np2Codec: ModelCodec<Np2Program> = {
  model: 'np2',
  tags: ['np2p'],
  decode: decodeNp2,
};
