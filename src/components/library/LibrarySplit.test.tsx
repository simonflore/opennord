// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();
let wide = true;
const entry = { id: 'p1', program: { name: 'Grand' } };

vi.mock('@/lib/responsive', () => ({ useSplitLayout: () => wide }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ state: { location: { pathname: '/library/programs', state: {} } }, history: { back: vi.fn() } }),
  useLocation: () => false,
}));
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

  describe('full view', () => {
    it('wide inspector: offers the full view, by button and by F', () => {
      const onFull = vi.fn();
      render(<LibrarySplit selectedId="p1" onFull={onFull} />);
      fireEvent.click(screen.getByRole('button', { name: /full view/i }));
      expect(onFull).toHaveBeenLastCalledWith(true);
      fireEvent.keyDown(window, { key: 'f' });
      expect(onFull).toHaveBeenLastCalledWith(true);
    });

    it('full: hides the list (still mounted) and goes back by button and by Esc', () => {
      const onFull = vi.fn();
      const { container } = render(<LibrarySplit selectedId="p1" full onFull={onFull} />);
      expect(container.querySelector('.on-split--full')).not.toBeNull();
      expect(screen.getByText('LIST')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /programs/i }));
      expect(onFull).toHaveBeenLastCalledWith(false);
      onFull.mockClear();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onFull).toHaveBeenLastCalledWith(false);
    });

    it('leaves F alone while typing, and Esc alone outside the full view', () => {
      const onFull = vi.fn();
      render(<><input aria-label="search" /><LibrarySplit selectedId="p1" onFull={onFull} /></>);
      fireEvent.keyDown(screen.getByLabelText('search'), { key: 'f' });
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onFull).not.toHaveBeenCalled();
    });

    it('narrow, or nothing open: no full view', () => {
      const onFull = vi.fn();
      wide = false;
      render(<LibrarySplit selectedId="p1" full onFull={onFull} />);
      expect(screen.queryByRole('button', { name: /full view/i })).not.toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'f' });
      cleanup();
      wide = true;
      render(<LibrarySplit onFull={onFull} />);
      fireEvent.keyDown(window, { key: 'f' });
      expect(onFull).not.toHaveBeenCalled();
    });
  });
});
