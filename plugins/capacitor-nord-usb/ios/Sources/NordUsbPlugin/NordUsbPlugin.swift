// Compiles against the iOS SDK; NOT yet run on hardware — needs an M1+ iPad and
// a Nord to validate (docs/IPAD.md).
import Foundation
import Capacitor

/// Bridges the JS NordTransport seam to the DriverKit DEXT. Bytes cross as base64.
/// USB I/O blocks, so calls run on a background queue.
@objc(NordUsbPlugin)
public class NordUsbPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "NordUsbPlugin"
  public let jsName = "NordUsb"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "bulkOut", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "bulkIn", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
  ]

  private let connection = NordUsbConnection()
  private let queue = DispatchQueue(label: "org.opennord.nordusb")

  @objc func open(_ call: CAPPluginCall) {
    queue.async {
      do {
        try self.connection.open()
        call.resolve(["productId": self.connection.productId])
      } catch { call.reject("Could not open the Nord: \(error)") }
    }
  }

  @objc func bulkOut(_ call: CAPPluginCall) {
    guard let b64 = call.getString("data"), let data = Data(base64Encoded: b64) else {
      call.reject("bulkOut requires base64 `data`"); return
    }
    queue.async {
      do { try self.connection.bulkOut(data); call.resolve() }
      catch { call.reject("USB write failed: \(error)") }
    }
  }

  @objc func bulkIn(_ call: CAPPluginCall) {
    let maxLength = call.getInt("maxLength") ?? 0
    let timeoutMs = call.getInt("timeoutMs") ?? 0
    queue.async {
      do {
        if let data = try self.connection.bulkIn(maxLength: maxLength, timeoutMs: timeoutMs) {
          call.resolve(["data": data.base64EncodedString()])
        } else {
          call.resolve(["data": "", "timedOut": true])
        }
      } catch { call.reject("USB read failed: \(error)") }
    }
  }

  @objc func close(_ call: CAPPluginCall) {
    // A read may be holding the queue; end it first so close isn't stuck behind it.
    connection.cancelPendingRead()
    queue.async { self.connection.close(); call.resolve() }
  }

  @objc func isAvailable(_ call: CAPPluginCall) {
    // Off the I/O queue: this is asked while a read may be in flight.
    DispatchQueue.global(qos: .userInitiated).async {
      call.resolve(["available": self.connection.isAvailable])
    }
  }
}
