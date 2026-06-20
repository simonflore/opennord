// UNVALIDATED — needs com.apple.developer.driverkit entitlement + M1+ iPad + Nord
// Stage 4 to sign/run/validate (docs/IPAD.md).
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
      do { try self.connection.open(); call.resolve() }
      catch { call.reject("Could not open the Nord: \(error)") }
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
    queue.async {
      do {
        let data = try self.connection.bulkIn(maxLength: maxLength)
        call.resolve(["data": data.base64EncodedString()])
      } catch { call.reject("USB read failed: \(error)") }
    }
  }

  @objc func close(_ call: CAPPluginCall) {
    queue.async { self.connection.close(); call.resolve() }
  }

  @objc func isAvailable(_ call: CAPPluginCall) {
    queue.async { call.resolve(["available": self.connection.isAvailable]) }
  }
}
