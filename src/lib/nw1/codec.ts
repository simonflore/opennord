import type { ModelCodec } from '../clavia/model';
import { decodeNw1 } from './decode';
import type { Nw1Program } from './types';

export const nw1Codec: ModelCodec<Nw1Program> = {
  model: 'nw1',
  tags: ['nwp'],
  decode: decodeNw1,
};
