import type { ModelCodec } from '../clavia/model';
import { decodeNw2 } from './decode';
import type { Nw2Program } from './types';

export const nw2Codec: ModelCodec<Nw2Program> = {
  model: 'nw2',
  tags: ['nw2p', 'nw2l'],
  decode: decodeNw2,
};
