import type { ModelCodec } from '../clavia/model';
import { decodeNg2 } from './decode';
import type { Ng2Program } from './types';

/** Nord Grand 2 programs (`ng2p`; `ng2l` = Live). Read-only. */
export const ng2Codec: ModelCodec<Ng2Program> = {
  model: 'ng2',
  tags: ['ng2p'],
  decode: decodeNg2,
};
