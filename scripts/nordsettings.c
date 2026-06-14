// READ-ONLY: read the 80-byte device Settings file (partition 11, bank 0, slot 0).
#include <stdio.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
static uint16_t crc16(const uint8_t*d,int n){uint16_t c=0xFFFF;for(int i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}
static int xf(libusb_device_handle*h,uint8_t*m,int bl,uint8_t*r,int cap){uint16_t c=crc16(m,bl);m[bl]=c>>8;m[bl+1]=c&0xff;int s=0,g=0;if(libusb_bulk_transfer(h,0x03,m,bl+2,&s,3000))return -1;if(libusb_bulk_transfer(h,0x82,r,cap,&g,5000))return -1;return g;}
static void mk(uint8_t*m,uint8_t**p,uint32_t id){*p=m;p32(p,0);p32(p,0x0C);p32(p,0x0A);p32(p,id);}
static void fix(uint8_t*m,uint8_t*p){int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}
int main(void){
  libusb_context*c=0;libusb_init(&c);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(c,VID,PID);
  if(!h){printf("no device (quit NSM)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  uint8_t m[64],r[4096],*p;
  mk(m,&p,0x04);p32(&p,11);fix(m,p);xf(h,m,(int)(p-m),r,sizeof(r));         // Begin(11)
  mk(m,&p,0x0c);p32(&p,0);p32(&p,0);fix(m,p);xf(h,m,(int)(p-m),r,sizeof(r)); // FileOpen{0,0}
  mk(m,&p,0x12);p32(&p,0);p32(&p,0);p32(&p,0);p32(&p,80);fix(m,p);int g=xf(h,m,(int)(p-m),r,sizeof(r)); // FileRead 80
  mk(m,&p,0x0e);p32(&p,0);p32(&p,0);fix(m,p);uint8_t rr[64];{int bl=(int)(p-m);uint16_t cc=crc16(m,bl);m[bl]=cc>>8;m[bl+1]=cc&0xff;int s=0,x=0;libusb_bulk_transfer(h,0x03,m,bl+2,&s,2000);libusb_bulk_transfer(h,0x82,rr,64,&x,2000);}
  mk(m,&p,0x06);fix(m,p);xf(h,m,(int)(p-m),r==0?r:r,sizeof(r)); // (End uses fresh buffer below)
  printf("FileRead reply %d bytes; settings body (after 36-byte hdr):\n",g);
  int base=36; FILE*f=fopen("/tmp/settings.bin","wb");
  for(int i=base;i<g && i<base+80;i++){ if((i-base)%16==0)printf("\n %3d:",i-base); printf(" %02x",r[i]); if(f)fputc(r[i],f);}
  printf("\n ascii: "); for(int i=base;i<g&&i<base+80;i++)printf("%c",(r[i]>=32&&r[i]<127)?r[i]:'.');
  printf("\n");
  if(f)fclose(f);
  libusb_release_interface(h,0);libusb_close(h);libusb_exit(c);return 0;
}
