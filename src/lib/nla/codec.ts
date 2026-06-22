import type { ModelCodec } from '../clavia/model';
import { decodeNla } from './decode';
import type { NlaProgram } from './types';

export const nlaCodec: ModelCodec<NlaProgram> = {
  model: 'nla',
  tags: ['nlas', 'nlap'],
  decode: decodeNla,
};
