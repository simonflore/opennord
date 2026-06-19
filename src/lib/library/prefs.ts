/**
 * Library view preferences — sort order + favorited entry ids — persisted in
 * localStorage. Small, non-sensitive, and read on every load, so localStorage
 * (sync, no async ceremony) fits better than IndexedDB here. Favorites are keyed
 * by the entry's stable id (`nord:slot` / `local:<uuid>` / folder scan id), so a
 * favorite survives reload as long as the entry's source is still present.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LibrarySort } from './types';

const KEY = 'opennord.library.prefs';

export interface LibraryPrefs {
  sort: LibrarySort;
  favorites: string[];
}

const DEFAULTS: LibraryPrefs = { sort: 'default', favorites: [] };

export function loadPrefs(): LibraryPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<LibraryPrefs>;
    return {
      sort: p.sort === 'name' || p.sort === 'source' ? p.sort : 'default',
      favorites: Array.isArray(p.favorites) ? p.favorites.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    return DEFAULTS; // missing/locked/corrupt storage → defaults
  }
}

function savePrefs(p: LibraryPrefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable — keep session-only */ }
}

export interface LibraryPrefsApi {
  sort: LibrarySort;
  setSort: (sort: LibrarySort) => void;
  favorites: ReadonlySet<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

/** Reactive library prefs, persisted on every change. */
export function useLibraryPrefs(): LibraryPrefsApi {
  const [prefs, setPrefs] = useState<LibraryPrefs>(loadPrefs);
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const favorites = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);
  const setSort = useCallback((sort: LibrarySort) => setPrefs((p) => ({ ...p, sort })), []);
  const toggleFavorite = useCallback((id: string) => setPrefs((p) => ({
    ...p,
    favorites: p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id],
  })), []);

  return { sort: prefs.sort, setSort, favorites, isFavorite: (id) => favorites.has(id), toggleFavorite };
}
