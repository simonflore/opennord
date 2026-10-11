import type { ModelCodec } from '../clavia/model';
import { decodeNp1 } from './decode';
import type { Np1Program } from './types';

/** Nord Piano (first generation) programs (`nppg`). Read-only; record position in the file assumed. */
export const np1Codec: ModelCodec<Np1Program> = {
  model: 'np1',
  tags: ['nppg'],
  decode: decodeNp1,
};
