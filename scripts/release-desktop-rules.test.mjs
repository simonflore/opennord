import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  RELEASE_NOTES, desktopPageEnv, feedMinimumSystemVersion, parseFlags, pickWindowsRun, preflightProblems, releaseAction, releaseAssets,
  releaseCreateArgs, releaseTag, withMinimumSystemVersion,
} from './release-desktop-rules.mjs';

// The real config: asset names are derived from it, so this is also the check
// that what the release command uploads is what electron-builder writes.
const { build } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

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

  it('needs Rosetta to build the Windows installer on an Apple Silicon Mac', () => {
    // electron-builder's installer compiler for macOS is an Intel binary.
    const [problem] = preflightProblems({ ...ready, winLocal: true, canRunIntel: false });
    expect(problem).toMatch(/Rosetta/);
    expect(problem).toContain('softwareupdate --install-rosetta');
    expect(preflightProblems({ ...ready, winLocal: true, canRunIntel: true })).toEqual([]);
    expect(preflightProblems({ ...ready, winLocal: false, canRunIntel: false })).toEqual([]);
  });

  it('refuses to release from a checkout without the web app: the page a release packs is built from it', () => {
    const [problem] = preflightProblems({ ...ready, hasWebApp: false });
    expect(problem).toMatch(/apps\/web/);
    // …and says what does work from here.
    expect(problem).toContain('npm run electron:pack');
    expect(preflightProblems({ ...ready, hasWebApp: true })).toEqual([]);
  });

  it('says so up front when pnpm, which builds the release page, is missing', () => {
    const [problem] = preflightProblems({ ...ready, hasPnpm: false });
    expect(problem).toMatch(/pnpm not found/);
    expect(preflightProblems({ ...ready, hasPnpm: true })).toEqual([]);
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

describe('the mac update feed minimum', () => {
  it('turns the app\'s macOS minimum into the Darwin version electron-updater compares', () => {
    expect(feedMinimumSystemVersion('12.0')).toBe('21.0.0');
    expect(feedMinimumSystemVersion('26')).toBe('25.0.0');
    expect(() => feedMinimumSystemVersion('10.15')).toThrow(/No Darwin version/);
  });
  it('is set for the real config (Electron 44 needs macOS 13)', () => {
    expect(build.mac.minimumSystemVersion).toBe('13.0');
    expect(feedMinimumSystemVersion(build.mac.minimumSystemVersion)).toBe('22.0.0');
  });
  it('adds the field to latest-mac.yml, or replaces it', () => {
    const yml = "version: 0.2.0\nfiles:\n  - url: OpenNord-mac.zip\nreleaseDate: '2026-10-12'\n";
    expect(withMinimumSystemVersion(yml, '21.0.0')).toBe(`${yml}minimumSystemVersion: '21.0.0'\n`);
    expect(withMinimumSystemVersion(`${yml}minimumSystemVersion: '20.0.0'\n`, '21.0.0'))
      .toBe(`${yml}minimumSystemVersion: '21.0.0'\n`);
  });
});

describe('releaseAssets', () => {
  it('splits the release into what this Mac packs and what Windows CI built', () => {
    expect(releaseAssets(build, { macOnly: false })).toEqual({
      mac: ['OpenNord-mac.dmg', 'OpenNord-mac.dmg.blockmap', 'OpenNord-mac.zip', 'OpenNord-mac.zip.blockmap', 'latest-mac.yml'],
      win: ['OpenNord-win-x64.exe', 'OpenNord-win-x64.exe.blockmap', 'latest.yml'],
    });
  });
  it('has no Windows files in mac-only mode', () => {
    expect(releaseAssets(build, { macOnly: true }).win).toEqual([]);
  });
  it('follows a rename in the build config instead of restating the names', () => {
    const renamed = { mac: { target: ['dmg'], artifactName: 'Nord-${ext}' }, nsis: { artifactName: 'Nord-setup.${ext}' } };
    expect(releaseAssets(renamed, { macOnly: false })).toEqual({
      mac: ['Nord-dmg', 'Nord-dmg.blockmap', 'latest-mac.yml'],
      win: ['Nord-setup.exe', 'Nord-setup.exe.blockmap', 'latest.yml'],
    });
  });
});

describe('parseFlags', () => {
  it('defaults to a full release', () => {
    expect(parseFlags([])).toEqual({ macOnly: false, dryRun: false, winLocal: false });
  });
  it('allows a mac-only dry run', () => {
    expect(parseFlags(['--mac-only', '--dry-run'])).toEqual({ macOnly: true, dryRun: true, winLocal: false });
  });
  it('refuses a real mac-only release: it would become "latest" with no Windows files', () => {
    expect(() => parseFlags(['--mac-only'])).toThrow(/Windows/);
  });
  it('can build the Windows installer on this machine instead of taking it from CI', () => {
    expect(parseFlags(['--win-local'])).toEqual({ macOnly: false, dryRun: false, winLocal: true });
    expect(parseFlags(['--win-local', '--dry-run']).winLocal).toBe(true);
  });
  it('refuses --win-local together with --mac-only: they ask for opposite things', () => {
    expect(() => parseFlags(['--win-local', '--mac-only', '--dry-run'])).toThrow(/--win-local.*--mac-only|--mac-only.*--win-local/);
  });
  it('refuses a flag it does not know instead of ignoring it', () => {
    expect(() => parseFlags(['--dryrun'])).toThrow(/--dryrun/);
  });
});

describe('desktopPageEnv', () => {
  it('hands both packs the built page and the address it must carry', () => {
    expect(desktopPageEnv({ pageDir: '/repo/apps/web/dist-desktop', config: { apiUrl: 'https://api.opennord.test', siteUrl: 'https://opennord.test' } }))
      .toEqual({ OPENNORD_DESKTOP_PAGE: '/repo/apps/web/dist-desktop', OPENNORD_DESKTOP_API_URL: 'https://api.opennord.test' });
  });

  it('refuses a config with no server address rather than packing the open app by accident', () => {
    expect(() => desktopPageEnv({ pageDir: '/x', config: {} })).toThrow(/apiUrl/);
  });
});

describe('releaseCreateArgs', () => {
  it('creates a draft whose tag will be cut from the mirrored release commit', () => {
    const args = releaseCreateArgs({ tag: 'desktop-v0.1.0', version: '0.1.0', publicRepo: 'o/r', target: 'abc123' });
    expect(args.slice(0, 3)).toEqual(['release', 'create', 'desktop-v0.1.0']);
    expect(args).toContain('--draft');
    expect(args[args.indexOf('--target') + 1]).toBe('abc123');
    expect(args[args.indexOf('--repo') + 1]).toBe('o/r');
  });

  it('starts the draft with what the installers contain beyond this repository', () => {
    const args = releaseCreateArgs({ tag: 'desktop-v0.1.0', version: '0.1.0', publicRepo: 'o/r', target: 'abc123' });
    const notes = args[args.indexOf('--notes') + 1];
    expect(notes).toBe(RELEASE_NOTES);
    // Said plainly: the community client is in the installers, is not AGPL
    // source, is off until turned on, and a build from the repository has none of it.
    expect(notes).toMatch(/community client/i);
    expect(notes).toMatch(/not part of the AGPL source/i);
    expect(notes).toMatch(/off until you turn it on/i);
    expect(notes).toMatch(/building from this repository gives the app without it/i);
  });
});
