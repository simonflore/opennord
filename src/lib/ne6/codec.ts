/**
 * Nord Electro 6 model codec — wraps `decodeNe6` behind the generic
 * {@link ModelCodec} seam (../clavia/model.ts). Registered in the composition
 * root (`src/lib/formats.ts`). Claims `ne6p` (standalone) and `ne6l`
 * (bundle-extracted) programs.
 */
import type { ModelCodec } from '../clavia/model';
import { decodeNe6 } from './decode';
import type { Ne6Program } from './types';

export const ne6Codec: ModelCodec<Ne6Program> = {
  model: 'ne6',
  tags: ['ne6p', 'ne6l'],
  decode: decodeNe6,
};
