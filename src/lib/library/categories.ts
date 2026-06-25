import type { NavTo } from '../../components/shell/nav';

export type CategoryId = 'programs' | 'pianos' | 'samples' | 'presets';

interface CategoryBase { id: CategoryId; label: string }
/** A browsable Library category. The rail/routing read this list — never a hardcoded set.
 *  A READY category's `path` is typed `NavTo`, so flipping a category to ready without
 *  registering its route fails typecheck. */
export type LibraryCategory =
  | (CategoryBase & { ready: true; path: NavTo })
  | (CategoryBase & { ready: false; path: string });

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { id: 'programs', label: 'Programs', path: '/library/programs', ready: true },
  { id: 'pianos',   label: 'Pianos',   path: '/library/pianos',   ready: false },
  { id: 'samples',  label: 'Samples',  path: '/library/samples',  ready: true },
  { id: 'presets',  label: 'Presets',  path: '/library/presets',  ready: true },
];

/** Match a pathname (e.g. `/library/programs` or `/library/programs/$id`) to its category. */
export function categoryForPath(path: string): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => path === c.path || path.startsWith(c.path + '/'));
}
