// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ProgramTable } from './ProgramTable';
import type { LibraryEntry } from '../../lib/library/types';

afterEach(cleanup);

const program = {} as LibraryEntry['program'];
const entries: LibraryEntry[] = [
  { id: 'a', name: 'Alpha', source: 'local', program },
  { id: 'unread', name: 'Unread slot', source: 'nord', slot: 'A:2' }, // no program yet
  { id: 'b', name: 'Bravo', source: 'local', program },
];
const renderTable = (activeId: string | null, onOpen = vi.fn()) => {
  render(<ProgramTable entries={entries} activeId={activeId} favorites={new Set()} onToggleFavorite={() => {}} onOpen={onOpen} onRemove={() => {}} />);
  return onOpen;
};

describe('ProgramTable J/K', () => {
  it('J opens the first program when none is open', () => {
    const onOpen = renderTable(null);
    fireEvent.keyDown(window, { key: 'j' });
    expect(onOpen).toHaveBeenCalledWith(entries[0]);
  });

  it('steps over a Nord slot that has not been read', () => {
    const onOpen = renderTable('a');
    fireEvent.keyDown(window, { key: 'j' });
    expect(onOpen).toHaveBeenCalledWith(entries[2]);
  });

  it('K goes back, and stays put at the top', () => {
    const onOpen = renderTable('b');
    fireEvent.keyDown(window, { key: 'k' });
    expect(onOpen).toHaveBeenCalledWith(entries[0]);
    cleanup();
    const atTop = renderTable('a');
    fireEvent.keyDown(window, { key: 'k' });
    expect(atTop).not.toHaveBeenCalled();
  });

  it('leaves the keys alone while typing or with a modifier', () => {
    const onOpen = renderTable(null);
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'j' });
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
    input.remove();
  });
});
