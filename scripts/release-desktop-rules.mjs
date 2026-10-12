// The decisions behind `npm run release:desktop` (scripts/release-desktop.mjs),
// as pure functions: tested without git, gh or the network
// (release-desktop-rules.test.mjs).

/** The `xcrun notarytool store-credentials` profile name (electron/README.md). */
export const NOTARY_PROFILE = 'opennord-notary';

/**
 * macOS major → Darwin (kernel) major, which is what electron-updater compares
 * a feed's minimumSystemVersion against (os.release(), AppUpdater
 * checkIfUpdateSupported). macOS 11–15 are Darwin 20–24; macOS 26 is Darwin 25.
 */
const DARWIN_FOR_MACOS = { 11: 20, 12: 21, 13: 22, 14: 23, 15: 24, 26: 25 };

/**
 * The update feed's minimum OS, from the app's own minimum (build.mac.
 * minimumSystemVersion, e.g. "13.0", the oldest macOS the bundled Electron
 * runs on). electron-builder writes that into Info.plist only, not into
 * latest-mac.yml, so without this an older Mac would download an update it
 * can't open.
 */
export function feedMinimumSystemVersion(macMinimum) {
  const darwin = DARWIN_FOR_MACOS[parseInt(String(macMinimum), 10)];
  if (!darwin) throw new Error(`No Darwin version known for macOS ${macMinimum} — add it to DARWIN_FOR_MACOS.`);
  return `${darwin}.0.0`;
}

/** latest-mac.yml with its top-level minimumSystemVersion set (replaced if present). */
export function withMinimumSystemVersion(yml, minimum) {
  const line = `minimumSystemVersion: '${minimum}'`;
  if (/^minimumSystemVersion:.*$/m.test(yml)) return yml.replace(/^minimumSystemVersion:.*$/m, line);
  return `${yml.replace(/\n*$/, '')}\n${line}\n`;
}

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
  // electron-builder's installer compiler (makensis) for macOS is an Intel binary.
  if (facts.winLocal && facts.canRunIntel === false) {
    problems.push('Building the Windows installer on this Mac needs Rosetta — run: softwareupdate --install-rosetta --agree-to-license');
  }
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

/**
 * The files a release carries, split by where they come from: this Mac's pack
 * (`release/`) and the Windows CI artifact. Derived from the electron-builder
 * config, so a rename there cannot leave the release command looking for the
 * old names after a ten-minute notarized pack.
 */
export function releaseAssets(build, { macOnly }) {
  const withBlockmap = (name) => [name, `${name}.blockmap`];
  const mac = build.mac.target.flatMap((ext) => withBlockmap(build.mac.artifactName.replace('${ext}', ext)));
  const win = withBlockmap(build.nsis.artifactName.replace('${ext}', 'exe'));
  return { mac: [...mac, 'latest-mac.yml'], win: macOnly ? [] : [...win, 'latest.yml'] };
}

/**
 * Command-line flags. Unknown flags are refused rather than ignored, and
 * --mac-only is rehearsal-only: a PUBLISHED release without the Windows files
 * becomes "latest", so releases/latest/download/OpenNord-win-x64.exe and the
 * Windows update feed would both 404.
 *
 * --win-local builds the Windows installer on this machine instead of taking
 * the one CI built for the commit. The default stays CI, because that one is
 * packed on Windows from a clean install.
 */
export function parseFlags(argv) {
  const known = ['--mac-only', '--dry-run', '--win-local'];
  const unknown = argv.filter((flag) => !known.includes(flag));
  if (unknown.length > 0) throw new Error(`Unknown option ${unknown.join(', ')} — expected ${known.join(' or ')}.`);
  const macOnly = argv.includes('--mac-only');
  const dryRun = argv.includes('--dry-run');
  if (macOnly && !dryRun) {
    throw new Error('--mac-only only works with --dry-run: a release without the Windows files would break the Windows download link and update feed.');
  }
  const winLocal = argv.includes('--win-local');
  if (winLocal && macOnly) throw new Error('--win-local and --mac-only ask for opposite things: pick one.');
  return { macOnly, dryRun, winLocal };
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
