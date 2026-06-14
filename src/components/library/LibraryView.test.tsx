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
  onChooseFolder: () => {},
  onReconnect: () => {},
  onRefresh: () => {},
  scanErrorCount: 0,
  onForget: () => {},
};

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
});
