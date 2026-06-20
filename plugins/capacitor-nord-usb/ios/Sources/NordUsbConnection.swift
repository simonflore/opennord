// UNVALIDATED — needs com.apple.developer.driverkit entitlement + M1+ iPad + Nord
// Stage 4 to sign/run/validate (docs/IPAD.md).
import Foundation
import IOKit

/// Talks to the NordUsbDriver DEXT via an IOKit user client. The DEXT matches the
/// Nord vendor interface (VID 0x0FFC / PID 0x002E); these external-method selectors
/// mirror its IOUserClient dispatch table.
enum NordUserClientMethod: UInt32 {
  case open = 0
  case bulkOut = 1
  case bulkIn = 2
  case close = 3
}

final class NordUsbConnection {
  private var connection: io_connect_t = 0

  /// Find the DEXT service and open a user-client connection.
  func open() throws {
    let matching = IOServiceMatching("NordUsbDriver")
    let service = IOServiceGetMatchingService(kIOMainPortDefault, matching)
    guard service != IO_OBJECT_NULL else { throw NordUsbError.deviceNotFound }
    defer { IOObjectRelease(service) }

    let kr = IOServiceOpen(service, mach_task_self_, 0, &connection)
    guard kr == kIOReturnSuccess else { throw NordUsbError.openFailed(kr) }

    try call(.open, input: Data())
  }

  /// Write a request frame to bulk OUT.
  func bulkOut(_ data: Data) throws {
    try call(.bulkOut, input: data)
  }

  /// Read up to maxLength bytes from bulk IN.
  func bulkIn(maxLength: Int) throws -> Data {
    var output = Data(count: maxLength)
    var outSize = output.count
    let kr = output.withUnsafeMutableBytes { outPtr -> kern_return_t in
      var len = UInt64(maxLength)
      return withUnsafePointer(to: &len) { lenPtr in
        IOConnectCallMethod(
          connection, NordUserClientMethod.bulkIn.rawValue,
          UnsafePointer<UInt64>(lenPtr), 1, nil, 0,
          nil, nil, outPtr.baseAddress, &outSize)
      }
    }
    guard kr == kIOReturnSuccess else { throw NordUsbError.ioFailed(kr) }
    return output.prefix(outSize)
  }

  func close() {
    if connection != 0 {
      _ = try? call(.close, input: Data())
      IOServiceClose(connection)
      connection = 0
    }
  }

  var isAvailable: Bool {
    let matching = IOServiceMatching("NordUsbDriver")
    let service = IOServiceGetMatchingService(kIOMainPortDefault, matching)
    defer { if service != IO_OBJECT_NULL { IOObjectRelease(service) } }
    return service != IO_OBJECT_NULL
  }

  private func call(_ method: NordUserClientMethod, input: Data) throws {
    let kr = input.withUnsafeBytes { inPtr in
      IOConnectCallMethod(
        connection, method.rawValue, nil, 0,
        inPtr.baseAddress, input.count, nil, nil, nil, nil)
    }
    guard kr == kIOReturnSuccess else { throw NordUsbError.ioFailed(kr) }
  }
}

enum NordUsbError: Error {
  case deviceNotFound
  case openFailed(kern_return_t)
  case ioFailed(kern_return_t)
}
