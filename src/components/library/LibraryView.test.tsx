import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LibraryView } from './LibraryView';
import type { LibraryEntry } from '../../lib/library/types';
import type { LibraryPrefsApi } from '../../lib/library/prefs';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';
import { buttonFor } from '../../test-utils/markup';

const entries: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14',
    engines: { axis: 'engine', engines: [{ kind: 'piano', layers: ['A'] }, { kind: 'synth', layers: ['A'] }] } },
  { id: 'local:0', name: 'Sunday Organ', source: 'local',
    engines: { axis: 'engine', engines: [{ kind: 'organ', layers: ['A'] }] } },
];

const prefs = (over: Partial<LibraryPrefsApi> = {}): LibraryPrefsApi => ({
  sort: 'default', setSort: () => {}, favorites: new Set<string>(), isFavorite: () => false, toggleFavorite: () => {},
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
const handlers = { onSource: () => {}, onQuery: () => {}, clearFilters: () => {}, filtered: false, onOpen: () => {}, onImport: () => {}, onRemove: () => {} };

/** True when a rendered tag carries the actual `disabled` DOM attribute —
 * distinct from the always-present `disabled:…` Tailwind variant classes the
 * shared `Button` component's className carries whether or not it's disabled. */
function isDisabled(tagHtml: string): boolean {
  return /\sdisabled(=|>|\/)/.test(tagHtml);
}

/** Pull the `<span>…</span>` whose text content is exactly `label`. */
function spanFor(html: string, label: string): string {
  const m = html.match(new RegExp(`<span[^>]*>${label}</span>`));
  if (!m) throw new Error(`no <span>${label}</span> in markup`);
  return m[0];
}

describe('LibraryView', () => {
  it('renders the title, counts, every entry, and source badges', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('Programs'); // page title matches the rail label
    expect(html).toContain('2 programs');
    expect(html).toContain('Wurli Dream');
    expect(html).toContain('A:14');
    expect(html).toContain('Sunday Organ');
    expect(html).toContain('On Nord');
    expect(html).toContain('Local');
    expect(html).toContain('Import file');
    // engine glimpse chips from the EngineSummary (piano+synth, organ) —
    // each color-codes by kind so a multi-engine patch reads apart at a glance
    expect(spanFor(html, 'piano')).toContain('text-engine-piano');
    expect(spanFor(html, 'synth')).toContain('text-engine-synth');
    expect(spanFor(html, 'organ')).toContain('text-engine-organ');
  });

  it('renders the category facet only when more than one category is present', () => {
    const twoCats: LibraryEntry[] = [
      { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14', category: 'EPiano' },
      { id: 'local:0', name: 'Sunday Organ', source: 'local', category: 'Organ' },
    ];
    const html = renderToStaticMarkup(
      <LibraryView entries={twoCats} source="all" query="" {...handlers}
        category="all" onCategory={() => {}} categoriesPresent={['Organ', 'EPiano']}
        prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('Filter by category');
    expect(html).toContain('Organ');
    expect(html).toContain('EPiano');
  });

  it('hides the category facet when only one category is present', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" {...handlers}
        category="all" onCategory={() => {}} categoriesPresent={['Organ']}
        prefs={prefs()} folder={folder()} />,
    );
    expect(html).not.toContain('Filter by category');
  });

  it('marks the active source chip and makes cards keyboard-activatable', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="nord" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('fill-primary');
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  it('shows an empty hint when there are no entries', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={folder()} />,
    );
    expect(html).toContain('Nothing here yet');
  });

  it('shows a distinct message when a folder is connected but nothing was found in it', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={folder({ folderName: 'Nord Backups' })} />,
    );
    expect(html).toContain('“Nord Backups” is connected, but no Nord files turned up in it.');
    expect(html).not.toContain('Choose a folder of Nord files'); // not the same CTA as never having picked one
    expect(html).toContain('Choose a different folder');
  });

  it('does not show the connected-but-empty message while still scanning', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={folder({ folderName: 'Nord Backups', busy: true })} />,
    );
    expect(html).not.toContain('is connected, but no Nord files turned up');
    expect(html).toContain('Nothing here yet');
  });

  it('does not claim a folder found nothing when it has presets/pianos/samples/backups but no programs', () => {
    const withPreset = folder({
      folderName: 'Nord Backups',
      result: { programs: [], presets: [{ id: 'p', name: 'Preset', path: 'p.ns4o', tag: 't', kind: 'organ-preset', bytes: new Uint8Array() }], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] },
    });
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={withPreset} />,
    );
    expect(html).not.toContain('is connected, but no Nord files turned up');

    const withBundle = folder({ folderName: 'Nord Backups', bundles: [{ path: 'B.ns4b', size: 10 }] });
    const html2 = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={withBundle} />,
    );
    expect(html2).not.toContain('is connected, but no Nord files turned up');
  });

  it('renders a folder-level scan error inline, not behind a hover-only tooltip', () => {
    // Touch-only Android users (the exact audience the Google Drive guidance
    // targets) can't hover a title tooltip — the reason text must be visible.
    const withFolderError = folder({
      folderName: 'F',
      result: {
        programs: [], presets: [], pianos: [], samples: [],
        errors: [{ path: '(folder)', reason: 'That folder returned no readable files.' }],
        backupPianos: [], backupSamples: [],
      },
    });
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={withFolderError} />,
    );
    expect(html).toContain('That folder returned no readable files.');
    expect(html).not.toContain('hover for details');
  });

  it('keeps the hover-summary treatment for per-file scan errors', () => {
    const withFileErrors = folder({
      folderName: 'F',
      result: {
        programs: [], presets: [], pianos: [], samples: [],
        errors: [{ path: 'Bad.ns4p', reason: 'corrupt header' }],
        backupPianos: [], backupSamples: [],
      },
    });
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" {...handlers} prefs={prefs()} folder={withFileErrors} />,
    );
    expect(html).toContain('hover for details');
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
    expect(isDisabled(buttonFor(html, 'Reconnect'))).toBe(true);
    expect(isDisabled(buttonFor(html, 'Forget'))).toBe(false);
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
