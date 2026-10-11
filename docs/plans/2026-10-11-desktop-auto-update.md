# Desktop Auto-Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A packaged OpenNord desktop app checks the public repo's Releases, downloads a newer version in the background, and offers to restart into it through a native dialog — never while a Nord is open.

**Architecture:** Everything lives in the Electron main process so a release with a broken web app can still be repaired. Decisions are pure functions in `electron/update-policy.ts` (unit-tested, no Electron import); `electron/menu.ts` builds the menu template as plain data; `electron/updater.ts` wires `electron-updater`, dialogs and timers to those decisions; `electron/main.ts` starts it and reports USB closes.

**Tech Stack:** Electron 33, electron-updater 6, esbuild (bundles main), vitest.

**Spec:** `docs/specs/2026-10-11-desktop-auto-update-design.md` (paths relative to `packages/core`).

## Global Constraints

- No preload or React (`src/`) changes.
- Packaged builds only: nothing checks or prompts when `app.isPackaged` is false.
- First check 10 s after ready, then every 4 h.
- Automatic checks never show an error dialog. Only **Check for Updates…** does.
- The ready prompt is never shown while the USB device is open; the app never restarts unless the user picks **Restart now**.
- Stable channel only (`allowPrerelease = false`, `allowDowngrade = false`).
- Dialog copy speaks to a player: no "feed", "asar", "Squirrel".
- `electron-updater` is a **devDependency** bundled into `electron/dist/main.cjs` by esbuild. Never run `electron-rebuild`; the node-usb fences stay untouched.
- Install with `npm install --cache "$TMPDIR/npm-cache"` in `packages/core`; packs and commits run outside the sandbox.
- Gate before each commit: `npm run typecheck`, `npm run lint`, `npm test` with **no new failures** against the 30 known Node 26 `localStorage` failures.

## Review Focus

1. **Update finishes downloading mid-transfer** → no dialog appears until the device is closed; then it appears once. *(Task 1 tests.)*
2. **User picks Later, then another check runs four hours on** → not asked again for the same version in that run. *(Task 1 test.)*
3. **Manual check while a Nord is connected and an update is already downloaded** → told it installs on quit; not offered a restart. *(Task 1 test.)*
4. **Offline at launch** → no dialog, a log line, retried later; the manual check shows the error in plain words. *(Task 1 test for the outcome; Task 3 wiring.)*
5. **`OPENNORD_UPDATE_FEED` set to junk** → ignored and logged, GitHub feed stays in force; it must not crash startup. *(Task 1 test.)*

## File Structure

| File | Responsibility |
| --- | --- |
| `electron/update-policy.ts` (create) | Pure decisions and constants |
| `electron/update-policy.test.ts` (create) | Their tests |
| `electron/menu.ts` (create) | Menu template as plain data, with the Check for Updates item |
| `electron/menu.test.ts` (create) | Its tests |
| `electron/updater.ts` (create) | Electron + electron-updater wiring |
| `electron/main.ts` (modify) | Start the updater; report device close |
| `electron/tsconfig.json` (create) | Type-check the main-process sources, which the web tsconfig excludes |
| `package.json` (modify) | devDependency, `typecheck:electron` script |
| `electron/README.md` (modify) | "Updates" section; release checklist line |

---

### Task 1: Update policy

**Files:**
- Create: `electron/update-policy.ts`, `electron/update-policy.test.ts`

**Interfaces:**
- Produces (exported from `electron/update-policy.ts`):
  - `FIRST_CHECK_DELAY_MS = 10_000`, `CHECK_INTERVAL_MS = 14_400_000`
  - `versionToPrompt(s: { readyVersion: string | null; askedVersion: string | null; deviceOpen: boolean }): string | null`
  - `type ManualOutcome = { kind: 'up-to-date'; current: string } | { kind: 'downloading'; version: string } | { kind: 'ready'; version: string } | { kind: 'ready-on-quit'; version: string } | { kind: 'error'; message: string }`
  - `manualCheckOutcome(i: { current: string; available: string | null; readyVersion: string | null; deviceOpen: boolean; error: string | null }): ManualOutcome`
  - `manualCheckMessage(o: ManualOutcome): { message: string; detail: string }`
  - `shouldOfferMove(i: { platform: string; packaged: boolean; inApplications: boolean }): boolean`
  - `feedOverride(env: Record<string, string | undefined>): string | null`

- [ ] **Step 1: Write the failing tests**

Create `electron/update-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, feedOverride, manualCheckMessage, manualCheckOutcome,
  shouldOfferMove, versionToPrompt,
} from './update-policy';

describe('timing', () => {
  it('checks soon after launch, then every four hours', () => {
    expect(FIRST_CHECK_DELAY_MS).toBe(10_000);
    expect(CHECK_INTERVAL_MS).toBe(4 * 60 * 60 * 1000);
  });
});

describe('versionToPrompt', () => {
  const idle = { readyVersion: null, askedVersion: null, deviceOpen: false };

  it('has nothing to ask before a download is ready', () => {
    expect(versionToPrompt(idle)).toBeNull();
  });
  it('asks once a download is ready', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0' })).toBe('0.2.0');
  });
  it('holds the question while a Nord is open', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0', deviceOpen: true })).toBeNull();
  });
  it('asks when the Nord is closed again', () => {
    const during = { ...idle, readyVersion: '0.2.0', deviceOpen: true };
    expect(versionToPrompt({ ...during, deviceOpen: false })).toBe('0.2.0');
  });
  it('does not ask twice for the same version in one run', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0', askedVersion: '0.2.0' })).toBeNull();
  });
  it('asks again when a newer version arrives after Later', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.3.0', askedVersion: '0.2.0' })).toBe('0.3.0');
  });
});

describe('manualCheckOutcome', () => {
  const base = { current: '0.1.0', available: null, readyVersion: null, deviceOpen: false, error: null };

  it('reports up to date', () => {
    expect(manualCheckOutcome(base)).toEqual({ kind: 'up-to-date', current: '0.1.0' });
  });
  it('reports a download in progress', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0' })).toEqual({ kind: 'downloading', version: '0.2.0' });
  });
  it('offers the restart when the download is ready', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', readyVersion: '0.2.0' })).toEqual({ kind: 'ready', version: '0.2.0' });
  });
  it('does not offer a restart while a Nord is open', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', readyVersion: '0.2.0', deviceOpen: true }))
      .toEqual({ kind: 'ready-on-quit', version: '0.2.0' });
  });
  it('reports the error, ahead of anything else', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', error: 'net::ERR_INTERNET_DISCONNECTED' }))
      .toEqual({ kind: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
  });
});

describe('manualCheckMessage', () => {
  it('names the current version when up to date', () => {
    expect(manualCheckMessage({ kind: 'up-to-date', current: '0.1.0' }).detail).toContain('0.1.0');
  });
  it('names the version being downloaded', () => {
    expect(manualCheckMessage({ kind: 'downloading', version: '0.2.0' }).message).toContain('0.2.0');
  });
  it('tells a connected player the update waits for them', () => {
    expect(manualCheckMessage({ kind: 'ready-on-quit', version: '0.2.0' }).detail).toMatch(/quit/i);
  });
  it('explains a failure in plain words and keeps the technical reason', () => {
    const { message, detail } = manualCheckMessage({ kind: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
    expect(message).toMatch(/couldn.t check/i);
    expect(detail).toContain('net::ERR_INTERNET_DISCONNECTED');
  });
  it('never uses updater jargon', () => {
    const outcomes = [
      { kind: 'up-to-date', current: '0.1.0' }, { kind: 'downloading', version: '0.2.0' },
      { kind: 'ready', version: '0.2.0' }, { kind: 'ready-on-quit', version: '0.2.0' },
      { kind: 'error', message: 'x' },
    ] as const;
    for (const o of outcomes) {
      const { message, detail } = manualCheckMessage(o);
      expect(`${message} ${detail.replace('x', '')}`).not.toMatch(/feed|asar|squirrel|yml/i);
    }
  });
});

describe('shouldOfferMove', () => {
  it('offers on a packaged Mac app outside Applications', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: true, inApplications: false })).toBe(true);
  });
  it('does not offer once it is in Applications', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: true, inApplications: true })).toBe(false);
  });
  it('does not offer in development', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: false, inApplications: false })).toBe(false);
  });
  it('does not offer on Windows', () => {
    expect(shouldOfferMove({ platform: 'win32', packaged: true, inApplications: false })).toBe(false);
  });
});

describe('feedOverride', () => {
  it('is off by default', () => expect(feedOverride({})).toBeNull());
  it('accepts an http(s) URL', () => {
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'http://localhost:8765/' })).toBe('http://localhost:8765/');
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'https://example.test/feed' })).toBe('https://example.test/feed');
  });
  it('ignores junk rather than breaking startup', () => {
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'not a url' })).toBeNull();
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'file:///etc' })).toBeNull();
    expect(feedOverride({ OPENNORD_UPDATE_FEED: '' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run electron/update-policy.test.ts`
Expected: FAIL — cannot resolve `./update-policy`.

- [ ] **Step 3: Implement**

Create `electron/update-policy.ts`:

```ts
/**
 * Auto-update decisions, as pure functions. No Electron import, so they are
 * unit-tested directly (update-policy.test.ts); electron/updater.ts wires them
 * to electron-updater, dialogs and timers. See
 * docs/specs/2026-10-11-desktop-auto-update-design.md.
 */

/** Wait this long after launch before the first check, so startup stays quick. */
export const FIRST_CHECK_DELAY_MS = 10_000;
export const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export interface PromptState {
  /** Version whose download has finished, or null. */
  readyVersion: string | null;
  /** Version the player was already asked about in this run, or null. */
  askedVersion: string | null;
  /** True while the Nord's USB interface is open. */
  deviceOpen: boolean;
}

/**
 * The version to offer a restart for right now, or null. Held back while a
 * Nord is open — a dialog in the middle of a transfer is the one thing an
 * updater must not do — and asked once per version per run.
 */
export function versionToPrompt(s: PromptState): string | null {
  if (!s.readyVersion || s.deviceOpen || s.askedVersion === s.readyVersion) return null;
  return s.readyVersion;
}

export type ManualOutcome =
  | { kind: 'up-to-date'; current: string }
  | { kind: 'downloading'; version: string }
  | { kind: 'ready'; version: string }
  | { kind: 'ready-on-quit'; version: string }
  | { kind: 'error'; message: string };

/** What "Check for Updates…" should tell the player. */
export function manualCheckOutcome(i: {
  current: string;
  available: string | null;
  readyVersion: string | null;
  deviceOpen: boolean;
  error: string | null;
}): ManualOutcome {
  if (i.error) return { kind: 'error', message: i.error };
  if (i.readyVersion) return { kind: i.deviceOpen ? 'ready-on-quit' : 'ready', version: i.readyVersion };
  if (i.available) return { kind: 'downloading', version: i.available };
  return { kind: 'up-to-date', current: i.current };
}

/** Dialog copy for a manual check. `ready` is shown through the restart prompt instead. */
export function manualCheckMessage(o: ManualOutcome): { message: string; detail: string } {
  switch (o.kind) {
    case 'up-to-date':
      return { message: 'OpenNord is up to date.', detail: `You have version ${o.current}.` };
    case 'downloading':
      return { message: `Downloading OpenNord ${o.version}…`, detail: 'You can keep working. You’ll be asked to restart when it’s ready.' };
    case 'ready':
      return { message: `OpenNord ${o.version} is ready to install.`, detail: 'Restart to finish updating.' };
    case 'ready-on-quit':
      return { message: `OpenNord ${o.version} is ready to install.`, detail: 'Your Nord is connected, so nothing will restart now. The update installs when you quit OpenNord.' };
    case 'error':
      return { message: 'OpenNord couldn’t check for updates.', detail: `Check your internet connection and try again.\n\n${o.message}` };
  }
}

/** macOS can only replace the app in place when it runs from an Applications folder. */
export function shouldOfferMove(i: { platform: string; packaged: boolean; inApplications: boolean }): boolean {
  return i.platform === 'darwin' && i.packaged && !i.inApplications;
}

/**
 * Test hook: OPENNORD_UPDATE_FEED redirects the updater to a plain http(s)
 * folder, for rehearsing an update before two real releases exist. Anything
 * that is not an http(s) URL is ignored, so a stray value cannot break startup.
 */
export function feedOverride(env: Record<string, string | undefined>): string | null {
  const raw = env.OPENNORD_UPDATE_FEED;
  if (!raw) return null;
  try {
    const { protocol } = new URL(raw);
    return protocol === 'http:' || protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run electron/update-policy.test.ts`
Expected: all passed (24 tests).

- [ ] **Step 5: Commit**

```bash
git add electron/update-policy.ts electron/update-policy.test.ts
git commit -m "feat(electron): auto-update policy — when to prompt, what a manual check says"
```

---

### Task 2: Menu template

**Files:**
- Create: `electron/menu.ts`, `electron/menu.test.ts`

**Interfaces:**
- Produces: `buildMenuTemplate(i: { mac: boolean; appName: string; onCheckForUpdates: () => void }): MenuTemplateItem[]` where `MenuTemplateItem = { label?: string; role?: string; type?: 'separator'; click?: () => void; submenu?: MenuTemplateItem[] }`. The result is structurally a valid `Electron.MenuItemConstructorOptions[]`.

- [ ] **Step 1: Write the failing tests**

Create `electron/menu.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { buildMenuTemplate, type MenuTemplateItem } from './menu';

const find = (items: MenuTemplateItem[], label: string): MenuTemplateItem | undefined =>
  items.flatMap((i) => [i, ...(i.submenu ?? [])]).find((i) => i.label === label);

describe('buildMenuTemplate', () => {
  it('puts Check for Updates in the app menu on macOS, right under About', () => {
    const template = buildMenuTemplate({ mac: true, appName: 'OpenNord', onCheckForUpdates: () => {} });
    expect(template[0].label).toBe('OpenNord');
    expect(template[0].submenu?.[0].role).toBe('about');
    expect(template[0].submenu?.[1].label).toBe('Check for Updates…');
  });

  it('puts it in Help elsewhere, and has no app menu', () => {
    const template = buildMenuTemplate({ mac: false, appName: 'OpenNord', onCheckForUpdates: () => {} });
    expect(template[0].role).toBe('fileMenu');
    const help = template.find((i) => i.role === 'help');
    expect(help?.submenu?.[0].label).toBe('Check for Updates…');
  });

  it('runs the check when the item is clicked', () => {
    const onCheckForUpdates = vi.fn();
    for (const mac of [true, false]) {
      find(buildMenuTemplate({ mac, appName: 'OpenNord', onCheckForUpdates }), 'Check for Updates…')?.click?.();
    }
    expect(onCheckForUpdates).toHaveBeenCalledTimes(2);
  });

  it('keeps the standard edit, view and window menus (copy/paste, reload, zoom)', () => {
    for (const mac of [true, false]) {
      const roles = buildMenuTemplate({ mac, appName: 'OpenNord', onCheckForUpdates: () => {} }).map((i) => i.role);
      expect(roles).toEqual(expect.arrayContaining(['editMenu', 'viewMenu', 'windowMenu']));
    }
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run electron/menu.test.ts`
Expected: FAIL — cannot resolve `./menu`.

- [ ] **Step 3: Implement**

Create `electron/menu.ts`:

```ts
/**
 * The application menu, as plain data (no Electron import, so it is tested
 * directly). It is Electron's default menu rebuilt from roles, plus one item:
 * "Check for Updates…". Rebuilding rather than patching the default keeps the
 * result the same on every platform and drops the default Help links to
 * electronjs.org. A designed menu is a later job.
 */
export interface MenuTemplateItem {
  label?: string;
  role?: string;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuTemplateItem[];
}

export function buildMenuTemplate(i: { mac: boolean; appName: string; onCheckForUpdates: () => void }): MenuTemplateItem[] {
  const check: MenuTemplateItem = { label: 'Check for Updates…', click: () => i.onCheckForUpdates() };
  const sep: MenuTemplateItem = { type: 'separator' };

  const appMenu: MenuTemplateItem = {
    label: i.appName,
    submenu: [
      { role: 'about' }, check, sep,
      { role: 'services' }, sep,
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, sep,
      { role: 'quit' },
    ],
  };

  return [
    ...(i.mac ? [appMenu] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    { role: 'help', submenu: i.mac ? [] : [check] },
  ];
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run electron/menu.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add electron/menu.ts electron/menu.test.ts
git commit -m "feat(electron): application menu with Check for Updates"
```

---

### Task 3: Wire the updater into the main process

**Files:**
- Create: `electron/updater.ts`, `electron/tsconfig.json`
- Modify: `electron/main.ts`, `package.json`

**Interfaces:**
- Consumes: everything Tasks 1 and 2 export.
- Produces: `startUpdater(deps: { isDeviceOpen: () => boolean }): { deviceClosed(): void }` from `electron/updater.ts`.

This task has no unit test of its own: it is Electron wiring. Its gates are the type-check added here, the existing suites, a real pack, and the rehearsal in Task 4.

- [ ] **Step 1: Add the dependency and the type-check**

Run: `npm install --save-dev electron-updater@^6.8.9 --cache "$TMPDIR/npm-cache"`

Create `electron/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["*.ts"],
  "exclude": ["*.test.ts"]
}
```

Add to `package.json` scripts, after `typecheck`:

```json
"typecheck:electron": "tsc --noEmit -p electron/tsconfig.json",
```

Run: `npm run typecheck:electron`
Expected: passes on the existing `main.ts` and `preload.ts`. If it reports errors in code this plan does not touch, record them, fix only what is trivial and safe (unused variable, missing type), and ledger a ruling for the rest rather than widening the task.

- [ ] **Step 2: Create `electron/updater.ts`**

```ts
/**
 * Auto-update wiring (docs/specs/2026-10-11-desktop-auto-update-design.md).
 *
 * Everything here runs in the main process on purpose: an updater that needed
 * the web app could not repair a release whose web app fails to load.
 *
 * The decisions live in update-policy.ts (tested); this file only connects them
 * to electron-updater, native dialogs, the menu and timers.
 */
import { app, dialog, Menu, type MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMenuTemplate } from './menu';
import {
  CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, feedOverride, manualCheckMessage, manualCheckOutcome,
  shouldOfferMove, versionToPrompt,
} from './update-policy';

export interface UpdaterHandle {
  /** Call when the Nord's USB interface has been closed: a held-back prompt can now show. */
  deviceClosed(): void;
}

export function startUpdater(deps: { isDeviceOpen: () => boolean }): UpdaterHandle {
  let readyVersion: string | null = null;
  let availableVersion: string | null = null;
  let askedVersion: string | null = null;
  let lastError: string | null = null;
  let prompting = false;

  // One plain-text log per launch, next to the OS's other app logs.
  const logFile = join(app.getPath('logs'), 'updater.log');
  const log = (line: string): void => {
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`);
    } catch {
      /* logging must never break the app */
    }
  };
  try {
    mkdirSync(app.getPath('logs'), { recursive: true });
    writeFileSync(logFile, '');
  } catch {
    /* same */
  }

  const maybePrompt = async (): Promise<void> => {
    if (prompting) return;
    const version = versionToPrompt({ readyVersion, askedVersion, deviceOpen: deps.isDeviceOpen() });
    if (!version) return;
    prompting = true;
    askedVersion = version;
    try {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
        message: `OpenNord ${version} is ready to install.`,
        detail: 'Restart to finish updating. If you choose Later, it installs when you quit.',
      });
      // Re-check: a Nord may have been connected while the dialog was up.
      if (response === 0 && !deps.isDeviceOpen()) {
        log(`restarting into ${version}`);
        autoUpdater.quitAndInstall();
      }
    } finally {
      prompting = false;
    }
  };

  const check = async (): Promise<void> => {
    lastError = null;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      log(`check failed: ${lastError}`);
    }
  };

  const manualCheck = async (): Promise<void> => {
    await check();
    const outcome = manualCheckOutcome({
      current: app.getVersion(), available: availableVersion, readyVersion, deviceOpen: deps.isDeviceOpen(), error: lastError,
    });
    if (outcome.kind === 'ready') {
      askedVersion = null; // the player asked, so ask again even after an earlier Later
      await maybePrompt();
      return;
    }
    await dialog.showMessageBox({ type: outcome.kind === 'error' ? 'warning' : 'info', buttons: ['OK'], ...manualCheckMessage(outcome) });
  };

  // The menu is useful in every build; in development the item explains itself.
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate({
    mac: process.platform === 'darwin',
    appName: app.name,
    onCheckForUpdates: () => {
      if (app.isPackaged) void manualCheck();
      else void dialog.showMessageBox({ type: 'info', buttons: ['OK'], message: 'Updates are only available in the installed app.', detail: 'This is a development build.' });
    },
  }) as MenuItemConstructorOptions[]));

  if (!app.isPackaged) return { deviceClosed: () => {} };

  // macOS replaces the app in place, which it cannot do from the disk image or
  // a quarantined download location. Offer the move on every such launch.
  if (shouldOfferMove({ platform: process.platform, packaged: app.isPackaged, inApplications: process.platform === 'darwin' && app.isInApplicationsFolder() })) {
    void dialog.showMessageBox({
      type: 'question',
      buttons: ['Move to Applications', 'Not now'],
      defaultId: 0,
      cancelId: 1,
      message: 'Move OpenNord to your Applications folder?',
      detail: 'OpenNord can only keep itself up to date when it runs from Applications.',
    }).then(({ response }) => {
      if (response !== 0) return;
      try {
        app.moveToApplicationsFolder();
      } catch (error) {
        log(`move to Applications failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.logger = {
    info: (m: unknown) => log(`info ${String(m)}`),
    warn: (m: unknown) => log(`warn ${String(m)}`),
    error: (m: unknown) => log(`error ${String(m)}`),
    debug: () => {},
  };

  const override = feedOverride(process.env);
  if (override) {
    log(`TEST FEED in use: ${override}`);
    autoUpdater.setFeedURL({ provider: 'generic', url: override });
  } else if (process.env.OPENNORD_UPDATE_FEED) {
    log('OPENNORD_UPDATE_FEED ignored: not an http(s) URL');
  }

  autoUpdater.on('update-available', (info) => {
    availableVersion = info.version;
    log(`available ${info.version}`);
  });
  autoUpdater.on('update-not-available', () => {
    availableVersion = null;
  });
  autoUpdater.on('update-downloaded', (info) => {
    readyVersion = info.version;
    log(`downloaded ${info.version}`);
    void maybePrompt();
  });
  autoUpdater.on('error', (error) => {
    lastError = error.message;
    log(`error ${error.message}`);
  });

  log(`OpenNord ${app.getVersion()} — updater started`);
  setTimeout(() => void check(), FIRST_CHECK_DELAY_MS);
  setInterval(() => void check(), CHECK_INTERVAL_MS);

  return { deviceClosed: () => void maybePrompt() };
}
```

- [ ] **Step 3: Start it from `electron/main.ts`**

Add the import under the existing `usb` import:

```ts
import { startUpdater, type UpdaterHandle } from './updater';
```

Add under `let state: OpenState | null = null;`:

```ts
let updater: UpdaterHandle | null = null;
```

In the `nord-usb:close` handler, tell the updater once the interface is released — replace:

```ts
        resolve();
      });
    }),
  );
}
```

with:

```ts
        resolve();
        // A restart prompt held back during the session can show now.
        updater?.deviceClosed();
      });
    }),
  );
}
```

In `app.whenReady().then(() => {`, after `registerUsbIpc();`:

```ts
  updater = startUpdater({ isDeviceOpen: () => state !== null });
```

- [ ] **Step 4: Type-check, bundle, and confirm the bundle contains the updater**

Run: `npm run typecheck:electron && npm run electron:build && grep -c "update-downloaded" electron/dist/main.cjs`
Expected: type-check passes; esbuild writes `main.cjs` and `preload.cjs` with no unresolved-import error; the grep count is at least 1.

If esbuild cannot bundle `electron-updater` (an unresolved or dynamic require): add `--external:electron-updater` to the `electron:build` script, move `electron-updater` from `devDependencies` to `dependencies`, and ledger the ruling.

- [ ] **Step 5: Pack and check the packaged app still starts headless**

Run: `npm run electron:pack`
Expected: pack succeeds, guard prints `→ prebuilds/darwin-x64+arm64, no build/ — OK`.

Run: `ls release/mac-universal/OpenNord.app/Contents/Resources/app-update.yml && cat release/mac-universal/OpenNord.app/Contents/Resources/app-update.yml`
Expected: the file exists and names `provider: github`, `owner: simonflore`, `repo: opennord`. This is what the updater reads at runtime.

- [ ] **Step 6: Gates and commit**

Run: `npm run typecheck && npm run typecheck:electron && npm run lint && npm test` (no new failures).

```bash
git add electron/updater.ts electron/tsconfig.json electron/main.ts package.json package-lock.json
git commit -m "feat(electron): auto-update — background download, native restart prompt, never mid-session"
```

---

### Task 4: Docs, then the update rehearsal

**Files:**
- Modify: `electron/README.md`

- [ ] **Step 1: Add an "Updates" section to `electron/README.md`, before `## Never run electron-rebuild`**

````markdown
## Updates

The packaged app updates itself from the public repo's Releases
(`electron/updater.ts`; decisions in `electron/update-policy.ts`). It runs
entirely in the main process, so a release whose web app fails to load can still
be repaired by the next one.

- Checks 10 s after launch and every 4 hours; downloads silently.
- When a download is ready, a native dialog offers **Restart now** or **Later**.
  Later installs on the next quit.
- The dialog is held back while a Nord is open, and the app never restarts by
  itself.
- Automatic checks fail quietly. **Check for Updates…** (app menu on macOS, Help
  elsewhere) always answers, including with the error.
- Only published, non-pre-release versions with a plain `x.y.z` number are seen.
- On macOS the app must run from Applications to update; it offers to move
  itself on launch.
- Log: `updater.log` in the app's log folder (`~/Library/Logs/OpenNord/` on
  macOS, `%APPDATA%\OpenNord\logs\` on Windows), rewritten each launch.

Windows updates are unsigned for now: their integrity rests on HTTPS to GitHub
and the checksum in `latest.yml`.

### Rehearsing an update

`OPENNORD_UPDATE_FEED=<http url>` points the updater at a plain folder instead of
GitHub. To watch one version update to the next on a Mac:

1. Pack the current version and copy `release/mac-universal/OpenNord.app` into
   an Applications folder.
2. Pack again as a higher version without touching `package.json`:
   `node scripts/usb-native-guard.mjs clean && npm run build:electron && npm run electron:build && npx electron-builder --mac --universal --publish never -c.extraMetadata.version=<higher>`
3. Serve it: `python3 -m http.server 8765 --directory release`
4. Launch the installed app from a terminal with
   `OPENNORD_UPDATE_FEED=http://localhost:8765 /path/to/OpenNord.app/Contents/MacOS/OpenNord`,
   wait for the prompt, choose Restart now, and check the version in About.
````

In the Releasing checklist, change step 4 to:

```markdown
4. Install both builds on clean machines — including an Intel Mac — and connect
   a Nord. Once a previous release exists, also confirm that it updates to this
   one (see "Rehearsing an update") before publishing.
```

- [ ] **Step 2: Commit the docs**

```bash
git add electron/README.md
git commit -m "docs(electron): how updates behave and how to rehearse one"
```

- [ ] **Step 3: Prepare the rehearsal builds**

```bash
npm run electron:pack
mkdir -p ~/Applications && rm -rf ~/Applications/OpenNord.app && cp -R release/mac-universal/OpenNord.app ~/Applications/
node scripts/usb-native-guard.mjs clean && npm run build:electron && npm run electron:build && npx electron-builder --mac --universal --publish never -c.extraMetadata.version=0.1.1
grep '^version' release/latest-mac.yml
```

Expected: `version: 0.1.1`, and `~/Applications/OpenNord.app` is the `0.1.0` build. (`~/Applications` counts as an Applications folder and keeps the test out of the system one.)

- [ ] **Step 4: Run the rehearsal — needs a person at the screen**

Start the feed in the background: `python3 -m http.server 8765 --directory release`
Launch: `OPENNORD_UPDATE_FEED=http://localhost:8765 ~/Applications/OpenNord.app/Contents/MacOS/OpenNord`

Expected, in order: the app opens; within about a minute a dialog says *OpenNord 0.1.1 is ready to install*; **Restart now** relaunches it; the OpenNord → About panel shows 0.1.1; `~/Library/Logs/OpenNord/updater.log` contains `TEST FEED in use`, `available 0.1.1`, `downloaded 0.1.1`, `restarting into 0.1.1`.

Also check: **Check for Updates…** after the update reports *up to date*; launching the app from `release/OpenNord-mac.dmg` (mounted) shows the Move to Applications offer.

If the download fails with a signature or "code object is not signed" error, the two builds were signed differently — confirm both packs logged the same `identity=`. Record what happened in the ledger either way; this step is the only end-to-end evidence the plan produces.

- [ ] **Step 5: Clean up**

```bash
rm -rf ~/Applications/OpenNord.app
```

Stop the http server. `release/` is gitignored; leave it.

---

## After the plan

Push to the existing PR branch. The Windows update path stays unverified until CI can build an installer and someone runs two versions on Windows; that blocks announcing, not merging.
