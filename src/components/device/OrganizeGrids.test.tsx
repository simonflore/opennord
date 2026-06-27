import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizeGrids } from './OrganizeGrids';
import type { ReorgApi } from './useReorg';
import type { ProgramEntry } from '../../lib/device/transfer';

const noop = () => {};
const baseReorg = (over: Partial<ReorgApi> = {}): ReorgApi => ({
  pendingPlan: null, busy: false, progress: null, error: '', result: null,
  dontAsk: false, setDontAsk: noop,
  propose: noop, onGesture: noop, confirm: async () => {}, cancel: noop, ...over,
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
    expect(html).not.toMatch(/MIDI Program Change/); // single swap is not a bulk remap — no advisory
  });
  it('shows the MIDI-remap advisory in the confirm for a bulk (sort/compact) plan', () => {
    const reorg = baseReorg({ pendingPlan: { ops: [], journalSlots: [], title: 'Sort bank A–Z', summary: 'Sort 3 programs in Bank A alphabetically', bulk: true } });
    const html = renderToStaticMarkup(<OrganizeGrids entries={[]} reorg={reorg} />);
    expect(html).toMatch(/MIDI Program Change/);
    expect(html).toContain('Sort'); // the action button reads "Sort", not "Move"
  });
  it('shows Sort/Compact controls only for banks with two or more programs', () => {
    // bank 0 has 2 programs; everything else empty
    const entries = [prog(0, 0, 'B'), prog(0, 1, 'A')];
    const html = renderToStaticMarkup(<OrganizeGrids entries={entries} reorg={baseReorg()} />);
    expect((html.match(/Sort A–Z/g) ?? []).length).toBe(1);
    expect((html.match(/Compact/g) ?? []).length).toBe(1);
  });
  it('shows no Sort/Compact controls when no bank has two programs', () => {
    const html = renderToStaticMarkup(<OrganizeGrids entries={[prog(0, 0, 'Solo')]} reorg={baseReorg()} />);
    expect(html).not.toMatch(/Sort A–Z/);
  });
  it('renders the Swap/Insert reorder mode toggle', () => {
    const html = renderToStaticMarkup(<OrganizeGrids entries={[prog(0,0,'A'),prog(0,1,'B')]} reorg={baseReorg()} />);
    expect(html).toMatch(/Swap/);
    expect(html).toMatch(/Insert/);
  });
});
