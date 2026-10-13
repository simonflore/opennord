// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';
import { buildCbinHeader } from '@/lib/clavia/cbin';
import type { PresetEntry } from '@/lib/library/preset-entries';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

import { PresetInspector } from './PresetInspector';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// A header-only Stage 3 synth preset: recognized, with no reader (the panel says so).
const bytes = buildCbinHeader({ formatType: 1, tag: 'ns3y', bank: 0, location: 0, category: 0, versionRaw: 300 });
const file: PresetEntry = { id: 'folder:Lead.ns3y', name: 'Lead', source: 'local', kind: 'synth-preset', bytes };
const onNord: PresetEntry = { id: 'nord-preset:2:A:1', name: 'Lead', source: 'nord', kind: 'synth-preset', slot: 'A:1' };
const community = { community: { available: true } };

describe('PresetInspector', () => {
  it('shares a preset file to the community, opening the share form on it', () => {
    render(<CapabilitiesProvider value={community}><PresetInspector entry={file} session={null} /></CapabilitiesProvider>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
    expect(navigate).toHaveBeenCalledWith({ to: '/community/share', search: { item: 'folder:Lead.ns3y' } });
  });

  it('offers no sharing for a preset still on the Nord, or without the community', () => {
    render(<CapabilitiesProvider value={community}><PresetInspector entry={onNord} session={null} /></CapabilitiesProvider>);
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    cleanup();
    render(<PresetInspector entry={file} session={null} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('fetches a cloud-only preset when shown, and says so meanwhile', () => {
    const read = vi.fn();
    const entry: PresetEntry = { id: 'cloud:y1', name: 'Fat Lead', source: 'cloud', kind: 'synth-preset', fingerprint: 'y1', sources: ['cloud'] };
    const { rerender } = render(<PresetInspector entry={entry} session={null} cloud={{ read, failed: new Map() }} />);
    expect(read).toHaveBeenCalledWith('y1');
    expect(screen.getByText(/fetching from the cloud/i)).toBeInTheDocument();
    rerender(<PresetInspector entry={entry} session={null} cloud={{ read, failed: new Map() }} />);
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('says why a cloud preset could not be fetched, and fetches again only on Try again', () => {
    const read = vi.fn();
    const entry: PresetEntry = { id: 'cloud:y1', name: 'Fat Lead', source: 'cloud', kind: 'synth-preset', fingerprint: 'y1', sources: ['cloud'] };
    render(<PresetInspector entry={entry} session={null} cloud={{ read, failed: new Map([['y1', 'timeout']]) }} />);
    expect(read).not.toHaveBeenCalled();
    expect(screen.getByText(/timeout/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(read).toHaveBeenCalledWith('y1');
  });
  it('offers Keep a copy for a cloud-only preset that has been fetched, and Share only with a local copy', () => {
    const onKeep = vi.fn();
    const entry: PresetEntry = { id: 'cloud:y1', name: 'Fat Lead', source: 'cloud', kind: 'synth-preset', fingerprint: 'y1', sources: ['cloud'], bytes };
    render(<CapabilitiesProvider value={community}><PresetInspector entry={entry} session={null} onKeepCopy={onKeep} /></CapabilitiesProvider>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    expect(screen.queryByRole('menuitem', { name: 'Share to community' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Keep a copy' }));
    expect(onKeep).toHaveBeenCalledTimes(1);
  });
  it('shares the local copy of a merged preset, and says where it is found', () => {
    const merged: PresetEntry = { ...file, fingerprint: 'y1', sources: ['local', 'cloud'], members: [{ id: file.id, source: 'local', name: 'Lead' }, { id: 'cloud:y1', source: 'cloud', name: 'Lead' }] };
    render(<CapabilitiesProvider value={community}><PresetInspector entry={merged} session={null} /></CapabilitiesProvider>);
    expect(screen.getByText(/Local · Cloud/)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
    expect(navigate).toHaveBeenCalledWith({ to: '/community/share', search: { item: 'folder:Lead.ns3y' } });
  });
});
