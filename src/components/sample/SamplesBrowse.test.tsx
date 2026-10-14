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
  isFavoriteRow: () => false, toggleFavoriteRow: () => {},
  ...over,
});

const handlers = {
  onSource: () => {}, onGeneration: () => {}, onQuery: () => {}, clearFilters: () => {}, filtered: false, onOpen: () => {},
  onImport: () => {}, onRemove: () => {},
  canScanUsage: false, onScanUsage: () => {}, scanPct: null, unusedCount: null,
  unusedOnly: false, onUnusedOnly: () => {},
};

const noop = () => {};
const reclaimHandlers = {
  selected: new Set<string>(),
  selectedEntries: [],
  toggleSelected: noop,
  selectAllUnused: noop,
  clearSelected: noop,
  selectedFreeBytes: 0,
  removeFromNord: () => Promise.resolve({ removed: 0, failed: 0 }),
  removing: false,
  removePct: null as number | null,
};

describe('SamplesBrowse', () => {
  it('shows a select checkbox on unused device samples and a reclaim bar when selected', () => {
    const unusedNordId = 'nord-sample:U:01';
    const unusedNordEntry: SampleEntry = {
      id: unusedNordId, name: 'Unused Choir', source: 'nord', generation: 'unknown', slot: 'U:01', unused: true,
    };
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={[unusedNordEntry]}
        source="nord" generation="all" query=""
        nordCount={1} localCount={0}
        showSourceFacet={false} showUnknownGen={false}
        storedCount={0} storedBytes={0}
        prefs={prefs()} {...handlers}
        unusedOnly={true}
        selected={new Set([unusedNordId])}
        selectedEntries={[unusedNordEntry]}
        toggleSelected={noop}
        selectAllUnused={noop}
        clearSelected={noop}
        selectedFreeBytes={48 * 1024 * 1024}
        removeFromNord={() => Promise.resolve({ removed: 0, failed: 0 })}
        removing={false}
        removePct={null}
      />,
    );
    // Reclaim bar appears when selection is non-empty
    expect(html).toMatch(/Delete from Nord/);
    // Shows MB figure from selectedFreeBytes
    expect(html).toMatch(/48 MB/);
    // Checkbox is rendered for the unused nord sample
    expect(html).toMatch(/type="checkbox"/);
  });

  it('does not show checkbox on used or folder samples even in unusedOnly view', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries}
        source="all" generation="all" query=""
        nordCount={1} localCount={2}
        showSourceFacet showUnknownGen={false}
        storedCount={0} storedBytes={0}
        prefs={prefs()} {...handlers}
        unusedOnly={true}
        {...reclaimHandlers}
      />,
    );
    // No unused nord samples in `entries` fixture → no checkbox
    expect(html).not.toMatch(/type="checkbox"/);
  });

  it('renders title, counts, both samples, generation chips, and source badges', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers} {...reclaimHandlers}
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
        {...handlers} {...reclaimHandlers}
      />,
    );
    expect(html).toContain('★');
  });

  it('offers one Add menu and a storage readout', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers} {...reclaimHandlers}
      />,
    );
    // Import and Preview are inside it (AddMenu.test opens it).
    expect(html).toContain('+ Add');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).not.toContain('Import sample');
    expect(html).toContain('stored');         // "1 stored · 1.0 MB"
  });

  it('shows a remove control only on imported (local:) samples, not folder ones', () => {
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={entries} source="all" generation="all" query=""
        nordCount={1} localCount={2} showSourceFacet showUnknownGen={false}
        storedCount={1} storedBytes={1_000_000}
        prefs={prefs()} {...handlers} {...reclaimHandlers}
      />,
    );
    expect(html).toContain('Remove My Loop');        // imported → removable
    expect(html).not.toContain('Remove Bell');       // folder sample → not
  });

  it('shows every source a sample is found on, the Nord hint, and the Cloud filter when a sample is there', () => {
    const rows: SampleEntry[] = [
      { id: 'folder:Bell.nsmp4', name: 'Bell', source: 'local', generation: '4', sources: ['local', 'cloud'], sameNameOnNord: 'A:02' },
      { id: 'cloud:s2', name: 'Choir', source: 'cloud', generation: '4' },
    ];
    const html = renderToStaticMarkup(
      <SamplesBrowse
        entries={rows} source="all" generation="all" query=""
        nordCount={0} localCount={1} total={2} showSourceFacet showCloud showUnknownGen={false}
        storedCount={0} storedBytes={0}
        prefs={prefs()} {...handlers} {...reclaimHandlers}
      />,
    );
    expect(html).toContain('2 samples');
    expect(html).toContain('Local');
    expect(html).toContain('>Cloud<');
    expect(html).toContain('same name on Nord · A:02');
    expect(html).toContain('in the cloud');
  });
});
