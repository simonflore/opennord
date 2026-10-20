/// <reference types="w3c-web-usb" />
// WebUSB types for every package that compiles this file (frontend-pro too), not just core.
import { useEffect, useState } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { TransportLostError, TransportTimeoutError, type NordTransport } from '../../lib/device/transport';
import { WebUsbTransport } from '../../lib/device/webusb';
import { CapacitorUsbTransport } from '../../lib/device/capacitor-usb';
import { useUsbReach } from '../../lib/device/useUsbReach';
import { ElectronUsbTransport } from '../../lib/device/electron-usb';
import { isPlayerFacing } from '../../lib/device/player-message';
import { NordSession } from '../../lib/device/session';
import { NordStatus, SessionRefusedError } from '../../lib/device/protocol';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { connectedDeviceName, hasTrustedLayout, identifyDevice, resolveDeviceAccess, PROBE_REPLY_TIMEOUT_MS, type DeviceIdentity } from '../../lib/device/connect-probe';
import { modelById } from '../../lib/clavia/partitions';
import { findAuthorizedDevice } from '../../lib/device/authorized';
import { initialFileTransferVersion, shouldNegotiateVersion } from '../../lib/device/negotiate';
import { describeUsbDevice, findBulkInterface, type UsbDeviceSnapshot } from '../../lib/device/usb-descriptors';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { getErrorMessage } from '../../lib/errors';

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

/** How long each reply may take while listing the programs on connect. They are small and quick. */
const CONNECT_REPLY_TIMEOUT_MS = 10_000;


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
  if (e instanceof TransportTimeoutError) {
    return 'Your Nord didn’t answer. Unplug the USB cable and plug it back in, then try again. ' +
      'If it keeps happening, switch the Nord off and on.';
  }
  // A transfer that failed after the port was open: the cable or the Nord, not a driver.
  if (e instanceof TransportLostError) {
    return 'The connection to your Nord dropped while connecting. Check the USB cable and try again.';
  }
  const m = getErrorMessage(e);
  if (/no device selected|cancel/i.test(m)) return '';
  // The desktop app's USB bridge already words its own failures for a player (electron/usb-backend.ts).
  if (isDesktop && isPlayerFacing(m)) return m;
  if (/unable to claim|claim.*interface/i.test(m)) {
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

export type OnConnected = (session: NordSession, entries: ProgramEntry[], deviceName: string, productId: number) => void;

/**
 * Connecting a Nord, wherever the button is: the Device page's card and the top
 * bar's Connect both run this, so there is one way in. Picks the transport this
 * host reaches the Nord with (desktop app, iPad driver, WebUSB), probes what may
 * be written, lists the programs, then hands the session to `onConnected`.
 */
export function useConnectNord(onConnected: OnConnected) {
  // Shared by every Connect button: one connect at a time, the same status everywhere.
  const { connectState: { status, message }, beginConnect, endConnect } = useDevice();
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
    // Hardware-confirmed only: a product id merely recovered from NSM gets probed
    // above, and may keep its programs elsewhere.
    session.stage4Layout = hasTrustedLayout(deviceIdentity) && deviceIdentity.model?.id === 'stage-4';
    // Bracket enumerate in a begin/end session so the Nord returns to idle after.
    // Each reply bounded: a Nord that stops answering here (a Stage 4 is asked
    // nothing before this) would otherwise leave "Connecting…" up for good.
    const entries = await session.withReplyTimeout(CONNECT_REPLY_TIMEOUT_MS, () =>
      session.withSession(session.programPartition, () => enumeratePrograms(session)));
    endConnect({ status: 'connected', message: '' });
    onConnected(session, entries, deviceName, productId);
  }

  async function connect() {
    if (!beginConnect()) return; // another Connect is already opening the Nord
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
        await runSession(transport, connectedDeviceName(dev.productName, productId), productId);
        diagnostics.record({
          kind: 'device.connect', ok: true,
          message: `Connected ${connectedDeviceName(dev.productName, productId)} (pid 0x${productId.toString(16)}, desktop)`,
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
        if (productId) await runSession(ipad, connectedDeviceName(undefined, productId), productId);
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
      await runSession(transport, connectedDeviceName(device.productName, device.productId), device.productId);
      diagnostics.record({
        kind: 'device.connect',
        ok: true,
        message: `Connected ${connectedDeviceName(device.productName, productId)} (pid 0x${productId.toString(16)})`,
        detail: { usb, bulk },
      });
    } catch (e) {
      if (transport) await transport.close().catch(() => {});
      const friendly = describeError(e, reach === 'electron');
      if (!friendly) {
        endConnect({ status: 'idle', message: '' }); // user cancelled the picker
        return;
      }
      diagnostics.record({
        kind: 'device.error',
        ok: false,
        message: `Connect failed (pid 0x${productId.toString(16)})`,
        detail: { usb, bulk, error: errorShape(e) },
      });
      endConnect({ status: 'error', message: friendly });
    }
  }

  return { status, message, connect, reach, reachable, needsUsbDk };
}
