import { useEffect, useState } from 'react';
import type { NordTransport } from '../../lib/device/transport';
import { WebUsbTransport } from '../../lib/device/webusb';
import { CapacitorUsbTransport, nordUsbAvailable, usbAvailability } from '../../lib/device/capacitor-usb';
import { NordSession } from '../../lib/device/session';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { resolveProgramPartition } from '../../lib/device/program-partition';
import { confirmProgramPartition } from '../../lib/device/connect-probe';
import { modelByProductId, programPartitionIndex } from '../../lib/clavia/partitions';
import { findAuthorizedDevice } from '../../lib/device/authorized';
import { shouldNegotiateVersion } from '../../lib/device/negotiate';
import { describeUsbDevice, findBulkInterface, type UsbDeviceSnapshot } from '../../lib/device/usb-descriptors';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { Button, SectionLabel } from '../ui';
import { getErrorMessage } from '../../lib/errors';
import './connect.css';

/** Compact, log-safe shape of a caught error for diagnostics. */
function errorShape(e: unknown): Record<string, unknown> {
  if (e instanceof Error) return { name: e.name, message: e.message };
  return { message: String(e) };
}

// Vendor-only (Clavia DMI AB) — accept the whole Nord line, as NSM does. The
// Stage 4 transfer flows are validated; other models connect read-only (probe).
const NORD_FILTER: USBDeviceFilter = { vendorId: 0x0ffc };

type Status = 'idle' | 'connecting' | 'connected' | 'error';

/** Maps low-level errors to friendly guidance. Empty string = user cancelled (no error). */
function describeError(e: unknown): string {
  const m = getErrorMessage(e);
  if (/no device selected|cancel/i.test(m)) return '';
  if (/claim|interface|access|busy|security|denied|network/i.test(m)) {
    // Two common causes, and we can't tell them apart from the error alone:
    // another app holds the device (Nord Sound Manager), or the OS hasn't bound a
    // browser-usable USB driver to this model. Name both instead of only blaming
    // NSM — the diagnostics we just recorded carry the device's real USB layout.
    return 'Couldn’t open your Nord over USB. If Nord Sound Manager (or similar) is running, ' +
      'quit it and try again. If that doesn’t help, this model may need its USB driver enabled ' +
      'for the browser — let us know which Nord you have and we’ll help.';
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
  const { diagnostics } = useCapabilities();

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
    // Address the model's Program partition. Start from the registry (Stage-4
    // index for confirmed/unknown; the model's own where recorded)...
    const model = modelByProductId(productId);
    let programPartition = resolveProgramPartition(productId);
    // ...then, for models WITHOUT a hardware-confirmed index, run the read-only
    // probe to observe the device's real partition map and adopt the partition
    // that actually holds this model's program files — self-correcting a wrong
    // guess (e.g. Stage 3, whose index isn't statically recoverable) and logging
    // the observation so we can confirm the registry over time. Only Stage 2 and
    // Stage 4 (index hardware-validated) skip the probe.
    if (programPartitionIndex(model) === undefined) {
      programPartition = await confirmProgramPartition(session, model, programPartition, diagnostics);
    }
    session.programPartition = programPartition;
    // Bracket enumerate in a begin/end session so the Nord returns to idle after.
    const entries = await session.withSession(session.programPartition, () => enumeratePrograms(session));
    setStatus('connected');
    onConnected(session, entries, deviceName, productId);
  }

  async function connect() {
    setStatus('connecting');
    setMessage('');
    let transport: NordTransport | undefined;
    // Held for diagnostics so a failure reports the device's actual USB layout.
    let usb: UsbDeviceSnapshot | undefined;
    let bulk: ReturnType<typeof findBulkInterface> | undefined;
    let productId = 0;
    try {
      if (reach === 'ipad-dext-pending') {
        transport = new CapacitorUsbTransport();
        // TODO(ipad-dext): placeholder name + productId 0 — the four-method seam
        // can't report device identity yet; surface the real model/PID once the
        // DriverKit DEXT lands (docs/IPAD.md).
        await runSession(transport, 'Nord Stage 4', 0);
        diagnostics.record({ kind: 'device.connect', ok: true, message: 'Connected (iPad DEXT)', detail: { path: 'ipad-dext' } });
        return;
      }
      // WebUSB: reconnect silently if authorized before; else show the chooser.
      const device =
        findAuthorizedDevice(await navigator.usb.getDevices(), NORD_FILTER) ??
        (await navigator.usb.requestDevice({ filters: [NORD_FILTER] }));
      // Capture the descriptors up front — available pre-open, and the one datum
      // we most want when a connect fails on a model we can't test locally.
      usb = describeUsbDevice(device);
      bulk = findBulkInterface(device);
      productId = device.productId;
      transport = new WebUsbTransport(device);
      await runSession(transport, device.productName ?? 'Nord', device.productId);
      diagnostics.record({
        kind: 'device.connect',
        ok: true,
        message: `Connected ${device.productName ?? 'Nord'} (pid 0x${productId.toString(16)})`,
        detail: { usb, bulk },
      });
    } catch (e) {
      if (transport) await transport.close().catch(() => {});
      const friendly = describeError(e);
      if (!friendly) {
        setStatus('idle'); // user cancelled the picker
        return;
      }
      diagnostics.record({
        kind: 'device.error',
        ok: false,
        message: `Connect failed (pid 0x${productId.toString(16)})`,
        detail: { usb, bulk, error: errorShape(e) },
      });
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
