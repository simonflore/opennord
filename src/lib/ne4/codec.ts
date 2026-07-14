import type { ModelCodec } from '../clavia/model';
import { decodeNe4 } from './decode';
import type { Ne4Program } from './types';

export const ne4Codec: ModelCodec<Ne4Program> = {
  model: 'ne4',
  tags: ['ne4p', 'ne4l'],
  decode: decodeNe4,
};
