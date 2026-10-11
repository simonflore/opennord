import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCbinHeader } from '../clavia/cbin';

/**
 * Ground-truth Nord sample files — the `.nsmp/.nsmp3/.nsmp4/.wav` under
 * `research/nsmp/` and the `nsmp conversion demo files/` folder — are
 * **git-ignored** (see `.gitignore`): they're copyrighted Nord content we never
 * commit (`docs/LEGAL.md`). The codec tests that validate byte-exactness against
 * them therefore can't run in CI or a fresh clone.
 *
 * `hasGt(...)` lets those suites `describe.skipIf(!hasGt(...))` so they skip
 * cleanly when the files are absent (CI) instead of failing with ENOENT, while
 * still running for anyone who has the files locally. Paths are repo-root
 * relative; root is three levels up from `src/lib/ns4`.
 */
const REPO_ROOT = resolve(__dirname, '../../..');

export function hasGt(...relPaths: string[]): boolean {
  return relPaths.every((p) => existsSync(resolve(REPO_ROOT, p)));
}

/** A minimal Stage 4 preset for tests: a real CBIN header of `tag` over a zeroed
 *  body of `size` bytes (the true fixed sizes: ns4o 183, ns4n 195, ns4y 541).
 *  Enough to exercise the decode wiring without shipping factory content — value
 *  correctness is checked against the git-ignored factory presets instead. */
export function blankPreset(tag: string, size: number): Uint8Array {
  const buf = new Uint8Array(size);
  buf.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 205 }), 0);
  return buf;
}
