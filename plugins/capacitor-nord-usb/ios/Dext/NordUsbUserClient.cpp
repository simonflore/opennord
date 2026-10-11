// Compiles against the DriverKit SDK; NOT yet run on hardware — needs an M1+ iPad
// and a Nord to validate (docs/IPAD.md).
#include <os/log.h>
#include <DriverKit/IOLib.h>
#include <DriverKit/IOUserClient.h>
#include <DriverKit/IOMemoryDescriptor.h>
#include <DriverKit/IOMemoryMap.h>
#include <DriverKit/OSData.h>
#include "NordUsbDriver.h"
#include "NordUsbUserClient.h"

#define LOG(fmt, ...) os_log(OS_LOG_DEFAULT, "NordUsbUserClient: " fmt, ##__VA_ARGS__)

// Mirrors NordUserClientMethod in ios/Sources/NordUsbConnection.swift.
enum {
  kMethodOpen    = 0, // out scalars: [productId]
  kMethodBulkOut = 1, // in struct: the frame
  kMethodBulkIn  = 2, // in scalars: [maxLength, timeoutMs]; out scalars: [length, timedOut]; out struct: the frame
  kMethodClose   = 3,
};

// One read reply is at most ~64 KiB (docs/PROTOCOL-RE.md, "Read size"); anything
// far past that is a caller bug, not a frame.
#define kMaxTransfer (1024 * 1024)

struct NordUsbUserClient_IVars {
  NordUsbDriver* driver;
};

bool NordUsbUserClient::init() {
  if (!super::init()) return false;
  ivars = IONewZero(NordUsbUserClient_IVars, 1);
  return ivars != nullptr;
}

void NordUsbUserClient::free() {
  if (ivars) OSSafeReleaseNULL(ivars->driver);
  IOSafeDeleteNULL(ivars, NordUsbUserClient_IVars, 1);
  super::free();
}

kern_return_t IMPL(NordUsbUserClient, Start) {
  kern_return_t ret = Start(provider, SUPERDISPATCH);
  if (ret != kIOReturnSuccess) return ret;
  ivars->driver = OSDynamicCast(NordUsbDriver, provider);
  if (!ivars->driver) return kIOReturnBadArgument;
  ivars->driver->retain();
  return kIOReturnSuccess;
}

kern_return_t IMPL(NordUsbUserClient, Stop) {
  OSSafeReleaseNULL(ivars->driver);
  return Stop(provider, SUPERDISPATCH);
}

/// Bulk OUT: the frame arrives inline (≤ 4096 bytes) or as a mapped descriptor.
static kern_return_t HandleBulkOut(NordUsbDriver* driver, IOUserClientMethodArguments* arguments) {
  if (arguments->structureInput) {
    return driver->BulkOut(static_cast<const uint8_t*>(arguments->structureInput->getBytesNoCopy()),
                           static_cast<uint32_t>(arguments->structureInput->getLength()));
  }
  if (!arguments->structureInputDescriptor) return kIOReturnBadArgument;

  IOMemoryMap* map = nullptr;
  kern_return_t ret = arguments->structureInputDescriptor->CreateMapping(0, 0, 0, 0, 0, &map);
  if (ret != kIOReturnSuccess || !map) return ret != kIOReturnSuccess ? ret : kIOReturnNoMemory;
  if (map->GetLength() > kMaxTransfer) ret = kIOReturnBadArgument;
  else ret = driver->BulkOut(reinterpret_cast<const uint8_t*>(map->GetAddress()), static_cast<uint32_t>(map->GetLength()));
  OSSafeReleaseNULL(map);
  return ret;
}

/// Bulk IN: the reply goes back inline or into the caller's mapped buffer; its
/// length and whether the read timed out go back as scalars, so the app never
/// has to infer either from a struct size or a return code.
static kern_return_t HandleBulkIn(NordUsbDriver* driver, IOUserClientMethodArguments* arguments) {
  if (arguments->scalarInputCount < 2 || !arguments->scalarOutput || arguments->scalarOutputCount < 2) {
    return kIOReturnBadArgument;
  }
  const uint64_t maxLength = arguments->scalarInput[0];
  const uint32_t timeoutMs = static_cast<uint32_t>(arguments->scalarInput[1]);
  if (maxLength == 0 || maxLength > kMaxTransfer) return kIOReturnBadArgument;

  IOMemoryMap* map = nullptr;
  uint8_t* target = nullptr;
  uint32_t capacity = static_cast<uint32_t>(maxLength);
  uint8_t* scratch = nullptr;

  if (arguments->structureOutputDescriptor) {
    kern_return_t ret = arguments->structureOutputDescriptor->CreateMapping(0, 0, 0, 0, 0, &map);
    if (ret != kIOReturnSuccess || !map) return ret != kIOReturnSuccess ? ret : kIOReturnNoMemory;
    target = reinterpret_cast<uint8_t*>(map->GetAddress());
    if (map->GetLength() < capacity) capacity = static_cast<uint32_t>(map->GetLength());
  } else {
    if (arguments->structureOutputMaximumSize < capacity) capacity = static_cast<uint32_t>(arguments->structureOutputMaximumSize);
    if (capacity == 0) return kIOReturnBadArgument;
    scratch = IONewZero(uint8_t, capacity);
    if (!scratch) return kIOReturnNoMemory;
    target = scratch;
  }

  uint32_t transferred = 0;
  kern_return_t ret = driver->BulkIn(target, capacity, timeoutMs, &transferred);
  const bool timedOut = ret == kIOReturnTimeout;
  if (timedOut) ret = kIOReturnSuccess;

  if (ret == kIOReturnSuccess) {
    if (scratch) {
      arguments->structureOutput = OSData::withBytes(scratch, transferred);
      if (!arguments->structureOutput) ret = kIOReturnNoMemory;
    }
    arguments->scalarOutput[0] = transferred;
    arguments->scalarOutput[1] = timedOut ? 1 : 0;
    arguments->scalarOutputCount = 2;
  }

  if (scratch) IOSafeDeleteNULL(scratch, uint8_t, capacity);
  OSSafeReleaseNULL(map);
  return ret;
}

kern_return_t NordUsbUserClient::ExternalMethod(uint64_t selector,
                                                IOUserClientMethodArguments* arguments,
                                                const IOUserClientMethodDispatch* dispatch,
                                                OSObject* target,
                                                void* reference) {
  if (!ivars->driver || !arguments) return kIOReturnNotReady;

  switch (selector) {
    case kMethodOpen:
      if (!arguments->scalarOutput || arguments->scalarOutputCount < 1) return kIOReturnBadArgument;
      arguments->scalarOutput[0] = ivars->driver->ProductId();
      arguments->scalarOutputCount = 1;
      return kIOReturnSuccess;
    case kMethodBulkOut:
      return HandleBulkOut(ivars->driver, arguments);
    case kMethodBulkIn:
      return HandleBulkIn(ivars->driver, arguments);
    case kMethodClose:
      return kIOReturnSuccess;
    default:
      return kIOReturnUnsupported;
  }
}
