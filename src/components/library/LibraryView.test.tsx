import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LibraryView } from './LibraryView';
import type { LibraryEntry } from '../../lib/library/types';
import type { LibraryPrefsApi } from '../../lib/library/prefs';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';

const entries: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14', summary: 'piano + synth' },
  { id: 'local:0', name: 'Sunday Organ', source: 'local', summary: 'organ' },
];

const prefs = (over: Partial<LibraryPrefsApi> = {}): LibraryPrefsApi => ({
  sort: 'default', setSort: () => {}, favorites: new Set<string>(), isFavorite: () => false, toggleFavorite: () => {},
  ...over,
});

const folder = (over: Partial<FolderLibrary> = {}): FolderLibrary => ({
  folderName: null,
  result: { programs: [], samples: [], errors: [] },
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
  ...over,
});

// Props common to every render; entries/source vary per test.
const handlers = { onSource: () => {}, onQuery: () => {}, onOpen: () => {}, onImport: () => {}, onRemove: () => {} };

/** Pull the `<button>…</button>` whose text content is exactly `label`. */
function buttonFor(html: string, label: string): string {
  const m = html.match(new RegExp(`<button[^>]*>${label}</button>`));
  if (!m) throw new Error(`no <button>${label}</button> in markup`);
  return m[0];
}

describe('LibraryView', () => {
  it('renders the title, counts, every entry, and source badges', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('Library');
    expect(html).toContain('2 programs');
    expect(html).toContain('Wurli Dream');
    expect(html).toContain('A:14');
    expect(html).toContain('Sunday Organ');
    expect(html).toContain('On Nord');
    expect(html).toContain('Local');
    expect(html).toContain('Import file');
    // engine glimpse chips from the summary ("piano + synth", "organ")
    expect(html).toContain('lib-eng--piano');
    expect(html).toContain('lib-eng--synth');
    expect(html).toContain('lib-eng--organ');
  });

  it('marks the active source chip and makes cards keyboard-activatable', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="nord" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('on-chip--active');
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  it('shows an empty hint when there are no entries', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('Nothing here yet');
  });

  it('keeps Forget enabled while busy so it is always an escape hatch', () => {
    const html = renderToStaticMarkup(
      <LibraryView
        entries={[]} source="all" query="" {...handlers}
        prefs={prefs()} folder={folder({ folderName: 'TBM', needsReconnect: true, busy: true })}
      />,
    );
    // A pending browser dialog flips `busy`; Reconnect rightly disables to avoid
    // double-triggering, but Forget must stay clickable to break the deadlock.
    expect(buttonFor(html, 'Reconnect')).toContain('disabled');
    expect(buttonFor(html, 'Forget')).not.toContain('disabled');
  });

  it('surfaces a reconnect error in the banner instead of failing silently', () => {
    const html = renderToStaticMarkup(
      <LibraryView
        entries={[]} source="all" query="" {...handlers}
        prefs={prefs()} folder={folder({ folderName: 'TBM', needsReconnect: true, reconnectError: 'Read access was denied.' })}
      />,
    );
    expect(html).toContain('Read access was denied.');
  });

  it('shows a remove control on local cards but not on nord cards', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('aria-label="Remove Sunday Organ"'); // local
    expect(html).not.toContain('aria-label="Remove Wurli Dream"'); // nord
  });

  it('offers a Disconnect control on a connected folder chip', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers}
        prefs={prefs()} folder={folder({ folderName: 'My Patches', canPersist: true })} />,
    );
    expect(html).toContain('aria-label="Disconnect folder"');
  });

  it('renders a sort selector and a favorite toggle per card', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('aria-label="Sort patches"');
    expect(html).toContain('aria-label="Favorite Wurli Dream"');   // unfavorited → "Favorite …"
    expect(html).toContain('aria-label="Favorite Sunday Organ"');
  });

  it('marks a favorited card as pressed and offers to unfavorite it', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers}
        prefs={prefs({ favorites: new Set(['local:0']) })} folder={folder()} />,
    );
    expect(html).toContain('aria-label="Unfavorite Sunday Organ"');
    expect(html).toContain('aria-pressed="true"');
  });
});
