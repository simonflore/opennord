# OpenNord desktop shell (Electron)

The desktop app exists for **one decisive reason**: node-usb (libusb) can
`detachKernelDriver()` + `claimInterface()`, which WebUSB is forbidden to do. So
it connects the **pre-WinUSB Nords** (USB product id `< 0x0024`, e.g. the Stage
2) that fail in the browser with *"Unable to claim interface"* — because Nord
Sound Manager binds those to a custom kernel driver (`ClaviaUSB64.sys`), not
WinUSB. See the `windows-webusb-driver-cutoff` note.

## Architecture

The renderer is the **unchanged Vite SPA**. Nord USB is a third transport next
to `WebUsbTransport` and `CapacitorUsbTransport`:

```
renderer  ElectronUsbTransport (src/lib/device/electron-usb.ts)
            └─ window.nordNativeUsb   (electron/preload.ts, contextBridge)
                 └─ nord-usb:* IPC     (electron/main.ts)
                      └─ node-usb → detachKernelDriver + claim + bulk
```

`usbAvailability()` returns `'electron'` when `window.nordNativeUsb` exists, and
`ConnectPanel` picks `ElectronUsbTransport`. Everything above the four-method
seam — decode, protocol, session, diagnostics, the partition probe — is reused
untouched.

## Setup (the parts that need a real machine)

These weren't run in the headless dev environment; do them where you can plug in
a Nord.

1. **Install deps** (native module + shell):
   ```bash
   npm i -D electron @electron/rebuild electron-builder esbuild
   npm i usb
   ```
2. **Rebuild node-usb for Electron's ABI** (node-usb is native; it must match
   Electron's V8, not system Node):
   ```bash
   npx electron-rebuild -f -w usb
   ```
3. **Build main + preload** (they're outside the web `tsconfig`; bundle with esbuild):
   ```bash
   npx esbuild electron/main.ts electron/preload.ts \
     --bundle --platform=node --format=cjs --external:electron --external:usb \
     --outdir=electron/dist
   ```
4. **Dev run** (Vite + Electron):
   ```bash
   VITE_DEV_SERVER_URL=http://localhost:5173 npx electron electron/dist/main.js
   ```
   (start `npm run dev` first). For prod, `npm run build` then point main at `dist/index.html` (already the fallback).

## Suggested package.json scripts

```jsonc
"electron:build": "esbuild electron/main.ts electron/preload.ts --bundle --platform=node --format=cjs --external:electron --external:usb --outdir=electron/dist",
"electron:dev":   "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron electron/dist/main.js\"",
"electron:pack":  "npm run build && npm run electron:build && electron-builder"
```

## Verifying the Stage 2 fix

Plug in a Stage 2 (Windows, with NSM's custom driver still installed — no Zadig).
Launch the desktop build and Connect. On the first open, `detachKernelDriver()`
takes interface 0 from `ClaviaUSB64.sys`, `claim()` succeeds, and the same
session/probe/diagnostics stack runs — including the `device.partition-probe`
that finally confirms the Stage 2 partition map. That's the acceptance test.

## Notes / gotchas

- **Windows**: libusb's default WinUSB backend **cannot** take a device off a
  foreign kernel driver (`ClaviaUSB64.sys`, bound to pre-0x0024 PIDs like the
  Stage 2) — `detachKernelDriver` is a no-op there, same wall as the browser.
  `main.ts` switches libusb to the **UsbDk backend** on Windows
  (`useUsbDkBackend()`) when the UsbDk runtime is installed, which captures the
  device without replacing NSM's driver. Falls back to WinUSB otherwise (fine
  for the already-WinUSB-bound Stage 3/4). If a device still resists, a one-time
  WinUSB swap via Zadig is the fallback — not yet verified on real hardware
  (a Stage 2 test machine).
- **HVCI / Core Isolation ("Memory Integrity") can block `ClaviaUSB64.sys` from
  loading at all** — a different, more fundamental failure than the claim-wall
  above, and on by default on Secured-core PCs (Surface being the canonical
  example). A community forum reported this broke even **NSM itself** on a
  Surface Pro 7+ (Windows 11), "fixed" by disabling HVCI via registry.
  **Confirmed by direct inspection (2026-07-14) of Clavia's own "USB Driver
  v4.08" installer** (extracted, not run — it's a Windows binary):
  - `ClaviaUSB64.sys` is **byte-identical in behavior** to the old driver —
    still `DriverVer=08/06/2015,3.0.2.0`, same `Class=Media`, same PID list. No
    code changed.
  - What *is* new: `Clavia.cat`'s signing chain now includes **Microsoft
    Windows Hardware Compatibility Publisher (WHCP)** — the attestation-signing
    trust chain HVCI actually checks for. The old catalog almost certainly
    lacked it. So **the real fix is Clavia re-signing the same driver**, not a
    code change and not disabling a Windows security feature.
  - **This should be the first thing recommended** for HVCI/Secured-core users
    over the registry hack — install Clavia's current driver package and HVCI
    can stay on.
  - It does **not** touch the claim-wall above: `ClaviaWinUSB.inf` still only
    covers PID `0x0024`–`0x002E`/`0x0038`–`0x003F`, unchanged, still excluding
    the Stage 2. Zadig or this Electron app is still required below that
    cutoff regardless of driver signing.
  - **Narrows, doesn't close, the "never tested on real Windows hardware"
    gap:** with the signed driver installed, `ClaviaUSB64.sys` should load
    reliably even under HVCI, giving `detachKernelDriver`/UsbDk a properly
    loaded driver to work against instead of an uncertain HVCI-blocked state —
    still needs a real Secured-core machine to confirm.
- **Endpoints** are discovered from the descriptors (`findBulk`), mirroring the
  web transport — not hardcoded to the Stage 4 layout.
- Keep `contextIsolation: true` / `nodeIntegration: false`; the renderer only
  sees the narrow `nordNativeUsb` surface.
