import { describe, it, expect } from 'vitest';
import { findBulkInterface, describeUsbDevice } from './usb-descriptors';

// Minimal WebUSB descriptor mocks — only the fields the helpers read.
const ep = (endpointNumber: number, direction: 'in' | 'out', type = 'bulk', packetSize = 512) =>
  ({ endpointNumber, direction, type, packetSize });

const iface = (interfaceNumber: number, endpoints: ReturnType<typeof ep>[], interfaceClass = 0xff) => ({
  interfaceNumber,
  alternate: { interfaceClass, endpoints },
  alternates: [{ interfaceClass, endpoints }],
});

const device = (interfaces: ReturnType<typeof iface>[], over: Partial<USBDevice> = {}) =>
  ({
    vendorId: 0x0ffc, productId: 0x002e, productName: 'Nord Stage 4',
    manufacturerName: 'Clavia', usbVersionMajor: 2, usbVersionMinor: 0, deviceClass: 0,
    configuration: { interfaces }, configurations: [{ interfaces }],
    ...over,
  }) as unknown as USBDevice;

describe('findBulkInterface', () => {
  it('finds the Stage 4 layout: interface 0, bulk OUT 3 / IN 2', () => {
    const d = device([iface(0, [ep(3, 'out'), ep(2, 'in')])]);
    expect(findBulkInterface(d)).toEqual({ interfaceNumber: 0, outEndpoint: 3, inEndpoint: 2 });
  });

  it('discovers a different layout (older device) instead of assuming 0/3/2', () => {
    // Hypothetical Stage 2: vendor bulk interface at index 1, endpoints 1/1.
    const d = device([
      iface(0, [ep(1, 'in', 'interrupt')]),      // not bulk — skipped
      iface(1, [ep(1, 'out'), ep(1, 'in')]),     // the real vendor bulk interface
    ]);
    expect(findBulkInterface(d)).toEqual({ interfaceNumber: 1, outEndpoint: 1, inEndpoint: 1 });
  });

  it('returns null when no interface carries both bulk directions', () => {
    expect(findBulkInterface(device([iface(0, [ep(3, 'out')])]))).toBeNull();
    expect(findBulkInterface(device([]))).toBeNull();
  });

  it('falls back to configurations[0] when configuration is not yet selected', () => {
    const d = device([iface(0, [ep(3, 'out'), ep(2, 'in')])], { configuration: null });
    expect(findBulkInterface(d)).toEqual({ interfaceNumber: 0, outEndpoint: 3, inEndpoint: 2 });
  });
});

describe('describeUsbDevice', () => {
  it('produces a compact snapshot with reconstructed endpoint addresses', () => {
    const snap = describeUsbDevice(device([iface(0, [ep(3, 'out'), ep(2, 'in')])]));
    expect(snap.vendorId).toBe(0x0ffc);
    expect(snap.productId).toBe(0x002e);
    expect(snap.usbVersion).toBe('2.0');
    expect(snap.interfaces[0].endpoints).toEqual([
      { address: '0x03', direction: 'out', type: 'bulk', packetSize: 512 },
      { address: '0x82', direction: 'in', type: 'bulk', packetSize: 512 },
    ]);
  });
});
