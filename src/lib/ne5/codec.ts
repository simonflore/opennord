import type { ModelCodec } from '../clavia/model';
import { decodeNe5 } from './decode';
import type { Ne5Program } from './types';

export const ne5Codec: ModelCodec<Ne5Program> = {
  model: 'ne5',
  tags: ['ne5p', 'ne5l'],
  decode: decodeNe5,
};
