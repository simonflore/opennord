// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { LibraryView } from './LibraryView';
import type { LibraryPrefsApi } from '../../lib/library/prefs';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';
import type { CloudStatus } from '../../lib/library/CloudSnapshotContext';

afterEach(cleanup);

const prefs = (over: Partial<LibraryPrefsApi> = {}): LibraryPrefsApi => ({
  sort: 'default', setSort: () => {}, favorites: new Set<string>(), isFavorite: () => false, toggleFavorite: () => {},
  isFavoriteRow: () => false, toggleFavoriteRow: () => {},
  ...over,
});

const folder = (over: Partial<FolderLibrary> = {}): FolderLibrary => ({
  folderName: null,
  result: { programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] },
  bundles: [],
  newBundles: [],
  pickerOpen: false,
  needsReconnect: false,
  reconnectError: null,
  busy: false,
  canPersist: false,
  choose: async () => {},
  reconnect: async () => {},
  refresh: async () => {},
  forget: async () => {},
  openBundlePicker: () => {},
  closeBundlePicker: () => {},
  applyBundleSelection: async () => {},
  openBundle: async () => { throw new Error('Not connected'); },
  writeBack: async () => ({ target: 'download' as const }),
  ...over,
});

// Props common to every render; entries/source vary per test.
const handlers = {
  onSource: () => {}, onQuery: () => {}, clearFilters: () => {}, filtered: false, onOpen: () => {}, onImport: () => {}, onRemove: () => {},
  engines: new Set<never>(), onToggleEngine: () => {}, splitOnly: false, onSplitOnly: () => {},
};

const view = (status: CloudStatus, source: 'cloud' | 'all' = 'cloud', more: { refresh?: () => void; onSignIn?: () => void } = {}) => render(
  <LibraryView entries={[]} source={source} query="" {...handlers} filtered={source !== 'all'} prefs={prefs()} folder={folder()}
    cloud={{ status, refresh: more.refresh ?? vi.fn() }} onSignIn={more.onSignIn ?? vi.fn()} />,
);

/** The Cloud filter with nothing in it says why, rather than "no programs match". */
describe('LibraryView, the Cloud filter empty', () => {
  it('signed out: asks to sign in, and the button signs in', () => {
    const onSignIn = vi.fn();
    view('signed-out', 'cloud', { onSignIn });
    expect(screen.getByText('Sign in to see your cloud snapshot.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
  it('the snapshot still loading: says so, not that nothing matches', () => {
    view('loading');
    expect(screen.getByText('Loading your cloud snapshot…')).toBeInTheDocument();
  });
  it('no snapshot yet: says how one is made', () => {
    view('empty');
    expect(screen.getByText('No snapshot yet. Save your library to the cloud and it shows here.')).toBeInTheDocument();
  });
  it('the cloud unreachable: says so, and Try again reloads it', () => {
    const refresh = vi.fn();
    view('failed', 'cloud', { refresh });
    expect(screen.getByText('Couldn’t reach the cloud.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('a snapshot loaded or loading: the usual empty state', () => {
    view('ready');
    expect(screen.getByText('No programs match your filter.')).toBeInTheDocument();
  });
  it('another source: the usual empty state, whatever the cloud says', () => {
    view('signed-out', 'all');
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    expect(screen.queryByText(/cloud snapshot/)).not.toBeInTheDocument();
  });
  it('offers the Cloud filter only in a build that has the cloud', () => {
    const sources = () => within(screen.getByRole('group', { name: 'Filter by source' }));
    view('signed-out', 'all');
    expect(sources().getByText('Cloud')).toBeInTheDocument();
    cleanup();
    view('absent', 'all');
    expect(sources().queryByText('Cloud')).not.toBeInTheDocument();
  });
});
