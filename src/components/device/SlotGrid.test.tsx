import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlotGrid } from './SlotGrid';
import type { ProgramEntry } from '../../lib/device/transfer';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 2, slot: 0, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 600, fourcc: 'ns4p', ...over,
});

describe('SlotGrid', () => {
  it('renders one cell per slot and labels occupied slots by name', () => {
    const html = renderToStaticMarkup(
      <SlotGrid bank={2} slotCount={8} entries={[entry({ slot: 0, name: 'Wurli Soft' })]} onGesture={() => {}} />,
    );
    expect(html).toContain('Wurli Soft');
    // 8 slots rendered (count the draggable/droppable cells via a stable data attr)
    expect((html.match(/data-slot=/g) ?? []).length).toBe(8);
  });

  it('marks occupied slots draggable and empty slots as drop targets', () => {
    const html = renderToStaticMarkup(
      <SlotGrid bank={2} slotCount={2} entries={[entry({ slot: 0 })]} onGesture={() => {}} />,
    );
    expect(html).toContain('data-occupied="true"');
    expect(html).toContain('data-occupied="false"');
  });
});
