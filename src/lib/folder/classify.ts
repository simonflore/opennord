/** What a file in the watched folder maps to. */
export type FileClass = 'program' | 'bundle' | 'sample' | 'preset';

/** Program files decode via parseClaviaFile → the Library. */
const PROGRAM_EXTS = ['.ns4p', '.ns4l', '.ne6p', '.ne6l', '.nl4s', '.nl4p'];
/** Organ/Piano/Synth preset files — recognized by tag, listed in the Presets category (no decode). */
const PRESET_EXTS = ['.ns4o', '.ns4n', '.ns4y', '.ns3y', '.ns2y'];
/** ZIP backups — expanded into their contained programs. */
const BUNDLE_EXTS = ['.ns4b'];
/** Nord samples → the Samples tab. `.npno` = piano-library note (CNSP root). */
const SAMPLE_EXTS = ['.nsmp', '.nsmp3', '.nsmp4', '.npno'];

/** Classify a file path by extension, or `null` if not a Nord file we handle. */
export function classifyFile(path: string): FileClass | null {
  const lower = path.toLowerCase();
  if (lower.endsWith('/')) return null;
  if (PRESET_EXTS.some((e) => lower.endsWith(e))) return 'preset';
  if (PROGRAM_EXTS.some((e) => lower.endsWith(e))) return 'program';
  if (BUNDLE_EXTS.some((e) => lower.endsWith(e))) return 'bundle';
  if (SAMPLE_EXTS.some((e) => lower.endsWith(e))) return 'sample';
  return null;
}
