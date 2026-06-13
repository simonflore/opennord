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

## Consequence

- **Transfer works over USB (desktop):** Electron + `node-usb`/libusb, or Chromium
  **WebUSB**. This is the proven path.
- **iOS is the open question.** iOS can't reach a vendor USB interface (no WebUSB,
  no libusb); its only device channel is CoreMIDI. So iOS transfer depends on the
  SysEx-over-MIDI path, which this unit didn't honour. **Re-test:** enable SysEx-RX
  on the keyboard (front panel), then replay the validated framing as SysEx
  (`CQryContentVersion`, msgId `0x3D`) with `sendmidi`/`receivemidi` and watch for
  a `F0 33 …` reply. Until that passes, plan iOS as read/share/AI only and put
  transfer on desktop.

Live MIDI control (CC/NRPN) is unaffected and works on every platform.
