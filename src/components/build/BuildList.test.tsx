// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyProject } from '@/lib/sample-build/model';
import { listProjects, saveProject } from '@/lib/library/sampleProjectStore';
import { BuildList } from './BuildList';

afterEach(cleanup);

describe('BuildList', () => {
  it('lists your builds and opens one', async () => {
    const p = { ...emptyProject('Upright Rhodes'), updatedAt: '2026-10-14T00:00:00Z' };
    await saveProject(p);
    const onOpen = vi.fn();
    render(<BuildList onOpen={onOpen} onNew={vi.fn()} onOpenFile={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /^Upright Rhodes/ }));
    expect(onOpen).toHaveBeenCalledWith(p.id);
  });

  it('offers every way to start in one New build menu, and says while it opens one', async () => {
    const calls = { onNew: vi.fn(), onOpenFile: vi.fn(), onOpenSampleFile: vi.fn(), onImportSfz: vi.fn(), onImportNsmpproj: vi.fn() };
    const { rerender } = render(<BuildList onOpen={vi.fn()} {...calls} />);
    const items: [string, keyof typeof calls][] = [
      ['From recordings', 'onNew'], ['From a sample file…', 'onOpenSampleFile'], ['From an SFZ instrument…', 'onImportSfz'],
      ['From a Nord Sample Editor project…', 'onImportNsmpproj'], ['Open a saved build…', 'onOpenFile'],
    ];
    for (const [label, call] of items) {
      fireEvent.keyDown(screen.getByRole('button', { name: 'New build ▾' }), { key: 'Enter' });
      fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(`^${label.replace(/[.…]/g, '.')}`) }));
      await waitFor(() => expect(calls[call]).toHaveBeenCalled());
    }
    rerender(<BuildList onOpen={vi.fn()} {...calls} importing />);
    expect(screen.getByRole('button', { name: 'Opening…' })).toBeDisabled();
  });

  it('asks before deleting a build, and keeps it on Cancel', async () => {
    const p = { ...emptyProject('Old Pad'), updatedAt: '2026-10-13T00:00:00Z' };
    await saveProject(p);
    render(<BuildList onOpen={vi.fn()} onNew={vi.fn()} onOpenFile={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Old Pad' }));
    expect(await screen.findByRole('dialog', { name: 'Delete the build “Old Pad”?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((await listProjects()).map((r) => r.id)).toContain(p.id);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Old Pad' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete build' }));
    await waitFor(async () => expect((await listProjects()).map((r) => r.id)).not.toContain(p.id));
    await waitFor(() => expect(screen.queryByText('Old Pad')).toBeNull());
  });

  it('says why a project file could not be opened, as an alert', () => {
    render(<BuildList onOpen={vi.fn()} onNew={vi.fn()} onOpenFile={vi.fn()} problem="This file isn’t an OpenNord project." />);
    expect(screen.getByRole('alert')).toHaveTextContent('This file isn’t an OpenNord project.');
  });
});
