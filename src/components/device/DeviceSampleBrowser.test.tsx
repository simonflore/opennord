import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeviceSampleBrowser } from './DeviceSampleBrowser';
import type { ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Strings', categoryId: 0, version: 0, sizeBytes: 2_097_152, fourcc: 'nsmp', ...over,
});
const cap = (usedBlocks: number, freeBlocks: number, blockSizeBytes?: number): PartitionCapacity => ({
  fileCount: 0, usedBlocks, freeBlocks, reservedBlocks: 0, banks: [], totalSlots: 0, freeSlots: 0, blockSizeBytes,
});

describe('DeviceSampleBrowser', () => {
  it('lists each sample with a human size and slot', () => {
    const html = renderToStaticMarkup(
      <DeviceSampleBrowser deviceName="Nord" entries={[entry({}), entry({ slot: 1, name: 'Brass', sizeBytes: 512 })]}
        sampleCapacity={null} pianoCapacity={null} onSelect={() => {}} />,
    );
    expect(html).toContain('Strings');
    expect(html).toContain('2.0 MB');
    expect(html).toContain('Brass');
    expect(html).toContain('512 B');
  });

  it('shows an empty state for a board with no samples', () => {
    const html = renderToStaticMarkup(
      <DeviceSampleBrowser deviceName="Nord" entries={[]} sampleCapacity={null} pianoCapacity={null} onSelect={() => {}} />);
    expect(html).toContain('0 samples');
    expect(html).toContain('No samples');
  });

  it('shows % full when block size is unknown', () => {
    const html = renderToStaticMarkup(
      <DeviceSampleBrowser deviceName="Nord" entries={[]}
        sampleCapacity={cap(3, 1)} pianoCapacity={cap(0, 100)} onSelect={() => {}} />);
    expect(html).toContain('SAMPLE LIBRARY');
    expect(html).toContain('75% full'); // 3 / (3+1)
    expect(html).toContain('0% full'); // 0 / 100
  });

  it('shows real free space when block size is known', () => {
    const html = renderToStaticMarkup(
      <DeviceSampleBrowser deviceName="Nord" entries={[]}
        // The live NS4 capture (factory content present → nearly full):
        // Sample free 7 × 64 KiB = 448 KB; Piano free 48 × 128 KiB = 6 MB. cap(used, free, block).
        sampleCapacity={cap(15711, 7, 65536)} pianoCapacity={cap(16104, 48, 131072)} onSelect={() => {}} />);
    expect(html).toContain('448.0 KB free');
    expect(html).toContain('6.0 MB free');
  });
});
