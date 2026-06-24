import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeviceBrowser } from './DeviceBrowser';
import type { ProgramEntry } from '../../lib/device/transfer';
import type { PartitionCapacity } from '../../lib/device/capacity';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 600, fourcc: 'ns4p', ...over,
});
const cap = (over: Partial<PartitionCapacity> = {}): PartitionCapacity => ({
  fileCount: 356, usedBlocks: 3552, freeBlocks: 4632, reservedBlocks: 0,
  banks: [], totalSlots: 512, freeSlots: 156, ...over,
});

const noop = () => {};
const render = (capacity: PartitionCapacity | null, entries: ProgramEntry[] = [entry({})]) =>
  renderToStaticMarkup(
    <DeviceBrowser entries={entries} deviceName="Nord Stage 4" capacity={capacity} onSelect={noop} onDelete={noop} onSendFile={noop} />,
  );

describe('DeviceBrowser organize mode', () => {
  it('offers an Organize mode toggle on the programs view', () => {
    expect(render(cap())).toContain('Organize');
  });
});

describe('DeviceBrowser storage meter', () => {
  it('shows free slots out of total when capacity is known', () => {
    const html = render(cap());
    expect(html).toContain('STORAGE');
    expect(html).toContain('156 of 512 free');
  });

  it('reads "Full" when no slots remain', () => {
    const html = render(cap({ fileCount: 512, freeSlots: 0 }));
    expect(html).toContain('Full');
    expect(html).not.toContain('of 512 free');
  });

  it('omits the meter until capacity loads', () => {
    expect(render(null)).not.toContain('STORAGE');
  });
});
