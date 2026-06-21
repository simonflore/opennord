import type { Capture, ContributionEntry } from './types';
import { diffBytes, groupRanges } from '../clavia/diff';
import { bytesToBase64 } from '../device/base64';

type Range = { start: number; end: number };

/**
 * A baseline + a growing list of labeled single-control diffs.
 *
 * Each change is diffed against the PREVIOUS capture (a rolling cursor), not the
 * fixed original baseline. This matches how musicians actually work — they keep
 * editing one control at a time without reverting — so consecutive captures give
 * clean single-parameter deltas instead of accumulating every prior change.
 * `baseline` stays the original (it's what the exported bundle records, so an
 * offline pass can always re-diff the full bodies however it likes).
 */
export class ContributionSession {
  baseline: Capture | null = null;
  entries: ContributionEntry[] = [];
  /** The capture the next change is diffed against — advances to each saved `after`. */
  private cursor: Capture | null = null;

  setBaseline(c: Capture): void {
    this.baseline = c;
    this.cursor = c;
  }

  /** Ranges a candidate `after` would record (vs the last capture). Does not mutate. */
  pendingRanges(after: Capture): Range[] {
    if (!this.cursor) throw new Error('Set a baseline before capturing a change.');
    return groupRanges(diffBytes(this.cursor.body, after.body));
  }

  addEntry(after: Capture, label: string, valueNote: string, vocabId?: string): ContributionEntry {
    const ranges = this.pendingRanges(after);
    const entry: ContributionEntry = {
      label,
      vocabId,
      valueNote,
      ranges,
      multiRegion: ranges.length > 1,
      afterB64: bytesToBase64(after.body),
    };
    this.entries.push(entry);
    this.cursor = after; // advance: the next change diffs from here
    return entry;
  }
}
