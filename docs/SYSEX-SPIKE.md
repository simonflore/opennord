# The SysEx spike — RESOLVED

**Original question:** can a computer/iPhone move a program to/from a Nord Stage 4
over USB **MIDI SysEx**? This was the highest-risk unknown gating device transfer.

**Answer: device transfer is solved — but it is _not_ SysEx.** It's a
vendor-specific **raw-USB bulk protocol** on interface 0, now fully reverse-
engineered and hardware-validated (enumerate / read / write, both directions). The
full spec lives in [`docs/PROTOCOL-RE.md`](PROTOCOL-RE.md).

## What we found

- Nord Sound Manager has **no CoreMIDI dependency**; it transfers programs over a
  vendor USB protocol (`Ymer::USB` + `Ymer::Protocol::FileTransfer`), recovered by
  decompilation and proven on real hardware.
- The protocol *is* transport-agnostic — the same messages have a Clavia SysEx
  framing (`F0 33 7F …`) — **but the Stage 4 did not answer any SysEx probe** on
  its MIDI port (not even a Universal Identity Request; our receive path was
  verified via a CoreMIDI loopback). So SysEx-RX is almost certainly **disabled in
  the Nord's Global settings**, or the firmware only accepts FileTransfer over
  vendor USB.

## Consequence — where transfer can run (researched 2026-06)

Transfer needs the **vendor USB** interface (the NS4 has no SysEx transfer path —
it ignored every SysEx probe incl. a Universal Identity Request, and has no
SysEx-RX setting; that's settled). So the question is: where can you reach vendor
USB?

| Platform | Vendor-USB transfer? | How |
|---|---|---|
| **Desktop** (mac/Win/Linux) | ✅ proven | Electron + `node-usb`/libusb, or Chromium **WebUSB** |
| **iPad (iPadOS, M1+)** | ✅ **yes** | **native app + a `USBDriverKit` DEXT** — Apple explicitly allows vendor-class (`0xFF`) access; needs the `com.apple.developer.driverkit` distribution entitlement (request from Apple). See WWDC22 "Bring your driver to iPad with DriverKit". |
| **iPhone (iOS)** | ❌ no | no DriverKit/USBDriverKit on iOS; vendor USB needs MFi |
| **Any iOS/iPadOS browser (PWA)** | ❌ no | no WebUSB, no Web MIDI on Safari/WebKit (Apple opposes both) |

So: **transfer = desktop or a native iPad (M1+) app with a DriverKit extension.**
A **PWA** (any Apple device) and **iPhone** can't transfer — they get
read/share/AI + live MIDI control (CC/NRPN, which works everywhere). The native
iPad path is more work than the PWA (driver extension + Apple entitlement) but is
sanctioned, not a hack.

Sources: WebUSB unsupported on Safari/iOS (caniuse, MDN); Web MIDI unsupported on
iOS WebKit; USBDriverKit on M1+ iPad incl. vendor-class `0xFF` (Apple Developer
Forums 814165, 756763) + DriverKit distribution entitlement (forum 718069,
WWDC22 session 110373).
