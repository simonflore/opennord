import type { Capture, ContributionEntry } from './types';
import { diffBytes, groupRanges } from '../clavia/diff';
import { bytesToBase64 } from '../device/base64';

/** A baseline + a growing list of labeled single-control diffs (Approach A). */
export class ContributionSession {
  baseline: Capture | null = null;
  entries: ContributionEntry[] = [];

  setBaseline(c: Capture): void {
    this.baseline = c;
  }

  addEntry(after: Capture, label: string, valueNote: string, vocabId?: string): ContributionEntry {
    if (!this.baseline) throw new Error('Set a baseline before adding a change.');
    const ranges = groupRanges(diffBytes(this.baseline.body, after.body));
    const entry: ContributionEntry = {
      label,
      vocabId,
      valueNote,
      ranges,
      multiRegion: ranges.length > 1,
      afterB64: bytesToBase64(after.body),
    };
    this.entries.push(entry);
    return entry;
  }
}
