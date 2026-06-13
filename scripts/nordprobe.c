// Read-only sequencer for the Nord Stage 4 vendor USB FileTransfer protocol.
// Sends a series of framed messages on one claimed session and dumps each reply.
//   usage: nordprobe "msgIdHex[:w0,w1,...]" ["msgIdHex[:...]"] ...
//   e.g.   nordprobe 04:0 02:6 20:6,0,0     (Begin / BankList part6 / FileIterate)
// Framing (big-endian): [u32 len][u32 0x0C][u32 0x0A][u32 msgId][payload u32...][u16 crc16]
// CRC-16/CCITT (poly 0x1021, init 0xFFFF). Transport: bulk OUT 0x03 / IN 0x82.
// READ-ONLY by intent — pass only query/read opcodes.
#include <stdio.h>
#include <stdlib.h>
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
  int body = 16 + 4 * npl;
  uint32_t total = (uint32_t)(body + 2);
#define PUT32(v) do{ *p++=(uint8_t)((v)>>24); *p++=(uint8_t)((v)>>16); *p++=(uint8_t)((v)>>8); *p++=(uint8_t)(v); }while(0)
  PUT32(total); PUT32(0x0C); PUT32(0x0A); PUT32(msgId);
  for (int i = 0; i < npl; i++) PUT32(pl[i]);
  uint16_t crc = crc16_ccitt(out, body);
  *p++ = (uint8_t)(crc >> 8); *p++ = (uint8_t)(crc & 0xff);
  return (int)(p - out);
}

static void dump(const char *tag, const uint8_t *d, int n) {
  printf("%s (%d):", tag, n);
  for (int i = 0; i < n; i++) { if (i && i%32==0) printf("\n      "); printf(" %02x", d[i]); }
  printf("\n");
  // ascii line for readability
  printf("  ascii:");
  for (int i = 0; i < n; i++) printf("%c", (d[i]>=32&&d[i]<127)?d[i]:'.');
  printf("\n");
}

int main(int argc, char **argv) {
  libusb_context *ctx = NULL;
  if (libusb_init(&ctx)) { printf("init failed\n"); return 1; }
  libusb_device_handle *h = libusb_open_device_with_vid_pid(ctx, VID, PID);
  if (!h) { printf("device not open (quit NSM?)\n"); return 2; }
  libusb_set_auto_detach_kernel_driver(h, 1);
  int r = libusb_claim_interface(h, 0);
  if (r) { printf("claim failed: %s\n", libusb_error_name(r)); return 3; }
  printf("claimed interface 0\n");

  for (int a = 1; a < argc; a++) {
    uint32_t msgId = 0, pl[16]; int npl = 0;
    char *colon = strchr(argv[a], ':');
    msgId = (uint32_t)strtoul(argv[a], NULL, 16);
    if (colon) {
      char *t = strtok(colon + 1, ",");
      while (t && npl < 16) { pl[npl++] = (uint32_t)strtoul(t, NULL, 16); t = strtok(NULL, ","); }
    }
    uint8_t msg[128], rep[4096]; int n = build(msg, msgId, pl, npl), sent = 0, got = 0;
    printf("\n==== msgId 0x%02x  payload[%d]", msgId, npl);
    for (int i=0;i<npl;i++) printf(" %u", pl[i]);
    printf(" ====\n");
    dump("  TX", msg, n);
    r = libusb_bulk_transfer(h, EP_OUT, msg, n, &sent, 2000);
    if (r) { printf("  OUT err %s\n", libusb_error_name(r)); continue; }
    r = libusb_bulk_transfer(h, EP_IN, rep, sizeof(rep), &got, 3000);
    if (r) { printf("  IN err %s\n", libusb_error_name(r)); continue; }
    dump("  RX", rep, got);
    if (got >= 16)
      printf("  hdr: len=%u proto=%u ver=%u msgId=0x%02x\n",
             (rep[0]<<24)|(rep[1]<<16)|(rep[2]<<8)|rep[3],
             (rep[4]<<24)|(rep[5]<<16)|(rep[6]<<8)|rep[7],
             (rep[8]<<24)|(rep[9]<<16)|(rep[10]<<8)|rep[11],
             (rep[12]<<24)|(rep[13]<<16)|(rep[14]<<8)|rep[15]);
  }
  libusb_release_interface(h, 0);
  libusb_close(h);
  libusb_exit(ctx);
  return 0;
}
