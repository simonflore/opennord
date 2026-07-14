// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();
let wide = true;
const entry = { id: 'p1', program: { name: 'Grand' } };

vi.mock('@/lib/responsive', () => ({ useSplitLayout: () => wide }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/lib/library/LibraryContext', () => ({
  useLibraryState: () => ({
    shown: [], source: 'all', query: '',
    setSource: vi.fn(), setQuery: vi.fn(), importFile: vi.fn(),
    imported: { remove: vi.fn() }, prefs: {}, folder: null,
    entryById: (id: string) => (id === 'p1' ? entry : undefined),
  }),
}));
vi.mock('./LibraryView', () => ({ LibraryView: () => <div>LIST</div> }));
vi.mock('@/components/program/ProgramView', () => ({ ProgramView: () => <div>DETAIL</div> }));

import { LibrarySplit } from './LibrarySplit';

afterEach(() => { cleanup(); vi.clearAllMocks(); wide = true; });

describe('LibrarySplit', () => {
  it('wide: shows list and detail side by side', () => {
    wide = true;
    render(<LibrarySplit selectedId="p1" />);
    expect(screen.getByText('LIST')).toBeInTheDocument();
    expect(screen.getByText('DETAIL')).toBeInTheDocument();
  });

  it('wide with no selection: shows list and a placeholder, not the program', () => {
    wide = true;
    render(<LibrarySplit />);
    expect(screen.getByText('LIST')).toBeInTheDocument();
    expect(screen.queryByText('DETAIL')).not.toBeInTheDocument();
  });

  it('narrow with a selection: shows detail + a back control, not the list', () => {
    wide = false;
    render(<LibrarySplit selectedId="p1" />);
    expect(screen.getByText('DETAIL')).toBeInTheDocument();
    expect(screen.queryByText('LIST')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();
  });

  it('narrow with no selection: shows just the list', () => {
    wide = false;
    render(<LibrarySplit />);
    expect(screen.getByText('LIST')).toBeInTheDocument();
    expect(screen.queryByText('DETAIL')).not.toBeInTheDocument();
  });
});
