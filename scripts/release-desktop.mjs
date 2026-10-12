// Cuts a desktop release from this Mac: packs + signs + notarizes the macOS app,
// collects the Windows installer that CI built for the same commit, and uploads
// both to a DRAFT release on the public repo. Publishing stays a manual click.
// See docs/specs/2026-10-11-desktop-signed-releases-design.md and electron/README.md.
//
//   npm run release:desktop                          both platforms
//   npm run release:desktop -- --dry-run             everything except the upload
//   npm run release:desktop -- --dry-run --mac-only  rehearse the mac half alone
//
// This file only runs things. Every decision is in release-desktop-rules.mjs,
// which is what the tests import — so this one can run unconditionally.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NOTARY_PROFILE, feedMinimumSystemVersion, parseFlags, pickWindowsRun, preflightProblems, releaseAction,
  releaseAssets, releaseCreateArgs, releaseTag, withMinimumSystemVersion,
} from './release-desktop-rules.mjs';

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

let flags;
try {
  flags = parseFlags(process.argv.slice(2));
} catch (error) {
  fatal(error.message);
}
const { macOnly, dryRun } = flags;

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
  if (!windowsRun.ok) fatal(windowsRun.reason);
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
//    the mirror sees it. mirror-core.yml pushes `git subtree split` of this
//    package, which is deterministic, so the same split here names the same
//    commit — and its absence over there means the mirror has not caught up.
let target = null;
if (!dryRun) {
  const top = tryRun('git', ['rev-parse', '--show-toplevel']);
  const prefix = (tryRun('git', ['rev-parse', '--show-prefix']) ?? '').replace(/\/$/, '');
  console.log('\nWorking out the public commit for this release (about half a minute)…');
  target = top && prefix ? tryRun('git', ['-C', top, 'subtree', 'split', `--prefix=${prefix}`, 'HEAD']) : null;
  if (!target) fatal('could not compute the public mirror commit (git subtree split failed).');
  if (tryRun('gh', ['api', `repos/${publicRepo}/commits/${target}`, '-q', '.sha']) === null) {
    fatal(`the public repo ${publicRepo} does not have commit ${target} yet — wait for the mirror workflow to finish, then re-run.`);
  }
}

// 5. Pack macOS. APPLE_KEYCHAIN_PROFILE is what makes electron-builder notarize.
run('npm', ['run', 'electron:pack'], { APPLE_KEYCHAIN_PROFILE: NOTARY_PROFILE });

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
//    from CI into a scratch folder that is removed again.
const assets = releaseAssets(pkg.build, { macOnly });
const scratch = mkdtempSync(join(tmpdir(), 'opennord-release-'));
try {
  if (!macOnly) {
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
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
