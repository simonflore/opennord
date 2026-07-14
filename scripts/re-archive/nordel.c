// Delete a program slot: Begin(part) -> FileDelete{bank,entry} -> End.
#include <stdio.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
static uint16_t crc16(const uint8_t*d,int n){uint16_t c=0xFFFF;for(int i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}
static void go(libusb_device_handle*h,uint8_t*m,int bl,const char*t){uint16_t c=crc16(m,bl);m[bl]=c>>8;m[bl+1]=c&0xff;int s=0,g=0;uint8_t r[256];libusb_bulk_transfer(h,0x03,m,bl+2,&s,2000);int e=libusb_bulk_transfer(h,0x82,r,256,&g,3000);uint32_t st=g>=20?((r[16]<<24)|(r[17]<<16)|(r[18]<<8)|r[19]):999;printf("%s -> status=%u%s\n",t,st,e?" (IN err)":"");}
int main(void){libusb_context*c=0;libusb_init(&c);libusb_device_handle*h=libusb_open_device_with_vid_pid(c,VID,PID);if(!h){printf("no device\n");return 2;}libusb_set_auto_detach_kernel_driver(h,1);if(libusb_claim_interface(h,0)){printf("claim failed (quit NSM)\n");return 3;}
 uint8_t m[64];uint8_t*p;
 p=m;p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x04);p32(&p,6);m[3]=(p-m)+2;go(h,m,(int)(p-m),"Begin(6)");
 p=m;p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x14);p32(&p,2);p32(&p,63);{int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}go(h,m,(int)(p-m),"FileDelete C:88");
 p=m;p32(&p,0);p32(&p,0x0C);p32(&p,0x0A);p32(&p,0x06);m[3]=(p-m)+2;go(h,m,(int)(p-m),"End");
 libusb_release_interface(h,0);libusb_close(h);libusb_exit(c);printf("done — refresh NSM, C:88 should be empty\n");return 0;}
