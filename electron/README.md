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

- **Windows**: `detachKernelDriver` on Windows requires the interface to be on a
  libusb-compatible driver; if it's on `ClaviaUSB64.sys`, libusb (WinUSB backend)
  can still claim via the kernel-driver detach on modern libusb. If a device
  resists, a one-time WinUSB swap (Zadig) is the fallback — but the goal is no
  Zadig. Verify on Fred's Stage 2.
- **Endpoints** are discovered from the descriptors (`findBulk`), mirroring the
  web transport — not hardcoded to the Stage 4 layout.
- Keep `contextIsolation: true` / `nodeIntegration: false`; the renderer only
  sees the narrow `nordNativeUsb` surface.
