// Compiles against the iOS SDK; NOT yet run on hardware — needs an M1+ iPad and
// a Nord to validate.
import Foundation
import NordIOKit

/// External-method selectors and argument shapes of the DEXT's user client —
/// mirrors the enum at the top of ios/Dext/NordUsbUserClient.cpp. Change both together.
enum NordUserClientMethod: UInt32 {
  /// out scalars: [productId]
  case open = 0
  /// in struct: the frame
  case bulkOut = 1
  /// in scalars: [maxLength, timeoutMs]; out scalars: [length, timedOut]; out struct: the frame
  case bulkIn = 2
  case close = 3
}

/// Talks to the NordUsbDriver DEXT through an IOKit user client. The DEXT matches
/// the Nord's vendor interface and registers under its class name.
final class NordUsbConnection {
  /// The DEXT's IOUserClass, which is also its registered service name.
  private static let serviceName = "NordUsbDriver"
  /// A read waiting on the Nord is cut into slices this long, so `close()` (or the
  /// keyboard being unplugged) ends it instead of leaving it parked in the driver.
  private static let readSliceMs: UInt64 = 2000

  private var connection: io_connect_t = 0
  private let lock = NSLock()
  private var closing = false

  /// USB product id of the connected Nord, 0 until `open()` or when unknown.
  private(set) var productId = 0

  private static func copyService() -> io_service_t {
    IOServiceGetMatchingService(kIOMainPortDefault, IOServiceNameMatching(serviceName))
  }

  /// True when a Nord is plugged in and the driver is switched on for it.
  var isAvailable: Bool {
    let service = Self.copyService()
    guard service != IO_OBJECT_NULL else { return false }
    IOObjectRelease(service)
    return true
  }

  /// Find the DEXT service and open a user-client connection. No-op when already open.
  func open() throws {
    setClosing(false)
    if connection != 0 { return }

    let service = Self.copyService()
    guard service != IO_OBJECT_NULL else { throw NordUsbError.deviceNotFound }
    defer { IOObjectRelease(service) }

    var opened: io_connect_t = 0
    let kr = IOServiceOpen(service, mach_task_self_, 0, &opened)
    guard kr == KERN_SUCCESS else { throw NordUsbError.openFailed(kr) }
    connection = opened

    var out = [UInt64](repeating: 0, count: 1)
    var outCount: UInt32 = 1
    let callKr = IOConnectCallScalarMethod(connection, NordUserClientMethod.open.rawValue, nil, 0, &out, &outCount)
    guard callKr == KERN_SUCCESS else {
      IOServiceClose(connection)
      connection = 0
      throw NordUsbError.openFailed(callKr)
    }
    productId = outCount >= 1 ? Int(out[0]) : 0
  }

  /// Write a request frame to bulk OUT.
  func bulkOut(_ data: Data) throws {
    guard connection != 0 else { throw NordUsbError.notOpen }
    let kr = data.withUnsafeBytes { bytes in
      IOConnectCallStructMethod(connection, NordUserClientMethod.bulkOut.rawValue, bytes.baseAddress, data.count, nil, nil)
    }
    guard kr == KERN_SUCCESS else { throw NordUsbError.ioFailed(kr) }
  }

  /// Read one reply frame of up to `maxLength` bytes from bulk IN. `timeoutMs` 0
  /// waits until the Nord answers or the connection is closed; otherwise returns
  /// nil once that long has passed with no reply.
  func bulkIn(maxLength: Int, timeoutMs: Int) throws -> Data? {
    guard connection != 0 else { throw NordUsbError.notOpen }
    guard maxLength > 0 else { return Data() }

    let deadline = timeoutMs > 0 ? DispatchTime.now() + .milliseconds(timeoutMs) : nil
    var buffer = Data(count: maxLength)

    while true {
      if isClosing { throw NordUsbError.closed }
      var slice = Self.readSliceMs
      if let deadline {
        let now = DispatchTime.now()
        if now >= deadline { return nil }
        let leftMs = (deadline.uptimeNanoseconds - now.uptimeNanoseconds) / 1_000_000
        slice = min(slice, max(leftMs, 1))
      }

      let input: [UInt64] = [UInt64(maxLength), slice]
      var out = [UInt64](repeating: 0, count: 2)
      var outCount: UInt32 = 2
      var outSize = maxLength
      let kr = buffer.withUnsafeMutableBytes { bytes in
        IOConnectCallMethod(
          connection, NordUserClientMethod.bulkIn.rawValue,
          input, UInt32(input.count), nil, 0,
          &out, &outCount, bytes.baseAddress, &outSize)
      }
      guard kr == KERN_SUCCESS else { throw NordUsbError.ioFailed(kr) }
      guard outCount >= 2 else { throw NordUsbError.ioFailed(kr) }

      let length = min(Int(out[0]), maxLength)
      if length > 0 { return buffer.prefix(length) }
      if out[1] == 0 { return Data() } // a zero-length packet is a reply too
      // timed out with nothing received: next slice
    }
  }

  /// Ends any read still waiting; safe to call from any thread, before `close()`.
  func cancelPendingRead() {
    setClosing(true)
  }

  func close() {
    guard connection != 0 else { return }
    _ = IOConnectCallScalarMethod(connection, NordUserClientMethod.close.rawValue, nil, 0, nil, nil)
    IOServiceClose(connection)
    connection = 0
    productId = 0
  }

  private var isClosing: Bool {
    lock.lock(); defer { lock.unlock() }
    return closing
  }

  private func setClosing(_ value: Bool) {
    lock.lock(); defer { lock.unlock() }
    closing = value
  }
}

enum NordUsbError: Error {
  case deviceNotFound
  case notOpen
  case closed
  case openFailed(kern_return_t)
  case ioFailed(kern_return_t)
}
