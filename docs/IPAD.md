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
4. **Add the DEXT target.** In Xcode, add a DriverKit extension target from
   `plugins/capacitor-nord-usb/ios/Dext/*`; embed it in the app; set its
   entitlements + the match `Info.plist`.
5. **Sign + deploy.** Build with the entitlement-bearing profiles; install on an
   M1+ iPad; approve the system extension in Settings.
6. **StatusBar polish.** Add `@capacitor/status-bar`, style to Studio Dark
   near-black behind `isCapacitorPlatform()`.
7. **Hardware-validate.** Against a real Stage 4: enumerate (FileIterate) / read /
   write, matching `scripts/nordpull.c` / `scripts/nordcreate.c`. The DEXT cannot
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
