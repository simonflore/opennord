import { useEffect, useState } from 'react';
import type { NordTransport } from '../../lib/device/transport';
import { WebUsbTransport } from '../../lib/device/webusb';
import { CapacitorUsbTransport, nordUsbAvailable, usbAvailability } from '../../lib/device/capacitor-usb';
import { NordSession } from '../../lib/device/session';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { findAuthorizedDevice } from '../../lib/device/authorized';
import { shouldNegotiateVersion } from '../../lib/device/negotiate';
import { Button, SectionLabel } from '../ui';
import { getErrorMessage } from '../../lib/errors';
import './connect.css';

// Vendor-only (Clavia DMI AB) — accept the whole Nord line, as NSM does. The
// Stage 4 transfer flows are validated; other models connect read-only (probe).
const NORD_FILTER: USBDeviceFilter = { vendorId: 0x0ffc };

type Status = 'idle' | 'connecting' | 'connected' | 'error';

/** Maps low-level errors to friendly guidance. Empty string = user cancelled (no error). */
function describeError(e: unknown): string {
  const m = getErrorMessage(e);
  if (/no device selected|cancel/i.test(m)) return '';
  if (/claim|interface|access|busy/i.test(m)) {
    return 'Could not connect — quit Nord Sound Manager (it holds the Nord), then try again.';
  }
  return `Could not connect: ${m}`;
}

const DEFAULT_TITLE = 'Bring your Nord in';
const DEFAULT_LEAD =
  'Plug your Stage 4 into this computer over USB to back up your sounds, browse every ' +
  'program in one place, and move patches between the keyboard and OpenNord.';

export function ConnectPanel({ onConnected, onOpenBackup, title = DEFAULT_TITLE, lead = DEFAULT_LEAD }: {
  onConnected: (session: NordSession, entries: ProgramEntry[], deviceName: string, productId: number) => void;
  /** Callback when the user clicks "open a backup offline" (optional). */
  onOpenBackup?: () => void;
  /** Override the connect-card heading (e.g. for line-wide tools, not Stage-4 framing). */
  title?: string;
  /** Override the connect-card lead copy. */
  lead?: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const reach = usbAvailability();
  // null = probing; only meaningful on the iPad native path.
  const [ipadReady, setIpadReady] = useState<boolean | null>(
    reach === 'ipad-dext-pending' ? null : false,
  );
  useEffect(() => {
    if (reach !== 'ipad-dext-pending') return;
    let alive = true;
    nordUsbAvailable().then((ok) => {
      if (alive) setIpadReady(ok);
    });
    return () => {
      alive = false;
    };
  }, [reach]);

  // Info cards: a plain browser without WebUSB, or an iPad whose DEXT isn't ready.
  if (reach === 'unsupported' || (reach === 'ipad-dext-pending' && ipadReady !== true)) {
    const ipad = reach === 'ipad-dext-pending';
    return (
      <div className="connect">
        <div className="connect__card">
          <SectionLabel>Your Nord</SectionLabel>
          <h2 className="connect__title">
            {ipad ? 'USB transfer is coming to iPad' : 'Open this in Chrome or Edge to connect'}
          </h2>
          <p className="connect__lead">
            {ipad
              ? "Moving programs to and from your Nord over USB is on the way for iPad. Everything else — browsing, samples, sharing — works right here today."
              : "Talking to your Nord over USB needs Chrome or Edge on a computer. Everything else in OpenNord — browsing, samples, sharing — works in any browser; switch over when you're ready to move programs to and from the keyboard."}
          </p>
        </div>
      </div>
    );
  }

  async function runSession(transport: NordTransport, deviceName: string, productId: number) {
    await transport.open();
    const session = new NordSession(transport);
    // Adopt the device's FileTransfer protocol version (NS2 = 0x08). Best-effort:
    // if the device doesn't answer the handshake, the NS4 default (0x0a) stands.
    // Skipped for the NS4 itself — it already uses 0x0a, and the handshake's reply
    // read is unbounded, so querying a device that won't answer hangs connect.
    if (shouldNegotiateVersion(productId)) {
      await session.negotiateVersion().catch(() => undefined);
    }
    // Bracket enumerate in a begin/end session so the Nord returns to idle after.
    const entries = await session.withSession(PARTITION_PROGRAM, () => enumeratePrograms(session));
    setStatus('connected');
    onConnected(session, entries, deviceName, productId);
  }

  async function connect() {
    setStatus('connecting');
    setMessage('');
    let transport: NordTransport | undefined;
    try {
      if (reach === 'ipad-dext-pending') {
        transport = new CapacitorUsbTransport();
        // TODO(ipad-dext): placeholder name + productId 0 — the four-method seam
        // can't report device identity yet; surface the real model/PID once the
        // DriverKit DEXT lands (docs/IPAD.md).
        await runSession(transport, 'Nord Stage 4', 0);
        return;
      }
      // WebUSB: reconnect silently if authorized before; else show the chooser.
      const device =
        findAuthorizedDevice(await navigator.usb.getDevices(), NORD_FILTER) ??
        (await navigator.usb.requestDevice({ filters: [NORD_FILTER] }));
      transport = new WebUsbTransport(device);
      await runSession(transport, device.productName ?? 'Nord', device.productId);
    } catch (e) {
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
        <h2 className="connect__title">{title}</h2>
        <p className="connect__lead">{lead}</p>
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
        {onOpenBackup && (
          <p className="connect__hint">
            No Nord handy?{' '}
            <button type="button" onClick={onOpenBackup}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--deps-ink)', textDecoration: 'underline', font: 'inherit' }}>
              Open a backup to organize offline
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
