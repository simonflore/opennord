# Spec: desktop shell hardening

**Date:** 2026-10-11
**Status:** Draft — awaiting review
**Scope:** spec 3 of 3. Builds on `2026-10-11-desktop-signed-releases-design.md`
and `2026-10-11-desktop-auto-update-design.md`. Lands on its own branch and PR,
stacked on the PR that carries those two.

---

## Goal

The desktop shell behaves like a finished app and gives a web page inside it no
more reach than it needs. Today it is a `BrowserWindow` with a preload and
little else.

## What is wrong today

| Problem | Effect |
| --- | --- |
| Electron 33 | Eleven majors behind (current: 44); no longer gets security fixes |
| `target="_blank"` links (17 in the web app) open new app windows | nordkeyboards.com, the forum, GitHub and others load inside OpenNord instead of the browser. Checked on the Electron 33 build: the site does open in a second app window, but that window does **not** get the Nord USB bridge |
| No navigation limits, no permission handler | The window can be navigated anywhere; any permission request is granted by default |
| No sandbox on the renderer | More reach than a page that only draws UI needs |
| The USB IPC answers any sender | Any frame or window in the app can drive the Nord |
| Unplugging is not noticed | The main process keeps a dead handle; the updater's restart prompt stays held for the rest of the run (the gap recorded in spec 2) |
| No single-instance lock | Two copies can compete for the Nord and the updater |
| No icon | Ships with the default Electron icon |
| Window size and position are forgotten | Opens at 1200×820, centred, every time |

## Order of work

1. **Electron 33 → 44.** First, so everything after is built and tested on the
   version that ships. `electron-builder` stays on 25 unless the pack fails on
   Electron 44; the release pipeline was only just verified and the two should
   not move together. `electron-updater` stays.
2. **Lockdown.**
3. **Unplug handling.**
4. **Single instance, window memory, icon.**

## Lockdown

**New windows.** `setWindowOpenHandler` denies every request. If the URL is
`https:` it is passed to `shell.openExternal`; anything else (`http:`, `file:`,
custom schemes, `javascript:`) is dropped and logged to the console. The same
rule applies to any `webContents` the app creates, via
`app.on('web-contents-created')`, so a window added later cannot miss it.

**Navigation.** `will-navigate` (and `will-redirect`) is prevented unless the
target is the app itself: the packed `dist/index.html` file URL, or the Vite dev
server origin when `VITE_DEV_SERVER_URL` is set. Hash changes inside the app do
not fire these events and are unaffected. A blocked `https:` navigation is
opened in the browser instead, so a plain link without `target="_blank"` still
does something sensible.

**Sandbox.** `sandbox: true` on the window, alongside the existing
`contextIsolation: true` and `nodeIntegration: false`. The preload uses only
`contextBridge` and `ipcRenderer`, which the sandbox allows.

**Permissions.** `setPermissionRequestHandler` and `setPermissionCheckHandler`
on the default session deny by default and allow only what the web app uses, and
only for the app's own origin:

| Permission | Why the app needs it |
| --- | --- |
| `midi`, `midiSysex` | Live MIDI keyboard input for the rompler. The app asks for MIDI without sysex, but Chromium 152 reports even that request as `midiSysex`, so refusing it refuses all MIDI |
| `clipboard-sanitized-write` | Copy buttons |
| `fileSystem` | The folder picker and save dialog behind the local Library |

Camera, microphone, geolocation, notifications, `usb`/`hid`/`serial`
(the Nord goes through the native bridge, not WebUSB) and everything else are
refused. The exact Electron permission names are confirmed against Electron 44's
types during implementation; if the app needs one this list misses, it is added
with a line saying why.

**IPC sender check.** Every `nord-usb:*` handler rejects a call whose sender is
not the main frame of the app window showing the app's own URL.

## Unplug handling

The main process listens for `usb.on('detach')`. When the detached device is the
one it has open:

- the handle is dropped (`state = null`) without trying to release an interface
  that no longer exists;
- the updater is told the device is closed, so a held restart prompt can show;
- the transfer in flight and later `bulkOut` / `bulkIn` calls reject with
  *"Your Nord was disconnected."* rather than a libusb error or "Device not
  open." A failed transfer is judged by whether the Nord is still on the bus,
  not by its error code: macOS reports a pulled cable as a plain transfer error.
  The same check gates the detach event, so a spurious one is ignored;
- the preload strips Electron's "Error invoking remote method…" wrapper, so the
  page receives the message itself

The renderer is not sent an event. The web app has no unplug handling in the
browser either; a proper "disconnected" state in the UI is a product change and
is out of scope. What the player sees is the transfer or the next action failing
with the message above.

`usb.on('detach')` keeps libusb's hotplug polling alive for the life of the
process, which is fine for an app that runs until quit. The listener is
registered once at startup, after the Windows backend is chosen.

## Single instance

`app.requestSingleInstanceLock()` at startup. A second launch quits immediately;
the first instance's `second-instance` handler restores, shows and focuses the
existing window.

## Window memory

Bounds (`x`, `y`, `width`, `height`) and the maximized flag are saved to a JSON
file in `app.getPath('userData')` when the window is moved, resized (debounced)
or closed, and restored on launch. Saved bounds are used only if they still
intersect a connected display by a usable margin; otherwise the default size is
used, centred. A corrupt or missing file means defaults. No new dependency.

## Icon

- One source file in the repo: `electron/icon/icon.svg`, drawn in the Studio
  Dark language — graphite ground, the single signal-orange accent, no Nord
  trademark or keyboard likeness (`docs/LEGAL.md`). **The drawing is shown to
  the owner for approval before it is wired in.**
- `scripts/make-icons.mjs` renders it to `electron/icon/icon.png` (1024 px)
  with Electron itself. The PNG is committed, so a pack does not need to render
  anything; the script is re-run only when the SVG changes.
- `build.mac.icon` and `build.win.icon` point electron-builder at the PNG, and
  it makes the `.icns` and `.ico` at pack time. The pack must no longer log
  "default Electron icon is used".
- As built: a panel knob with its value ring and tick scale, and the wordmark as
  its printed legend — chosen by the owner over a ring-and-dot, a monogram and
  an LCD.

How the SVG is rasterised (a dev dependency, or macOS's own `sips`/`iconutil`
plus a small ICO writer) is decided in the plan, preferring no new dependency.

## Structure

| File | Responsibility |
| --- | --- |
| `electron/shell-policy.ts` | Pure decisions: is this URL the app, should this URL open externally, is this permission allowed, are these saved bounds usable |
| `electron/shell-policy.test.ts` | Their tests |
| `electron/window-state.ts` | Read and write the bounds file; uses `shell-policy` to validate |
| `electron/nord-usb.ts` | The USB IPC, the open device, unplug detection |
| `electron/main.ts` | Wiring: single-instance lock, window creation with the hardened options, the handlers above |
| `scripts/make-icons.mjs`, `electron/icon/*` | Icon source and generated files |

`main.ts` is 190 lines today and gains several concerns. The USB IPC moves to
`electron/nord-usb.ts` (handlers, open state, detach listener) so that `main.ts`
is left as startup wiring. No behaviour change in that move beyond what this
spec describes.

## Testing

- **Unit:** `shell-policy.test.ts` — app-URL recognition for the packed file URL
  and the dev origin, with look-alike URLs that must not pass; external-open
  only for `https:`; the permission allow-list; bounds validation against
  display layouts, including a display that has gone.
- **On this Mac, after the Electron upgrade and again at the end:** a signed
  pack, the app launches, the Library loads, and the update rehearsal from
  spec 2 passes (the updater sits on top of the upgrade).
- **By hand in the packed app:** an external link opens the browser and no new
  app window; MIDI input still works; the folder picker still works; a second
  launch focuses the first; size and position are restored; the Dock shows the
  icon.
- **Needs the owner and a Nord:** connect, run a transfer, pull the cable
  mid-session, confirm the message and that reconnecting works without
  restarting the app.
- **Not testable here:** Windows, in every respect, until CI can run.

## Out of scope

- **Content security policy.** Worth having; a wrong policy silently breaks
  workers, fonts or the AI calls, so it gets its own pass with testing.
- **Electron fuses** (disabling `ELECTRON_RUN_AS_NODE` and friends in the
  binary). Needs electron-builder 26 or a hook that runs before signing — the
  pipeline change this spec avoids.
- **`electron-builder` 26.**
- A designed menu; an in-app "disconnected" state; Windows code signing; Linux.

## Platform floor

Electron 44 requires **macOS 13**; Electron 33 ran on macOS 11. This upgrade
therefore drops macOS 11 and 12. `build.mac.minimumSystemVersion` declares it,
so the Finder refuses with a clear message instead of the app crashing. Windows
stays at Windows 10 or newer.

## Risks

- **node-usb 2.18's libusb hotplug on Windows with the UsbDk backend** may emit
  false detach events or fail to open a Stage 2 (found by source reading in
  review; not run). The device-list check guards against the false detach; the
  rest needs the Windows hardware test, with pinning `usb` to 2.17.x as the
  fallback.

- **The Electron jump is large.** Mitigated by doing it first and re-running the
  pack and the update rehearsal before anything else changes. If 44 breaks
  node-usb's prebuild or the pack, step back to the newest major that works and
  record which.
- **The sandbox or the permission list breaks a feature nobody thought of.**
  Mitigated by the by-hand pass; the fix is an explicit, commented allow-list
  entry.
- **Unplug handling cannot be hardware-tested by the implementer.** It ships
  only after the owner's test.
