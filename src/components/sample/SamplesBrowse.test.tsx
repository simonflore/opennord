import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SamplesBrowse } from './SamplesBrowse';
import type { SampleEntry } from '../../lib/library/sample-entries';
import type { SamplesPrefsApi } from '../../lib/library/prefs';

const entries: SampleEntry[] = [
  { id: 'nord-sample:A:01', name: 'Choir', source: 'nord', generation: 'unknown', slot: 'A:01' },
  { id: 'folder:Bell.nsmp4', name: 'Bell', source: 'local', generation: '4', strokeCount: 3, size: 2_000_000 },
];

const prefs = (over: Partial<SamplesPrefsApi> = {}): SamplesPrefsApi => ({
  sort: 'default', setSort: () => {}, favorites: new Set<string>(), isFavorite: () => false, toggleFavorite: () => {},
  ...over,
});

const handlers = {
  onSource: () => {}, onGeneration: () => {}, onQuery: () => {}, onOpen: () => {}, onLoadNew: () => {},
  canScanUsage: false, onScanUsage: () => {}, scanPct: null, unusedCount: null,
  unusedOnly: false, onUnusedOnly: () => {},
};

describe('SamplesBrowse', () => {
  it('renders title, counts, both samples, generation chips, and source badges', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={1} showSourceFacet showUnknownGen={false}
        prefs={prefs()} {...handlers}
      />,
    );
    expect(html).toContain('Samples');
    expect(html).toContain('2 samples');
    expect(html).toContain('1 on Nord');
    expect(html).toContain('Choir');
    expect(html).toContain('Bell');
    expect(html).toContain('.nsmp4');     // generation chip label
    expect(html).toContain('On Nord');    // source badge
    expect(html).toContain('Load sample');
  });

  it('marks a favorited sample with a filled star', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={1} showSourceFacet showUnknownGen={false}
        prefs={prefs({ favorites: new Set(['folder:Bell.nsmp4']), isFavorite: (id) => id === 'folder:Bell.nsmp4' })}
        {...handlers}
      />,
    );
    expect(html).toContain('★');
  });
});
