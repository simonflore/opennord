// Live read-only probe of the Nord Stage 4 vendor USB protocol.
// Sends framed FileTransfer queries (no payload, no file address needed) and
// prints the device's reply. READ-ONLY: only CQry* messages — no writes/erase.
//
// Framing (big-endian), recovered from Nord Sound Manager:
//   [u32 length][u32 protoId=0x0C][u32 version=0x0A][u32 msgId][payload...][u16 crc16]
//   length = total bytes incl. itself + CRC; CRC-16/CCITT (poly 0x1021, init 0xFFFF)
// Transport: bulk OUT 0x03, bulk IN 0x82, on vendor interface 0.
//
// Build: clang nordprobe.c -I"$(brew --prefix libusb)/include" \
//        -L"$(brew --prefix libusb)/lib" -lusb-1.0 -o /tmp/nordprobe
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>

#define VID 0x0ffc
#define PID 0x002e
#define EP_OUT 0x03
#define EP_IN  0x82

static uint16_t crc16_ccitt(const uint8_t *d, size_t n) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < n; i++) {
    crc ^= (uint16_t)d[i] << 8;
    for (int b = 0; b < 8; b++)
      crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
  }
  return crc;
}

static int build(uint8_t *out, uint32_t msgId, const uint32_t *pl, int npl) {
  uint8_t *p = out;
  int body = 16 + 4 * npl;           // len+proto+ver+msgId (+payload)
  uint32_t total = (uint32_t)(body + 2);  // + crc16
#define PUT32(v) do{ *p++=(uint8_t)((v)>>24); *p++=(uint8_t)((v)>>16); *p++=(uint8_t)((v)>>8); *p++=(uint8_t)(v); }while(0)
  PUT32(total); PUT32(0x0C); PUT32(0x0A); PUT32(msgId);
  for (int i = 0; i < npl; i++) PUT32(pl[i]);
  uint16_t crc = crc16_ccitt(out, body);
  *p++ = (uint8_t)(crc >> 8); *p++ = (uint8_t)(crc & 0xff);
  return (int)(p - out);
}

static void hexdump(const char *tag, const uint8_t *d, int n) {
  printf("%s (%d bytes): ", tag, n);
  for (int i = 0; i < n; i++) printf("%02x ", d[i]);
  printf("\n");
}

static int query(libusb_device_handle *h, const char *name, uint32_t msgId,
                 const uint32_t *pl, int npl) {
  uint8_t msg[64], rep[2048];
  int n = build(msg, msgId, pl, npl), sent = 0, got = 0, r;
  printf("\n--- %s (msgId 0x%02x) ---\n", name, msgId);
  hexdump("  TX", msg, n);
  r = libusb_bulk_transfer(h, EP_OUT, msg, n, &sent, 2000);
  if (r) { printf("  OUT err: %s\n", libusb_error_name(r)); return r; }
  r = libusb_bulk_transfer(h, EP_IN, rep, sizeof(rep), &got, 2000);
  if (r) { printf("  IN  err: %s (no reply)\n", libusb_error_name(r)); return r; }
  hexdump("  RX", rep, got);
  if (got >= 16)
    printf("  parsed: len=%u proto=%u ver=%u msgId=0x%02x\n",
           (rep[0]<<24)|(rep[1]<<16)|(rep[2]<<8)|rep[3],
           (rep[4]<<24)|(rep[5]<<16)|(rep[6]<<8)|rep[7],
           (rep[8]<<24)|(rep[9]<<16)|(rep[10]<<8)|rep[11],
           (rep[12]<<24)|(rep[13]<<16)|(rep[14]<<8)|rep[15]);
  return 0;
}

int main(void) {
  libusb_context *ctx = NULL;
  if (libusb_init(&ctx)) { printf("init failed\n"); return 1; }
  libusb_device_handle *h = libusb_open_device_with_vid_pid(ctx, VID, PID);
  if (!h) { printf("device not open (NSM still holding it? not connected?)\n"); return 2; }
  libusb_set_auto_detach_kernel_driver(h, 1);
  int r = libusb_claim_interface(h, 0);
  if (r) { printf("claim iface 0 failed: %s (quit NSM first)\n", libusb_error_name(r)); return 3; }
  printf("claimed vendor interface 0 on Nord Stage 4\n");

  query(h, "CQryContentVersion", 0x3d, NULL, 0);
  query(h, "CQryPartList",       0x00, NULL, 0);

  libusb_release_interface(h, 0);
  libusb_close(h);
  libusb_exit(ctx);
  return 0;
}
