// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

const connect = vi.fn(async () => {});
let hook = { status: 'idle', message: '', connect, reach: 'webusb', reachable: true, needsUsbDk: false };
vi.mock('../device/useConnectNord', () => ({ useConnectNord: () => hook }));

const disconnect = vi.fn();
let device: Record<string, unknown> = {};
vi.mock('../../lib/device/DeviceContext', () => ({ useDevice: () => device }));
let backupBusy = false;
vi.mock('../device/BackupPanel', async () => {
  const { useEffect } = await import('react');
  return {
    BackupPanel: ({ startBackup, onBusyChange }: { startBackup?: boolean; onBusyChange?: (b: boolean) => void }) => {
      useEffect(() => { onBusyChange?.(backupBusy); }, [onBusyChange]);
      return <div>{startBackup ? 'BACKING UP' : 'RESTORE PICKER'}</div>;
    },
  };
});

import { DeviceStatus } from './DeviceStatus';

const SESSION = { canWrite: () => true, programPartition: 3 };

beforeEach(() => {
  hook = { status: 'idle', message: '', connect, reach: 'webusb', reachable: true, needsUsbDk: false };
  device = { session: null, deviceName: '', entries: [], setConnection: vi.fn(), disconnect, refresh: vi.fn() };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); backupBusy = false; });

const openMenu = () => fireEvent.keyDown(screen.getByRole('button', { name: /Nord Stage 4/ }), { key: 'Enter' });

describe('DeviceStatus', () => {
  it('connects right here when this host can reach a Nord', async () => {
    const onManage = vi.fn();
    render(<DeviceStatus onManage={onManage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect' })); });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(onManage).not.toHaveBeenCalled();
  });

  it('opens the Device page instead when this host can’t reach a Nord (it says why)', async () => {
    hook = { ...hook, reachable: false };
    const onManage = vi.fn();
    render(<DeviceStatus onManage={onManage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect' })); });
    expect(onManage).toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
  });

  it('says why a connect it started failed, with Try again', async () => {
    hook = { ...hook, status: 'error', message: 'Your Nord didn’t answer.' };
    render(<DeviceStatus onManage={vi.fn()} />);
    // A failure from another Connect (the Device page's card) speaks there, not here.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect' })); });
    expect(screen.getByRole('dialog')).toHaveTextContent('Your Nord didn’t answer.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('connected: the Nord’s name opens its menu with the keyboard’s jobs', () => {
    device = { ...device, session: SESSION, deviceName: 'Nord Stage 4', entries: [1, 2] };
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    for (const item of ['Back up Nord', 'Restore Nord…', 'Check my Nord', 'Manage slots', 'Disconnect']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(`^${item}`) })).toBeInTheDocument();
    }
  });

  it('Back up Nord starts the backup in a dialog, which Close closes', () => {
    device = { ...device, session: SESSION, deviceName: 'Nord Stage 4', entries: [] };
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Back up Nord/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('BACKING UP');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Disconnect disconnects', () => {
    device = { ...device, session: SESSION, deviceName: 'Nord Stage 4', entries: [] };
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disconnect' }));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('a dialog stays with its Nord: after an unplug and a reconnect it doesn’t come back', () => {
    device = { ...device, session: SESSION, deviceName: 'Nord Stage 4', entries: [] };
    const { rerender } = render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Back up Nord/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    device = { ...device, session: null };
    rerender(<DeviceStatus onManage={vi.fn()} />);
    device = { ...device, session: { ...SESSION } }; // a new session for the same Nord
    rerender(<DeviceStatus onManage={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('can’t close while a backup is running, and gives focus back to the Nord’s button', async () => {
    device = { ...device, session: SESSION, deviceName: 'Nord Stage 4', entries: [] };
    backupBusy = true;
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Back up Nord/ }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    cleanup();

    backupBusy = false;
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Back up Nord/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Nord Stage 4/ })).toHaveFocus());
  });

  it('greys Restore on a keyboard it can’t restore to, and says why', () => {
    device = { ...device, session: { canWrite: () => false, programPartition: 3 }, deviceName: 'Nord Stage 4', entries: [] };
    render(<DeviceStatus onManage={vi.fn()} />);
    openMenu();
    const restore = screen.getByRole('menuitem', { name: /^Restore Nord…/ });
    expect(restore).toHaveAttribute('data-disabled');
    expect(restore).toHaveTextContent(/Off on this keyboard/);
  });
});
