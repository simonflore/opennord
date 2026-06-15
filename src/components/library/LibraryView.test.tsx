import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LibraryView } from './LibraryView';
import type { LibraryEntry } from '../../lib/library/types';

const entries: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14', summary: 'piano + synth' },
  { id: 'local:0', name: 'Sunday Organ', source: 'local', summary: 'organ' },
];

const folderDefaults = {
  folderName: null,
  folderCount: 0,
  canPersist: false,
  needsReconnect: false,
  busy: false,
  reconnectError: null,
  onChooseFolder: () => {},
  onReconnect: () => {},
  onRefresh: () => {},
  scanErrors: [],
  onForget: () => {},
};

/** Pull the `<button>…</button>` whose text content is exactly `label`. */
function buttonFor(html: string, label: string): string {
  const m = html.match(new RegExp(`<button[^>]*>${label}</button>`));
  if (!m) throw new Error(`no <button>${label}</button> in markup`);
  return m[0];
}

describe('LibraryView', () => {
  it('renders the title, counts, every entry, and source badges', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}} {...folderDefaults} />,
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
      <LibraryView entries={entries} source="nord" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}} {...folderDefaults} />,
    );
    expect(html).toContain('on-chip--active');
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  it('shows an empty hint when there are no entries', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}} {...folderDefaults} />,
    );
    expect(html).toContain('Nothing here yet');
  });

  it('keeps Forget enabled while busy so it is always an escape hatch', () => {
    const html = renderToStaticMarkup(
      <LibraryView
        entries={[]} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}}
        {...folderDefaults} folderName="TBM" needsReconnect busy
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
        entries={[]} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}}
        {...folderDefaults} folderName="TBM" needsReconnect reconnectError="Read access was denied."
      />,
    );
    expect(html).toContain('Read access was denied.');
  });
});
