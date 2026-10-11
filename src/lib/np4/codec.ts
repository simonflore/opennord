import type { ModelCodec } from '../clavia/model';
import { decodeNp4 } from './decode';
import type { Np4Program } from './types';

/** Nord Piano 4 programs (`np4p`; `np4l` = Live). Read-only. */
export const np4Codec: ModelCodec<Np4Program> = {
  model: 'np4',
  tags: ['np4p', 'np4l'],
  decode: decodeNp4,
};
