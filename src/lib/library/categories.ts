/** A browsable Library category. The rail and routing read this list — never a hardcoded set. */
export interface LibraryCategory {
  id: 'programs' | 'pianos' | 'samples' | 'presets';
  /** Rail sub-item text. */
  label: string;
  /** Route path, always `/library/${id}`. */
  path: string;
  /** false → shown in the rail but disabled (no route yet); a later sub-project flips it. */
  ready: boolean;
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { id: 'programs', label: 'Programs', path: '/library/programs', ready: true },
  { id: 'pianos', label: 'Pianos', path: '/library/pianos', ready: false },
  { id: 'samples', label: 'Samples', path: '/library/samples', ready: true },
  { id: 'presets', label: 'Presets', path: '/library/presets', ready: false },
];

/** Match a pathname (e.g. `/library/programs` or `/library/programs/$id`) to its category. */
export function categoryForPath(path: string): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => path === c.path || path.startsWith(c.path + '/'));
}
