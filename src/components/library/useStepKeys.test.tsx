// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, renderHook } from '@testing-library/react';
import { useStepKeys } from './useStepKeys';
import type { LibraryEntry } from '../../lib/library/types';

afterEach(cleanup);

const program = {} as LibraryEntry['program'];
const entries: LibraryEntry[] = [
  { id: 'a', name: 'Alpha', source: 'local', program },
  { id: 'unread', name: 'Unread slot', source: 'nord', slot: 'A:2' }, // no program yet
  { id: 'b', name: 'Bravo', source: 'local', program },
];
const keysFrom = (activeId: string | null) => {
  const onOpen = vi.fn();
  renderHook(() => useStepKeys(entries, activeId, onOpen));
  return onOpen;
};

describe('useStepKeys (J/K)', () => {
  it('J opens the first program when none is open', () => {
    const onOpen = keysFrom(null);
    fireEvent.keyDown(window, { key: 'j' });
    expect(onOpen).toHaveBeenCalledWith(entries[0]);
  });

  it('steps onto a Nord slot that has not been read (it is read as it opens)', () => {
    const down = keysFrom('a');
    fireEvent.keyDown(window, { key: 'j' });
    expect(down).toHaveBeenCalledWith(entries[1]);
    cleanup();
    const up = keysFrom('b');
    fireEvent.keyDown(window, { key: 'k' });
    expect(up).toHaveBeenCalledWith(entries[1]);
  });

  it('K opens the last program when none is open, and J stays put at the bottom', () => {
    const up = keysFrom(null);
    fireEvent.keyDown(window, { key: 'k' });
    expect(up).toHaveBeenCalledWith(entries[2]);
    cleanup();
    const down = keysFrom('b');
    fireEvent.keyDown(window, { key: 'j' });
    expect(down).not.toHaveBeenCalled();
  });

  it('K stays put at the top', () => {
    const onOpen = keysFrom('a');
    fireEvent.keyDown(window, { key: 'k' });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('uses the key in J’s place on a non-Latin layout', () => {
    const onOpen = keysFrom(null);
    fireEvent.keyDown(window, { key: 'о', code: 'KeyJ' });
    expect(onOpen).toHaveBeenCalledWith(entries[0]);
  });

  it('leaves the keys alone while typing, with a modifier, on repeat or without a key', () => {
    const onOpen = keysFrom(null);
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'j' });
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    fireEvent.keyDown(window, { key: 'j', repeat: true });
    fireEvent.keyDown(window, {});
    expect(onOpen).not.toHaveBeenCalled();
    input.remove();
  });
});
