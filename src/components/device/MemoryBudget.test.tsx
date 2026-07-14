import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryBudget, budgetHeadline, type ReclaimState } from './MemoryBudget';
import type { PartitionCapacity } from '../../lib/device/capacity';

/** Program partition (slot-bound): totalSlots slots, `free` of them empty. */
const slots = (free: number, total = 512): PartitionCapacity => ({
  fileCount: total - free, usedBlocks: 0, freeBlocks: 0, reservedBlocks: 0,
  banks: [], totalSlots: total, freeSlots: free,
});
/** Byte-bound partition (Sample/Piano): used/free erase blocks × 64 KiB. */
const space = (used: number, free: number): PartitionCapacity => ({
  fileCount: 0, usedBlocks: used, freeBlocks: free, reservedBlocks: 0,
  banks: [], totalSlots: 0, freeSlots: 0, blockSizeBytes: 65536,
});

describe('budgetHeadline', () => {
  it('reassures when everything has room', () => {
    expect(budgetHeadline([
      { label: 'program slots', cap: slots(400), mode: 'slots' },
      { label: 'sample library', cap: space(2000, 14000), mode: 'space' },
    ])).toBe('Plenty of room across the board.');
  });
  it('names the tightest area when one is nearly full', () => {
    const h = budgetHeadline([
      { label: 'program slots', cap: slots(400), mode: 'slots' },
      { label: 'sample library', cap: space(15800, 200), mode: 'space' }, // ~99% but not full
    ]);
    expect(h).toContain('sample library is nearly full');
    expect(h).toContain('free');
  });
  it('flags a full partition', () => {
    expect(budgetHeadline([{ label: 'piano library', cap: space(16000, 0), mode: 'space' }]))
      .toBe('Your piano library is full — clear some space before adding more.');
  });
});

describe('MemoryBudget', () => {
  const render = (reclaim: ReclaimState) => renderToStaticMarkup(
    <MemoryBudget program={slots(400)} sample={space(2000, 14000)} piano={space(8000, 8192)}
      reclaim={reclaim} onScan={() => {}} />,
  );

  it('renders all three meters + the scan affordance when idle', () => {
    const html = render({ status: 'idle' });
    expect(html).toContain('Programs');
    expect(html).toContain('Sample library');
    expect(html).toContain('Piano library');
    expect(html).toContain('Find reclaimable space');
  });
  it('shows the reclaimable total when the scan is done', () => {
    expect(render({ status: 'done', bytes: 512 * 1024 * 1024 })).toContain('reclaimable');
  });
  it('reassures when nothing is reclaimable', () => {
    expect(render({ status: 'done', bytes: 0 })).toContain('Nothing to reclaim');
  });
  it('renders nothing when no capacity has loaded', () => {
    const html = renderToStaticMarkup(
      <MemoryBudget program={null} sample={null} piano={null} reclaim={{ status: 'idle' }} onScan={() => {}} />,
    );
    expect(html).toBe('');
  });
});
