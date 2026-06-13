/**
 * Deriving a program name from its filename.
 *
 * The Nord program format stores **no name field in the binary** — the name
 * lives only in the filename (verified for Stage 4; documented for Stage 2/3).
 * This mirrors ns3-program-viewer's `getName()`: strip the path and extension,
 * drop a Nord User Forum upload prefix (a 13-digit timestamp + "-"), and fall
 * back to a placeholder when nothing usable remains.
 *
 * Unlike the Stage 2/3 viewer we do NOT cap to 16 chars or rewrite characters:
 * the Stage 4 on-instrument name limit isn't confirmed, so we keep the user's
 * filename intact and only clean off path/extension/forum noise.
 */

/** Nord User Forum uploads prefix names with a 13-digit epoch + "-". */
const FORUM_PREFIX = /^\d{13}-/;

/**
 * Turn a filename (or zip entry path) into a display name.
 * `"Bank 1/1623840000000-BreakFree Solo.ns4p"` → `"BreakFree Solo"`.
 */
export function programNameFromFilename(filename: string | undefined): string {
  if (!filename) return 'Unnamed';

  // Drop any directory portion, then the (possibly multi-) extension.
  let name = filename.replace(/^.*[\\/]/, '').replace(/(\.\w+)+$/, '');

  // Drop a Nord User Forum upload timestamp prefix, if present.
  if (FORUM_PREFIX.test(name)) name = name.slice(14);

  name = name.trim();
  return name.length > 0 ? name : 'Unnamed';
}
