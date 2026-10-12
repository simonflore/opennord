import { useEffect, useState } from 'react';
import type { NordTransport } from '../../lib/device/transport';
import { WebUsbTransport } from '../../lib/device/webusb';
import { CapacitorUsbTransport } from '../../lib/device/capacitor-usb';
import { useUsbReach } from '../../lib/device/useUsbReach';
import { ElectronUsbTransport } from '../../lib/device/electron-usb';
import { isPlayerFacing } from '../../lib/device/player-message';
import { NordSession } from '../../lib/device/session';
import { NordStatus, SessionRefusedError } from '../../lib/device/protocol';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { identifyDevice, resolveDeviceAccess, PROBE_REPLY_TIMEOUT_MS, type DeviceIdentity } from '../../lib/device/connect-probe';
import { modelById } from '../../lib/clavia/partitions';
import { findAuthorizedDevice } from '../../lib/device/authorized';
import { initialFileTransferVersion, shouldNegotiateVersion } from '../../lib/device/negotiate';
import { describeUsbDevice, findBulkInterface, type UsbDeviceSnapshot } from '../../lib/device/usb-descriptors';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { Button, SectionLabel } from '../ui';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '@/lib/cn';

const connectTitle = 'mx-0 mt-2 mb-3 text-[22px] font-extrabold text-ink';
const connectLead = 'm-0 mb-4 text-[13px] leading-[1.55] text-dim';

/** Compact, log-safe shape of a caught error for diagnostics. */
function errorShape(e: unknown): Record<string, unknown> {
  if (e instanceof SessionRefusedError) return { name: e.name, message: e.message, partition: e.partition, status: e.status };
  if (e instanceof Error) return { name: e.name, message: e.message };
  return { message: String(e) };
}

// Vendor-only (Clavia DMI AB) — accept the whole Nord line, as NSM does. The
// Stage 4 transfer flows are validated; other models connect read-only unless the
// read-only probe confirms where their programs live (resolveDeviceAccess).
const NORD_FILTER: USBDeviceFilter = { vendorId: 0x0ffc };

type Status = 'idle' | 'connecting' | 'connected' | 'error';

/** Maps low-level errors to friendly guidance. Empty string = user cancelled (no error). */
export function describeError(e: unknown, isDesktop: boolean): string {
  if (e instanceof SessionRefusedError) {
    // The USB link works. Busy: another session still holds the Nord after our own
    // end-and-retry, so another app has it. Otherwise the memory area isn't there.
    if (e.status === NordStatus.sessionBusy) {
      return 'Your Nord is busy with another transfer. Quit Nord Sound Manager and any other ' +
        'app connected to it, then try again. If it keeps happening, switch the Nord off and on.';
    }
    return 'Your Nord answered, but wouldn’t let OpenNord open its memory. Unplug the USB ' +
      'cable and plug it back in, then try again. If it keeps happening, OpenNord doesn’t know ' +
      'this model’s layout yet — let us know which Nord it is.';
  }
  const m = getErrorMessage(e);
  if (/no device selected|cancel/i.test(m)) return '';
  // The desktop app's USB bridge already words its own failures for a player (electron/usb-backend.ts).
  if (isDesktop && isPlayerFacing(m)) return m;
  if (/unable to claim|claim.*interface|network/i.test(m)) {
    // "Unable to claim interface" = the OS has a driver bound to the Nord's USB
    // interface. On Windows this hits older models (e.g. Stage 2) whose firmware
    // doesn't auto-request the browser-usable WinUSB driver — confirmed from real
    // device diagnostics (identical interface layout to a Stage 4 that connects
    // fine, so it's the driver, not the layout). The remedy differs by transport:
    // the desktop app can capture the port via the UsbDk backend, so point a
    // desktop user there; the browser can't, so point a browser user at the app.
    if (isDesktop) {
      return 'OpenNord couldn’t open your Nord’s USB port. First quit Nord Sound Manager if ' +
        'it’s open. Reaching older models (like the Stage 2) needs the one-time UsbDk runtime — ' +
        'install it from the setup notes, then reconnect.';
    }
    return 'Your browser couldn’t open your Nord’s USB port. First quit Nord Sound Manager if ' +
      'it’s open. Older models (like the Stage 2) often can’t be claimed from a browser at all — ' +
      'the OpenNord desktop app (Windows) can reach them; see the Download section on the home page.';
  }
  if (/access|busy|security|denied/i.test(m)) {
    return 'Couldn’t open your Nord over USB — another app may be holding it. Quit Nord Sound ' +
      'Manager (or similar) and try again.';
  }
  return `Could not connect: ${m}`;
}

const DEFAULT_TITLE = 'Bring your Nord in';
const DEFAULT_LEAD =
  'Plug your Stage 4 into this computer over USB to back up your sounds, browse every ' +
  'program in one place, and move patches between the keyboard and OpenNord.';

export function ConnectPanel({ onConnected, onOpenBackup, title = DEFAULT_TITLE, lead = DEFAULT_LEAD, inline = false }: {
  onConnected: (session: NordSession, entries: ProgramEntry[], deviceName: string, productId: number) => void;
  /** Callback when the user clicks "open a backup offline" (optional). */
  onOpenBackup?: () => void;
  /** Override the connect-card heading (e.g. for line-wide tools, not Stage-4 framing). */
  title?: string;
  /** Override the connect-card lead copy. */
  lead?: string;
  /** Just the button and its notes, for a page that already frames the step (no card,
   *  heading or lead). */
  inline?: boolean;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const { diagnostics } = useCapabilities();

  const { reach, reachable } = useUsbReach();

  // Desktop app, Windows only: without the UsbDk runtime, older Nords (e.g. the
  // Stage 2) still can't be reached — the app silently falls back to the same
  // WinUSB backend the browser has, which can't detach NSM's driver. Surface
  // this up front so a Stage 2 owner doesn't hit a bare, confusing failure.
  const [needsUsbDk, setNeedsUsbDk] = useState(false);
  useEffect(() => {
    if (reach !== 'electron') return;
    let alive = true;
    window.nordNativeUsb!.backend().then(({ platform, usbDkInstalled }) => {
      if (alive) setNeedsUsbDk(platform === 'win32' && !usbDkInstalled);
    });
    return () => {
      alive = false;
    };
  }, [reach]);

  // Info cards: a browser without WebUSB, the iPhone app, or an iPad whose DEXT isn't ready.
  if (!reachable) {
    const ipad = reach === 'ipad-dext-pending';
    const infoTitle = ipad ? 'Plug your Nord into this iPad'
      : reach === 'iphone' ? "USB transfer isn't available on iPhone"
      : 'Open this in Chrome or Edge to connect';
    // Inline: the host page already frames the step, so no nested card or heading.
    if (inline) return <p className={cn(connectLead, 'mt-2')}>{infoTitle}.</p>;
    return (
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-[460px] rounded-lg border border-line bg-surface p-6">
          <SectionLabel>Your Nord</SectionLabel>
          <h2 className={connectTitle}>{infoTitle}</h2>
          <p className={connectLead}>
            {ipad
              ? "Connect your Nord with a USB cable and switch it on — this screen picks it up by itself. The first time, also open Settings → Apps → OpenNord → Drivers and switch the Nord driver on. This needs an iPad with an M1 chip or newer."
              : reach === 'iphone'
              ? 'An iPhone has no way to talk to the Nord over USB. Use the iPad app, or Chrome or Edge on a computer, to move programs; everything else — browsing, samples, sharing — works right here.'
              : "Talking to your Nord over USB needs Chrome or Edge on a computer. Everything else in OpenNord — browsing, samples, sharing — works in any browser; switch over when you're ready to move programs to and from the keyboard."}
          </p>
        </div>
      </div>
    );
  }

  async function runSession(
    transport: NordTransport, deviceName: string, productId: number, identity?: DeviceIdentity,
  ) {
    await transport.open();
    const session = new NordSession(transport);
    const deviceIdentity = identity ?? identifyDevice(productId);
    // Start from the model's own FileTransfer version (registry, from its
    // firmware: 3/4/6/7/8/10), else the NS4 default 0x0a — a frame above a
    // device's version is dropped without a reply. Then adopt what the device
    // advertises (NS2 = 0x08). Best-effort and bounded: whether the older
    // models answer the handshake at all is unknown, so on silence or an error
    // the model's version stands. Skipped for the NS4, which already uses 0x0a.
    session.useFileTransferVersion(initialFileTransferVersion(deviceIdentity.model));
    if (shouldNegotiateVersion(productId)) {
      await session.withReplyTimeout(PROBE_REPLY_TIMEOUT_MS, () => session.negotiateVersion()).catch(() => undefined);
    }
    // Address the model's Program partition and decide what may be written.
    // The model comes from the best-known product id (hardware-confirmed, else
    // NSM-recovered), so its own program tag and static index are used. Only a
    // trusted hardware layout (Stage 4) skips the read-only probe; every other
    // model — Stage 2 included, whose layout shifts on older OS — is probed for
    // the partition that actually holds its program files. Writes are allowed
    // only where that is confirmed; otherwise the connection stays read-only.
    const access = await resolveDeviceAccess(session, deviceIdentity, diagnostics);
    session.programPartition = access.programPartition;
    session.allowWrites(access.writable);
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
      if (reach === 'electron') {
        // Desktop app: node-usb in the main process can detach the kernel driver
        // and claim, so this reaches the pre-WinUSB Nords (pid < 0x0024, e.g.
        // Stage 2) the browser can't. Pick the first connected Nord.
        const nords = await window.nordNativeUsb!.list();
        if (nords.length === 0) throw new Error('No Nord found over USB.');
        const dev = nords[0];
        productId = dev.productId;
        transport = new ElectronUsbTransport(productId);
        await runSession(transport, dev.productName ?? 'Nord', productId);
        diagnostics.record({
          kind: 'device.connect', ok: true,
          message: `Connected ${dev.productName ?? 'Nord'} (pid 0x${productId.toString(16)}, desktop)`,
          detail: { path: 'electron', productId },
        });
        return;
      }
      if (reach === 'ipad-dext-pending') {
        const ipad = new CapacitorUsbTransport();
        transport = ipad;
        // The driver reports which Nord this is once it's open. If it couldn't
        // (0), the Stage 4 is only ASSUMED, so the probe must find its program
        // files before anything is written.
        productId = await ipad.identify();
        if (productId) await runSession(ipad, identifyDevice(productId).model?.name ?? 'Nord', productId);
        else await runSession(ipad, 'Nord Stage 4', 0, { model: modelById('stage-4'), confirmed: false });
        diagnostics.record({
          kind: 'device.connect', ok: true,
          message: `Connected (pid 0x${productId.toString(16)}, iPad)`,
          detail: { path: 'ipad-dext', productId },
        });
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
      const friendly = describeError(e, reach === 'electron');
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

  const body = (
    <>
      {needsUsbDk && (
        <div
          className="mb-4 rounded-md border border-[color-mix(in_srgb,var(--warn)_35%,var(--line))] bg-[color-mix(in_srgb,var(--warn)_6%,transparent)] p-3"
          role="note"
        >
          <p className="m-0 mb-1 text-xs font-bold text-ink">Connecting an older Nord, like the Stage 2?</p>
          <p className="m-0 text-xs leading-[1.55] text-dim">
            This app can already reach newer Nords (Stage 3 and 4) — no extra steps. An older
            Nord needs one more thing first: a free, one-time driver called <strong>UsbDk</strong>.
            It won’t stop Nord Sound Manager from working, and you only install it once.
          </p>
          <a
            className="mt-2 inline-block text-xs font-bold text-warn underline hover:text-red-bright"
            href="https://github.com/daynix/UsbDk/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get UsbDk →
          </a>
        </div>
      )}
      <Button
        variant="primary"
        size="md"
        onClick={connect}
        disabled={status === 'connecting'}
      >
        {status === 'connecting' ? 'Connecting…' : 'Connect your Nord'}
      </Button>
      {status === 'error' && <p className="on-error mt-3">{message}</p>}
      <p className="mt-4 border-t border-line pt-3 text-xs leading-[1.5] text-muted">
        Using Nord Sound Manager? Quit it first — it keeps the USB connection to itself, so only
        one app can talk to the Nord at a time.
      </p>
      {onOpenBackup && (
        <p className="mt-4 border-t border-line pt-3 text-xs leading-[1.5] text-muted">
          No Nord handy?{' '}
          <button
            type="button"
            onClick={onOpenBackup}
            className={cn('cursor-pointer border-0 bg-transparent p-0 underline [font:inherit]', 'text-[var(--deps-ink)]')}
          >
            Open a backup to organize offline
          </button>
        </p>
      )}
    </>
  );
  if (inline) return <div className="mt-2" aria-live="polite">{body}</div>;
  return (
    <div className="flex justify-center px-4 py-6" aria-live="polite">
      <div className="w-full max-w-[460px] rounded-lg border border-line bg-surface p-6">
        <SectionLabel>Your Nord</SectionLabel>
        <h2 className={connectTitle}>{title}</h2>
        <p className={connectLead}>{lead}</p>
        {body}
      </div>
    </div>
  );
}
