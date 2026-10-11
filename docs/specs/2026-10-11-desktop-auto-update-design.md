# Spec: desktop auto-update

**Date:** 2026-10-11
**Status:** Draft — awaiting review
**Scope:** spec 2 of 3. Builds on
`2026-10-11-desktop-signed-releases-design.md` (signed installers, stable asset
names, `latest*.yml` feeds on the public repo's Releases). Spec 3 (shell
hardening, Electron upgrade) is not designed here.

---

## Goal

Someone who installed OpenNord once keeps getting new versions without visiting
the website. The first public release must already contain this: a build
without an updater strands whoever installs it.

## Decisions already taken

| Decision | Choice |
| --- | --- |
| Library | `electron-updater`, reading the GitHub feed configured in `build.publish` |
| Presentation | Native system dialog; no preload or React changes |
| Download | Automatic, silent, in the background |
| Install | On the user's "Restart now", otherwise on the next quit |
| Channel | Stable releases only; drafts and pre-releases are ignored |

**Why everything lives in the main process.** An updater that depends on the web
app cannot repair a release whose web app fails to load. Kept in the main
process, the next release fixes a white-screen build by itself. This is the
property the design protects first.

## Behaviour

- **Packaged builds only.** `electron:dev` and unpackaged runs never check.
- **When:** one check 10 seconds after the app is ready, then every 4 hours.
- **Download:** `autoDownload` on. No UI while downloading.
- **Ready:** when a download completes, a native dialog —
  *"OpenNord <version> is ready to install."* with **Restart now** and
  **Later**. *Restart now* quits and installs. *Later* does nothing more;
  `autoInstallOnAppQuit` installs it when the app next quits.
- **Asked once per version per run.** After *Later* the dialog does not return
  until the next launch (by which time the update is normally installed).
- **Never during a Nord session.** While the USB device is open, the dialog is
  not shown. It is shown when the device is closed. The app never restarts
  without the user choosing *Restart now*. Known gap, for spec 3: unplugging
  the Nord without disconnecting in the app leaves it counted as open for the
  rest of that run, so the prompt stays held and the update installs on quit.
- **Quiet failures.** A failed automatic check or download (offline, GitHub
  error, rate limit) is written to the log and retried at the next interval. No
  dialog.
- **Manual check.** An application-menu item **Check for Updates…** runs a check
  and always answers with a dialog: *up to date*, *downloading <version>*, the
  ready prompt above, or the error text. This is the one place errors are shown.

## macOS: must run from Applications

Squirrel.Mac cannot replace an app running from the mounted dmg or from a
quarantine-translocated path, and fails without telling the user. So on launch,
in a packaged macOS build that is not in the Applications folder, a native
dialog offers **Move to Applications** (`app.moveToApplicationsFolder()`), which
relaunches from there, or **Not now**. The offer returns next launch, and
**Check for Updates…** makes it again. Until the app is moved it does not check
or download at all: an update fetched there could never install, and a "ready"
prompt for it would be a lie.

**The prompt waits for the system.** On macOS `electron-updater` reports a
download as finished before Squirrel.Mac has fetched and staged it. A "Restart
now" in that window would make the app quit whenever Squirrel finishes — or,
after a Squirrel error, hours later with no prompt. So on macOS the update only
counts as ready on Squirrel's own event, after which a restart is immediate.

## Structure

| File | Responsibility |
| --- | --- |
| `electron/update-policy.ts` | Pure decisions, no Electron imports: whether the ready prompt may be shown now, what the manual check should report, check timing constants |
| `electron/update-policy.test.ts` | Unit tests for the above |
| `electron/menu.ts` | The application menu as plain data, with the Check for Updates item |
| `electron/updater.ts` | Wiring: configures `autoUpdater`, schedules checks, shows dialogs, offers the move to Applications. `startUpdater({ isDeviceOpen })` returns `{ checkNow, deviceClosed }` |
| `electron/main.ts` | Opens the window first, then starts the updater inside a guard; owns the menu; tells the updater when the USB device closes |

`main.ts` already holds the open USB handle (`state`), so "is a Nord open" needs
nothing from the renderer.

`electron-updater` is bundled into `electron/dist/main.cjs` by the existing
esbuild step. If bundling breaks its loading of `app-update.yml`, mark it
`--external` and move it to `dependencies` so electron-builder packages it;
decide on evidence from the first pack.

**Menu.** The app used Electron's default menu. It is rebuilt from the same
standard roles with one added item — in the application menu on macOS, in Help
elsewhere — which keeps it identical across platforms and drops the default
Help links to electronjs.org. A designed menu belongs to spec 3.

**Logging.** Updater events go to a plain text file in the app's logs directory
(`app.getPath('logs')`), started fresh at each launch with the previous launch's
file kept beside it — after an update restarts the app, that is the only record
of the update. Each entry is cut to its first line: GitHub's errors can carry an
entire releases feed. No new logging dependency.

## Test hook: feed override

A real update needs two published releases, which do not exist before the first
one. For the rehearsal, the environment variable `OPENNORD_UPDATE_FEED` — when
set to a URL — points the updater at a generic feed at that URL instead of
GitHub. It is read once at startup and logged.

Risk: it redirects where updates come from. On macOS the downloaded app must
still pass the signature check against the running app, so a hostile feed cannot
install foreign code. On Windows, where builds are unsigned, anyone able to set
an environment variable for the app can already replace it. Accepted for now;
revisit when Windows signing lands.

## Known limits

- **Windows updates are unsigned.** Integrity rests on HTTPS to GitHub and the
  SHA-512 in `latest.yml`. SmartScreen may warn again after an update.
- **No rollback, no staged rollout, no "skip this version".** A bad release is
  fixed by publishing a higher version.
- **No downgrade.** The updater only moves to a higher version.
- **Version numbers must be plain `x.y.z`.** A pre-release version renames the
  feed files (`beta*.yml`), which the release command does not handle.

## Testing

- **Unit:** `update-policy.test.ts` — prompt suppressed while a device is open
  and released when it closes; asked once per version; manual-check outcomes.
- **Rehearsal on this Mac, before 0.1.0 is published:** install a signed
  `0.1.0`, serve a signed `0.1.1` build's zip and `latest-mac.yml` from a local
  folder, launch `0.1.0` with `OPENNORD_UPDATE_FEED`, and watch it download,
  prompt, restart and report `0.1.1`. Also confirm the Applications offer by
  launching from the dmg.
- **Not testable here:** the Windows update path. It needs a Windows machine,
  working CI, and two builds. It is a release blocker for announcing, not for
  merging.

## Out of scope

- In-app (React) update UI, release notes display, update preferences.
- Windows code signing, differential-update tuning, Linux.
- Everything in spec 3.

## Changes to spec 1 artifacts

- `electron/README.md` gains an "Updates" section: how it behaves, the log file
  location, and the rehearsal procedure.
- The release checklist's step 4 adds: confirm the previous version updates to
  this one before publishing the draft — once a previous version exists.
