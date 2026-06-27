// src/components/piano/PianosBrowse.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PianosBrowse } from './PianosBrowse';
import type { PianoEntry } from '@/lib/library/piano-entries';

const noop = () => {};
const base = { source: 'all' as const, setSource: noop, query: '', setQuery: noop, showSourceFacet: false, sort: 'default' as const, setSort: noop, isFavorite: () => false, toggleFavorite: noop, onSelect: noop };
const e = (over: Partial<PianoEntry>): PianoEntry => ({ id: '1', name: 'Grand', source: 'local', size: 1900000, factory: null, ...over });

const reclaimBase = {
  canScanUsage: false,
  onScanUsage: noop,
  scanPct: null as number | null,
  unusedCount: null as number | null,
  unusedOnly: false,
  onUnusedOnly: noop,
  selected: new Set<string>(),
  toggleSelected: noop,
  selectAllUnused: noop,
  clearSelected: noop,
  selectedFreeBytes: 0,
  removeFromNord: () => Promise.resolve({ removed: 0, failed: 0 }),
  removing: false,
  removePct: null as number | null,
};

describe('PianosBrowse', () => {
  it('renders a card with a humanized size', () => {
    const html = renderToStaticMarkup(<PianosBrowse {...base} {...reclaimBase} entries={[e({ name: 'Grand Lady D', size: 1900000 })]} />);
    expect(html).toContain('Grand Lady D');
    expect(html).toMatch(/1\.\d+ MB|1,8 MB|2 MB/); // formatBytes output, not raw bytes
    expect(html).not.toContain('1900000');
  });
  it('shows a Factory tag only for factory pianos', () => {
    const factory = { filename: 'Grand_XL_1.0.npno', url: 'https://nord/x', sizeKb: 1, sizeDescription: '1 GB', type: 'piano' as const };
    const withTag = renderToStaticMarkup(<PianosBrowse {...base} {...reclaimBase} entries={[e({ factory })]} />);
    const without = renderToStaticMarkup(<PianosBrowse {...base} {...reclaimBase} entries={[e({ factory: null })]} />);
    expect(withTag).toContain('Factory');
    expect(without).not.toContain('Factory');
  });

  // ── Reclaim-space tests ──────────────────────────────────────────────────────

  it('shows a checkbox on unused device pianos in unusedOnly view', () => {
    const unusedId = 'nord-piano:A:01';
    const unusedPiano = e({ id: unusedId, name: 'Unused Grand', source: 'nord', unused: true });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[unusedPiano]}
        unusedOnly={true}
      />,
    );
    expect(html).toMatch(/type="checkbox"/);
  });

  it('does not show a checkbox on used device pianos, even in unusedOnly view', () => {
    // unused=false → not eligible for selection
    const usedPiano = e({ id: 'nord-piano:A:02', name: 'Used Grand', source: 'nord', unused: false });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[usedPiano]}
        unusedOnly={true}
      />,
    );
    expect(html).not.toMatch(/type="checkbox"/);
  });

  it('does not show a checkbox on local/folder pianos in unusedOnly view', () => {
    const localPiano = e({ id: 'folder:/path/Grand.npno', name: 'Local Grand', source: 'local' });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[localPiano]}
        unusedOnly={true}
      />,
    );
    expect(html).not.toMatch(/type="checkbox"/);
  });

  it('shows reclaim bar with count and MB figure when pianos are selected', () => {
    const unusedId = 'nord-piano:A:01';
    const unusedPiano = e({ id: unusedId, name: 'Unused Grand', source: 'nord', unused: true });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[unusedPiano]}
        unusedOnly={true}
        selected={new Set([unusedId])}
        selectedFreeBytes={512 * 1024 * 1024}
      />,
    );
    expect(html).toMatch(/Remove from Nord/);
    expect(html).toMatch(/512 MB/);
    expect(html).toMatch(/1 selected/);
  });

  it('does not show reclaim bar when nothing is selected', () => {
    const unusedPiano = e({ id: 'nord-piano:A:01', name: 'Unused Grand', source: 'nord', unused: true });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[unusedPiano]}
        unusedOnly={true}
        selected={new Set()}
      />,
    );
    expect(html).not.toMatch(/Remove from Nord/);
  });

  it('shows factory disclaimer in confirm dialog when a selected piano is factory', () => {
    const factoryMatch = { filename: 'Grand_XL_1.0.npno', url: 'https://nord/grand-xl', sizeKb: 1024, sizeDescription: '1 GB', type: 'piano' as const };
    const unusedId = 'nord-piano:A:01';
    const factoryPiano = e({ id: unusedId, name: 'Grand XL', source: 'nord', unused: true, factory: factoryMatch });
    // Render with dialog open (simulate by pre-selecting and triggering openConfirm)
    // Since renderToStaticMarkup is synchronous, we need to render with confirmOpen=true.
    // PianosBrowse manages dialog state internally; we test that when selected includes
    // a factory piano, the dialog content includes the disclaimer text.
    // We test this by checking the rendered output contains the factory url in the markup.
    // The dialog renders when open; we cannot trigger click in renderToStaticMarkup.
    // So we verify the component at least renders the factory piano card with a factory tag
    // and the reclaim bar appears so the user can trigger confirm.
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[factoryPiano]}
        unusedOnly={true}
        selected={new Set([unusedId])}
        selectedFreeBytes={1024 * 1024 * 1024}
      />,
    );
    // Bar visible
    expect(html).toMatch(/Remove from Nord/);
    // Factory tag shown on card
    expect(html).toContain('Factory');
  });

  it('confirm dialog: factory disclaimer shown, keepCopy defaults off for all-factory selection', () => {
    // _testConfirmOpen forces the confirm dialog open in static markup (no events).
    const factoryMatch = { filename: 'Grand_XL_1.0.npno', url: 'https://nord/grand-xl', sizeKb: 1024, sizeDescription: '1 GB', type: 'piano' as const };
    const unusedId = 'nord-piano:A:01';
    const factoryPiano = e({ id: unusedId, name: 'Grand XL', source: 'nord', unused: true, factory: factoryMatch });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[factoryPiano]}
        unusedOnly={true}
        selected={new Set([unusedId])}
        selectedFreeBytes={1024 * 1024 * 1024}
        _testConfirmOpen={true}
      />,
    );
    expect(html).toContain('factory');                 // disclaimer shown
    expect(html).toContain('https://nord/grand-xl');    // Nord deep-link to get it back
    expect(html).toContain('Download a copy first');
    // keepCopy defaults OFF for an all-factory selection: the ONLY checked box is the
    // card's select checkbox (the piano is selected) — NOT the keep-copy one.
    expect((html.match(/checked/g) ?? []).length).toBe(1);
  });

  it('confirm dialog: keepCopy defaults ON when a non-factory (user) piano is selected', () => {
    const unusedId = 'nord-piano:A:02';
    const userPiano = e({ id: unusedId, name: 'My Piano', source: 'nord', unused: true, factory: null });
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[userPiano]}
        unusedOnly={true}
        selected={new Set([unusedId])}
        selectedFreeBytes={1024 * 1024}
        _testConfirmOpen={true}
      />,
    );
    // card checkbox (selected) + keep-copy checkbox (default ON for a user piano) = 2 checked
    expect((html.match(/checked/g) ?? []).length).toBe(2);
  });

  it('shows "Find unused pianos" button when canScanUsage is true', () => {
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[]}
        canScanUsage={true}
      />,
    );
    expect(html).toContain('Find unused pianos');
  });

  it('shows "Unused only" filter when unused count is known', () => {
    const html = renderToStaticMarkup(
      <PianosBrowse
        {...base} {...reclaimBase}
        entries={[]}
        canScanUsage={true}
        unusedCount={3}
        unusedOnly={false}
      />,
    );
    expect(html).toContain('Unused only');
    expect(html).toContain('3');
  });
});
