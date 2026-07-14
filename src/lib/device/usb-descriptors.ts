/**
 * USB descriptor inspection for Nord devices.
 *
 * The transport historically hardcoded the *Stage 4* layout — claim interface 0,
 * bulk OUT endpoint 3, bulk IN endpoint 2 (docs/PROTOCOL-RE.md). That fails on
 * older models (e.g. Stage 2 EX) whose vendor bulk interface sits at a different
 * interface number or uses different endpoint addresses. These helpers discover
 * the right interface + endpoints from the device's own descriptors, and produce
 * a compact snapshot for diagnostics so a failed connect tells us the device's
 * actual layout instead of a misleading "quit Nord Sound Manager".
 *
 * Everything here is pure over the WebUSB descriptor shape — no I/O — so it's
 * unit-testable with a plain object and carries no browser dependency.
 */

/** The vendor bulk interface + its bulk endpoint numbers (WebUSB endpointNumber). */
export interface BulkInterface {
  interfaceNumber: number;
  /** Bulk OUT endpoint number (host → device). */
  outEndpoint: number;
  /** Bulk IN endpoint number (device → host). */
  inEndpoint: number;
}

/**
 * Find an interface that carries both a bulk OUT and a bulk IN endpoint — the
 * Nord vendor FileTransfer interface. Returns the first such interface (lowest
 * interfaceNumber), or `null` when none is found (device speaks a layout we
 * don't recognise). Prefers the device's declared endpoints over any hardcoded
 * assumption.
 */
export function findBulkInterface(device: USBDevice): BulkInterface | null {
  const config = device.configuration ?? device.configurations[0];
  if (!config) return null;
  for (const iface of config.interfaces) {
    const alt = iface.alternate ?? iface.alternates[0];
    if (!alt) continue;
    let out: number | undefined;
    let inp: number | undefined;
    for (const ep of alt.endpoints) {
      if (ep.type !== 'bulk') continue;
      if (ep.direction === 'out' && out === undefined) out = ep.endpointNumber;
      if (ep.direction === 'in' && inp === undefined) inp = ep.endpointNumber;
    }
    if (out !== undefined && inp !== undefined) {
      return { interfaceNumber: iface.interfaceNumber, outEndpoint: out, inEndpoint: inp };
    }
  }
  return null;
}

/** A compact, log-safe snapshot of a USB device's descriptors. No PII. */
export interface UsbDeviceSnapshot {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  usbVersion: string;
  deviceClass: number;
  interfaces: Array<{
    interfaceNumber: number;
    interfaceClass: number;
    endpoints: Array<{ address: string; direction: string; type: string; packetSize: number }>;
  }>;
}

/** Build a compact descriptor snapshot for diagnostics (safe to log/transmit). */
export function describeUsbDevice(device: USBDevice): UsbDeviceSnapshot {
  const config = device.configuration ?? device.configurations[0];
  const interfaces = (config?.interfaces ?? []).map((iface) => {
    const alt = iface.alternate ?? iface.alternates[0];
    return {
      interfaceNumber: iface.interfaceNumber,
      interfaceClass: alt?.interfaceClass ?? -1,
      endpoints: (alt?.endpoints ?? []).map((ep) => ({
        // WebUSB exposes endpointNumber + direction; reconstruct the address for RE parity.
        address: `0x${(ep.endpointNumber | (ep.direction === 'in' ? 0x80 : 0)).toString(16).padStart(2, '0')}`,
        direction: ep.direction,
        type: ep.type,
        packetSize: ep.packetSize,
      })),
    };
  });
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName ?? undefined,
    manufacturerName: device.manufacturerName ?? undefined,
    usbVersion: `${device.usbVersionMajor}.${device.usbVersionMinor}`,
    deviceClass: device.deviceClass,
    interfaces,
  };
}
