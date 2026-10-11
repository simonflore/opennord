// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

let reach: 'webusb' | 'ipad-dext-pending' | 'unsupported' = 'webusb';
let ipadReady = false;

vi.mock('../../lib/device/capacitor-usb', () => ({
  usbAvailability: () => reach,
  nordUsbAvailable: () => Promise.resolve(ipadReady),
  CapacitorUsbTransport: class {},
}));
// Keep the WebUSB connect path inert in tests (no real navigator.usb call).
vi.mock('../../lib/device/webusb', () => ({ WebUsbTransport: class {} }));
vi.mock('../../lib/device/authorized', () => ({ findAuthorizedDevice: () => undefined }));

import { ConnectPanel } from './ConnectPanel';

afterEach(() => {
  cleanup();
  reach = 'webusb';
  ipadReady = false;
});

describe('ConnectPanel render states', () => {
  it('webusb: shows the connect card', () => {
    reach = 'webusb';
    render(<ConnectPanel onConnected={vi.fn()} />);
    expect(screen.getByText(/bring your nord in/i)).toBeInTheDocument();
  });

  it('iPad without a ready DEXT: asks to plug the Nord in', async () => {
    reach = 'ipad-dext-pending';
    ipadReady = false;
    render(<ConnectPanel onConnected={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByText(/plug your nord into this ipad/i)).toBeInTheDocument(),
    );
  });

  it('iPad with a ready DEXT: shows a working connect card', async () => {
    reach = 'ipad-dext-pending';
    ipadReady = true;
    render(<ConnectPanel onConnected={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /connect your nord/i })).toBeInTheDocument(),
    );
  });

  it('unsupported browser: shows the Chrome/Edge card', () => {
    reach = 'unsupported';
    render(<ConnectPanel onConnected={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /chrome or edge/i })).toBeInTheDocument();
  });

  it('offers an offline "open a backup" action when onOpenBackup is provided', () => {
    reach = 'webusb';
    render(<ConnectPanel onConnected={vi.fn()} onOpenBackup={vi.fn()} />);
    expect(screen.getByRole('button', { name: /open a backup/i })).toBeInTheDocument();
  });
});

describe('describeError', () => {
  it('says a Nord still busy with another transfer is busy, in plain words', async () => {
    const { describeError } = await import('./ConnectPanel');
    const { SessionRefusedError } = await import('../../lib/device/protocol');
    const msg = describeError(new SessionRefusedError(7, 18), true);
    expect(msg).toMatch(/busy with another transfer/);
    expect(msg).not.toMatch(/status|partition|18/i);
  });

  it('turns any other refused session into plain words, without protocol jargon', async () => {
    const { describeError } = await import('./ConnectPanel');
    const { SessionRefusedError } = await import('../../lib/device/protocol');
    const msg = describeError(new SessionRefusedError(13, 2), true);
    expect(msg).toMatch(/wouldn’t let OpenNord open its memory/);
    expect(msg).not.toMatch(/status|partition|13/i);
  });
});
