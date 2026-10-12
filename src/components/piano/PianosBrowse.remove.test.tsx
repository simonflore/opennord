// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PianosBrowse } from './PianosBrowse';
import type { PianoEntry } from '@/lib/library/piano-entries';

afterEach(cleanup);
const noop = () => {};

describe('PianosBrowse — remove with keep-a-copy', () => {
  it('keeps a copy of a selected piano the search is hiding', async () => {
    const hidden: PianoEntry = { id: 'nord-piano:A:3', name: 'Bright Grand', source: 'nord', size: 1, factory: null, unused: true };
    const removeFromNord = vi.fn(() => Promise.resolve({ removed: 1, failed: 0 }));
    render(
      <PianosBrowse
        // The search hides the selected piano: the visible list is empty.
        entries={[]} source="all" setSource={noop} query="zzz" setQuery={noop} clearFilters={noop} filtered
        showSourceFacet={false} sort="default" setSort={noop} isFavorite={() => false} toggleFavorite={noop} onSelect={noop}
        canScanUsage onScanUsage={noop} scanPct={null} unusedCount={1} unusedOnly={false} onUnusedOnly={noop}
        selected={new Set([hidden.id])} selectedEntries={[hidden]} toggleSelected={noop}
        selectAllUnused={noop} clearSelected={noop} selectedFreeBytes={1}
        removeFromNord={removeFromNord} removing={false} removePct={null}
        _testConfirmOpen
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /download a copy first/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await Promise.resolve();
    expect(removeFromNord).toHaveBeenCalledWith({ keepCopyIds: new Set([hidden.id]) });
  });
});
