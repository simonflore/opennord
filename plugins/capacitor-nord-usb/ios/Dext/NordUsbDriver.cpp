// UNVALIDATED — needs com.apple.developer.driverkit entitlement + M1+ iPad + Nord
// Stage 4 to sign/run/validate (docs/IPAD.md). Pipe logic ports scripts/nordusb.c
// / scripts/nordpull.c: claim vendor interface 0, bulk OUT 0x03, bulk IN 0x82.
#include <os/log.h>
#include <DriverKit/IOLib.h>
#include <DriverKit/IOUserClient.h>
#include <DriverKit/IOBufferMemoryDescriptor.h>
#include <USBDriverKit/IOUSBHostInterface.h>
#include <USBDriverKit/IOUSBHostPipe.h>
#include "NordUsbDriver.h"

#define kBulkOutAddress 0x03
#define kBulkInAddress  0x82
#define kIOTimeoutMs    5000

struct NordUsbDriver_IVars {
  IOUSBHostInterface* interface;
  IOUSBHostPipe*      outPipe;
  IOUSBHostPipe*      inPipe;
};

bool NordUsbDriver::init() {
  if (!super::init()) return false;
  ivars = IONewZero(NordUsbDriver_IVars, 1);
  return ivars != nullptr;
}

void NordUsbDriver::free() {
  IOSafeDeleteNULL(ivars, NordUsbDriver_IVars, 1);
  super::free();
}

kern_return_t NordUsbDriver::Start(IOService* provider) {
  kern_return_t ret = Start(provider, SUPERDISPATCH);
  if (ret != kIOReturnSuccess) return ret;

  ivars->interface = OSDynamicCast(IOUSBHostInterface, provider);
  if (!ivars->interface) return kIOReturnNoDevice;

  ret = ivars->interface->Open(this, 0, nullptr);
  if (ret != kIOReturnSuccess) return ret;

  // Resolve the bulk pipes by endpoint address.
  ivars->interface->CopyPipe(kBulkOutAddress, &ivars->outPipe);
  ivars->interface->CopyPipe(kBulkInAddress, &ivars->inPipe);
  if (!ivars->outPipe || !ivars->inPipe) return kIOReturnNotFound;

  RegisterService();
  return kIOReturnSuccess;
}

kern_return_t NordUsbDriver::Stop(IOService* provider) {
  if (ivars->outPipe) { OSSafeReleaseNULL(ivars->outPipe); }
  if (ivars->inPipe)  { OSSafeReleaseNULL(ivars->inPipe); }
  if (ivars->interface) { ivars->interface->Close(this, 0); }
  return Stop(provider, SUPERDISPATCH);
}

kern_return_t NordUsbDriver::DoOpen() { return kIOReturnSuccess; }
kern_return_t NordUsbDriver::DoClose() { return kIOReturnSuccess; }

kern_return_t NordUsbDriver::DoBulkOut(const void* data, size_t length) {
  IOBufferMemoryDescriptor* buf = nullptr;
  kern_return_t ret = IOBufferMemoryDescriptor::Create(
      kIOMemoryDirectionOut, length, 0, &buf);
  if (ret != kIOReturnSuccess) return ret;

  uint64_t addr = 0; uint64_t len = 0;
  buf->Map(0, 0, 0, 0, &addr, &len);
  memcpy(reinterpret_cast<void*>(addr), data, length);

  uint32_t transferred = 0;
  ret = ivars->outPipe->IO(buf, (uint32_t)length, &transferred, kIOTimeoutMs);
  OSSafeReleaseNULL(buf);
  return ret;
}

kern_return_t NordUsbDriver::DoBulkIn(void* data, size_t* length) {
  IOBufferMemoryDescriptor* buf = nullptr;
  kern_return_t ret = IOBufferMemoryDescriptor::Create(
      kIOMemoryDirectionIn, *length, 0, &buf);
  if (ret != kIOReturnSuccess) return ret;

  uint32_t transferred = 0;
  ret = ivars->inPipe->IO(buf, (uint32_t)*length, &transferred, kIOTimeoutMs);
  if (ret == kIOReturnSuccess) {
    uint64_t addr = 0; uint64_t len = 0;
    buf->Map(0, 0, 0, 0, &addr, &len);
    memcpy(data, reinterpret_cast<void*>(addr), transferred);
    *length = transferred;
  }
  OSSafeReleaseNULL(buf);
  return ret;
}
