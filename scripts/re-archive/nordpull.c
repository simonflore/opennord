// READ-ONLY: dump the Settings partition + enumerate the full Program corpus.
// No writes. Saves Settings blobs + first few program bodies to /tmp for analysis.
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <libusb-1.0/libusb.h>
#define VID 0x0ffc
#define PID 0x002e
#define PART_PROGRAM 6
#define PART_SETTINGS 11

static uint16_t crc16(const uint8_t*d,int n){uint16_t c=0xFFFF;for(int i=0;i<n;i++){c^=(uint16_t)d[i]<<8;for(int b=0;b<8;b++)c=(c&0x8000)?(uint16_t)((c<<1)^0x1021):(uint16_t)(c<<1);}return c;}
static void p32(uint8_t**p,uint32_t v){(*p)[0]=v>>24;(*p)[1]=v>>16;(*p)[2]=v>>8;(*p)[3]=v;*p+=4;}
static uint32_t g32(const uint8_t*d,int o){return (d[o]<<24)|(d[o+1]<<16)|(d[o+2]<<8)|d[o+3];}

static int xfer(libusb_device_handle*h,uint8_t*m,int bl,uint8_t*r,int cap){
  uint16_t c=crc16(m,bl);m[bl]=c>>8;m[bl+1]=c&0xff;int s=0,g=0;
  if(libusb_bulk_transfer(h,0x03,m,bl+2,&s,3000))return -1;
  if(libusb_bulk_transfer(h,0x82,r,cap,&g,5000))return -1;
  return g;
}
static void mk(uint8_t*m,uint8_t**p,uint32_t msgid){*p=m;p32(p,0);p32(p,0x0C);p32(p,0x0A);p32(p,msgid);}
static void fix(uint8_t*m,uint8_t*p){int b=(int)(p-m);m[0]=(b+2)>>24;m[1]=(b+2)>>16;m[2]=(b+2)>>8;m[3]=(b+2);}

static int begin(libusb_device_handle*h,uint32_t part){uint8_t m[64],r[256],*p;mk(m,&p,0x04);p32(&p,part);fix(m,p);int g=xfer(h,m,(int)(p-m),r,256);return g>=20?(int)g32(r,16):-1;}
static void end(libusb_device_handle*h){uint8_t m[64],r[256],*p;mk(m,&p,0x06);fix(m,p);xfer(h,m,(int)(p-m),r,256);}

int main(void){
  libusb_context*c=0;libusb_init(&c);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(c,VID,PID);
  if(!h){printf("no device (quit NSM)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  uint8_t m[64],r[8192],*p; char nm[64];

  // ---- PARTITION LIST (raw ascii; index = order of names) ----
  printf("==== PARTITION LIST (ascii) ====\n  ");
  mk(m,&p,0x00);fix(m,p);
  int pg=xfer(h,m,(int)(p-m),r,sizeof(r));
  for(int k=20;k<pg;k++)printf("%c",(r[k]>=32&&r[k]<127)?r[k]:'.');
  printf("\n");

  // ---- SETTINGS partition ----
  printf("==== SETTINGS (partition %d) ====\n", PART_SETTINGS);
  begin(h,PART_SETTINGS);
  for(int i=0;i<8;i++){
    mk(m,&p,0x1e);p32(&p,PART_SETTINGS);p32(&p,i);fix(m,p);
    int g=xfer(h,m,(int)(p-m),r,sizeof(r)); if(g<20)break;
    uint32_t st=g32(r,16); if(st!=0){printf("  [%d] empty/none (status %u)\n",i,st);continue;}
    uint32_t size=g32(r,28),type=g32(r,32); int nlen=g32(r,48);
    if(nlen<0||nlen>40)nlen=0; memcpy(nm,r+52,nlen);nm[nlen]=0;
    printf("  [%d] type=%c%c%c%c size=%u name='%s'\n",i,(type>>24)&0xff,(type>>16)&0xff,(type>>8)&0xff,type&0xff,size,nm);
    // read it
    mk(m,&p,0x0c);p32(&p,PART_SETTINGS);p32(&p,i);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));
    mk(m,&p,0x12);p32(&p,PART_SETTINGS);p32(&p,i);p32(&p,0);p32(&p,size>2048?2048:size);fix(m,p);
    g=xfer(h,m,(int)(p-m),r,sizeof(r));
    mk(m,&p,0x0e);p32(&p,PART_SETTINGS);p32(&p,i);fix(m,p);uint8_t r2[256];int bl=(int)(p-m);{uint16_t cc=crc16(m,bl);m[bl]=cc>>8;m[bl+1]=cc&0xff;int s=0,gg=0;libusb_bulk_transfer(h,0x03,m,bl+2,&s,2000);libusb_bulk_transfer(h,0x82,r2,256,&gg,2000);}
    if(g>36){ char fn[64];snprintf(fn,64,"/tmp/settings_%d.bin",i);FILE*f=fopen(fn,"wb");if(f){fwrite(r+36,1,g-38,f);fclose(f);}
      printf("      saved %d bytes -> %s ; first: ",g-38,fn); for(int k=36;k<g&&k<36+24;k++)printf("%02x ",r[k]); printf("\n      ascii: ");for(int k=36;k<g&&k<36+48;k++)printf("%c",(r[k]>=32&&r[k]<127)?r[k]:'.');printf("\n"); }
  }
  end(h);

  // ---- PROGRAM corpus ----
  printf("\n==== PROGRAM corpus (partition %d) ====\n", PART_PROGRAM);
  begin(h,PART_PROGRAM);
  int count=0,vers[400]={0}; int saved=0;
  for(int i=0;i<512;i++){
    mk(m,&p,0x1e);p32(&p,PART_PROGRAM);p32(&p,i);fix(m,p);
    int g=xfer(h,m,(int)(p-m),r,sizeof(r)); if(g<52)break;
    uint32_t st=g32(r,16); if(st!=0) continue; // empty slot — skip gap, keep scanning
    uint32_t size=g32(r,28),type=g32(r,32),ver=g32(r,36),cat=g32(r,44); int nlen=g32(r,48);
    if(nlen<0||nlen>40)nlen=0; memcpy(nm,r+52,nlen);nm[nlen]=0;
    count++;
    if(count<=999&&count%20==1) printf("  [idx %3d] %-22s v%u.%02u size=%u cat=%u type=%c%c%c%c\n",
      i,nm,ver/100,ver%100,size,cat,(type>>24)&0xff,(type>>16)&0xff,(type>>8)&0xff,type&0xff);
    // save first 5 bodies for decoder validation
    if(0){
      mk(m,&p,0x0c);p32(&p,PART_PROGRAM);p32(&p,i);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));
      mk(m,&p,0x12);p32(&p,PART_PROGRAM);p32(&p,i);p32(&p,0);p32(&p,size);fix(m,p);
      int gg=xfer(h,m,(int)(p-m),r,sizeof(r));
      mk(m,&p,0x0e);p32(&p,PART_PROGRAM);p32(&p,i);fix(m,p);{int bl=(int)(p-m);uint16_t cc=crc16(m,bl);m[bl]=cc>>8;m[bl+1]=cc&0xff;int s=0,x=0;uint8_t rr[256];libusb_bulk_transfer(h,0x03,m,bl+2,&s,2000);libusb_bulk_transfer(h,0x82,rr,256,&x,2000);}
      if(gg>36){char fn[64];snprintf(fn,64,"/tmp/corpus_%d.bin",i);FILE*f=fopen(fn,"wb");if(f){fwrite(r+36,1,(int)size,f);fclose(f);saved++;}}
    }
  }
  end(h);
  printf("\nTOTAL programs enumerated: %d\n", count);
  libusb_release_interface(h,0);libusb_close(h);libusb_exit(c);
  return 0;
}
