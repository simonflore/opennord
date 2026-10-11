import type { ModelCodec } from '../clavia/model';
import { decodeNo3 } from './decode';
import type { No3Program } from './types';

/** Nord Organ 3 programs (`no3p`; `no3l` = Live). Read-only, provisional. */
export const no3Codec: ModelCodec<No3Program> = {
  model: 'no3',
  tags: ['no3p'],
  decode: decodeNo3,
};
