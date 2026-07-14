// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FolderProvider, useFolder } from './FolderContext';

// Count how many times the underlying hook runs — must be exactly once under one provider.
const runs = { n: 0 };
vi.mock('./useFolderLibrary', () => ({
  useFolderLibrary: () => { runs.n++; return { folderName: 'TBM', tag: 'singleton' }; },
}));

describe('FolderContext', () => {
  it('provides one shared folder instance to all consumers', () => {
    runs.n = 0;
    const wrapper = ({ children }: { children: ReactNode }) => <FolderProvider>{children}</FolderProvider>;
    const a = renderHook(() => useFolder(), { wrapper });
    expect(a.result.current.folderName).toBe('TBM');
    expect(runs.n).toBe(1); // one provider → one scan, not four
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useFolder())).toThrow(/FolderProvider/);
  });
});
