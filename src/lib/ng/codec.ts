import type { ModelCodec } from '../clavia/model';
import { decodeNg } from './decode';
import type { NgProgram } from './types';

/** Nord Grand programs (`ngp`; `ngl` = Live). Read-only. */
export const ngCodec: ModelCodec<NgProgram> = {
  model: 'ng',
  tags: ['ngp'],
  decode: decodeNg,
};
