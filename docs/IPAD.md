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

1. **Generate the iOS target:** `npm run build` then `npx cap add ios`. Set
   `appId`/`ios.scheme` in `capacitor.config.ts` first. The `ios/` dir is not
   committed until this step (it bakes in the bundle id).
2. **Custom Capacitor USB plugin** (Swift). Scaffold with
   `npm init @capacitor/plugin@latest`, then register it so `cap sync` keeps it
   alive — follow the vitronitor pattern (`scripts/register-capacitor-plugins.js`,
   which edits `ios/App/App/capacitor.config.json` and the SPM `Package.swift`).
   Implement `open/bulkOut/bulkIn/close`; map results back to
   `CapacitorUsbTransport` (replace the `ipad-dext-pending` throws).
3. **DriverKit DEXT target** in the Xcode project: an `IOUSBHostInterface` driver
   matched on VID `0x0FFC` / PID `0x002E`, claiming the vendor interface and doing
   the bulk transfers; exposes an `IOUserClient` the app talks to via IOKit.
4. **Apple entitlement:** request `com.apple.developer.driverkit` (+ the USB
   transport entitlement) from Apple — this has lead time. (WWDC22 "Bring your
   driver to iPad with DriverKit.")
5. **StatusBar polish:** add `@capacitor/status-bar`, style to Studio Dark
   near-black behind `isCapacitorPlatform()`. (Deferred from Phase A because it
   needs the plugin + generated target.)
6. **Hardware validation** on a real M1+ iPad against a Stage 4: enumerate, read,
   write — same `scripts/nord*.c` expectations as desktop. The DEXT cannot run on
   the simulator; needs a device + provisioning profile with the entitlement.

## Constraints

- DEXT requires a physical M1+ iPad and a provisioning profile carrying the
  DriverKit entitlement; no simulator path.
- `NordTransport` must not change shape — keep the four-method seam.
- "Hardware optional" holds: with no DEXT, the iPad app is still the full
  Library/AI/samples app; the connect screen shows the Phase A "coming to iPad"
  state (`usbAvailability() === 'ipad-dext-pending'`).
