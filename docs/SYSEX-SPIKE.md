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

## Consequence — transfer is desktop-only (iOS: no)

- **Transfer works over USB (desktop):** Electron + `node-usb`/libusb, or Chromium
  **WebUSB**. This is the proven path.
- **iOS transfer is NOT feasible.** iOS can't reach a vendor USB interface (no
  WebUSB, no libusb), so its only possible channel is CoreMIDI/SysEx — and the
  Stage 4 **does not service program transfer over SysEx**: it ignored every SysEx
  probe (including a framing-independent Universal Identity Request, receive path
  verified by loopback), and **there is no SysEx-RX setting** on the instrument to
  enable (confirmed: every front-panel menu + the manuals/forum). The SysEx
  framing exists only in Clavia's shared protocol library, not active on the NS4.
  This is a settled negative, not a pending test.

So: **iOS gets read / share / AI / live-MIDI-control; program pull/push is
desktop-only.** Live MIDI control (CC/NRPN) is unaffected and works everywhere.
