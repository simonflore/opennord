// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const navigate = vi.fn();
let wide = true;
const stage4 = new Uint8Array(readFileSync('src/lib/ns4/__fixtures__/BreakFree_chords.ns4p'));
const entry = { id: 'p1', name: 'Grand', source: 'local', bytes: stage4, program: { name: 'Grand', bytes: stage4 } };

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
// Rows a test lists, by any id they answer to; the cloud source and the imports as a test sets them.
const entries = new Map<string, object>();
let cloud: { status: string; read: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn>; reading: Set<string>; failed: Map<string, string> };
const resetCloud = () => { cloud = { status: 'ready', read: vi.fn(), refresh: vi.fn(), reading: new Set(), failed: new Map() }; };
resetCloud();
const importedAdd = vi.fn(async (_file: File) => {});
vi.mock('@/lib/library/LibraryContext', () => ({
  useLibraryState: () => ({
    shown: [], source: 'all', query: '',
    setSource: vi.fn(), setQuery: vi.fn(), importFile: vi.fn(),
    imported: { remove: vi.fn(), add: importedAdd }, prefs: {}, folder: null,
    entryById: (id: string) => entries.get(id) ?? (id === 'p1' ? entry : id === slot.id ? slot : undefined),
    nord, cloud,
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
import { localAuth } from '@/lib/capabilities/defaults';

afterEach(() => { cleanup(); vi.clearAllMocks(); wide = true; session = null; resetNord(); resetCloud(); entries.clear(); });

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
      render(<CapabilitiesProvider value={{ community: { available: true }, auth: { ...localAuth, available: true } }}><LibrarySplit selectedId="p1" /></CapabilitiesProvider>);
      fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
      expect(navigate).toHaveBeenCalledWith({ to: '/community/share', search: { item: 'p1' } });
    });

    it('offers no sharing in a build without the community', () => {
      render(<LibrarySplit selectedId="p1" />);
      expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    });

    it('offers no sharing where the community is on but there is no way to sign in', () => {
      render(<CapabilitiesProvider value={{ community: { available: true, optIn: { on: true, set: () => {} } } }}><LibrarySplit selectedId="p1" /></CapabilitiesProvider>);
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

  describe('a row from the cloud', () => {
    const cloudOnly = { id: 'cloud:x2', name: 'Lead', source: 'cloud', fingerprint: 'x2', sources: ['cloud'], members: [{ id: 'cloud:x2', source: 'cloud', name: 'Lead' }] };
    it('is fetched when it opens, once, and says so meanwhile', () => {
      entries.set('cloud:x2', cloudOnly);
      const { rerender } = render(<LibrarySplit selectedId="cloud:x2" />);
      expect(cloud.read).toHaveBeenCalledWith('x2');
      expect(screen.getByText(/fetching “Lead” from the cloud/i)).toBeInTheDocument();
      cloud.reading = new Set(['x2']);
      rerender(<LibrarySplit selectedId="cloud:x2" />);
      expect(cloud.read).toHaveBeenCalledTimes(1);
    });
    it('says why a fetch failed and fetches again only on Try again', () => {
      entries.set('cloud:x2', cloudOnly);
      cloud.failed = new Map([['x2', 'timeout']]);
      render(<LibrarySplit selectedId="cloud:x2" />);
      expect(cloud.read).not.toHaveBeenCalled();
      expect(screen.getByText(/timeout/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(cloud.read).toHaveBeenCalledWith('x2');
    });
    it('says so when the fetched file is one OpenNord can’t read', () => {
      entries.set('cloud:x2', { ...cloudOnly, bytes: new Uint8Array(8) });
      render(<LibrarySplit selectedId="cloud:x2" />);
      expect(cloud.read).not.toHaveBeenCalled();
      expect(screen.getByText(/can’t read “Lead”/i)).toBeInTheDocument();
    });
    it('offers Keep a copy for a fetched cloud-only row, which imports it under its name and type', async () => {
      entries.set('cloud:x2', { ...cloudOnly, bytes: stage4, program: { name: 'Lead', bytes: stage4 }, typeLabel: '.ns4p' });
      render(<LibrarySplit selectedId="cloud:x2" />);
      fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Keep a copy' }));
      await waitFor(() => expect(importedAdd).toHaveBeenCalledTimes(1));
      const file: File = importedAdd.mock.calls[0][0];
      expect(file.name).toBe('Lead.ns4p');
      expect(new Uint8Array(await file.arrayBuffer())).toEqual(stage4);
    });
  });

  describe('a merged row', () => {
    const merged = {
      id: 'local:3', name: 'Pad', source: 'local', bytes: stage4, program: { name: 'Pad', bytes: stage4 }, fingerprint: 'x1',
      sources: ['local', 'cloud'], members: [{ id: 'local:3', source: 'local', name: 'Pad' }, { id: 'cloud:x1', source: 'cloud', name: 'Pad v2' }],
    };
    it('opens through any member id', () => {
      entries.set('cloud:x1', merged);
      render(<LibrarySplit selectedId="cloud:x1" />);
      expect(screen.getByText('DETAIL')).toBeInTheDocument();
    });
    it('lists the other names it goes by', () => {
      entries.set('local:3', merged);
      render(<LibrarySplit selectedId="local:3" />);
      expect(screen.getByText(/also: “Pad v2” in the cloud/i)).toBeInTheDocument();
    });
    it('removes the imported copy by its own id, shares the local copy, and offers no Keep a copy', () => {
      entries.set('cloud:x1', merged);
      render(<CapabilitiesProvider value={{ community: { available: true }, auth: { ...localAuth, available: true } }}><LibrarySplit selectedId="cloud:x1" /></CapabilitiesProvider>);
      fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
      expect(screen.queryByRole('menuitem', { name: 'Keep a copy' })).not.toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Remove from library' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
      expect(navigate).toHaveBeenCalledWith({ to: '/community/share', search: { item: 'local:3' } });
    });
    it('offers no Share for a row with no copy on this computer', () => {
      entries.set('nord:A:11', { id: 'nord:A:11', name: 'Wurli', source: 'nord', bytes: stage4, program: { name: 'Wurli', bytes: stage4 }, sources: ['nord', 'cloud'], members: [{ id: 'nord:A:11', source: 'nord', name: 'Wurli' }, { id: 'cloud:x5', source: 'cloud', name: 'Wurli' }] });
      render(<CapabilitiesProvider value={{ community: { available: true }, auth: { ...localAuth, available: true } }}><LibrarySplit selectedId="nord:A:11" /></CapabilitiesProvider>);
      fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
      expect(screen.queryByRole('menuitem', { name: 'Share to community' })).not.toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Keep a copy' })).toBeInTheDocument();
    });
  });
});
