/** What a file in the watched folder maps to. */
export type FileClass = 'program' | 'bundle' | 'sample';

/** Program & preset files decode via parseClaviaFile → the Library. */
const PROGRAM_EXTS = ['.ns4p', '.ns4l', '.ns4o', '.ns4n', '.ns4y', '.ne6p', '.ne6l'];
/** ZIP backups — expanded into their contained programs. */
const BUNDLE_EXTS = ['.ns4b'];
/** Nord samples → the Samples tab. */
const SAMPLE_EXTS = ['.nsmp', '.nsmp3', '.nsmp4'];

/** Classify a file path by extension, or `null` if not a Nord file we handle. */
export function classifyFile(path: string): FileClass | null {
  const lower = path.toLowerCase();
  if (lower.endsWith('/')) return null;
  if (PROGRAM_EXTS.some((e) => lower.endsWith(e))) return 'program';
  if (BUNDLE_EXTS.some((e) => lower.endsWith(e))) return 'bundle';
  if (SAMPLE_EXTS.some((e) => lower.endsWith(e))) return 'sample';
  return null;
}
