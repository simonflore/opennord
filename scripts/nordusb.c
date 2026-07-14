// Passive USB descriptor recon for the Nord Stage 4 (and other Clavia devices).
//
// Reads the cached USB configuration descriptor via libusb — NO device open,
// NO interface claim — so it is safe to run while Nord Sound Manager is using
// the device (NSM holds the vendor interface exclusively). Prints every
// interface + endpoint (address, transfer type, direction, max packet size).
//
// Build:  clang scripts/nordusb.c -I"$(brew --prefix libusb)/include" \
//               -L"$(brew --prefix libusb)/lib" -lusb-1.0 -o /tmp/nordusb
// Run:    /tmp/nordusb
//
// See docs/PROTOCOL-RE.md (Step 1) for the captured Stage 4 descriptors.
#include <stdio.h>
#include <libusb-1.0/libusb.h>

static const char *xfer(int a) {
  switch (a & 3) { case 0: return "CONTROL"; case 1: return "ISO";
                   case 2: return "BULK"; default: return "INTERRUPT"; }
}

int main(void) {
  libusb_context *ctx = NULL;
  if (libusb_init(&ctx)) { printf("libusb init failed\n"); return 1; }
  libusb_device **list;
  ssize_t n = libusb_get_device_list(ctx, &list);
  for (ssize_t i = 0; i < n; i++) {
    libusb_device *d = list[i];
    struct libusb_device_descriptor dd;
    if (libusb_get_device_descriptor(d, &dd)) continue;
    if (dd.idVendor != 0x0ffc) continue;  // Clavia DMI AB
    printf("DEVICE VID=0x%04x PID=0x%04x bcdDevice=0x%04x class=%d numCfg=%d\n",
           dd.idVendor, dd.idProduct, dd.bcdDevice, dd.bDeviceClass,
           dd.bNumConfigurations);
    struct libusb_config_descriptor *cfg;
    if (libusb_get_active_config_descriptor(d, &cfg)) {
      printf("  (no active config readable)\n"); continue;
    }
    printf("  config #%d  interfaces=%d  maxPower=%dmA\n",
           cfg->bConfigurationValue, cfg->bNumInterfaces, cfg->MaxPower * 2);
    for (int ii = 0; ii < cfg->bNumInterfaces; ii++) {
      const struct libusb_interface *itf = &cfg->interface[ii];
      for (int a = 0; a < itf->num_altsetting; a++) {
        const struct libusb_interface_descriptor *id = &itf->altsetting[a];
        printf("  IFACE %d alt %d : class=%d sub=%d proto=%d  nEndpoints=%d\n",
               id->bInterfaceNumber, id->bAlternateSetting, id->bInterfaceClass,
               id->bInterfaceSubClass, id->bInterfaceProtocol, id->bNumEndpoints);
        for (int e = 0; e < id->bNumEndpoints; e++) {
          const struct libusb_endpoint_descriptor *ep = &id->endpoint[e];
          printf("      EP 0x%02x  %-9s %-3s  maxPkt=%d  interval=%d\n",
                 ep->bEndpointAddress, xfer(ep->bmAttributes),
                 (ep->bEndpointAddress & 0x80) ? "IN" : "OUT",
                 ep->wMaxPacketSize, ep->bInterval);
        }
      }
    }
    libusb_free_config_descriptor(cfg);
  }
  libusb_free_device_list(list, 1);
  libusb_exit(ctx);
  return 0;
}
