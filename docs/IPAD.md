# iPad — native shell & USB transfer (DriverKit)

OpenNord on iPad is the same React app in a Capacitor shell (Phase A) plus a
native USB runtime (Phase B). This doc is the Phase B blueprint; Phase A (the
responsive split layout, `data-native` shell polish, platform detection, and the
`CapacitorUsbTransport` stub) is already in the tree.

## Why iPad is special

The Stage 4 transfer protocol is vendor USB on interface 0 (`docs/PROTOCOL-RE.md`),
**not** SysEx. Among Apple devices, only **iPad (M1+)** can reach vendor-class USB,
via a DriverKit system extension. Not iPhone (no DriverKit on iOS), not any
PWA/Safari (no WebUSB/Web MIDI). So: transfer = desktop (WebUSB/node-usb) or a
native iPad app with a DEXT.

## Target topology

```
CapacitorUsbTransport (TS, implements NordTransport)   ← Phase A stub, in tree
   → custom Capacitor USB plugin (Swift app code)      ← Phase B
      → IOKit IOUserClient
         → DriverKit DEXT (claims vendor iface 0xFF; VID 0x0FFC / PID 0x002E;
           bulk OUT endpoint 0x03, bulk IN endpoint 0x82)
   gated on: com.apple.developer.driverkit entitlement (+ USB transport entitlement)
```

The seam is four methods (`open / bulkOut / bulkIn / close`); the plugin marshals
byte arrays across the JS↔Swift bridge. Everything above the transport
(`session`, `transfer`, `backup`, CRC-16, opcodes) is reused unchanged.

## Phase B build order

The TS bridge + native source already live in `plugins/capacitor-nord-usb/`
(committed, `UNVALIDATED` headers). What remains is gated on Apple + hardware:

1. **Apple Developer.** Request the `com.apple.developer.driverkit` distribution
   entitlement (justification form; lead time). Enable the DriverKit capability on
   the `org.opennord.app` App ID. Create provisioning profiles for the app and the
   DEXT carrying the entitlement.
2. **Generate the iOS app target (local, not committed).** `npm run build` then
   `npx cap add ios`. Add `"capacitor-nord-usb": "file:plugins/capacitor-nord-usb"`
   to the app `dependencies` and `npm install` so `cap sync` discovers the plugin.
3. **Register the plugin.** Run `node scripts/register-capacitor-plugins.js` after
   `npx cap sync` (it re-adds `NordUsbPlugin` to the regenerated
   `ios/App/App/capacitor.config.json`).
4. **Add the DEXT target + finish the IOUserClient.** In Xcode, add a DriverKit
   extension target from `plugins/capacitor-nord-usb/ios/Dext/*`; embed it in the
   app; set its entitlements + the match `Info.plist`. The committed DEXT source is
   unvalidated and **incomplete by design**: implement `NewUserClient` and the
   `IOUserClient` subclass with an `ExternalMethod` dispatch table mapping selectors
   0–3 → `DoOpen/DoBulkOut/DoBulkIn/DoClose`, matching the Swift wrapper's call
   shapes (note `bulkIn` is marshalled as a scalar input + struct output).
5. **Sign + deploy.** Build with the entitlement-bearing profiles; install on an
   M1+ iPad; approve the system extension in Settings.
6. **StatusBar polish.** Add `@capacitor/status-bar`, style to Studio Dark
   near-black behind `isCapacitorPlatform()`.
7. **Hardware-validate.** Against a real Stage 4: enumerate (FileIterate) / read /
   write, matching `scripts/re-archive/nordpull.c` / `scripts/nordcreate.c`. The DEXT cannot
   run on the simulator.

## Validation gates (cannot be verified without entitlement + hardware)

- DEXT compile — best-effort via the DriverKit SDK once an `ios/` target exists.
- Signing / installation — blocked on the `com.apple.developer.driverkit` entitlement.
- On-device enumerate / read / write — blocked on an M1+ iPad + a Nord Stage 4.

## Constraints

- DEXT requires a physical M1+ iPad and a provisioning profile carrying the
  DriverKit entitlement; no simulator path.
- `NordTransport` must not change shape — keep the four-method seam.
- "Hardware optional" holds: with no DEXT, the iPad app is still the full
  Library/AI/samples app; the connect screen shows the Phase A "coming to iPad"
  state (`usbAvailability() === 'ipad-dext-pending'`).

## MIDI input (play any MIDI keyboard on iPad)

For "sound prep" on iPad: plug in any MIDI keyboard (USB, or Bluetooth LE MIDI)
and play the sample rompler. This is **live playing input only** — it has
nothing to do with Nord device transfer (vendor USB, above), and unlike the
DEXT it needs **no special entitlement and no M1**: CoreMIDI works on every
iPad (and iPhone).

iPad Safari/WKWebView has no Web MIDI, so input comes through a native CoreMIDI
plugin behind the same seam the desktop uses:

```
MidiContext / MidiConnect (UI)
  → listenToAllMidiInputs()            src/lib/midi/midi-inputs.ts  (the seam)
      ├─ 'web-midi'  desktop Chromium/Firefox/Electron → web-midi-inputs.ts
      └─ 'native'    Capacitor iOS → native-midi-inputs.ts
            → capacitor-midi-input plugin (plugins/capacitor-midi-input/)
               → CoreMIDI: one client + one input port, all sources connected,
                 notify block → coalesced rescan (hot-plug)
            ← `midiInput` {sourceId, ump | bytes}, `sourcesChanged` {sources}
         → ump.ts (UMP → MIDI 1.0 bytes) → midi-stream.ts (per-source parser:
           multi-message packets, running status, real-time, SysEx) → whole messages
```

The Swift side only **copies** what CoreMIDI delivered (one JS event per read
callback) and hops to the main thread; all parsing lives in TypeScript where it
is unit-tested. It prefers `MIDIInputPortCreateWithProtocol(._1_0)` (a
`MIDIEventList` of UMP words) and falls back to the legacy `MIDIPacketList` port
(raw bytes) if that port can't be created. SysEx is dropped at the seam, matching
Web MIDI's `sysex: false`. Errors stay musician-facing: `'unsupported'` (no
plugin / web), `'failed'` (CoreMIDI wouldn't start → "tap to retry").

Bluetooth: the iPad app shows **"Pair a Bluetooth keyboard"**, which presents
Apple's `CABTMIDICentralViewController` (CoreAudioKit) in a form sheet. Once
paired, the keyboard arrives through hot-plug like a USB one; if the app wasn't
listening yet, it starts.

Why our own plugin: no maintained Capacitor/Cordova CoreMIDI plugin exists. As
of 2026-10, `capacitor-midi` (MIT, last release 2024-04, Capacitor 6) has an iOS
side that is only the template `echo` stub; `capacitor-plugin-midi` (MIT, 2022,
Capacitor 2) is a single-source USB-only prototype; `cordova-plugin-webmidi`
(Apache-2.0, one release 2024-05) is a Cordova repackaging of the 2013-era
WebMIDIAPIShim (Objective-C, `MIDIPacketList` only, no Capacitor 8 packaging,
no Bluetooth pairing UI). The plugin here is ~300 lines of Swift with no
third-party code, AGPL like the rest of core.

### Status: UNVALIDATED (Swift)

`plugins/capacitor-midi-input/ios/Sources/MidiInputPlugin.swift` has never been
compiled — there's no Xcode here. Everything in TypeScript (seam selection, UMP
conversion, stream splitting, hot-plug bookkeeping, refcounted stop, the web
fallback, the UI states) is covered by vitest.

### Build

1. `npm run build:native && npx cap add ios` (local, not committed), as above.
2. Add `"capacitor-midi-input": "file:plugins/capacitor-midi-input"` to the app
   `dependencies` and `npm install` so `cap sync` discovers the pod
   (`CapacitorMidiInput.podspec` links `CoreMIDI` + `CoreAudioKit`).
3. `npx cap sync ios`, then `node scripts/register-capacitor-plugins.js` — it
   ensures both `NordUsbPlugin` and `MidiInputPlugin` are in
   `ios/App/App/capacitor.config.json`'s `packageClassList`.
4. Build in Xcode. Expect to fix small Swift API-shape issues on first compile
   (the code targets the iOS 14+ CoreMIDI Swift overlay: `MIDIEventPacketNext`,
   `MemoryLayout.offset(of:)` over `MIDIEventList`/`MIDIPacketList`).

### Permissions / entitlements

- **CoreMIDI: none.** No entitlement, no usage string, no capability.
- **Bluetooth MIDI:** add `NSBluetoothAlwaysUsageDescription` to
  `ios/App/App/Info.plist` (iOS kills the app when the pairing sheet touches
  Bluetooth without it). Suggested text: *"OpenNord uses Bluetooth to connect
  wireless MIDI keyboards so you can play sounds on your iPad."*
- No background modes: input only runs while the app is in front.

### Device test checklist

On a real iPad (the simulator has no USB/Bluetooth MIDI; it can only exercise
virtual sources, e.g. from another MIDI app):

1. **USB keyboard** (USB-C, or Lightning via the Camera Connection Kit): open a
   sample, tap *Connect MIDI keyboard* → shows *Playing from: <name>*; notes
   sound with velocity; the sustain pedal holds notes.
2. **Chords and fast runs:** play big chords / glissandi — every note sounds and
   releases (exercises multi-message packets and running status; many
   keyboards send note-off as running-status note-on velocity 0).
3. **Hot-plug:** unplug → status drops to *No MIDI keyboard found*; replug → back
   to *Playing from* with no tap and no stuck notes.
4. **Bluetooth LE MIDI** (a BLE keyboard or BLE MIDI adapter): tap *Pair a
   Bluetooth keyboard* → Apple's sheet appears (first time: the Bluetooth
   permission prompt with the usage text) → connect → *Done* and swipe-down both
   close it → the keyboard is listed and plays.
5. **Two keyboards at once:** both play; their running status doesn't mix.
6. **Clock / active sensing** (a keyboard or DAW app sending clock): playing
   still works, no lag build-up.
7. **Disconnect** stops input; *Connect* again resumes.
8. **Latency:** compare by ear against a native synth app; each event hops
   CoreMIDI thread → main → WKWebView. If it's audible, measure before
   optimising (e.g. batch per run-loop turn).
