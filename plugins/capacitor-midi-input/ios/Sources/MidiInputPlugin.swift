// UNVALIDATED — written without an Xcode build: needs the generated ios/ target
// built in Xcode and an iPad with a USB / Bluetooth MIDI keyboard to validate
// (docs/IPAD.md, "MIDI input").
import Foundation
import UIKit
import CoreMIDI
import CoreAudioKit
import Capacitor

/// MIDI keyboard input on iPad via CoreMIDI.
///
/// - One MIDI client + one input port for the app's lifetime, created on the
///   main thread so CoreMIDI delivers setup notifications on the main run loop.
/// - `start()` connects every source; a notification (setup changed / object
///   added / removed / property changed) triggers a coalesced rescan that
///   connects new sources, drops gone ones and emits `sourcesChanged`.
/// - Input: iOS 14+ `MIDIInputPortCreateWithProtocol(._1_0)` delivers a
///   MIDIEventList of UMP words; if that port cannot be created we fall back to
///   the legacy MIDIPacketList port and forward raw MIDI 1.0 bytes. Either way
///   the read block only COPIES the data (the list is valid only during the
///   callback) and hops to main; splitting into messages (multi-message
///   packets, running status, SysEx across packets, UMP → MIDI 1.0) happens in
///   TypeScript (src/lib/midi/ump.ts + midi-stream.ts), where it is unit-tested.
/// - Each connection's refCon is a never-reused integer, so a packet that
///   arrives after its source was unplugged resolves to nothing and is dropped.
@objc(MidiInputPlugin)
public class MidiInputPlugin: CAPPlugin, CAPBridgedPlugin, UIAdaptivePresentationControllerDelegate {
  public let identifier = "MidiInputPlugin"
  public let jsName = "MidiInput"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "listSources", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "showBluetoothPairing", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
  ]

  private struct SourceInfo: Equatable {
    let id: String
    let name: String
    let transport: String
    var json: [String: String] { ["id": id, "name": name, "transport": transport] }
  }

  private struct Connection {
    let endpoint: MIDIEndpointRef
    var info: SourceInfo
  }

  // Main-thread state.
  private var client = MIDIClientRef()
  private var port = MIDIPortRef()
  private var listening = false
  private var connections: [Int: Connection] = [:]
  private var nextRefCon = 1
  private var rescanPending = false
  private var pairingCall: CAPPluginCall?
  private var networkSessionObserver: NSObjectProtocol?

  // MARK: - Plugin methods (Capacitor calls these off-main; hop to main)

  @objc func start(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      let status = self.ensureClientAndPort()
      guard status == noErr else {
        call.reject("MIDI input could not start (CoreMIDI status \(status)).", "UNAVAILABLE")
        return
      }
      self.listening = true
      self.syncConnections()
      call.resolve(["sources": self.connectedSourceList()])
    }
  }

  @objc func stop(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      self.listening = false
      for (_, c) in self.connections { MIDIPortDisconnectSource(self.port, c.endpoint) }
      self.connections.removeAll()
      call.resolve()
    }
  }

  @objc func listSources(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      call.resolve(["sources": MidiInputPlugin.presentSources().map { $0.1.json }])
    }
  }

  @objc func isAvailable(_ call: CAPPluginCall) {
    // CoreMIDI and CABTMIDICentralViewController exist on every supported iPad.
    call.resolve(["available": true, "bluetooth": true])
  }

  @objc func showBluetoothPairing(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      guard let presenter = self.bridge?.viewController else {
        call.reject("No screen to show the Bluetooth pairing sheet on.", "UNAVAILABLE")
        return
      }
      if self.pairingCall != nil {
        call.reject("The Bluetooth pairing sheet is already open.")
        return
      }
      let central = CABTMIDICentralViewController()
      central.navigationItem.rightBarButtonItem = UIBarButtonItem(
        barButtonSystemItem: .done, target: self, action: #selector(self.pairingDoneTapped))
      let nav = UINavigationController(rootViewController: central)
      nav.modalPresentationStyle = .formSheet
      nav.presentationController?.delegate = self
      self.pairingCall = call // held until the sheet closes
      presenter.present(nav, animated: true)
    }
  }

  @objc private func pairingDoneTapped() {
    bridge?.viewController?.dismiss(animated: true) { [weak self] in self?.finishPairing() }
  }

  /// Swipe-to-dismiss of the form sheet.
  public func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    finishPairing()
  }

  private func finishPairing() {
    pairingCall?.resolve()
    pairingCall = nil
    scheduleRescan() // a freshly paired keyboard may already be a source
  }

  // MARK: - CoreMIDI setup (main thread)

  private func ensureClientAndPort() -> OSStatus {
    if client == 0 {
      let status = MIDIClientCreateWithBlock("OpenNord" as CFString, &client) { [weak self] notification in
        switch notification.pointee.messageID {
        case .msgSetupChanged, .msgObjectAdded, .msgObjectRemoved, .msgPropertyChanged:
          DispatchQueue.main.async { self?.scheduleRescan() }
        default:
          break
        }
      }
      guard status == noErr else { client = 0; return status }
    }
    if networkSessionObserver == nil {
      // A network session gaining/losing its first connection doesn't always
      // arrive as a CoreMIDI notification, so the "Network Session" source
      // would stay hidden (or stay listed) — rescan on the session's own change.
      networkSessionObserver = NotificationCenter.default.addObserver(
        forName: NSNotification.Name(rawValue: MIDINetworkNotificationSessionDidChange),
        object: nil, queue: .main
      ) { [weak self] _ in self?.scheduleRescan() }
    }
    if port == 0 {
      let name = "OpenNord Keyboard Input" as CFString
      // Preferred: UMP event lists, MIDI 1.0 protocol (iOS 14+).
      var status = MIDIInputPortCreateWithProtocol(client, name, ._1_0, &port) { [weak self] list, refCon in
        let words = MidiInputPlugin.copyWords(list)
        guard !words.isEmpty else { return }
        let ref = Int(bitPattern: refCon)
        DispatchQueue.main.async { self?.emit(refCon: ref, payload: ["ump": words]) }
      }
      if status != noErr {
        port = 0
        // Fallback: legacy packet lists (raw MIDI 1.0 bytes).
        status = MIDIInputPortCreateWithBlock(client, name, &port) { [weak self] list, refCon in
          let bytes = MidiInputPlugin.copyBytes(list)
          guard !bytes.isEmpty else { return }
          let ref = Int(bitPattern: refCon)
          DispatchQueue.main.async { self?.emit(refCon: ref, payload: ["bytes": bytes]) }
        }
      }
      guard status == noErr else { port = 0; return status }
    }
    return noErr
  }

  private func emit(refCon: Int, payload: [String: Any]) {
    guard listening, let connection = connections[refCon] else { return }
    var data = payload
    data["sourceId"] = connection.info.id
    notifyListeners("midiInput", data: data)
  }

  // MARK: - Hot-plug (main thread)

  private func scheduleRescan() {
    guard !rescanPending else { return }
    rescanPending = true
    // Coalesce the burst of notifications one plug/unplug produces.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
      guard let self = self else { return }
      self.rescanPending = false
      guard self.listening else { return }
      let before = self.connectedSourceList()
      self.syncConnections()
      let after = self.connectedSourceList()
      if before != after { self.notifyListeners("sourcesChanged", data: ["sources": after]) }
    }
  }

  /// Connect sources that appeared, drop ones that went away, refresh names.
  private func syncConnections() {
    let present = MidiInputPlugin.presentSources()
    var presentById: [String: (MIDIEndpointRef, SourceInfo)] = [:]
    for entry in present { presentById[entry.1.id] = entry }

    for (ref, c) in connections {
      if let entry = presentById[c.info.id], entry.0 == c.endpoint {
        connections[ref]?.info = entry.1
      } else {
        MIDIPortDisconnectSource(port, c.endpoint) // may fail for a vanished endpoint; harmless
        connections.removeValue(forKey: ref)
      }
    }
    let connectedIds = Set(connections.values.map { $0.info.id })
    for (endpoint, info) in present where !connectedIds.contains(info.id) {
      let ref = nextRefCon
      nextRefCon += 1
      if MIDIPortConnectSource(port, endpoint, UnsafeMutableRawPointer(bitPattern: ref)) == noErr {
        connections[ref] = Connection(endpoint: endpoint, info: info)
      }
    }
  }

  private func connectedSourceList() -> [[String: String]] {
    connections.keys.sorted().compactMap { connections[$0]?.info.json }
  }

  /// Every source a player would call a keyboard. iOS always publishes the
  /// network driver's "Network Session 1" source, even with nothing on the
  /// network — listing it would read "Playing from: Network Session 1" with no
  /// keyboard plugged in, and an unplug would never reach "no keyboard". So
  /// network-driver sources count only while the network session has a peer.
  private static func presentSources() -> [(MIDIEndpointRef, SourceInfo)] {
    var result: [(MIDIEndpointRef, SourceInfo)] = []
    let network = MIDINetworkSession.default()
    let networkHasPeers = !network.connections().isEmpty
    let networkSessionSource = network.sourceEndpoint() // "Network Session 1"
    for i in 0..<MIDIGetNumberOfSources() {
      let endpoint = MIDIGetSource(i)
      if endpoint == 0 { continue }
      var offline: Int32 = 0
      if MIDIObjectGetIntegerProperty(endpoint, kMIDIPropertyOffline, &offline) == noErr, offline != 0 {
        continue
      }
      var uniqueID: MIDIUniqueID = 0
      MIDIObjectGetIntegerProperty(endpoint, kMIDIPropertyUniqueID, &uniqueID)
      // Match the session's own source too, in case its driver owner reads oddly.
      let kind = endpoint == networkSessionSource ? "network" : transport(of: endpoint)
      if kind == "network" && !networkHasPeers { continue }
      let name = stringProperty(endpoint, kMIDIPropertyDisplayName)
        ?? stringProperty(endpoint, kMIDIPropertyName)
        ?? "MIDI keyboard"
      result.append((endpoint, SourceInfo(id: String(uniqueID), name: name, transport: kind)))
    }
    return result
  }

  private static func stringProperty(_ object: MIDIObjectRef, _ property: CFString) -> String? {
    var value: Unmanaged<CFString>?
    guard MIDIObjectGetStringProperty(object, property, &value) == noErr, let s = value else { return nil }
    return s.takeRetainedValue() as String
  }

  /// Best effort, from the owning driver: "com.apple.AppleMIDIUSBDriver",
  /// "com.apple.AppleMIDIBluetoothDriver", "com.apple.AppleMIDIRTPDriver".
  /// A source with no entity is a virtual source published by another app.
  private static func transport(of endpoint: MIDIEndpointRef) -> String {
    var entity = MIDIEntityRef()
    guard MIDIEndpointGetEntity(endpoint, &entity) == noErr, entity != 0 else { return "virtual" }
    var device = MIDIDeviceRef()
    guard MIDIEntityGetDevice(entity, &device) == noErr, device != 0 else { return "unknown" }
    let owner = (stringProperty(device, kMIDIPropertyDriverOwner) ?? "").lowercased()
    if owner.contains("bluetooth") || owner.contains("btle") { return "bluetooth" }
    if owner.contains("usb") { return "usb" }
    if owner.contains("rtp") || owner.contains("network") { return "network" }
    return "unknown"
  }

  // MARK: - Packet copying (CoreMIDI read thread; must not touch plugin state)

  /// Every UMP word of every packet in the list, in order (as Int for the JS bridge).
  private static func copyWords(_ list: UnsafePointer<MIDIEventList>) -> [Int] {
    let count = Int(list.pointee.numPackets)
    guard count > 0,
          let packetOffset = MemoryLayout<MIDIEventList>.offset(of: \MIDIEventList.packet),
          let wordsOffset = MemoryLayout<MIDIEventPacket>.offset(of: \MIDIEventPacket.words)
    else { return [] }
    var out: [Int] = []
    var packet = UnsafeRawPointer(list).advanced(by: packetOffset).assumingMemoryBound(to: MIDIEventPacket.self)
    for index in 0..<count {
      let wordCount = min(Int(packet.pointee.wordCount), 64)
      let words = UnsafeRawPointer(packet).advanced(by: wordsOffset).assumingMemoryBound(to: UInt32.self)
      for k in 0..<wordCount { out.append(Int(words[k])) }
      if index < count - 1 { packet = UnsafePointer(MIDIEventPacketNext(packet)) }
    }
    return out
  }

  /// Every byte of every packet in the list, in order. A packet may hold several
  /// messages, running status, or a SysEx fragment longer than the 256-byte
  /// `data` tuple — so read `length` bytes through the pointer, never the tuple.
  private static func copyBytes(_ list: UnsafePointer<MIDIPacketList>) -> [Int] {
    let count = Int(list.pointee.numPackets)
    guard count > 0,
          let packetOffset = MemoryLayout<MIDIPacketList>.offset(of: \MIDIPacketList.packet),
          let dataOffset = MemoryLayout<MIDIPacket>.offset(of: \MIDIPacket.data)
    else { return [] }
    var out: [Int] = []
    var packet = UnsafeRawPointer(list).advanced(by: packetOffset).assumingMemoryBound(to: MIDIPacket.self)
    for index in 0..<count {
      let length = Int(packet.pointee.length)
      let bytes = UnsafeRawPointer(packet).advanced(by: dataOffset).assumingMemoryBound(to: UInt8.self)
      for k in 0..<length { out.append(Int(bytes[k])) }
      if index < count - 1 { packet = UnsafePointer(MIDIPacketNext(packet)) }
    }
    return out
  }
}
