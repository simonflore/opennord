// Cuts a desktop release from this Mac: packs + signs + notarizes the macOS app,
// collects the Windows installer that CI built for the same commit, and uploads
// both to a DRAFT release on the public repo. Publishing stays a manual click.
// See docs/specs/2026-10-11-desktop-signed-releases-design.md and electron/README.md.
//
//   npm run release:desktop                          both platforms
//   npm run release:desktop -- --dry-run             everything except the upload
//   npm run release:desktop -- --dry-run --mac-only  rehearse the mac half alone
//
// Everything that decides something is a pure function below, so it is tested
// without git, gh or the network (release-desktop.test.mjs).

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  if (!facts.hasNotarytool) problems.push('xcrun notarytool not found — install Xcode or the Command Line Tools: xcode-select --install');
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

/**
 * Command-line flags. Unknown flags are refused rather than ignored, and
 * --mac-only is rehearsal-only: a PUBLISHED release without the Windows files
 * becomes "latest", so releases/latest/download/OpenNord-win-x64.exe and the
 * Windows update feed would both 404. Every release tag gets a Windows build
 * from CI anyway.
 */
export function parseFlags(argv) {
  const known = ['--mac-only', '--dry-run'];
  const unknown = argv.filter((flag) => !known.includes(flag));
  if (unknown.length > 0) throw new Error(`Unknown option ${unknown.join(', ')} — expected ${known.join(' or ')}.`);
  const macOnly = argv.includes('--mac-only');
  const dryRun = argv.includes('--dry-run');
  if (macOnly && !dryRun) {
    throw new Error('--mac-only only works with --dry-run: a release without the Windows files would break the Windows download link and update feed.');
  }
  return { macOnly, dryRun };
}

/**
 * `gh` arguments that create the draft. `target` is the commit on the PUBLIC
 * repo the tag is cut from when the draft is published; without it GitHub uses
 * whatever the mirror's default branch is at that moment, which may be later
 * than the commit these binaries were built from.
 */
export function releaseCreateArgs({ tag, version, publicRepo, target }) {
  return ['release', 'create', tag, '--repo', publicRepo, '--draft', '--target', target, '--title', `OpenNord ${version}`, '--notes', ''];
}

/**
 * True when this module is the script node was started with. import.meta.url
 * is percent-encoded and symlink-resolved, so argv[1] has to be made the same
 * before comparing — a checkout path with a space would otherwise never match
 * and the command would exit 0 having done nothing.
 */
export function isMainModule(metaUrl, entry) {
  if (!entry) return false;
  try {
    return metaUrl === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
}

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

  // 7. Gather every asset into one directory.
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

if (isMainModule(import.meta.url, process.argv[1])) main();
