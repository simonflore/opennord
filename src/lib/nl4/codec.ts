import type { ModelCodec } from '../clavia/model';
import { decodeNl4 } from './decode';
import type { Nl4Program } from './types';

export const nl4Codec: ModelCodec<Nl4Program> = {
  model: 'nl4',
  tags: ['nl4s', 'nl4p'],
  decode: decodeNl4,
};
