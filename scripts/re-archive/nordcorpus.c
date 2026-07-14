// READ-ONLY full corpus via the real FileIterate cursor walk.
// iterate{bank, cursor, 0} -> reply {code, bank, slot}: code 0 = file found,
// code 1 = bank done (advance bank, cursor=0xffffffff). Collects all (bank,slot)
// then FileInfo each for the name. No writes.
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
#define PART 6
static uint16_t crc16(const uint8_t*d,int n){uint16_t c=0xFFFF;for(int i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}
static uint32_t g32(const uint8_t*d,int o){return (d[o]<<24)|(d[o+1]<<16)|(d[o+2]<<8)|d[o+3];}
static int xfer(libusb_device_handle*h,uint8_t*m,int bl,uint8_t*r,int cap){uint16_t c=crc16(m,bl);m[bl]=c>>8;m[bl+1]=c&0xff;int s=0,g=0;if(libusb_bulk_transfer(h,0x03,m,bl+2,&s,3000))return -1;if(libusb_bulk_transfer(h,0x82,r,cap,&g,5000))return -1;return g;}
static void mk(uint8_t*m,uint8_t**p,uint32_t id){*p=m;p32(p,0);p32(p,0x0C);p32(p,0x0A);p32(p,id);}
static void fix(uint8_t*m,uint8_t*p){int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}

int main(void){
  libusb_context*c=0;libusb_init(&c);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(c,VID,PID);
  if(!h){printf("no device (quit NSM)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  uint8_t m[64],r[4096],*p;
  static uint16_t fbank[600],fslot[600]; int n=0;

  mk(m,&p,0x04);p32(&p,PART);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r)); // Begin(6)

  uint32_t bank=0,cursor=0xffffffff; int guard=0;
  while(bank<8 && guard++<2000){
    mk(m,&p,0x20);p32(&p,bank);p32(&p,cursor);p32(&p,0);fix(m,p);
    int g=xfer(h,m,(int)(p-m),r,sizeof(r)); if(g<28){printf("short reply, stop\n");break;}
    uint32_t code=g32(r,16),rb=g32(r,20),rs=g32(r,24);
    if(code==0){ if(n<600){fbank[n]=rb;fslot[n]=rs;n++;} cursor=rs; }
    else if(code==1){ bank=rb+1; cursor=0xffffffff; }
    else { printf("code=%u (end) at bank=%u\n",code,bank); break; }
  }
  printf("ITERATE found %d files (guard=%d)\n",n,guard);
  int per[8]={0}; for(int i=0;i<n;i++) if(fbank[i]<8) per[fbank[i]]++;
  printf("per bank:"); const char*L="ABCDEFGH"; for(int b=0;b<8;b++)printf(" %c=%d",L[b],per[b]); printf("\n");

  // phase 2: name each via FileInfo{bank,slot} (session partition)
  char nm[64];
  for(int i=0;i<n && i<40;i++){
    mk(m,&p,0x1e);p32(&p,fbank[i]);p32(&p,fslot[i]);fix(m,p);
    int g=xfer(h,m,(int)(p-m),r,sizeof(r));
    if(g>=52 && g32(r,16)==0){int nl=g32(r,48);if(nl<0||nl>40)nl=0;memcpy(nm,r+52,nl);nm[nl]=0;
      printf("  %c:%02u %s\n",L[fbank[i]],fslot[i]+1,nm);}
    else printf("  %c:%02u (info status %u)\n",L[fbank[i]],fslot[i]+1,g>=20?g32(r,16):999);
  }
  mk(m,&p,0x06);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r)); // End
  libusb_release_interface(h,0);libusb_close(h);libusb_exit(c);return 0;
}
