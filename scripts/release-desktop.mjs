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
