import type { ModelCodec } from '../clavia/model';
import { decodeNp5 } from './decode';
import type { Np5Program } from './types';

export const np5Codec: ModelCodec<Np5Program> = {
  model: 'np5',
  tags: ['np5p', 'np5l'],
  decode: decodeNp5,
};
