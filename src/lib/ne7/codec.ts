import type { ModelCodec } from '../clavia/model';
import { decodeNe7 } from './decode';
import type { Ne7Program } from './types';

/** Nord Electro 7 programs (`ne7p`; `ne7l` = Live). Read-only, provisional. */
export const ne7Codec: ModelCodec<Ne7Program> = {
  model: 'ne7',
  tags: ['ne7p', 'ne7l'],
  decode: decodeNe7,
};
