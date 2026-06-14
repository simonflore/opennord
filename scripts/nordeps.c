// READ-ONLY: decode a program's sample dependency list.
// CQryFileGetDependency(0x28){bank,slot} -> 0x29 {status,bank,slot,count, entries}
// entry = {u8 found, u32 id0, u32 id1, u32 id2, u32 nameLen, char name[nameLen]}
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
static uint16_t crc16(const uint8_t*d,int n){uint16_t c=0xFFFF;for(int i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}
static uint32_t g32(const uint8_t*d,int o){return (d[o]<<24)|(d[o+1]<<16)|(d[o+2]<<8)|d[o+3];}
static int xfer(libusb_device_handle*h,uint8_t*m,int bl,uint8_t*r,int cap){uint16_t c=crc16(m,bl);m[bl]=c>>8;m[bl+1]=c&0xff;int s=0,g=0;if(libusb_bulk_transfer(h,0x03,m,bl+2,&s,3000))return -1;if(libusb_bulk_transfer(h,0x82,r,cap,&g,5000))return -1;return g;}
static void mk(uint8_t*m,uint8_t**p,uint32_t id){*p=m;p32(p,0);p32(p,0x0C);p32(p,0x0A);p32(p,id);}
static void fix(uint8_t*m,uint8_t*p){int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}

static void deps(libusb_device_handle*h,int bank,int slot){
  uint8_t m[64],r[8192],*p;
  mk(m,&p,0x28);p32(&p,bank);p32(&p,slot);fix(m,p);
  int g=xfer(h,m,(int)(p-m),r,sizeof(r)); if(g<32){printf(" %c:%02d err\n",'A'+bank,slot+1);return;}
  uint32_t count=g32(r,28);
  printf(" %c:%02d  count=%u\n",'A'+bank,slot+1,count);
  int off=32;
  for(uint32_t i=0;i<count && i<8 && off+13<g;i++){
    uint8_t found=r[off]; off+=1;
    uint32_t a=g32(r,off);off+=4; uint32_t b=g32(r,off);off+=4; uint32_t c=g32(r,off);off+=4;
    uint32_t nl=g32(r,off);off+=4; if(nl>0x7f)nl=0x7f;
    char nm[128]; memcpy(nm,r+off,nl); nm[nl]=0; off+=nl;
    printf("    [%u] found=%u  id=%u/%u/%u  name='%s'\n",i,found,a,b,c,nm);
  }
}

int main(void){
  libusb_context*ctx=0;libusb_init(&ctx);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(ctx,VID,PID);
  if(!h){printf("no device (quit NSM)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  uint8_t m[64],r[256],*p;
  mk(m,&p,0x04);p32(&p,6);fix(m,p);xfer(h,m,(int)(p-m),r,256); // Begin(6) Program
  printf("== sample dependencies (Program bank A) ==\n");
  for(int s=0;s<8;s++) deps(h,0,s);
  mk(m,&p,0x06);fix(m,p);xfer(h,m,(int)(p-m),r,256);
  libusb_release_interface(h,0);libusb_close(h);libusb_exit(ctx);return 0;
}
