// READ-ONLY: finish the open items.
//  #1 Settings partition (Begin(11) + iterate walk + read each).
//  #3 Dependency: CQryFileGetDependency (0x28){bank,slot} for a few Program files.
//  #5 Notifications: poll interrupt EP 0x81 around a FileRead.
//  #4 Corpus: read N Program bodies to /tmp/corpus_*.bin for offline decode.
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
static void dump(const uint8_t*r,int g,int max){for(int i=0;i<g&&i<max;i++)printf("%02x ",r[i]);printf("| ");for(int i=0;i<g&&i<max;i++)printf("%c",(r[i]>=32&&r[i]<127)?r[i]:'.');printf("\n");}

int main(void){
  libusb_context*c=0;libusb_init(&c);
  libusb_device_handle*h=libusb_open_device_with_vid_pid(c,VID,PID);
  if(!h){printf("no device (quit NSM)\n");return 2;}
  libusb_set_auto_detach_kernel_driver(h,1);
  if(libusb_claim_interface(h,0)){printf("claim failed\n");return 3;}
  uint8_t m[64],r[8192],*p;

  // ---- #1 SETTINGS (partition 11) ----
  printf("==== #1 SETTINGS (partition 11) ====\n");
  mk(m,&p,0x04);p32(&p,11);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));
  { uint32_t bank=0,cursor=0xffffffff; int guard=0,found=0;
    while(bank<8 && guard++<400){
      mk(m,&p,0x20);p32(&p,bank);p32(&p,cursor);p32(&p,0);fix(m,p);
      int g=xfer(h,m,(int)(p-m),r,sizeof(r)); if(g<28)break;
      uint32_t code=g32(r,16),rb=g32(r,20),rs=g32(r,24);
      if(code==0){ found++; printf(" file bank=%u slot=%u; ",rb,rs); cursor=rs;
        mk(m,&p,0x1e);p32(&p,rb);p32(&p,rs);fix(m,p);int gi=xfer(h,m,(int)(p-m),r,sizeof(r));
        if(gi>=52){uint32_t sz=g32(r,28),ty=g32(r,32);int nl=g32(r,48);char nm[48];if(nl<0||nl>40)nl=0;memcpy(nm,r+52,nl);nm[nl]=0;
          printf("type=%c%c%c%c size=%u name='%s'\n",(ty>>24)&0xff,(ty>>16)&0xff,(ty>>8)&0xff,ty&0xff,sz,nm);}
      } else if(code==1){ bank=rb+1; cursor=0xffffffff; } else break;
    }
    if(!found) printf(" (no files enumerated in Settings)\n");
  }
  mk(m,&p,0x06);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));

  // ---- Program session for #3/#4/#5 ----
  mk(m,&p,0x04);p32(&p,6);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));

  printf("\n==== #3 DEPENDENCY (CQryGetDependency 0x28 {bank,slot}) ====\n");
  for(int s=0;s<4;s++){
    mk(m,&p,0x28);p32(&p,0);p32(&p,s);fix(m,p);   // bank A, slot s
    int g=xfer(h,m,(int)(p-m),r,sizeof(r));
    printf(" A:%02d reply(%d): ",s+1,g); if(g>=16)dump(r,g,40); else printf("(err)\n");
  }

  printf("\n==== #5 NOTIFICATIONS (interrupt 0x81) ====\n");
  { uint8_t ni[64]; int gi=0; int e=libusb_interrupt_transfer(h,0x81,ni,sizeof(ni),&gi,500);
    if(e==0&&gi>0){printf(" got %d bytes: ",gi);dump(ni,gi,32);} else printf(" no async data (e=%s) — notifications are transfer-progress only\n",libusb_error_name(e)); }

  printf("\n==== #4 CORPUS BODIES (read 12, bank A) ====\n");
  int saved=0;
  for(int s=0;s<12;s++){
    mk(m,&p,0x1e);p32(&p,0);p32(&p,s);fix(m,p);int gi=xfer(h,m,(int)(p-m),r,sizeof(r));
    if(gi<52||g32(r,16)!=0)continue; uint32_t sz=g32(r,28);
    mk(m,&p,0x0c);p32(&p,0);p32(&p,s);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r)); // open
    mk(m,&p,0x12);p32(&p,0);p32(&p,s);p32(&p,0);p32(&p,sz);fix(m,p);int g=xfer(h,m,(int)(p-m),r,sizeof(r));
    mk(m,&p,0x0e);p32(&p,0);p32(&p,s);fix(m,p);uint8_t rr[64];{int bl=(int)(p-m);uint16_t cc=crc16(m,bl);m[bl]=cc>>8;m[bl+1]=cc&0xff;int ss=0,xx=0;libusb_bulk_transfer(h,0x03,m,bl+2,&ss,2000);libusb_bulk_transfer(h,0x82,rr,64,&xx,2000);}
    if(g>=36+(int)sz){char fn[64];snprintf(fn,64,"/tmp/corpus_A%02d.bin",s+1);FILE*f=fopen(fn,"wb");if(f){fwrite(r+36,1,sz,f);fclose(f);saved++;}}
  }
  printf(" saved %d bodies to /tmp/corpus_A*.bin\n",saved);
  mk(m,&p,0x06);fix(m,p);xfer(h,m,(int)(p-m),r,sizeof(r));
  libusb_release_interface(h,0);libusb_close(h);libusb_exit(c);return 0;
}
