# Signed, Installable, Versioned Desktop Releases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One local command on the release Mac produces a signed, notarized universal macOS dmg/zip, collects the CI-built Windows NSIS installer, and uploads both to a draft release on the public repo.

**Architecture:** electron-builder stays the packer; its `build` block in `package.json` gains signing, installer targets, stable asset names and a GitHub `publish` entry (used only to emit `latest*.yml`). A new `scripts/release-desktop.mjs` orchestrates preflight → mac pack → verification → Windows artifact fetch → draft upload; its decisions are pure functions with injected inputs so they are unit-tested without git, `gh` or the network. The Windows CI job keeps building the installer because it cannot be built on macOS.

**Tech Stack:** Electron 44 (macOS 13+), electron-builder 26, node-usb 2 (prebuilds), vitest, GitHub CLI (`gh`), Xcode `notarytool`/`stapler`.

**Spec:** `docs/specs/2026-10-11-desktop-signed-releases-design.md` (paths are relative to `packages/core` unless they start with `.github/`).

## Global Constraints

- Bundle ID: `org.opennord.app` on both platforms.
- First version: `0.1.0`; release tag format: `desktop-v<version>`.
- Asset names, exactly: `OpenNord-mac.dmg`, `OpenNord-mac.zip`, `latest-mac.yml`, `OpenNord-win-x64.exe`, `latest.yml`.
- Releases go to `simonflore/opennord` as a **draft**. Nothing in this plan publishes a release.
- Every electron-builder invocation passes `--publish never` (on a tag build in CI electron-builder would otherwise try to publish by itself).
- Never run `electron-rebuild`; `npmRebuild: false`, the `files` exclusion of `node_modules/usb/build`, and `scripts/usb-native-guard.mjs` stay in force.
- Windows stays `--x64`. Windows is unsigned.
- No secrets in the repo or in CI. Notarization uses the keychain profile named `opennord-notary`.
- Install core's dependencies with `npm ci` in `packages/core` (as CI does) — electron-builder needs npm's flat `node_modules`, not pnpm's.
- Commit after every task. Before each commit run `npm run typecheck`, `npm run lint`, `npm test`.

## Two corrections to the spec (apply them to the spec file in Task 2)

1. The spec says `xcrun stapler validate` on the **dmg**. electron-builder notarizes and staples the **.app** and then wraps it in an unsigned dmg, so the ticket is on the app. Validate the app.
2. The spec adds a `--target darwin-universal` mode to the guard. The guard already accepts `--target darwin-x64+arm64` (its `parseTuple` splits on `+`) and already finds `win-unpacked/…/app.asar.unpacked`. **The guard needs no code change**; only the scripts that call it change.

## Review Focus

1. **Windows CI run not finished when the release command runs** → the command stops and names the state (queued / in progress / failed); it must not upload a mac-only release by accident. *(Task 4 test.)*
2. **A PR-triggered run exists for the same commit** → it must be ignored: PR runs build the synthetic merge commit, not the tagged commit. *(Task 4 test.)*
3. **Release command re-run after a partial upload** → reuses the existing draft and overwrites assets; if a release with that tag is already **published**, it refuses. *(Task 4 test.)*
4. **Tag exists but points at an older commit, or `version` was bumped without re-tagging** → preflight refuses with a message that names both values. *(Task 4 test.)*
5. **Notarization silently skipped** (electron-builder only warns when the credential env var is missing) → `stapler validate` in the release command fails the run. *(Task 5 step.)*

## File Structure

| File | Responsibility |
| --- | --- |
| `package.json` (modify) | version, `build` config, pack scripts, `release:desktop` script |
| `package-lock.json` (modify) | version field only |
| `electron/entitlements.mac.plist` (create) | hardened-runtime entitlements |
| `scripts/desktop-config.test.mjs` (create) | pins the build config and pack scripts the release depends on |
| `scripts/release-desktop.mjs` (create) | the release command: pure decision functions + `main()` |
| `scripts/release-desktop.test.mjs` (create) | unit tests for the decision functions |
| `.github/workflows/desktop-win.yml` (modify) | NSIS output, tag trigger, artifact contents |
| `electron/README.md` (modify) | packing + release docs, one-time Mac setup |
| `docs/specs/2026-10-11-desktop-signed-releases-design.md` (modify) | the two corrections above |
| `src/components/home/DesktopApp.tsx`, `icons.tsx` (modify) | **Task 7, held until 0.1.0 is published** |

---

### Task 1: Confirm the toolchain on this Mac

No code. Establishes facts later tasks rely on.

**Files:** possibly create `.nvmrc`.

- [ ] **Step 1: Install dependencies**

Run (in `packages/core`): `npm ci`
Expected: completes; `node_modules/usb/prebuilds/` exists.

- [ ] **Step 2: Record the node-usb mac prebuild name**

Run: `ls node_modules/usb/prebuilds`
Expected: a directory covering both mac arches, e.g. `darwin-x64+arm64`. If instead there are separate `darwin-x64` and `darwin-arm64` directories, note it: Task 3's guard target becomes two `verify` calls, one per arch.

- [ ] **Step 3: Check the web build runs on the current Node**

Run: `node -v && npm run build:electron`
Expected: `dist/index.html` is written.
If it fails on Node 26 with a Vite/rolldown error: install Node 22 (`nvm install 22`), create `.nvmrc` containing `22`, re-run under Node 22, and use Node 22 for every later step. Record which Node was used in the commit message.

- [ ] **Step 4: Check the test runner**

Run: `npx vitest run scripts/register-capacitor-plugins.test.mjs`
Expected: 4 passed.

- [ ] **Step 5: Commit (only if `.nvmrc` was created)**

```bash
git add .nvmrc
git commit -m "chore(electron): pin Node for the desktop release build"
```

---

### Task 2: Version, bundle ID, installer targets, stable names

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `scripts/desktop-config.test.mjs`
- Modify: `docs/specs/2026-10-11-desktop-signed-releases-design.md`

**Interfaces:**
- Produces: `package.json` `version` = `0.1.0`; `build.publish[0]` = `{ provider: 'github', owner: 'simonflore', repo: 'opennord' }`; artifact names per Global Constraints. Task 4 reads `version` and `build.publish[0]`.

- [ ] **Step 1: Write the failing test**

Create `scripts/desktop-config.test.mjs`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const { build, scripts } = pkg;

describe('desktop build config', () => {
  it('ships under the shared bundle id', () => {
    expect(build.appId).toBe('org.opennord.app');
  });

  it('names assets without a version, so releases/latest/download/<name> is stable', () => {
    expect(build.mac.artifactName).toBe('OpenNord-mac.${ext}');
    expect(build.nsis.artifactName).toBe('OpenNord-win-x64.${ext}');
  });

  it('builds a dmg and a zip for macOS (the zip is what the updater reads)', () => {
    expect(build.mac.target).toEqual(['dmg', 'zip']);
  });

  it('builds a per-user NSIS installer for Windows', () => {
    expect(build.win.target).toBe('nsis');
    expect(build.nsis.perMachine).toBe(false);
  });

  it('points the update feed at the public repo', () => {
    expect(build.publish).toEqual([{ provider: 'github', owner: 'simonflore', repo: 'opennord' }]);
  });

  it('never lets electron-builder publish by itself', () => {
    expect(scripts['electron:pack']).toContain('--publish never');
    expect(scripts['electron:pack:win']).toContain('--publish never');
  });

  it('keeps the node-usb fences', () => {
    expect(build.npmRebuild).toBe(false);
    expect(build.files).toContain('!**/node_modules/usb/build/**');
    expect(scripts['electron:pack:win']).toContain('--x64');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run scripts/desktop-config.test.mjs`
Expected: FAIL — `appId` is `app.gigmeister.opennord`.

- [ ] **Step 3: Bump the version**

Run: `npm version 0.1.0 --no-git-tag-version`
Expected: `package.json` and both `version` fields at the top of `package-lock.json` read `0.1.0`. No other lockfile changes.

- [ ] **Step 4: Replace the `build` block in `package.json`**

```json
"build": {
  "appId": "org.opennord.app",
  "productName": "OpenNord",
  "files": [
    "dist/**/*",
    "electron/dist/**/*",
    "!**/node_modules/usb/build/**"
  ],
  "directories": {
    "output": "release"
  },
  "npmRebuild": false,
  "publish": [
    { "provider": "github", "owner": "simonflore", "repo": "opennord" }
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.music",
    "artifactName": "OpenNord-mac.${ext}"
  },
  "win": {
    "target": "nsis"
  },
  "nsis": {
    "oneClick": true,
    "perMachine": false,
    "artifactName": "OpenNord-win-x64.${ext}"
  }
}
```

(`identity: null` is gone on purpose; signing options arrive in Task 3.)

- [ ] **Step 5: Update the two pack scripts in `package.json`**

```json
"electron:pack": "node scripts/usb-native-guard.mjs clean && npm run build:electron && npm run electron:build && electron-builder --mac --universal --publish never && node scripts/usb-native-guard.mjs verify --target darwin-x64+arm64",
"electron:pack:win": "node scripts/usb-native-guard.mjs clean && npm run build:electron && npm run electron:build && electron-builder --win --x64 --publish never && node scripts/usb-native-guard.mjs verify --target win32-x64",
```

(If Task 1 Step 2 found separate per-arch mac prebuilds, end `electron:pack` with two verifies: `--target darwin-x64 && … --target darwin-arm64`.)

- [ ] **Step 6: Run the test**

Run: `npx vitest run scripts/desktop-config.test.mjs`
Expected: 7 passed.

- [ ] **Step 7: Apply the two spec corrections**

In the spec: under "The release command" step 3, change "`xcrun stapler validate` on the dmg" to "`xcrun stapler validate` on the app (electron-builder staples the app, then wraps it in an unsigned dmg)". Replace the body of "The node-usb guard" with: "No code change. `verify --target darwin-x64+arm64` already asserts a prebuild covering both mac arches, and `packedApps` already finds `release/win-unpacked`. Only the calling scripts change."

- [ ] **Step 8: Gates and commit**

Run: `npm run typecheck && npm run lint && npm test`

```bash
git add package.json package-lock.json scripts/desktop-config.test.mjs docs/specs/2026-10-11-desktop-signed-releases-design.md
git commit -m "feat(electron): 0.1.0, org.opennord.app, dmg/zip and NSIS targets with stable asset names"
```

---

### Task 3: A signed universal macOS pack

**Files:**
- Create: `electron/entitlements.mac.plist`
- Modify: `package.json` (`build.mac`), `scripts/desktop-config.test.mjs`

**Interfaces:**
- Consumes: Task 2's `electron:pack` script.
- Produces: `release/mac-universal/OpenNord.app`, `release/OpenNord-mac.dmg`, `release/OpenNord-mac.zip`, `release/latest-mac.yml` and `.blockmap` files. Task 5 relies on these exact paths.

- [ ] **Step 1: Extend the config test (failing)**

Append inside the `describe` in `scripts/desktop-config.test.mjs`:

```js
  it('signs macOS with the hardened runtime and the minimal entitlements', () => {
    expect(build.mac.hardenedRuntime).toBe(true);
    expect(build.mac.entitlements).toBe('electron/entitlements.mac.plist');
    expect(build.mac.entitlementsInherit).toBe('electron/entitlements.mac.plist');
    expect(build.mac.identity).toBeUndefined();
    const plist = readFileSync(new URL('../electron/entitlements.mac.plist', import.meta.url), 'utf8');
    expect(plist).toContain('com.apple.security.cs.allow-jit');
  });
```

Run: `npx vitest run scripts/desktop-config.test.mjs` → FAIL (`hardenedRuntime` undefined).

- [ ] **Step 2: Create `electron/entitlements.mac.plist`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Hardened-runtime entitlements for the Developer ID build. The app is not
     App-Sandboxed, so libusb needs no USB entitlement. allow-jit is the minimum
     Electron's V8 needs. Do not add disable-library-validation unless the
     notarized app fails to load usb_bindings.node — and record why if you do. -->
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

- [ ] **Step 3: Add signing options to `build.mac` in `package.json`**

```json
"mac": {
  "target": ["dmg", "zip"],
  "category": "public.app-category.music",
  "artifactName": "OpenNord-mac.${ext}",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "electron/entitlements.mac.plist",
  "entitlementsInherit": "electron/entitlements.mac.plist"
},
```

Run: `npx vitest run scripts/desktop-config.test.mjs` → 8 passed.

- [ ] **Step 4: Pack (signed, not yet notarized)**

Run: `npm run electron:pack`
Expected: electron-builder logs `signing … identity=Developer ID Application: Simon Floré`, a notarization-skipped notice (no credentials in the environment — correct at this stage), and the guard prints `→ prebuilds/darwin-x64+arm64, no build/ — OK`.

Known failure and its fix: `@electron/universal` aborts with *"Detected file … that's the same in both x64 and arm64 builds and not covered by the x64ArchFiles rule"* for the already-universal node-usb binary. Add to `build.mac`:

```json
"x64ArchFiles": "**/node_modules/usb/prebuilds/**"
```

and re-run. If the universal merge still fails for another reason after one further attempt, stop and report: the spec's fallback (separate arm64 and x64 artifacts) changes asset names and needs the user's decision.

- [ ] **Step 5: Verify the signature and that the app starts**

```bash
codesign --verify --deep --strict --verbose=2 release/mac-universal/OpenNord.app
codesign -d --entitlements - release/mac-universal/OpenNord.app
lipo -archs release/mac-universal/OpenNord.app/Contents/MacOS/OpenNord
```

Expected: `valid on disk` / `satisfies its Designated Requirement`; the entitlements list `allow-jit`; archs `x86_64 arm64`.

Then launch `release/mac-universal/OpenNord.app` by hand: the Library opens, and with a Nord plugged in, Connect works. If the window opens but USB fails with a library-validation error in Console.app, apply the escape hatch named in the plist comment and say so in the commit message.

- [ ] **Step 6: Gates and commit**

Run: `npm run typecheck && npm run lint && npm test`

```bash
git add package.json electron/entitlements.mac.plist scripts/desktop-config.test.mjs
git commit -m "feat(electron): sign the universal macOS build under the hardened runtime"
```

---

### Task 4: Release decisions as tested pure functions

**Files:**
- Create: `scripts/release-desktop.mjs` (functions only; `main()` arrives in Task 5)
- Create: `scripts/release-desktop.test.mjs`

**Interfaces:**
- Produces (all exported from `scripts/release-desktop.mjs`):
  - `NOTARY_PROFILE: 'opennord-notary'`
  - `releaseTag(version: string): string`
  - `preflightProblems(facts): string[]` where `facts = { version, dirty: boolean, headCommit: string, tagCommit: string | null, ghAuthed: boolean, hasDeveloperId: boolean, hasNotarytool: boolean, hasNotaryProfile: boolean }`
  - `pickWindowsRun(runs, headCommit): { ok: true, id: number } | { ok: false, reason: string }` where each run is `{ databaseId, headSha, event, status, conclusion }` (the shape `gh run list --json` returns)
  - `releaseAction(existing): 'create' | 'reuse'` where `existing` is `null | { isDraft: boolean }`; throws when a published release exists
  - `releaseAssets({ macOnly: boolean }): string[]` — file names expected in the upload directory

- [ ] **Step 1: Write the failing tests**

Create `scripts/release-desktop.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import {
  pickWindowsRun, preflightProblems, releaseAction, releaseAssets, releaseTag,
} from './release-desktop.mjs';

const ready = {
  version: '0.1.0', dirty: false, headCommit: 'aaa111', tagCommit: 'aaa111',
  ghAuthed: true, hasDeveloperId: true, hasNotarytool: true, hasNotaryProfile: true,
};

describe('releaseTag', () => {
  it('prefixes the version', () => expect(releaseTag('0.1.0')).toBe('desktop-v0.1.0'));
});

describe('preflightProblems', () => {
  it('passes a ready machine', () => expect(preflightProblems(ready)).toEqual([]));

  it('refuses a dirty tree', () => {
    expect(preflightProblems({ ...ready, dirty: true })[0]).toMatch(/uncommitted/);
  });

  it('refuses when the tag is missing, naming the tag to create', () => {
    expect(preflightProblems({ ...ready, tagCommit: null })[0]).toContain('desktop-v0.1.0');
  });

  it('refuses when the tag points at another commit, naming both', () => {
    const [problem] = preflightProblems({ ...ready, tagCommit: 'bbb222' });
    expect(problem).toContain('bbb222');
    expect(problem).toContain('aaa111');
  });

  it('reports every missing prerequisite at once', () => {
    const problems = preflightProblems({
      ...ready, ghAuthed: false, hasDeveloperId: false, hasNotarytool: false, hasNotaryProfile: false,
    });
    expect(problems).toHaveLength(4);
  });
});

describe('pickWindowsRun', () => {
  const run = (over) => ({
    databaseId: 1, headSha: 'aaa111', event: 'push', status: 'completed', conclusion: 'success', ...over,
  });

  it('picks the successful tag-push run for this commit', () => {
    expect(pickWindowsRun([run({ databaseId: 7 })], 'aaa111')).toEqual({ ok: true, id: 7 });
  });

  it('accepts a manual dispatch', () => {
    expect(pickWindowsRun([run({ event: 'workflow_dispatch' })], 'aaa111').ok).toBe(true);
  });

  it('ignores pull_request runs: they build the merge commit, not this one', () => {
    const result = pickWindowsRun([run({ event: 'pull_request' })], 'aaa111');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no Windows build/i);
  });

  it('ignores runs for other commits', () => {
    expect(pickWindowsRun([run({ headSha: 'zzz999' })], 'aaa111').ok).toBe(false);
  });

  it('says so when the build is still running', () => {
    const result = pickWindowsRun([run({ status: 'in_progress', conclusion: null })], 'aaa111');
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/still running/) });
  });

  it('says so when the build failed', () => {
    const result = pickWindowsRun([run({ conclusion: 'failure' })], 'aaa111');
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/failed/) });
  });

  it('prefers a success over an earlier failure for the same commit', () => {
    const runs = [run({ databaseId: 2, conclusion: 'failure' }), run({ databaseId: 3 })];
    expect(pickWindowsRun(runs, 'aaa111')).toEqual({ ok: true, id: 3 });
  });
});

describe('releaseAction', () => {
  it('creates when there is none', () => expect(releaseAction(null)).toBe('create'));
  it('reuses a draft, so a re-run after a partial upload works', () => {
    expect(releaseAction({ isDraft: true })).toBe('reuse');
  });
  it('refuses to touch a published release', () => {
    expect(() => releaseAction({ isDraft: false })).toThrow(/already published/);
  });
});

describe('releaseAssets', () => {
  it('lists both platforms with feeds and blockmaps', () => {
    expect(releaseAssets({ macOnly: false })).toEqual([
      'OpenNord-mac.dmg', 'OpenNord-mac.dmg.blockmap',
      'OpenNord-mac.zip', 'OpenNord-mac.zip.blockmap', 'latest-mac.yml',
      'OpenNord-win-x64.exe', 'OpenNord-win-x64.exe.blockmap', 'latest.yml',
    ]);
  });
  it('drops the Windows files in mac-only mode', () => {
    expect(releaseAssets({ macOnly: true })).toEqual([
      'OpenNord-mac.dmg', 'OpenNord-mac.dmg.blockmap',
      'OpenNord-mac.zip', 'OpenNord-mac.zip.blockmap', 'latest-mac.yml',
    ]);
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run scripts/release-desktop.test.mjs`
Expected: FAIL — cannot resolve `./release-desktop.mjs`.

- [ ] **Step 3: Implement**

Create `scripts/release-desktop.mjs`:

```js
// Cuts a desktop release from this Mac: packs + signs + notarizes the macOS app,
// collects the Windows installer that CI built for the same commit, and uploads
// both to a DRAFT release on the public repo. Publishing stays a manual click.
// See docs/specs/2026-10-11-desktop-signed-releases-design.md and electron/README.md.
//
//   npm run release:desktop              both platforms
//   npm run release:desktop -- --mac-only
//
// Everything that decides something is a pure function below, so it is tested
// without git, gh or the network (release-desktop.test.mjs).

/** The `xcrun notarytool store-credentials` profile name (electron/README.md). */
export const NOTARY_PROFILE = 'opennord-notary';

export function releaseTag(version) {
  return `desktop-v${version}`;
}

/** Every reason this machine/checkout cannot cut a release right now. Empty = go. */
export function preflightProblems(facts) {
  const tag = releaseTag(facts.version);
  const problems = [];
  if (facts.dirty) problems.push('The working tree has uncommitted changes — commit or stash them first.');
  if (facts.tagCommit === null) {
    problems.push(`Tag ${tag} does not exist — create it on the commit to release: git tag ${tag} && git push origin ${tag}`);
  } else if (facts.tagCommit !== facts.headCommit) {
    problems.push(`Tag ${tag} points at ${facts.tagCommit} but HEAD is ${facts.headCommit} — check out the tag, or bump the version and re-tag.`);
  }
  if (!facts.ghAuthed) problems.push('GitHub CLI is not signed in — run: gh auth login');
  if (!facts.hasDeveloperId) problems.push('No "Developer ID Application" certificate in the keychain.');
  if (!facts.hasNotarytool) problems.push('xcrun notarytool not found — select the full Xcode: sudo xcode-select -s /Applications/Xcode.app');
  if (!facts.hasNotaryProfile) problems.push(`No usable notarytool keychain profile "${NOTARY_PROFILE}" — see electron/README.md, "One-time setup".`);
  return problems;
}

/**
 * Choose the desktop-win.yml run whose artifact belongs to this commit.
 * pull_request runs are excluded even when their head matches: they check out
 * the synthetic merge commit, so the installer is not built from the tag.
 */
export function pickWindowsRun(runs, headCommit) {
  const mine = runs.filter((r) => r.headSha === headCommit && (r.event === 'push' || r.event === 'workflow_dispatch'));
  if (mine.length === 0) {
    return { ok: false, reason: 'There is no Windows build for this commit — push the release tag (or dispatch desktop-win.yml) and wait for it.' };
  }
  const success = mine.find((r) => r.status === 'completed' && r.conclusion === 'success');
  if (success) return { ok: true, id: success.databaseId };
  if (mine.some((r) => r.status !== 'completed')) {
    return { ok: false, reason: 'The Windows build for this commit is still running — re-run this command when it finishes.' };
  }
  return { ok: false, reason: 'The Windows build for this commit failed — fix it or re-run it before releasing.' };
}

/** What to do about a release that may already exist for this tag. */
export function releaseAction(existing) {
  if (existing === null) return 'create';
  if (existing.isDraft) return 'reuse';
  throw new Error('This version is already published — bump the version instead of replacing a release people may have installed.');
}

const MAC_ASSETS = [
  'OpenNord-mac.dmg', 'OpenNord-mac.dmg.blockmap',
  'OpenNord-mac.zip', 'OpenNord-mac.zip.blockmap', 'latest-mac.yml',
];
const WIN_ASSETS = ['OpenNord-win-x64.exe', 'OpenNord-win-x64.exe.blockmap', 'latest.yml'];

export function releaseAssets({ macOnly }) {
  return macOnly ? [...MAC_ASSETS] : [...MAC_ASSETS, ...WIN_ASSETS];
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run scripts/release-desktop.test.mjs`
Expected: all passed (18 tests).

- [ ] **Step 5: Gates and commit**

Run: `npm run typecheck && npm run lint && npm test`

```bash
git add scripts/release-desktop.mjs scripts/release-desktop.test.mjs
git commit -m "feat(electron): release preflight and artifact-selection rules"
```

---

### Task 5: The release command, notarization, and the Mac setup docs

**Files:**
- Modify: `scripts/release-desktop.mjs` (append `main()`), `package.json` (script), `electron/README.md`

**Interfaces:**
- Consumes: everything Task 4 exports; Task 3's output paths; `build.publish[0]` from Task 2.
- Produces: `npm run release:desktop [-- --mac-only] [-- --dry-run]`. `--dry-run` does everything except creating the release and uploading.

- [ ] **Step 1: One-time setup on this Mac (the user runs these; they need a password and an Apple login)**

```bash
sudo xcode-select -s /Applications/Xcode.app
```

```bash
xcrun notarytool store-credentials opennord-notary --apple-id <your Apple ID> --team-id C9WDY49JA9
```

The second prompts for an **app-specific password** (create one at account.apple.com → Sign-In and Security). Verify: `xcrun notarytool history --keychain-profile opennord-notary` lists (possibly zero) submissions without an error.

- [ ] **Step 2: Append `main()` to `scripts/release-desktop.mjs`**

Add these imports at the top of the file, under the header comment:

```js
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
```

Append at the bottom:

```js
const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(core, 'release', 'mac-universal', 'OpenNord.app');

/** Run a command, returning trimmed stdout; null when it exits non-zero. */
function tryRun(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: core, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Run a command with its output shown; a non-zero exit aborts the release. */
function run(cmd, args, env = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd: core, stdio: 'inherit', env: { ...process.env, ...env } });
}

function fatal(message) {
  console.error(`\nrelease:desktop — ${message}`);
  process.exit(1);
}

function main() {
  const flags = process.argv.slice(2);
  const macOnly = flags.includes('--mac-only');
  const dryRun = flags.includes('--dry-run');

  const pkg = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'));
  const { version } = pkg;
  const { owner, repo } = pkg.build.publish[0];
  const publicRepo = `${owner}/${repo}`;
  const tag = releaseTag(version);
  const headCommit = tryRun('git', ['rev-parse', 'HEAD']);

  // 1. Preflight — report everything that is wrong, not just the first thing.
  const problems = preflightProblems({
    version,
    dirty: tryRun('git', ['status', '--porcelain']) !== '',
    headCommit,
    tagCommit: tryRun('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}^{commit}`]),
    ghAuthed: tryRun('gh', ['auth', 'status']) !== null,
    hasDeveloperId: (tryRun('security', ['find-identity', '-v', '-p', 'codesigning']) ?? '').includes('Developer ID Application:'),
    hasNotarytool: tryRun('xcrun', ['--find', 'notarytool']) !== null,
    hasNotaryProfile: tryRun('xcrun', ['notarytool', 'history', '--keychain-profile', NOTARY_PROFILE]) !== null,
  });
  if (problems.length > 0) fatal(`not ready:\n${problems.map((p) => `  • ${p}`).join('\n')}`);

  // 2. Find the Windows build BEFORE the slow mac pack, so a missing one fails fast.
  let windowsRun = null;
  let ciRepo = null;
  if (!macOnly) {
    ciRepo = tryRun('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
    if (!ciRepo) fatal('could not determine which GitHub repository this checkout belongs to.');
    const runsJson = tryRun('gh', [
      'run', 'list', '--repo', ciRepo, '--workflow', 'desktop-win.yml', '--commit', headCommit,
      '--json', 'databaseId,headSha,event,status,conclusion',
    ]);
    if (runsJson === null) fatal('could not list the Windows CI runs (gh run list failed).');
    windowsRun = pickWindowsRun(JSON.parse(runsJson), headCommit);
    if (!windowsRun.ok) fatal(`${windowsRun.reason}\n  (Use --mac-only to release macOS alone.)`);
  }

  // 3. Refuse early if this version is already out.
  const existingJson = tryRun('gh', ['release', 'view', tag, '--repo', publicRepo, '--json', 'isDraft']);
  let action;
  try {
    action = releaseAction(existingJson === null ? null : JSON.parse(existingJson));
  } catch (error) {
    fatal(error.message);
  }

  // 4. Pack macOS. APPLE_KEYCHAIN_PROFILE is what makes electron-builder notarize.
  run('npm', ['run', 'electron:pack'], { APPLE_KEYCHAIN_PROFILE: NOTARY_PROFILE });

  // 5. Verify. stapler is the check that notarization really happened:
  //    electron-builder only warns when it skips it.
  run('codesign', ['--verify', '--deep', '--strict', APP]);
  run('xcrun', ['stapler', 'validate', APP]);
  run('spctl', ['--assess', '--type', 'execute', '--verbose', APP]);

  // 6. Gather every asset into one directory.
  const staging = mkdtempSync(join(tmpdir(), 'opennord-release-'));
  if (!macOnly) {
    run('gh', ['run', 'download', String(windowsRun.id), '--repo', ciRepo, '--name', `OpenNord-win-x64-${headCommit}`, '--dir', staging]);
  }
  const names = releaseAssets({ macOnly });
  for (const name of names) {
    const built = join(core, 'release', name);
    if (existsSync(built)) copyFileSync(built, join(staging, name));
    if (!existsSync(join(staging, name))) fatal(`expected release asset is missing: ${name}`);
  }
  const files = names.map((name) => join(staging, name));

  if (dryRun) {
    console.log(`\nDry run — ${names.length} assets ready in ${staging}; nothing uploaded.`);
    return;
  }

  // 7. Draft release on the public repo. Publishing is a manual click.
  if (action === 'create') {
    run('gh', ['release', 'create', tag, '--repo', publicRepo, '--draft', '--title', `OpenNord ${version}`, '--notes', '']);
  }
  run('gh', ['release', 'upload', tag, ...files, '--repo', publicRepo, '--clobber']);
  console.log(`\nDraft ready: https://github.com/${publicRepo}/releases — check that the public mirror has caught up, then publish it.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 3: Add the script to `package.json`**

```json
"release:desktop": "node scripts/release-desktop.mjs",
```

- [ ] **Step 4: Confirm the unit tests still pass (the import guard must keep `main()` from running under vitest)**

Run: `npx vitest run scripts/release-desktop.test.mjs`
Expected: all passed, no pack started.

- [ ] **Step 5: Exercise preflight for real**

Run (no tag exists yet): `npm run release:desktop -- --mac-only --dry-run`
Expected: exits 1 with `not ready:` and a bullet naming `desktop-v0.1.0`. If the tree is dirty it lists that too.

- [ ] **Step 6: Exercise the notarized pack with a throwaway local tag**

```bash
git tag desktop-v0.1.0
npm run release:desktop -- --mac-only --dry-run
git tag -d desktop-v0.1.0
```

Expected: the pack runs, electron-builder logs a notarization (several minutes), `stapler validate` prints `The validate action worked!`, `spctl` prints `accepted` / `source=Notarized Developer ID`, and the command ends with `Dry run — 5 assets ready in …`. The tag is local only and is deleted afterwards — it is never pushed in this task.

If `stapler validate` fails with "does not have a ticket stapled": notarization was skipped. Add `"notarize": { "teamId": "C9WDY49JA9" }` to `build.mac` and repeat this step.

- [ ] **Step 7: Rewrite the Packing section of `electron/README.md`**

Replace everything from the `## Packing` heading up to (not including) `## Never run electron-rebuild` with:

````markdown
## Packing

```bash
npm run electron:pack       # macOS  → release/OpenNord-mac.dmg + .zip (universal, signed)
npm run electron:pack:win   # Windows x64 → release/OpenNord-win-x64.exe (NSIS, unsigned)
```

Both bracket electron-builder with `scripts/usb-native-guard.mjs`: `clean` empties
`node_modules/usb/build` and `release/` beforehand, `verify` then asserts the
packed app carries the target's `prebuilds/` binary and no `build/`. (`clean`
wipes `release/`, so packing one target discards the other's output.)

Both pass `--publish never`. The `publish` entry in `package.json` exists so
electron-builder writes the `latest*.yml` update feeds; it must never upload by
itself — on a tag build in CI it would try to.

The macOS pack signs with the Developer ID certificate in the keychain. It is
notarized only when `APPLE_KEYCHAIN_PROFILE` is set, which the release command
does; a plain `electron:pack` gives a signed, un-notarized app that is fine for
local testing.

**Windows packs run in CI, on Windows.** `.github/workflows/desktop-win.yml` in
the private monorepo packs on `windows-latest` from a clean `npm ci` tree — on a
`desktop-v*` tag, on manual dispatch, and on PRs touching a pack input. A local
Mac pack cannot produce the installer: electron-builder shells out to **wine** to
stamp the .exe, and its bundled wine aborts on current macOS. The workflow is not
mirrored to the public repo because the mirror's push token would need
`Workflows: write`.

**Pin the Windows arch.** `electron-builder --win` defaults to the *host* arch;
`electron:pack:win` passes `--x64` explicitly.

## Releasing

Versions come from `package.json` `version`; a release is the tag
`desktop-v<version>`. Asset names carry no version, so the site links to
`releases/latest/download/<name>`.

1. Bump: `npm version <x.y.z> --no-git-tag-version`, commit, merge to `main`.
2. Tag that commit and push the tag: `git tag desktop-v<x.y.z> && git push origin desktop-v<x.y.z>`.
   The tag push starts the Windows build.
3. When it is green, on the release Mac, with the tag checked out:
   ```bash
   npm run release:desktop
   ```
   It checks the machine, packs + signs + notarizes macOS, verifies the result,
   downloads the Windows installer CI built for the same commit, and uploads
   everything to a **draft** release on `simonflore/opennord`.
4. Install both builds on clean machines and connect a Nord.
5. Confirm the public mirror has the released commit, then publish the draft.

`-- --mac-only` releases macOS alone; `-- --dry-run` stops before uploading. A
published version is never replaced — bump instead.

### One-time setup of the release Mac

- `sudo xcode-select -s /Applications/Xcode.app` (notarization needs full Xcode).
- A **Developer ID Application** certificate in the login keychain (Xcode →
  Settings → Accounts → Manage Certificates).
- `xcrun notarytool store-credentials opennord-notary --apple-id <id> --team-id <team>`
  with an app-specific password.
- `gh auth login` with access to both repositories.
````

Also delete the README's now-obsolete setup steps 1 and 3–4 wording only where it contradicts the scripts (leave the architecture, "Never run electron-rebuild", and Notes sections untouched).

- [ ] **Step 8: Gates and commit**

Run: `npm run typecheck && npm run lint && npm test`

```bash
git add scripts/release-desktop.mjs package.json electron/README.md
git commit -m "feat(electron): release:desktop — notarized mac pack plus CI Windows installer to a draft release"
```

---

### Task 6: Windows CI builds the installer, and on the release tag

**Files:**
- Modify: `.github/workflows/desktop-win.yml` (repo root)

**Interfaces:**
- Consumes: `electron:pack:win` from Task 2.
- Produces: artifact `OpenNord-win-x64-<sha>` containing `OpenNord-win-x64.exe`, `OpenNord-win-x64.exe.blockmap`, `latest.yml` at its top level — the names Task 5 downloads by.

- [ ] **Step 1: Add the tag trigger**

In the `on:` block, between `workflow_dispatch:` and `pull_request:`:

```yaml
  # A desktop release tag builds the Windows half of that release. The Mac that
  # cuts the release (packages/core/scripts/release-desktop.mjs) downloads this
  # run's artifact by commit; the job itself still publishes nothing.
  push:
    tags:
      - 'desktop-v*'
```

- [ ] **Step 2: Fix the header comment and the pack-step comment**

Change "The Windows zip can only be built on Windows" to "The Windows installer can only be built on Windows", and in the comment above `npm run electron:pack:win` replace "the zip" wording with "the installer". Leave the MONOREPO-ONLY paragraph as is.

- [ ] **Step 3: Replace the upload step**

```yaml
      # The installer's name carries no version (the site links to
      # releases/latest/download/OpenNord-win-x64.exe), so the commit goes in the
      # artifact name. On a pull_request event `github.sha` is the synthetic merge
      # commit, so prefer the PR head; a tag push or dispatch uses github.sha,
      # which is the commit the release command looks the run up by.
      - uses: actions/upload-artifact@v4
        with:
          name: OpenNord-win-x64-${{ github.event.pull_request.head.sha || github.sha }}
          path: |
            packages/core/release/OpenNord-win-x64.exe
            packages/core/release/OpenNord-win-x64.exe.blockmap
            packages/core/release/latest.yml
          if-no-files-found: error
```

- [ ] **Step 4: Validate the YAML**

Run (repo root): `node -e "const y=require('./packages/core/node_modules/yaml');y.parse(require('fs').readFileSync('.github/workflows/desktop-win.yml','utf8'));console.log('ok')"`
Expected: `ok`. (If the `yaml` package is not installed, use `ruby -ryaml -e "YAML.load_file('.github/workflows/desktop-win.yml'); puts 'ok'"`.)

- [ ] **Step 5: Commit, push the branch, open a PR**

```bash
git add .github/workflows/desktop-win.yml
git commit -m "ci(electron): build the NSIS installer, and on desktop-v* tags"
```

The PR touches `packages/core/package.json` and this workflow, so `desktop-win.yml` runs on it. Expected in that run: the pack step succeeds, the guard prints `prebuilds/win32-x64, no build/ — OK`, and the artifact holds the three files. If `latest.yml` or the `.blockmap` is missing, read the electron-builder log in the run and fix the config before merging — do not loosen `if-no-files-found`.

---

### Task 7 (HELD): point the website at the latest release

**Do not start this task until a `desktop-v0.1.0` release has been published on `simonflore/opennord`.** Before that, these links 404 on the live site. It ships as its own PR.

**Files:**
- Modify: `src/components/home/DesktopApp.tsx`, `src/components/home/icons.tsx`

- [ ] **Step 1: Add a Mac icon to `icons.tsx`**

```tsx
export function IconMac() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
```

- [ ] **Step 2: Replace the constants and their comment in `DesktopApp.tsx`**

```tsx
// Asset names carry no version, so these always resolve to the newest published
// desktop release (electron/README.md, "Releasing").
const RELEASE_BASE = 'https://github.com/simonflore/opennord/releases';
const DOWNLOAD_WIN = `${RELEASE_BASE}/latest/download/OpenNord-win-x64.exe`;
const DOWNLOAD_MAC = `${RELEASE_BASE}/latest/download/OpenNord-mac.dmg`;
const RELEASE_PAGE = `${RELEASE_BASE}/latest`;
```

Update the import to `import { IconMac, IconWindows } from './icons';`, rewrite the doc comment above to say both platforms are offered and how they are verified, change the paragraph copy from "A native Windows build —" to "A native app for Windows and macOS —", and add after the Windows `<a>`:

```tsx
            <a className={heroBtn} href={DOWNLOAD_MAC} rel="noopener noreferrer">
              <span className="inline-flex items-center" aria-hidden="true"><IconMac /></span>
              macOS
              <span className={archLabel}>Universal</span>
            </a>
```

- [ ] **Step 3: Check the links resolve**

Run: `curl -sIL -o /dev/null -w '%{http_code}\n' https://github.com/simonflore/opennord/releases/latest/download/OpenNord-mac.dmg` and the same for `OpenNord-win-x64.exe`.
Expected: `200` for both.

- [ ] **Step 4: Look at it**

Run the dev server, open `/#download` at desktop and phone width; both buttons render in the existing style and wrap cleanly.

- [ ] **Step 5: Gates and commit**

Run: `npm run typecheck && npm run lint && npm test`

```bash
git add src/components/home/DesktopApp.tsx src/components/home/icons.tsx
git commit -m "feat(home): download buttons follow the latest desktop release; add macOS"
```

---

## After Task 6: cutting 0.1.0 (the user's call, not part of the plan's automation)

Merge the PR, tag `desktop-v0.1.0` on `main`, push the tag, wait for the Windows run, then `npm run release:desktop`. Publishing the draft, and the decision to hold any announcement until spec 2 (auto-update) ships, stay with the user.
