import { execFileSync } from 'node:child_process';

/**
 * Which build this is, baked in at build time as `__BUILD__` so a player can say
 * "beta 412" when they report a problem. The number is the commit count of the
 * checkout, so every commit on main gets the next one; the short commit hash
 * pins it exactly.
 *
 * Both come from git when it's there. A shallow clone has no real count, so the
 * number is left out rather than shown wrong, and the hash still identifies the
 * build. CI and Docker builds without git can pass them in: OPENNORD_BUILD for
 * the number, OPENNORD_COMMIT / SOURCE_COMMIT (Coolify) / GITHUB_SHA for the hash.
 */
export interface BuildInfo {
  /** Commit count, or null when it can't be known (shallow clone, no git). */
  build: number | null;
  /** Short commit hash, or null outside a git checkout. */
  commit: string | null;
}

function git(...args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function buildInfo(env: NodeJS.ProcessEnv = process.env): BuildInfo {
  const sha = env.OPENNORD_COMMIT || env.SOURCE_COMMIT || env.GITHUB_SHA || git('rev-parse', 'HEAD');
  const fromEnv = Number(env.OPENNORD_BUILD);
  const count = Number.isInteger(fromEnv) && fromEnv > 0
    ? fromEnv
    : git('rev-parse', '--is-shallow-repository') === 'false' ? Number(git('rev-list', '--count', 'HEAD')) : NaN;
  return {
    build: Number.isInteger(count) && count > 0 ? count : null,
    commit: sha ? sha.slice(0, 7) : null,
  };
}
