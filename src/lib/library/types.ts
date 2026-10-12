import type { NordProgram } from '../formats';
import type { EngineSummary } from '../clavia/engines';

export type LibrarySource = 'nord' | 'local' | 'backup' | 'cloud';

/** How each source reads in the UI: badges, filters, the rail and the palette. */
export const SOURCE_LABEL: Record<LibrarySource, string> = { nord: 'On Nord', local: 'Local', backup: 'Backup', cloud: 'Cloud' };

/** Library sort order. `default` keeps the natural source order (Nord → folder → local). */
export type LibrarySort = 'default' | 'name' | 'source';

/** One row in the unified Library — a program from the Nord or a local file. */
export interface LibraryEntry {
  id: string;            // stable key, e.g. "nord:A:26" or "local:3"
  name: string;
  source: LibrarySource;
  slot?: string;         // "A:26" for nord entries; undefined for local
  typeLabel?: string;    // file-type badge for local/backup files, e.g. ".ns4p"
  generation?: 'Stage 2' | 'Stage 3' | 'Stage 4'; // file generation, for the format facet
  category?: string;     // Nord category name, e.g. "Pad" (CBIN header byte 0x10), for the category facet
  /** Which engines are active, on this file's own generation axis. */
  engines?: EngineSummary;
  program?: NordProgram; // parsed program when available (local: from file; nord: when pulled)
  bytes?: Uint8Array;    // raw bytes when available
}

/** Whether an entry was imported into the app's own store (`local:` ids), the
 *  only kind the user can remove: a folder file (`folder:`) stays on disk. */
export function isImported(id: string): boolean {
  return id.startsWith('local:');
}
