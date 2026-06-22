import type { ModelCodec } from '../clavia/model';
import { decodeNg2 } from './decode';
import type { Ng2Program } from './types';

export const ng2Codec: ModelCodec<Ng2Program> = {
  model: 'ng2',
  tags: ['ng2p', 'ng2l'],
  decode: decodeNg2,
};
