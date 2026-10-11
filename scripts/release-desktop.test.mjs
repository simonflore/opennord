import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  isMainModule, parseFlags, pickWindowsRun, preflightProblems, releaseAction, releaseAssets,
  releaseCreateArgs, releaseTag,
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

describe('parseFlags', () => {
  it('defaults to a full release', () => {
    expect(parseFlags([])).toEqual({ macOnly: false, dryRun: false });
  });
  it('allows a mac-only dry run', () => {
    expect(parseFlags(['--mac-only', '--dry-run'])).toEqual({ macOnly: true, dryRun: true });
  });
  it('refuses a real mac-only release: it would become "latest" with no Windows files', () => {
    expect(() => parseFlags(['--mac-only'])).toThrow(/Windows/);
  });
  it('refuses a flag it does not know instead of ignoring it', () => {
    expect(() => parseFlags(['--dryrun'])).toThrow(/--dryrun/);
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
});

describe('isMainModule', () => {
  // import.meta.url is always the real path, so the fixture's must be too (macOS tmp is a symlink).
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'release desktop ')));
  const real = join(dir, 'script.mjs');
  writeFileSync(real, '');
  const url = pathToFileURL(real).href;

  it('recognises the script when its path contains a space', () => {
    expect(isMainModule(url, real)).toBe(true);
  });
  it('recognises the script when it is reached through a symlink', () => {
    mkdirSync(join(dir, 'via'));
    const link = join(dir, 'via', 'link.mjs');
    symlinkSync(real, link);
    expect(isMainModule(url, link)).toBe(true);
  });
  it('is false when another file is the entry point (a test runner)', () => {
    expect(isMainModule(url, join(dir, 'other.mjs'))).toBe(false);
  });
  it('is false when there is no entry script', () => {
    expect(isMainModule(url, undefined)).toBe(false);
  });
});
