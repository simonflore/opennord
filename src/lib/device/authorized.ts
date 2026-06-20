/**
 * First already-authorized USB device matching a filter, or undefined.
 *
 * `navigator.usb.getDevices()` returns the devices the user has previously
 * granted this origin access to. Checking it before `requestDevice()` lets
 * repeat connects open a known Nord directly and skip the browser's permission
 * chooser — the chooser is only needed the first time (a WebUSB security rule).
 */
export function findAuthorizedDevice(
  devices: USBDevice[],
  filter: USBDeviceFilter,
): USBDevice | undefined {
  // Match on vendor; only constrain the product when the filter sets one. A
  // vendor-only filter (Clavia 0x0ffc) accepts the whole Nord line — exactly what
  // Nord Sound Manager does (docs/NORD-PRODUCT-LINE.md).
  return devices.find(
    (d) => d.vendorId === filter.vendorId &&
      (filter.productId === undefined || d.productId === filter.productId),
  );
}
