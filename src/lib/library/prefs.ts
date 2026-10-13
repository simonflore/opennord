/**
 * Browse-screen preferences — sort order + favorited ids — persisted in
 * localStorage (sync, no async ceremony; small and read on every load).
 * Favorites are keyed by the entry's stable id, so they survive reload as long
 * as the source is still present. The Library and Samples screens each get their
 * own blob (different sort vocabularies, independent favorites).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LibrarySort } from './types';
import { favoriteKeysFor, isFavoriteRow, type Mergeable } from './found-on';

export type SampleSort = 'default' | 'name' | 'name-desc' | 'size' | 'size-asc' | 'strokes';

/** Preset browse sort vocabulary — presets have name + size (no strokes). */
export type PresetSort = 'default' | 'name' | 'size';

/** Piano browse sort — pianos are resources: name + size. */
export type PianoSort = 'default' | 'name' | 'size';

interface PersistedPrefs<S extends string> {
  sort: S;
  favorites: string[];
}

function loadPrefs<S extends string>(key: string, parseSort: (raw: unknown) => S): PersistedPrefs<S> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { sort: parseSort(undefined), favorites: [] };
    const p = JSON.parse(raw) as Partial<PersistedPrefs<S>>;
    return {
      sort: parseSort(p.sort),
      favorites: Array.isArray(p.favorites) ? p.favorites.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    return { sort: parseSort(undefined), favorites: [] };
  }
}

function savePrefs<S extends string>(key: string, p: PersistedPrefs<S>): void {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* storage unavailable — session-only */ }
}

export interface PrefsApi<S extends string> {
  sort: S;
  setSort: (sort: S) => void;
  favorites: ReadonlySet<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  /** Whether a row is a favourite: through its id, any member's id, or its fingerprint. */
  isFavoriteRow: (row: Mergeable) => boolean;
  toggleFavoriteRow: (row: Mergeable) => void;
}

/** Reactive, persisted prefs for one browse screen. */
function usePrefs<S extends string>(key: string, parseSort: (raw: unknown) => S): PrefsApi<S> {
  const [prefs, setPrefs] = useState<PersistedPrefs<S>>(() => loadPrefs(key, parseSort));
  useEffect(() => { savePrefs(key, prefs); }, [key, prefs]);

  const favorites = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);
  const setSort = useCallback((sort: S) => setPrefs((p) => ({ ...p, sort })), []);
  const toggleFavorite = useCallback((id: string) => setPrefs((p) => ({
    ...p,
    favorites: p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id],
  })), []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);
  const isFavoriteRowCb = useCallback((row: Mergeable) => isFavoriteRow(favorites, row), [favorites]);
  // A row is marked by its fingerprint and every entry's id, so it stays marked
  // whichever entry it is shown as and whether or not its bytes are here; unmarking
  // clears every key it could have been marked by, old per-entry favourites included.
  const toggleFavoriteRow = useCallback((row: Mergeable) => setPrefs((p) => {
    const keys = favoriteKeysFor(row);
    const on = keys.some((k) => p.favorites.includes(k));
    return { ...p, favorites: on ? p.favorites.filter((k) => !keys.includes(k)) : [...p.favorites, ...keys.filter((k) => !p.favorites.includes(k))] };
  }), []);
  return { sort: prefs.sort, setSort, favorites, isFavorite, toggleFavorite, isFavoriteRow: isFavoriteRowCb, toggleFavoriteRow };
}

const parseLibrarySort = (raw: unknown): LibrarySort =>
  raw === 'name' || raw === 'source' ? raw : 'default';
const parseSampleSort = (raw: unknown): SampleSort =>
  raw === 'name' || raw === 'name-desc' || raw === 'size' || raw === 'size-asc' || raw === 'strokes'
    ? raw : 'default';

export type LibraryPrefsApi = PrefsApi<LibrarySort>;
export type SamplesPrefsApi = PrefsApi<SampleSort>;

/** Library (programs) view prefs — persisted under `opennord.library.prefs`. */
export function useLibraryPrefs(): LibraryPrefsApi {
  return usePrefs('opennord.library.prefs', parseLibrarySort);
}

/** Samples view prefs — persisted under `opennord.samples.prefs`. */
export function useSamplesPrefs(): SamplesPrefsApi {
  return usePrefs('opennord.samples.prefs', parseSampleSort);
}

const parsePresetSort = (raw: unknown): PresetSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

export type PresetsPrefsApi = PrefsApi<PresetSort>;

/** Presets view prefs — persisted under `opennord.presets.prefs`. */
export function usePresetsPrefs(): PresetsPrefsApi {
  return usePrefs('opennord.presets.prefs', parsePresetSort);
}

const parsePianoSort = (raw: unknown): PianoSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

export type PianosPrefsApi = PrefsApi<PianoSort>;

/** Pianos view prefs — persisted under `opennord.pianos.prefs`. */
export function usePianosPrefs(): PianosPrefsApi {
  return usePrefs('opennord.pianos.prefs', parsePianoSort);
}
