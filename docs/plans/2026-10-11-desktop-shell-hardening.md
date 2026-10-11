# Desktop Shell Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the desktop shell to a supported Electron, confine the web page inside it (links, navigation, permissions, sandbox, IPC), notice an unplugged Nord, and finish the app's basics (single instance, window memory, icon).

**Architecture:** Decisions are pure functions in `electron/shell-policy.ts`, tested without Electron. The USB IPC moves out of `main.ts` into `electron/nord-usb.ts`, which also owns unplug detection; `electron/window-state.ts` persists bounds; `main.ts` is left as startup wiring that applies the policy through Electron's hooks.

**Tech Stack:** Electron 44, node-usb 2, electron-builder 25 (unchanged), vitest.

**Spec:** `docs/specs/2026-10-11-desktop-shell-hardening-design.md` (paths relative to `packages/core`).

## Global Constraints

- `electron-builder` stays on 25 and `electron-updater` stays put, unless a pack fails on Electron 44.
- No `src/` (web app) or preload API changes. `window.nordNativeUsb` keeps its exact shape.
- Never run `electron-rebuild`; the node-usb fences and `--publish never` stay.
- External URLs open in the system browser only when `https:`. Nothing else is opened, anywhere.
- Allowed permissions, exactly: `midi`, `clipboard-sanitized-write`, `fileSystem` — and only for the app's own origin.
- The unplug message, exactly: `Your Nord was disconnected.`
- Icon: graphite ground, the single accent `#ff6a1a`, no Nord trademark and no keyboard likeness. **The drawing needs the owner's approval before it is wired in.**
- Gate before each commit: `npm run typecheck` (covers `electron/`), `npm run lint`, `npm test` with no new failures against the 30 known Node 26 `localStorage` failures.
- Packs and commits run outside the sandbox; `npm install` uses `--cache "$TMPDIR/npm-cache"`.

## Review Focus

1. **A look-alike URL** (`file:///…/evil/dist/index.html`, `https://localhost.evil.test`, the dev origin with another port) → not treated as the app; no navigation, no permission, no IPC. *(Task 2 tests.)*
2. **A link with a non-https scheme** (`http:`, `file:`, `javascript:`, `mailto:`, a custom scheme) → not opened at all. *(Task 2 tests.)*
3. **Saved window bounds on a display that is gone, or a corrupt state file** → the app opens at the default size on a visible screen. *(Task 2 and Task 4 tests.)*
4. **The Nord is unplugged mid-transfer** → the in-flight and next calls fail with the disconnect message, and reconnecting works without restarting the app. *(Task 3 unit test for the message choice; hardware test in Task 6.)*
5. **A feature silently broken by the sandbox or the permission list** (MIDI input, folder picker, copy buttons) → caught by the packed-app pass in Task 6, fixed with a commented allow-list entry.

## File Structure

| File | Responsibility |
| --- | --- |
| `electron/shell-policy.ts` (create) | Pure decisions |
| `electron/shell-policy.test.ts` (create) | Their tests |
| `electron/nord-usb.ts` (create) | USB IPC handlers, open state, unplug detection (moved from `main.ts`) |
| `electron/window-state.ts`, `.test.ts` (create) | Bounds file read/write |
| `electron/main.ts` (rewrite) | Startup wiring |
| `electron/icon/icon.svg`, `icon.png` (create) | Icon source and its 1024 px render |
| `scripts/make-icons.mjs` (create) | Renders the SVG with Electron itself |
| `package.json` (modify) | Electron version, `build.mac.icon` / `build.win.icon`, `icons` script |
| `electron/README.md` (modify) | What the shell enforces |

---

### Task 1: Confirm the child-window finding, then Electron 33 → 44

**Files:** Modify `package.json`, `package-lock.json`.

- [ ] **Step 1: Record what a `target="_blank"` link does today (evidence for the spec's claim)**

Pack the current tree (`npm run electron:pack`), then start the packed app with a debug port and inspect it from a scratch script. Create `$TMPDIR/cdp.mjs`:

```js
// Minimal Chrome DevTools Protocol client for poking a running Electron app.
// usage: node cdp.mjs <port> '<js expression evaluated in the first page>'
const [port, expression] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const pages = targets.filter((t) => t.type === 'page');
console.log('pages:', pages.map((p) => p.url));
if (expression) {
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
  const reply = await new Promise((r) => ws.addEventListener('message', (m) => r(JSON.parse(m.data))));
  console.log('result:', JSON.stringify(reply.result?.result?.value ?? reply.result ?? reply));
  ws.close();
}
```

Run:

```bash
release/mac-universal/OpenNord.app/Contents/MacOS/OpenNord --remote-debugging-port=9333 &
node "$TMPDIR/cdp.mjs" 9333 "window.open('https://example.com/', '_blank') ? 'opened' : 'blocked'"
node "$TMPDIR/cdp.mjs" 9333
```

Then evaluate `typeof window.nordNativeUsb` against the example.com page (pass its index by editing `pages[0]` to the matching page). Record in the ledger: how many pages exist after the `window.open`, and whether the child page has `nordNativeUsb`. Quit the app (`pkill -f mac-universal/OpenNord.app`). This is a finding to report, whichever way it comes out; the lockdown is needed either way.

- [ ] **Step 2: Upgrade**

Run: `npm install --save-dev electron@^44 --cache "$TMPDIR/npm-cache"`
Expected: `package.json` shows `"electron": "^44.x"`; `node_modules/electron/dist` holds the new binary.

- [ ] **Step 3: Type-check and test**

Run: `npm run typecheck && npx vitest run electron scripts`
Expected: passes. Fix any Electron API type changes in `electron/*.ts` at their source (do not cast them away); ledger each one.

- [ ] **Step 4: Pack and smoke the packed app**

Run: `npm run electron:pack`
Expected: pack succeeds, guard prints `→ prebuilds/darwin-x64+arm64, no build/ — OK`, signing uses the Developer ID identity.

```bash
release/mac-universal/OpenNord.app/Contents/MacOS/OpenNord --remote-debugging-port=9333 &
node "$TMPDIR/cdp.mjs" 9333 "JSON.stringify({ usb: typeof window.nordNativeUsb, hash: location.hash, title: document.title, chrome: navigator.userAgent.match(/Chrome\/\d+/)[0] })"
node "$TMPDIR/cdp.mjs" 9333 "window.nordNativeUsb.backend().then((b) => JSON.stringify(b))"
node "$TMPDIR/cdp.mjs" 9333 "window.nordNativeUsb.list().then((l) => 'devices: ' + l.length)"
pkill -f mac-universal/OpenNord.app
```

Expected: `usb: "object"`, the hash is `#/library/programs`, a Chrome version well above 130, `backend` returns `{"platform":"darwin","usbDkActive":false}`, and `list` resolves (proving node-usb's prebuild loads under Electron 44).

If the pack or the native module fails on 44: step back one major at a time (`electron@^43`, …) until it works, and ledger which major and why.

- [ ] **Step 5: Gates and commit**

```bash
git add package.json package-lock.json
git commit -m "chore(electron): Electron 33 → 44"
```

---

### Task 2: Shell policy

**Files:** Create `electron/shell-policy.ts`, `electron/shell-policy.test.ts`.

**Interfaces — produces:**
- `interface AppLocation { fileUrl: string; devOrigin: string | null }`
- `isAppUrl(url: string, app: AppLocation): boolean` — exact document match, for navigation and IPC senders
- `isAppOrigin(urlOrOrigin: string, app: AppLocation): boolean` — origin-level, for permission checks
- `externalUrlToOpen(url: string): string | null`
- `ALLOWED_PERMISSIONS: readonly string[]`, `isPermissionAllowed(permission: string, requester: string, app: AppLocation): boolean`
- `interface Bounds { x: number; y: number; width: number; height: number }`, `DEFAULT_SIZE`, `usableBounds(saved: unknown, displays: Bounds[]): Bounds | null`
- `DISCONNECTED_MESSAGE`, `notOpenMessage(wasUnplugged: boolean): string`

- [ ] **Step 1: Write the failing tests**

Create `electron/shell-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_PERMISSIONS, DEFAULT_SIZE, externalUrlToOpen, isAppOrigin, isAppUrl, isPermissionAllowed,
  notOpenMessage, usableBounds,
} from './shell-policy';

const packed = { fileUrl: 'file:///Applications/OpenNord.app/Contents/Resources/app.asar/dist/index.html', devOrigin: null };
const dev = { fileUrl: packed.fileUrl, devOrigin: 'http://localhost:5173' };

describe('isAppUrl', () => {
  it('recognises the packed app, with any hash route', () => {
    expect(isAppUrl(packed.fileUrl, packed)).toBe(true);
    expect(isAppUrl(`${packed.fileUrl}#/library/programs`, packed)).toBe(true);
  });
  it('recognises the dev server only when one is configured', () => {
    expect(isAppUrl('http://localhost:5173/#/device', dev)).toBe(true);
    expect(isAppUrl('http://localhost:5173/#/device', packed)).toBe(false);
  });
  it('rejects look-alikes', () => {
    expect(isAppUrl('file:///Users/x/evil/dist/index.html', packed)).toBe(false);
    expect(isAppUrl('file:///Applications/OpenNord.app/Contents/Resources/app.asar/dist/other.html', packed)).toBe(false);
    expect(isAppUrl('http://localhost:5174/', dev)).toBe(false);
    expect(isAppUrl('https://localhost:5173/', dev)).toBe(false);
    expect(isAppUrl('http://localhost.evil.test:5173/', dev)).toBe(false);
  });
  it('rejects the web and garbage', () => {
    expect(isAppUrl('https://www.nordkeyboards.com/', packed)).toBe(false);
    expect(isAppUrl('not a url', packed)).toBe(false);
    expect(isAppUrl('', packed)).toBe(false);
  });
});

describe('isAppOrigin', () => {
  it('treats the file origin as the app (navigation is what keeps other files out)', () => {
    expect(isAppOrigin('file:///', packed)).toBe(true);
    expect(isAppOrigin(packed.fileUrl, packed)).toBe(true);
  });
  it('treats the dev origin as the app only in development', () => {
    expect(isAppOrigin('http://localhost:5173', dev)).toBe(true);
    expect(isAppOrigin('http://localhost:5173/', packed)).toBe(false);
  });
  it('rejects the web and garbage', () => {
    expect(isAppOrigin('https://example.com', dev)).toBe(false);
    expect(isAppOrigin('null', packed)).toBe(false);
  });
});

describe('externalUrlToOpen', () => {
  it('passes https links to the browser', () => {
    expect(externalUrlToOpen('https://www.nordkeyboards.com/sound-libraries')).toBe('https://www.nordkeyboards.com/sound-libraries');
  });
  it('opens nothing else', () => {
    for (const url of ['http://example.com/', 'file:///etc/passwd', 'javascript:alert(1)', 'mailto:a@b.c', 'opennord://x', 'smb://host/share', 'not a url', '']) {
      expect(externalUrlToOpen(url)).toBeNull();
    }
  });
});

describe('isPermissionAllowed', () => {
  it('allows exactly what the app uses', () => {
    expect([...ALLOWED_PERMISSIONS].sort()).toEqual(['clipboard-sanitized-write', 'fileSystem', 'midi']);
    for (const p of ALLOWED_PERMISSIONS) expect(isPermissionAllowed(p, 'file:///', packed)).toBe(true);
  });
  it('refuses everything else, including raw device access and sysex', () => {
    for (const p of ['midiSysex', 'usb', 'hid', 'serial', 'media', 'geolocation', 'notifications', 'clipboard-read', 'openExternal', 'unknown']) {
      expect(isPermissionAllowed(p, 'file:///', packed)).toBe(false);
    }
  });
  it('refuses an allowed permission to anyone but the app', () => {
    expect(isPermissionAllowed('midi', 'https://example.com', packed)).toBe(false);
  });
});

describe('usableBounds', () => {
  const laptop = { x: 0, y: 0, width: 1512, height: 944 };
  const external = { x: 1512, y: -200, width: 2560, height: 1415 };

  it('keeps bounds that are on a connected display', () => {
    const saved = { x: 100, y: 80, width: 1300, height: 800 };
    expect(usableBounds(saved, [laptop])).toEqual(saved);
  });
  it('keeps bounds on a second display', () => {
    const saved = { x: 1800, y: 0, width: 1400, height: 900 };
    expect(usableBounds(saved, [laptop, external])).toEqual(saved);
  });
  it('drops bounds whose display has gone', () => {
    expect(usableBounds({ x: 1800, y: 0, width: 1400, height: 900 }, [laptop])).toBeNull();
  });
  it('drops bounds that only peek onto a display by a sliver', () => {
    expect(usableBounds({ x: 1500, y: 0, width: 1400, height: 900 }, [laptop])).toBeNull();
  });
  it('drops nonsense', () => {
    for (const saved of [null, undefined, 'x', {}, { x: 0, y: 0, width: 10, height: 10 }, { x: NaN, y: 0, width: 900, height: 700 }, { x: 0, y: 0, width: '900', height: 700 }]) {
      expect(usableBounds(saved, [laptop])).toBeNull();
    }
  });
  it('has a sensible default size', () => {
    expect(DEFAULT_SIZE).toEqual({ width: 1200, height: 820 });
  });
});

describe('notOpenMessage', () => {
  it('says the Nord was disconnected after an unplug', () => {
    expect(notOpenMessage(true)).toBe('Your Nord was disconnected.');
  });
  it('keeps the plain message when nothing was ever opened', () => {
    expect(notOpenMessage(false)).toBe('Device not open.');
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run electron/shell-policy.test.ts`
Expected: FAIL — cannot resolve `./shell-policy`.

- [ ] **Step 3: Implement**

Create `electron/shell-policy.ts`:

```ts
/**
 * What the desktop shell lets the page inside it do, as pure functions (no
 * Electron import; tested in shell-policy.test.ts). main.ts and nord-usb.ts
 * apply these through Electron's hooks. See
 * docs/specs/2026-10-11-desktop-shell-hardening-design.md.
 */

/** Where the app's own document lives: the packed file, plus the Vite server in development. */
export interface AppLocation {
  /** file: URL of the packed dist/index.html. */
  fileUrl: string;
  /** Origin of the dev server (VITE_DEV_SERVER_URL), or null in a packed build. */
  devOrigin: string | null;
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * True when `url` is the app's own document. Exact, not prefix-based: for
 * file: the path must be the packed index.html (any hash route), for the dev
 * server the origin must match. Used for navigation and for IPC senders.
 */
export function isAppUrl(url: string, app: AppLocation): boolean {
  const u = parse(url);
  if (!u) return false;
  if (u.protocol === 'file:') {
    const own = parse(app.fileUrl);
    return own !== null && u.host === own.host && u.pathname === own.pathname;
  }
  return app.devOrigin !== null && u.origin === parse(app.devOrigin)?.origin;
}

/**
 * Origin-level version, for permission checks, where Electron only reports an
 * origin ("file:///"). Every file: document shares that origin; it is the
 * navigation rule above that keeps other files out of the window.
 */
export function isAppOrigin(urlOrOrigin: string, app: AppLocation): boolean {
  const u = parse(urlOrOrigin);
  if (!u) return false;
  if (u.protocol === 'file:') return true;
  return app.devOrigin !== null && u.origin === parse(app.devOrigin)?.origin;
}

/** The URL to hand to the system browser, or null. Only https ever leaves the app. */
export function externalUrlToOpen(url: string): string | null {
  const u = parse(url);
  return u?.protocol === 'https:' ? u.href : null;
}

/**
 * Everything the web app asks the browser for. Anything not listed is refused:
 *   midi                       live MIDI keyboard input for the rompler (no sysex)
 *   clipboard-sanitized-write  copy buttons
 *   fileSystem                 the folder picker and save dialog behind the local Library
 * The Nord itself goes through the native bridge, so `usb` is deliberately absent.
 */
export const ALLOWED_PERMISSIONS: readonly string[] = ['midi', 'clipboard-sanitized-write', 'fileSystem'];

export function isPermissionAllowed(permission: string, requester: string, app: AppLocation): boolean {
  return ALLOWED_PERMISSIONS.includes(permission) && isAppOrigin(requester, app);
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_SIZE = { width: 1200, height: 820 };
const MIN_SIZE = { width: 480, height: 360 };
/** A window must overlap some display by at least this much to count as reachable. */
const MIN_VISIBLE = 120;

/** Saved window bounds if they are still sane and on a connected display; otherwise null. */
export function usableBounds(saved: unknown, displays: Bounds[]): Bounds | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const { x, y, width, height } = saved as Record<string, unknown>;
  if (![x, y, width, height].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  const b = { x, y, width, height } as Bounds;
  if (b.width < MIN_SIZE.width || b.height < MIN_SIZE.height) return null;
  const reachable = displays.some((d) => {
    const overlapX = Math.min(b.x + b.width, d.x + d.width) - Math.max(b.x, d.x);
    const overlapY = Math.min(b.y + b.height, d.y + d.height) - Math.max(b.y, d.y);
    return overlapX >= MIN_VISIBLE && overlapY >= MIN_VISIBLE;
  });
  return reachable ? b : null;
}

export const DISCONNECTED_MESSAGE = 'Your Nord was disconnected.';

/** Why a transfer call found no open device: unplugged mid-session, or never opened. */
export function notOpenMessage(wasUnplugged: boolean): string {
  return wasUnplugged ? DISCONNECTED_MESSAGE : 'Device not open.';
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run electron/shell-policy.test.ts`
Expected: all passed (20 tests).

- [ ] **Step 5: Commit**

```bash
git add electron/shell-policy.ts electron/shell-policy.test.ts
git commit -m "feat(electron): shell policy — app URL, external links, permissions, window bounds"
```

---

### Task 3: USB handling in its own module, with a sender check and unplug detection

**Files:** Create `electron/nord-usb.ts`. Modify `electron/main.ts` (remove what moved).

**Interfaces:**
- Consumes: `notOpenMessage` from Task 2.
- Produces: `initNordUsb(deps: { isTrustedSender: (event: IpcMainInvokeEvent) => boolean; onClosed: () => void }): { isOpen(): boolean }`. Channel names and payload shapes are unchanged.

- [ ] **Step 1: Create `electron/nord-usb.ts`**

Move `NORD_VENDOR`, `initWindowsBackend` (with its comment), `OpenState`, `state`, `nordDevices`, `findBulk` and the body of `registerUsbIpc` out of `main.ts` verbatim, then apply exactly these changes:

```ts
/**
 * The Nord's USB bridge: the `nord-usb:*` IPC channels that the preload
 * re-exposes as `window.nordNativeUsb`, backed by node-usb. Owns the open
 * device and notices when it is unplugged.
 *
 * (The long note on why node-usb must never be rebuilt stays at the top of
 * main.ts, next to the build that it concerns.)
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { usb, findByIds, getDeviceList, useUsbDkBackend, type InEndpoint, type Interface, type OutEndpoint } from 'usb';
import { notOpenMessage } from './shell-policy';

// … NORD_VENDOR, usbDkActive, initWindowsBackend, OpenState, nordDevices, findBulk: unchanged …

export interface NordUsbHandle {
  /** True while the Nord's interface is claimed. */
  isOpen(): boolean;
}

export function initNordUsb(deps: {
  /** Only the app's own window may drive the Nord. */
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  /** Called whenever the device stops being open: closed by the app, or unplugged. */
  onClosed: () => void;
}): NordUsbHandle {
  initWindowsBackend(); // before any device access

  let state: OpenState | null = null;
  /** True from an unplug until the next successful open — picks the error message. */
  let unplugged = false;

  /** Register a channel that refuses callers other than the app window. */
  const handle = <A extends unknown[], R>(channel: string, fn: (...args: A) => R): void => {
    ipcMain.handle(channel, (event, ...args) => {
      if (!deps.isTrustedSender(event)) throw new Error('Not allowed.');
      return fn(...(args as A));
    });
  };

  // An unplugged device leaves a dead handle behind: drop it (there is no
  // interface left to release) so the next connect starts clean, and say so.
  usb.on('detach', (device) => {
    if (!state) return;
    if (device.busNumber !== state.device.busNumber || device.deviceAddress !== state.device.deviceAddress) return;
    state = null;
    unplugged = true;
    deps.onClosed();
  });

  handle('nord-usb:backend', () => ({ platform: process.platform, usbDkActive }));
  handle('nord-usb:list', () => /* unchanged body */);
  handle('nord-usb:open', async (productId?: number) => {
    /* unchanged body, then: */
    unplugged = false;
  });
  // bulkOut / bulkIn: unchanged, except `new Error('Device not open.')` becomes
  // `new Error(notOpenMessage(unplugged))`.
  handle('nord-usb:close', () =>
    new Promise<void>((resolve) => {
      if (!state) return resolve();
      const { iface, device } = state;
      state = null;
      iface.release(true, () => {
        try {
          device.close();
        } catch {
          /* already closed */
        }
        resolve();
        deps.onClosed();
      });
    }),
  );

  return { isOpen: () => state !== null };
}
```

Write the file out in full (no `/* unchanged */` placeholders in the real file): the placeholders above only mark which existing lines move without edits.

- [ ] **Step 2: Point `main.ts` at it, minimally (the full rewrite is Task 4)**

In `main.ts`: delete everything that moved; replace the `usb` import with `import { initNordUsb, type NordUsbHandle } from './nord-usb';`; add `let nordUsb: NordUsbHandle | null = null;`; in `whenReady` replace `initWindowsBackend(); registerUsbIpc();` with

```ts
  nordUsb = initNordUsb({ isTrustedSender: () => true, onClosed: () => updater?.deviceClosed() });
```

and change the updater's `isDeviceOpen` to `() => nordUsb?.isOpen() ?? false`. (`isTrustedSender` becomes real in Task 4.)

- [ ] **Step 3: Type-check, bundle, pack, smoke**

Run: `npm run typecheck && npm run electron:pack`, then the three `cdp.mjs` checks from Task 1 Step 4.
Expected: identical results — `backend`, `list` still answer.

Also: `node "$TMPDIR/cdp.mjs" 9333 "window.nordNativeUsb.bulkOut('AA==').catch((e) => e.message)"` → the result contains `Device not open.`

- [ ] **Step 4: Gates and commit**

```bash
git add electron/nord-usb.ts electron/main.ts
git commit -m "refactor(electron): USB bridge in its own module; notice an unplugged Nord"
```

---

### Task 4: Window memory, single instance, lockdown

**Files:** Create `electron/window-state.ts`, `electron/window-state.test.ts`. Rewrite the startup half of `electron/main.ts`.

**Interfaces:**
- Consumes: Task 2's policy, Task 3's `initNordUsb`.
- Produces: `loadWindowState(file: string, displays: Bounds[]): { bounds: Bounds | null; maximized: boolean }`, `saveWindowState(file: string, state: { bounds: Bounds; maximized: boolean }): void`.

- [ ] **Step 1: Write the failing tests**

Create `electron/window-state.test.ts`:

```ts
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadWindowState, saveWindowState } from './window-state';

const display = [{ x: 0, y: 0, width: 1512, height: 944 }];
const file = () => join(mkdtempSync(join(tmpdir(), 'opennord-window-')), 'window-state.json');

describe('window state', () => {
  it('round-trips bounds and the maximized flag', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 40, y: 60, width: 1300, height: 800 }, maximized: true });
    expect(loadWindowState(f, display)).toEqual({ bounds: { x: 40, y: 60, width: 1300, height: 800 }, maximized: true });
  });
  it('falls back to defaults when there is no file yet', () => {
    expect(loadWindowState(file(), display)).toEqual({ bounds: null, maximized: false });
  });
  it('falls back to defaults when the file is corrupt', () => {
    const f = file();
    writeFileSync(f, '{not json');
    expect(loadWindowState(f, display)).toEqual({ bounds: null, maximized: false });
  });
  it('drops bounds from a display that is gone but keeps the maximized flag', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 3000, y: 0, width: 1300, height: 800 }, maximized: true });
    expect(loadWindowState(f, display)).toEqual({ bounds: null, maximized: true });
  });
  it('does not throw when the folder cannot be written', () => {
    expect(() => saveWindowState('/nonexistent-dir/window-state.json', { bounds: { x: 0, y: 0, width: 900, height: 700 }, maximized: false })).not.toThrow();
  });
  it('writes plain JSON a person can read', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 1, y: 2, width: 900, height: 700 }, maximized: false });
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ bounds: { x: 1, y: 2, width: 900, height: 700 }, maximized: false });
  });
});
```

Run: `npx vitest run electron/window-state.test.ts` → FAIL (cannot resolve `./window-state`).

- [ ] **Step 2: Implement `electron/window-state.ts`**

```ts
/**
 * Remembers the window's size, position and maximized state between launches,
 * in a small JSON file under the app's userData folder. Never throws: a window
 * that opens at the default size is always better than one that fails to open.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { usableBounds, type Bounds } from './shell-policy';

export interface WindowState {
  bounds: Bounds;
  maximized: boolean;
}

/** Saved state, with bounds only if they are still on a connected display. */
export function loadWindowState(file: string, displays: Bounds[]): { bounds: Bounds | null; maximized: boolean } {
  try {
    const saved = JSON.parse(readFileSync(file, 'utf8')) as { bounds?: unknown; maximized?: unknown };
    return { bounds: usableBounds(saved.bounds, displays), maximized: saved.maximized === true };
  } catch {
    return { bounds: null, maximized: false };
  }
}

export function saveWindowState(file: string, state: WindowState): void {
  try {
    writeFileSync(file, JSON.stringify(state));
  } catch {
    /* not worth interrupting anyone for */
  }
}
```

Run: `npx vitest run electron/window-state.test.ts` → 6 passed.

- [ ] **Step 3: Rewrite `electron/main.ts` from the imports down**

Keep the file's header comment (including the node-usb rebuild note). Replace everything from the first `import` to the end with:

```ts
import { app, BrowserWindow, Menu, screen, session, shell, type IpcMainInvokeEvent, type MenuItemConstructorOptions } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildMenuTemplate } from './menu';
import { initNordUsb, type NordUsbHandle } from './nord-usb';
import { DEFAULT_SIZE, externalUrlToOpen, isAppUrl, isPermissionAllowed, type AppLocation } from './shell-policy';
import { startUpdater, type UpdaterHandle } from './updater';
import { loadWindowState, saveWindowState } from './window-state';

// Packed layout: <app>/electron/dist/main.cjs + <app>/dist/index.html, so the
// web build is two levels up from __dirname (electron/dist), at the app root.
const INDEX_HTML = join(__dirname, '../../dist/index.html');
const DEV_URL = process.env.VITE_DEV_SERVER_URL ?? null;
const APP: AppLocation = { fileUrl: pathToFileURL(INDEX_HTML).href, devOrigin: DEV_URL };

// The web build's `/` route is the public marketing landing page (the website's
// front door). A downloaded desktop app has already "arrived", so it should open
// straight into the tool — the Library is the app's home. The app uses hash
// routing, so we point the initial load at the Library route's hash.
const APP_ENTRY_HASH = '/library/programs';

let mainWindow: BrowserWindow | null = null;
let nordUsb: NordUsbHandle | null = null;
let updater: UpdaterHandle | null = null;

/** Hand an https link to the system browser; anything else goes nowhere. */
function openExternally(url: string): void {
  const safe = externalUrlToOpen(url);
  if (safe) void shell.openExternal(safe);
  else console.warn(`Refused to open ${url}`);
}

/** The Nord bridge answers only the top frame of the app window, showing the app itself. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  return mainWindow !== null
    && event.sender === mainWindow.webContents
    && frame !== null
    && frame === event.sender.mainFrame
    && isAppUrl(frame.url, APP);
}

/**
 * Confine every page the app ever shows — this window and any created later:
 * no new app windows (links open in the browser), no navigating away.
 */
function confineWebContents(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      openExternally(url);
      return { action: 'deny' };
    });
    const stayInApp = (event: { preventDefault(): void; url: string }): void => {
      if (isAppUrl(event.url, APP)) return;
      event.preventDefault();
      openExternally(event.url);
    };
    contents.on('will-navigate', stayInApp);
    contents.on('will-redirect', stayInApp);
  });
}

/** Deny every browser permission except the few the app uses, and only to the app. */
function restrictPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => {
    callback(isPermissionAllowed(permission, contents.getURL(), APP));
  });
  session.defaultSession.setPermissionCheckHandler((_contents, permission, requestingOrigin) =>
    isPermissionAllowed(permission, requestingOrigin, APP));
}

async function createWindow(): Promise<void> {
  const stateFile = join(app.getPath('userData'), 'window-state.json');
  const saved = loadWindowState(stateFile, screen.getAllDisplays().map((d) => d.workArea));

  const win = new BrowserWindow({
    ...DEFAULT_SIZE,
    ...(saved.bounds ?? {}),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;
  if (saved.maximized) win.maximize();

  let saveTimer: NodeJS.Timeout | null = null;
  const save = (): void => saveWindowState(stateFile, { bounds: win.getNormalBounds(), maximized: win.isMaximized() });
  const saveSoon = (): void => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 500);
  };
  win.on('resize', saveSoon);
  win.on('move', saveSoon);
  win.on('close', () => {
    if (saveTimer) clearTimeout(saveTimer);
    save();
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  if (DEV_URL) await win.loadURL(`${DEV_URL}#${APP_ENTRY_HASH}`);
  else await win.loadFile(INDEX_HTML, { hash: APP_ENTRY_HASH });
}

// One OpenNord at a time: two copies would compete for the Nord and the updater.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  confineWebContents();

  app.whenReady().then(() => {
    restrictPermissions();
    nordUsb = initNordUsb({ isTrustedSender, onClosed: () => updater?.deviceClosed() });
    Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate({
      mac: process.platform === 'darwin',
      appName: app.name,
      onCheckForUpdates: () => updater?.checkNow(),
    }) as MenuItemConstructorOptions[]));
    void createWindow();
    // After the window, and guarded: the updater exists to repair a broken
    // release, so nothing in it may ever stop the app from opening.
    try {
      updater = startUpdater({ isDeviceOpen: () => nordUsb?.isOpen() ?? false });
    } catch (error) {
      console.error('The updater failed to start:', error);
    }
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
```

- [ ] **Step 4: Type-check and fix against Electron 44's real types**

Run: `npm run typecheck`
Expected: passes. Likely adjustments, to be made at the source rather than cast away: the `will-navigate` / `will-redirect` listener parameter type (use the event type Electron exports), the permission string unions (`isPermissionAllowed` takes `string`, so no change needed), `event.senderFrame` nullability.

- [ ] **Step 5: Pack and prove each rule in the packed app**

Run: `npm run electron:pack`, start with `--remote-debugging-port=9333`, then:

```bash
node "$TMPDIR/cdp.mjs" 9333 "window.nordNativeUsb.backend().then((b) => 'bridge ok: ' + b.platform)"
node "$TMPDIR/cdp.mjs" 9333 "String(window.open('https://example.com/', '_blank'))"
node "$TMPDIR/cdp.mjs" 9333
node "$TMPDIR/cdp.mjs" 9333 "navigator.permissions.query({ name: 'geolocation' }).then((p) => p.state)"
node "$TMPDIR/cdp.mjs" 9333 "navigator.requestMIDIAccess().then(() => 'midi ok', (e) => 'midi refused: ' + e.name)"
node "$TMPDIR/cdp.mjs" 9333 "navigator.clipboard.writeText('opennord').then(() => 'copy ok', (e) => 'copy refused: ' + e.name)"
node "$TMPDIR/cdp.mjs" 9333 "(location.href = 'https://example.com/', 'navigated?')"
node "$TMPDIR/cdp.mjs" 9333
```

Expected: the bridge answers; `window.open` returns `null`; the page list still has exactly one page, whose URL is the app (the system browser opening example.com twice is the intended side effect — close those tabs); geolocation is `denied`; MIDI is `midi ok`; copy is `copy ok` (it may need the window focused — if it is refused only for lack of focus, note that and check a real Copy button by hand in Task 6); after the navigation attempt the page URL is still the app.

Second instance: with the app running, run the binary again without a debug port — it must exit within a couple of seconds and the page list must still show one page.

Window memory: `ls ~/Library/Application\ Support/OpenNord/window-state.json` exists after quitting; its JSON holds bounds.

Quit with `pkill -f mac-universal/OpenNord.app`.

- [ ] **Step 6: Gates and commit**

```bash
git add electron/main.ts electron/window-state.ts electron/window-state.test.ts
git commit -m "feat(electron): confine the window — sandbox, links to the browser, no navigation, permission allow-list, one instance, remembered bounds"
```

---

### Task 5: Icon

**Files:** Create `electron/icon/icon.svg`, `electron/icon/icon.png`, `scripts/make-icons.mjs`. Modify `package.json`, `scripts/desktop-config.test.mjs`.

- [ ] **Step 1: Draw `electron/icon/icon.svg`**

A 1024×1024 canvas with transparent margins and a rounded-square body of about 824 px (the macOS icon grid), in graphite (`#18191b` → `#202124`), carrying one mark in the accent `#ff6a1a`. The mark is abstract — an open ring (the "open" in OpenNord) with a small lit dot — and must not resemble a keyboard, a Nord panel, or any Nord trademark. Thin 1 px inner highlight on the body, consistent with the app's `edge-hi` treatment.

- [ ] **Step 2: STOP — show the owner the drawing and wait for approval**

Render it (Step 3's script) and send the PNG. Do not change `package.json` until they approve; revise the SVG on their feedback.

- [ ] **Step 3: Render it with Electron — `scripts/make-icons.mjs`**

```js
// Renders electron/icon/icon.svg to electron/icon/icon.png (1024 px, with
// transparency) using Electron's own Chromium, so no image library is needed.
// electron-builder turns that PNG into the .icns and .ico at pack time.
//
//   npm run icons        (re-run only when the SVG changes; commit the PNG)
import { app, BrowserWindow } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'electron', 'icon');
const SIZE = 1024;

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: SIZE, height: SIZE, frame: false, transparent: true,
    webPreferences: { offscreen: true },
  });
  const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
  const page = `<html><body style="margin:0;background:transparent">${svg.replace('<svg', `<svg width="${SIZE}" height="${SIZE}"`)}</body></html>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`);
  const image = (await win.webContents.capturePage()).resize({ width: SIZE, height: SIZE, quality: 'best' });
  writeFileSync(join(dir, 'icon.png'), image.toPNG());
  console.log(`wrote ${join(dir, 'icon.png')} (${image.getSize().width}×${image.getSize().height})`);
  app.quit();
});
```

Add to `package.json` scripts: `"icons": "electron scripts/make-icons.mjs",`

Run: `npm run icons`
Expected: `wrote …/icon.png (1024×1024)`. Check transparency survived: `sips -g hasAlpha electron/icon/icon.png` → `hasAlpha: yes`. Look at the PNG.

- [ ] **Step 4: Failing config test, then wire it in (only after approval)**

Append inside the `describe` in `scripts/desktop-config.test.mjs`:

```js
  it('ships its own icon, not the default Electron one', () => {
    expect(build.mac.icon).toBe('electron/icon/icon.png');
    expect(build.win.icon).toBe('electron/icon/icon.png');
    expect(existsSync(new URL('../electron/icon/icon.png', import.meta.url))).toBe(true);
  });
```

and add `existsSync` to its `node:fs` import. Run → FAIL. Then set `"icon": "electron/icon/icon.png"` in both `build.mac` and `build.win`. Run → passes.

- [ ] **Step 5: Pack**

Run: `npm run electron:pack`
Expected: the log no longer contains `default Electron icon is used`; `release/mac-universal/OpenNord.app/Contents/Resources/icon.icns` exists.

- [ ] **Step 6: Gates and commit**

```bash
git add electron/icon scripts/make-icons.mjs scripts/desktop-config.test.mjs package.json
git commit -m "feat(electron): app icon"
```

---

### Task 6: Docs, full verification, PR

**Files:** Modify `electron/README.md`.

- [ ] **Step 1: README**

Add a `## What the shell enforces` section after `## Architecture`, covering in plain statements: links open in the browser (https only) and never in an app window; the window cannot navigate away; the renderer is sandboxed; the three allowed permissions and why; the bridge answers only the app window; an unplugged Nord is noticed and reported as "Your Nord was disconnected."; one instance; window memory and where the file lives; the icon source and `npm run icons`. Update the Architecture diagram's last lines to name `electron/nord-usb.ts`. In `## Notes / gotchas`, replace the final bullet's `contextIsolation`/`nodeIntegration` sentence with one that also names `sandbox: true`. State the two things deliberately not done (CSP, fuses) and why, in one line each.

Commit: `git commit -am "docs(electron): what the shell enforces"`

- [ ] **Step 2: Update rehearsal on Electron 44 — needs the owner at the screen**

Repeat "Rehearsing an update" from the README (`0.1.0` in `~/Applications`, `0.1.1` served locally). Expected log lines, in order: `TEST FEED in use`, `ready 0.1.1` (after the Squirrel fetch), and in `updater.previous.log` after the restart, `restarting into 0.1.1`. Clean up `~/Applications/OpenNord.app` afterwards.

- [ ] **Step 3: By-hand pass in the packed app — owner**

A link to nordkeyboards.com opens the browser, no new app window. A MIDI keyboard plays the rompler. The folder picker opens and a folder scans. A Copy button copies. Launching a second copy focuses the first. Move and resize, quit, relaunch: restored. The Dock shows the icon.

- [ ] **Step 4: Hardware — owner, with a Nord**

Connect; run a backup or a transfer; pull the cable mid-way. Expected: the operation fails with "Your Nord was disconnected."; plug back in and Connect works without restarting the app.

- [ ] **Step 5: Push and open the PR**

Push `claude/desktop-shell-hardening` and open a PR **based on `claude/competent-hermann-65e379`** (the branch of the releases + auto-update PR), so the diff shows only this spec. Say in the body what was verified by whom, and that Windows is untested.
