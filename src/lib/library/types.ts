import type { NS4Program } from '../ns4/types';

export type LibrarySource = 'nord' | 'local';

/** Library sort order. `default` keeps the natural source order (Nord → folder → local). */
export type LibrarySort = 'default' | 'name' | 'source';

/** One row in the unified Library — a program from the Nord or a local file. */
export interface LibraryEntry {
  id: string;            // stable key, e.g. "nord:A:26" or "local:3"
  name: string;
  source: LibrarySource;
  slot?: string;         // "A:26" for nord entries; undefined for local
  summary?: string;      // engine summary, e.g. "organ + synth"
  program?: NS4Program;  // parsed program when available (local: from file; nord: when pulled)
  bytes?: Uint8Array;    // raw bytes when available
}
