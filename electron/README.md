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

## Setup

1. **Install deps:** `npm ci`. The shell, the packer and node-usb are already in
   `package.json`.
2. **Do _not_ rebuild node-usb.** node-usb 2.x is **N-API** (`NAPI_VERSION=8`),
   whose ABI is stable across Node *and* Electron, and it ships **prebuildify**
   binaries for every target (`prebuilds/win32-x64/node.napi.node`, …). It works
   in Electron as installed. See "Never run electron-rebuild" below — this is a
   trap that has already shipped one broken Windows build.
3. **Build main + preload** (they're outside the web `tsconfig`; esbuild bundles
   them to `electron/dist/*.cjs`): `npm run electron:build`.
4. **Dev run** (Vite + Electron together): `npm run electron:dev`.

## Packing

```bash
npm run electron:pack       # macOS  → release/OpenNord-mac.dmg + .zip (universal, signed)
npm run electron:pack:win   # Windows x64 → release/OpenNord-win-x64.exe (NSIS, unsigned)
```

Both bracket electron-builder with `scripts/usb-native-guard.mjs`: `clean` empties
`node_modules/usb/build` and `release/` beforehand, `verify` then asserts the
packed app carries the target's `prebuilds/` binary and no `build/`. A pack that
would ship the broken binding fails instead of producing an installer. (`clean`
wipes `release/` so `verify` can only see the run that just happened — which
means packing one target discards the other target's output.)

Both pass `--publish never`. The `publish` entry in `package.json` exists so
electron-builder writes the `latest*.yml` update feeds; it must never upload by
itself — on a tag build in CI it would try to.

The macOS pack signs with the Developer ID certificate in the keychain. It is
notarized only when `APPLE_KEYCHAIN_PROFILE` is set, which the release command
does; a plain `electron:pack` gives a signed, un-notarized app that is fine for
local testing.

**Windows packs run in CI, on Windows — from the monorepo.** The pack workflow
lives in the private `opennord-backend` monorepo, not in this repository: it
packs on `windows-latest` from a clean `npm ci` tree and uploads
`OpenNord-win-x64-<sha>` — on a `desktop-v*` tag, on manual `workflow_dispatch`,
and on any PR touching an input the pack consumes. It is not mirrored here
because the mirror's push token would need `Workflows: write` to deliver a
workflow file, and a failed push there wedges every later core mirror update. A
local Mac pack cannot produce the installer at all: the app *directory*
cross-builds fine (node-usb's `prebuilds/` carry every platform), but
electron-builder shells out to **wine** to stamp the .exe metadata (rcedit), and
its bundled wine 4.0.1 aborts on current macOS.

**Pin the Windows arch.** `electron-builder --win` defaults to the *host* arch, so
on an Apple Silicon Mac it silently builds **win-arm64**, which won't launch on
the x64 Windows nearly every tester runs. `electron:pack:win` therefore passes
`--x64` explicitly; use `--arm64` only when you mean it.

## Releasing

Versions come from `package.json` `version`; a release is the tag
`desktop-v<version>`. Asset names carry no version, so the site can link to
`releases/latest/download/<name>`. A fix — including a startup fix — is a version
bump, never a replaced file: someone holding the old download must be able to
tell it from the new one.

1. Bump: `npm version <x.y.z> --no-git-tag-version`, commit, merge to `main`.
2. Tag that commit and push the tag:
   `git tag desktop-v<x.y.z> && git push origin desktop-v<x.y.z>`.
   The tag push starts the Windows build.
3. When it is green, on the release Mac, with the tag checked out:
   ```bash
   npm run release:desktop
   ```
   It checks the machine, packs + signs + notarizes macOS, verifies the result
   (`codesign`, `stapler`, Gatekeeper), downloads the Windows installer CI built
   for the same commit, and uploads everything to a **draft** release on
   `simonflore/opennord`.
4. Install both builds on clean machines and connect a Nord.
5. Confirm the public mirror has the released commit, then publish the draft.

`-- --mac-only` releases macOS alone; `-- --dry-run` stops before uploading. A
published version is never replaced — the command refuses; bump instead.

### One-time setup of the release Mac

- Xcode or the Command Line Tools (`notarytool` and `stapler` ship with either).
- A **Developer ID Application** certificate in the login keychain (Xcode →
  Settings → Accounts → Manage Certificates).
- A notarization credential stored under the profile name the command expects,
  using an app-specific password from account.apple.com:
  ```bash
  xcrun notarytool store-credentials opennord-notary --apple-id <id> --team-id <team>
  ```
- `gh auth login` with access to both repositories.

## Never run electron-rebuild

`electron-rebuild -f -w usb` compiles node-usb **for the machine you're on** and
writes `node_modules/usb/build/Release/usb_bindings.node`. That single file is
what shipped the broken `OpenNord-0.0.1-win` build:

- `node-gyp-build` resolves `build/Release/*.node` **before** `prebuilds/<platform>-<arch>/`,
  so once `build/` exists it wins on *every* platform.
- Packed from a Mac, that binary is Mach-O. On Windows, `require('usb')` dlopens
  it and Electron dies at startup with
  *"`usb_bindings.node` is not a valid Win32 application"* — before any of our
  code runs, which is why installing UsbDk doesn't help.

node-usb 2.x is N-API + prebuildify, so the rebuild buys nothing to begin with.
Four things now stand between a stray rebuild and a tester:

1. **`PREBUILDS_ONLY=1`** — node-gyp-build reads it at load and skips
   `build/Release` and `build/Debug` entirely, so `prebuilds/` always wins. It is
   injected as an esbuild `--banner:js` on `electron:build` rather than written in
   `main.ts`, because a banner is guaranteed to run before the bundle's first
   `require` — an `import` statement is not.
2. **`build.files`** carries `"!**/node_modules/usb/build/**"`, keeping the file
   out of the archive (verified: without it, the Mach-O binary lands in
   `app.asar.unpacked/node_modules/usb/build/Release/`).
3. **`npmRebuild: false`** stops electron-builder from recreating it during a pack.
4. **`scripts/usb-native-guard.mjs`** cleans before the pack and verifies after,
   so a pack that would ship it fails loudly instead.

If a pack ever misbehaves, `rm -rf node_modules/usb/build` and re-run.

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
  **Confirmed by direct inspection (2026-07-14) of Clavia's own ["USB Driver
  v4.08" installer](https://www.nordkeyboards.com/wt/documents/19/Clavia%20USB%20Driver%20installer%20v4.08.zip)**
  (extracted, not run — it's a Windows binary):
  - `ClaviaUSB64.sys` is **byte-identical in behavior** to the old driver —
    still `DriverVer=08/06/2015,3.0.2.0`, same `Class=Media`, same PID list. No
    code changed.
  - What *is* new: `Clavia.cat`'s signing chain now includes **Microsoft
    Windows Hardware Compatibility Publisher (WHCP)** — the attestation-signing
    trust chain HVCI actually checks for. The old catalog almost certainly
    lacked it. So **the real fix is Clavia re-signing the same driver**, not a
    code change and not disabling a Windows security feature.
  - **This should be the first thing recommended** for HVCI/Secured-core users
    over the registry hack — install
    [Clavia's current driver package](https://www.nordkeyboards.com/wt/documents/19/Clavia%20USB%20Driver%20installer%20v4.08.zip)
    and HVCI can stay on.
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
