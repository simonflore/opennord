export type WriteBackMode = 'ask' | 'new' | 'overwrite';
export type WriteResult = { target: 'folder'; path: string } | { target: 'download' };

/** Pick the final filename: overwrite keeps it; new appends " (n)" before the ext until free. */
export function resolveWriteName(name: string, mode: 'new' | 'overwrite', existing: Set<string>): string {
  if (mode === 'overwrite' || !existing.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? '' : name.slice(dot);
  let n = 2;
  while (existing.has(`${stem} (${n})${ext}`)) n++;
  return `${stem} (${n})${ext}`;
}
