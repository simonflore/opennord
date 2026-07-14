// Full write round-trip: read an existing program's body off the device, then
// Create+Write it to an empty slot as 'OPENNORD TEST'. Makes a real, visible,
// playable program. Read-back + delete are left to NSM / a follow-up.
// Addressing PINNED: FileCreate/FileWrite use {bank(0-based), entry(raw slot)},
// no partition (Begin sets it). Target C:88 = bank 2, entry 63 (user-confirmed empty).
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
#define EP_OUT 0x03
#define EP_IN 0x82
#define SRC_PART 6
#define SRC_INDEX 0          /* read file index 0 (Synth Orchestra) */
#define DST_BANK 2           /* C (0-based) */
#define DST_ENTRY 63         /* :88 raw slot */

static uint16_t crc16(const uint8_t*d,size_t n){uint16_t c=0xFFFF;for(size_t i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}

static int xfer(libusb_device_handle*h,uint8_t*msg,int bodylen,uint8_t*rep,int repcap,const char*tag){
  uint16_t c=crc16(msg,bodylen); msg[bodylen]=c>>8; msg[bodylen+1]=c&0xff;
  int n=bodylen+2,sent=0,got=0;
  int r=libusb_bulk_transfer(h,EP_OUT,msg,n,&sent,3000);
  if(r){printf("%s OUT err %s\n",tag,libusb_error_name(r));return -1;}
  r=libusb_bulk_transfer(h,EP_IN,rep,repcap,&got,5000);
  if(r){printf("%s IN err %s\n",tag,libusb_error_name(r));return -1;}
  uint32_t st=got>=20?((rep[16]<<24)|(rep[17]<<16)|(rep[18]<<8)|rep[19]):999;
  printf("%s -> reply msgId 0x%02x status=%u (%d bytes)\n",tag,got>=16?rep[15]:0,st,got);
  return got;
}

int main(void){
  libusb_context*ctx=NULL; libusb_init(&ctx);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(ctx,VID,PID);
  if(!h){printf("no device (quit NSM?)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  printf("claimed iface 0\n");
  uint8_t m[1024],rep[4096];
  uint8_t body[2048]; int bodylen=0;

  // Begin(6)
  uint8_t*p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x04);p32(&p,SRC_PART);
  m[3]=(p-m)+2; xfer(h,m,(int)(p-m),rep,sizeof(rep),"Begin(6)");

  // FileOpen(part6, index0) — required before FileRead
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x0C);p32(&p,SRC_PART);p32(&p,SRC_INDEX);
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileOpen(src)");

  // FileRead(part6, index0, offset0, len 0x338=824)
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x12);
  p32(&p,SRC_PART);p32(&p,SRC_INDEX);p32(&p,0);p32(&p,824);
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  int got=xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileRead(src)");
  // data starts at offset 36 (16 proto hdr + 20 read-ack hdr); 824 bytes
  if(got>=36+824){ bodylen=824; memcpy(body,rep+36,bodylen);
    printf("  read body %d bytes, starts: %02x %02x %02x %02x (%c%c%c%c)\n",
      bodylen,body[0],body[1],body[2],body[3],body[0],body[1],body[2],body[3]); }
  else { printf("  unexpected read size %d — aborting before any write\n",got);
    libusb_release_interface(h,0);libusb_close(h);libusb_exit(ctx);return 4; }

  // FileClose(src) — done reading
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x0E);p32(&p,SRC_PART);p32(&p,SRC_INDEX);
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileClose(src)");

  // FileCreate{bank2, entry63, size824, ns4p, 0xffffffff, cat0, "OPENNORD TEST"}
  const char*name="OPENNORD TEST"; int nl=strlen(name);
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x0A);
  p32(&p,DST_BANK);p32(&p,DST_ENTRY);p32(&p,824);p32(&p,0x6e733470);p32(&p,0xffffffff);p32(&p,0);
  p32(&p,nl); for(int i=0;i<nl;i++)*p++=name[i];
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileCreate(C:88)");

  // FileWrite{bank2, entry63, offset0, dataLen824} + body
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x10);
  p32(&p,DST_BANK);p32(&p,DST_ENTRY);p32(&p,0);p32(&p,bodylen);
  for(int i=0;i<bodylen;i++)*p++=body[i];
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileWrite(C:88)");

  // FileClose(dst) — finalize/commit the written file (bank2, entry63)
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x0E);p32(&p,DST_BANK);p32(&p,DST_ENTRY);
  {int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
  xfer(h,m,(int)(p-m),rep,sizeof(rep),"FileClose(C:88)");

  // End
  p=m; p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x06);
  m[3]=(p-m)+2; xfer(h,m,(int)(p-m),rep,sizeof(rep),"End");

  libusb_release_interface(h,0);libusb_close(h);libusb_exit(ctx);
  printf("\nDONE — check NSM Bank C, location 88 for 'OPENNORD TEST'\n");
  return 0;
}
