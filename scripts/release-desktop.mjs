// Cuts a desktop release from this Mac: packs + signs + notarizes the macOS app,
// collects the Windows installer that CI built for the same commit, and uploads
// both to a DRAFT release on the public repo. Publishing stays a manual click.
// See the maintainers’ notes and electron/README.md.
//
//   npm run release:desktop                          both platforms
//   npm run release:desktop -- --win-local           build the Windows installer here, not in CI
//   npm run release:desktop -- --dry-run             everything except the upload
//   npm run release:desktop -- --dry-run --mac-only  rehearse the mac half alone
//
// This file only runs things. Every decision is in release-desktop-rules.mjs,
// which is what the tests import — so this one can run unconditionally.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NOTARY_PROFILE, desktopPageEnv, feedMinimumSystemVersion, parseFlags, pickWindowsRun, preflightProblems, releaseAction,
  releaseAssets, releaseCreateArgs, releaseTag, withMinimumSystemVersion,
} from './release-desktop-rules.mjs';

const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(core, 'release', 'mac-universal', 'OpenNord.app');
// A release packs the page built from the web app (community browsing, off
// until turned on), not this package's own. That app lives beside this package
// in the monorepo; the public repository does not have it.
const monorepo = resolve(core, '..', '..');
const web = join(monorepo, 'apps', 'web');
const webConfig = join(web, 'desktop.config.json');

/** Run a command, returning trimmed stdout; null when it exits non-zero. */
function tryRun(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: core, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Run a command with its output shown; a non-zero exit aborts the release. */
function run(cmd, args, env = {}, cwd = core) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
}

function fatal(message) {
  console.error(`\nrelease:desktop — ${message}`);
  process.exit(1);
}

let flags;
try {
  flags = parseFlags(process.argv.slice(2));
} catch (error) {
  fatal(error.message);
}
const { macOnly, dryRun, winLocal } = flags;

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
  winLocal,
  canRunIntel: process.arch !== 'arm64' || tryRun('arch', ['-x86_64', '/usr/bin/true']) !== null,
  hasWebApp: existsSync(webConfig),
  hasPnpm: tryRun('pnpm', ['--version']) !== null,
});
if (problems.length > 0) fatal(`not ready:\n${problems.map((p) => `  • ${p}`).join('\n')}`);

// What the packs are told about the page (step 4a builds it). Worked out here,
// so a config without a server address stops the release before the slow steps.
let pageEnv;
try {
  pageEnv = desktopPageEnv({ pageDir: join(web, 'dist-desktop'), config: JSON.parse(readFileSync(webConfig, 'utf8')) });
} catch (error) {
  fatal(error.message);
}

// 2. Find the Windows build BEFORE the slow mac pack, so a missing one fails fast.
//    (With --win-local there is none to find: it is built here, in step 4b.)
let windowsRun = null;
let ciRepo = null;
if (!macOnly && !winLocal) {
  ciRepo = tryRun('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  if (!ciRepo) fatal('could not determine which GitHub repository this checkout belongs to.');
  const runsJson = tryRun('gh', [
    'run', 'list', '--repo', ciRepo, '--workflow', 'desktop-win.yml', '--commit', headCommit,
    '--json', 'databaseId,headSha,event,status,conclusion',
  ]);
  if (runsJson === null) fatal('could not list the Windows CI runs (gh run list failed).');
  windowsRun = pickWindowsRun(JSON.parse(runsJson), headCommit);
  if (!windowsRun.ok) fatal(`${windowsRun.reason}\n  (If Windows CI cannot run at all, --win-local builds the installer on this machine.)`);
}

// 3. Refuse early if this version is already out.
const existingJson = tryRun('gh', ['release', 'view', tag, '--repo', publicRepo, '--json', 'isDraft']);
let action;
try {
  action = releaseAction(existingJson === null ? null : JSON.parse(existingJson));
} catch (error) {
  fatal(error.message);
}

// 4. Find the commit the public tag must point at: this checkout's commit as
//    the public repo has it. The monorepo's scripts/mirror-core/mirror.sh
//    computes it (mirror-core.yml publishes the same), and its absence over
//    there means the mirror has not caught up.
let target = null;
if (!dryRun) {
  const top = tryRun('git', ['rev-parse', '--show-toplevel']);
  const mirror = top ? join(top, 'scripts', 'mirror-core', 'mirror.sh') : null;
  if (!mirror || !existsSync(mirror)) fatal('releases are cut from the monorepo: scripts/mirror-core/mirror.sh is missing.');
  console.log('\nWorking out the public commit for this release (about half a minute)…');
  const mirrorDir = mkdtempSync(join(tmpdir(), 'opennord-mirror-'));
  let failure = null;
  try {
    target = execFileSync(mirror, ['HEAD', mirrorDir], { cwd: core, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    failure = error;
  } finally {
    rmSync(mirrorDir, { recursive: true, force: true });
  }
  // mirror.sh says what went wrong on stderr (a missing tool, an unknown commit, …).
  if (failure) fatal(`could not compute the public mirror commit:\n${String(failure.stderr || failure.message).trim()}`);
  if (tryRun('gh', ['api', `repos/${publicRepo}/commits/${target}`, '-q', '.sha']) === null) {
    fatal(`the public repo ${publicRepo} does not have commit ${target} yet — wait for the mirror workflow to finish, then re-run.`);
  }
}

// 4a. Build the page both installers carry, from the web app in desktop mode.
//     A dry run does the same, so a rehearsal packs what a release would. The
//     pack checks the page before and after packing (scripts/desktop-page.mjs).
run('pnpm', ['--filter', '@opennord/web', 'build:desktop'], {}, monorepo);

// 4b. --win-local: pack the Windows installer here, and set its files aside —
//     the mac pack that follows empties release/ before it starts.
const assets = releaseAssets(pkg.build, { macOnly });
const scratch = mkdtempSync(join(tmpdir(), 'opennord-release-'));
process.on('exit', () => rmSync(scratch, { recursive: true, force: true }));
if (winLocal) {
  console.log('\nBuilding the Windows installer on this machine. It is packed from this commit and checked by the\npack guard, but unlike a CI build it is not made on Windows and has not run there.');
  run('npm', ['run', 'electron:pack:win'], pageEnv);
  for (const name of assets.win) copyFileSync(join(core, 'release', name), join(scratch, name));
}

// 5. Pack macOS. APPLE_KEYCHAIN_PROFILE is what makes electron-builder notarize.
run('npm', ['run', 'electron:pack'], { ...pageEnv, APPLE_KEYCHAIN_PROFILE: NOTARY_PROFILE });

// 6. Verify. stapler is the check that notarization really happened:
//    electron-builder only warns when it skips it.
run('codesign', ['--verify', '--deep', '--strict', APP]);
run('xcrun', ['stapler', 'validate', APP]);
run('spctl', ['--assess', '--type', 'execute', '--verbose', APP]);

// 6b. Tell the mac update feed the oldest macOS this build runs on, so an older
//     Mac's updater skips it instead of installing an app that won't open.
const macFeed = join(core, 'release', 'latest-mac.yml');
if (existsSync(macFeed)) {
  const minimum = feedMinimumSystemVersion(pkg.build.mac.minimumSystemVersion);
  writeFileSync(macFeed, withMinimumSystemVersion(readFileSync(macFeed, 'utf8'), minimum));
  console.log(`\nlatest-mac.yml: minimumSystemVersion ${minimum} (macOS ${pkg.build.mac.minimumSystemVersion})`);
}

// 7. Gather the files: the mac ones where the pack left them, the Windows ones
//    in the scratch folder — downloaded from CI now, or put there in step 4b.
{
  if (!macOnly && !winLocal) {
    run('gh', ['run', 'download', String(windowsRun.id), '--repo', ciRepo, '--name', `OpenNord-win-x64-${headCommit}`, '--dir', scratch]);
  }
  const files = [
    ...assets.mac.map((name) => join(core, 'release', name)),
    ...assets.win.map((name) => join(scratch, name)),
  ];
  const missing = files.filter((file) => !existsSync(file));
  if (missing.length > 0) fatal(`expected release files are missing:\n${missing.map((f) => `  • ${f}`).join('\n')}`);

  if (dryRun) {
    console.log(`\nDry run — ${files.length} files ready; nothing uploaded.`);
  } else {
    // 8. Draft release on the public repo. Publishing is a manual click.
    if (action === 'create') {
      run('gh', releaseCreateArgs({ tag, version, publicRepo, target }));
    } else {
      // A reused draft may predate a re-tag; keep its target on this build's commit.
      run('gh', ['release', 'edit', tag, '--repo', publicRepo, '--draft', '--target', target]);
    }
    run('gh', ['release', 'upload', tag, ...files, '--repo', publicRepo, '--clobber']);
    console.log(`\nDraft ready: https://github.com/${publicRepo}/releases — its tag will be cut from ${target}. Test the builds, then publish it.`);
  }
}
