import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizeGrids } from './OrganizeGrids';
import type { ReorgApi } from './useReorg';
import type { ProgramEntry } from '../../lib/device/transfer';

const noop = () => {};
const baseReorg = (over: Partial<ReorgApi> = {}): ReorgApi => ({
  pendingPlan: null, busy: false, progress: null, error: '', result: null,
  dontAsk: false, setDontAsk: noop,
  onGesture: noop, confirm: async () => {}, cancel: noop, ...over,
});
const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
  bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
});

describe('OrganizeGrids', () => {
  it('renders the hint and 8 bank grids', () => {
    const html = renderToStaticMarkup(<OrganizeGrids entries={[prog(0, 0, 'A')]} reorg={baseReorg()} />);
    expect(html).toMatch(/drag a program/i);
    expect((html.match(/role="grid"/g) ?? []).length).toBe(8);
  });
  it('shows the confirm dialog with the plan title when a plan is pending', () => {
    const reorg = baseReorg({ pendingPlan: { ops: [], journalSlots: [], title: 'Swap programs', summary: 'Swap "A" and "B"' } });
    const html = renderToStaticMarkup(<OrganizeGrids entries={[]} reorg={reorg} />);
    expect(html).toContain('Swap programs');
    expect(html).toContain('Swap &quot;A&quot; and &quot;B&quot;');
    expect(html).toMatch(/don.t ask again/i); // the remember toggle is in the confirm
  });
});
