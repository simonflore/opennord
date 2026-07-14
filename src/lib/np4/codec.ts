import type { ModelCodec } from '../clavia/model';
import { decodeNp4 } from './decode';
import type { Np4Program } from './types';

export const np4Codec: ModelCodec<Np4Program> = {
  model: 'np4',
  tags: ['np4p', 'np4l'],
  decode: decodeNp4,
};
