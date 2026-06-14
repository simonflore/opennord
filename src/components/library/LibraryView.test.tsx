import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LibraryView } from './LibraryView';
import type { LibraryEntry } from '../../lib/library/types';

const entries: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14', summary: 'piano + synth' },
  { id: 'local:0', name: 'Sunday Organ', source: 'local', summary: 'organ' },
];

describe('LibraryView', () => {
  it('renders the title, counts, every entry, and source badges', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={entries} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}} />,
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

  it('shows an empty hint when there are no entries', () => {
    const html = renderToStaticMarkup(
      <LibraryView entries={[]} source="all" query="" onSource={() => {}} onQuery={() => {}} onOpen={() => {}} onImport={() => {}} />,
    );
    expect(html).toContain('No programs yet');
  });
});
