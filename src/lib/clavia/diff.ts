/**
 * Model-agnostic byte diff for the family-wide differential-RE workflow:
 * read a program, change ONE control, re-read, and these helpers light up
 * exactly the bytes that moved. Lives in clavia/ because every model needs it.
 */

/** Byte indices where two buffers differ (length mismatch counts as a diff). */
export function diffBytes(a: Uint8Array, b: Uint8Array): number[] {
  const len = Math.max(a.length, b.length);
  const diff: number[] = [];
  for (let i = 0; i < len; i++) {
    if ((a[i] ?? -1) !== (b[i] ?? -1)) diff.push(i);
  }
  return diff;
}

/** Collapse a list of byte indices into contiguous [start,end] ranges. */
export function groupRanges(indices: number[]): Array<{ start: number; end: number }> {
  if (indices.length === 0) return [];
  const sorted = [...indices].sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number }> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const v = sorted[i];
    if (v === prev + 1) { prev = v; continue; }
    ranges.push({ start, end: prev });
    start = v; prev = v;
  }
  ranges.push({ start, end: prev });
  return ranges;
}
