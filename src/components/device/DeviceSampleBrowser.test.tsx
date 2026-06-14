import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeviceSampleBrowser } from './DeviceSampleBrowser';
import type { ProgramEntry } from '../../lib/device/transfer';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Strings', categoryId: 0, version: 0, sizeBytes: 2_097_152, fourcc: 'nsmp', ...over,
});

describe('DeviceSampleBrowser', () => {
  it('lists each sample with a human size and slot', () => {
    const html = renderToStaticMarkup(
      <DeviceSampleBrowser deviceName="Nord" entries={[entry({}), entry({ slot: 1, name: 'Brass', sizeBytes: 512 })]} onSelect={() => {}} />,
    );
    expect(html).toContain('Strings');
    expect(html).toContain('2.0 MB');
    expect(html).toContain('Brass');
    expect(html).toContain('512 B');
  });

  it('shows an empty state for a board with no samples', () => {
    const html = renderToStaticMarkup(<DeviceSampleBrowser deviceName="Nord" entries={[]} onSelect={() => {}} />);
    expect(html).toContain('0 samples');
    expect(html).toContain('No samples');
  });
});
