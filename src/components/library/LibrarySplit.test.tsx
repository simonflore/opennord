// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const navigate = vi.fn();
let wide = true;
const stage4 = new Uint8Array(readFileSync('src/lib/ns4/__fixtures__/BreakFree_chords.ns4p'));
const entry = { id: 'p1', name: 'Grand', bytes: stage4, program: { name: 'Grand', bytes: stage4 } };

vi.mock('@/lib/responsive', () => ({ useSplitLayout: () => wide }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ state: { location: { pathname: '/library/programs', state: {} } }, history: { back: vi.fn() } }),
  useLocation: () => false,
}));
// A Nord slot not read yet; tests set how its read is going.
const slot = { id: 'nord:A:11', name: 'Wurli', source: 'nord', slot: 'A:11' };
let nord: { reading: string | null; failed: { id: string; message: string } | null; read: ReturnType<typeof vi.fn> };
const resetNord = () => { nord = { reading: null, failed: null, read: vi.fn() }; };
resetNord();
vi.mock('@/lib/library/LibraryContext', () => ({
  useLibraryState: () => ({
    shown: [], source: 'all', query: '',
    setSource: vi.fn(), setQuery: vi.fn(), importFile: vi.fn(),
    imported: { remove: vi.fn() }, prefs: {}, folder: null,
    entryById: (id: string) => (id === 'p1' ? entry : id === slot.id ? slot : undefined),
    nord,
  }),
}));
vi.mock('./LibraryView', () => ({ LibraryView: () => <div>LIST</div> }));
// No Nord connected unless a test says so.
let session: unknown = null;
vi.mock('@/lib/device/DeviceContext', () => ({
  useDevice: () => ({ session, entries: [], productId: 0x002e, refresh: vi.fn() }),
}));
vi.mock('@/components/program/ProgramView', () => ({ ProgramView: () => <div>DETAIL</div> }));

import { LibrarySplit } from './LibrarySplit';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';

afterEach(() => { cleanup(); vi.clearAllMocks(); wide = true; session = null; resetNord(); });

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

  describe('actions', () => {
    it('offers Send to Nord greyed with the reason when no Nord is connected, and Save to computer', () => {
      render(<LibrarySplit selectedId="p1" />);
      expect(screen.getByRole('button', { name: 'Send to Nord' })).toBeDisabled();
      expect(screen.getByText('Connect your Nord to send it.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save to computer' })).toBeEnabled();
    });

    it('offers Share to community where the community is there, opening the share form on this program', () => {
      render(<CapabilitiesProvider value={{ community: { available: true } }}><LibrarySplit selectedId="p1" /></CapabilitiesProvider>);
      fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
      expect(navigate).toHaveBeenCalledWith({ to: '/community/share', search: { program: 'p1' } });
    });

    it('offers no sharing in a build without the community', () => {
      render(<LibrarySplit selectedId="p1" />);
      expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    });

    it('greys Send to Nord on a keyboard it only reads', () => {
      session = { canWrite: () => false, programPartition: 3 };
      render(<LibrarySplit selectedId="p1" />);
      expect(screen.getByRole('button', { name: 'Send to Nord' })).toBeDisabled();
      expect(screen.getByText(/only reads this keyboard/)).toBeInTheDocument();
    });

    it('sends through the slot picker, and a send ends when its Nord goes away', () => {
      session = { canWrite: () => true, programPartition: 3 };
      const { rerender } = render(<LibrarySplit selectedId="p1" />);
      fireEvent.click(screen.getByRole('button', { name: 'Send to Nord' }));
      expect(screen.getByRole('dialog')).toHaveTextContent('Choose a slot');
      session = null; // unplugged
      rerender(<LibrarySplit selectedId="p1" />);
      session = { canWrite: () => true, programPartition: 3 }; // a Nord again, maybe another
      rerender(<LibrarySplit selectedId="p1" />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('a Nord slot', () => {
    it('is read from the Nord when it opens, once', () => {
      const { rerender } = render(<LibrarySplit selectedId="nord:A:11" />);
      expect(nord.read).toHaveBeenCalledTimes(1);
      expect(nord.read).toHaveBeenCalledWith('nord:A:11');
      nord.reading = 'nord:A:11';
      rerender(<LibrarySplit selectedId="nord:A:11" />);
      expect(screen.getByRole('status')).toHaveTextContent('Reading “Wurli” from your Nord…');
      expect(nord.read).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/Device page/)).not.toBeInTheDocument();
    });

    it('says why a read failed and reads again only on Try again', () => {
      nord.failed = { id: 'nord:A:11', message: 'The Nord didn’t answer.' };
      render(<LibrarySplit selectedId="nord:A:11" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t read “Wurli” from your Nord: The Nord didn’t answer.');
      expect(nord.read).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(nord.read).toHaveBeenCalledWith('nord:A:11');
    });

    it('is not read again while another slot reads', () => {
      nord.reading = 'nord:A:12';
      render(<LibrarySplit selectedId="nord:A:11" />);
      expect(nord.read).not.toHaveBeenCalled();
    });
  });
});
