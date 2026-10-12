# iPad — native shell & USB transfer (DriverKit)

OpenNord on iPad is the same React app in a Capacitor shell, plus a DriverKit
driver that gives it the Nord's USB port. The Xcode project is committed under
`ios/`; it builds the app and the driver, and embeds one in the other.

**Status (2026-10-11): builds, never run.** `xcodebuild` (Xcode 27) compiles and
links the driver, both Swift plugins and the app, unsigned. Nothing here has yet
run on an iPad or talked to a Nord — see "What is still unproven".

## Why iPad is special

The Nord transfer protocol is vendor USB on interface 0 (`docs/PROTOCOL-RE.md`),
**not** SysEx. Among Apple devices, only **iPad (M1+, iPadOS 16+)** can reach
vendor-class USB, via a DriverKit extension. Not iPhone (no DriverKit on iOS), not
any PWA/Safari (no WebUSB/Web MIDI). So: transfer = desktop (WebUSB/node-usb) or
this app. The app target is iPad-only for that reason.

## How it fits together

```
CapacitorUsbTransport (TS, implements NordTransport)     src/lib/device/capacitor-usb.ts
  → NordUsb plugin (Swift)                               plugins/capacitor-nord-usb/ios/Sources/NordUsbPlugin/
     → IOKit user client (IOServiceOpen / IOConnectCallMethod)
        → NordUsbUserClient → NordUsbDriver (DriverKit)  plugins/capacitor-nord-usb/ios/Dext/
           → the Nord's vendor interface: bulk OUT + bulk IN
```

- **Matching.** The driver matches Clavia's vendor id (`0x0FFC`) plus the vendor
  interface's subclass/protocol (`0xFF/0xFF`), not one product id, so every Nord
  with that interface is picked up. It finds the bulk endpoints from the
  interface's own descriptors and falls back to the Stage 4's (`0x03` / `0x82`).
- **Which Nord.** The driver reads the USB product id; `open` hands it to the
  app, which picks the model exactly as the desktop paths do
  (`CapacitorUsbTransport.identify()` → `identifyDevice`).
- **Calls.** Four external methods — open, bulk OUT, bulk IN, close. Their
  selectors and argument shapes are listed once in `NordUsbUserClient.cpp` and
  mirrored in `NordUsbConnection.swift`; change both together.
- **Timeouts.** A read with a timeout comes back as `timedOut` and leaves nothing
  pending (`TransportTimeoutError`, like the other transports). A read without
  one is cut into 2-second slices on the Swift side, so closing the connection or
  unplugging the keyboard ends it.
- **IOKit from Swift.** The iOS SDK ships IOKit without a module map; the small
  `NordIOKit` C target re-exports it.
- **No driver, no problem.** `nordUsbAvailable()` is false until a Nord is plugged
  in and the driver is switched on; the connect screen then asks the player to
  plug in, and keeps checking. Everything else in the app works without it.

## Build

Needs Xcode (not just the Command Line Tools) and Node 22 or 24.

```bash
npm run cap:sync                       # web bundle → ios/App/App/public, plugins → Swift package
open ios/App/App.xcodeproj             # pick your team on the App and NordUsbDriver targets, run on an iPad
```

Unsigned compile check, no team needed:

```bash
cd ios/App && xcodebuild -project App.xcodeproj -scheme App \
  -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

The driver target is not something `npx cap add ios` knows about. If the project
is ever regenerated, `scripts/ios-add-dext.rb` puts it back (and sets the iPadOS
16 floor, iPad-only, and the app's entitlements).

## Signing and entitlements

| Target | Entitlement | Who can sign with it |
|---|---|---|
| App | `com.apple.developer.driverkit.communicates-with-drivers` | development: any team; distribution: on request |
| Driver | `com.apple.developer.driverkit` | development: any team; distribution: on request |
| Driver | `com.apple.developer.driverkit.transport.usb` for vendor id 4092 (`0x0FFC`) | development: any team (any vendor id); distribution: **granted by Apple per vendor id** |

- **On your own iPad:** a paid developer team and automatic signing are enough.
  Xcode adds the development versions of these capabilities itself.
- **TestFlight / App Store:** a distribution profile only carries them once Apple
  has approved the team's DriverKit request
  (<https://developer.apple.com/contact/request/system-extension/>). The USB
  transport entitlement is granted per vendor id, and `0x0FFC` belongs to Clavia,
  not to us. Whether Apple grants it to a third party is the open question for
  distribution; nothing in the code can settle it.

## First run on an iPad

1. Run from Xcode onto an iPad with an M1 or newer.
2. Settings → Apps → OpenNord → Drivers: switch the Nord driver on. (It is listed
   once the app has been installed; the switch only appears on DriverKit-capable
   iPads.)
3. Plug the Nord in and switch it on. The Device screen changes from "Plug your
   Nord into this iPad" to the connect card within a couple of seconds.
4. Connect. Check, in this order: the model name is right; the program list
   loads; reading one program works; then a write, on a slot you don't mind losing.

If step 3 never happens, look at the driver's log (`log stream` in Console,
filter on `NordUsbDriver`): "started (pid …)" means it matched and opened the
interface; no line at all means it never matched.

## What is still unproven

- Whether iPadOS hands this driver the vendor interface with the personality in
  `Dext/Info.plist` (vendor id + subclass + protocol).
- The whole user-client round trip, including replies above 4096 bytes, which
  travel as a mapped buffer instead of inline.
- Whether cutting an unanswered read into 2-second slices is harmless to a Nord
  mid-transfer. It only ever abandons a slice that received nothing.
- Any model but the Stage 4. The others share the transport on paper
  (`docs/NORD-PRODUCT-LINE.md`); on iPad, as on desktop, they stay read-only until
  the probe finds their program files.

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

### Status: compiles, never run

`MidiInputPlugin.swift` builds with Xcode 27 as part of the app (see "Build"
above) but has not run on an iPad. Everything in TypeScript (seam selection, UMP
conversion, stream splitting, hot-plug bookkeeping, refcounted stop, the web
fallback, the UI states) is covered by vitest.

### Permissions / entitlements

- **CoreMIDI: none.** No entitlement, no usage string, no capability.
- **Bluetooth MIDI:** `NSBluetoothAlwaysUsageDescription` is set in
  `ios/App/App/Info.plist` (iOS kills the app when the pairing sheet touches
  Bluetooth without it).
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
