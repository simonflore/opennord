// Gated FileCreate test: make an empty named program entry at a target slot.
// Begin(partition) -> FileCreate{bank, entry, size, fileType, 0xffffffff, category, name}
// -> read ACK -> End. Prints every reply. Does NOT write file data.
// Target chosen by the user as empty; create should error (not overwrite) if the
// slot is occupied. Build like nordprobe.
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
#define EP_OUT 0x03
#define EP_IN 0x82

static uint16_t crc16(const uint8_t*d,size_t n){uint16_t c=0xFFFF;for(size_t i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}

static int sendmsg(libusb_device_handle*h,uint8_t*msg,int bodylen,const char*tag){
  uint16_t c=crc16(msg,bodylen); msg[bodylen]=c>>8; msg[bodylen+1]=c&0xff;
  int n=bodylen+2,sent=0,got=0; uint8_t rep[2048];
  printf("\n%s TX(%d):",tag,n); for(int i=0;i<n;i++)printf(" %02x",msg[i]); printf("\n");
  int r=libusb_bulk_transfer(h,EP_OUT,msg,n,&sent,2000);
  if(r){printf("  OUT err %s\n",libusb_error_name(r));return -1;}
  r=libusb_bulk_transfer(h,EP_IN,rep,sizeof(rep),&got,3000);
  if(r){printf("  IN err %s\n",libusb_error_name(r));return -1;}
  printf("  RX(%d):",got); for(int i=0;i<got&&i<48;i++)printf(" %02x",rep[i]);
  printf("\n  ascii:"); for(int i=0;i<got;i++)printf("%c",(rep[i]>=32&&rep[i]<127)?rep[i]:'.');
  printf("\n  status=%u\n", got>=20?((rep[16]<<24)|(rep[17]<<16)|(rep[18]<<8)|rep[19]):999);
  return 0;
}

int main(void){
  libusb_context*ctx=NULL; libusb_init(&ctx);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(ctx,VID,PID);
  if(!h){printf("no device (quit NSM?)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  printf("claimed iface 0\n");
  uint8_t m[256]; uint8_t*p;

  // Begin(partition 6)
  p=m; p32(&p,0); p32(&p,0x0C); p32(&p,0x0A); p32(&p,0x04); p32(&p,6);
  { uint32_t tot=(p-m)+2; m[3]=tot; } // fix length (small)
  sendmsg(h,m,(int)(p-m),"Begin(6)");

  // FileCreate {bank=2(C), entry=63(slot88), size=824, type=ns4p, 0xffffffff, category=0} + name
  const char*name="OPENNORD TEST"; int nl=(int)strlen(name);
  p=m; p32(&p,0); p32(&p,0x0C); p32(&p,0x0A); p32(&p,0x0A); // hdr (len fixed later)
  p32(&p,2); p32(&p,63); p32(&p,824); p32(&p,0x6e733470); p32(&p,0xffffffff); p32(&p,0);
  p32(&p,(uint32_t)nl); for(int i=0;i<nl;i++)*p++=name[i];
  { int body=(int)(p-m); m[0]=(body+2)>>24;m[1]=(body+2)>>16;m[2]=(body+2)>>8;m[3]=(body+2); }
  sendmsg(h,m,(int)(p-m),"FileCreate C:88");

  // End
  p=m; p32(&p,0); p32(&p,0x0C); p32(&p,0x0A); p32(&p,0x06);
  { uint32_t tot=(p-m)+2; m[3]=tot; }
  sendmsg(h,m,(int)(p-m),"End");

  libusb_release_interface(h,0); libusb_close(h); libusb_exit(ctx);
  return 0;
}
