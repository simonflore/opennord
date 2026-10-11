import type { ModelCodec } from '../clavia/model';
import { decodeNc2 } from './decode';
import type { Nc2Program } from './types';

/** C2D programs (layout from the C2D firmware; C2 files share the tag, assumed the same record). */
export const nc2Codec: ModelCodec<Nc2Program> = {
  model: 'nc2',
  tags: ['nc2p'],
  decode: decodeNc2,
};
