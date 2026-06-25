import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SamplesBrowse } from './SamplesBrowse';
import type { SampleEntry } from '../../lib/library/sample-entries';
import type { SamplesPrefsApi } from '../../lib/library/prefs';

const entries: SampleEntry[] = [
  { id: 'nord-sample:A:01', name: 'Choir', source: 'nord', generation: 'unknown', slot: 'A:01' },
  { id: 'folder:Bell.nsmp4', name: 'Bell', source: 'local', generation: '4', strokeCount: 3, size: 2_000_000 },
  { id: 'local:imp1', name: 'My Loop', source: 'local', generation: '3', strokeCount: 1, size: 1_000_000 },
];

const prefs = (over: Partial<SamplesPrefsApi> = {}): SamplesPrefsApi => ({
  sort: 'default', setSort: () => {}, favorites: new Set<string>(), isFavorite: () => false, toggleFavorite: () => {},
  ...over,
});

const handlers = {
  onSource: () => {}, onGeneration: () => {}, onQuery: () => {}, onOpen: () => {}, onLoadNew: () => {},
  onImport: () => {}, onRemove: () => {},
  canScanUsage: false, onScanUsage: () => {}, scanPct: null, unusedCount: null,
  unusedOnly: false, onUnusedOnly: () => {},
};

describe('SamplesBrowse', () => {
  it('renders title, counts, both samples, generation chips, and source badges', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers}
      />,
    );
    expect(html).toContain('Samples');
    expect(html).toContain('3 samples');
    expect(html).toContain('1 on Nord');
    expect(html).toContain('Choir');
    expect(html).toContain('Bell');
    expect(html).toContain('.nsmp4');     // generation chip label
    expect(html).toContain('On Nord');    // source badge
  });

  it('marks a favorited sample with a filled star', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={0} storedBytes={0}
        prefs={prefs({ favorites: new Set(['folder:Bell.nsmp4']), isFavorite: (id) => id === 'folder:Bell.nsmp4' })}
        {...handlers}
      />,
    );
    expect(html).toContain('★');
  });

  it('offers Import + Preview actions and a storage readout', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers}
      />,
    );
    expect(html).toContain('Import sample');
    expect(html).toContain('Preview a file'); // renamed from "Load sample"
    expect(html).not.toContain('Load sample');
    expect(html).toContain('stored');         // "1 stored · 1.0 MB"
  });

  it('shows a remove control only on imported (local:) samples, not folder ones', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers}
      />,
    );
    expect(html).toContain('Remove My Loop');        // imported → removable
    expect(html).not.toContain('Remove Bell');       // folder sample → not
  });
});
