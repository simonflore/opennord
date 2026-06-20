/**
 * The Stage 4 model codec — wraps the existing `parseNs4Program` behind the
 * generic {@link ModelCodec} seam (../clavia/model.ts). Registered in the
 * composition root (`src/lib/formats.ts`). This is the "NS4 path becomes the ns4
 * codec, with zero behavior change" step from docs/MULTI-MODEL.md.
 */
import type { ModelCodec } from '../clavia/model';
import { parseNs4Program } from './parse';
import type { NS4Program } from './types';

/** Claims `.ns4p` (standalone) and `.ns4l` (bundle-extracted) programs. */
export const ns4Codec: ModelCodec<NS4Program> = {
  model: 'ns4',
  tags: ['ns4p', 'ns4l'],
  decode: parseNs4Program,
};
