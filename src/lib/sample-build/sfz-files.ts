/** Finding each recording an SFZ instrument names among the files the player picked. Pure. */

/** Normalise a path for matching: `/` separators, `.` and `..` resolved, no case. */
export function normalisePath(path: string): string {
  const out: string[] = [];
  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/').toLowerCase(); // SFZ libraries are often made on Windows, where case doesn't matter
}

/** The folder a file sits in, from its path (`a/b/x.sfz` → `a/b`). */
export const folderOf = (path: string): string => path.replace(/\\/g, '/').replace(/\/?[^/]*$/, '');

/**
 * A finder for the files an SFZ names, among `paths` (the picked files' paths, as a folder
 * pick gives them), indexed once so a library of thousands resolves quickly. A name is taken
 * relative to the SFZ's folder; failing that, a file of the same name that is the only one
 * with it (an instrument moved out of its original layout).
 */
export function sampleResolver(paths: readonly string[]): (sfzPath: string, sample: string) => string | undefined {
  const byPath = new Map<string, string>();
  const byName = new Map<string, string | null>(); // null: more than one file has the name
  for (const p of paths) {
    const key = normalisePath(p);
    byPath.set(key, p);
    const name = key.slice(key.lastIndexOf('/') + 1);
    byName.set(name, byName.has(name) ? null : p);
  }
  return (sfzPath, sample) => {
    const wanted = normalisePath(`${folderOf(sfzPath)}/${sample}`);
    return byPath.get(wanted) ?? byName.get(wanted.slice(wanted.lastIndexOf('/') + 1)) ?? undefined;
  };
}
