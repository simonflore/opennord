// @vitest-environment jsdom
// Regression: drag-to-reposition must work WITHIN a bank and ACROSS banks. The
// drag source travels in dataTransfer (not per-grid state) so a drop on a
// different bank's SlotGrid still resolves the source. See SlotGrid.tsx DRAG_MIME.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

afterEach(cleanup); // bound queries hit document.body — unmount between tests so labels don't collide
import { SlotGrid } from './SlotGrid';
import type { ProgramEntry } from '../../lib/device/transfer';

const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
  bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
});

// A dataTransfer stub that records setData and replays it for getData/types (what a real browser does).
function dt() {
  const store: Record<string, string> = {};
  return {
    setData: (k: string, v: string) => { store[k] = v; },
    getData: (k: string) => store[k] ?? '',
    get types() { return Object.keys(store); },
    effectAllowed: '', dropEffect: '',
  } as unknown as DataTransfer;
}

describe('SlotGrid drag-and-drop (repro)', () => {
  it('within one grid: drop an occupied slot on an empty slot fires onGesture', () => {
    const onGesture = vi.fn();
    const { container } = render(
      <SlotGrid bank={0} slotCount={4} entries={[prog(0, 0, 'Lead')]} onGesture={onGesture} />);
    const cells = container.querySelectorAll('[data-slot]');
    const src = cells[0]; // occupied A:11
    const dst = cells[2]; // empty
    const shared = dt();
    fireEvent.dragStart(src, { dataTransfer: shared });
    fireEvent.dragOver(dst, { dataTransfer: shared });
    fireEvent.drop(dst, { dataTransfer: shared });
    expect(onGesture).toHaveBeenCalledWith({ kind: 'move', from: { bank: 0, slot: 0 }, to: { bank: 0, slot: 2 } });
  });

  it('cross-bank: dragging from bank A grid and dropping in bank B grid fires onGesture', () => {
    const onGesture = vi.fn();
    // Two separate SlotGrid instances, as BackupOrganizer renders (one per bank).
    const { getByLabelText } = render(
      <>
        <SlotGrid bank={0} slotCount={4} entries={[prog(0, 0, 'Lead')]} onGesture={onGesture} />
        <SlotGrid bank={1} slotCount={4} entries={[]} onGesture={onGesture} />
      </>);
    const src = getByLabelText(/A:11: Lead/);
    const dst = getByLabelText(/B:11 \(empty\)/);
    const shared = dt(); // a real drag carries ONE dataTransfer across both elements
    fireEvent.dragStart(src, { dataTransfer: shared });
    fireEvent.dragOver(dst, { dataTransfer: shared });
    fireEvent.drop(dst, { dataTransfer: shared });
    expect(onGesture).toHaveBeenCalledWith({ kind: 'move', from: { bank: 0, slot: 0 }, to: { bank: 1, slot: 0 } });
  });
});
