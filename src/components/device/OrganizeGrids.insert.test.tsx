// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { OrganizeGrids } from './OrganizeGrids';
import type { ReorgApi } from './useReorg';
import type { ProgramEntry } from '../../lib/device/transfer';

afterEach(cleanup);
const noop = () => {};
const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
  bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
});
const baseReorg = (over: Partial<ReorgApi> = {}): ReorgApi => ({
  pendingPlan: null, busy: false, progress: null, error: '', result: null,
  dontAsk: false, setDontAsk: noop, propose: noop, onGesture: noop,
  confirm: async () => {}, cancel: noop, ...over,
});
function dt() {
  const store: Record<string, string> = {};
  return { setData: (k: string, v: string) => { store[k] = v; }, getData: (k: string) => store[k] ?? '',
    get types() { return Object.keys(store); }, effectAllowed: '', dropEffect: '' } as unknown as DataTransfer;
}

describe('OrganizeGrids insert mode', () => {
  it('routes a drop to planInsert when Insert mode is selected', () => {
    const propose = vi.fn();
    const onGesture = vi.fn();
    const { getByText, container } = render(
      <OrganizeGrids entries={[prog(0,0,'A'), prog(0,1,'B')]} reorg={baseReorg({ propose, onGesture })} />);
    fireEvent.click(getByText('Insert')); // switch to insert mode
    const cells = container.querySelectorAll('[data-slot]');
    const shared = dt();
    fireEvent.dragStart(cells[1], { dataTransfer: shared }); // drag B (slot1)
    fireEvent.dragOver(cells[0], { dataTransfer: shared });
    fireEvent.drop(cells[0], { dataTransfer: shared });       // onto slot0
    expect(propose).toHaveBeenCalledTimes(1);   // insert routed via propose(planInsert)
    expect(onGesture).not.toHaveBeenCalled();   // NOT the swap/move path
  });

  it('routes a drop to onGesture (swap/move) in the default Swap mode', () => {
    const propose = vi.fn();
    const onGesture = vi.fn();
    const { container } = render(
      <OrganizeGrids entries={[prog(0,0,'A'), prog(0,1,'B')]} reorg={baseReorg({ propose, onGesture })} />);
    const cells = container.querySelectorAll('[data-slot]');
    const shared = dt();
    fireEvent.dragStart(cells[1], { dataTransfer: shared });
    fireEvent.dragOver(cells[0], { dataTransfer: shared });
    fireEvent.drop(cells[0], { dataTransfer: shared });
    expect(onGesture).toHaveBeenCalledTimes(1);
    expect(propose).not.toHaveBeenCalled();
  });
});
