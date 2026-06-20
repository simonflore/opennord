import { useState } from 'react';
import { WebUsbTransport } from '../../lib/device/webusb';
import { NordSession } from '../../lib/device/session';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { findAuthorizedDevice } from '../../lib/device/authorized';
import { Button, SectionLabel } from '../ui';
import './connect.css';

// Vendor-only (Clavia DMI AB) — accept the whole Nord line, as NSM does. The
// Stage 4 transfer flows are validated; other models connect read-only (probe).
const NORD_FILTER: USBDeviceFilter = { vendorId: 0x0ffc };

type Status = 'idle' | 'connecting' | 'connected' | 'error';

/** Maps low-level errors to friendly guidance. Empty string = user cancelled (no error). */
function describeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/no device selected|cancel/i.test(m)) return '';
  if (/claim|interface|access|busy/i.test(m)) {
    return 'Could not connect — quit Nord Sound Manager (it holds the Nord), then try again.';
  }
  return `Could not connect: ${m}`;
}

export function ConnectPanel({ onConnected }: {
  onConnected: (session: NordSession, entries: ProgramEntry[], deviceName: string) => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const supported = typeof navigator !== 'undefined' && 'usb' in navigator;
  if (!supported) {
    return (
      <div className="connect">
        <div className="connect__card">
          <SectionLabel>Your Nord</SectionLabel>
          <h2 className="connect__title">Open this in Chrome or Edge to connect</h2>
          <p className="connect__lead">
            Talking to your Nord over USB needs Chrome or Edge on a computer. Everything else in
            OpenNord — browsing, samples, sharing — works in any browser; switch over when you're
            ready to move programs to and from the keyboard.
          </p>
        </div>
      </div>
    );
  }

  async function connect() {
    setStatus('connecting');
    setMessage('');
    let transport: WebUsbTransport | undefined;
    try {
      // Reconnect silently if this Nord was authorized before — Chrome remembers
      // the grant per origin, so only the first-ever connect needs the chooser.
      const device =
        findAuthorizedDevice(await navigator.usb.getDevices(), NORD_FILTER) ??
        (await navigator.usb.requestDevice({ filters: [NORD_FILTER] }));
      transport = new WebUsbTransport(device);
      await transport.open();
      const session = new NordSession(transport);
      // Bracket the enumerate in a begin/end session so the Nord returns to idle
      // afterward (a left-open session makes it show "synchronizing" forever).
      const entries = await session.withSession(PARTITION_PROGRAM, () => enumeratePrograms(session));
      setStatus('connected');
      const name = device.productName ?? 'Nord Stage 4';
      onConnected(session, entries, name);
    } catch (e) {
      // Release the interface on any failure so a retry isn't blocked by a stale claim.
      if (transport) await transport.close().catch(() => {});
      const friendly = describeError(e);
      if (!friendly) {
        setStatus('idle'); // user cancelled the picker
        return;
      }
      setStatus('error');
      setMessage(friendly);
    }
  }

  return (
    <div className="connect" aria-live="polite">
      <div className="connect__card">
        <SectionLabel>Your Nord</SectionLabel>
        <h2 className="connect__title">Bring your Nord in</h2>
        <p className="connect__lead">
          Plug your Stage 4 into this computer over USB to back up your sounds, browse every
          program in one place, and move patches between the keyboard and OpenNord.
        </p>
        <Button
          variant="primary"
          className="connect__cta"
          onClick={connect}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? 'Connecting…' : 'Connect your Nord'}
        </Button>
        {status === 'error' && <p className="on-error connect__error">{message}</p>}
        <p className="connect__hint">
          Using Nord Sound Manager? Quit it first — it keeps the USB connection to itself, so only
          one app can talk to the Nord at a time.
        </p>
      </div>
    </div>
  );
}
