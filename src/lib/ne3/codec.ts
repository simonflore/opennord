import type { ModelCodec } from '../clavia/model';
import { decodeNe3 } from './decode';
import type { Ne3Program } from './types';

/** Electro 3 and Electro 3 HP programs share the `nepg` tag and record. */
export const ne3Codec: ModelCodec<Ne3Program> = {
  model: 'ne3',
  tags: ['nepg'],
  decode: decodeNe3,
};
