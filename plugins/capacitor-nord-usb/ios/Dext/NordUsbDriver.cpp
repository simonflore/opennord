// Compiles against the DriverKit SDK; NOT yet run on hardware — needs an M1+ iPad
// and a Nord to validate (docs/IPAD.md). Pipe logic ports scripts/nordusb.c /
// scripts/re-archive/nordpull.c: open the vendor interface, bulk OUT + bulk IN.
#include <os/log.h>
#include <DriverKit/IOLib.h>
#include <DriverKit/IOUserClient.h>
#include <DriverKit/IOBufferMemoryDescriptor.h>
#include <DriverKit/OSCollections.h>
#include <USBDriverKit/USBDriverKit.h>
#include "NordUsbDriver.h"

#define LOG(fmt, ...) os_log(OS_LOG_DEFAULT, "NordUsbDriver: " fmt, ##__VA_ARGS__)

// The Stage 4 layout (docs/PROTOCOL-RE.md), used only when the interface's own
// descriptors name no bulk pair.
#define kFallbackBulkOut 0x03
#define kFallbackBulkIn  0x82

struct NordUsbDriver_IVars {
  IOUSBHostInterface* interface;
  IOUSBHostPipe*      outPipe;
  IOUSBHostPipe*      inPipe;
  uint16_t            productId;
  bool                interfaceOpen;
};

bool NordUsbDriver::init() {
  if (!super::init()) return false;
  ivars = IONewZero(NordUsbDriver_IVars, 1);
  return ivars != nullptr;
}

void NordUsbDriver::free() {
  if (ivars) {
    OSSafeReleaseNULL(ivars->outPipe);
    OSSafeReleaseNULL(ivars->inPipe);
    OSSafeReleaseNULL(ivars->interface);
  }
  IOSafeDeleteNULL(ivars, NordUsbDriver_IVars, 1);
  super::free();
}

/// The interface's first bulk OUT and bulk IN endpoint addresses, from its own
/// descriptors — older Nords don't share the Stage 4's endpoint numbers
/// (mirrors findBulkInterface in src/lib/device/usb-descriptors.ts).
static void FindBulkEndpoints(IOUSBHostInterface* interface, uint8_t* outAddress, uint8_t* inAddress) {
  *outAddress = kFallbackBulkOut;
  *inAddress = kFallbackBulkIn;
  const IOUSBConfigurationDescriptor* config = interface->CopyConfigurationDescriptor();
  if (!config) return;
  const IOUSBInterfaceDescriptor* ifDesc = interface->GetInterfaceDescriptor(config);
  bool haveOut = false, haveIn = false;
  const IOUSBEndpointDescriptor* ep = nullptr;
  while (ifDesc && (ep = IOUSBGetNextEndpointDescriptor(config, ifDesc, (const IOUSBDescriptorHeader*)ep)) != nullptr) {
    if ((ep->bmAttributes & 0x03) != kIOUSBEndpointTypeBulk) continue;
    if (ep->bEndpointAddress & 0x80) {
      if (!haveIn) { *inAddress = ep->bEndpointAddress; haveIn = true; }
    } else if (!haveOut) {
      *outAddress = ep->bEndpointAddress; haveOut = true;
    }
  }
  IOUSBHostFreeDescriptor(config);
}

kern_return_t IMPL(NordUsbDriver, Start) {
  kern_return_t ret = Start(provider, SUPERDISPATCH);
  if (ret != kIOReturnSuccess) return ret;

  ivars->interface = OSDynamicCast(IOUSBHostInterface, provider);
  if (!ivars->interface) return kIOReturnNoDevice;
  ivars->interface->retain();

  ret = ivars->interface->Open(this, 0, nullptr);
  if (ret != kIOReturnSuccess) {
    LOG("could not open the interface: 0x%x", ret);
    return ret;
  }
  ivars->interfaceOpen = true;

  uint8_t outAddress = 0, inAddress = 0;
  FindBulkEndpoints(ivars->interface, &outAddress, &inAddress);
  ret = ivars->interface->CopyPipe(outAddress, &ivars->outPipe);
  if (ret == kIOReturnSuccess) ret = ivars->interface->CopyPipe(inAddress, &ivars->inPipe);
  if (ret != kIOReturnSuccess || !ivars->outPipe || !ivars->inPipe) {
    LOG("no bulk pipes (out 0x%02x, in 0x%02x): 0x%x", outAddress, inAddress, ret);
    return ret != kIOReturnSuccess ? ret : kIOReturnNotFound;
  }

  // Which Nord this is — the app picks the model's partition layout from it.
  IOUSBHostDevice* device = nullptr;
  if (ivars->interface->CopyDevice(&device) == kIOReturnSuccess && device) {
    const IOUSBDeviceDescriptor* desc = device->CopyDeviceDescriptor();
    if (desc) {
      ivars->productId = desc->idProduct; // USB is little-endian, as is every DriverKit target
      IOUSBHostFreeDescriptor(desc);
    }
    OSSafeReleaseNULL(device);
  }

  LOG("started (pid 0x%04x, out 0x%02x, in 0x%02x)", ivars->productId, outAddress, inAddress);
  RegisterService();
  return kIOReturnSuccess;
}

kern_return_t IMPL(NordUsbDriver, Stop) {
  if (ivars->inPipe) ivars->inPipe->Abort(kIOUSBAbortSynchronous, kIOReturnAborted, this);
  if (ivars->outPipe) ivars->outPipe->Abort(kIOUSBAbortSynchronous, kIOReturnAborted, this);
  OSSafeReleaseNULL(ivars->outPipe);
  OSSafeReleaseNULL(ivars->inPipe);
  if (ivars->interface && ivars->interfaceOpen) {
    ivars->interface->Close(this, 0);
    ivars->interfaceOpen = false;
  }
  return Stop(provider, SUPERDISPATCH);
}

kern_return_t IMPL(NordUsbDriver, NewUserClient) {
  IOService* client = nullptr;
  kern_return_t ret = Create(this, "UserClientProperties", &client);
  if (ret != kIOReturnSuccess || !client) {
    LOG("could not create the user client: 0x%x", ret);
    return ret != kIOReturnSuccess ? ret : kIOReturnError;
  }
  *userClient = OSDynamicCast(IOUserClient, client);
  if (!*userClient) {
    client->release();
    return kIOReturnError;
  }
  return kIOReturnSuccess;
}

uint16_t NordUsbDriver::ProductId() {
  return ivars->productId;
}

kern_return_t NordUsbDriver::BulkOut(const uint8_t* data, uint32_t length) {
  if (!ivars->outPipe) return kIOReturnNotOpen;
  if (!data || length == 0) return kIOReturnBadArgument;

  IOBufferMemoryDescriptor* buf = nullptr;
  kern_return_t ret = ivars->interface->CreateIOBuffer(kIOMemoryDirectionOut, length, &buf);
  if (ret != kIOReturnSuccess || !buf) return ret != kIOReturnSuccess ? ret : kIOReturnNoMemory;

  IOAddressSegment range = {};
  ret = buf->GetAddressRange(&range);
  if (ret == kIOReturnSuccess) {
    memcpy(reinterpret_cast<void*>(range.address), data, length);
    ret = buf->SetLength(length);
  }
  if (ret == kIOReturnSuccess) {
    uint32_t transferred = 0;
    ret = ivars->outPipe->IO(buf, length, &transferred, 0);
    if (ret == kIOReturnSuccess && transferred != length) ret = kIOReturnUnderrun;
  }
  OSSafeReleaseNULL(buf);
  return ret;
}

kern_return_t NordUsbDriver::BulkIn(uint8_t* data, uint32_t capacity, uint32_t timeoutMs, uint32_t* transferred) {
  *transferred = 0;
  if (!ivars->inPipe) return kIOReturnNotOpen;
  if (!data || capacity == 0) return kIOReturnBadArgument;

  IOBufferMemoryDescriptor* buf = nullptr;
  kern_return_t ret = ivars->interface->CreateIOBuffer(kIOMemoryDirectionIn, capacity, &buf);
  if (ret != kIOReturnSuccess || !buf) return ret != kIOReturnSuccess ? ret : kIOReturnNoMemory;

  uint32_t got = 0;
  ret = ivars->inPipe->IO(buf, capacity, &got, timeoutMs);
  // A timeout that still delivered bytes is a reply, not a timeout.
  if (ret == kIOReturnTimeout && got > 0) ret = kIOReturnSuccess;
  if (ret == kIOReturnSuccess && got > 0) {
    IOAddressSegment range = {};
    ret = buf->GetAddressRange(&range);
    if (ret == kIOReturnSuccess) {
      if (got > capacity) got = capacity;
      memcpy(data, reinterpret_cast<const void*>(range.address), got);
      *transferred = got;
    }
  }
  OSSafeReleaseNULL(buf);
  return ret;
}
